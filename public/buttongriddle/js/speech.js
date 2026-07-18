// speechSynthesis wrapper. Android quirks handled here so nothing else
// has to know: getVoices() is empty until 'voiceschanged' fires, and
// overlapping utterances must be cancelled, never queued.

let voices = [];
const listeners = new Set();

export function initSpeech() {
  if (!('speechSynthesis' in window)) return;
  const load = () => {
    const found = speechSynthesis.getVoices();
    if (found.length) {
      voices = found;
      listeners.forEach((fn) => fn(voices));
    }
  };
  speechSynthesis.addEventListener('voiceschanged', load);
  load();
}

export function onVoices(fn) {
  listeners.add(fn);
  if (voices.length) fn(voices);
}

export function getVoiceList() {
  return voices;
}

export function speak(text, settings) {
  if (!('speechSynthesis' in window) || !text) return;
  speechSynthesis.cancel(); // no queue buildup, ever
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = settings.voiceURI && voices.find((v) => v.voiceURI === settings.voiceURI);
  if (voice) utterance.voice = voice;
  utterance.rate = settings.speechRate ?? 1;
  speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
