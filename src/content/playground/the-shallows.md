---
title: The Shallows
description: A living canvas of schooling fish, drifting clouds, and a patient predator in warm tropical water.
---

Warm water over sand and rock. A school of tuna moves as one - splitting around obstacles, merging back together, scattering when something bigger passes through.

<div id="pool-container" style="position:relative;width:100%;aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;">
<canvas id="pool" style="width:100%;height:100%;display:block;background:#1a6b7a;"></canvas>
<div id="toolbar" style="position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:6px;z-index:10;">
  <button id="food-toggle" class="pool-tool" title="Toggle food mode" aria-label="Toggle food mode" aria-pressed="false" role="switch">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="6" r="2"/><circle cx="8" cy="14" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="12" cy="18" r="1"/></svg>
  </button>
  <div class="pool-sound-wrap">
    <button id="sound-toggle" class="pool-tool" title="Toggle ocean sound" aria-label="Toggle ocean sound" aria-pressed="false" role="switch">
      <svg id="sound-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
    </button>
    <input id="volume-slider" type="range" min="0" max="100" value="50" class="pool-volume" title="Volume">
  </div>
</div>
<button id="fullscreen-btn" class="pool-tool pool-fs-btn" title="Toggle fullscreen" aria-label="Toggle fullscreen">
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
</button>
<button id="fs-close-btn" class="pool-tool pool-fs-close" title="Exit fullscreen" aria-label="Exit fullscreen" hidden>
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
</button>
<div id="sound-hint" class="pool-hint" hidden>No audio? Check your phone's silent mode switch</div>
</div>
<style>
.pool-tool {
  width: 32px; height: 32px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15);
  background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.5); transition: all 0.2s;
}
.pool-tool:hover { border-color: rgba(255,255,255,0.35); color: rgba(255,255,255,0.8); }
.pool-tool.active { border-color: rgba(255,255,255,0.5); color: rgba(255,255,255,0.9); background: rgba(255,255,255,0.1); }
.pool-sound-wrap { position: relative; }
.pool-volume {
  position: absolute; top: 36px; left: 50%; transform: translateX(-50%);
  width: 4px; height: 0; opacity: 0; transition: height 0.2s, opacity 0.2s;
  accent-color: rgba(150,200,220,0.8); cursor: pointer;
  writing-mode: vertical-lr; direction: rtl;
  appearance: slider-vertical;
  padding: 4px;
}
.pool-sound-wrap:hover .pool-volume,
.pool-sound-wrap.vol-open .pool-volume,
.pool-volume:hover,
.pool-volume:active { height: 60px; opacity: 1; }
.pool-hint {
  position: absolute; bottom: 44px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  color: rgba(255,255,255,0.85); font-size: 12px; padding: 6px 12px;
  border-radius: 6px; white-space: nowrap; z-index: 10;
  opacity: 0; transition: opacity 0.3s;
  pointer-events: none;
}
.pool-hint.show { opacity: 1; }
.pool-fs-btn { position: absolute; bottom: 8px; right: 8px; z-index: 10; }
.pool-fs-close { position: absolute; top: 8px; left: 8px; z-index: 10; }
.fake-fullscreen #toolbar { top: calc(8px + env(safe-area-inset-top, 0px)) !important; right: calc(8px + env(safe-area-inset-right, 0px)) !important; }
.fake-fullscreen .pool-fs-close { top: calc(8px + env(safe-area-inset-top, 0px)); left: calc(8px + env(safe-area-inset-left, 0px)); }
.fake-fullscreen .pool-fs-btn { bottom: calc(8px + env(safe-area-inset-bottom, 0px)); right: calc(8px + env(safe-area-inset-right, 0px)); }
#toolbar.hidden, .pool-fs-btn.hidden, .pool-fs-close.hidden { opacity: 0; pointer-events: none; }
#toolbar, .pool-fs-btn, .pool-fs-close { transition: opacity 0.5s; }
#pool-container:fullscreen,
#pool-container:-webkit-full-screen,
#pool-container.fake-fullscreen { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; height: 100dvh !important; aspect-ratio: auto !important; border-radius: 0 !important; max-width: none !important; z-index: 99999 !important; background: #1a6b7a !important; }
#pool-container:fullscreen canvas,
#pool-container:-webkit-full-screen canvas,
#pool-container.fake-fullscreen canvas { width: 100% !important; height: 100% !important; }
.fake-fullscreen ~ *, body:has(.fake-fullscreen) > *:not(script):not(style):not(link) { visibility: hidden !important; }
.fake-fullscreen, .fake-fullscreen * { visibility: visible !important; }
body:has(.fake-fullscreen) .site-foot-foliage { display: none !important; }
body:has(.fake-fullscreen) { background: #1a6b7a !important; overflow: hidden !important; }
</style>

<script type="module">
const canvas = document.getElementById('pool');
const ctx = canvas.getContext('2d');

// Food toggle
let activeTool = 'observe';
const foodBtn = document.getElementById('food-toggle');
foodBtn.addEventListener('click', e => {
  e.stopPropagation();
  activeTool = activeTool === 'food' ? 'observe' : 'food';
  const isFood = activeTool === 'food';
  foodBtn.classList.toggle('active', isFood);
  foodBtn.setAttribute('aria-pressed', isFood);
});

// Ocean sound - procedural white noise shaped to sound like waves
let audioCtx = null;
let oceanGain = null;
let oceanFilter = null;
let oceanLfo = null;
let oceanLfoGain = null;
let soundEnabled = false;

// All audio init must be synchronous within the user gesture call stack.
// iOS Safari breaks the gesture context across await/then boundaries.
let oceanPanner = null;
let crashPanner = null;

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume();

  const bufferSize = audioCtx.sampleRate * 4;

  // --- Ambient ocean layer: filtered white noise ---
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  oceanFilter = audioCtx.createBiquadFilter();
  oceanFilter.type = 'bandpass';
  oceanFilter.frequency.value = 400;
  oceanFilter.Q.value = 0.5;

  const lowShelf = audioCtx.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = 200;
  lowShelf.gain.value = 6;

  oceanLfo = audioCtx.createOscillator();
  oceanLfo.type = 'sine';
  oceanLfo.frequency.value = 0.07;
  oceanLfoGain = audioCtx.createGain();
  oceanLfoGain.gain.value = 250;
  oceanLfo.connect(oceanLfoGain);
  oceanLfoGain.connect(oceanFilter.frequency);

  oceanGain = audioCtx.createGain();
  oceanGain.gain.value = 0;

  // Stereo panner for wave direction
  oceanPanner = audioCtx.createStereoPanner();
  oceanPanner.pan.value = 0;

  noise.connect(oceanFilter);
  oceanFilter.connect(lowShelf);
  lowShelf.connect(oceanGain);
  oceanGain.connect(oceanPanner);
  oceanPanner.connect(audioCtx.destination);

  // --- Distant crash layer: low frequency rumble ---
  const crashBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const crashData = crashBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) crashData[i] = Math.random() * 2 - 1;
  const crashNoise = audioCtx.createBufferSource();
  crashNoise.buffer = crashBuffer;
  crashNoise.loop = true;

  const crashFilter = audioCtx.createBiquadFilter();
  crashFilter.type = 'lowpass';
  crashFilter.frequency.value = 120;
  crashFilter.Q.value = 0.7;

  window._crashGain = audioCtx.createGain();
  window._crashGain.gain.value = 0;

  crashPanner = audioCtx.createStereoPanner();
  crashPanner.pan.value = 0;

  crashNoise.connect(crashFilter);
  crashFilter.connect(window._crashGain);
  window._crashGain.connect(crashPanner);
  crashPanner.connect(audioCtx.destination);

  noise.start();
  oceanLfo.start();
  crashNoise.start();
}

function toggleSound() {
  if (!audioCtx) initAudio();
  // If context got suspended again (e.g. tab backgrounded), resume in gesture
  if (audioCtx.state === 'suspended') audioCtx.resume();
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('sound-toggle');
  btn.setAttribute('aria-pressed', soundEnabled);
  if (soundEnabled) {
    oceanGain.gain.cancelScheduledValues(audioCtx.currentTime);
    oceanGain.gain.value = masterVolume * 0.3;
    document.getElementById('sound-icon').innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>';
  } else {
    oceanGain.gain.cancelScheduledValues(audioCtx.currentTime);
    oceanGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
    document.getElementById('sound-icon').innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
  }
}

const soundBtn = document.getElementById('sound-toggle');
const soundWrap = document.querySelector('.pool-sound-wrap');
const volSlider = document.getElementById('volume-slider');

const soundHint = document.getElementById('sound-hint');
let hintTimer = null;

let lastSoundTap = 0;
function handleSoundTap(e) {
  e.stopPropagation();
  e.preventDefault();
  // Debounce - touchend + click both fire on mobile
  const now = Date.now();
  if (now - lastSoundTap < 300) return;
  lastSoundTap = now;
  toggleSound();
  if ('ontouchstart' in window) {
    soundWrap.classList.toggle('vol-open', soundEnabled);
    // Brief reminder about silent mode when enabling sound on mobile
    if (soundEnabled) {
      soundHint.hidden = false;
      soundHint.classList.add('show');
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => {
        soundHint.classList.remove('show');
        setTimeout(() => { soundHint.hidden = true; }, 300);
      }, 3000);
    } else {
      soundHint.classList.remove('show');
      soundHint.hidden = true;
    }
  }
}
soundBtn.addEventListener('click', handleSoundTap);
soundBtn.addEventListener('touchend', handleSoundTap);

// Close volume slider when tapping elsewhere
document.addEventListener('touchstart', e => {
  if (!soundWrap.contains(e.target)) soundWrap.classList.remove('vol-open');
});

let masterVolume = 0.5;
volSlider.addEventListener('input', e => {
  e.stopPropagation();
  masterVolume = e.target.value / 100;
  if (soundEnabled && oceanGain) {
    oceanGain.gain.setTargetAtTime(masterVolume * 0.15, audioCtx.currentTime, 0.1);
  }
});
// Prevent touch events on slider from propagating to canvas
volSlider.addEventListener('touchstart', e => e.stopPropagation());
volSlider.addEventListener('touchmove', e => e.stopPropagation());

// Fullscreen + auto-hide UI
const poolContainer = document.getElementById('pool-container');
const toolbar = document.getElementById('toolbar');
const fsBtn = document.getElementById('fullscreen-btn');
const fsCloseBtn = document.getElementById('fs-close-btn');
let hideTimer = null;

const canRealFS = !!(poolContainer.requestFullscreen || poolContainer.webkitRequestFullscreen);
function isFakeFS() { return poolContainer.classList.contains('fake-fullscreen'); }
let _fakefsParent = null; // original parent to restore on exit
let _fakefsNext = null;   // next sibling for reinsertion position
function enterFakeFS() {
  // Move container to body to escape backdrop-filter containing block
  _fakefsParent = poolContainer.parentElement;
  _fakefsNext = poolContainer.nextSibling;
  document.body.appendChild(poolContainer);
  poolContainer.classList.add('fake-fullscreen');
  document.body.style.overflow = 'hidden';
  handleFSChange();
}
function exitFakeFS() {
  poolContainer.classList.remove('fake-fullscreen');
  document.body.style.overflow = '';
  // Move container back to its original position
  if (_fakefsParent) {
    if (_fakefsNext) _fakefsParent.insertBefore(poolContainer, _fakefsNext);
    else _fakefsParent.appendChild(poolContainer);
  }
  _fakefsParent = null;
  _fakefsNext = null;
  handleFSChange();
}
fsBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (canRealFS) {
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fsEl) {
      const rfs = poolContainer.requestFullscreen || poolContainer.webkitRequestFullscreen;
      rfs.call(poolContainer).catch(() => enterFakeFS());
    } else {
      const efs = document.exitFullscreen || document.webkitExitFullscreen;
      if (efs) efs.call(document);
    }
  } else {
    enterFakeFS();
  }
});
fsCloseBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (isFakeFS()) {
    exitFakeFS();
  } else {
    const efs = document.exitFullscreen || document.webkitExitFullscreen;
    if (efs) efs.call(document);
  }
});

function showUI() {
  toolbar.classList.remove('hidden');
  if (!fsCloseBtn.hidden) fsCloseBtn.classList.remove('hidden');
  if (!fsBtn.hidden) fsBtn.classList.remove('hidden');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toolbar.classList.add('hidden');
    fsBtn.classList.add('hidden');
    fsCloseBtn.classList.add('hidden');
  }, 3000);
}
poolContainer.addEventListener('mousemove', showUI);
poolContainer.addEventListener('touchstart', showUI);
// Start the auto-hide timer
hideTimer = setTimeout(() => { toolbar.classList.add('hidden'); fsBtn.classList.add('hidden'); }, 3000);
let regenerateWorld = null; // set after world init

let inFullscreen = false; // track FS state so resize handler can skip
function handleFSChange() {
  inFullscreen = isFakeFS() || !!(document.fullscreenElement || document.webkitFullscreenElement);
  fsCloseBtn.hidden = !inFullscreen;
  fsBtn.hidden = inFullscreen;
  // Don't resize canvas or regenerate — CSS scales the existing pixels
  showUI();
}
const fsChangeEvent = 'onfullscreenchange' in document ? 'fullscreenchange' : 'webkitfullscreenchange';
document.addEventListener(fsChangeEvent, handleFSChange);
// Escape exits fake fullscreen
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isFakeFS()) exitFakeFS();
});

// Delayed crash tracker - queues a rumble after each wave passes
let crashQueue = []; // { time, pan, strength }

// Update ocean sound - audible before/after waves, crash echo after
function updateOceanSound() {
  if (!soundEnabled || !audioCtx) return;
  const waveIntensity = Math.abs(tide.strength);
  const now = audioCtx.currentTime;

  // Track waves by their actual distance from the viewport, not progress %
  let washPresence = 0;
  let wavePanX = 0;
  let strongestWave = 0;
  const vpDiag = Math.sqrt(w * w + h * h); // viewport diagonal for distance normalization
  for (const ww of washWaves) {
    // How far is the wave front from the viewport center?
    const dx = ww.x - w / 2, dy = ww.y - h / 2;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    // Normalize: 0 = at center of screen, 1 = one viewport diagonal away
    const normDist = distFromCenter / vpDiag;
    // Presence based on distance: full when on screen, fades with distance
    let presence;
    if (normDist < 0.35) {
      presence = 1.0; // on screen - full volume
    } else if (normDist < 0.8) {
      // Fading but still clearly audible
      presence = 1.0 - (normDist - 0.35) / 0.45 * 0.6; // 1.0 → 0.4
    } else {
      // Distant - low rumble
      presence = Math.max(0.15, 0.4 - (normDist - 0.8) / 0.5 * 0.25);
    }
    const str = presence * ww.strength;
    if (str > strongestWave) {
      strongestWave = str;
      wavePanX = Math.max(-1, Math.min(1, (ww.x / w - 0.5) * 2));
    }
    washPresence = Math.max(washPresence, str);
    // Queue a crash when wave has left the screen
    const progress = ww.traveled / ww.maxTravel;
    if (!ww._crashQueued && progress > 0.7) {
      ww._crashQueued = true;
      const delay = 0.8 + Math.random() * 2.5;
      crashQueue.push({ time: now + delay, pan: wavePanX, strength: ww.strength });
    }
  }

  // Filter: muffled at rest, brighter as waves arrive
  oceanFilter.frequency.setTargetAtTime(
    180 + waveIntensity * 100 + washPresence * 600,
    audioCtx.currentTime, 0.2
  );
  // Volume: always-audible base, swells with wave presence
  const baseVol = 0.06 + waveIntensity * 0.03; // constant low rumble
  const waveVol = washPresence * 0.22;
  oceanGain.gain.setTargetAtTime(
    (baseVol + waveVol) * masterVolume * 2,
    audioCtx.currentTime, 0.1
  );
  if (oceanPanner) {
    oceanPanner.pan.setTargetAtTime(wavePanX * 0.6, audioCtx.currentTime, 0.3);
  }
  oceanLfo.frequency.setTargetAtTime(0.03 + washPresence * 0.1, audioCtx.currentTime, 0.5);

  // Distant crash rumble - triggered by queued events, not wave presence
  if (window._crashGain) {
    // Process crash queue - fire crashes that are due
    let crashVol = 0;
    let crashPan = 0;
    for (let i = crashQueue.length - 1; i >= 0; i--) {
      const c = crashQueue[i];
      const elapsed = now - c.time;
      if (elapsed < 0) continue; // not yet
      // Crash envelope: quick attack, slow decay over ~3s
      const env = elapsed < 0.3 ? elapsed / 0.3 : Math.max(0, 1 - (elapsed - 0.3) / 2.7);
      if (env <= 0) { crashQueue.splice(i, 1); continue; }
      const vol = env * c.strength * 0.15;
      if (vol > crashVol) {
        crashVol = vol;
        crashPan = c.pan;
      }
    }
    // Add a subtle random ambient rumble on top
    const ambientRumble = Math.max(0, Math.sin(waveTime * 0.13) * Math.sin(waveTime * 0.07)) * 0.03;
    window._crashGain.gain.setTargetAtTime(
      (crashVol + ambientRumble) * masterVolume * 2,
      audioCtx.currentTime, crashVol > 0.01 ? 0.1 : 0.8
    );
    if (crashPanner) {
      crashPanner.pan.setTargetAtTime(crashPan * 0.5, audioCtx.currentTime, 0.3);
    }
  }
}

// Food particles that attract fish
const foodPellets = [];

// Floating foam bits - tiny particles shed by waves, drift with current
const foamBits = [];
// Kill effect particles - scale glitter from predator catches
const killFx = [];

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: rect.width, h: rect.height };
}

let { w, h } = resize();
const initialArea = w * h;
const initialW = w;
// More fish on larger viewports - scales aggressively with area
const initialFishCount = Math.min(214, Math.max(69, Math.floor(initialArea / 1232)));
const initialDebrisCount = 500;
// View scale: larger viewports get proportionally larger/faster fish
let viewScale = 1;

function rescaleAll(oldW, oldH) {
  const sx = w / oldW, sy = h / oldH;
  // Update view scale - sqrt of area ratio, capped
  viewScale = Math.min(2.5, Math.sqrt((w * h) / initialArea));
  for (const r of rocks) { r.x *= sx; r.y *= sy; }
  for (const rf of reefs) { rf.x *= sx; rf.y *= sy; }
  for (const rf of reefFish) { rf.x *= sx; rf.y *= sy; }
  for (const p of plants) {
    p.x *= sx; p.y *= sy;
    for (const s of p.segs) { s.x *= sx; s.y *= sy; }
  }
  for (const d of debris) { d.x *= sx; d.y *= sy; }
  for (const f of fish) { f.x *= sx; f.y *= sy; }
  for (const p of predators) { p.x *= sx; p.y *= sy; }
  for (const s of starfish) { s.x *= sx; s.y *= sy; s.homeX *= sx; s.homeY *= sy; }

  // Scale population to match new viewport area
  const areaRatio = (w * h) / initialArea;
  // Update organic population base for new viewport size
  const newBasePop = Math.min(214, Math.max(45, Math.floor((w * h) / 1232)));
  const popRatio = newBasePop / Math.max(1, basePop);
  popTarget = Math.max(newBasePop * 0.35, Math.min(newBasePop * 1.3, popTarget * popRatio));
  basePop = newBasePop;
  const targetDebris = Math.min(1200, Math.floor(initialDebrisCount * areaRatio * 0.75));
  const targetPlants = Math.min(60, Math.floor(30 * Math.sqrt(areaRatio)));
  const targetRocks = Math.min(30, Math.floor(15 * Math.sqrt(areaRatio)));

  // Gently adjust fish population toward new target — don't hard-snap
  const softTarget = Math.floor(popTarget);
  while (fish.length < softTarget * 0.6) {
    const school = fish.length % schoolColors.length;
    const entry = schoolEntries[school];
    const f = new Fish(entry);
    f.school = school;
    f.colorType = school;
    f.color = jitterTunaColor(schoolColors[school].color);
    f.bellyColor = jitterTunaColor(schoolColors[school].belly);
    fish.push(f);
  }
  while (fish.length > softTarget * 1.5 && fish.length > 40) fish.pop();

  // Add debris if needed
  while (debris.length < targetDebris) {
    const bright = Math.random() < 0.25;
    debris.push({
      x: Math.random() * w, y: Math.random() * h,
      size: (bright ? (0.2 + Math.random() * 0.3) : (0.05 + Math.random() * 0.18)) * viewScale,
      vx: 0, vy: 0,
      opacity: bright ? (0.35 + Math.random() * 0.25) : (0.1 + Math.random() * 0.15),
    });
  }
  while (debris.length > targetDebris && debris.length > initialDebrisCount) debris.pop();

  // Add kelp if needed
  while (plants.length < targetPlants) {
    // Spawn in lower half or near a random reef
    if (Math.random() < 0.4 && reefs.length > 0) {
      const rf = reefs[Math.floor(Math.random() * reefs.length)];
      const a = Math.random() * Math.PI * 2;
      const dist = rf.baseR * (0.8 + Math.random() * 0.5);
      plants.push(new Frond(rf.x + Math.cos(a) * dist, rf.y + Math.sin(a) * dist));
    } else {
      plants.push(new Frond(Math.random() * w, h * (0.5 + Math.random() * 0.5)));
    }
  }
  while (plants.length > targetPlants && plants.length > 30) plants.pop();

  // Add sand patches if needed
  while (rocks.length < targetRocks) {
    rocks.push(makeSand(Math.random() * w, Math.random() * h));
  }
  while (rocks.length > targetRocks && rocks.length > 15) rocks.pop();
}
function onResize() {
  if (inFullscreen) return; // CSS handles scaling in fullscreen
  const oldW = w, oldH = h;
  ({ w, h } = resize());
  if (w !== oldW || h !== oldH) { rescaleAll(oldW, oldH); rebuildGrid(); }
}
window.addEventListener('resize', onResize);
// visualViewport fires on iOS when URL bar shows/hides
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', onResize);
}

const blurCanvas = document.createElement('canvas');
const blurCtx = blurCanvas.getContext('2d');

// Spatial grid for fast neighbor lookup (replaces O(n^2) boids)
const GRID_CELL = 200; // px per cell — covers the largest boids radius
let gridCols = 1, gridRows = 1;
let spatialGrid = [];
function rebuildGrid() {
  gridCols = Math.max(1, Math.ceil(w / GRID_CELL));
  gridRows = Math.max(1, Math.ceil(h / GRID_CELL));
  spatialGrid = new Array(gridCols * gridRows);
  for (let i = 0; i < spatialGrid.length; i++) spatialGrid[i] = [];
}
function populateGrid(fishArr) {
  for (let i = 0; i < spatialGrid.length; i++) spatialGrid[i].length = 0;
  for (const f of fishArr) {
    const col = Math.max(0, Math.min(gridCols - 1, Math.floor(f.x / GRID_CELL)));
    const row = Math.max(0, Math.min(gridRows - 1, Math.floor(f.y / GRID_CELL)));
    spatialGrid[row * gridCols + col].push(f);
  }
}
function* getNeighbors(fx, fy) {
  const col = Math.max(0, Math.min(gridCols - 1, Math.floor(fx / GRID_CELL)));
  const row = Math.max(0, Math.min(gridRows - 1, Math.floor(fy / GRID_CELL)));
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) {
        const cell = spatialGrid[r * gridCols + c];
        for (let i = 0; i < cell.length; i++) yield cell[i];
      }
    }
  }
}
rebuildGrid();

// Mouse
let mouse = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, active: false, speed: 0, down: false };
canvas.addEventListener('mouseenter', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) / rect.width * w;
  mouse.y = (e.clientY - rect.top) / rect.height * h;
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.active = true;
  mouse.speed = 0;
});
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.x = (e.clientX - rect.left) / rect.width * w;
  mouse.y = (e.clientY - rect.top) / rect.height * h;
  if (!mouse.active) { mouse.prevX = mouse.x; mouse.prevY = mouse.y; }
  mouse.active = true;
  mouse.speed = Math.sqrt((mouse.x - mouse.prevX) ** 2 + (mouse.y - mouse.prevY) ** 2);
});
canvas.addEventListener('mouseleave', () => { mouse.active = false; mouse.down = false; mouse.x = -1000; mouse.y = -1000; mouse.speed = 0; });
canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  mouse.down = true;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / rect.width * w;
  const my = (e.clientY - rect.top) / rect.height * h;
  if (activeTool === 'food') {
    // Drop food where clicked - if on a rock it'll roll down into the water
    const b = 250 + Math.floor(Math.random() * 60);
    let onRock = false;
    for (const rf of reefs) {
      const cdx = mx - (rf.x + rf.crownOffX), cdy = my - (rf.y + rf.crownOffY);
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      const cAngle = Math.atan2(cdy, cdx);
      if (cDist < rf.radiusAt(cAngle, rf.crownRadii) + 3) { onRock = true; break; }
    }
    foodPellets.push({ x: mx, y: my, size: 3, bites: b, startBites: b, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, onRock });
    if (!onRock) ripples.push({ x: mx, y: my, radius: 2, maxRadius: 20, opacity: 0.2 });
  } else {
    ripples.push({ x: mx, y: my, radius: 3, maxRadius: 120 * viewScale, opacity: 0.5 });
    // Tap void — temporary avoidance zone
    tapVoids.push({ x: mx, y: my, radius: 60 * viewScale, life: 1, maxLife: 3 + Math.random() * 2 });
  }
});
canvas.addEventListener('mouseup', () => { mouse.down = false; });

// Touch
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  // Scale touch point from CSS rect space to logical canvas space (w, h)
  mouse.x = (t.clientX - rect.left) / rect.width * w;
  mouse.y = (t.clientY - rect.top) / rect.height * h;
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.active = true;
  mouse.down = true;
  mouse.speed = 0;
  if (activeTool === 'food') {
    const b2 = 250 + Math.floor(Math.random() * 60);
    let onRock2 = false;
    for (const rf of reefs) {
      const cdx = mouse.x - (rf.x + rf.crownOffX), cdy = mouse.y - (rf.y + rf.crownOffY);
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      const cAngle = Math.atan2(cdy, cdx);
      if (cDist < rf.radiusAt(cAngle, rf.crownRadii) + 3) { onRock2 = true; break; }
    }
    foodPellets.push({ x: mouse.x, y: mouse.y, size: 3, bites: b2, startBites: b2, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, onRock: onRock2 });
    if (!onRock2) ripples.push({ x: mouse.x, y: mouse.y, radius: 2, maxRadius: 20, opacity: 0.2 });
  } else {
    ripples.push({ x: mouse.x, y: mouse.y, radius: 3, maxRadius: 120 * viewScale, opacity: 0.5 });
    tapVoids.push({ x: mouse.x, y: mouse.y, radius: 60 * viewScale, life: 1, maxLife: 3 + Math.random() * 2 });
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.x = (t.clientX - rect.left) / rect.width * w;
  mouse.y = (t.clientY - rect.top) / rect.height * h;
  mouse.speed = Math.sqrt((mouse.x - mouse.prevX) ** 2 + (mouse.y - mouse.prevY) ** 2);
}, { passive: false });
canvas.addEventListener('touchend', () => { mouse.active = false; mouse.down = false; mouse.x = -1000; mouse.y = -1000; mouse.speed = 0; });

const ripples = [];

// Wave current - oscillates back and forth like real shallow water wash
const tide = { angle: 0, strength: 0 };
const waveBaseAngle = Math.PI * 0.75; // top-left to bottom-right

// Cloud shadows — large soft blobs that drift linearly across the scene
// Shared wind direction with slight per-cloud variation; wrap around edges
const cloudWind = { angle: Math.random() * Math.PI * 2 };
const cloudCount = 8;
const clouds = [];
// Stagger clouds along the wind axis so they're evenly spaced in the
// "incoming" direction — continuous stream, not a clump that drifts away
const windCos = Math.cos(cloudWind.angle);
const windSin = Math.sin(cloudWind.angle);
const maxDim = Math.max(w, h);
for (let i = 0; i < cloudCount; i++) {
  const lobes = 2 + Math.floor(Math.random() * 2);
  const subBlobs = [];
  for (let j = 0; j < lobes; j++) {
    subBlobs.push({
      ox: (Math.random() - 0.5) * 0.4,
      oy: (Math.random() - 0.5) * 0.3,
      scale: 0.6 + Math.random() * 0.5,
    });
  }
  // Space clouds along the wind direction across 3x the viewport so
  // there's always another one coming into view
  const along = (i / cloudCount) * maxDim * 3 - maxDim * 0.5;
  const across = (Math.random() - 0.5) * maxDim * 1.2;
  clouds.push({
    x: w / 2 + windCos * along - windSin * across,
    y: h / 2 + windSin * along + windCos * across,
    speed: (12 + Math.random() * 10) * 3,
    drift: cloudWind.angle + (Math.random() - 0.5) * 0.3,
    size: (0.35 + Math.random() * 0.29) * 1.73,
    opacity: 0.08 + Math.random() * 0.06,
    phase: Math.random() * Math.PI * 2,
    subBlobs,
  });
}

// Sunlight check — returns 0 (full shadow) to 1 (full sun) at a point
function getSunlight(px, py) {
  let shadow = 0;
  for (const c of clouds) {
    const dx = px - c.x, dy = py - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const r = Math.min(w, h) * c.size;
    if (dist < r) shadow = Math.max(shadow, (1 - dist / r) * c.opacity * 8);
  }
  return Math.max(0, 1 - shadow);
}

// Turbulence - drifting vortices that create local flow variation
const vortices = [];
for (let i = 0; i < 5; i++) {
  vortices.push({
    x: Math.random() * w, y: Math.random() * h,
    radius: 60 + Math.random() * 80,
    strength: (Math.random() < 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.4),
    driftAngle: Math.random() * Math.PI * 2,
    driftSpeed: 0.1 + Math.random() * 0.15,
    phase: Math.random() * Math.PI * 2,
  });
}
// Sample turbulence at a point - returns local flow {vx, vy}
function sampleFlow(px, py, time) {
  let fx = 0, fy = 0;
  for (const v of vortices) {
    const dx = px - v.x;
    const dy = py - v.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < v.radius && dist > 1) {
      // Curl force - perpendicular to radius, strongest at ~40% radius
      const t = dist / v.radius;
      const falloff = t * Math.pow(1 - t, 0.5) * 4; // peaks in middle ring
      const strength = v.strength * falloff;
      // Perpendicular direction (curl)
      fx += (-dy / dist) * strength;
      fy += (dx / dist) * strength;
    }
  }
  return { fx, fy };
}

// Wash waves - occasional wave fronts that sweep across with turbulence
const washWaves = [];
let washTimer = 8 + Math.random() * 10;

function spawnWash() {
  const angle = waveBaseAngle + (Math.random() - 0.5) * 0.06;
  const startX = w / 2 - Math.cos(angle) * w * 0.7;
  const startY = h / 2 - Math.sin(angle) * h * 0.7;
  // Highly varied intensity - some are strong and fast, some barely there
  const intensity = Math.pow(Math.random(), 0.7); // skewed toward weaker
  washWaves.push({
    x: startX, y: startY,
    angle,
    speed: (1.2 + intensity * 3) * (w / initialW),
    width: (15 + intensity * 40) * viewScale,
    strength: 0.1 + intensity * 0.6,
    life: 1,
    traveled: 0,
    maxTravel: Math.max(w, h) * 1.4,
  });
}

// Debris particles
const debris = [];
for (let i = 0; i < 500; i++) {
  const bright = Math.random() < 0.25;
  debris.push({
    x: Math.random() * w, y: Math.random() * h,
    size: (bright ? (0.2 + Math.random() * 0.3) : (0.05 + Math.random() * 0.18)) * viewScale,
    vx: 0, vy: 0,
    opacity: bright ? (0.35 + Math.random() * 0.25) : (0.1 + Math.random() * 0.15),
  });
}

// Small fish class - schooling behavior (boids)
class Fish {
  constructor(spawnInfo = null) {
    if (spawnInfo) {
      // Spawn as part of a school group well offscreen
      this.x = spawnInfo.x + (Math.random() - 0.5) * 30;
      this.y = spawnInfo.y + (Math.random() - 0.5) * 30;
      this.angle = spawnInfo.angle + (Math.random() - 0.5) * 0.3;
    } else {
      // Fallback: also spawn from a random edge, never in view
      const edge = Math.floor(Math.random() * 4);
      const m = 80 + Math.random() * 40;
      if (edge === 0) { this.x = -m; this.y = Math.random() * h; this.angle = (Math.random() - 0.5) * 0.6; }
      else if (edge === 1) { this.x = w + m; this.y = Math.random() * h; this.angle = Math.PI + (Math.random() - 0.5) * 0.6; }
      else if (edge === 2) { this.x = Math.random() * w; this.y = -m; this.angle = Math.PI / 2 + (Math.random() - 0.5) * 0.6; }
      else { this.x = Math.random() * w; this.y = h + m; this.angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6; }
    }
    this.speed = (0.6 + Math.random() * 1.4) * 0.70; // calm cruising — stragglers get slowed after sociability is set
    this.baseSpeed = this.speed;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    // Idle behavior - rare, brief slow-downs
    this.idleTimer = 5 + Math.random() * 10;
    this.idle = false;

    // Depth - continuous distribution, fish naturally overlap at different levels
    this.depth = Math.random() * 0.5; // 0 = surface, 0.5 = deepest
    const mobileScale = w < 500 ? 0.75 : 1;
    const depthScale = 1 - this.depth * 0.35; // deeper fish are smaller
    // Scale up to 50% bigger on large viewports so they're not tiny
    const vpSizeBoost = 1 + Math.min(0.5, (viewScale - 1) * 0.5);
    this.scale = mobileScale * depthScale * vpSizeBoost;
    this.depthAlpha = 1 - this.depth * 0.5; // deeper fish are dimmer

    // Size - scales with viewport, with ~30% variation between fish
    const sizeVar = 0.7 + Math.random() * 0.6; // 0.7 to 1.3 range
    this.len = (12.5 + Math.random() * 6.25) * this.scale * sizeVar;
    this.bodyWidth = this.len * (0.05 + Math.random() * 0.015);

    // Color type = palette index (determines which fish school together)
    // School ID is legacy — colorType drives flocking now
    this.colorType = 0;
    this.school = 0;
    this.color = 'rgb(168, 195, 220)';
    this.bellyColor = 'rgb(233, 241, 249)';

    // Per-fish comfort distance from rocks - some swim closer than others
    this.rockComfort = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
    // Sociability — ~7% are stragglers who drift from the school
    this.sociability = Math.random() < 0.07 ? 0.15 + Math.random() * 0.25 : 0.7 + Math.random() * 0.3;
    // Stragglers: shorter sensing range, weaker schooling pull
    this.separationDist = (12 + Math.random() * 5) * this.scale;
    this.alignDist = 150 * this.scale * this.sociability;
    this.cohesionDist = 96 * this.scale * this.sociability;

    // Stragglers are slower and wander more
    if (this.sociability < 0.5) {
      this.speed *= 0.65 + this.sociability * 0.4;
      this.baseSpeed = this.speed;
    }

    // Flee state
    this.fleeing = false;
    this.fleeTimer = 0;
    // Eating pause
    this.eating = false;
    this.eatTimer = 0;
    // Bite lunge animation
    this._biting = false;
    this._biteTimer = 0;
    // Sun glint
    this._glint = 0;        // countdown timer, >0 means glinting
    this._glintSeg = 0;     // which spine segment caught the light
    this._prevAngle = this.angle;
    // Belly flash — rare bright flash when fish turns sharply, exposing its side
    this._bellyFlash = 0;
    // Spin-break: track cumulative turning while being chased
    this._chaseSpin = 0;       // accumulated signed angle while chased
    this._spinBreakAt = 4 + Math.random() * 3; // break after 4-7 radians (~1-1.5 loops)
    // Distraction - sometimes fish wander off from the school
    this.distracted = Math.random() < 0.08;
    this.distractTimer = this.distracted ? 2 + Math.random() * 4 : 10 + Math.random() * 20;
    // Leaving — fish that decide to swim away and not come back
    this.leaving = false;
    // Fixed phase offset for undulation desync (not position-based)
    this._phaseOffset = Math.random() * Math.PI * 20;
    // Course-correction twitch — individual fidgety heading adjustments
    this._twitchTimer = 1 + Math.random() * 3; // time until next twitch
    this._twitchRate = 1.5 + Math.random() * 4; // seconds between twitches (varies per fish)
    this._twitchMag = 0.08 + Math.random() * 0.15; // how sharp the turn is (radians)
    // Smoothed render angle — prevents tail flicker from heading jitter
    this._renderAngle = this.angle;
    // Smoothed swim intensity for animation - avoids jerky transitions
    this._swimSmooth = 0.5;
    // Chain of world-space joint positions - body trails behind head
    const numJoints = 7;
    this._jointCount = numJoints;
    this._segLen = this.len / numJoints;
    this._joints = [];
    for (let j = 0; j <= numJoints; j++) {
      // Initialize joints in a line behind the head
      this._joints.push({
        x: this.x - Math.cos(this.angle) * j * this._segLen,
        y: this.y - Math.sin(this.angle) * j * this._segLen,
      });
    }
  }

  update(dt, fish, time) {
    this._drawTime = time;
    // After grabbing food, fish swims away to "chew" before coming back
    if (this.eating) {
      this.eatTimer -= dt;
      if (this.eatTimer <= 0) this.eating = false;
    }

    // Boids forces
    let sepX = 0, sepY = 0, sepCount = 0;
    let alignX = 0, alignY = 0, alignCount = 0;
    let cohX = 0, cohY = 0, cohCount = 0;

    for (const other of getNeighbors(this.x, this.y)) {
      if (other === this) continue;
      const sameSchool = true; // all tuna school together
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.separationDist && dist > 0.1) {
        sepX -= dx / dist;
        sepY -= dy / dist;
        sepCount++;
      }
      if (dist < this.alignDist && sameSchool) {
        alignX += other.vx;
        alignY += other.vy;
        alignCount++;
      }
      if (dist < this.cohesionDist && sameSchool) {
        cohX += other.x;
        cohY += other.y;
        cohCount++;
      }
    }

    // Distraction toggle — stragglers wander more often and longer
    this.distractTimer -= dt;
    if (this.distractTimer <= 0) {
      this.distracted = !this.distracted;
      if (this.sociability < 0.5) {
        // Stragglers: long wanders, short school stints
        this.distractTimer = this.distracted ? 4 + Math.random() * 8 : 3 + Math.random() * 8;
      } else {
        this.distractTimer = this.distracted ? 1.5 + Math.random() * 3 : 12 + Math.random() * 25;
      }
    }

    // Apply boids — alignment-first so merging schools match heading before clustering
    // Stragglers tighten up when predator is nearby — safety in numbers
    let predNearby = false;
    for (const pred of predators) {
      const pdx = this.x - pred.x, pdy = this.y - pred.y;
      if (pdx * pdx + pdy * pdy < 250 * 250 * viewScale * viewScale) { predNearby = true; break; }
    }
    const schoolWeight = (this.distracted && !predNearby) ? 0.3 : 1;
    // Separation weaker in dense school centers — fish stack at different depths
    const density = Math.min(1, cohCount / 5); // 0 = edge/alone, 1 = deep in pack (tighter threshold)
    const densityJitter = 0.85 + this._phaseOffset % 1 * 0.1; // per-fish variation
    const sepStr = 0.07 * (1 - density * densityJitter * 0.92); // 0.07 at edge, ~0.005 at center
    if (sepCount > 0) { this.vx += sepX * sepStr; this.vy += sepY * sepStr; }
    // Measure heading agreement — how aligned are nearby fish with this one?
    let headingAgreement = 1; // 1 = perfect agreement, 0 = opposing
    if (alignCount > 0) {
      const avgVx = alignX / alignCount, avgVy = alignY / alignCount;
      const avgSpd = Math.sqrt(avgVx * avgVx + avgVy * avgVy) || 0.01;
      const mySpd = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 0.01;
      // Dot product of normalized headings: 1 = same dir, -1 = opposite
      headingAgreement = Math.max(0, (this.vx * avgVx + this.vy * avgVy) / (mySpd * avgSpd));
      // Alignment force: stronger when headings disagree (merging), normal when aligned
      const alignStr = headingAgreement < 0.7 ? 0.22 : 0.12;
      this.vx += (avgVx - this.vx) * alignStr * schoolWeight;
      this.vy += (avgVy - this.vy) * alignStr * schoolWeight;
    }
    if (cohCount > 0) {
      let cx = cohX / cohCount, cy = cohY / cohCount;
      // Suppress cohesion when headings disagree — don't pull fish head-on into each other
      const cohDampen = headingAgreement < 0.5 ? 0.2 : headingAgreement < 0.8 ? 0.6 : 1;
      // Push cohesion target well clear of reefs so the school doesn't orbit them
      for (const rf of reefs) {
        if (rf.submerged) continue;
        const cdx = cx - (rf.x + rf.crownOffX), cdy = cy - (rf.y + rf.crownOffY);
        const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
        const cAngle = Math.atan2(cdy, cdx);
        const clearR = rf.radiusAt(cAngle, rf.crownRadii) * 3.2;
        if (cDist < clearR && cDist > 0.1) {
          cx = rf.x + rf.crownOffX + (cdx / cDist) * clearR;
          cy = rf.y + rf.crownOffY + (cdy / cDist) * clearR;
        }
        const bdx = cx - rf.x, bdy = cy - rf.y;
        const bDist = Math.sqrt(bdx * bdx + bdy * bdy);
        const bAngle = Math.atan2(bdy, bdx);
        const bNoise = 0.85 + 0.3 * Math.sin(bAngle * 5.7 + rf.x * 0.1);
        const baseClear = rf.radiusAt(bAngle, rf.baseRadii) * 0.8 * bNoise;
        if (bDist < baseClear && bDist > 0.1) {
          cx = rf.x + (bdx / bDist) * baseClear;
          cy = rf.y + (bdy / bDist) * baseClear;
        }
      }
      // Teardrop school shape — pointed front, wide middle, tapered tail
      // Decompose vector-to-center into along-track and cross-track components
      const toCx = cx - this.x, toCy = cy - this.y;
      const toCDist = Math.sqrt(toCx * toCx + toCy * toCy) || 1;
      // Use average neighbor heading as school direction (more stable than this.angle)
      let schHx, schHy;
      if (alignCount > 0) {
        const aSpd = Math.sqrt(alignX * alignX + alignY * alignY) || 1;
        schHx = (alignX / alignCount) / aSpd;
        schHy = (alignY / alignCount) / aSpd;
      } else {
        schHx = Math.cos(this.angle);
        schHy = Math.sin(this.angle);
      }
      // foreAft: +1 = center is ahead, -1 = center is behind
      const foreAft = (toCx * schHx + toCy * schHy) / toCDist;
      // cross: signed lateral offset from school centerline
      const cross = (toCx * schHy - toCy * schHx) / toCDist;
      // Along-track pull toward center — stronger = tighter core with natural edge falloff
      const alongStr = 0.018;
      const alongX = schHx * foreAft * toCDist * alongStr;
      const alongY = schHy * foreAft * toCDist * alongStr;
      // Cross-track pull toward centerline — stronger at front and back (teardrop)
      const absForeAft = Math.abs(foreAft);
      const absCross = Math.abs(cross);
      let crossStr;
      if (foreAft > 0.3) {
        crossStr = 0.045 + absForeAft * 0.028;
      } else if (foreAft < -0.3) {
        crossStr = 0.028 + absForeAft * 0.015;
      } else {
        crossStr = 0.015 + absCross * 0.009;
      }
      // Cross-track force: perpendicular to school heading, toward centerline
      const crossForceX = -schHy * cross * toCDist * crossStr;
      const crossForceY = schHx * cross * toCDist * crossStr;
      this.vx += (alongX + crossForceX) * schoolWeight * cohDampen;
      this.vy += (alongY + crossForceY) * schoolWeight * cohDampen;
    }

    // Gentle centering during first few seconds
    if (settleTime > 0) {
      const centerPull = settleTime / 3 * 0.02;
      this.vx += (w / 2 - this.x) * centerPull * 0.01;
      this.vy += (h / 2 - this.y) * centerPull * 0.01;
    }

    // Very faint bias toward center - only activates in outer 15%, viewport-normalized
    const normX = (this.x - w / 2) / (w / 2); // -1 to 1
    const normY = (this.y - h / 2) / (h / 2);
    const edgeX = Math.max(0, Math.abs(normX) - 0.85) / 0.15; // 0 in inner 85%, ramps to 1 at edge
    const edgeY = Math.max(0, Math.abs(normY) - 0.85) / 0.15;
    this.vx -= Math.sign(normX) * edgeX * 0.015;
    this.vy -= Math.sign(normY) * edgeY * 0.015;

    // Tidal current + local turbulence (fish resist most of it)
    this.vx += Math.cos(tide.angle) * tide.strength * 0.006 * viewScale;
    this.vy += Math.sin(tide.angle) * tide.strength * 0.006 * viewScale;
    const flow = sampleFlow(this.x, this.y, time);
    this.vx += flow.fx * 0.005 * viewScale;
    this.vy += flow.fy * 0.005 * viewScale;

    // Base speed scales with viewport — slightly damped so large screens aren't too frantic
    const scaledSpeed = this.baseSpeed * (1 + (viewScale - 1) * 0.8);

    // Food attraction - skip while chewing (fish swims away to digest)
    const mouthX = this.x + Math.cos(this.angle) * this.len * 0.5;
    const mouthY = this.y + Math.sin(this.angle) * this.len * 0.5;
    // Bite lunge animation - brief dart forward then pull back
    if (this._biting) {
      this._biteTimer -= dt;
      if (this._biteTimer <= 0) this._biting = false;
    }

    const foodRange = 400;
    let closestFood = null;
    let closestFoodDist = foodRange;
    // Only skip food search during the brief post-bite pullback, not a long chew
    if (this.eating) { closestFood = null; closestFoodDist = Infinity; }
    for (const fp of foodPellets) {
      if (this.eating) break;
      if (fp.bites <= 0) continue;
      const fdx = fp.x - mouthX;
      const fdy = fp.y - mouthY;
      const fd = Math.sqrt(fdx * fdx + fdy * fdy);
      if (fd < closestFoodDist) { closestFood = fp; closestFoodDist = fd; }
    }
    if (closestFood) {
      const fdx = closestFood.x - mouthX;
      const fdy = closestFood.y - mouthY;
      const desiredAngle = Math.atan2(fdy, fdx);
      let headingDiff = desiredAngle - this.angle;
      while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
      while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;
      const angleMismatch = Math.abs(headingDiff);

      // Food overrides idle, distraction, and dampens rock fear
      this.idle = false;
      this.idleTimer = 3;
      this.distracted = false;
      this.distractTimer = 5;
      this._feedingMode = true;

      const eatDist = 12;
      const biteDist = 7;
      // Tight turning when close to food — snap heading toward it
      if (closestFoodDist < 30 && angleMismatch > 0.2) {
        const snapStr = Math.min(0.3, (1 - closestFoodDist / 30) * 0.3);
        const toFood = Math.atan2(fdy, fdx);
        const curSpd = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 0.01;
        this.vx += (Math.cos(toFood) * curSpd - this.vx) * snapStr;
        this.vy += (Math.sin(toFood) * curSpd - this.vy) * snapStr;
        this.angle = Math.atan2(this.vy, this.vx);
      }
      if (closestFoodDist < eatDist && angleMismatch < 1.0) {
        // Close and roughly facing food - slow to nibble
        this.vx *= 0.85;
        this.vy *= 0.85;
        if (closestFoodDist < biteDist && angleMismatch < 0.6 && !this.eating) {
          closestFood.bites--;
          // Visible size reduction - food gets eaten away
          closestFood.size *= 0.97;
          // Gentle nudge on bite — food barely moves
          closestFood.vx += Math.cos(this.angle) * 0.1;
          closestFood.vy += Math.sin(this.angle) * 0.1;
          // Peck lunge - dart forward then brief pullback
          this._biting = true;
          this._biteTimer = 0.12;
          this.vx += Math.cos(this.angle) * 0.8;
          this.vy += Math.sin(this.angle) * 0.8;
          this.eating = true;
          this.eatTimer = 1.5 + Math.random() * 2.5; // swim off to chew before coming back
          // Dart away from food after biting — go digest
          const awayAngle = this.angle + Math.PI + (Math.random() - 0.5) * 1.2;
          this.vx = Math.cos(awayAngle) * scaledSpeed * 1.5;
          this.vy = Math.sin(awayAngle) * scaledSpeed * 1.5;
          // Scatter fragments occasionally - food breaks apart
          if (Math.random() < 0.3 && closestFood.size > 0.8) {
            const fragAngle = Math.random() * Math.PI * 2;
            foodPellets.push({
              x: closestFood.x + Math.cos(fragAngle) * 3,
              y: closestFood.y + Math.sin(fragAngle) * 3,
              size: closestFood.size * (0.2 + Math.random() * 0.2),
              bites: 5 + Math.floor(Math.random() * 10),
              vx: Math.cos(fragAngle) * (0.3 + Math.random() * 0.5),
              vy: Math.sin(fragAngle) * (0.3 + Math.random() * 0.5),
            });
          }
          if (closestFood.bites <= 0) closestFood.size = 0;
        }
      } else {
        // Feeding frenzy — fast, aggressive, darting from all sides
        const proximity = 1 - closestFoodDist / foodRange;
        const steerWeight = 0.15 + proximity * 0.25;
        const foodAngle = Math.atan2(closestFood.y - this.y, closestFood.x - this.x);
        // Per-fish approach offset — spreads fish around the food
        const approachOffset = ((this._phaseOffset % (Math.PI * 2)) - Math.PI) * 0.3;
        const wobble = Math.sin(this._phaseOffset + time * 0.003) * 0.15;
        const frenzySpeed = scaledSpeed * (1.2 + proximity * 0.6);
        const desiredVx = Math.cos(foodAngle + approachOffset + wobble) * frenzySpeed;
        const desiredVy = Math.sin(foodAngle + approachOffset + wobble) * frenzySpeed;
        this.vx += (desiredVx - this.vx) * steerWeight;
        this.vy += (desiredVy - this.vy) * steerWeight;
      }
    }

    // Mouse avoidance - reduced scare radius in food mode so fish can eat
    if (mouse.active) {
      const mdx = this.x - mouse.x;
      const mdy = this.y - mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      const fleeR = activeTool === 'food'
        ? (mouse.down ? 20 : 10 + mouse.speed * 2) // small scare zone near food
        : (mouse.down ? 80 : 25 + mouse.speed * 4);
      if (mDist < fleeR && mDist > 0.1) {
        const force = 0.15 * (1 - mDist / fleeR);
        this.vx += (mdx / mDist) * force;
        this.vy += (mdy / mDist) * force;
        this.fleeing = true;
        this.fleeTimer = 0.4;
      }
    }

    // Ripple avoidance — startle fish when water is tapped
    for (const r of ripples) {
      const rdx = this.x - r.x;
      const rdy = this.y - r.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const ringWidth = 30 * viewScale;
      if (Math.abs(rDist - r.radius) < ringWidth && r.opacity > 0.05 && rDist > 0.1) {
        const force = 0.25 * r.opacity * viewScale;
        this.vx += (rdx / rDist) * force;
        this.vy += (rdy / rDist) * force;
        this.fleeing = true;
        this.fleeTimer = 0.5;
      }
    }

    // Tap void avoidance — temporary zones fish steer around like rocks
    for (const tv of tapVoids) {
      if (tv.life <= 0) continue;
      const tvdx = this.x - tv.x, tvdy = this.y - tv.y;
      const tvDist = Math.sqrt(tvdx * tvdx + tvdy * tvdy);
      const tvR = tv.radius * tv.life; // shrinks as it fades
      if (tvDist < tvR && tvDist > 0.1) {
        const pen = 1 - tvDist / tvR;
        const push = pen * pen * 0.3 * tv.life * viewScale;
        this.vx += (tvdx / tvDist) * push;
        this.vy += (tvdy / tvDist) * push;
      }
    }

    // Predator avoidance — always give big fish a wide berth, escalate when chased
    let panicSprint = false; // last-ditch escape mode
    for (const pred of predators) {
      const pdx = this.x - pred.x;
      const pdy = this.y - pred.y;
      const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
      const predSpeed = Math.sqrt(pred.vx * pred.vx + pred.vy * pred.vy);
      const predAggression = predSpeed / (pred.baseSpeed * viewScale);
      const beingChased = pred.target === this;

      // Passive avoidance — fish always steer clear of the big fish
      // Very wide detection radius — fish react well before predator is close
      const comfortZone = 320 * viewScale;
      if (pDist < comfortZone && pDist > 0.1) {
        const avoidance = 1 - pDist / comfortZone;
        const pushAngle = Math.atan2(pdy, pdx);
        // Quadratic falloff — responsive earlier, strong up close
        const pushForce = avoidance * avoidance * 1.2 * viewScale;
        this.vx += Math.cos(pushAngle) * pushForce;
        this.vy += Math.sin(pushAngle) * pushForce;
        // Any fish within comfort zone starts fleeing
        if (avoidance > 0.15) {
          this.fleeing = true;
          this.fleeTimer = Math.max(this.fleeTimer, 0.5 + avoidance * 0.8);
        }
      }

      // Check if predator is heading toward this fish (in its path)
      const predHeading = Math.atan2(pred.vy, pred.vx);
      const angleToFish = Math.atan2(-pdy, -pdx);
      let headingDiff = Math.abs(predHeading - angleToFish);
      if (headingDiff > Math.PI) headingDiff = Math.PI * 2 - headingDiff;
      const inPath = headingDiff < 1.0; // within ~57° of predator's heading

      // Active flee — life-or-death escape response
      if (!beingChased && !inPath && predAggression < 0.8) continue;
      const baseRange = beingChased ? 400 : inPath ? 300 : 150 + predAggression * 80;
      const fleeRange = baseRange * viewScale;
      if (pDist < fleeRange && pDist > 0.1) {
        const proximity = 1 - pDist / fleeRange;
        const fear = proximity * proximity;
        const fleeAngle = Math.atan2(pdy, pdx);
        const jinkAngle = fleeAngle + (Math.random() - 0.5) * (0.5 + fear * 1.5);
        const force = beingChased ? (1.8 * fear + 0.7) : inPath ? (1.0 * fear + 0.3) : (0.4 * fear);
        this.vx += Math.cos(jinkAngle) * force * viewScale;
        this.vy += Math.sin(jinkAngle) * force * viewScale;
        if (fear > 0.03) {
          this.fleeing = true;
          this.fleeTimer = beingChased ? 2.5 : 0.8 + fear * 1.2;
        }
        // Panic snap — predator is dangerously close, instant velocity override
        if ((beingChased || inPath) && pDist < 100 * viewScale) {
          panicSprint = true;
          const despAngle = fleeAngle + (Math.random() - 0.5) * 1.5;
          this.vx = Math.cos(despAngle) * scaledSpeed * 5.0;
          this.vy = Math.sin(despAngle) * scaledSpeed * 5.0;
          this.fleeing = true;
          this.fleeTimer = 2.5;
        } else if (beingChased && pDist < fleeRange * 0.5) {
          // Desperate jink — sharp random direction change
          const dartAngle = fleeAngle + (Math.random() - 0.5) * 2.5;
          this.vx += Math.cos(dartAngle) * scaledSpeed * 1.5;
          this.vy += Math.sin(dartAngle) * scaledSpeed * 1.5;
          this.distracted = true;
          this.distractTimer = 1.5 + Math.random() * 2;
        }
      }
    }

    // Spin-break: accumulate turning while being chased, dart out if circling
    let beingChasedByAny = false;
    for (const pred of predators) { if (pred.target === this) { beingChasedByAny = true; break; } }
    if (beingChasedByAny && this.fleeing) {
      let spinDelta = this.angle - (this._prevSpinAngle || this.angle);
      while (spinDelta > Math.PI) spinDelta -= Math.PI * 2;
      while (spinDelta < -Math.PI) spinDelta += Math.PI * 2;
      this._chaseSpin += spinDelta;
      if (Math.abs(this._chaseSpin) > this._spinBreakAt) {
        // Break the circle — dart roughly perpendicular, opposite the spin direction
        const breakDir = this.angle + (this._chaseSpin > 0 ? -1 : 1) * (1.2 + Math.random() * 0.8);
        this.vx = Math.cos(breakDir) * scaledSpeed * 4.5;
        this.vy = Math.sin(breakDir) * scaledSpeed * 4.5;
        this.fleeTimer = 2.5;
        this._chaseSpin = 0;
        this._spinBreakAt = 3 + Math.random() * 4; // vary next threshold
      }
    } else {
      this._chaseSpin *= 0.95; // decay when not being chased
    }
    this._prevSpinAngle = this.angle;
    if (this.fleeTimer > 0) this.fleeTimer -= dt;
    else this.fleeing = false;

    // Idle state - rare and brief, fish almost always actively swimming
    this.idleTimer -= dt;
    if (this.idleTimer <= 0) {
      this.idle = !this.idle;
      this.idleTimer = this.idle ? 1 + Math.random() * 2 : 8 + Math.random() * 15;
    }

    // Course-correction twitch — quick heading flick, like real fish do
    if (!this.fleeing && !panicSprint && !this.eating) {
      this._twitchTimer -= dt;
      if (this._twitchTimer <= 0) {
        const twitchAngle = (Math.random() - 0.5) * 2 * this._twitchMag;
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 0.01;
        const newAngle = Math.atan2(this.vy, this.vx) + twitchAngle;
        this.vx = Math.cos(newAngle) * spd;
        this.vy = Math.sin(newAngle) * spd;
        this._twitchTimer = this._twitchRate * (0.6 + Math.random() * 0.8);
      }
    }

    // Speed management - fish dart and zip, quick speed changes
    // Check if actively being chased by a predator
    let beingHunted = false;
    for (const pred of predators) {
      if (pred.target === this) { beingHunted = true; break; }
    }
    let targetSpeed;
    if (panicSprint) targetSpeed = scaledSpeed * 5.5; // explosive burst
    else if (beingHunted) targetSpeed = scaledSpeed * 4.5; // full flight
    else if (this.fleeing) targetSpeed = scaledSpeed * 3.0; // alarmed dash
    else if (this.idle) targetSpeed = scaledSpeed * 1.08;
    else targetSpeed = scaledSpeed * 1.56;

    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > 0.01) {
      // Near-instant acceleration when life is at stake
      const accel = (panicSprint || beingHunted) ? 0.85 : this.fleeing ? 0.6 : 0.15;
      const desired = currentSpeed + (targetSpeed - currentSpeed) * accel;
      const ratio = desired / currentSpeed;
      this.vx *= ratio;
      this.vy *= ratio;
    } else {
      // Fish stalled - kick forward
      this.vx = Math.cos(this.angle) * targetSpeed * 0.5;
      this.vy = Math.sin(this.angle) * targetSpeed * 0.5;
    }

    // Reef avoidance - steers the fish's heading directly so it survives
    // the lateral-kill step below. Gradient: gentle turns far out, strong close in.
    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 0.01;
    const fishLen5 = this.len * 5; // sensing distance in body lengths
    let reefSteer = 0; // accumulated angle adjustment
    for (const rf of reefs) {
      if (rf.submerged) continue;
      // --- Underwater base ---
      const rdx = this.x - rf.x;
      const rdy = this.y - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const bAngle = Math.atan2(rdy, rdx);
      const bNoise = 0.85 + 0.3 * Math.sin(bAngle * 5.7 + rf.x * 0.1) + 0.15 * Math.sin(bAngle * 3.1 + rf.y * 0.1);
      const baseR = rf.radiusAt(bAngle, rf.baseRadii) * 0.42 * bNoise + this.len * 0.5;
      const baseSense = Math.max(baseR * 2.5, baseR + fishLen5);
      if (rDist < baseSense && rDist > 0.1) {
        const approach = -(this.vx * rdx + this.vy * rdy) / (spd * rDist);
        // Only steer when actually approaching the rock
        if (approach > 0.0) {
          const prox = 1 - rDist / baseSense;
          const urgency = prox * prox * prox * approach;
          const cross = this.vx * rdy - this.vy * rdx;
          reefSteer += (cross >= 0 ? 1 : -1) * urgency * 0.12;
        }
        // Radial push outward regardless of heading - prevents orbit lock
        const prox = 1 - rDist / baseSense;
        if (prox > 0.05) {
          const outward = (prox - 0.05) * 0.22;
          this.vx += (rdx / rDist) * outward;
          this.vy += (rdy / rDist) * outward;
        }
      }
      // --- Above-water crown: the solid obstacle ---
      const cdx = this.x - (rf.x + rf.crownOffX);
      const cdy = this.y - (rf.y + rf.crownOffY);
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      const cAngle = Math.atan2(cdy, cdx);
      const crownR = rf.radiusAt(cAngle, rf.crownRadii) + this.len * 0.4;
      const crownSense = Math.max(crownR * 3, crownR + fishLen5);
      if (cDist < crownSense && cDist > 0.1) {
        const prox = 1 - cDist / crownSense;
        // Urgency ramps hard at close range — gentle far out, desperate near rock
        const closeBoost = prox > 0.6 ? 1 + (prox - 0.6) * 8 : 1; // 1x→4.2x near surface
        const approach = -(this.vx * cdx + this.vy * cdy) / (spd * cDist);
        if (approach > -0.3) {
          const aw = Math.max(0, approach + 0.3);
          const urgency = prox * prox * prox * aw * closeBoost;
          const cross = this.vx * cdy - this.vy * cdx;
          reefSteer += (cross >= 0 ? 1 : -1) * urgency * 0.35;
        }
        // Radial push outward from crown — exponential near rock face
        if (prox > 0.05) {
          const outward = (prox - 0.05) * 0.3 * closeBoost;
          this.vx += (cdx / cDist) * outward;
          this.vy += (cdy / cDist) * outward;
        }
      }
    }
    // Predator avoidance - treat like a moving reef, steer around it
    for (const pred of predators) {
      const pdx = this.x - pred.x;
      const pdy = this.y - pred.y;
      const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
      // Sensing range: bigger when predator is hunting, always substantial
      const predR = pred.len * 0.5;
      const alertMult = pred.hunting ? 2.5 : 1.5;
      const predSense = predR * alertMult + fishLen5;
      if (pDist < predSense && pDist > 0.1) {
        const approach = -(this.vx * pdx + this.vy * pdy) / (spd * pDist);
        // Even if not approaching head-on, fish are wary
        if (approach > -0.6) {
          const aw = Math.max(0, approach + 0.6);
          const prox = 1 - pDist / predSense;
          const urgency = prox * prox * prox * aw;
          const cross = this.vx * pdy - this.vy * pdx;
          // Stronger avoidance than rocks - it's a threat
          reefSteer += (cross >= 0 ? 1 : -1) * urgency * (pred.hunting ? 0.35 : 0.18);
        }
      }
    }

    // Blend reef steer into velocity — gentle course correction, not a hard snap
    // Feeding fish are bolder — halved avoidance so they can reach food near rocks
    const feedDampen = this._feedingMode ? 0.4 : 1;
    this._feedingMode = false;
    if (Math.abs(reefSteer) > 0.001) {
      const clampedSteer = Math.max(-0.15, Math.min(0.15, reefSteer * feedDampen));
      const newAngle = Math.atan2(this.vy, this.vx) + clampedSteer;
      const blend = Math.min(0.4, Math.abs(clampedSteer) * 3) * feedDampen;
      this.vx += (Math.cos(newAngle) * spd - this.vx) * blend;
      this.vy += (Math.sin(newAngle) * spd - this.vy) * blend;
      this.angle = Math.atan2(this.vy, this.vx);
    }

    // Fish can only swim forward - kill lateral drift and backward motion
    const headX = Math.cos(this.angle);
    const headY = Math.sin(this.angle);
    const fwdSpeed = this.vx * headX + this.vy * headY;
    const latSpeed = this.vx * (-headY) + this.vy * headX;
    // Kill sideways drift aggressively - fish dart forward
    this.vx -= (-headY) * latSpeed * 0.7;
    this.vy -= headX * latSpeed * 0.7;
    // Prevent backward movement
    if (fwdSpeed < 0) {
      this.vx -= headX * fwdSpeed * 0.8;
      this.vy -= headY * fwdSpeed * 0.8;
    }
    // Enforce minimum forward speed - fish never stall or hover
    const minFwd = scaledSpeed * 0.5;
    const fwdNow = this.vx * headX + this.vy * headY;
    if (fwdNow < minFwd) {
      this.vx += headX * (minFwd - fwdNow) * 0.3;
      this.vy += headY * (minFwd - fwdNow) * 0.3;
    }

    // Drag - smooths out micro-jitter
    this.vx *= 0.99;
    this.vy *= 0.99;

    // Soft return from offscreen — unless this fish is leaving
    if (!this.leaving) {
      if (this.x < 0) this.vx += (Math.abs(this.x) / w) * 0.3;
      if (this.x > w) this.vx -= ((this.x - w) / w) * 0.3;
      if (this.y < 0) this.vy += (Math.abs(this.y) / h) * 0.3;
      if (this.y > h) this.vy -= ((this.y - h) / h) * 0.3;
      if (this.idle && (this.x < -w * 0.15 || this.x > w * 1.15 || this.y < -h * 0.15 || this.y > h * 1.15)) {
        this.idle = false;
        this.idleTimer = 3 + Math.random() * 4;
      }
    }

    // Move
    this.x += this.vx;
    this.y += this.vy;
    // Only clamp non-leaving fish
    if (!this.leaving) {
      const overflow = 0.3;
      this.x = Math.max(-w * overflow, Math.min(w * (1 + overflow), this.x));
      this.y = Math.max(-h * overflow, Math.min(h * (1 + overflow), this.y));
    }
    // Hard collision — fish can never be inside a reef crown
    for (const rf of reefs) {
      if (rf.submerged) continue;
      const cdx = this.x - (rf.x + rf.crownOffX);
      const cdy = this.y - (rf.y + rf.crownOffY);
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      const cAngle = Math.atan2(cdy, cdx);
      const crownR = rf.radiusAt(cAngle, rf.crownRadii) + this.len * 0.3;
      if (cDist < crownR && cDist > 0.1) {
        // Push to crown edge + small buffer
        this.x = rf.x + rf.crownOffX + (cdx / cDist) * (crownR + 2);
        this.y = rf.y + rf.crownOffY + (cdy / cDist) * (crownR + 2);
        // Deflect velocity outward
        const dot = this.vx * (cdx / cDist) + this.vy * (cdy / cDist);
        if (dot < 0) {
          this.vx -= (cdx / cDist) * dot * 1.5;
          this.vy -= (cdy / cDist) * dot * 1.5;
        }
      }
    }
    // Reef collision - pure gradient, no hard snaps
    for (const rf of reefs) {
      if (rf.submerged) continue;
      const rdx = this.x - rf.x;
      const rdy = this.y - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const angle = Math.atan2(rdy, rdx);
      const noise = 0.85 + 0.3 * Math.sin(angle * 5.7 + rf.x * 0.1) + 0.15 * Math.sin(angle * 3.1 + rf.y * 0.1);
      const baseCollR = rf.radiusAt(angle, rf.baseRadii) * 0.35 * noise;
      // Wide gradient push - per-fish comfort distance varies the boundary
      const pushZone = baseCollR * 1.8 * this.rockComfort;
      if (rDist < pushZone && rDist > 0.1) {
        const pen = 1 - rDist / pushZone;
        const pushStr = pen * pen * pen * 0.5; // cubic ramp, strong at core
        this.vx += (rdx / rDist) * pushStr;
        this.vy += (rdy / rDist) * pushStr;
      }
      // Crown - gradient push that gets overwhelming close in
      const cdx = this.x - (rf.x + rf.crownOffX);
      const cdy = this.y - (rf.y + rf.crownOffY);
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      const cAngle = Math.atan2(cdy, cdx);
      const crownCollR = rf.radiusAt(cAngle, rf.crownRadii) + this.len * 0.3;
      const crownPush = crownCollR * 1.05 * this.rockComfort;
      if (cDist < crownPush && cDist > 0.1) {
        const pen = 1 - cDist / crownPush;
        const pushStr = pen * pen * pen * 0.8;
        this.vx += (cdx / cDist) * pushStr;
        this.vy += (cdy / cDist) * pushStr;
      }
    }

    // Angle tracks velocity direction but with turn rate limit
    // Fish must move forward to turn - can't pivot in place
    const targetAngle = Math.atan2(this.vy, this.vx);
    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const maxTurn = 0.08 + currentSpeed * 0.08;
    this.angle += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
    // Smooth render angle — body visuals lag behind physics heading
    let renderDiff = this.angle - this._renderAngle;
    while (renderDiff > Math.PI) renderDiff -= Math.PI * 2;
    while (renderDiff < -Math.PI) renderDiff += Math.PI * 2;
    this._renderAngle += renderDiff * 0.15;

    // Update chain: joints have inertia — they carry momentum and can't vibrate
    this._joints[0].x = this.x;
    this._joints[0].y = this.y;
    this._maxBendThisFrame = 0;
    for (let j = 1; j <= this._jointCount; j++) {
      const prev = this._joints[j - 1];
      const curr = this._joints[j];
      // Velocity memory — joints carry momentum from last frame
      if (curr.px === undefined) { curr.px = curr.x; curr.py = curr.y; }
      const velX = (curr.x - curr.px);
      const velY = (curr.y - curr.py);
      curr.px = curr.x;
      curr.py = curr.y;
      // Apply damped momentum — tail joints carry more inertia
      const t = j / this._jointCount;
      const inertia = 0.4 + t * 0.3; // 0.4 at head, 0.7 at tail
      curr.x += velX * inertia;
      curr.y += velY * inertia;
      // Pull toward target position behind previous joint
      let dx = curr.x - prev.x;
      let dy = curr.y - prev.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const tx = prev.x + (dx / dist) * this._segLen;
      const ty = prev.y + (dy / dist) * this._segLen;
      const pull = 0.4 - t * 0.15; // 0.4 at head, 0.25 at tail
      curr.x += (tx - curr.x) * pull;
      curr.y += (ty - curr.y) * pull;
      // Distance constraint — keep body length fixed
      dx = curr.x - prev.x;
      dy = curr.y - prev.y;
      dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      curr.x = prev.x + (dx / dist) * this._segLen;
      curr.y = prev.y + (dy / dist) * this._segLen;
      // Gentle bend limit — wide enough to not snap
      if (j >= 2) {
        const pp = this._joints[j - 2];
        const prevAngle = Math.atan2(prev.y - pp.y, prev.x - pp.x);
        const currAngle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        let bend = currAngle - prevAngle;
        while (bend > Math.PI) bend -= Math.PI * 2;
        while (bend < -Math.PI) bend += Math.PI * 2;
        if (Math.abs(bend) > this._maxBendThisFrame) this._maxBendThisFrame = Math.abs(bend);
        const maxBend = 0.207;
        if (Math.abs(bend) > maxBend) {
          const clampedAngle = prevAngle + Math.sign(bend) * maxBend;
          curr.x = prev.x + Math.cos(clampedAngle) * this._segLen;
          curr.y = prev.y + Math.sin(clampedAngle) * this._segLen;
        }
      }
    }
    this.speed = currentSpeed;
  }

  draw(ctx) {
    const segs = this._jointCount;
    const totalLen = this.len;

    // Smoothed swim intensity — heavily damped to prevent erratic tail
    const rawIntensity = Math.min(1, this.speed * 0.6);
    this._swimSmooth += (rawIntensity - this._swimSmooth) * 0.008;
    const si = this._swimSmooth;

    // Undulation phase — moderate speed, capped so it can't flicker
    const phase = this._drawTime * 0.0002 * (0.4 + si * 0.4) + this._phaseOffset;

    // Build spine from world-space joints, using smoothed render angle
    const cosH = Math.cos(-this._renderAngle), sinH = Math.sin(-this._renderAngle);
    const spineX = new Array(segs + 1);
    const spineY = new Array(segs + 1);
    const widths = new Array(segs + 1);

    for (let i = 0; i <= segs; i++) {
      const jx = this._joints[i].x - this.x;
      const jy = this._joints[i].y - this.y;
      // Rotate into local space (head-forward = +X)
      let lx = jx * cosH - jy * sinH;
      let ly = jx * sinH + jy * cosH;

      // Subtle tail-driven undulation - these fish are rigid-bodied
      if (i > 0) {
        const t = i / segs;
        // Only the rear 40% moves appreciably
        const flex = t < 0.6 ? 0 : (t - 0.6) / 0.4;
        const undulAmp = flex * this.len * 0.03 * (0.15 + si * 0.85);
        ly += Math.sin(phase - t * Math.PI * 0.8) * undulAmp;
      }

      spineX[i] = lx;
      spineY[i] = ly;

      // Body width profile - fusiform fish shape
      const tw = i / segs;
      let hw;
      if (tw < 0.08) hw = tw / 0.08 * this.bodyWidth * 0.35;
      else if (tw < 0.25) hw = this.bodyWidth * (0.35 + (tw - 0.08) / 0.17 * 0.65);
      else if (tw < 0.6) hw = this.bodyWidth * (1 - (tw - 0.25) / 0.35 * 0.25);
      else hw = this.bodyWidth * 0.75 * Math.pow(1 - (tw - 0.6) / 0.4, 1.5);
      widths[i] = Math.max(hw, 0.15);
    }
    // Head width
    widths[0] = this.bodyWidth * 0.35;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this._renderAngle);
    // No viewport scaling - fish are consistent size everywhere

    // Compute perpendiculars and outline points
    const rightX = new Array(segs + 1), rightY = new Array(segs + 1);
    const leftX = new Array(segs + 1), leftY = new Array(segs + 1);
    for (let i = 0; i <= segs; i++) {
      let nx, ny;
      if (i === 0) { nx = -(spineY[1] - spineY[0]); ny = spineX[1] - spineX[0]; }
      else if (i === segs) { nx = -(spineY[i] - spineY[i-1]); ny = spineX[i] - spineX[i-1]; }
      else { nx = -(spineY[i+1] - spineY[i-1]); ny = spineX[i+1] - spineX[i-1]; }
      const nLen = Math.sqrt(nx * nx + ny * ny) || 1;
      nx /= nLen; ny /= nLen;
      rightX[i] = spineX[i] + nx * widths[i];
      rightY[i] = spineY[i] + ny * widths[i];
      leftX[i] = spineX[i] - nx * widths[i];
      leftY[i] = spineY[i] - ny * widths[i];
    }

    // Smooth body outline using quadratic curves through midpoints
    ctx.beginPath();
    ctx.moveTo(spineX[0], spineY[0]); // nose tip
    // Right side (head to tail)
    ctx.lineTo(rightX[0], rightY[0]);
    for (let i = 0; i < segs; i++) {
      const mx = (rightX[i] + rightX[i+1]) * 0.5;
      const my = (rightY[i] + rightY[i+1]) * 0.5;
      ctx.quadraticCurveTo(rightX[i], rightY[i], mx, my);
    }
    ctx.lineTo(rightX[segs], rightY[segs]);
    ctx.lineTo(spineX[segs], spineY[segs]); // tail tip
    // Left side (tail back to head)
    ctx.lineTo(leftX[segs], leftY[segs]);
    for (let i = segs; i > 0; i--) {
      const mx = (leftX[i] + leftX[i-1]) * 0.5;
      const my = (leftY[i] + leftY[i-1]) * 0.5;
      ctx.quadraticCurveTo(leftX[i], leftY[i], mx, my);
    }
    ctx.lineTo(leftX[0], leftY[0]);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    // Dorsal stripe - lighter ridge down the spine
    ctx.beginPath();
    ctx.moveTo(spineX[1], spineY[1]);
    for (let i = 2; i < segs - 1; i++) {
      const mx = (spineX[i] + spineX[i+1]) * 0.5;
      const my = (spineY[i] + spineY[i+1]) * 0.5;
      ctx.quadraticCurveTo(spineX[i], spineY[i], mx, my);
    }
    ctx.strokeStyle = this.bellyColor;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = this.bodyWidth * 0.35;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Caudal (tail) fin - simple fan shape following the last segment
    const tsi = segs;
    const tailDir = Math.atan2(spineY[tsi] - spineY[tsi-1], spineX[tsi] - spineX[tsi-1]);
    const tailSpread = this.bodyWidth * 1.4;
    const tailLen = totalLen * 0.15;
    const tPx = -Math.sin(tailDir), tPy = Math.cos(tailDir);
    ctx.beginPath();
    // Fan from the tail tip: base at spine end, spreads perpendicular
    ctx.moveTo(rightX[tsi], rightY[tsi]);
    ctx.quadraticCurveTo(
      spineX[tsi] + Math.cos(tailDir) * tailLen + tPx * tailSpread * 0.4,
      spineY[tsi] + Math.sin(tailDir) * tailLen + tPy * tailSpread * 0.4,
      spineX[tsi] + Math.cos(tailDir) * tailLen,
      spineY[tsi] + Math.sin(tailDir) * tailLen
    );
    ctx.quadraticCurveTo(
      spineX[tsi] + Math.cos(tailDir) * tailLen - tPx * tailSpread * 0.4,
      spineY[tsi] + Math.sin(tailDir) * tailLen - tPy * tailSpread * 0.4,
      leftX[tsi], leftY[tsi]
    );
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Pectoral fins - angled back from the widest part of the body
    const pIdx = Math.round(segs * 0.28);
    const finLen = totalLen * 0.16;
    for (const side of [-1, 1]) {
      const bx = side === 1 ? rightX[pIdx] : leftX[pIdx];
      const by = side === 1 ? rightY[pIdx] : leftY[pIdx];
      const bodyDir = Math.atan2(spineY[pIdx] - spineY[pIdx+1], spineX[pIdx] - spineX[pIdx+1]);
      const finDir = bodyDir + side * 0.7;
      const tipX = bx + Math.cos(finDir) * finLen;
      const tipY = by + Math.sin(finDir) * finLen;
      const endX = bx + Math.cos(bodyDir) * finLen * 0.4;
      const endY = by + Math.sin(bodyDir) * finLen * 0.4;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(tipX, tipY, endX, endY);
      ctx.closePath();
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Eyes - two dots near head, each side of the spine
    const eIdx = Math.round(segs * 0.12);
    const eyeR = Math.max(totalLen * 0.03, 0.4);
    const eyeOff = widths[eIdx] * 0.5;
    for (const side of [-1, 1]) {
      const enx = -(spineY[eIdx+1] - spineY[eIdx]);
      const eny = spineX[eIdx+1] - spineX[eIdx];
      const eLen = Math.sqrt(enx * enx + eny * eny) || 1;
      ctx.beginPath();
      ctx.arc(
        spineX[eIdx] + (enx / eLen) * eyeOff * side,
        spineY[eIdx] + (eny / eLen) * eyeOff * side,
        eyeR, 0, Math.PI * 2
      );
      ctx.fillStyle = '#222';
      ctx.fill();
    }

    // Sun glint — rare bright flash when fish twists in sunlight
    let angleDelta = this.angle - this._prevAngle;
    while (angleDelta > Math.PI) angleDelta -= Math.PI * 2;
    while (angleDelta < -Math.PI) angleDelta += Math.PI * 2;
    this._prevAngle = this.angle;
    const turning = Math.abs(angleDelta) > 0.03;
    const active = this.speed > 1.2 || turning || this.fleeing || this._biting;
    this._glint -= 0.016; // roughly 1 frame at 60fps
    if (this._glint <= 0 && active && Math.random() < 0.008) {
      const sun = getSunlight(this.x, this.y);
      if (sun > 0.5) {
        this._glint = 0.06 + Math.random() * 0.06; // 60-120ms flash
        this._glintSeg = 1 + Math.floor(Math.random() * (segs - 2));
      }
    }
    if (this._glint > 0) {
      const gi = this._glintSeg;
      const gx = spineX[gi], gy = spineY[gi];
      const gr = widths[gi] * 1.8;
      const gAlpha = Math.min(1, this._glint * 12); // fast fade
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = gAlpha * 0.7;
      const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      gg.addColorStop(0, 'rgba(255, 255, 240, 1)');
      gg.addColorStop(0.4, 'rgba(220, 240, 255, 0.5)');
      gg.addColorStop(1, 'rgba(200, 230, 255, 0)');
      ctx.fillStyle = gg;
      ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      ctx.restore();
    }

    // Belly flash — only when fleeing with body bend at 90%+ of max
    this._bellyFlash -= 0.028; // 15% faster decay
    const bendThreshold = 0.207 * 0.9; // 90% of max body bend
    if (this._bellyFlash <= 0 && this.fleeing && this._maxBendThisFrame > bendThreshold && Math.random() < 0.008) {
      this._bellyFlash = 0.06 + Math.random() * 0.04; // 60-100ms flash (15% shorter)
    }
    if (this._bellyFlash > 0) {
      const flashAlpha = Math.min(1, this._bellyFlash * 12) * 0.5;
      const midSeg = Math.floor(segs * 0.3);
      const midX = spineX[midSeg], midY = spineY[midSeg];
      // Outer hazy glow — larger than the fish
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = flashAlpha * 0.35;
      const glowR = widths[midSeg] * 6;
      const haze = ctx.createRadialGradient(midX, midY, 0, midX, midY, glowR);
      haze.addColorStop(0, 'rgba(230, 245, 255, 1)');
      haze.addColorStop(0.4, 'rgba(200, 230, 250, 0.4)');
      haze.addColorStop(1, 'rgba(200, 230, 250, 0)');
      ctx.fillStyle = haze;
      ctx.fillRect(midX - glowR, midY - glowR, glowR * 2, glowR * 2);
      ctx.restore();
      // Sharp body flash along the spine
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = flashAlpha;
      const from = 1, to = Math.floor(segs * 0.6);
      ctx.beginPath();
      ctx.moveTo(spineX[from], spineY[from]);
      for (let si = from; si <= to; si++) {
        ctx.lineTo(spineX[si], spineY[si]);
      }
      ctx.lineWidth = widths[midSeg] * 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255, 255, 245, 1)';
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}

// Reef fish — small bright blue fish that live around reefs
class ReefFish {
  constructor(reef) {
    this.reef = reef;
    this.homeReef = reef; // remember original home
    // Start near the reef edge
    const a = Math.random() * Math.PI * 2;
    const dist = reef.baseR * (0.4 + Math.random() * 0.3);
    this.x = reef.x + Math.cos(a) * dist;
    this.y = reef.y + Math.sin(a) * dist;
    this.angle = a + Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
    this._renderAngle = this.angle;

    const mobileScale = w < 500 ? 0.75 : 1;
    const vpSizeBoost = 1 + Math.min(0.5, (viewScale - 1) * 0.5);
    this.scale = mobileScale * vpSizeBoost;
    // Quarter size of tuna
    this.len = (3.5 + Math.random() * 2) * this.scale;
    this.bodyWidth = this.len * (0.06 + Math.random() * 0.02);

    this.speed = 0.3 + Math.random() * 0.3;
    this.baseSpeed = this.speed;
    this.vx = Math.cos(this.angle) * this.speed * 0.5;
    this.vy = Math.sin(this.angle) * this.speed * 0.5;

    this.depth = 0.15 + Math.random() * 0.2;
    this.depthAlpha = 1 - this.depth * 0.3;

    // Vibrant tang blue, ~10% chance of red
    const bj = () => Math.round((Math.random() - 0.5) * 12);
    if (Math.random() < 0.1) {
      this.color = `rgb(${200+bj()},${45+bj()},${35+bj()})`;
      this.bellyColor = `rgb(${230+bj()},${90+bj()},${70+bj()})`;
    } else {
      this.color = `rgb(${20+bj()},${80+bj()},${245+bj()})`;
      this.bellyColor = `rgb(${60+bj()},${140+bj()},${255})`;
    }

    this._phaseOffset = Math.random() * Math.PI * 2;
    this._joints = [];
    const numJoints = 6;
    this._segLen = this.len / numJoints;
    for (let j = 0; j <= numJoints; j++) {
      this._joints.push({
        x: this.x - Math.cos(this.angle) * j * this._segLen,
        y: this.y - Math.sin(this.angle) * j * this._segLen,
      });
    }

    // Wander state - picks nearby points around the reef to swim to
    this._wanderAngle = Math.random() * Math.PI * 2;
    this._wanderTimer = 1 + Math.random() * 3;
    this.fleeing = false;
    this.fleeTimer = 0;
    // When startled far from home, can adopt a new nearby reef
    this._displaced = false;
    this._returnTimer = 0; // counts up while displaced, eventually drifts home
  }

  update(dt, fish, time) {
    const rf = this.reef;

    // Flee from predators — can push fish away from their home reef
    if (this.fleeTimer > 0) this.fleeTimer -= dt;
    else this.fleeing = false;
    for (const pred of predators) {
      const pdx = this.x - pred.x, pdy = this.y - pred.y;
      const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
      if (pDist < 80 && pDist > 0.1) {
        const force = 0.25 * (1 - pDist / 80);
        this.vx += (pdx / pDist) * force;
        this.vy += (pdy / pDist) * force;
        this.fleeing = true;
        this.fleeTimer = 1.2 + Math.random() * 0.8; // longer flee so they actually leave
      }
    }

    // Flee from mouse
    if (mouse.active) {
      const mdx = this.x - mouse.x, mdy = this.y - mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      const fleeR = 50;
      if (mDist < fleeR && mDist > 0.1) {
        const force = 0.2 * (1 - mDist / fleeR);
        this.vx += (mdx / mDist) * force;
        this.vy += (mdy / mDist) * force;
        this.fleeing = true;
        this.fleeTimer = 0.8 + Math.random() * 0.5;
      }
    }

    // Check if displaced far from current reef — maybe adopt a closer one
    const homeDx = this.x - rf.x, homeDy = this.y - rf.y;
    const homeDist = Math.sqrt(homeDx * homeDx + homeDy * homeDy);
    if (homeDist > rf.baseR * 2.5 && this.fleeing) {
      // Look for a nearby reef to shelter at instead of rubber-banding home
      let closest = null, closestDist = Infinity;
      for (const candidate of reefs) {
        if (candidate === rf) continue;
        const cdx = this.x - candidate.x, cdy = this.y - candidate.y;
        const cd = Math.sqrt(cdx * cdx + cdy * cdy);
        // Only adopt reefs that are actually closer and within reasonable range
        if (cd < closestDist && cd < candidate.baseR * 3) {
          closest = candidate;
          closestDist = cd;
        }
      }
      if (closest) {
        this.reef = closest;
        this._displaced = true;
        this._returnTimer = 0;
        this._wanderAngle = Math.atan2(this.y - closest.y, this.x - closest.x);
      }
    }

    // If displaced, slowly build desire to return home (over 15-30s)
    if (this._displaced) {
      this._returnTimer += dt;
      if (this._returnTimer > 15 + Math.random() * 15) {
        this.reef = this.homeReef;
        this._displaced = false;
        this._returnTimer = 0;
      }
    }

    // When not fleeing, gently orbit the current reef
    if (!this.fleeing) {
      // Gentle wander — slowly drift the target angle, don't jump
      this._wanderAngle += (Math.sin(time * 0.0004 + this._phaseOffset) * 0.3
                          + Math.sin(time * 0.00017 + this._phaseOffset * 2.3) * 0.15) * dt;

      // Target point: hover near the reef edge
      const curReef = this.reef;
      const orbitR = curReef.baseR * (0.5 + Math.sin(time * 0.0002 + this._phaseOffset) * 0.1);
      const targetX = curReef.x + Math.cos(this._wanderAngle) * orbitR;
      const targetY = curReef.y + Math.sin(this._wanderAngle) * orbitR;
      const tdx = targetX - this.x, tdy = targetY - this.y;
      const tDist = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
      // Pull strength scales with distance — gentle when close, firmer when far
      const pullStr = this._displaced ? 0.012 : 0.008; // slightly stronger pull to new reef
      const pull = Math.min(tDist * 0.001, pullStr);
      this.vx += (tdx / tDist) * pull;
      this.vy += (tdy / tDist) * pull;
    }

    // Damping — reef fish drift, they don't jet
    this.vx *= 0.97;
    this.vy *= 0.97;

    // Soft leash — only pulls when really far, and gently
    const curReef = this.reef;
    const ldx = this.x - curReef.x, ldy = this.y - curReef.y;
    const lDist = Math.sqrt(ldx * ldx + ldy * ldy);
    const maxDist = curReef.baseR * (this.fleeing ? 3.0 : 1.8);
    if (lDist > maxDist && !this.fleeing) {
      const pullBack = (lDist - maxDist) * 0.02; // gentler than before
      this.vx -= (ldx / lDist) * pullBack;
      this.vy -= (ldy / lDist) * pullBack;
    }

    // Avoid the crown (solid rock) of current reef
    const cdx = this.x - (curReef.x + curReef.crownOffX);
    const cdy = this.y - (curReef.y + curReef.crownOffY);
    const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
    const cAngle = Math.atan2(cdy, cdx);
    const crownR = curReef.radiusAt(cAngle, curReef.crownRadii) + this.len;
    if (cDist < crownR && cDist > 0.1) {
      const push = (1 - cDist / crownR) * 0.15;
      this.vx += (cdx / cDist) * push;
      this.vy += (cdy / cDist) * push;
    }

    // Speed control — reef fish potter about, burst when scared
    const scaledSpeed = this.baseSpeed * (1 + (viewScale - 1) * 0.8);
    const targetSpeed = this.fleeing ? scaledSpeed * 2.5 : scaledSpeed * 0.5;
    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > 0.01) {
      const desired = currentSpeed + (targetSpeed - currentSpeed) * 0.08;
      const ratio = desired / currentSpeed;
      this.vx *= ratio;
      this.vy *= ratio;
    }

    // Forward-only constraint — reef fish can't swim backward
    const headX = Math.cos(this.angle), headY = Math.sin(this.angle);
    const fwdSpeed = this.vx * headX + this.vy * headY;
    const latSpeed = this.vx * (-headY) + this.vy * headX;
    // Kill lateral drift
    this.vx -= (-headY) * latSpeed * 0.5;
    this.vy -= headX * latSpeed * 0.5;
    // Prevent backward movement
    if (fwdSpeed < 0) {
      this.vx -= headX * fwdSpeed * 0.8;
      this.vy -= headY * fwdSpeed * 0.8;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Angle tracking — responsive turns so fish faces where it's going
    const targetAngle = Math.atan2(this.vy, this.vx);
    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += Math.max(-0.1, Math.min(0.1, angleDiff));
    let renderDiff = this.angle - this._renderAngle;
    while (renderDiff > Math.PI) renderDiff -= Math.PI * 2;
    while (renderDiff < -Math.PI) renderDiff += Math.PI * 2;
    this._renderAngle += renderDiff * 0.14;

    // Chain update
    this._joints[0].x = this.x;
    this._joints[0].y = this.y;
    for (let i = 1; i < this._joints.length; i++) {
      const prev = this._joints[i - 1];
      const curr = this._joints[i];
      const jdx = curr.x - prev.x, jdy = curr.y - prev.y;
      const jDist = Math.sqrt(jdx * jdx + jdy * jdy) || 1;
      curr.x = prev.x + (jdx / jDist) * this._segLen;
      curr.y = prev.y + (jdy / jDist) * this._segLen;
    }
  }

  draw(ctx) {
    // Reuse the Fish draw logic but simpler — small bright body
    const segs = this._joints.length - 1;
    const totalLen = this.len;
    const spineX = [], spineY = [], widths = [];

    for (let i = 0; i <= segs; i++) {
      const lx = this._joints[i].x - this.x;
      const ly = this._joints[i].y - this.y;
      spineX[i] = lx;
      spineY[i] = ly;
      const tw = i / segs;
      let hw;
      if (tw < 0.1) hw = tw / 0.1 * this.bodyWidth * 0.4;
      else if (tw < 0.3) hw = this.bodyWidth * (0.4 + (tw - 0.1) / 0.2 * 0.6);
      else if (tw < 0.6) hw = this.bodyWidth * (1 - (tw - 0.3) / 0.3 * 0.2);
      else hw = this.bodyWidth * 0.8 * Math.pow(1 - (tw - 0.6) / 0.4, 1.5);
      widths[i] = Math.max(hw, 0.1);
    }
    widths[0] = this.bodyWidth * 0.35;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this._renderAngle);

    // Body outline
    const rightX = [], rightY = [], leftX = [], leftY = [];
    for (let i = 0; i <= segs; i++) {
      let nx, ny;
      if (i === 0) { nx = -(spineY[1] - spineY[0]); ny = spineX[1] - spineX[0]; }
      else if (i === segs) { nx = -(spineY[i] - spineY[i-1]); ny = spineX[i] - spineX[i-1]; }
      else { nx = -(spineY[i+1] - spineY[i-1]); ny = spineX[i+1] - spineX[i-1]; }
      const nLen = Math.sqrt(nx * nx + ny * ny) || 1;
      nx /= nLen; ny /= nLen;
      rightX[i] = spineX[i] + nx * widths[i];
      rightY[i] = spineY[i] + ny * widths[i];
      leftX[i] = spineX[i] - nx * widths[i];
      leftY[i] = spineY[i] - ny * widths[i];
    }

    ctx.beginPath();
    ctx.moveTo(spineX[0], spineY[0]);
    ctx.lineTo(rightX[0], rightY[0]);
    for (let i = 0; i < segs; i++) ctx.quadraticCurveTo(rightX[i], rightY[i], (rightX[i]+rightX[i+1])*0.5, (rightY[i]+rightY[i+1])*0.5);
    ctx.lineTo(rightX[segs], rightY[segs]);
    ctx.lineTo(spineX[segs], spineY[segs]);
    ctx.lineTo(leftX[segs], leftY[segs]);
    for (let i = segs; i > 0; i--) ctx.quadraticCurveTo(leftX[i], leftY[i], (leftX[i]+leftX[i-1])*0.5, (leftY[i]+leftY[i-1])*0.5);
    ctx.lineTo(leftX[0], leftY[0]);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    // Tail fin
    const tsi = segs;
    const tailDir = Math.atan2(spineY[tsi]-spineY[tsi-1], spineX[tsi]-spineX[tsi-1]);
    const tailSpread = this.bodyWidth * 1.2;
    const tailLen = totalLen * 0.12;
    const tPx = -Math.sin(tailDir), tPy = Math.cos(tailDir);
    ctx.beginPath();
    ctx.moveTo(rightX[tsi], rightY[tsi]);
    ctx.quadraticCurveTo(spineX[tsi]+Math.cos(tailDir)*tailLen+tPx*tailSpread*0.4, spineY[tsi]+Math.sin(tailDir)*tailLen+tPy*tailSpread*0.4, spineX[tsi]+Math.cos(tailDir)*tailLen, spineY[tsi]+Math.sin(tailDir)*tailLen);
    ctx.quadraticCurveTo(spineX[tsi]+Math.cos(tailDir)*tailLen-tPx*tailSpread*0.4, spineY[tsi]+Math.sin(tailDir)*tailLen-tPy*tailSpread*0.4, leftX[tsi], leftY[tsi]);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Eye dots
    const eIdx = Math.round(segs * 0.15);
    const eyeR = Math.max(totalLen * 0.04, 0.3);
    const eyeOff = widths[eIdx] * 0.5;
    for (const side of [-1, 1]) {
      const enx = -(spineY[Math.min(eIdx+1,segs)] - spineY[eIdx]);
      const eny = spineX[Math.min(eIdx+1,segs)] - spineX[eIdx];
      const eLen = Math.sqrt(enx*enx+eny*eny) || 1;
      ctx.beginPath();
      ctx.arc(spineX[eIdx]+(enx/eLen)*eyeOff*side, spineY[eIdx]+(eny/eLen)*eyeOff*side, eyeR, 0, Math.PI*2);
      ctx.fillStyle = '#222';
      ctx.fill();
    }

    ctx.restore();
  }
}

// Starfish - small benthic creatures that cling to rocks and creep slowly
class Starfish {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2; // body rotation
    const mobileScale = Math.min(w, h) < 500 ? 0.7 : 1;
    const vpBoost = 1 + Math.min(0.4, (viewScale - 1) * 0.4);
    this.scale = mobileScale * vpBoost;
    this.size = (2.8 + Math.random() * 2.1) * this.scale; // arm length from center
    this.arms = 5;

    // Each arm has slight length/width variation for organic look
    this._armLengths = [];
    this._armWidths = [];
    for (let i = 0; i < this.arms; i++) {
      this._armLengths.push(this.size * (0.85 + Math.random() * 0.3));
      this._armWidths.push(this.size * (0.28 + Math.random() * 0.08));
    }

    // Color - ochre/orange/rust/purple range, tinted toward the water (rgb 30,117,133)
    // so they look submerged rather than sitting on top of the scene
    const palettes = [
      { body: [180, 90, 45], highlight: [210, 120, 65] },   // ochre
      { body: [190, 75, 35], highlight: [220, 105, 55] },    // rust
      { body: [160, 55, 80], highlight: [190, 80, 110] },    // purple
      { body: [200, 110, 50], highlight: [230, 145, 75] },   // orange
      { body: [140, 70, 55], highlight: [170, 95, 75] },     // dark brown
    ];
    const pal = palettes[Math.floor(Math.random() * palettes.length)];
    const jit = () => Math.round((Math.random() - 0.5) * 12);
    // Blend ~35% toward the caribbean water color to mute them underwater
    const waterR = 30, waterG = 117, waterB = 133;
    const tint = 0.35;
    const tb = (v, wv) => Math.round(v * (1 - tint) + wv * tint);
    this.bodyColor = `rgb(${tb(pal.body[0],waterR)+jit()},${tb(pal.body[1],waterG)+jit()},${tb(pal.body[2],waterB)+jit()})`;
    this.highlightColor = `rgb(${tb(pal.highlight[0],waterR)+jit()},${tb(pal.highlight[1],waterG)+jit()},${tb(pal.highlight[2],waterB)+jit()})`;

    // Movement - very slow creeping with pauses
    this.speed = 0.008 + Math.random() * 0.012; // extremely slow
    this.moveAngle = Math.random() * Math.PI * 2; // direction of travel
    this.vx = 0;
    this.vy = 0;

    // State: 'resting' or 'creeping'
    this.state = Math.random() < 0.6 ? 'resting' : 'creeping';
    this.stateTimer = 3 + Math.random() * 15; // seconds until state change
    this._turnRate = 0; // gentle turning while creeping

    // Depth - starfish sit on the bottom
    this.depth = 0.05 + Math.random() * 0.1;
    this.depthAlpha = 0.85 + this.depth * 0.1;

    // Subtle arm animation phase
    this._phase = Math.random() * Math.PI * 2;

    // Home reef (if any) - starfish prefer to stay near their home
    this.homeX = x;
    this.homeY = y;
    this.roamRadius = 30 + Math.random() * 50; // how far they'll wander from home
  }

  update(dt, time) {
    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      // Toggle state
      if (this.state === 'resting') {
        this.state = 'creeping';
        this.stateTimer = 4 + Math.random() * 12;
        // Pick a new direction, biased toward home if far away
        const dx = this.homeX - this.x, dy = this.homeY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.roamRadius * 0.7) {
          // Bias toward home
          this.moveAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
        } else {
          this.moveAngle = Math.random() * Math.PI * 2;
        }
        this._turnRate = (Math.random() - 0.5) * 0.003; // gentle arc
      } else {
        this.state = 'resting';
        this.stateTimer = 5 + Math.random() * 20;
      }
    }

    if (this.state === 'creeping') {
      this.moveAngle += this._turnRate;
      const scaledSpeed = this.speed * (1 + (viewScale - 1) * 0.5);
      this.vx = Math.cos(this.moveAngle) * scaledSpeed;
      this.vy = Math.sin(this.moveAngle) * scaledSpeed;
      // Tiny tidal drift
      this.vx += Math.cos(tide.angle) * tide.strength * 0.0005;
      this.vy += Math.sin(tide.angle) * tide.strength * 0.0005;
      // Body rotation slowly aligns with movement
      let angleDiff = this.moveAngle - this.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.angle += angleDiff * 0.005;
    } else {
      this.vx *= 0.9;
      this.vy *= 0.9;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Stay in bounds with soft bounce
    const margin = this.size * 2;
    if (this.x < margin) { this.x = margin; this.moveAngle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; }
    if (this.x > w - margin) { this.x = w - margin; this.moveAngle = Math.PI + (Math.random() - 0.5) * 0.5; }
    if (this.y < margin) { this.y = margin; this.moveAngle = Math.PI * 0.5 + (Math.random() - 0.5) * 0.5; }
    if (this.y > h - margin) { this.y = h - margin; this.moveAngle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.5; }

    // Avoid reef crowns - creep around emerged rock
    for (const rf of reefs) {
      if (rf.submerged) continue;
      const cdx = this.x - (rf.x + rf.crownOffX);
      const cdy = this.y - (rf.y + rf.crownOffY);
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      const cAngle = Math.atan2(cdy, cdx);
      const crownEdge = rf.radiusAt(cAngle, rf.crownRadii) + this.size;
      if (cDist < crownEdge && cDist > 0.1) {
        this.x = rf.x + rf.crownOffX + (cdx / cDist) * crownEdge;
        this.y = rf.y + rf.crownOffY + (cdy / cDist) * crownEdge;
        // Redirect along the edge
        this.moveAngle = cAngle + (Math.random() < 0.5 ? 0.5 : -0.5);
      }
    }

    this._phase = time * 0.0003;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const arms = this.arms;
    const armAngle = (Math.PI * 2) / arms;

    // Draw each arm
    for (let i = 0; i < arms; i++) {
      const a = armAngle * i;
      const armLen = this._armLengths[i] + Math.sin(this._phase + i * 1.3) * this.size * 0.03;
      const armW = this._armWidths[i];

      ctx.save();
      ctx.rotate(a);

      // Arm shape - tapered with slight curve
      ctx.beginPath();
      ctx.moveTo(armW * 0.5, 0);
      // Right side of arm - curves outward slightly
      ctx.quadraticCurveTo(armW * 0.55, armLen * 0.4, armW * 0.2, armLen * 0.85);
      // Rounded tip
      ctx.quadraticCurveTo(0, armLen * 1.05, -armW * 0.2, armLen * 0.85);
      // Left side
      ctx.quadraticCurveTo(-armW * 0.55, armLen * 0.4, -armW * 0.5, 0);
      ctx.closePath();

      ctx.fillStyle = this.bodyColor;
      ctx.fill();

      // Center ridge / highlight stripe down each arm
      ctx.beginPath();
      ctx.moveTo(0, this.size * 0.15);
      ctx.lineTo(armW * 0.08, armLen * 0.7);
      ctx.lineTo(0, armLen * 0.85);
      ctx.lineTo(-armW * 0.08, armLen * 0.7);
      ctx.closePath();
      ctx.fillStyle = this.highlightColor;
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Tiny texture dots along the arm (tube feet / bumps)
      for (let d = 0; d < 3; d++) {
        const dy = armLen * (0.25 + d * 0.22);
        const dotR = armW * 0.06;
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(side * armW * 0.22, dy, dotR, 0, Math.PI * 2);
          ctx.fillStyle = this.highlightColor;
          ctx.globalAlpha = 0.35;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();
    }

    // Central disc
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = this.bodyColor;
    ctx.fill();
    // Disc highlight
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = this.highlightColor;
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}

// Predator fish - larger, hunts small fish based on hunger
class Predator {
  constructor() {
    // Start inside the viewport, cruising gently
    this.x = w * (0.2 + Math.random() * 0.6);
    this.y = h * (0.2 + Math.random() * 0.6);
    this.angle = Math.random() * Math.PI * 2;

    this.len = (52 + Math.random() * 19.5) * (w < 500 ? 0.8 : 1);
    this.bodyWidth = this.len * 0.055; // sleek barracuda profile
    this.speed = 0.7 + Math.random() * 0.4;
    this.baseSpeed = this.speed;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    this.depth = 0.05 + Math.random() * 0.12;
    this.depthAlpha = 1 - this.depth * 0.3;
    this.color = 'rgb(55, 95, 100)';
    this.bellyColor = 'rgb(140, 170, 165)';

    // Hunger: 0 = full, 1 = starving. Threshold varies per fish
    this.hunger = 0.2 + Math.random() * 0.2;
    this._hungerRate = 0.0032 + Math.random() * 0.0032; // variable metabolism — slow burn
    this._huntThreshold = 0.4 + Math.random() * 0.25; // some hunt sooner than others
    this.hunting = false;
    this.target = null;
    this.burstTimer = 0;
    this.digestTimer = 0;
    // Chomp animation state
    this.chomping = false;
    this.chompTimer = 0;
    this.chompPhase = 0;
    // Tail flick on burst — brief powerful lateral tail sweep
    this._burstFlick = 0; // 0 = no flick, decays from 1.0
    this._burstFlickDir = 1; // which side the tail kicks to
    this._retargetCooldown = 0; // pause between giving up and picking a new target

    const numJoints = 12;
    this._jointCount = numJoints;
    this._segLen = this.len / numJoints;
    this._joints = [];
    for (let j = 0; j <= numJoints; j++) {
      const jx = this.x - Math.cos(this.angle) * j * this._segLen;
      const jy = this.y - Math.sin(this.angle) * j * this._segLen;
      this._joints.push({ x: jx, y: jy, px: jx, py: jy });
    }
    this._phaseOffset = Math.random() * Math.PI * 20;
    this._swimSmooth = 0.3;
    this._renderAngle = this.angle;
    this._spawnFrames = 30; // frames of strong straightening at spawn
    // Head-snap: occasional quick direction change
    this._snapTimer = 5 + Math.random() * 12;
    this._snapAngle = 0;
    this._snapping = false;
  }

  update(dt, smallFish, time) {
    this._drawTime = time;
    this.hunger = Math.min(1, this.hunger + dt * this._hungerRate);

    if (this.digestTimer > 0) {
      this.digestTimer -= dt;
      this.hunting = false;
      this.target = null;
    }
    // Chomp animation countdown
    if (this.chomping) {
      const prevJaw = Math.sin(this.chompPhase * 0.8);
      this.chompPhase += dt * 14;
      this.chompTimer -= dt;
      // Spit out scales each time jaw flares open
      const curJaw = Math.sin(this.chompPhase * 0.8);
      if (prevJaw <= 0 && curJaw > 0) {
        const mx = this.x + Math.cos(this.angle) * this.len * 0.05;
        const my = this.y + Math.sin(this.angle) * this.len * 0.05;
        const count = 2 + Math.floor(Math.random() * 3);
        for (let k = 0; k < count; k++) {
          const a = this.angle + (Math.random() - 0.5) * 1.2;
          const spd = 0.8 + Math.random() * 1.5;
          killFx.push({
            x: mx + Math.cos(a) * 4, y: my + Math.sin(a) * 4,
            vx: Math.cos(a) * spd + this.vx * 0.3,
            vy: Math.sin(a) * spd + this.vy * 0.3,
            type: 'scale', life: 1, maxLife: 1 + Math.random() * 1.5,
            size: 0.4 + Math.random() * 1.2,
            color: 'rgb(160,170,180)',
            sparkle: Math.random() * Math.PI * 2,
          });
        }
      }
      if (this.chompTimer <= 0) this.chomping = false;
    }

    this.hunting = this.hunger > this._huntThreshold && this.digestTimer <= 0;

    if (this.hunting) {
      const mouthX = this.x + Math.cos(this.angle) * this.len * 0.05;
      const mouthY = this.y + Math.sin(this.angle) * this.len * 0.05;
      const cosA = Math.cos(this.angle), sinA = Math.sin(this.angle);
      const urgency = Math.min(1, (this.hunger - 0.4) * 1.67);

      // Find nearest school cluster to cruise toward
      let crowdX = 0, crowdY = 0, crowdN = 0;
      for (const f of getNeighbors(this.x, this.y)) {
        const dx = f.x - this.x, dy = f.y - this.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 300 * 300) { crowdX += f.x; crowdY += f.y; crowdN++; }
      }

      // Target management — commit hard to chases, don't give up easily
      if (this.target && !smallFish.includes(this.target)) this.target = null;
      if (this.target) {
        const td = Math.sqrt((this.target.x - this.x) ** 2 + (this.target.y - this.y) ** 2);
        // Only give up if target is very far — shark-like persistence
        if (td > 300 * viewScale) {
          this.target = null;
          this.burstTimer = 0;
          // Brief cooldown before picking a new target
          this._retargetCooldown = 1.5 + Math.random() * 2;
        }
      }

      // Retarget cooldown — don't instantly lock onto something new after giving up
      if (this._retargetCooldown > 0) this._retargetCooldown -= dt;

      // Pick a target: prefer isolated fish ahead of us, not too close (need a chase)
      if (!this.target && (this._retargetCooldown || 0) <= 0 && Math.random() < 0.03) {
        let best = null;
        let bestScore = Infinity;
        for (const f of getNeighbors(this.x, this.y)) {
          const dx = f.x - this.x, dy = f.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 220 * viewScale || dist < 25 * viewScale) continue;
          const ahead = dx * cosA + dy * sinA;
          if (ahead < -20) continue; // allow slightly behind too
          let nearbyFriends = 0;
          for (const other of getNeighbors(f.x, f.y)) {
            if (other === f) continue;
            const odx = other.x - f.x, ody = other.y - f.y;
            if (odx * odx + ody * ody < 30 * 30) nearbyFriends++;
          }
          const isolationBonus = nearbyFriends < 3 ? -50 : nearbyFriends * 10;
          const score = dist + isolationBonus;
          if (score < bestScore) { bestScore = score; best = f; }
        }
        if (best) {
          this.target = best;
          // Initial attack dash — burst toward the target with tail flick
          this.burstTimer = 0.7;
          this._burstFlick = 1.0;
          this._burstFlickDir = Math.random() < 0.5 ? 1 : -1;
        }
      }

      if (this.target) {
        // Opportunistic switch — if another fish blunders closer, take the easy meal
        const mDx = this.target.x - mouthX, mDy = this.target.y - mouthY;
        const targetDist = Math.sqrt(mDx * mDx + mDy * mDy);
        for (const f of getNeighbors(this.x, this.y)) {
          if (f === this.target) continue;
          const fdx = f.x - mouthX, fdy = f.y - mouthY;
          const fDist = Math.sqrt(fdx * fdx + fdy * fdy);
          // Must be ahead of the predator and much closer than current target
          const aheadDot = fdx * cosA + fdy * sinA;
          if (fDist < 50 * viewScale && fDist < targetDist * 0.5 && aheadDot > 0) {
            this.target = f;
            this.burstTimer = 0.5;
            this._burstFlick = 0.8;
            this._burstFlickDir = -this._burstFlickDir;
            break;
          }
        }

        // Shark-like pursuit — relentless, adjusts course, multiple attack dashes
        const dx = this.target.x - this.x, dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pursuitAngle = Math.atan2(dy, dx);

        // Detect orbiting: target is close but at a steep angle to our heading
        const headCos = Math.cos(this.angle), headSin = Math.sin(this.angle);
        const ahead = (dx * headCos + dy * headSin) / (dist || 1);
        // If close and target is behind/beside us, we've overshot — abandon
        if (dist < 80 * viewScale && ahead < 0.1) {
          this.target = null;
          this.burstTimer = 0;
          this._retargetCooldown = 1.0 + Math.random() * 1.5;
        } else {
        // Aggressive ramp: faster base chase, harder steering at close range
        const closeness = Math.max(0, 1 - dist / (220 * viewScale));
        const chaseSpeed = this.baseSpeed * (2.8 + closeness * 2.5) * viewScale;
        const steer = 0.08 + closeness * 0.2;
        this.vx += (Math.cos(pursuitAngle) * chaseSpeed - this.vx) * steer;
        this.vy += (Math.sin(pursuitAngle) * chaseSpeed - this.vy) * steer;

        // Attack dashes — repeated lunges, not just one final burst
        // Can miss and re-commit, like a shark making multiple passes
        if (dist < 60 * viewScale && this.burstTimer <= 0) {
          this.burstTimer = 0.7 + Math.random() * 0.4;
          this._burstFlick = 1.0;
          this._burstFlickDir = Math.random() < 0.5 ? 1 : -1;
        }
        // After a burst ends, brief pause then re-engage if still close
        if (this.burstTimer <= 0 && dist < 100 * viewScale && Math.random() < 0.02) {
          this.burstTimer = 0.3;
          this._burstFlick = 0.6;
          this._burstFlickDir = -this._burstFlickDir;
        }
        } // end else (not orbiting)
      } else if (crowdN > 0) {
        // Cruising toward fish — more purposeful than before
        const cx = crowdX / crowdN, cy = crowdY / crowdN;
        const toSchoolAngle = Math.atan2(cy - this.y, cx - this.x);
        const steer = 0.008 + urgency * 0.012;
        this.vx += (Math.cos(toSchoolAngle) * this.baseSpeed * 0.8 * viewScale - this.vx) * steer;
        this.vy += (Math.sin(toSchoolAngle) * this.baseSpeed * 0.8 * viewScale - this.vy) * steer;
      }

      // Catch — must be very close and moving fast, but fish can dodge
      let prey = null;
      if (this.target) {
        const td = Math.sqrt((this.target.x - mouthX) ** 2 + (this.target.y - mouthY) ** 2);
        const mySpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (td < 10 && mySpeed > this.baseSpeed * 2.5 * viewScale) prey = this.target;
      }
      if (prey) {
        const idx = smallFish.indexOf(prey);
        if (idx >= 0) smallFish.splice(idx, 1);
        this.hunger = Math.max(0, this.hunger - 0.45);
        this.digestTimer = 4 + Math.random() * 12;
        this.target = null;
        this.hunting = false;
        this.chomping = true;
        this.chompTimer = 3.0;
        this.chompPhase = 0;
        const catchX = mouthX, catchY = mouthY;
        const preyColor = prey.color || 'rgb(140,150,160)';
        for (let k = 0; k < 8; k++) {
          const a = Math.random() * Math.PI * 2;
          const spd = 0.5 + Math.random() * 2;
          killFx.push({
            x: catchX + Math.cos(a) * 5, y: catchY + Math.sin(a) * 5,
            vx: Math.cos(a) * spd + this.vx * 0.4,
            vy: Math.sin(a) * spd + this.vy * 0.4,
            type: 'scale', life: 1, maxLife: 0.8 + Math.random() * 1.2,
            size: 0.5 + Math.random() * 1.5, color: preyColor,
            sparkle: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    // Tidal current
    this.vx += Math.cos(tide.angle) * tide.strength * 0.003 * viewScale;
    this.vy += Math.sin(tide.angle) * tide.strength * 0.003 * viewScale;
    const flow = sampleFlow(this.x, this.y, time);
    this.vx += flow.fx * 0.003 * viewScale;
    this.vy += flow.fy * 0.003 * viewScale;

    const predScale = viewScale;
    let targetSpeed;
    if (this.burstTimer > 0) { targetSpeed = this.baseSpeed * 7.0 * predScale; this.burstTimer -= dt; }
    else if (this.target) targetSpeed = this.baseSpeed * (1.75 + this.hunger * 0.7) * predScale;
    else if (this.hunting) targetSpeed = this.baseSpeed * (0.35 + this.hunger * 0.28) * predScale;
    // Hovering — slow deliberate cruise, not motionless
    else targetSpeed = this.baseSpeed * (0.3 + this.hunger * 0.3) * predScale;

    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    // Slow to change speed when well-fed, responsive when hungry/hunting
    const accelRate = this.hunting ? 0.15 : 0.06 + this.hunger * 0.07;
    if (currentSpeed > 0.01) {
      const desired = currentSpeed + (targetSpeed - currentSpeed) * accelRate;
      this.vx *= desired / currentSpeed;
      this.vy *= desired / currentSpeed;
    } else {
      this.vx = Math.cos(this.angle) * targetSpeed * 0.5;
      this.vy = Math.sin(this.angle) * targetSpeed * 0.5;
    }

    // Gentle centering
    const normX = (this.x - w / 2) / (w / 2);
    const normY = (this.y - h / 2) / (h / 2);
    const edgeX = Math.max(0, Math.abs(normX) - 0.7) / 0.3;
    const edgeY = Math.max(0, Math.abs(normY) - 0.7) / 0.3;
    this.vx -= Math.sign(normX) * edgeX * 0.02;
    this.vy -= Math.sign(normY) * edgeY * 0.02;

    // Reef avoidance
    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 0.01;
    let reefSteer = 0;
    for (const rf of reefs) {
      if (rf.submerged) continue;
      const cdx = this.x - (rf.x + rf.crownOffX), cdy = this.y - (rf.y + rf.crownOffY);
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      const cAngle = Math.atan2(cdy, cdx);
      const crownR = rf.radiusAt(cAngle, rf.crownRadii) + this.len * 0.5;
      const crownSense = crownR * 3;
      if (cDist < crownSense && cDist > 0.1) {
        const approach = -(this.vx * cdx + this.vy * cdy) / (spd * cDist);
        if (approach > -0.3) {
          const aw = Math.max(0, approach + 0.3);
          const prox = 1 - cDist / crownSense;
          const cross = this.vx * cdy - this.vy * cdx;
          reefSteer += (cross >= 0 ? 1 : -1) * prox * prox * prox * aw * 0.2;
        }
      }
      const rdx = this.x - rf.x, rdy = this.y - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const bAngle = Math.atan2(rdy, rdx);
      const bNoise = 0.85 + 0.3 * Math.sin(bAngle * 5.7 + rf.x * 0.1);
      const baseR = rf.radiusAt(bAngle, rf.baseRadii) * 0.45 * bNoise + this.len * 0.5;
      const baseSense = baseR * 2.5;
      if (rDist < baseSense && rDist > 0.1) {
        const approach = -(this.vx * rdx + this.vy * rdy) / (spd * rDist);
        if (approach > -0.3) {
          const aw = Math.max(0, approach + 0.3);
          const prox = 1 - rDist / baseSense;
          const cross = this.vx * rdy - this.vy * rdx;
          reefSteer += (cross >= 0 ? 1 : -1) * prox * prox * prox * aw * 0.15;
        }
      }
    }
    if (Math.abs(reefSteer) > 0.001) {
      const clampedSteer = Math.max(-0.12, Math.min(0.12, reefSteer));
      this.angle += clampedSteer;
      this.vx = Math.cos(this.angle) * spd;
      this.vy = Math.sin(this.angle) * spd;
    }

    // Forward-only constraint
    const headX = Math.cos(this.angle), headY = Math.sin(this.angle);
    const fwdSpeed = this.vx * headX + this.vy * headY;
    const latSpeed = this.vx * (-headY) + this.vy * headX;
    this.vx -= (-headY) * latSpeed * 0.6;
    this.vy -= headX * latSpeed * 0.6;
    if (fwdSpeed < 0) { this.vx -= headX * fwdSpeed * 0.7; this.vy -= headY * fwdSpeed * 0.7; }
    // Always moving forward — big fish can't hover in place
    const minFwd = this.target ? this.baseSpeed * 0.4 * viewScale : this.baseSpeed * 0.2 * viewScale;
    const fwdNow = this.vx * headX + this.vy * headY;
    if (fwdNow < minFwd) { this.vx += headX * (minFwd - fwdNow) * 0.2; this.vy += headY * (minFwd - fwdNow) * 0.2; }

    this.vx *= 0.99;
    this.vy *= 0.99;

    // Soft boundary — starts pushing 10% from edge, hard push when offscreen
    const bMargin = 0.1;
    const bx = this.x / w, by = this.y / h; // 0-1 when in viewport
    if (bx < bMargin) { const t = (bMargin - bx) / bMargin; this.vx += t * t * 1.5; }
    if (bx > 1 - bMargin) { const t = (bx - (1 - bMargin)) / bMargin; this.vx -= t * t * 1.5; }
    if (by < bMargin) { const t = (bMargin - by) / bMargin; this.vy += t * t * 1.5; }
    if (by > 1 - bMargin) { const t = (by - (1 - bMargin)) / bMargin; this.vy -= t * t * 1.5; }
    // Hard push when offscreen
    if (this.x < 0) this.vx += 0.8;
    if (this.x > w) this.vx -= 0.8;
    if (this.y < 0) this.vy += 0.8;
    if (this.y > h) this.vy -= 0.8;
    // Drop target if stuck at edge — don't chase into walls
    if (this.target && (bx < 0.02 || bx > 0.98 || by < 0.02 || by > 0.98)) {
      this.target = null;
      this._retargetCooldown = 2 + Math.random() * 2;
    }

    this.x += this.vx;
    this.y += this.vy;
    const overflow = 0.2;
    this.x = Math.max(-w * overflow, Math.min(w * (1 + overflow), this.x));
    this.y = Math.max(-h * overflow, Math.min(h * (1 + overflow), this.y));

    // Reef collision push
    for (const rf of reefs) {
      if (rf.submerged) continue;
      const cdx = this.x - (rf.x + rf.crownOffX), cdy = this.y - (rf.y + rf.crownOffY);
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      const cAngle = Math.atan2(cdy, cdx);
      const crownCollR = rf.radiusAt(cAngle, rf.crownRadii) + this.len * 0.4;
      if (cDist < crownCollR * 1.3 && cDist > 0.1) {
        const pen = 1 - cDist / (crownCollR * 1.3);
        this.vx += (cdx / cDist) * pen * pen * 0.6;
        this.vy += (cdy / cDist) * pen * pen * 0.6;
      }
    }

    // Head-snap — occasional sharp direction change when cruising
    this._snapTimer -= dt;
    if (this._snapTimer <= 0 && !this.target) {
      this._snapping = true;
      // Snap 40-90 degrees to one side
      const snapDir = Math.random() < 0.5 ? 1 : -1;
      this._snapAngle = this.angle + snapDir * (0.7 + Math.random() * 0.9);
      this._snapTimer = 8 + Math.random() * 20;
      // Tail flick powers the direction change
      this._burstFlick = 0.7;
      this._burstFlickDir = -snapDir; // tail kicks opposite to turn direction
    }
    if (this._snapping) {
      // Steer velocity toward snap angle quickly
      const snapSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      this.vx += (Math.cos(this._snapAngle) * snapSpeed - this.vx) * 0.08;
      this.vy += (Math.sin(this._snapAngle) * snapSpeed - this.vy) * 0.08;
      // Done snapping once heading is close
      let snapDiff = this._snapAngle - this.angle;
      while (snapDiff > Math.PI) snapDiff -= Math.PI * 2;
      while (snapDiff < -Math.PI) snapDiff += Math.PI * 2;
      if (Math.abs(snapDiff) < 0.15) this._snapping = false;
    }

    const targetAngle = Math.atan2(this.vy, this.vx);
    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    // Turn rate scales with speed — must move forward to turn, no nose pivoting
    const turnMult = 0.4 + this.hunger * 0.6;
    const snapBoost = this._snapping ? 2.0 : 1.0;
    const speedRatio = Math.min(1, currentSpeed / (this.baseSpeed * 1.5 * viewScale));
    const maxTurn = (0.02 + speedRatio * 0.14) * turnMult * snapBoost;
    this.angle += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
    // Smooth render angle — body follows heading
    let rDiff = this.angle - this._renderAngle;
    while (rDiff > Math.PI) rDiff -= Math.PI * 2;
    while (rDiff < -Math.PI) rDiff += Math.PI * 2;
    this._renderAngle += rDiff * (this._snapping ? 0.45 : 0.28);

    // Decay burst tail flick
    if (this._burstFlick > 0) this._burstFlick = Math.max(0, this._burstFlick - dt * 7);

    // Joint chain — plant-style verlet with heavy damping, no hard bend clamping
    // Body straightens naturally over time through rest-position pull
    this._joints[0].x = this.x;
    this._joints[0].y = this.y;
    for (let j = 1; j <= this._jointCount; j++) {
      const prev = this._joints[j - 1];
      const curr = this._joints[j];
      // Verlet: velocity = current - previous, heavily damped
      const velX = curr.x - curr.px, velY = curr.y - curr.py;
      curr.px = curr.x; curr.py = curr.y;
      const t = j / this._jointCount;
      // Drag — stiff at snout, loosens toward tail. Lower = springs back faster
      const headStiff = t < 0.4 ? 0.78 : 0.45;
      const drag = headStiff - t * 0.1;
      curr.x += velX * drag;
      curr.y += velY * drag;
      // Burst tail flick — rear 40% of body gets a sharp lateral kick
      if (this._burstFlick > 0 && t > 0.6) {
        const flickT = (t - 0.6) / 0.4; // 0 at 60%, 1 at tail tip
        const flickStrength = this._burstFlick * flickT * flickT * this.len * 0.12;
        // Perpendicular to the segment direction (prev -> curr)
        const sdx = curr.x - prev.x, sdy = curr.y - prev.y;
        const sl = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
        curr.x += (-sdy / sl) * flickStrength * this._burstFlickDir;
        curr.y += (sdx / sl) * flickStrength * this._burstFlickDir;
      }
      // Pull toward rest position (straight behind head)
      const restX = this.x - Math.cos(this._renderAngle) * j * this._segLen;
      const restY = this.y - Math.sin(this._renderAngle) * j * this._segLen;
      // Straighten more at speed, stay flexed when slow-turning
      // Head joints get much stronger straightening to stay rigid
      const speedFactor = Math.min(1, currentSpeed / (this.baseSpeed * 2));
      const spawnBoost = this._spawnFrames > 0 ? 0.15 : 0;
      const headBoost = t < 0.4 ? 0.07 : 0;
      const straighten = (0.008 + speedFactor * 0.015 + spawnBoost + headBoost) * (1 - t * 0.4);
      curr.x += (restX - curr.x) * straighten;
      curr.y += (restY - curr.y) * straighten;
      // Distance constraint
      let dx = curr.x - prev.x, dy = curr.y - prev.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      curr.x = prev.x + (dx / dist) * this._segLen;
      curr.y = prev.y + (dy / dist) * this._segLen;
      // Bend clamping — limit angle between consecutive segments
      // Stiffer at head, slightly more flex toward tail
      if (j >= 2) {
        const pp = this._joints[j - 2];
        const prevAng = Math.atan2(prev.y - pp.y, prev.x - pp.x);
        const currAng = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        let bend = currAng - prevAng;
        while (bend > Math.PI) bend -= Math.PI * 2;
        while (bend < -Math.PI) bend += Math.PI * 2;
        // Max bend per joint: stiffer front half, looser tail
        const frontStiff = t < 0.4 ? 0.16 : 0.26; // ~9 deg front, ~15 deg mid
        const maxBend = (frontStiff + t * 0.18);
        if (Math.abs(bend) > maxBend) {
          const clamped = prevAng + Math.sign(bend) * maxBend;
          curr.x = prev.x + Math.cos(clamped) * this._segLen;
          curr.y = prev.y + Math.sin(clamped) * this._segLen;
        }
      }
    }
    if (this._spawnFrames > 0) this._spawnFrames--;
    this.speed = currentSpeed;

    // Burst bubbles — trail of disturbed water behind the tail during dashes
    if (this.burstTimer > 0 && Math.random() < 0.6) {
      const tail = this._joints[this._jointCount];
      const midTail = this._joints[Math.floor(this._jointCount * 0.7)];
      // Spawn 1-3 bubbles near the tail and mid-body wake
      const count = 1 + Math.floor(Math.random() * 3);
      for (let b = 0; b < count; b++) {
        const src = Math.random() < 0.6 ? tail : midTail;
        const spread = this.len * 0.15;
        killFx.push({
          x: src.x + (Math.random() - 0.5) * spread,
          y: src.y + (Math.random() - 0.5) * spread,
          vx: -this.vx * (0.1 + Math.random() * 0.15) + (Math.random() - 0.5) * 0.3,
          vy: -this.vy * (0.1 + Math.random() * 0.15) + (Math.random() - 0.5) * 0.3,
          type: 'bubble', life: 1, maxLife: 0.6 + Math.random() * 1.0,
          size: (0.5 + Math.random() * 1.5) * viewScale,
        });
      }
    }
  }

  draw(ctx) {
    const segs = this._jointCount;
    const totalLen = this.len;
    // Chomp animation
    const chompIntensity = this.chomping ? this.chompTimer / 3.0 : 0;
    const jawGape = chompIntensity * Math.max(0, Math.sin(this.chompPhase * 0.8)) * this.bodyWidth * 2.5;

    // World-space spine — directly from joint positions, no rotation transform
    const spineX = new Array(segs + 1), spineY = new Array(segs + 1), widths = new Array(segs + 1);
    for (let i = 0; i <= segs; i++) {
      spineX[i] = this._joints[i].x;
      spineY[i] = this._joints[i].y;
      const tw = i / segs;
      let hw;
      if (tw < 0.03) hw = tw / 0.03 * this.bodyWidth * 0.15; // sharp pointed snout
      else if (tw < 0.1) hw = this.bodyWidth * (0.15 + (tw - 0.03) / 0.07 * 0.35);
      else if (tw < 0.22) hw = this.bodyWidth * (0.5 + (tw - 0.1) / 0.12 * 0.5);
      else if (tw < 0.55) hw = this.bodyWidth * (1 - (tw - 0.22) / 0.33 * 0.15);
      else hw = this.bodyWidth * 0.85 * Math.pow(1 - (tw - 0.55) / 0.45, 1.3);
      widths[i] = Math.max(hw, 0.15);
    }
    widths[0] = this.bodyWidth * 0.12; // needle-like nose tip

    // Compute perpendiculars and outline in world space
    ctx.save();
    const rightX = new Array(segs + 1), rightY = new Array(segs + 1);
    const leftX = new Array(segs + 1), leftY = new Array(segs + 1);
    for (let i = 0; i <= segs; i++) {
      let nx, ny;
      if (i === 0) { nx = -(spineY[1] - spineY[0]); ny = spineX[1] - spineX[0]; }
      else if (i === segs) { nx = -(spineY[i] - spineY[i-1]); ny = spineX[i] - spineX[i-1]; }
      else { nx = -(spineY[i+1] - spineY[i-1]); ny = spineX[i+1] - spineX[i-1]; }
      const nLen = Math.sqrt(nx * nx + ny * ny) || 1;
      nx /= nLen; ny /= nLen;
      rightX[i] = spineX[i] + nx * widths[i]; rightY[i] = spineY[i] + ny * widths[i];
      leftX[i] = spineX[i] - nx * widths[i]; leftY[i] = spineY[i] - ny * widths[i];
    }

    // Barracuda coloring — iridescent blue-green, slight shimmer
    const shimmer = Math.sin(this._drawTime * 0.0008 + this._phaseOffset) * 8;
    const cr = Math.round(55 + shimmer * 0.3);
    const cg = Math.round(95 + shimmer);
    const cb = Math.round(100 + shimmer * 0.7);

    // Body outline
    ctx.beginPath();
    ctx.moveTo(spineX[0], spineY[0]);
    ctx.lineTo(rightX[0], rightY[0]);
    for (let i = 0; i < segs; i++) ctx.quadraticCurveTo(rightX[i], rightY[i], (rightX[i]+rightX[i+1])*0.5, (rightY[i]+rightY[i+1])*0.5);
    ctx.lineTo(rightX[segs], rightY[segs]);
    ctx.lineTo(spineX[segs], spineY[segs]);
    ctx.lineTo(leftX[segs], leftY[segs]);
    for (let i = segs; i > 0; i--) ctx.quadraticCurveTo(leftX[i], leftY[i], (leftX[i]+leftX[i-1])*0.5, (leftY[i]+leftY[i-1])*0.5);
    ctx.lineTo(leftX[0], leftY[0]);
    ctx.closePath();
    ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
    ctx.fill();

    // Dorsal stripe
    ctx.beginPath();
    ctx.moveTo(spineX[1], spineY[1]);
    for (let i = 2; i < segs - 1; i++) ctx.quadraticCurveTo(spineX[i], spineY[i], (spineX[i]+spineX[i+1])*0.5, (spineY[i]+spineY[i+1])*0.5);
    ctx.strokeStyle = this.bellyColor;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = this.bodyWidth * 0.4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Dorsal fin — centered ridge along the spine (top-down view)
    const dStart = Math.round(segs * 0.55), dEnd = Math.round(segs * 0.72);
    ctx.beginPath();
    // Trace one side of the ridge
    for (let i = dStart; i <= dEnd; i++) {
      const t = (i - dStart) / (dEnd - dStart);
      const finH = Math.sin(t * Math.PI) * this.bodyWidth * 0.25;
      const nx2 = -(spineY[Math.min(i+1, segs)] - spineY[Math.max(i-1, 0)]);
      const ny2 = spineX[Math.min(i+1, segs)] - spineX[Math.max(i-1, 0)];
      const nL = Math.sqrt(nx2 * nx2 + ny2 * ny2) || 1;
      ctx.lineTo(spineX[i] + (nx2/nL)*finH, spineY[i] + (ny2/nL)*finH);
    }
    // Trace the other side back
    for (let i = dEnd; i >= dStart; i--) {
      const t = (i - dStart) / (dEnd - dStart);
      const finH = Math.sin(t * Math.PI) * this.bodyWidth * 0.25;
      const nx2 = -(spineY[Math.min(i+1, segs)] - spineY[Math.max(i-1, 0)]);
      const ny2 = spineX[Math.min(i+1, segs)] - spineX[Math.max(i-1, 0)];
      const nL = Math.sqrt(nx2 * nx2 + ny2 * ny2) || 1;
      ctx.lineTo(spineX[i] - (nx2/nL)*finH, spineY[i] - (ny2/nL)*finH);
    }
    ctx.closePath();
    ctx.fillStyle = `rgb(${cr-15},${cg-15},${cb-10})`;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Pectoral fins (front side fins) — triangular, stick out sideways
    const pIdx = Math.round(segs * 0.22);
    const pFinLen = totalLen * 0.15;
    for (const side of [-1, 1]) {
      // Base points: two spots along the body edge
      const b1i = pIdx, b2i = Math.min(pIdx + 2, segs);
      const b1x = side === 1 ? rightX[b1i] : leftX[b1i];
      const b1y = side === 1 ? rightY[b1i] : leftY[b1i];
      const b2x = side === 1 ? rightX[b2i] : leftX[b2i];
      const b2y = side === 1 ? rightY[b2i] : leftY[b2i];
      // Tip: perpendicular outward from spine + angled backward
      const nx = -(spineY[pIdx+1] - spineY[pIdx]);
      const ny = spineX[pIdx+1] - spineX[pIdx];
      const nL = Math.sqrt(nx*nx + ny*ny) || 1;
      const backDir = Math.atan2(spineY[pIdx+1]-spineY[pIdx], spineX[pIdx+1]-spineX[pIdx]);
      const tipX = spineX[pIdx] + (nx/nL)*pFinLen*side + Math.cos(backDir)*pFinLen*0.5;
      const tipY = spineY[pIdx] + (ny/nL)*pFinLen*side + Math.sin(backDir)*pFinLen*0.5;
      ctx.beginPath();
      ctx.moveTo(b1x, b1y);
      ctx.quadraticCurveTo(tipX, tipY, b2x, b2y);
      ctx.closePath();
      ctx.fillStyle = `rgb(${cr-10},${cg-10},${cb-10})`;
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Pelvic fins (rear side fins) — smaller version
    const pvIdx = Math.round(segs * 0.55);
    const pvFinLen = totalLen * 0.08;
    for (const side of [-1, 1]) {
      const b1i = pvIdx, b2i = Math.min(pvIdx + 2, segs);
      const b1x = side === 1 ? rightX[b1i] : leftX[b1i];
      const b1y = side === 1 ? rightY[b1i] : leftY[b1i];
      const b2x = side === 1 ? rightX[b2i] : leftX[b2i];
      const b2y = side === 1 ? rightY[b2i] : leftY[b2i];
      const nx = -(spineY[pvIdx+1] - spineY[pvIdx]);
      const ny = spineX[pvIdx+1] - spineX[pvIdx];
      const nL = Math.sqrt(nx*nx + ny*ny) || 1;
      const backDir = Math.atan2(spineY[pvIdx+1]-spineY[pvIdx], spineX[pvIdx+1]-spineX[pvIdx]);
      const tipX = spineX[pvIdx] + (nx/nL)*pvFinLen*side + Math.cos(backDir)*pvFinLen*0.5;
      const tipY = spineY[pvIdx] + (ny/nL)*pvFinLen*side + Math.sin(backDir)*pvFinLen*0.5;
      ctx.beginPath();
      ctx.moveTo(b1x, b1y);
      ctx.quadraticCurveTo(tipX, tipY, b2x, b2y);
      ctx.closePath();
      ctx.fillStyle = `rgb(${cr-10},${cg-10},${cb-10})`;
      ctx.globalAlpha = 0.45;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Tail fin
    const tsi = segs;
    const tailDir = Math.atan2(spineY[tsi]-spineY[tsi-1], spineX[tsi]-spineX[tsi-1]);
    const tailSpread = this.bodyWidth * 1.8, tailLen = totalLen * 0.18;
    const tPx = -Math.sin(tailDir), tPy = Math.cos(tailDir);
    ctx.beginPath();
    ctx.moveTo(rightX[tsi], rightY[tsi]);
    ctx.quadraticCurveTo(spineX[tsi]+Math.cos(tailDir)*tailLen+tPx*tailSpread*0.4, spineY[tsi]+Math.sin(tailDir)*tailLen+tPy*tailSpread*0.4, spineX[tsi]+Math.cos(tailDir)*tailLen, spineY[tsi]+Math.sin(tailDir)*tailLen);
    ctx.quadraticCurveTo(spineX[tsi]+Math.cos(tailDir)*tailLen-tPx*tailSpread*0.4, spineY[tsi]+Math.sin(tailDir)*tailLen-tPy*tailSpread*0.4, leftX[tsi], leftY[tsi]);
    ctx.closePath();
    ctx.fillStyle = `rgb(${cr-10},${cg-10},${cb-10})`;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Jaw gape when chomping — uses perpendicular direction from spine
    if (jawGape > 0.1) {
      // Perpendicular at the nose
      let jnx = -(spineY[1] - spineY[0]), jny = spineX[1] - spineX[0];
      const jnl = Math.sqrt(jnx*jnx+jny*jny) || 1;
      jnx /= jnl; jny /= jnl;
      ctx.beginPath();
      ctx.moveTo(spineX[0]+jnx*jawGape*0.4, spineY[0]+jny*jawGape*0.4);
      ctx.lineTo(rightX[2], rightY[2]);
      ctx.lineTo(leftX[2], leftY[2]);
      ctx.lineTo(spineX[0]-jnx*jawGape*0.4, spineY[0]-jny*jawGape*0.4);
      ctx.closePath();
      ctx.fillStyle = `rgb(${Math.max(0,cr-10)},${Math.max(0,cg-10)},${Math.max(0,cb-8)})`;
      ctx.fill();
      // Dark mouth interior
      ctx.beginPath();
      ctx.arc(spineX[1], spineY[1], jawGape * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(40, 20, 25)';
      ctx.fill();
    }

    // Eyes - fixed size regardless of body length
    const eIdx = Math.round(segs * 0.1);
    const eyeR = 0.6; // small beady predator eyes
    const eyeOff = widths[eIdx] * 0.55;
    for (const side of [-1, 1]) {
      const enx = -(spineY[eIdx+1]-spineY[eIdx]), eny = spineX[eIdx+1]-spineX[eIdx];
      const eLen = Math.sqrt(enx*enx+eny*eny) || 1;
      const ex = spineX[eIdx]+(enx/eLen)*eyeOff*side;
      const ey = spineY[eIdx]+(eny/eLen)*eyeOff*side;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(100,110,90)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
    }

    ctx.restore();
  }
}

// Tuna palette — dark muted backs with lighter bellies
const schoolColors = [
  { color: 'rgb(30, 50, 85)', belly: 'rgb(130, 155, 185)' },      // dark steel
  { color: 'rgb(25, 55, 80)', belly: 'rgb(120, 160, 190)' },      // deep slate
  { color: 'rgb(35, 45, 78)', belly: 'rgb(140, 158, 182)' },      // charcoal blue
  { color: 'rgb(22, 58, 88)', belly: 'rgb(125, 165, 195)' },      // dark teal
];
// Per-fish color jitter so individuals aren't clones
function jitterTunaColor(base) {
  const m = base.match(/\d+/g).map(Number);
  const j = () => Math.round((Math.random() - 0.5) * 12); // +/- 6
  return `rgb(${m[0]+j()},${m[1]+j()},${m[2]+j()})`;
}
// Fish shadow — gradient stamps on half-res canvas, blur once, composite once
// Circles follow spine joints so shadow bends with fish — no transforms needed
const shadowOffX = -8, shadowOffY = 12;
const SHADOW_SCALE = 0.5;
const SHADOW_BLUR = 10; // px on half-res canvas = ~20px effective
const shadowCanvas = document.createElement('canvas');
const shadowCtx = shadowCanvas.getContext('2d');
const shadowBlurCanvas = document.createElement('canvas');
const shadowBlurCtx = shadowBlurCanvas.getContext('2d');
shadowBlurCtx.filter = `blur(${SHADOW_BLUR}px)`;
// Pre-rendered gradient dot — soft falloff baked in, blur spreads it further
const SDOT = 64;
const shadowDot = document.createElement('canvas');
shadowDot.width = SDOT;
shadowDot.height = SDOT;
const sdCtx = shadowDot.getContext('2d');
const sdg = sdCtx.createRadialGradient(SDOT/2, SDOT/2, 0, SDOT/2, SDOT/2, SDOT/2);
sdg.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
sdg.addColorStop(0.3, 'rgba(0, 0, 0, 0.3)');
sdg.addColorStop(0.6, 'rgba(0, 0, 0, 0.1)');
sdg.addColorStop(1, 'rgba(0, 0, 0, 0)');
sdCtx.fillStyle = sdg;
sdCtx.fillRect(0, 0, SDOT, SDOT);

function drawAllFishShadows(ctx, drawables) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const sw = Math.ceil(ctx.canvas.width * SHADOW_SCALE);
  const sh = Math.ceil(ctx.canvas.height * SHADOW_SCALE);
  if (shadowCanvas.width !== sw || shadowCanvas.height !== sh) {
    shadowCanvas.width = sw;
    shadowCanvas.height = sh;
    shadowBlurCanvas.width = sw;
    shadowBlurCanvas.height = sh;
    shadowBlurCtx.filter = `blur(${SHADOW_BLUR}px)`;
  }
  const scale = dpr * SHADOW_SCALE;
  shadowCtx.setTransform(scale, 0, 0, scale, 0, 0);
  shadowCtx.clearRect(0, 0, sw / scale, sh / scale);
  // Stamp gradient dots at each joint
  for (const d of drawables) {
    if (d.type !== 'fish') continue;
    const f = d.obj;
    const joints = f._joints;
    if (!joints || joints.length < 3) continue;
    const segs = joints.length;
    const bw = f.bodyWidth * 1.8;
    // Big fish: elongate stamps along spine so they blend into one shadow
    const isBig = f.len > 40;
    for (let i = 0; i < segs; i++) {
      const t = i / (segs - 1);
      let r;
      if (t < 0.1) r = t / 0.1 * bw * 0.4;
      else if (t < 0.3) r = bw * (0.4 + (t - 0.1) / 0.2 * 0.6);
      else if (t < 0.6) r = bw * (1 - (t - 0.3) / 0.3 * 0.2);
      else r = bw * 0.8 * (1 - (t - 0.6) / 0.4);
      if (r < 0.3) continue;
      if (isBig) {
        // Elongate along spine direction — only for predator (few joints, low cost)
        let dx, dy;
        if (i === 0) { dx = joints[0].x - joints[1].x; dy = joints[0].y - joints[1].y; }
        else if (i === segs - 1) { dx = joints[i-1].x - joints[i].x; dy = joints[i-1].y - joints[i].y; }
        else { dx = joints[i-1].x - joints[i+1].x; dy = joints[i-1].y - joints[i+1].y; }
        const angle = Math.atan2(dy, dx);
        shadowCtx.save();
        shadowCtx.translate(joints[i].x + shadowOffX, joints[i].y + shadowOffY);
        shadowCtx.rotate(angle);
        shadowCtx.drawImage(shadowDot, -r * 1.8, -r, r * 3.6, r * 2);
        shadowCtx.restore();
      } else {
        shadowCtx.drawImage(shadowDot,
          joints[i].x + shadowOffX - r,
          joints[i].y + shadowOffY - r,
          r * 2, r * 2);
      }
    }
  }
  // Single blur pass on the half-res canvas
  shadowBlurCtx.clearRect(0, 0, sw, sh);
  shadowBlurCtx.drawImage(shadowCanvas, 0, 0);
  // Composite to main canvas
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.216;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(shadowBlurCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const fishCount = Math.min(214, Math.max(69, Math.floor((w * h) / 1232)));
const fish = [];
// Fish swim in as school groups from edges
let fishToSpawn = fishCount;
let fishSpawned = 0;
let spawnTimer = 0;
// Pre-plan spawn waves — varied count, sizes, edges, and timing
function makeSpawnWaves(total, vw, vh) {
  const waves = [];
  const waveCount = 2 + Math.floor(Math.random() * 5); // 2-6 waves
  // Sometimes one big wave dominates, sometimes evenly split
  const shares = [];
  let shareSum = 0;
  for (let i = 0; i < waveCount; i++) {
    const s = 0.3 + Math.random() * 1.7;
    shares.push(s);
    shareSum += s;
  }
  // Pick 1-2 edges to favor, but allow others
  const favoredEdge = Math.floor(Math.random() * 4);
  const secondEdge = (favoredEdge + 1 + Math.floor(Math.random() * 3)) % 4;
  let spawned = 0;
  for (let i = 0; i < waveCount; i++) {
    const count = i < waveCount - 1
      ? Math.max(2, Math.round((shares[i] / shareSum) * total))
      : total - spawned;
    if (count <= 0) continue;
    // 60% chance favored edge, 25% second edge, 15% random
    const r = Math.random();
    const edge = r < 0.6 ? favoredEdge : r < 0.85 ? secondEdge : Math.floor(Math.random() * 4);
    const margin = 80 + Math.random() * 40;
    let x, y, angle;
    if (edge === 0) { x = -margin; y = vh * 0.1 + Math.random() * vh * 0.8; angle = (Math.random() - 0.5) * 0.5; }
    else if (edge === 1) { x = vw + margin; y = vh * 0.1 + Math.random() * vh * 0.8; angle = Math.PI + (Math.random() - 0.5) * 0.5; }
    else if (edge === 2) { x = vw * 0.1 + Math.random() * vw * 0.8; y = -margin; angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; }
    else { x = vw * 0.1 + Math.random() * vw * 0.8; y = vh + margin; angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; }
    waves.push({ x, y, angle, count, delay: i * (0.3 + Math.random() * 0.8) });
    spawned += count;
  }
  return waves;
}
let spawnWaves = makeSpawnWaves(fishCount, w, h);
// Legacy entry points for trickle respawns
const schoolEntries = schoolColors.map(() => {
  const edge = Math.floor(Math.random() * 4);
  const margin = 80 + Math.random() * 40;
  let x, y, angle;
  if (edge === 0) { x = -margin; y = h * 0.2 + Math.random() * h * 0.6; angle = (Math.random() - 0.5) * 0.5; }
  else if (edge === 1) { x = w + margin; y = h * 0.2 + Math.random() * h * 0.6; angle = Math.PI + (Math.random() - 0.5) * 0.5; }
  else if (edge === 2) { x = w * 0.2 + Math.random() * w * 0.6; y = -margin; angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; }
  else { x = w * 0.2 + Math.random() * w * 0.6; y = h + margin; angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; }
  return { x, y, angle };
});

// Predator(s) - one per pool, maybe two on large viewports
const predators = [];
const predatorCount = w * h > 600000 ? 2 : 1;
for (let i = 0; i < predatorCount; i++) predators.push(new Predator());
// Organic population — wanders around a midpoint, fish come and go
let basePop = Math.min(214, Math.max(45, Math.floor((w * h) / 1232)));
let popTarget = basePop * (0.7 + Math.random() * 0.3); // start a little varied
let popDriftTimer = 10 + Math.random() * 20; // time until next target shift
let schoolArrivalTimer = 15 + Math.random() * 30; // next wave of newcomers
let fishRespawnTimer = 0;

// Sand patches - subtle lighter spots on the seafloor
function makeSand(x, y) {
  const size = (15 + Math.random() * 35) * viewScale;
  const elongation = 0.5 + Math.random() * 0.5;
  const angle = Math.random() * Math.PI;
  const brightness = 0.03 + Math.random() * 0.04; // very subtle
  return { x, y, size, elongation, angle, brightness };
}
const rocks = [];
for (let i = 0; i < 15; i++) {
  rocks.push(makeSand(Math.random() * w, Math.random() * h));
}

// Seabed pebbles — small irregular gray rocks scattered across the floor
// Slightly denser near reefs (added after reefs are placed), with loose clusters
const seabedRocks = [];
function generateSeabedRocks() {
  seabedRocks.length = 0;
  const count = Math.floor(18 + (w * h) / 25000); // scales with viewport, not too dense
  // Seed a few cluster centers for natural grouping
  const clusterCount = 3 + Math.floor(Math.random() * 3);
  const clusters = Array.from({ length: clusterCount }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: 60 + Math.random() * 100, // cluster radius
  }));
  for (let i = 0; i < count; i++) {
    let px, py;
    if (Math.random() < 0.4 && clusters.length > 0) {
      // Place near a random cluster center
      const cl = clusters[Math.floor(Math.random() * clusters.length)];
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * cl.r;
      px = cl.x + Math.cos(a) * d;
      py = cl.y + Math.sin(a) * d;
    } else {
      px = Math.random() * w;
      py = Math.random() * h;
    }
    // Skip if on top of a reef crown (will be added near-reef after reefs exist)
    const rockSize = (1.5 + Math.random() * 3.5) * viewScale;
    const gray = 60 + Math.floor(Math.random() * 35);
    const warm = Math.floor(Math.random() * 6);
    // Check if touching previous rock — share color
    const neighbor = seabedRocks.find(sr => {
      const dx = sr.x - px, dy = sr.y - py;
      return Math.sqrt(dx * dx + dy * dy) < sr.size + rockSize + 1;
    });
    const g = neighbor ? neighbor._gray : gray;
    const wm = neighbor ? neighbor._warm : warm;
    const vertCount = 5 + Math.floor(Math.random() * 3);
    seabedRocks.push({
      x: px, y: py, size: rockSize,
      _gray: g, _warm: wm,
      color: `rgb(${g + wm}, ${g - 2}, ${g - wm - 3})`,
      verts: Array.from({ length: vertCount }, (_, j) => ({
        a: (j / vertCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
        r: 0.65 + Math.random() * 0.5,
      })),
    });
  }
}

// Reef structures - partially submerged obstacles
// Each reef has an irregular outline generated from noisy radius samples
function makeReef(x, y, sizeMultiplier = 1) {
  // Scale with viewport — capped so reefs don't dominate large screens
  const vpScale = Math.min(2.0, Math.sqrt(w * h) / 800);
  const mobileScale = Math.min(w, h) < 500 ? 0.75 : 1;
  const baseR = (50 + Math.random() * 60) * sizeMultiplier * vpScale * mobileScale;
  const crownR = baseR * (0.45 + Math.random() * 0.2); // above-water is smaller
  const crownOffX = (Math.random() - 0.5) * baseR * 0.3; // crown offset from center
  const crownOffY = (Math.random() - 0.5) * baseR * 0.3;
  const verts = 10 + Math.floor(Math.random() * 6); // outline complexity
  const seed = Math.random() * 1000;

  // Generate irregular outline points for base and crown
  const baseShape = [];
  const crownShape = [];
  for (let i = 0; i < verts; i++) {
    const a = (i / verts) * Math.PI * 2;
    // Organic noise: two octaves of sine at irrational frequencies
    const n1 = Math.sin(seed + i * 2.37) * 0.25;
    const n2 = Math.sin(seed * 1.7 + i * 4.13) * 0.12;
    const br = baseR * (0.8 + n1 + n2);
    baseShape.push({ x: Math.cos(a) * br, y: Math.sin(a) * br });
    const cr = crownR * (0.75 + n1 * 0.8 + n2 * 0.6);
    crownShape.push({ x: crownOffX + Math.cos(a) * cr, y: crownOffY + Math.sin(a) * cr });
  }

  // Color palette - sun-bleached coral rock tones
  const g = 65 + Math.floor(Math.random() * 30);
  const baseColor = `rgb(${g + 5}, ${g - 5}, ${g - 10})`;
  const crownColor = `rgb(${g + 35}, ${g + 28}, ${g + 15})`;
  const rimColor = `rgba(${g + 55}, ${g + 50}, ${g + 40}, 0.6)`;

  // Precompute radii at each vertex angle for fast lookup
  const baseRadii = baseShape.map(p => Math.sqrt(p.x * p.x + p.y * p.y));
  const crownRadii = crownShape.map(p => {
    const dx = p.x - crownOffX, dy = p.y - crownOffY;
    return Math.sqrt(dx * dx + dy * dy);
  });

  // Get boundary radius at arbitrary angle by interpolating between vertices
  function radiusAt(angle, radii) {
    // Normalize angle to [0, 2PI)
    let a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const n = radii.length;
    const sector = a / (Math.PI * 2) * n;
    const i0 = Math.floor(sector) % n;
    const i1 = (i0 + 1) % n;
    const frac = sector - Math.floor(sector);
    return radii[i0] * (1 - frac) + radii[i1] * frac;
  }

  // Edge rocks — scattered gray boulders concentrated near the reef, dissipating outward
  const edgeRocks = [];
  const edgeCount = 10 + Math.floor(Math.random() * 8);
  for (let i = 0; i < edgeCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const edgeR = radiusAt(a, crownRadii);
    // Concentrated near the edge, scattering outward — exponential falloff
    const scatter = Math.pow(Math.random(), 0.6); // biased toward 0 (near edge)
    const offsetFrac = -0.2 + scatter * 1.2; // -0.2 (inside) to 1.0 (far outside)
    const dist = edgeR * (1 + offsetFrac);
    // Rocks shrink as they get further from the reef
    const sizeFalloff = 1 - scatter * 0.6;
    const rockR = (2.5 + Math.random() * 5) * (baseR / 60) * sizeFalloff;
    // Generate position first, assign color after checking neighbors
    const ox = crownOffX + Math.cos(a) * dist;
    const oy = crownOffY + Math.sin(a) * dist;
    const vertCount = 5 + Math.floor(Math.random() * 3);
    const verts = Array.from({ length: vertCount }, (_, j) => ({
      a: (j / vertCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
      r: 0.7 + Math.random() * 0.5,
    }));
    // Check if touching any existing rock — share its color if so
    let gray, warm;
    const touchNeighbor = edgeRocks.find(er => {
      const dx = er.ox - ox, dy = er.oy - oy;
      return Math.sqrt(dx * dx + dy * dy) < er.r + rockR + 1;
    });
    if (touchNeighbor) {
      gray = touchNeighbor._gray;
      warm = touchNeighbor._warm;
    } else {
      gray = 55 + Math.floor(Math.random() * 40);
      warm = Math.floor(Math.random() * 8);
    }
    edgeRocks.push({
      ox, oy, r: rockR, verts,
      _gray: gray, _warm: warm,
      color: `rgb(${gray + warm}, ${gray - 2}, ${gray - warm - 3})`,
      rimColor: `rgba(${gray + 20 + warm}, ${gray + 18}, ${gray + 15 - warm}, 0.5)`,
      aboveWater: offsetFrac < 0.25,
    });
  }

  // Grass tufts — sparse clumps on the exposed rock surface
  const grassTufts = [];
  const tuftCount = 2 + Math.floor(Math.random() * 3); // 2-4 per reef
  for (let i = 0; i < tuftCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const cr = radiusAt(a, crownRadii);
    const dist = Math.random() * cr * 0.7; // within the crown area
    const bladeCount = 3 + Math.floor(Math.random() * 4); // 3-6 blades per tuft
    const green = 45 + Math.floor(Math.random() * 30);
    const blades = [];
    for (let b = 0; b < bladeCount; b++) {
      blades.push({
        angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.8, // mostly upward, some lean
        length: (1.3 + Math.random() * 2) * (crownR / 30), // scale with reef, kept short
        width: 0.6 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2, // sway offset
      });
    }
    grassTufts.push({
      ox: crownOffX + Math.cos(a) * dist,
      oy: crownOffY + Math.sin(a) * dist,
      blades,
      color: `rgb(${green + 15}, ${green + 40}, ${green - 5})`,
      tipColor: `rgb(${green + 25}, ${green + 55}, ${green + 5})`,
    });
  }

  return {
    x, y, baseR, crownR, crownOffX, crownOffY,
    baseShape, crownShape, baseColor, crownColor, rimColor,
    baseRadii, crownRadii, radiusAt, edgeRocks, grassTufts,
    // Avoidance uses shape-aware radius
    avoidR: baseR * 0.85,
  };
}

const reefs = [];
const reefCount = Math.max(2, Math.min(4, Math.floor(Math.sqrt(w * h) / 400)));
// Main reefs — 30% larger than before
for (let i = 0; i < reefCount; i++) {
  const sizeMult = i === 0 ? 1.7 + Math.random() * 0.5 : 0.9 + Math.random() * 0.4;
  const estR = (60 + 45) * sizeMult * viewScale;
  let rx, ry, tries = 0;
  do {
    rx = w * 0.12 + Math.random() * w * 0.76;
    ry = h * 0.12 + Math.random() * h * 0.76;
    tries++;
  } while (tries < 40 && reefs.some(r => {
    const dx = r.x - rx, dy = r.y - ry;
    return Math.sqrt(dx * dx + dy * dy) < r.baseR + estR + 40;
  }));
  reefs.push(makeReef(rx, ry, sizeMult));
}
// Small satellite rocks — 5-6 extras, some near big reefs, some standalone
const satelliteCount = 15 + Math.floor(Math.random() * 4);
for (let i = 0; i < satelliteCount; i++) {
  const sizeMult = 0.25 + Math.random() * 0.2; // much smaller
  const estR = (60 + 45) * sizeMult * viewScale;
  let rx, ry, tries = 0;
  // ~60% cluster near an existing reef, ~40% standalone
  if (Math.random() < 0.6 && reefs.length > 0) {
    const parent = reefs[Math.floor(Math.random() * Math.min(reefs.length, reefCount))];
    const a = Math.random() * Math.PI * 2;
    const dist = parent.baseR * (1.1 + Math.random() * 0.6);
    rx = parent.x + Math.cos(a) * dist;
    ry = parent.y + Math.sin(a) * dist;
  } else {
    rx = w * 0.08 + Math.random() * w * 0.84;
    ry = h * 0.08 + Math.random() * h * 0.84;
  }
  // Don't overlap existing reefs
  const tooClose = reefs.some(r => {
    const dx = r.x - rx, dy = r.y - ry;
    return Math.sqrt(dx * dx + dy * dy) < r.baseR + estR + 15;
  });
  if (!tooClose) {
    const sr = makeReef(rx, ry, sizeMult);
    sr.submerged = true; // fully underwater, fish swim over them
    reefs.push(sr);
  }
}

// Generate seabed pebbles — extra density near non-submerged reefs
generateSeabedRocks();
for (const rf of reefs) {
  if (rf.submerged) continue;
  const nearCount = 5 + Math.floor(Math.random() * 5);
  for (let i = 0; i < nearCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = rf.baseR * (1.1 + Math.random() * 0.8);
    const px = rf.x + Math.cos(a) * d;
    const py = rf.y + Math.sin(a) * d;
    const rockSize = (1.5 + Math.random() * 3) * viewScale;
    const gray = 60 + Math.floor(Math.random() * 35);
    const warm = Math.floor(Math.random() * 6);
    const neighbor = seabedRocks.find(sr => {
      const dx = sr.x - px, dy = sr.y - py;
      return Math.sqrt(dx * dx + dy * dy) < sr.size + rockSize + 1;
    });
    const g = neighbor ? neighbor._gray : gray;
    const wm = neighbor ? neighbor._warm : warm;
    const vertCount = 5 + Math.floor(Math.random() * 3);
    seabedRocks.push({
      x: px, y: py, size: rockSize,
      _gray: g, _warm: wm,
      color: `rgb(${g + wm}, ${g - 2}, ${g - wm - 3})`,
      verts: Array.from({ length: vertCount }, (_, j) => ({
        a: (j / vertCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
        r: 0.65 + Math.random() * 0.5,
      })),
    });
  }
}

// Reef fish — 2-5 total bright tangs spread across reefs
const reefFish = [];
const totalTangs = 2 + Math.floor(Math.random() * 4); // 2 to 5
for (let i = 0; i < totalTangs; i++) {
  const rf = reefs[Math.floor(Math.random() * reefs.length)];
  reefFish.push(new ReefFish(rf));
}

// Kelp fronds — grow upward from seafloor, slight perspective tilt
class Frond {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    // Grow upward with slight random lean (-PI/2 = straight up on screen)
    this.growAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    const plantScale = viewScale * 0.945;
    this.len = (30 + Math.random() * 45) * plantScale;
    this.branches = 3 + Math.floor(Math.random() * 4);
    this.phase = Math.random() * Math.PI * 2;
    this.branchSide = Math.random() < 0.5 ? 1 : -1;
    this._plantScale = plantScale;
    this.branchData = [];
    for (let b = 0; b < this.branches; b++) {
      const t = 0.15 + (b / (this.branches - 1)) * 0.8;
      const taper = Math.pow(1 - t, 0.6);
      this.branchData.push({ t, lenScale: (0.7 + Math.random() * 0.3) * taper, leaflets: Math.max(1, Math.floor((2 + Math.random() * 3) * taper)) });
    }
    this.segCount = 10;
    this.segs = [];
    for (let i = 0; i <= this.segCount; i++) {
      const t = i / this.segCount;
      this.segs.push({ x: x + Math.cos(this.growAngle) * t * this.len, y: y + Math.sin(this.growAngle) * t * this.len, vx: 0, vy: 0 });
    }
  }

  displace(fx, fy, radius, strength) {
    for (let i = 1; i < this.segs.length; i++) {
      const s = this.segs[i];
      const dx = s.x - fx;
      const dy = s.y - fy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius && dist > 0.1) {
        const force = strength * (1 - dist / radius) * (i / this.segs.length);
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
      }
    }
  }

  update(dt, time) {
    const currentX = Math.cos(tide.angle) * tide.strength * 0.12 + Math.sin(time * 0.0002 + this.phase) * 0.04;
    const currentY = Math.sin(tide.angle) * tide.strength * 0.12 + Math.cos(time * 0.00015 + this.phase) * 0.03;
    for (let i = 1; i < this.segs.length; i++) {
      const s = this.segs[i];
      const t = i / this.segCount;
      // Current + local turbulence pushes plants
      const flow = sampleFlow(s.x, s.y, time);
      s.vx += (currentX + flow.fx * 0.06) * t;
      s.vy += (currentY + flow.fy * 0.06) * t;
      const restX = this.x + Math.cos(this.growAngle) * t * this.len;
      const restY = this.y + Math.sin(this.growAngle) * t * this.len;
      const tension = 0.004 * (1 - t);
      s.vx += (restX - s.x) * tension;
      s.vy += (restY - s.y) * tension;
      // Reef crown collision - segments slide around exposed rock
      for (const rf of reefs) {
        const cdx = s.x - (rf.x + rf.crownOffX);
        const cdy = s.y - (rf.y + rf.crownOffY);
        const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
        const cAngle = Math.atan2(cdy, cdx);
        const crownEdge = rf.radiusAt(cAngle, rf.crownRadii) + 2;
        if (cDist < crownEdge && cDist > 0.1) {
          // Push segment out to crown surface
          s.x = rf.x + rf.crownOffX + (cdx / cDist) * crownEdge;
          s.y = rf.y + rf.crownOffY + (cdy / cDist) * crownEdge;
          // Deflect velocity tangentially - slide along the rock
          const dot = (s.vx * cdx + s.vy * cdy) / (cDist * cDist);
          if (dot < 0) {
            s.vx -= (cdx / cDist) * dot * cDist;
            s.vy -= (cdy / cDist) * dot * cDist;
          }
          s.vx *= 0.7;
          s.vy *= 0.7;
        }
      }
      s.vx *= 0.9;
      s.vy *= 0.9;
      s.x += s.vx;
      s.y += s.vy;
      const prev = this.segs[i - 1];
      const dx = s.x - prev.x;
      const dy = s.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const segLen = this.len / this.segCount;
      if (dist > 0.01) { s.x = prev.x + dx * (segLen / dist); s.y = prev.y + dy * (segLen / dist); }
    }
  }

  // Draw upper portion (segments 2+) — interleaved with fish
  draw(ctx, time) {
    const segs = this.segs;
    const ps = this._plantScale;
    const n = segs.length;
    const baseIdx = 2;
    ctx.lineCap = 'round';
    // Thin stipe (kelp tube stem) — upper segments
    for (let i = baseIdx; i < n - 1; i++) {
      const t0 = i / (n - 1), t1 = (i + 1) / (n - 1);
      const w0 = 0.6 * ps * (1 - t0 * 0.5);
      const w1 = 0.6 * ps * (1 - t1 * 0.5);
      const ax = segs[i].x, ay = segs[i].y;
      const bx = segs[i+1].x, by = segs[i+1].y;
      const dx = bx - ax, dy = by - ay;
      const len = Math.sqrt(dx*dx+dy*dy) || 1;
      const nx = -dy/len, ny = dx/len;
      ctx.beginPath();
      ctx.moveTo(ax + nx*w0*0.5, ay + ny*w0*0.5);
      ctx.lineTo(bx + nx*w1*0.5, by + ny*w1*0.5);
      ctx.lineTo(bx - nx*w1*0.5, by - ny*w1*0.5);
      ctx.lineTo(ax - nx*w0*0.5, ay - ny*w0*0.5);
      ctx.closePath();
      ctx.fillStyle = 'rgb(25, 100, 55)';
      ctx.fill();
    }
    // Kelp blades — elongated leaf shapes at segment junctions, alternating sides
    for (let b = 0; b < this.branches; b++) {
      const bd = this.branchData[b];
      const segIdx = Math.min(Math.floor(bd.t * this.segCount), this.segCount - 1);
      if (segIdx < baseIdx) continue;
      const base = segs[segIdx];
      const next = segs[Math.min(segIdx + 1, this.segCount)];
      const stemAngle = Math.atan2(next.y - base.y, next.x - base.x);
      const side = (b % 2 === 0 ? 1 : -1) * this.branchSide;
      // Blade angles out from stem, with gentle sway
      const bladeAngle = stemAngle + side * (0.6 + Math.sin(time * 0.0008 + b * 1.7 + this.phase) * 0.2);
      const taper = Math.pow(1 - bd.t, 0.5);
      const bladeLen = this.len * (0.25 + taper * 0.15) * bd.lenScale;
      const bladeW = (0.8 + taper * 1.2) * ps;
      // Blade tip
      const tipX = base.x + Math.cos(bladeAngle) * bladeLen;
      const tipY = base.y + Math.sin(bladeAngle) * bladeLen;
      // Elongated oval blade using bezier curves
      const bpx = -Math.sin(bladeAngle), bpy = Math.cos(bladeAngle);
      const midX = (base.x + tipX) * 0.5, midY = (base.y + tipY) * 0.5;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.quadraticCurveTo(midX + bpx * bladeW * 0.5, midY + bpy * bladeW * 0.5, tipX, tipY);
      ctx.quadraticCurveTo(midX - bpx * bladeW * 0.5, midY - bpy * bladeW * 0.5, base.x, base.y);
      ctx.closePath();
      ctx.fillStyle = 'rgb(40, 130, 65)';
      ctx.fill();
      // Blade midrib — thin line down the center
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = 'rgba(25, 90, 45, 0.4)';
      ctx.lineWidth = 0.4 * ps;
      ctx.stroke();
    }
  }

  // Draw lower stipe + root — always on top, never behind fish
  drawBase(ctx) {
    const segs = this.segs;
    const ps = this._plantScale;
    const baseIdx = 2;
    ctx.lineCap = 'round';
    // Root holdfast gradient
    const rootR = 2 * ps;
    const rootGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, rootR);
    rootGrad.addColorStop(0, 'rgba(35, 85, 50, 0.3)');
    rootGrad.addColorStop(0.5, 'rgba(35, 85, 50, 0.15)');
    rootGrad.addColorStop(1, 'rgba(35, 85, 50, 0)');
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, rootR, rootR * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = rootGrad;
    ctx.fill();
    // Lower stipe — thin tube matching upper segments
    const n = segs.length;
    for (let i = 0; i < baseIdx; i++) {
      const t0 = i / (n - 1), t1 = (i + 1) / (n - 1);
      const w0 = 0.6 * ps * (1 - t0 * 0.5);
      const w1 = 0.6 * ps * (1 - t1 * 0.5);
      const ax = segs[i].x, ay = segs[i].y;
      const bx = segs[i+1].x, by = segs[i+1].y;
      const dx = bx - ax, dy = by - ay;
      const len = Math.sqrt(dx*dx+dy*dy) || 1;
      const nx = -dy/len, ny = dx/len;
      ctx.beginPath();
      ctx.moveTo(ax + nx*w0*0.5, ay + ny*w0*0.5);
      ctx.lineTo(bx + nx*w1*0.5, by + ny*w1*0.5);
      ctx.lineTo(bx - nx*w1*0.5, by - ny*w1*0.5);
      ctx.lineTo(ax - nx*w0*0.5, ay - ny*w0*0.5);
      ctx.closePath();
      ctx.fillStyle = 'rgb(25, 100, 55)';
      ctx.fill();
    }
  }
}

const plants = [];
// Kelp placement: bottom edge, around reefs, and random patches
function spawnKelp() {
  // Bottom edge — scattered along the lower portion
  const bottomCount = 8 + Math.floor(Math.random() * 6);
  for (let i = 0; i < bottomCount; i++) {
    const px = Math.random() * w;
    const py = h * (0.75 + Math.random() * 0.25);
    plants.push(new Frond(px, py));
  }
  // Around reefs — 2-5 per reef, clustered near the base
  for (const rf of reefs) {
    const count = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = rf.baseR * (0.8 + Math.random() * 0.5);
      plants.push(new Frond(rf.x + Math.cos(a) * dist, rf.y + Math.sin(a) * dist));
    }
  }
  // Random patches — 2-3 clusters of 2-4 kelp each
  const patchCount = 2 + Math.floor(Math.random() * 2);
  for (let p = 0; p < patchCount; p++) {
    const cx = w * 0.15 + Math.random() * w * 0.7;
    const cy = h * 0.4 + Math.random() * h * 0.45;
    const clusterSize = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < clusterSize; i++) {
      plants.push(new Frond(cx + (Math.random() - 0.5) * 30, cy + (Math.random() - 0.5) * 20));
    }
  }
}
spawnKelp();
for (let i = 0; i < 60; i++) {
  for (const p of plants) p.update(0.016, i * 16);
}

// Starfish — small benthic creatures near reefs, rocks, and kelp
const starfish = [];
function spawnStarfish() {
  // Scale count with viewport — 4-8 starfish
  const count = Math.max(3, Math.min(8, Math.floor(Math.sqrt(w * h) / 300)));
  // ~60% near reef bases, ~20% near kelp, ~20% on open substrate
  for (let i = 0; i < count; i++) {
    let sx, sy;
    const roll = Math.random();
    if (roll < 0.6 && reefs.length > 0) {
      // Near a reef base — underwater rock edge where starfish graze
      const rf = reefs[Math.floor(Math.random() * reefs.length)];
      const a = Math.random() * Math.PI * 2;
      const dist = rf.baseR * (0.6 + Math.random() * 0.8);
      sx = rf.x + Math.cos(a) * dist;
      sy = rf.y + Math.sin(a) * dist;
    } else if (roll < 0.8 && plants.length > 0) {
      // Near kelp base
      const p = plants[Math.floor(Math.random() * plants.length)];
      sx = p.x + (Math.random() - 0.5) * 25;
      sy = p.y + (Math.random() - 0.5) * 15;
    } else {
      // Open substrate — lower half preferred
      sx = w * 0.1 + Math.random() * w * 0.8;
      sy = h * 0.4 + Math.random() * h * 0.55;
    }
    // Clamp to bounds
    sx = Math.max(10, Math.min(w - 10, sx));
    sy = Math.max(10, Math.min(h - 10, sy));
    starfish.push(new Starfish(sx, sy));
  }
}
spawnStarfish();

let lastTime = 0;
let waveTime = 0;
let settleTime = 0;

// Tap voids — temporary zones fish avoid, fading over time
const tapVoids = [];

// Regenerate the entire world for the current viewport size
regenerateWorld = function() {
  viewScale = Math.min(2.5, Math.sqrt((w * h) / initialArea));
  rebuildGrid();

  // Clear everything
  fish.length = 0;
  predators.length = 0;
  rocks.length = 0;
  reefs.length = 0;
  reefFish.length = 0;
  plants.length = 0;
  debris.length = 0;
  ripples.length = 0;
  foodPellets.length = 0;
  foamBits.length = 0;
  killFx.length = 0;
  washWaves.length = 0;
  tapVoids.length = 0;
  starfish.length = 0;

  // Sand patches
  for (let i = 0; i < 15; i++) {
    rocks.push(makeSand(Math.random() * w, Math.random() * h));
  }

  // Main reefs — 30% larger
  const reefCount2 = Math.max(2, Math.min(4, Math.floor(Math.sqrt(w * h) / 400)));
  for (let i = 0; i < reefCount2; i++) {
    const sizeMult = i === 0 ? 1.7 + Math.random() * 0.5 : 0.9 + Math.random() * 0.4;
    const estR = (60 + 45) * sizeMult * viewScale;
    let rx, ry, tries = 0;
    do { rx = w * 0.12 + Math.random() * w * 0.76; ry = h * 0.12 + Math.random() * h * 0.76; tries++; }
    while (tries < 40 && reefs.some(r => Math.sqrt((r.x-rx)**2+(r.y-ry)**2) < r.baseR + estR + 40));
    reefs.push(makeReef(rx, ry, sizeMult));
  }
  // Small satellite rocks
  const satCount = 15 + Math.floor(Math.random() * 4);
  for (let i = 0; i < satCount; i++) {
    const sizeMult = 0.25 + Math.random() * 0.2;
    let rx, ry;
    if (Math.random() < 0.6 && reefs.length > 0) {
      const parent = reefs[Math.floor(Math.random() * Math.min(reefs.length, reefCount2))];
      const a = Math.random() * Math.PI * 2;
      const dist = parent.baseR * (1.1 + Math.random() * 0.6);
      rx = parent.x + Math.cos(a) * dist;
      ry = parent.y + Math.sin(a) * dist;
    } else {
      rx = w * 0.08 + Math.random() * w * 0.84;
      ry = h * 0.08 + Math.random() * h * 0.84;
    }
    const estR = (60 + 45) * sizeMult * viewScale;
    const tooClose = reefs.some(r => Math.sqrt((r.x-rx)**2+(r.y-ry)**2) < r.baseR + estR + 15);
    if (!tooClose) {
      const sr = makeReef(rx, ry, sizeMult);
      sr.submerged = true;
      reefs.push(sr);
    }
  }
  // Seabed pebbles
  generateSeabedRocks();
  for (const rf of reefs) {
    if (rf.submerged) continue;
    const nearCount = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < nearCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = rf.baseR * (1.1 + Math.random() * 0.8);
      const px = rf.x + Math.cos(a) * d, py = rf.y + Math.sin(a) * d;
      const rockSize = (1.5 + Math.random() * 3) * viewScale;
      const gray = 60 + Math.floor(Math.random() * 35);
      const warm = Math.floor(Math.random() * 6);
      const nb = seabedRocks.find(sr => Math.sqrt((sr.x-px)**2+(sr.y-py)**2) < sr.size+rockSize+1);
      const g = nb ? nb._gray : gray, wm = nb ? nb._warm : warm;
      const vc = 5 + Math.floor(Math.random() * 3);
      seabedRocks.push({ x: px, y: py, size: rockSize, _gray: g, _warm: wm,
        color: `rgb(${g+wm},${g-2},${g-wm-3})`,
        verts: Array.from({length:vc},(_,j)=>({a:(j/vc)*Math.PI*2+(Math.random()-0.5)*0.4,r:0.65+Math.random()*0.5})),
      });
    }
  }

  // Reef fish — 2-5 total
  const totalTangs2 = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < totalTangs2; i++) {
    const rf = reefs[Math.floor(Math.random() * reefs.length)];
    reefFish.push(new ReefFish(rf));
  }

  // Debris
  for (let i = 0; i < 500; i++) {
    const bright = Math.random() < 0.25;
    debris.push({ x: Math.random() * w, y: Math.random() * h,
      size: (bright ? (0.2+Math.random()*0.3) : (0.05+Math.random()*0.18)) * viewScale, vx: 0, vy: 0,
      opacity: bright ? (0.2+Math.random()*0.2) : (0.05+Math.random()*0.12) });
  }

  // Kelp
  spawnKelp();
  for (let i = 0; i < 60; i++) { for (const p of plants) p.update(0.016, i * 16); }

  // Starfish
  spawnStarfish();

  // Fish — swim in from edges
  basePop = Math.min(214, Math.max(45, Math.floor((w * h) / 1232)));
  popTarget = basePop * (0.7 + Math.random() * 0.3);
  const newFishCount = Math.min(214, Math.max(69, Math.floor((w * h) / 1232)));
  spawnWaves = makeSpawnWaves(newFishCount, w, h);
  spawnTimer = 0;

  // Predators
  const predCount = w * h > 600000 ? 2 : 1;
  for (let i = 0; i < predCount; i++) predators.push(new Predator());

  // Vortices
  for (const v of vortices) { v.x = Math.random() * w; v.y = Math.random() * h; }
  // Reposition clouds within new bounds
  for (const c of clouds) { c.x *= sx; c.y *= sy; }

  settleTime = 0;
  // Rebuild cached render assets for new viewport size
  rebuildBgGradient();
  rebuildSandCanvas();
};

// Background gradient — recreated on resize
let bgGradient;
function rebuildBgGradient() {
  bgGradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  bgGradient.addColorStop(0, '#2a8a9a');
  bgGradient.addColorStop(0.6, '#1e7585');
  bgGradient.addColorStop(1, '#156068');
}
rebuildBgGradient();

// Pre-rendered sand patches — rebuilt on resize
const sandCanvas = document.createElement('canvas');
const sandCtx = sandCanvas.getContext('2d');
function rebuildSandCanvas() {
  sandCanvas.width = canvas.width;
  sandCanvas.height = canvas.height;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  sandCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const r of rocks) {
    sandCtx.save();
    sandCtx.translate(r.x, r.y);
    sandCtx.rotate(r.angle);
    const sg = sandCtx.createRadialGradient(0, 0, 0, 0, 0, r.size);
    sg.addColorStop(0, `rgba(200, 190, 160, ${r.brightness})`);
    sg.addColorStop(0.6, `rgba(190, 180, 150, ${r.brightness * 0.5})`);
    sg.addColorStop(1, 'rgba(190, 180, 150, 0)');
    sandCtx.fillStyle = sg;
    sandCtx.beginPath();
    sandCtx.ellipse(0, 0, r.size, r.size * r.elongation, 0, 0, Math.PI * 2);
    sandCtx.fill();
    sandCtx.restore();
  }
  // Submerged edge rocks — baked into sand layer for zero per-frame cost
  for (const rf of reefs) {
    for (const er of rf.edgeRocks) {
      if (er.aboveWater) continue;
      sandCtx.beginPath();
      for (let vi = 0; vi <= er.verts.length; vi++) {
        const v = er.verts[vi % er.verts.length];
        const px = rf.x + er.ox + Math.cos(v.a) * v.r * er.r;
        const py = rf.y + er.oy + Math.sin(v.a) * v.r * er.r;
        if (vi === 0) sandCtx.moveTo(px, py);
        else sandCtx.lineTo(px, py);
      }
      sandCtx.closePath();
      sandCtx.fillStyle = er.color;
      sandCtx.globalAlpha = 0.6;
      sandCtx.fill();
      sandCtx.globalAlpha = 1;
    }
  }
  // Seabed pebbles — small irregular gray rocks baked into the sand layer
  for (const sr of seabedRocks) {
    sandCtx.beginPath();
    for (let vi = 0; vi <= sr.verts.length; vi++) {
      const v = sr.verts[vi % sr.verts.length];
      const px = sr.x + Math.cos(v.a) * v.r * sr.size;
      const py = sr.y + Math.sin(v.a) * v.r * sr.size;
      if (vi === 0) sandCtx.moveTo(px, py);
      else sandCtx.lineTo(px, py);
    }
    sandCtx.closePath();
    sandCtx.fillStyle = sr.color;
    sandCtx.globalAlpha = 0.35;
    sandCtx.fill();
    sandCtx.globalAlpha = 1;
  }
}
rebuildSandCanvas();

function draw(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (settleTime > 0) settleTime -= dt;

  // Spawn fish as staggered waves swimming in from edges
  if (spawnWaves.length > 0) {
    spawnTimer += dt;
    for (let wi = spawnWaves.length - 1; wi >= 0; wi--) {
      const wave = spawnWaves[wi];
      if (spawnTimer < wave.delay) continue;
      // Spawn a batch from this wave each tick
      const batchSize = Math.min(3 + Math.floor(Math.random() * 4), wave.count);
      const school = Math.floor(Math.random() * schoolColors.length);
      for (let b = 0; b < batchSize; b++) {
        const f = new Fish(wave);
        f.school = school;
        f.colorType = school;
        f.color = jitterTunaColor(schoolColors[school].color);
        f.bellyColor = jitterTunaColor(schoolColors[school].belly);
        fish.push(f);
      }
      wave.count -= batchSize;
      if (wave.count <= 0) spawnWaves.splice(wi, 1);
    }
  }

  // Wave current - irregular oscillation, not perfectly sinusoidal
  waveTime += dt;
  const waveCycle = Math.sin(waveTime * 0.4) * 0.6
                  + Math.sin(waveTime * 0.23) * 0.25
                  + Math.sin(waveTime * 0.71) * 0.15; // layered irregular rhythm
  const secondaryWave = Math.sin(waveTime * 0.11) * 0.08 + Math.sin(waveTime * 0.31) * 0.04;
  tide.angle = waveBaseAngle + secondaryWave;
  tide.strength = 0.25 + waveCycle * 0.35;

  updateOceanSound();

  // Drift vortices slowly around the pool, vary strength over time
  for (const v of vortices) {
    v.x += Math.cos(v.driftAngle) * v.driftSpeed * viewScale;
    v.y += Math.sin(v.driftAngle) * v.driftSpeed * viewScale;
    v.driftAngle += (Math.random() - 0.5) * 0.02;
    // Wrap around with padding
    if (v.x < -50) v.x = w + 50;
    if (v.x > w + 50) v.x = -50;
    if (v.y < -50) v.y = h + 50;
    if (v.y > h + 50) v.y = -50;
    // Pulse strength
    v.strength = (v.strength > 0 ? 1 : -1) * (0.3 + Math.sin(time * 0.0005 + v.phase) * 0.2);
  }

  // Spawn wash waves occasionally
  washTimer -= dt;
  if (washTimer <= 0) {
    // Sometimes skip a wave entirely
    if (Math.random() < 0.15) {
      washTimer = 8 + Math.random() * 10; // short gap, try again soon
    } else {
      spawnWash();
      // Very irregular timing - sometimes rapid sets, sometimes long lulls
      washTimer = 15 + Math.random() * 30 + (Math.random() < 0.3 ? 20 : 0);
    }
  }

  // Update wash waves - push fish and debris as they pass
  for (let i = washWaves.length - 1; i >= 0; i--) {
    const ww = washWaves[i];
    ww.x += Math.cos(ww.angle) * ww.speed;
    ww.y += Math.sin(ww.angle) * ww.speed;
    ww.traveled += ww.speed;
    ww.life = 1 - ww.traveled / ww.maxTravel;
    // Don't remove dead waves until their foam blobs have faded out
    if (ww.life <= 0 && (!ww.blobs || ww.blobs.length === 0) && (!ww.trails || ww.trails.length === 0)) { washWaves.splice(i, 1); continue; }
    // Push things in the wave's path
    const pushForce = ww.strength * ww.life;
    const cosA = Math.cos(ww.angle);
    const sinA = Math.sin(ww.angle);
    for (const f of fish) {
      const rel = (f.x - ww.x) * cosA + (f.y - ww.y) * sinA;
      if (rel > -5 && rel < ww.width) {
        f.vx += cosA * pushForce * 0.025;
        f.vy += sinA * pushForce * 0.025;
      }
    }
    for (const pred of predators) {
      const rel = (pred.x - ww.x) * cosA + (pred.y - ww.y) * sinA;
      if (rel > -5 && rel < ww.width) {
        pred.vx += cosA * pushForce * 0.015;
        pred.vy += sinA * pushForce * 0.015;
      }
    }
    for (const d of debris) {
      const rel = (d.x - ww.x) * cosA + (d.y - ww.y) * sinA;
      if (rel > -3 && rel < ww.width) {
        d.vx += cosA * pushForce * 0.08;
        d.vy += sinA * pushForce * 0.08;
        d.vx += (Math.random() - 0.5) * pushForce * 0.04;
        d.vy += (Math.random() - 0.5) * pushForce * 0.04;
      }
    }
    for (const p of plants) {
      for (let si = 1; si < p.segs.length; si++) {
        const s = p.segs[si];
        const rel = (s.x - ww.x) * cosA + (s.y - ww.y) * sinA;
        if (rel > -3 && rel < ww.width * 0.5) {
          s.vx += cosA * pushForce * 0.1 * (si / p.segCount);
          s.vy += sinA * pushForce * 0.1 * (si / p.segCount);
        }
      }
    }
    // Waves hitting reefs: spawn foam and trigger ripple boost
    for (const rf of reefs) {
      if (rf.submerged) continue;
      const rel = (rf.x - ww.x) * cosA + (rf.y - ww.y) * sinA;
      if (rel > -rf.crownR * 1.5 && rel < rf.crownR * 1.5 + ww.width) {
        // Track wave impact for ripple boost
        if (!rf._waveHit || rf._waveHit < ww.strength) {
          rf._waveHit = ww.strength;
          rf._waveAngle = ww.angle;
          rf._waveTime = time;
        }
        const splashCount = Math.ceil(3 * viewScale);
        if (foamBits.length < 300) {
          for (let si = 0; si < splashCount; si++) {
            const edgeAngle = Math.atan2(-sinA, -cosA) + (Math.random() - 0.5) * Math.PI * 0.8;
            // Spawn at the crown edge (waterline), offset by crown position
            const crownEdgeR = rf.radiusAt(edgeAngle, rf.crownRadii);
            const spawnR = crownEdgeR * (0.9 + Math.random() * 0.25);
            foamBits.push({
              x: rf.x + rf.crownOffX + Math.cos(edgeAngle) * spawnR,
              y: rf.y + rf.crownOffY + Math.sin(edgeAngle) * spawnR,
              size: (0.2 + Math.random() * 1.0) * viewScale,
              vx: Math.cos(edgeAngle) * (0.5 + Math.random()) * pushForce * 0.3,
              vy: Math.sin(edgeAngle) * (0.5 + Math.random()) * pushForce * 0.3,
              life: 1,
              maxLife: 6 + Math.random() * 12,
            });
          }
        }
      }
    }
  }

  // Clear - bright tropical shallow water (cached gradient)
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);

  // Sand patches — pre-rendered to offscreen canvas once
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(sandCanvas, 0, 0);
  ctx.restore();
  ctx.setTransform(Math.min(2, window.devicePixelRatio || 1), 0, 0, Math.min(2, window.devicePixelRatio || 1), 0, 0);

  // Cloud shadows — drifting patches of shade across the water
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (const cloud of clouds) {
    // Linear drift — move along wind direction, wrap around edges
    cloud.x += Math.cos(cloud.drift) * cloud.speed * dt;
    cloud.y += Math.sin(cloud.drift) * cloud.speed * dt;
    const margin = Math.min(w, h) * cloud.size * 1.5; // wrap with enough buffer to avoid pop
    if (cloud.x > w + margin) cloud.x = -margin;
    if (cloud.x < -margin) cloud.x = w + margin;
    if (cloud.y > h + margin) cloud.y = -margin;
    if (cloud.y < -margin) cloud.y = h + margin;
    const cx = cloud.x;
    const cy = cloud.y;
    const baseR = Math.min(w, h) * cloud.size;
    // Each cloud is several overlapping soft circles for organic blobby shape
    for (const lobe of cloud.subBlobs) {
      const lx = cx + lobe.ox * baseR;
      const ly = cy + lobe.oy * baseR;
      const lr = baseR * lobe.scale;
      // Gentle size breathing so edges aren't static
      const breathe = 1 + Math.sin(time * 0.00015 + cloud.phase + lobe.ox * 5) * 0.06;
      const r = lr * breathe;
      const sg = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
      // multiply blend: rgb(255,255,255) = no change, darker = shadow
      const shade = Math.round(255 * (1 - cloud.opacity));
      sg.addColorStop(0, `rgb(${shade}, ${shade + 4}, ${shade + 6})`); // slight cool tint in shadow core
      sg.addColorStop(0.6, `rgb(${shade + 20}, ${shade + 22}, ${shade + 24})`);
      sg.addColorStop(1, 'rgb(255, 255, 255)');
      ctx.fillStyle = sg;
      ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
    }
  }
  ctx.restore();

  // Sun spots — bright warm patches where light bleeds through cloud gaps
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  // 4 sun spots, each drifts independently and pulses in/out
  for (let i = 0; i < 4; i++) {
    const phase = time * 0.00005 + i * 1.7;
    const wave = Math.sin(phase) * 0.5 + 0.5;
    // Only visible when "sun is out" for this patch — threshold creates on/off feel
    const fade = Math.max(0, (wave - 0.4) / 0.6);
    if (fade < 0.01) continue;
    const intensity = fade * fade * 0.09;
    // Drift position — different trajectory than clouds so they don't track together
    const sx = w * (0.15 + i * 0.22) + Math.sin(time * 0.000025 + i * 2.1) * w * 0.18;
    const sy = h * (0.2 + i * 0.18) + Math.cos(time * 0.00002 + i * 1.3) * h * 0.18;
    const sr = Math.min(w, h) * (0.15 + Math.sin(time * 0.00008 + i) * 0.04);
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sg.addColorStop(0, `rgba(220, 240, 200, ${intensity})`);       // warm bright center
    sg.addColorStop(0.3, `rgba(190, 230, 210, ${intensity * 0.7})`);
    sg.addColorStop(0.7, `rgba(160, 220, 200, ${intensity * 0.3})`);
    sg.addColorStop(1, 'rgba(160, 220, 200, 0)');
    ctx.fillStyle = sg;
    ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  }
  ctx.restore();

  // Reef structures - underwater base (drawn under fish)
  for (const rf of reefs) {
    ctx.save();
    ctx.translate(rf.x, rf.y);
    // Underwater shadow/glow
    const shadowGrad = ctx.createRadialGradient(0, 0, rf.baseR * 0.3, 0, 0, rf.baseR * 1.3);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(-rf.baseR * 1.5, -rf.baseR * 1.5, rf.baseR * 3, rf.baseR * 3);
    // Submerged rock base — layered shape fills that fade inward from perimeter
    // Blend base color toward sandy tones so it merges with the seafloor
    const cm0 = rf.baseColor.match(/\d+/g).map(Number);
    const cm = [
      Math.round(cm0[0] * 0.4 + 160 * 0.6),
      Math.round(cm0[1] * 0.4 + 150 * 0.6),
      Math.round(cm0[2] * 0.4 + 120 * 0.6),
    ];
    // Average radius for blending toward circle (eroded underwater)
    const avgBaseR = rf.baseRadii.reduce((a, b) => a + b, 0) / rf.baseRadii.length;
    const layers = 6;
    for (let layer = 0; layer < layers; layer++) {
      const scale = (1.2 - (layer / layers) * 0.7) * 1.5; // 1.8 outer to 0.75 inner
      const alpha = (layer / (layers - 1)) * 0.25; // 0 outer to 0.25 inner
      // All layers blend strongly toward circle — underwater rock is eroded smooth
      const smooth = 1 - (layer / (layers - 1)) * 0.5; // 1.0 at outermost, 0.5 at innermost
      ctx.beginPath();
      const n = rf.baseShape.length;
      // Compute smoothed points — blend between original shape and circle
      const pts = rf.baseShape.map((p, i) => {
        const r = rf.baseRadii[i];
        const blended = r * (1 - smooth * 0.9) + avgBaseR * smooth * 0.9;
        const a = Math.atan2(p.y, p.x);
        return { x: Math.cos(a) * blended * scale, y: Math.sin(a) * blended * scale };
      });
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < n; i++) {
        const next = pts[(i + 1) % n];
        const mx = (pts[i].x + next.x) * 0.5;
        const my = (pts[i].y + next.y) * 0.5;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${cm[0]},${cm[1]},${cm[2]},${alpha})`;
      ctx.fill();
    }
    ctx.restore();
  }

  // Update plants + displace from fish
  for (const p of plants) p.update(dt, time);
  for (const f of fish) {
    if (f.speed < 0.5) continue;
    for (const p of plants) p.displace(f.x, f.y, 12 * f.scale, f.speed * 0.035);
  }
  for (const pred of predators) {
    for (const p of plants) p.displace(pred.x, pred.y, 35, pred.speed * 0.2);
  }

  // Debris update - affected by tide (drawing happens in y-sorted pass)
  for (const d of debris) {
    d.vx += Math.cos(tide.angle) * tide.strength * 0.008 * viewScale;
    d.vy += Math.sin(tide.angle) * tide.strength * 0.008 * viewScale;
    const dFlow = sampleFlow(d.x, d.y, time);
    d.vx += dFlow.fx * 0.015 * viewScale;
    d.vy += dFlow.fy * 0.015 * viewScale;
    d.vx *= 0.97;
    d.vy *= 0.97;
    d.x += d.vx;
    d.y += d.vy;
    for (const rf of reefs) {
      const rdx = d.x - rf.x, rdy = d.y - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const angle = Math.atan2(rdy, rdx);
      const edgeR = rf.radiusAt(angle, rf.baseRadii);
      if (rDist < edgeR && rDist > 0.1) {
        d.x = rf.x + (rdx / rDist) * edgeR;
        d.y = rf.y + (rdy / rDist) * edgeR;
        const dot = (d.vx * rdx + d.vy * rdy) / (rDist * rDist);
        if (dot < 0) {
          d.vx -= rdx / rDist * dot * rDist;
          d.vy -= rdy / rDist * dot * rDist;
        }
      }
    }
    if (d.x < 0) d.x = w; if (d.x > w) d.x = 0;
    if (d.y < 0) d.y = h; if (d.y > h) d.y = 0;
  }

  // Update and draw floating foam bits — drift with current, slowly shrink and fade
  for (let i = foamBits.length - 1; i >= 0; i--) {
    const fb = foamBits[i];
    fb.life -= dt / fb.maxLife;
    if (fb.life <= 0) { foamBits.splice(i, 1); continue; }
    const flow = sampleFlow(fb.x, fb.y, time);
    // Stronger current influence so foam really drifts with the water
    fb.vx += (Math.cos(tide.angle) * tide.strength * 0.018 + flow.fx * 0.035) * viewScale;
    fb.vy += (Math.sin(tide.angle) * tide.strength * 0.018 + flow.fy * 0.035) * viewScale;
    // Wash wave push — foam gets shoved by passing wave fronts
    for (const ww of washWaves) {
      if (ww.life <= 0) continue;
      const cosA = Math.cos(ww.angle), sinA = Math.sin(ww.angle);
      const rel = (fb.x - ww.x) * cosA + (fb.y - ww.y) * sinA;
      if (rel > -5 && rel < ww.width) {
        const push = ww.strength * ww.life * 0.08;
        fb.vx += cosA * push;
        fb.vy += sinA * push;
      }
    }
    fb.vx *= 0.97;
    fb.vy *= 0.97;
    fb.x += fb.vx;
    fb.y += fb.vy;
    // Foam deflects around reefs - irregular boundary, gradient push
    for (const rf of reefs) {
      const rdx = fb.x - rf.x, rdy = fb.y - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const angle = Math.atan2(rdy, rdx);
      const fNoise = 0.85 + 0.3 * Math.sin(angle * 5.7 + rf.x * 0.1) + 0.15 * Math.sin(angle * 3.1 + rf.y * 0.1);
      const edgeR = rf.radiusAt(angle, rf.baseRadii) * 0.45 * fNoise;
      const pushZone = edgeR * 1.6;
      if (rDist < pushZone && rDist > 0.1) {
        const pen = 1 - rDist / pushZone;
        fb.vx += (rdx / rDist) * pen * 0.15;
        fb.vy += (rdy / rDist) * pen * 0.15;
        const spd = Math.sqrt(fb.vx * fb.vx + fb.vy * fb.vy);
        const cross = fb.vx * rdy - fb.vy * rdx;
        const sign = cross >= 0 ? 1 : -1;
        fb.vx += (-rdy / rDist) * sign * pen * spd * 0.3;
        fb.vy += (rdx / rDist) * sign * pen * spd * 0.3;
        if (rDist < edgeR) {
          fb.x = rf.x + (rdx / rDist) * edgeR;
          fb.y = rf.y + (rdy / rDist) * edgeR;
        }
      }
    }
    if (fb.x < -20 || fb.x > w + 20 || fb.y < -20 || fb.y > h + 20) { foamBits.splice(i, 1); continue; }
    // Size: holds steady for first 60% of life, then smoothly shrinks to zero
    const sizeCurve = fb.life > 0.6 ? 1 - (1 - fb.life) * 0.3 : Math.pow(fb.life / 0.6, 1.5);
    const drawSize = fb.size * sizeCurve;
    if (drawSize < 0.05) { foamBits.splice(i, 1); continue; }
    // Opacity: gentle fade that accelerates — cubic ease-out to zero
    const alpha = fb.life * fb.life * fb.life * 0.35;
    if (alpha < 0.003) { foamBits.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, drawSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 225, 235, ${alpha})`;
    ctx.fill();
  }

  // Update and draw kill effect particles (scale glitter)
  for (let i = killFx.length - 1; i >= 0; i--) {
    const kp = killFx[i];
    kp.life -= dt / kp.maxLife;
    if (kp.life <= 0) { killFx.splice(i, 1); continue; }
    kp.vx *= 0.96;
    kp.vy *= 0.96;
    kp.vx += Math.cos(tide.angle) * tide.strength * 0.005;
    kp.vy += Math.sin(tide.angle) * tide.strength * 0.005;
    kp.x += kp.vx;
    kp.y += kp.vy;
    if (kp.type === 'bubble') {
      // Turbulence bubbles — pale circles that shrink and rise slightly
      kp.vy -= 0.02; // bubbles drift upward slightly
      const r = kp.size * (0.5 + kp.life * 0.5);
      const alpha = kp.life * kp.life * 0.4;
      // Outer ring
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 220, 230, ${alpha})`;
      ctx.lineWidth = Math.max(0.3, r * 0.25);
      ctx.stroke();
      // Inner highlight
      ctx.beginPath();
      ctx.arc(kp.x - r * 0.2, kp.y - r * 0.2, r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210, 240, 245, ${alpha * 0.6})`;
      ctx.fill();
    } else {
      // Scale glitter - tiny bright flecks that catch light
      kp.sparkle += dt * 8;
      const glint = 0.4 + Math.sin(kp.sparkle) * 0.6; // flickering brightness
      const alpha = kp.life * glint;
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, kp.size * kp.life, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 230, 240, ${alpha})`;
      ctx.fill();
      // Colored reflection from prey's scales
      if (alpha > 0.2) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, kp.size * kp.life * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = kp.color.replace('rgb', 'rgba').replace(')', `,${alpha * 0.5})`);
        ctx.fill();
      }
    }
  }

  // Update and draw food pellets
  for (let i = foodPellets.length - 1; i >= 0; i--) {
    const fp = foodPellets[i];
    fp.vx *= 0.92;
    fp.vy *= 0.92;
    fp.vx += Math.cos(tide.angle) * tide.strength * 0.001;
    fp.vy += Math.sin(tide.angle) * tide.strength * 0.001;
    fp.x += fp.vx;
    fp.y += fp.vy;
    // Food on or near a reef slides out to where fish can reach it
    let stillOnRock = false;
    for (const rf of reefs) {
      // Crown check - food on the dry rock rolls off
      const cdx = fp.x - (rf.x + rf.crownOffX), cdy = fp.y - (rf.y + rf.crownOffY);
      const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
      const cAngle = Math.atan2(cdy, cdx);
      const crownEdge = rf.radiusAt(cAngle, rf.crownRadii) + 3;
      if (cDist < crownEdge && cDist > 0.1) {
        stillOnRock = true;
        fp.vx += (cdx / cDist) * 0.15;
        fp.vy += (cdy / cDist) * 0.15;
        fp.vx *= 0.82;
        fp.vy *= 0.82;
      }
      // Crown water zone - food just past the crown still blocks fish, push it clear
      const crownClear = crownEdge * 1.8;
      if (!stillOnRock && cDist < crownClear && cDist > 0.1) {
        const pen = 1 - cDist / crownClear;
        fp.vx += (cdx / cDist) * pen * 0.25;
        fp.vy += (cdy / cDist) * pen * 0.25;
      }
      // Base check - food inside the rock boundary pushes out quickly
      const bdx = fp.x - rf.x, bdy = fp.y - rf.y;
      const bDist = Math.sqrt(bdx * bdx + bdy * bdy);
      const bAngle = Math.atan2(bdy, bdx);
      const foodBaseEdge = rf.radiusAt(bAngle, rf.baseRadii) * 0.7;
      if (!stillOnRock && bDist < foodBaseEdge && bDist > 0.1) {
        const pen = 1 - bDist / foodBaseEdge;
        fp.vx += (bdx / bDist) * pen * 0.4;
        fp.vy += (bdy / bDist) * pen * 0.4;
      }
    }
    // Splash when food rolls off the rock into water
    if (fp.onRock && !stillOnRock) {
      ripples.push({ x: fp.x, y: fp.y, radius: 1, maxRadius: 15, opacity: 0.3 });
      fp.vx *= 0.3;
      fp.vy *= 0.3;
    }
    fp.onRock = stillOnRock;
    if (fp.bites <= 0 || fp.size < 0.3) { foodPellets.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 130, 60, ${Math.min(0.8, 0.3 + fp.size * 0.2)})`;
    ctx.fill();
  }

  // Draw wash wave fronts - foam shed behind the wave, not in front
  for (const ww of washWaves) {
    if (!ww.blobs) ww.blobs = [];
    const cosA = Math.cos(ww.angle);
    const sinA = Math.sin(ww.angle);
    const span = Math.max(w, h) * 1.2;
    const alive = ww.life > 0.1; // wave front still active (not just lingering foam)

    // Spawn foam only while the wave front is still active
    if (alive) {
      const foamCount = Math.ceil(4 * viewScale);
      for (let i = 0; i < foamCount; i++) {
        const lateral = (Math.random() - 0.5) * span;
        const behind = Math.random() * 5 * viewScale;
        ww.blobs.push({
          x: ww.x - cosA * behind + (-sinA) * lateral,
          y: ww.y - sinA * behind + cosA * lateral,
          size: (0.3 + Math.pow(Math.random(), 2) * 2.0) * viewScale,
          elongX: 0.7 + Math.random() * 1.0,
          elongY: 0.5 + Math.random() * 0.5,
          rot: Math.random() * Math.PI,
          age: 0,
          maxAge: 5 + Math.random() * 6,
        });
      }
      // Shed tiny foam bits into the water (cap at 250)
      if (foamBits.length < 250) {
        for (let i = 0; i < 2; i++) {
          const lateral = (Math.random() - 0.5) * span;
          foamBits.push({
            x: ww.x - cosA * Math.random() * 10 + (-sinA) * lateral,
            y: ww.y - sinA * Math.random() * 10 + cosA * lateral,
            size: (0.1 + Math.random() * 0.56) * viewScale,
            vx: 0, vy: 0,
            life: 1,
            maxLife: 8 + Math.random() * 16,
          });
        }
      }
    }

    // Shed trail lines behind the wave — irregular ripples left in its wake
    if (!ww.trails) ww.trails = [];
    if (!ww._nextTrail) ww._nextTrail = 20 + Math.random() * 40;
    if (alive && ww.traveled > ww._nextTrail) {
      ww._nextTrail = ww.traveled + 30 + Math.random() * 60; // irregular spacing
      // Pick one of the thinner line styles to shed
      const pick = 1 + Math.floor(Math.random() * 3); // index 1-3
      const templates = [
        null,
        { thick: 1.2 * viewScale, alpha: 0.18, freq: 1.3 },
        { thick: 0.8 * viewScale, alpha: 0.10, freq: 0.8 },
        { thick: 0.5 * viewScale, alpha: 0.06, freq: 1.6 },
      ];
      const tmpl = templates[pick];
      ww.trails.push({
        x: ww.x, y: ww.y,
        seed: (ww.seed || 0) + Math.random() * 10,
        traveled: ww.traveled,
        thick: tmpl.thick,
        alpha: tmpl.alpha * (0.6 + Math.random() * 0.4),
        freq: tmpl.freq,
        life: 1,
        maxLife: 3 + Math.random() * 4,
        driftSpeed: ww.speed * (0.08 + Math.random() * 0.12),
      });
    }
    // Update and draw trail lines
    for (let ti = ww.trails.length - 1; ti >= 0; ti--) {
      const tr = ww.trails[ti];
      tr.life -= dt / tr.maxLife;
      if (tr.life <= 0) { ww.trails.splice(ti, 1); continue; }
      tr.x += cosA * tr.driftSpeed;
      tr.y += sinA * tr.driftSpeed;
      const trAlpha = tr.life * tr.life * tr.alpha;
      if (trAlpha < 0.003) { ww.trails.splice(ti, 1); continue; }
      const perpX = -sinA, perpY = cosA;
      const t2 = time * 0.0012;
      ctx.beginPath();
      const step = 4;
      let first = true;
      for (let pos = -span; pos <= span; pos += step) {
        const f = tr.freq;
        const vs = viewScale;
        const offset = (Math.sin(pos * 0.04 * f + t2 * 3.1 + tr.seed) * 6
                     + Math.sin(pos * 0.09 * f + t2 * 5.7 + tr.seed * 2.3) * 4
                     + Math.sin(pos * 0.18 * f + t2 * 9.3 + tr.seed * 4.7) * 2) * vs;
        let px = tr.x + perpX * pos + cosA * offset;
        let py = tr.y + perpY * pos + sinA * offset;
        const deflect = reefDeflect(px, py);
        if (deflect > 0) { px -= cosA * deflect; py -= sinA * deflect; }
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.globalAlpha = trAlpha;
      ctx.strokeStyle = 'rgba(200, 230, 245, 1)';
      ctx.lineWidth = tr.thick * tr.life;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Wave-reef interaction: push wave line points backward around above-water reefs
    // Returns extra backward offset (positive = pushed back against wave direction)
    function reefDeflect(px, py) {
      let push = 0;
      for (const rf of reefs) {
        if (rf.submerged) continue;
        const cx = rf.x + rf.crownOffX, cy = rf.y + rf.crownOffY;
        const dx = px - cx, dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const edge = rf.radiusAt(angle, rf.crownRadii);
        const influence = edge + 25 * viewScale; // deflection starts before contact
        if (dist < influence) {
          const t = 1 - dist / influence; // 0 at edge of influence, 1 at reef center
          push = Math.max(push, t * t * 35 * viewScale); // quadratic falloff
        }
      }
      return push;
    }

    // Draw wave front lines only while active
    if (alive) {
      const perpX = -sinA;
      const perpY = cosA;
      if (!ww.seed) ww.seed = Math.random() * 100;
      const t = time * 0.0012;
      const lines = [
        { behind: 0, thick: 1.8 * viewScale, alpha: 0.35, freq: 1.0 },
        { behind: 6 * viewScale, thick: 1.0 * viewScale, alpha: 0.18, freq: 1.1 },
        { behind: 14 * viewScale, thick: 0.5 * viewScale, alpha: 0.08, freq: 1.5 },
      ];
      for (const ln of lines) {
        ctx.beginPath();
        const step = 3;
        let first = true;
        for (let pos = -span; pos <= span; pos += step) {
          const f = ln.freq;
          const vs = viewScale;
          // Time-driven oscillation so wave shape constantly evolves
          const offset = (Math.sin(pos * 0.04 * f + t * 3.1 + ww.seed) * 6
                       + Math.sin(pos * 0.09 * f + t * 5.7 + ww.seed * 2.3) * 4
                       + Math.sin(pos * 0.18 * f + t * 9.3 + ww.seed * 4.7) * 2
                       + Math.sin(pos * 0.35 * f + t * 14 + ww.seed * 7) * 1) * vs;
          let px = ww.x + perpX * pos + cosA * (offset - ln.behind);
          let py = ww.y + perpY * pos + sinA * (offset - ln.behind);
          const deflect = reefDeflect(px, py);
          if (deflect > 0) { px -= cosA * deflect; py -= sinA * deflect; }
          if (first) { ctx.moveTo(px, py); first = false; }
          else ctx.lineTo(px, py);
      }
        ctx.globalAlpha = ww.life * ln.alpha;
        ctx.strokeStyle = 'rgba(200, 230, 245, 1)';
        ctx.lineWidth = ln.thick;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    } // end if (alive) — blob drawing continues below for lingering foam

    // Update and draw blobs - drift with current and turbulence, fade out
    for (let i = ww.blobs.length - 1; i >= 0; i--) {
      const b = ww.blobs[i];
      b.age += dt;
      if (b.age > b.maxAge) { ww.blobs.splice(i, 1); continue; }
      const life = 1 - b.age / b.maxAge;
      // Turbulence intensity decays over lifetime - chaotic when fresh, calm when old
      const turb = life * life; // quadratic falloff
      const flow = sampleFlow(b.x, b.y, time);
      // Strong swirling motion when young, gentle drift when old
      b.x += Math.cos(tide.angle) * tide.strength * 0.3 + flow.fx * (0.2 + turb * 1.2);
      b.y += Math.sin(tide.angle) * tide.strength * 0.3 + flow.fy * (0.2 + turb * 1.2);
      // Rapid spinning when fresh, settles down
      b.rot += (flow.fx * 0.08 + Math.sin(b.age * 3 + b.rot) * 0.04) * turb;
      // Elongation stretches and morphs with turbulence
      const stretch = 1 + turb * Math.sin(b.age * 2.5 + b.x * 0.1) * 0.6;
      // Shrink only in the last 30% of life — stays near full size, then melts away
      const shrink = life < 0.3 ? 0.3 + (life / 0.3) * 0.7 : 1.0;
      // Fade: hold steady then ease out in final 40% — no abrupt pop
      const alpha = life < 0.4 ? (life / 0.4) * (life / 0.4) * 0.22 : 0.22;
      if (alpha < 0.003) { ww.blobs.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, b.size * b.elongX * shrink * stretch, b.size * b.elongY * shrink / stretch, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210, 230, 240, 1)';
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;

  // Update ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.radius += dt * 70 * viewScale;
    r.opacity *= (1 - dt * 1.5);
    if (r.opacity > 0.01 && r.radius < r.maxRadius) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 210, 220, ${r.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (r.radius >= r.maxRadius || r.opacity < 0.01) ripples.splice(i, 1);
  }

  // Decay tap voids
  for (let i = tapVoids.length - 1; i >= 0; i--) {
    tapVoids[i].life -= dt / tapVoids[i].maxLife;
    if (tapVoids[i].life <= 0) tapVoids.splice(i, 1);
  }

  // Cursor glow
  if (mouse.active && !mouse.down) {
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180, 210, 220, 0.06)';
    ctx.fill();
  }

  // Organic population — target wanders, fish come and go naturally
  popDriftTimer -= dt;
  if (popDriftTimer <= 0) {
    // Shift the target: sometimes sparser, sometimes denser
    const drift = (Math.random() - 0.5) * basePop * 0.4;
    popTarget = Math.max(basePop * 0.35, Math.min(basePop * 1.3, popTarget + drift));
    popDriftTimer = 12 + Math.random() * 40;
  }

  // Occasionally a few fish decide to leave — swim offscreen and don't come back
  if (fish.length > popTarget * 0.8 && Math.random() < 0.002) {
    // Pick a random fish that isn't already leaving
    const candidates = fish.filter(f => !f.leaving && !f.eating);
    if (candidates.length > 3) {
      const leaver = candidates[Math.floor(Math.random() * candidates.length)];
      leaver.leaving = true;
      leaver.distracted = true; // break from school
      // Nudge toward nearest edge
      const toLeft = leaver.x, toRight = w - leaver.x;
      const toTop = leaver.y, toBottom = h - leaver.y;
      const minEdge = Math.min(toLeft, toRight, toTop, toBottom);
      if (minEdge === toLeft) leaver.vx -= 0.5;
      else if (minEdge === toRight) leaver.vx += 0.5;
      else if (minEdge === toTop) leaver.vy -= 0.5;
      else leaver.vy += 0.5;
    }
  }
  // Remove fish that have left the area
  for (let i = fish.length - 1; i >= 0; i--) {
    const f = fish[i];
    if (f.leaving && (f.x < -w * 0.5 || f.x > w * 1.5 || f.y < -h * 0.5 || f.y > h * 1.5)) {
      fish.splice(i, 1);
    }
  }

  // Occasional school arrival — a wave of new fish swims in
  schoolArrivalTimer -= dt;
  if (schoolArrivalTimer <= 0) {
    const waveSize = 3 + Math.floor(Math.random() * 10);
    const school = Math.floor(Math.random() * schoolColors.length);
    // Fresh entry point for this wave
    const edge = Math.floor(Math.random() * 4);
    const margin = 80 + Math.random() * 40;
    let ex, ey, ea;
    if (edge === 0) { ex = -margin; ey = h * 0.2 + Math.random() * h * 0.6; ea = (Math.random() - 0.5) * 0.5; }
    else if (edge === 1) { ex = w + margin; ey = h * 0.2 + Math.random() * h * 0.6; ea = Math.PI + (Math.random() - 0.5) * 0.5; }
    else if (edge === 2) { ex = w * 0.2 + Math.random() * w * 0.6; ey = -margin; ea = Math.PI / 2 + (Math.random() - 0.5) * 0.5; }
    else { ex = w * 0.2 + Math.random() * w * 0.6; ey = h + margin; ea = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; }
    for (let i = 0; i < waveSize; i++) {
      const nf = new Fish({ x: ex, y: ey, angle: ea });
      nf.school = school;
      nf.colorType = school;
      nf.color = jitterTunaColor(schoolColors[school].color);
      nf.bellyColor = jitterTunaColor(schoolColors[school].belly);
      fish.push(nf);
    }
    schoolArrivalTimer = 20 + Math.random() * 60;
  }

  // Gentle trickle respawn if well below target (predator ate too many)
  if (fish.length < popTarget * 0.6) {
    fishRespawnTimer += dt;
    if (fishRespawnTimer > 1.5) {
      fishRespawnTimer = 0;
      const school = Math.floor(Math.random() * schoolColors.length);
      const entry = schoolEntries[school];
      const f = new Fish(entry);
      f.school = school;
      f.colorType = school;
      f.color = jitterTunaColor(schoolColors[school].color);
      f.bellyColor = jitterTunaColor(schoolColors[school].belly);
      fish.push(f);
    }
  } else {
    fishRespawnTimer = 0;
  }

  // Update and draw fish + predators + reef fish
  populateGrid(fish); // rebuild spatial grid for O(n) neighbor queries
  for (const f of fish) f.update(dt, fish, time);
  for (const rf of reefFish) rf.update(dt, fish, time);
  for (const p of predators) p.update(dt, fish, time);
  for (const s of starfish) s.update(dt, time);

  // Draw swimmers and plants interleaved by y-position (top-down perspective)
  // Items higher on screen (lower y) are "further back" and drawn first
  const drawables = [];
  for (const f of fish) drawables.push({ y: f.y, type: 'fish', obj: f });
  for (const rf of reefFish) drawables.push({ y: rf.y, type: 'fish', obj: rf });
  for (const p of predators) drawables.push({ y: p.y, type: 'fish', obj: p });
  for (const p of plants) drawables.push({ y: p.y, type: 'plant', obj: p });
  for (const d of debris) drawables.push({ y: d.y, type: 'debris', obj: d });
  for (const s of starfish) drawables.push({ y: s.y, type: 'starfish', obj: s });
  // Layer priority: bottom-dwellers first, then fish on top
  const layerOrder = { plant: 0, debris: 0, starfish: 0, fish: 1 };
  drawables.sort((a, b) => (layerOrder[a.type] - layerOrder[b.type]) || (a.y - b.y));

  // Batch all fish shadows into offscreen canvas, blur once, composite
  drawAllFishShadows(ctx, drawables);

  for (const d of drawables) {
    if (d.type === 'plant') {
      d.obj.draw(ctx, time);
    } else if (d.type === 'debris') {
      ctx.beginPath();
      ctx.arc(d.obj.x, d.obj.y, d.obj.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210, 235, 240, ${d.obj.opacity})`;
      ctx.fill();
    } else if (d.type === 'starfish') {
      ctx.save();
      ctx.globalAlpha = d.obj.depthAlpha;
      d.obj.draw(ctx);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = d.obj.depthAlpha;
      d.obj.draw(ctx);
      ctx.restore();
    }
  }

  // Kelp base stems — always drawn on top so fish never clip behind roots
  for (const p of plants) p.drawBase(ctx);

  // Caustics — light ripple patterns refracting through water surface
  // More visible in sunlit areas, dimmed under cloud shadow
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 7; i++) {
    const cx = w * 0.2 + Math.sin(time * 0.00014 + i * 1.3) * w * 0.6;
    const cy = h * 0.2 + Math.cos(time * 0.00018 + i * 1.9) * h * 0.6;
    // Caustics shimmer — size oscillates for a rippling net effect
    const cr = 30 + Math.sin(time * 0.0004 + i * 0.8) * 18 + Math.sin(time * 0.00073 + i * 2.1) * 10;
    const shimmer = 0.5 + Math.sin(time * 0.0006 + i * 1.1) * 0.5; // 0-1 brightness pulse
    const baseAlpha = 0.03 + shimmer * 0.05;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    cg.addColorStop(0, `rgba(140, 225, 235, ${baseAlpha})`);
    cg.addColorStop(0.5, `rgba(120, 210, 220, ${baseAlpha * 0.4})`);
    cg.addColorStop(1, 'rgba(120, 210, 220, 0)');
    ctx.fillStyle = cg;
    ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
  }
  ctx.restore();

  // Wave hint patches — subtle bright bands drifting across the surface
  // Like light refracting through gentle ocean swells passing overhead
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const wdx = Math.cos(waveBaseAngle), wdy = Math.sin(waveBaseAngle);
  for (let i = 0; i < 5; i++) {
    const phase = time * 0.00008 + i * 1.7;
    const drift = time * 0.00003 * (0.8 + i * 0.15);
    // Each patch fades in and out on a slow cycle
    const life = Math.sin(phase) * 0.5 + 0.5;
    if (life < 0.15) continue; // skip when too faint
    const fade = (life - 0.15) / 0.85;
    const alpha = fade * fade * 0.04;
    // Drift along the same direction as the main wash waves
    const travel = ((drift * w * 3 + i * w * 0.6) % (w * 1.4)) - w * 0.2;
    const spread = Math.sin(phase * 1.3 + i * 2.3) * h * 0.35;
    const wx = w * 0.5 + wdx * travel - wdy * spread;
    const wy = h * 0.5 + wdy * travel + wdx * spread;
    const wLen = 80 + Math.sin(phase * 0.7) * 40; // length along wave direction
    const wWid = 20 + Math.sin(phase * 1.1 + i) * 10; // narrow cross-section
    ctx.save();
    ctx.translate(wx, wy);
    ctx.rotate(waveBaseAngle);
    const wg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    wg.addColorStop(0, `rgba(180, 230, 240, ${alpha})`);
    wg.addColorStop(0.5, `rgba(160, 220, 230, ${alpha * 0.5})`);
    wg.addColorStop(1, 'rgba(160, 220, 230, 0)');
    ctx.scale(wLen, wWid);
    ctx.fillStyle = wg;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
  ctx.restore();

  // Reef structures - waterline effects then above-water crown
  for (const rf of reefs) {
    if (rf.submerged) continue; // fully underwater, no crown to draw
    ctx.save();
    ctx.translate(rf.x, rf.y);
    const nv = rf.crownShape.length;
    const t = time * 0.001; // seconds

    // Wave impact — ramps in over 0.5s, then fades out over 5s
    let waveBoost = 0, waveHitCos = 0, waveHitSin = 0;
    if (rf._waveHit && rf._waveTime) {
      const elapsed = (time - rf._waveTime) * 0.001; // seconds since impact
      const rampIn = Math.min(1, elapsed / 0.5); // 0→1 over first 0.5s
      const fadeOut = Math.max(0, 1 - Math.max(0, elapsed - 0.5) / 5); // 1→0 over next 5s
      waveBoost = rf._waveHit * rampIn * fadeOut;
      waveHitCos = Math.cos(rf._waveAngle);
      waveHitSin = Math.sin(rf._waveAngle);
      if (elapsed > 5.5) rf._waveHit = 0;
    }

    // Waterline ripples — more rings radiating outward, chaotic with currents
    const ringCount = 4 + Math.ceil(waveBoost * 3); // 4 base, up to 7 during wave
    for (let ring = 0; ring < ringCount; ring++) {
      const ringPhase = t * (0.5 + ring * 0.12) + ring * 1.7;
      const baseOffset = ring * 2.5 + Math.sin(ringPhase) * 2;
      // Wave boost pushes outer rings further on the hit side
      const boostOffset = waveBoost * ring * 3;
      ctx.beginPath();
      for (let i = 0; i <= nv; i++) {
        const idx = i % nv;
        const cp = rf.crownShape[idx];
        const cpDist = Math.sqrt(cp.x * cp.x + cp.y * cp.y) || 1;
        const nx = cp.x / cpDist, ny = cp.y / cpDist;
        // Per-point wobble — more chaotic with tide and turbulence
        const pointPhase = ringPhase + idx * 0.9;
        const wobble = Math.sin(pointPhase) * 3
                     + Math.sin(pointPhase * 2.3 + 1.7) * 1.5
                     + Math.sin(pointPhase * 4.1 + ring * 0.8) * 0.8;
        // Wave-side boost: points facing the wave direction get pushed out more
        const waveFacing = nx * waveHitCos + ny * waveHitSin; // -1 to 1
        const dirBoost = boostOffset * Math.max(0, waveFacing);
        const totalOffset = baseOffset + wobble + dirBoost;
        const px = cp.x + nx * totalOffset;
        const py = cp.y + ny * totalOffset;
        if (i === 0) ctx.moveTo(px, py);
        else {
          const prev = rf.crownShape[(i - 1) % nv];
          const prevDist = Math.sqrt(prev.x * prev.x + prev.y * prev.y) || 1;
          const prevNx = prev.x / prevDist, prevNy = prev.y / prevDist;
          const prevPhase = ringPhase + ((i - 1) % nv) * 0.9;
          const prevWobble = Math.sin(prevPhase) * 3
                           + Math.sin(prevPhase * 2.3 + 1.7) * 1.5
                           + Math.sin(prevPhase * 4.1 + ring * 0.8) * 0.8;
          const prevWaveFacing = prevNx * waveHitCos + prevNy * waveHitSin;
          const prevDirBoost = boostOffset * Math.max(0, prevWaveFacing);
          const prevTotal = baseOffset + prevWobble + prevDirBoost;
          const prevPx = prev.x + prevNx * prevTotal;
          const prevPy = prev.y + prevNy * prevTotal;
          const mx = (prevPx + px) * 0.5, my = (prevPy + py) * 0.5;
          ctx.quadraticCurveTo(prevPx, prevPy, mx, my);
        }
      }
      ctx.closePath();
      // Outer rings fade out, wave boost adds intensity
      const ringAlpha = Math.max(0.02, (0.16 - ring * 0.022) + waveBoost * 0.06);
      ctx.strokeStyle = `rgba(180, 210, 225, ${ringAlpha})`;
      ctx.lineWidth = Math.max(0.3, 1.4 - ring * 0.15);
      ctx.stroke();
    }

    // Foam/froth patches that drift around the waterline
    const foamPoints = 12;
    for (let i = 0; i < foamPoints; i++) {
      const angle = (i / foamPoints) * Math.PI * 2;
      const cIdx = Math.floor((i / foamPoints) * nv);
      const cp = rf.crownShape[cIdx];
      const dist = Math.sqrt(cp.x * cp.x + cp.y * cp.y) || 1;
      const nx = cp.x / dist, ny = cp.y / dist;
      // Foam drifts in and out with the current
      const drift = Math.sin(t * 0.3 + i * 1.9) * 4 + Math.sin(t * 0.7 + i * 3.1) * 2;
      const fx = cp.x + nx * (drift + 3);
      const fy = cp.y + ny * (drift + 3);
      const foamSize = (0.8 + Math.sin(t * 0.5 + i * 2.7) * 0.5 + Math.sin(t * 1.3 + i * 4.1) * 0.3) * viewScale;
      const foamAlpha = 0.08 + Math.sin(t * 0.4 + i * 1.3) * 0.04;
      ctx.beginPath();
      ctx.arc(fx, fy, foamSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 225, 235, ${foamAlpha})`;
      ctx.fill();
    }

    // Subtle wet sheen - animated highlight that shifts with the light
    const sheenAngle = t * 0.15;
    const sheenX = Math.cos(sheenAngle) * rf.crownR * 0.3;
    const sheenY = Math.sin(sheenAngle) * rf.crownR * 0.3;
    const sheenGrad = ctx.createRadialGradient(sheenX, sheenY, 0, sheenX, sheenY, rf.crownR * 0.6);
    sheenGrad.addColorStop(0, 'rgba(180, 230, 240, 0.1)');
    sheenGrad.addColorStop(1, 'rgba(180, 230, 240, 0)');

    // Submerged edge rocks are baked into sand canvas

    // Crown shape - the dry rock poking out of the water
    ctx.beginPath();
    ctx.moveTo(rf.crownShape[0].x, rf.crownShape[0].y);
    for (let i = 0; i < nv; i++) {
      const next = rf.crownShape[(i + 1) % nv];
      const mx = (rf.crownShape[i].x + next.x) * 0.5;
      const my = (rf.crownShape[i].y + next.y) * 0.5;
      ctx.quadraticCurveTo(rf.crownShape[i].x, rf.crownShape[i].y, mx, my);
    }
    ctx.closePath();
    ctx.fillStyle = rf.crownColor;
    ctx.fill();
    // Wet sheen on rock surface
    ctx.fillStyle = sheenGrad;
    ctx.fill();
    // Rim highlight - wet edge where water meets rock
    ctx.strokeStyle = rf.rimColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Surface texture - a few speckles for barnacle/roughness feel
    for (let i = 0; i < nv; i++) {
      const p = rf.crownShape[i];
      const speckR = 1 + Math.sin(i * 7.3 + rf.x) * 0.8;
      if (speckR > 0.5) {
        ctx.beginPath();
        ctx.arc(p.x * 0.6, p.y * 0.6, speckR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fill();
      }
    }
    // Above-water edge rocks — fill only, no outline
    for (const er of rf.edgeRocks) {
      if (!er.aboveWater) continue;
      ctx.beginPath();
      for (let vi = 0; vi <= er.verts.length; vi++) {
        const v = er.verts[vi % er.verts.length];
        const px = er.ox + Math.cos(v.a) * v.r * er.r;
        const py = er.oy + Math.sin(v.a) * v.r * er.r;
        if (vi === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = er.color;
      ctx.fill();
      // Waterline ripples around edge rocks that straddle the water
      const erDist = Math.sqrt(er.ox * er.ox + er.oy * er.oy);
      const crAngle = Math.atan2(er.oy - rf.crownOffY, er.ox - rf.crownOffX);
      const crEdge = rf.radiusAt(crAngle, rf.crownRadii);
      // Only ripple rocks near the crown edge (within 1.5x their radius of the waterline)
      if (Math.abs(erDist - crEdge) < er.r * 1.5) {
        for (let ring = 0; ring < 2; ring++) {
          const rPhase = t * (0.6 + ring * 0.2) + er.ox * 0.1 + er.oy * 0.1;
          const baseR = er.r * (1.2 + ring * 0.8) + Math.sin(rPhase) * 1.5;
          // Wave distortion, skip points inside the reef crown
          const ringSteps = 24;
          ctx.beginPath();
          let drawing = false;
          for (let si = 0; si <= ringSteps; si++) {
            const a = (si / ringSteps) * Math.PI * 2;
            const dirX = Math.cos(a), dirY = Math.sin(a);
            const facing = dirX * waveHitCos + dirY * waveHitSin;
            const distort = waveBoost * (ring + 1) * 2.5;
            const r = baseR - facing * distort;
            const px = er.ox + dirX * r;
            const py = er.oy + dirY * r;
            // Check if this point is inside the reef crown
            const toCrownDx = px - rf.crownOffX, toCrownDy = py - rf.crownOffY;
            const toCrownDist = Math.sqrt(toCrownDx * toCrownDx + toCrownDy * toCrownDy);
            const crownAngle = Math.atan2(toCrownDy, toCrownDx);
            const crownEdge = rf.radiusAt(crownAngle, rf.crownRadii);
            if (toCrownDist < crownEdge + 2) {
              drawing = false; // inside crown, break the path
              continue;
            }
            if (!drawing) { ctx.moveTo(px, py); drawing = true; }
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = `rgba(180, 210, 225, ${0.1 - ring * 0.035 + waveBoost * 0.04})`;
          ctx.lineWidth = 0.8 - ring * 0.2;
          ctx.stroke();
        }
      }
    }
    // Grass tufts — small blades swaying on the rock surface
    const sway = time * 0.001;
    for (const tuft of rf.grassTufts) {
      for (const bl of tuft.blades) {
        const wobble = Math.sin(sway * 0.6 + bl.phase) * 0.04 + Math.sin(sway * 1.1 + bl.phase * 1.6) * 0.02;
        const baseX = tuft.ox, baseY = tuft.oy;
        const tipX = baseX + Math.cos(bl.angle + wobble) * bl.length;
        const tipY = baseY + Math.sin(bl.angle + wobble) * bl.length;
        // Quadratic curve for a slight natural bow
        const midX = (baseX + tipX) * 0.5 + Math.sin(bl.angle + wobble + 0.5) * bl.length * 0.08;
        const midY = (baseY + tipY) * 0.5 + Math.cos(bl.angle + wobble + 0.5) * bl.length * 0.08;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(midX, midY, tipX, tipY);
        ctx.strokeStyle = tuft.color;
        ctx.lineWidth = bl.width;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // DOF haze — disabled for performance testing
  // const dpr = Math.min(2, window.devicePixelRatio || 1);
  // const dofScale = 0.25;
  // const dofW = Math.max(1, Math.floor(canvas.width * dofScale));
  // const dofH = Math.max(1, Math.floor(canvas.height * dofScale));
  // if (blurCanvas.width !== dofW || blurCanvas.height !== dofH) {
  //   blurCanvas.width = dofW;
  //   blurCanvas.height = dofH;
  // }
  // blurCtx.clearRect(0, 0, dofW, dofH);
  // blurCtx.filter = 'blur(4px)';
  // blurCtx.drawImage(canvas, 0, 0, dofW, dofH);
  // ctx.save();
  // ctx.globalAlpha = 0.35;
  // ctx.setTransform(1, 0, 0, 1, 0, 0);
  // ctx.imageSmoothingEnabled = true;
  // ctx.drawImage(blurCanvas, 0, 0, canvas.width, canvas.height);
  // ctx.restore();
  // ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
</script>
