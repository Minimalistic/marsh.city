// Practice run for the STAR presenter: logs every slide and zoom change with its
// time since the start, can record audio on this device, and builds a report to
// paste to Claude. Audio never leaves the browser; it's offered as a file to save.
// The report math is plain functions (no DOM) so node:test can check it.

// A relaxed speaking pace; the notes' word counts are turned into expected times with it.
export const WORDS_PER_MINUTE = 150
// A step is flagged when it runs this far off the pace, and by more than MIN_GAP seconds,
// so short steps don't get flagged over a second or two.
const SLOW_RATIO = 1.6
const FAST_RATIO = 0.6
const MIN_GAP_SECONDS = 4

export function wordCount(text) {
  return (text.match(/\S+/g) || []).length
}

export function expectedSeconds(words) {
  return Math.round((words / WORDS_PER_MINUTE) * 60)
}

export function clock(seconds) {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// entries: [{ at (ms since start), slide (1-based), step, steps, label, words }] in the
// order they happened; endAt: ms since start when the run ended.
export function buildRows(entries, endAt) {
  const seen = new Set()
  return entries.map((entry, i) => {
    const seconds = ((entries[i + 1]?.at ?? endAt) - entry.at) / 1000
    const expected = expectedSeconds(entry.words)
    const key = `${entry.slide}.${entry.step}`
    const revisit = seen.has(key)
    seen.add(key)
    let flag = ''
    if (!revisit && expected > 0 && Math.abs(seconds - expected) > MIN_GAP_SECONDS) {
      if (seconds > expected * SLOW_RATIO) flag = 'long'
      else if (seconds < expected * FAST_RATIO) flag = 'short'
    }
    return { ...entry, seconds, expected, revisit, flag }
  })
}

export function reportText({ rows, endAt, startedAt, audioFile }) {
  const total = endAt / 1000
  const expectedTotal = rows.filter(r => !r.revisit).reduce((sum, r) => sum + r.expected, 0)
  const lines = [
    `STAR practice run, started ${startedAt.toLocaleString()}`,
    `Total ${clock(total)}; the notes read at ${WORDS_PER_MINUTE} words a minute would take ${clock(expectedTotal)}.`,
    audioFile ? `Audio: ${audioFile} (times below are from the start of the recording).` : 'Audio: none.',
    '',
    'start | spent | expected | words | slide.step | label | flag',
    ...rows.map(r => [
      clock(r.at / 1000), clock(r.seconds), clock(r.expected), r.words,
      `${r.slide}.${r.step}${r.steps ? `/${r.steps}` : ''}`, r.label,
      r.revisit ? 'went back' : r.flag,
    ].join(' | ')),
  ]
  return lines.join('\n')
}

// ui: the presenter's hooks. getState() returns the deck's current
// { slide, step, steps, label, words } or null; deckOpen() says whether the deck
// window is still there; resetTimer(ms) restarts the presenter's clock.
export function createPractice(ui) {
  const $ = id => document.getElementById(id)
  let run = null

  function status(text) { $('practice-status').textContent = text }

  async function start() {
    if (!ui.deckOpen() || !ui.getState()) { status('Open the deck window first.'); return }
    status('')
    $('practice-report').hidden = true
    $('practice-save').hidden = true
    $('practice-toggle').disabled = true
    const recorder = $('practice-audio').checked ? await openRecorder() : null
    $('practice-toggle').disabled = false
    // The run's zero is the moment recording starts, so log times line up with the audio.
    const zero = performance.now()
    // Held here, not read through `run`: the recorder hands over its last chunk after
    // stop(), when `run` is already cleared.
    const chunks = []
    run = { zero, startedAt: new Date(), entries: [], lastKey: '', recorder, chunks }
    if (recorder) {
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
      recorder.start(1000)
    }
    ui.resetTimer(Date.now())
    $('practice-toggle').textContent = 'End run'
    $('practice-toggle').setAttribute('aria-pressed', 'true')
    // Keep openRecorder's "no microphone" note if it left one.
    if (recorder) status('Running, recording audio.')
    else if (!$('practice-status').textContent) status('Running, no audio.')
    observe()
  }

  async function openRecorder() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Chrome and Edge record WebM/Opus; Safari only does MP4.
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t)) || ''
      return new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    } catch (err) {
      console.error('[practice] no microphone, running without audio', err)
      status('No microphone access, so this run has no audio. Timing still works.')
      return null
    }
  }

  // Called by the presenter on every tick; logs a new entry when the slide or step changes.
  function observe() {
    if (!run) return
    if (!ui.deckOpen()) { stop('The deck window closed, so the run ended. Everything up to then is below.'); return }
    const state = ui.getState()
    if (!state) return
    const key = `${state.slide}.${state.step}`
    if (key === run.lastKey) return
    run.lastKey = key
    run.entries.push({ at: performance.now() - run.zero, ...state })
  }

  function stop(note) {
    if (!run) return
    const finished = run
    run = null
    const endAt = performance.now() - finished.zero
    $('practice-toggle').textContent = 'Start practice run'
    $('practice-toggle').setAttribute('aria-pressed', 'false')
    // Local time, so the file name matches the clock Jason saw.
    const d = finished.startedAt
    const pad = n => String(n).padStart(2, '0')
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`
    const show = audioFile => {
      const rows = buildRows(finished.entries, endAt)
      $('practice-export').value = reportText({ rows, endAt, startedAt: finished.startedAt, audioFile })
      $('practice-report').hidden = false
      status(note || `Run ended at ${clock(endAt / 1000)}.`)
    }
    const recorder = finished.recorder
    if (!recorder || recorder.state === 'inactive') { show(null); return }
    recorder.onstop = () => {
      recorder.stream.getTracks().forEach(t => t.stop())
      const type = recorder.mimeType || 'audio/webm'
      const name = `star-practice-${stamp}.${type.includes('mp4') ? 'm4a' : 'webm'}`
      const link = $('practice-save')
      if (link.href) URL.revokeObjectURL(link.href)
      link.href = URL.createObjectURL(new Blob(finished.chunks, { type }))
      link.download = name
      link.hidden = false
      show(name)
    }
    recorder.stop()
  }

  $('practice-toggle').addEventListener('click', e => {
    e.currentTarget.blur()
    if (run) stop()
    else start()
  })
  $('practice-copy').addEventListener('click', async () => {
    const box = $('practice-export')
    try {
      await navigator.clipboard.writeText(box.value)
      status('Copied. Paste it to Claude, with the recording’s file path if you saved one.')
    } catch (err) {
      console.error('[practice] clipboard write failed', err)
      box.focus()
      box.select()
      status('Couldn’t copy automatically. The text is selected; press ⌘C.')
    }
  })

  return { observe, running: () => !!run }
}
