// Particul8 UI: builds the control panel from a schema, keeps undo/redo as a
// stack of settings snapshots, and packs settings into the URL hash for sharing.
import { Particul8, DEFAULTS } from './engine.js';
import { GOOGLE_FONTS, LIMITS, encodeSettings, decodeSettings, ensureFont } from './common.js';
import { SIZES, FORMATS, GIF_MAX_WIDTH, canEncodeVideo, estimate, exportClip, embedSnippet } from './export.js';

const FONTS = ['Lora', 'Inter', 'JetBrains Mono', ...Object.keys(GOOGLE_FONTS),
  'Georgia', 'Impact', 'Arial Black', 'Courier New', 'Comic Sans MS', 'system-ui'];

const PRESETS = {
  Monstera: {},
  Ember: {
    background: '#120806', color: '#ff7a3d', transitColor: '#fff1a8', transitBlend: 0.8,
    glow: 0.8, trails: 0.6, turbulence: 0.7, transition: 'radial', damping: 0.35, size: 1.8,
  },
  Ocean: {
    background: '#061a24', color: '#5ad0ff', transitColor: '#ffffff', glow: 0.6, trails: 0.55,
    transition: 'nearest', damping: 0.25, stiffness: 0.35, turbulence: 0.5, wobble: 0.4,
  },
  Neon: {
    background: '#000000', colorMode: 'palette', palette: ['#ff2bd6', '#2bfff0', '#ffe62b', '#7b2bff'],
    glow: 1, trails: 0.7, transition: 'scatter', size: 1.6, stiffness: 0.6, damping: 0.4, particles: 7000,
  },
  Wick: {
    background: '#0a0605', color: '#e8d9b8', transition: 'wick', wickOrigin: 'left', ember: '#ff9a3c',
    transitBlend: 0.9, glow: 0.7, trails: 0.5, stagger: 0.5, damping: 0.45, turbulence: 0.45, smoke: 0.6, sparks: 0.5,
  },
  Ink: {
    background: '#efe9dc', color: '#1a1a1a', transitColor: '#1a1a1a', transitBlend: 0,
    glow: 0, trails: 0, transition: 'nearest', stiffness: 0.9, damping: 0.85, turbulence: 0.15, wobble: 0.05, size: 1.8,
  },
};

const GROUPS = [
  { title: 'Text', controls: [
    { key: 'font', label: 'Font', type: 'select', options: FONTS },
    { key: 'weight', label: 'Weight', type: 'select', options: [[400, 'Regular'], [700, 'Bold'], [900, 'Black']], parse: Number },
    { key: 'granularity', label: 'Step through', type: 'select', options: [['char', 'By character'], ['word', 'By word'], ['sentence', 'By sentence'], ['all', 'All at once']] },
    { key: 'hold', label: 'Hold', type: 'range', min: 0, max: 5, step: 0.1, unit: 's' },
  ] },
  { title: 'Particles', controls: [
    { key: 'particles', label: 'Count', type: 'range', min: 500, max: 20000, step: 100 },
    { key: 'size', label: 'Size', type: 'range', min: 0.2, max: 8, step: 0.1 },
    { key: 'shape', label: 'Shape', type: 'select', options: [['circle', 'Circle'], ['square', 'Square']] },
    { key: 'colorMode', label: 'Color mode', type: 'select', options: [['sampled', 'Sampled from text'], ['solid', 'Solid'], ['palette', 'Palette']] },
    { key: 'color', label: 'Text color', type: 'color' },
    { key: 'palette', label: 'Palette', type: 'palette' },
    { key: 'glow', label: 'Glow', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'trails', label: 'Trails', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'scatter', label: 'Scatter', type: 'range', min: 0, max: 1, step: 0.01 },
  ] },
  { title: 'Motion', controls: [
    { key: 'transition', label: 'Transition', type: 'select', options: [['flow', 'Flow'], ['radial', 'Radial'], ['nearest', 'Nearest'], ['scatter', 'Scatter'], ['wick', 'Wick']] },
    { key: 'flowAngle', label: 'Flow angle', type: 'range', min: -180, max: 180, step: 1, unit: '°' },
    { key: 'wickOrigin', label: 'Burn from', type: 'select', options: [['left', 'Left'], ['right', 'Right'], ['top', 'Top'], ['bottom', 'Bottom'], ['center', 'Center'], ['random', 'Random spot']] },
    { key: 'ember', label: 'Ember', type: 'color' },
    { key: 'smoke', label: 'Smoke', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'sparks', label: 'Sparks', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'front', label: 'Ragged front', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'stiffness', label: 'Speed', type: 'range', min: 0, max: 2, step: 0.01 },
    { key: 'damping', label: 'Damping', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'stagger', label: 'Sweep', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'turbulence', label: 'Turbulence', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'wobble', label: 'Wobble', type: 'range', min: 0, max: 1, step: 0.01 },
  ] },
  { title: 'Look', controls: [
    { key: 'background', label: 'Background', type: 'color' },
    { key: 'transitColor', label: 'Transit color', type: 'color' },
    { key: 'transitBlend', label: 'Transit blend', type: 'range', min: 0, max: 1, step: 0.01 },
    { key: 'seed', label: 'Seed', type: 'seed' },
  ] },
];

const ICONS = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4l14 8-14 8z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 4v16L7 12zM5 4h2v16H5z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4v16l11-8zM17 4h2v16h-2z"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
};

const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;          // only ever static SVG markup
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v != null) node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
};

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = el('a', { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);   // Safari needs the URL alive past the click
}
const formatBytes = (n) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} KB`);

// --- app ---------------------------------------------------------------------
export function mount(root) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fromHash = decodeSettings(/p8=([A-Za-z0-9_-]+)/.exec(location.hash)?.[1]);
  const initial = { ...DEFAULTS, ...(fromHash || {}), autoplay: !reduced };

  const canvas = el('canvas', { 'aria-label': 'Particle text animation' });
  const frameLabel = el('div', { class: 'p8-frame' });
  const playBtn = el('button', { class: 'p8-tool', type: 'button', 'aria-label': 'Play or pause' });
  const stagebar = el('div', { class: 'p8-stagebar' }, [
    el('button', { class: 'p8-tool', type: 'button', 'aria-label': 'Previous shape', html: ICONS.prev, onclick: () => engine.prev() }),
    playBtn,
    el('button', { class: 'p8-tool', type: 'button', 'aria-label': 'Next shape', html: ICONS.next, onclick: () => engine.next() }),
    el('button', { class: 'p8-tool', type: 'button', 'aria-label': 'Fullscreen', html: ICONS.full, onclick: () => stage.requestFullscreen?.() }),
  ]);
  const stage = el('div', { class: 'p8-stage' }, [canvas, frameLabel, stagebar]);
  const panel = el('div', { class: 'p8-panel' });
  root.classList.add('p8');
  root.append(stage, panel);

  const engine = new Particul8(canvas, initial);
  const inputs = new Map();

  engine.onFrame = (i, frames) => { frameLabel.textContent = frames.length > 1 ? `${i + 1} / ${frames.length}` : ''; };
  const syncPlay = () => { playBtn.innerHTML = engine.playing ? ICONS.pause : ICONS.play; };
  playBtn.addEventListener('click', () => { engine.playing ? engine.pause() : engine.play(); syncPlay(); });
  syncPlay();

  // --- history ---
  let current = JSON.stringify(engine.settings);
  const past = [], future = [];
  const undoBtn = el('button', { class: 'p8-btn', type: 'button', onclick: () => travel(past, future) }, ['Undo']);
  const redoBtn = el('button', { class: 'p8-btn', type: 'button', onclick: () => travel(future, past) }, ['Redo']);
  const refreshHistory = () => { undoBtn.disabled = !past.length; redoBtn.disabled = !future.length; };
  function commit() {
    const snap = JSON.stringify(engine.settings);
    if (snap === current) return;
    past.push(current); future.length = 0; current = snap;
    if (past.length > 100) past.shift();
    refreshHistory();
  }
  function travel(from, to) {
    if (!from.length) return;
    to.push(current); current = from.pop();
    applySettings(JSON.parse(current));
    refreshHistory();
  }

  function applySettings(settings) {
    const s = { ...DEFAULTS, ...settings };
    engine.setSettings(s);
    ensureFont(s.font, s.weight).then(() => engine.refresh());
    for (const [key, sync] of inputs) sync(s[key]);
    updateVisibility();
  }

  function set(key, value, { record = false } = {}) {
    engine.setSettings({ [key]: value });
    if (key === 'font' || key === 'weight') {
      ensureFont(engine.settings.font, engine.settings.weight).then(() => engine.refresh());
    }
    if (record) commit();
    updateVisibility();
  }

  // --- text ---
  const textarea = el('textarea', { class: 'p8-textarea', 'aria-label': 'Text to animate', maxlength: LIMITS.text, spellcheck: 'false' });
  textarea.value = initial.text;
  let textTimer;
  textarea.addEventListener('input', () => {
    clearTimeout(textTimer);
    textTimer = setTimeout(() => set('text', textarea.value, { record: true }), 300);
  });
  inputs.set('text', (v) => { textarea.value = v; });
  panel.append(el('div', { class: 'p8-full' }, [
    el('div', { class: 'p8-group' }, [el('h3', {}, ['Type something']), textarea]),
  ]));

  // --- control groups ---
  const visibility = [];
  for (const group of GROUPS) {
    const box = el('div', { class: 'p8-group' }, [el('h3', {}, [group.title])]);
    for (const c of group.controls) box.append(buildControl(c));
    panel.append(box);
  }

  function buildControl(c) {
    const id = `p8-${c.key}`;
    const row = el('div', { class: 'p8-row' });
    const label = el('label', { for: id }, [c.label]);
    const val = engine.settings[c.key];
    if (c.type === 'range') {
      const out = el('output', {});
      const input = el('input', { type: 'range', id, min: c.min, max: c.max, step: c.step });
      const fmt = (v) => `${Number.isInteger(c.step) ? v : Number(v).toFixed(c.step < 0.1 ? 2 : 1)}${c.unit || ''}`;
      input.value = val; out.value = fmt(val);
      input.addEventListener('input', () => { out.value = fmt(input.value); set(c.key, Number(input.value)); });
      input.addEventListener('change', () => commit());
      inputs.set(c.key, (v) => { input.value = v; out.value = fmt(v); });
      row.append(label, out, input);
    } else if (c.type === 'select') {
      const select = el('select', { id });
      for (const o of c.options) {
        const [v, l] = Array.isArray(o) ? o : [o, o];
        select.append(el('option', { value: v }, [l]));
      }
      select.value = val;
      select.addEventListener('change', () => set(c.key, c.parse ? c.parse(select.value) : select.value, { record: true }));
      inputs.set(c.key, (v) => { select.value = v; });
      row.append(label, select);
    } else if (c.type === 'color') {
      const input = el('input', { type: 'color', id });
      input.value = val === 'transparent' ? '#000000' : val;
      input.addEventListener('input', () => set(c.key, input.value));
      input.addEventListener('change', () => commit());
      inputs.set(c.key, (v) => { input.value = v === 'transparent' ? '#000000' : v; });
      row.append(label, input);
    } else if (c.type === 'palette') {
      const wrap = el('div', { class: 'p8-swatches' });
      const swatches = [];
      const read = () => swatches.map((s) => s.value);
      for (let i = 0; i < 4; i++) {
        const sw = el('input', { type: 'color', 'aria-label': `Palette color ${i + 1}` });
        sw.value = val[i] || '#ffffff';
        sw.addEventListener('input', () => set('palette', read()));
        sw.addEventListener('change', () => commit());
        swatches.push(sw); wrap.append(sw);
      }
      inputs.set('palette', (v) => swatches.forEach((s, i) => { s.value = v[i] || '#ffffff'; }));
      visibility.push(() => { row.hidden = engine.settings.colorMode !== 'palette'; });
      row.append(el('span', {}, [c.label]), wrap);
    } else if (c.type === 'seed') {
      const input = el('input', { type: 'number', id, min: 0, max: 999999, step: 1 });
      input.value = val;
      input.addEventListener('change', () => set('seed', Number(input.value) || 0, { record: true }));
      const dice = el('button', { class: 'p8-btn', type: 'button', onclick: () => {
        const v = Math.floor(Math.random() * 999999);
        input.value = v; set('seed', v, { record: true });
      } }, ['Reroll']);
      inputs.set('seed', (v) => { input.value = v; });
      row.append(label, el('div', { class: 'p8-actions' }, [input, dice]));
    }
    if (c.key === 'flowAngle') visibility.push(() => { row.hidden = engine.settings.transition !== 'flow'; });
    if (['wickOrigin', 'ember', 'smoke', 'sparks', 'front'].includes(c.key)) visibility.push(() => { row.hidden = engine.settings.transition !== 'wick'; });
    if (c.key === 'color') visibility.push(() => { label.textContent = engine.settings.colorMode === 'palette' ? 'Emoji tint' : 'Text color'; });
    return row;
  }
  function updateVisibility() { visibility.forEach((fn) => fn()); }

  // --- presets + actions ---
  const status = el('span', { class: 'p8-status', 'aria-live': 'polite' });
  const presets = el('div', { class: 'p8-presets' });
  for (const [name, patch] of Object.entries(PRESETS)) {
    presets.append(el('button', { class: 'p8-btn', type: 'button', onclick: () => {
      applySettings({ ...DEFAULTS, text: engine.settings.text, granularity: engine.settings.granularity, font: engine.settings.font, weight: engine.settings.weight, ...patch });
      commit();
    } }, [name]));
  }
  const shareBtn = el('button', { class: 'p8-btn primary', type: 'button', onclick: async () => {
    const url = `${location.origin}${location.pathname}#p8=${encodeSettings(engine.settings)}`;
    history.replaceState(null, '', `#p8=${encodeSettings(engine.settings)}`);
    try { await navigator.clipboard.writeText(url); status.textContent = 'Link copied'; }
    catch { status.textContent = 'Link is in the address bar'; }
    setTimeout(() => { status.textContent = ''; }, 2500);
  } }, ['Copy share link']);
  const resetBtn = el('button', { class: 'p8-btn', type: 'button', onclick: () => { applySettings({ ...DEFAULTS, autoplay: engine.playing }); commit(); } }, ['Reset']);
  panel.append(
    el('div', { class: 'p8-full p8-group' }, [el('h3', {}, ['Presets']), presets]),
    el('div', { class: 'p8-full p8-actions' }, [undoBtn, redoBtn, resetBtn, shareBtn, status]),
  );

  // --- export ---
  const shareUrl = () => `${location.origin}${location.pathname}#p8=${encodeSettings(engine.settings)}`;
  const formatSel = el('select', {});
  for (const [v, l] of FORMATS) formatSel.append(el('option', { value: v }, [l]));
  const sizeSel = el('select', {});
  for (const s of SIZES) sizeSel.append(el('option', { value: s.id }, [s.label]));
  sizeSel.value = '1080p';
  const fpsSel = el('select', {});
  for (const f of [30, 60]) fpsSel.append(el('option', { value: f }, [`${f} fps`]));
  const transparentBox = el('input', { type: 'checkbox', checked: '' });
  if (!canEncodeVideo()) {
    formatSel.querySelector('[value="video"]').disabled = true;   // Firefox < 130, older Safari
    formatSel.value = 'gif';
  }
  const field = (label, control) => el('label', { class: 'p8-field' }, [el('span', {}, [label]), control]);
  const sizeField = field('Size', sizeSel);
  const fpsField = field('Frame rate', fpsSel);
  const transparentField = el('label', { class: 'p8-field p8-check' }, [transparentBox, 'Transparent background']);
  const exportBtn = el('button', { class: 'p8-btn primary', type: 'button' }, ['Export']);
  const cancelBtn = el('button', { class: 'p8-btn', type: 'button', hidden: '' }, ['Cancel']);
  const progress = el('progress', { max: 1, value: 0, hidden: '' });
  const estimateLabel = el('span', { class: 'p8-status' });
  const exportStatus = el('span', { class: 'p8-status', 'aria-live': 'polite' });
  const snippet = el('textarea', { class: 'p8-snippet', readonly: '', hidden: '', rows: 3, 'aria-label': 'Embed code' });
  snippet.addEventListener('focus', () => snippet.select());

  function refreshExport() {
    const f = formatSel.value;
    sizeField.hidden = f === 'html';
    fpsField.hidden = f !== 'video';
    transparentField.hidden = f !== 'png';
    if (f === 'html') { estimateLabel.textContent = 'One self-contained file, plays at any size'; return; }
    const e = estimate(engine.settings, f, Number(fpsSel.value));
    const size = SIZES.find((s) => s.id === sizeSel.value);
    const dims = f === 'gif' ? `${Math.min(GIF_MAX_WIDTH, size.w)} px wide` : `${size.w} × ${size.h}`;
    estimateLabel.textContent = `${e.seconds.toFixed(1)} s · ${e.frames} frames · ${dims}`;
  }
  for (const c of [formatSel, sizeSel, fpsSel]) c.addEventListener('change', refreshExport);
  visibility.push(refreshExport);

  let aborter = null;
  exportBtn.addEventListener('click', async () => {
    aborter = new AbortController();
    exportBtn.disabled = true; cancelBtn.hidden = false; progress.hidden = false; progress.value = 0;
    exportStatus.textContent = 'Rendering…';
    try {
      const { blob, filename } = await exportClip({
        settings: engine.settings, format: formatSel.value, sizeId: sizeSel.value, fps: Number(fpsSel.value),
        transparent: transparentBox.checked, logicalWidth: engine.width || 960, shareUrl: shareUrl(), signal: aborter.signal,
        onProgress: (p, i, n) => { progress.value = p; exportStatus.textContent = `Rendering ${i} / ${n}`; },
      });
      download(blob, filename);
      exportStatus.textContent = `Saved ${filename} (${formatBytes(blob.size)})`;
    } catch (e) {
      exportStatus.textContent = e.name === 'AbortError' ? 'Cancelled' : `Export failed: ${e.message}`;
      if (e.name !== 'AbortError') console.error('[particul8] export', e);
    } finally {
      exportBtn.disabled = false; cancelBtn.hidden = true; progress.hidden = true; aborter = null;
    }
  });
  cancelBtn.addEventListener('click', () => aborter?.abort());

  const showSnippet = async (kind, label) => {
    const code = embedSnippet(engine.settings, kind);
    snippet.value = code; snippet.hidden = false;
    try { await navigator.clipboard.writeText(code); exportStatus.textContent = `${label} copied`; }
    catch { exportStatus.textContent = `${label} is in the box below`; }
    setTimeout(() => { exportStatus.textContent = ''; }, 2500);
  };
  panel.append(el('div', { class: 'p8-full p8-group' }, [
    el('h3', {}, ['Export']),
    el('div', { class: 'p8-export' }, [field('Format', formatSel), sizeField, fpsField, transparentField, exportBtn, cancelBtn]),
    el('div', { class: 'p8-export-status' }, [progress, estimateLabel, exportStatus]),
    el('div', { class: 'p8-actions' }, [
      el('button', { class: 'p8-btn', type: 'button', onclick: () => showSnippet('element', 'Embed code') }, ['Copy embed code']),
      el('button', { class: 'p8-btn', type: 'button', onclick: () => showSnippet('iframe', 'Iframe code') }, ['Copy iframe code']),
      el('span', { class: 'p8-hint' }, ['Paste on any page. The engine loads from marsh.city, like a web font.']),
    ]),
    snippet,
  ]));

  refreshHistory();
  updateVisibility();

  // --- sizing + loop ---
  const ro = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width > 0 && height > 0) engine.resize(width, height);
  });
  ro.observe(stage);
  ensureFont(initial.font, initial.weight).then(() => engine.refresh());
  engine.start();

  document.addEventListener('visibilitychange', () => { document.hidden ? engine.stop() : engine.start(); });
  return engine;
}

const root = document.getElementById('particul8');
if (root) window.particul8 = mount(root); // exposed for console poking and the export tooling to come
