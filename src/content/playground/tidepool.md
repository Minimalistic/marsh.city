---
title: Tidepool
description: Tiny fish schooling in a shallow tidepool. Watch the current shift.
---

A rocky tidepool. Tiny silver fish school together, responding to the shifting current and each other.

<div id="pool-container" style="position:relative;width:100%;aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;">
<canvas id="pool" style="width:100%;height:100%;display:block;background:#0f1f2a;"></canvas>
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
.pool-volume:hover,
.pool-volume:active { height: 60px; opacity: 1; }
.pool-fs-btn { position: absolute; bottom: 8px; right: 8px; z-index: 10; }
#toolbar.hidden, .pool-fs-btn.hidden { opacity: 0; pointer-events: none; }
#toolbar, .pool-fs-btn { transition: opacity 0.5s; }
#pool-container:fullscreen,
#pool-container:-webkit-full-screen { width: 100vw !important; height: 100vh !important; aspect-ratio: auto !important; border-radius: 0 !important; max-width: none !important; }
#pool-container:fullscreen canvas,
#pool-container:-webkit-full-screen canvas { width: 100% !important; height: 100% !important; }
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

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // White noise source
  const bufferSize = audioCtx.sampleRate * 4;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  // Bandpass filter - shapes white noise into ocean-like band
  oceanFilter = audioCtx.createBiquadFilter();
  oceanFilter.type = 'bandpass';
  oceanFilter.frequency.value = 400;
  oceanFilter.Q.value = 0.5;

  // Secondary low shelf for body
  const lowShelf = audioCtx.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = 200;
  lowShelf.gain.value = 6;

  // LFO modulates filter frequency - simulates wave rhythm
  oceanLfo = audioCtx.createOscillator();
  oceanLfo.type = 'sine';
  oceanLfo.frequency.value = 0.07; // very slow ~14s cycle
  oceanLfoGain = audioCtx.createGain();
  oceanLfoGain.gain.value = 250;
  oceanLfo.connect(oceanLfoGain);
  oceanLfoGain.connect(oceanFilter.frequency);
  oceanLfo.start();

  // Master volume
  oceanGain = audioCtx.createGain();
  oceanGain.gain.value = 0;

  // Connect main chain
  noise.connect(oceanFilter);
  oceanFilter.connect(lowShelf);
  lowShelf.connect(oceanGain);
  oceanGain.connect(audioCtx.destination);
  noise.start();

  // Distant crash layer - low frequency rumble that swells irregularly
  const crashBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const crashData = crashBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) crashData[i] = Math.random() * 2 - 1;
  const crashNoise = audioCtx.createBufferSource();
  crashNoise.buffer = crashBuffer;
  crashNoise.loop = true;

  // Very low bandpass - rumble only
  const crashFilter = audioCtx.createBiquadFilter();
  crashFilter.type = 'lowpass';
  crashFilter.frequency.value = 120;
  crashFilter.Q.value = 0.7;

  // Gain node we'll modulate for swells
  window._crashGain = audioCtx.createGain();
  window._crashGain.gain.value = 0;

  crashNoise.connect(crashFilter);
  crashFilter.connect(window._crashGain);
  window._crashGain.connect(audioCtx.destination);
  crashNoise.start();
}

function toggleSound() {
  if (!audioCtx) initAudio();
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('sound-toggle');
  btn.setAttribute('aria-pressed', soundEnabled);
  if (soundEnabled) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    oceanGain.gain.setTargetAtTime(masterVolume * 0.3, audioCtx.currentTime, 0.5);
    document.getElementById('sound-icon').innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>';
  } else {
    oceanGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
    document.getElementById('sound-icon').innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
  }
}

document.getElementById('sound-toggle').addEventListener('click', e => {
  e.stopPropagation();
  toggleSound();
});

let masterVolume = 0.5;
document.getElementById('volume-slider').addEventListener('input', e => {
  masterVolume = e.target.value / 100;
  if (soundEnabled && oceanGain) {
    oceanGain.gain.setTargetAtTime(masterVolume * 0.15, audioCtx.currentTime, 0.1);
  }
});

// Fullscreen + auto-hide UI
const poolContainer = document.getElementById('pool-container');
const toolbar = document.getElementById('toolbar');
const fsBtn = document.getElementById('fullscreen-btn');
let hideTimer = null;

fsBtn.addEventListener('click', e => {
  e.stopPropagation();
  if (!document.fullscreenElement) {
    poolContainer.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
});

function showUI() {
  toolbar.classList.remove('hidden');
  fsBtn.classList.remove('hidden');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toolbar.classList.add('hidden');
    fsBtn.classList.add('hidden');
  }, 3000);
}
poolContainer.addEventListener('mousemove', showUI);
poolContainer.addEventListener('touchstart', showUI);
// Start the auto-hide timer
hideTimer = setTimeout(() => { toolbar.classList.add('hidden'); fsBtn.classList.add('hidden'); }, 3000);
document.addEventListener('fullscreenchange', () => {
  // Multiple resize attempts to catch layout settling
  for (const delay of [50, 150, 300]) {
    setTimeout(() => {
      const oldW = w, oldH = h;
      ({ w, h } = resize());
      if (w !== oldW || h !== oldH) rescaleAll(oldW, oldH);
    }, delay);
  }
  showUI();
});

// Update ocean sound to match wave state
function updateOceanSound() {
  if (!soundEnabled || !audioCtx) return;
  const waveIntensity = Math.abs(tide.strength);

  // Calculate wash wave audio presence: ramps as it approaches, peaks on-screen, fades out
  let washPresence = 0;
  for (const ww of washWaves) {
    const progress = ww.traveled / ww.maxTravel; // 0 = just spawned, 1 = done
    // Bell curve peaking around 0.4-0.6 (on-screen), with lead-in ramp
    let presence;
    if (progress < 0.2) presence = progress / 0.2 * 0.5; // approaching - ramp up
    else if (progress < 0.7) presence = 0.5 + (1 - Math.abs(progress - 0.45) / 0.25) * 0.5; // on-screen peak
    else presence = Math.max(0, (1 - progress) / 0.3) * 0.4; // leaving - fade out
    washPresence = Math.max(washPresence, presence * ww.strength);
  }

  // Filter brightens with wave presence
  oceanFilter.frequency.setTargetAtTime(250 + waveIntensity * 200 + washPresence * 500, audioCtx.currentTime, 0.2);
  // Volume: quiet ambient base, swells with visible wave, scaled by master
  const baseVol = 0.06 + waveIntensity * 0.04;
  oceanGain.gain.setTargetAtTime((baseVol + washPresence * 0.12) * masterVolume * 2, audioCtx.currentTime, 0.15);
  // LFO faster during active waves
  oceanLfo.frequency.setTargetAtTime(0.04 + washPresence * 0.08, audioCtx.currentTime, 0.5);

  // Distant crash rumble - irregular low swells
  if (window._crashGain) {
    // Crashes correlate loosely with tide peaks + random timing
    const crashIntensity = Math.max(0, Math.pow(waveIntensity, 2) * 0.5 + washPresence * 0.4);
    // Add randomness so it doesn't perfectly track
    const randomSwell = Math.max(0, Math.sin(waveTime * 0.13) * Math.sin(waveTime * 0.07));
    window._crashGain.gain.setTargetAtTime(
      (crashIntensity * 0.06 + randomSwell * 0.03) * masterVolume * 2,
      audioCtx.currentTime, 0.8 // slow attack for distant feel
    );
  }
}

// Food particles that attract fish
const foodPellets = [];

// Floating foam bits - tiny particles shed by waves, drift with current
const foamBits = [];

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: rect.width, h: rect.height };
}

let { w, h } = resize();
const initialArea = w * h;
const initialW = w;
const initialFishCount = Math.max(50, Math.floor(initialArea / 4000));
const initialDebrisCount = 500;
// View scale: larger viewports get proportionally larger/faster fish
let viewScale = 1;

function rescaleAll(oldW, oldH) {
  const sx = w / oldW, sy = h / oldH;
  // Update view scale - sqrt of area ratio, capped
  viewScale = Math.min(2.5, Math.sqrt((w * h) / initialArea));
  for (const r of rocks) { r.x *= sx; r.y *= sy; }
  for (const rf of reefs) { rf.x *= sx; rf.y *= sy; }
  for (const p of plants) {
    p.x *= sx; p.y *= sy;
    for (const s of p.segs) { s.x *= sx; s.y *= sy; }
  }
  for (const d of debris) { d.x *= sx; d.y *= sy; }
  for (const f of fish) { f.x *= sx; f.y *= sy; }

  // Scale population to match new viewport area
  const areaRatio = (w * h) / initialArea;
  const targetFish = Math.min(160, Math.floor(initialFishCount * areaRatio * 0.975));
  const targetDebris = Math.min(1200, Math.floor(initialDebrisCount * areaRatio * 0.75));
  const targetPlants = Math.min(40, Math.floor(20 * Math.sqrt(areaRatio)));
  const targetRocks = Math.min(30, Math.floor(15 * Math.sqrt(areaRatio)));

  // Add fish if needed - new fish swim in from edges
  while (fish.length < targetFish) {
    const school = fish.length % schoolColors.length;
    const entry = schoolEntries[school];
    const f = new Fish(entry);
    f.school = school;
    f.color = schoolColors[school].color;
    f.bellyColor = schoolColors[school].belly;
    fish.push(f);
  }
  // Remove excess fish
  while (fish.length > targetFish && fish.length > initialFishCount) fish.pop();

  // Add debris if needed
  while (debris.length < targetDebris) {
    const bright = Math.random() < 0.25;
    debris.push({
      x: Math.random() * w, y: Math.random() * h,
      size: bright ? (0.8 + Math.random() * 1.2) : (0.2 + Math.random() * 0.7),
      vx: 0, vy: 0,
      opacity: bright ? (0.2 + Math.random() * 0.2) : (0.05 + Math.random() * 0.12),
    });
  }
  while (debris.length > targetDebris && debris.length > initialDebrisCount) debris.pop();

  // Add plants if needed
  while (plants.length < targetPlants) {
    const edge = Math.floor(Math.random() * 4);
    let px, py, growAngle;
    const inset = Math.random() * 5;
    if (edge === 0) { px = Math.random() * w; py = inset; growAngle = Math.PI / 2; }
    else if (edge === 1) { px = w - inset; py = Math.random() * h; growAngle = Math.PI; }
    else if (edge === 2) { px = Math.random() * w; py = h - inset; growAngle = -Math.PI / 2; }
    else { px = inset; py = Math.random() * h; growAngle = 0; }
    growAngle += (Math.random() - 0.5) * 0.5;
    plants.push(new Frond(px, py, growAngle));
  }
  while (plants.length > targetPlants && plants.length > 20) plants.pop();

  // Add rocks if needed
  while (rocks.length < targetRocks) {
    rocks.push({
      x: Math.random() * w, y: Math.random() * h,
      size: 8 + Math.random() * 18,
      color: `rgb(${40 + Math.floor(Math.random() * 20)}, ${45 + Math.floor(Math.random() * 15)}, ${50 + Math.floor(Math.random() * 15)})`,
      elongation: 0.5 + Math.random() * 0.5,
      angle: Math.random() * Math.PI,
    });
  }
  while (rocks.length > targetRocks && rocks.length > 15) rocks.pop();
}
window.addEventListener('resize', () => {
  const oldW = w, oldH = h;
  ({ w, h } = resize());
  rescaleAll(oldW, oldH);
});

const blurCanvas = document.createElement('canvas');
const blurCtx = blurCanvas.getContext('2d');

// Mouse
let mouse = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, active: false, speed: 0, down: false };
canvas.addEventListener('mouseenter', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.active = true;
  mouse.speed = 0;
});
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  if (!mouse.active) { mouse.prevX = mouse.x; mouse.prevY = mouse.y; }
  mouse.active = true;
  mouse.speed = Math.sqrt((mouse.x - mouse.prevX) ** 2 + (mouse.y - mouse.prevY) ** 2);
});
canvas.addEventListener('mouseleave', () => { mouse.active = false; mouse.down = false; mouse.x = -1000; mouse.y = -1000; mouse.speed = 0; });
canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  mouse.down = true;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  if (activeTool === 'food') {
    // Push food out of reefs so it's always reachable
    let fx = mx, fy = my;
    for (const rf of reefs) {
      const rdx = fx - rf.x, rdy = fy - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const angle = Math.atan2(rdy, rdx);
      const edgeR = rf.radiusAt(angle, rf.baseRadii) + 5;
      if (rDist < edgeR && rDist > 0.1) {
        fx = rf.x + (rdx / rDist) * edgeR;
        fy = rf.y + (rdy / rDist) * edgeR;
      }
    }
    const b = 25 + Math.floor(Math.random() * 6);
    foodPellets.push({ x: fx, y: fy, size: 3, bites: b, startBites: b, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 });
    ripples.push({ x: fx, y: fy, radius: 2, maxRadius: 20, opacity: 0.2 });
  } else {
    ripples.push({ x: mx, y: my, radius: 3, maxRadius: 120, opacity: 0.5 });
  }
});
canvas.addEventListener('mouseup', () => { mouse.down = false; });

// Touch
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  mouse.x = t.clientX - rect.left;
  mouse.y = t.clientY - rect.top;
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.active = true;
  mouse.down = true;
  mouse.speed = 0;
  if (activeTool === 'food') {
    let fx = mouse.x, fy = mouse.y;
    for (const rf of reefs) {
      const rdx = fx - rf.x, rdy = fy - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const angle = Math.atan2(rdy, rdx);
      const edgeR = rf.radiusAt(angle, rf.baseRadii) + 5;
      if (rDist < edgeR && rDist > 0.1) {
        fx = rf.x + (rdx / rDist) * edgeR;
        fy = rf.y + (rdy / rDist) * edgeR;
      }
    }
    const b2 = 25 + Math.floor(Math.random() * 6);
    foodPellets.push({ x: fx, y: fy, size: 3, bites: b2, startBites: b2, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 });
    ripples.push({ x: fx, y: fy, radius: 2, maxRadius: 20, opacity: 0.2 });
  } else {
    ripples.push({ x: mouse.x, y: mouse.y, radius: 3, maxRadius: 90, opacity: 0.4 });
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.x = t.clientX - rect.left;
  mouse.y = t.clientY - rect.top;
  mouse.speed = Math.sqrt((mouse.x - mouse.prevX) ** 2 + (mouse.y - mouse.prevY) ** 2);
}, { passive: false });
canvas.addEventListener('touchend', () => { mouse.active = false; mouse.down = false; mouse.x = -1000; mouse.y = -1000; mouse.speed = 0; });

const ripples = [];

// Wave current - oscillates back and forth like real tidepool wash
const tide = { angle: 0, strength: 0 };
const waveBaseAngle = Math.random() * Math.PI * 2; // primary wave direction

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
  const angle = waveBaseAngle + (Math.random() - 0.5) * 0.15;
  const startX = w / 2 - Math.cos(angle) * w * 0.7;
  const startY = h / 2 - Math.sin(angle) * h * 0.7;
  // Highly varied intensity - some are strong and fast, some barely there
  const intensity = Math.pow(Math.random(), 0.7); // skewed toward weaker
  washWaves.push({
    x: startX, y: startY,
    angle,
    speed: (0.8 + intensity * 2) * (w / initialW),
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
    size: bright ? (0.8 + Math.random() * 1.2) : (0.2 + Math.random() * 0.7),
    vx: 0, vy: 0,
    opacity: bright ? (0.2 + Math.random() * 0.2) : (0.05 + Math.random() * 0.12),
  });
}

// Small fish class - schooling behavior (boids)
class Fish {
  constructor(spawnInfo = null) {
    if (spawnInfo) {
      // Spawn as part of a school group at a specific edge point
      // spawnInfo: { x, y, angle } with slight scatter applied
      this.x = spawnInfo.x + (Math.random() - 0.5) * 25;
      this.y = spawnInfo.y + (Math.random() - 0.5) * 25;
      this.angle = spawnInfo.angle + (Math.random() - 0.5) * 0.3;
    } else {
      this.x = w * 0.2 + Math.random() * w * 0.6;
      this.y = h * 0.2 + Math.random() * h * 0.6;
      this.angle = Math.random() * Math.PI * 2;
    }
    this.speed = 0.6 + Math.random() * 0.4;
    this.baseSpeed = this.speed;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    // Idle behavior - fish sometimes just drift
    this.idleTimer = Math.random() * 5;
    this.idle = Math.random() < 0.3;

    // Depth
    const dr = Math.random();
    this.depth = dr < 0.4 ? 0 : dr < 0.7 ? 0.2 + Math.random() * 0.1 : 0.4 + Math.random() * 0.2;
    const mobileScale = w < 500 ? 0.75 : 1;
    const depthScale = this.depth > 0 ? (1 - this.depth * 0.3) : 1;
    this.scale = mobileScale * depthScale;

    // Size - large enough for visible articulation from top-down
    this.len = (14 + Math.random() * 8) * this.scale;
    this.bodyWidth = this.len * (0.05 + Math.random() * 0.015);

    // Color assigned per school (set after construction)
    this.school = 0;
    this.color = 'rgb(140, 150, 160)';
    this.bellyColor = 'rgb(170, 180, 190)';

    // Schooling parameters - scaled up for larger fish
    this.separationDist = 30 * this.scale;
    this.alignDist = 80 * this.scale;
    this.cohesionDist = 140 * this.scale;

    // Flee state
    this.fleeing = false;
    this.fleeTimer = 0;
    // Eating pause
    this.eating = false;
    this.eatTimer = 0;
    // Distraction - sometimes fish wander off from the school
    this.distracted = Math.random() < 0.15;
    this.distractTimer = this.distracted ? 3 + Math.random() * 8 : 5 + Math.random() * 10;
    // Fixed phase offset for undulation desync (not position-based)
    this._phaseOffset = Math.random() * Math.PI * 20;
    // Smoothed swim intensity for animation - avoids jerky transitions
    this._swimSmooth = 0.5;
    // Chain of world-space joint positions - body trails behind head
    const numJoints = 16;
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
    // Eating pause - fish stops to chew
    if (this.eating) {
      this.eatTimer -= dt;
      this.vx *= 0.7;
      this.vy *= 0.7;
      if (this.eatTimer <= 0) this.eating = false;
      // Still move position but very slowly
      this.x += this.vx;
      this.y += this.vy;
      this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      return;
    }

    // Boids forces
    let sepX = 0, sepY = 0, sepCount = 0;
    let alignX = 0, alignY = 0, alignCount = 0;
    let cohX = 0, cohY = 0, cohCount = 0;

    for (const other of fish) {
      if (other === this) continue;
      // School primarily with same color group and similar depth
      if (Math.abs(other.depth - this.depth) > 0.2) continue;
      const sameSchool = other.school === this.school;
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.separationDist * viewScale && dist > 0.1) {
        sepX -= dx / dist;
        sepY -= dy / dist;
        sepCount++;
      }
      if (dist < this.alignDist * viewScale && sameSchool) {
        alignX += other.vx;
        alignY += other.vy;
        alignCount++;
      }
      if (dist < this.cohesionDist * viewScale && sameSchool) {
        cohX += other.x;
        cohY += other.y;
        cohCount++;
      }
    }

    // Distraction toggle
    this.distractTimer -= dt;
    if (this.distractTimer <= 0) {
      this.distracted = !this.distracted;
      this.distractTimer = this.distracted ? 4 + Math.random() * 10 : 5 + Math.random() * 12;
    }

    // Apply boids - distracted fish mostly ignore schooling
    const schoolWeight = this.distracted ? 0.1 : 1;
    if (sepCount > 0) { this.vx += sepX * 0.12; this.vy += sepY * 0.12; }
    if (alignCount > 0) { this.vx += (alignX / alignCount - this.vx) * 0.04 * schoolWeight; this.vy += (alignY / alignCount - this.vy) * 0.04 * schoolWeight; }
    if (cohCount > 0) { const cx = cohX / cohCount; const cy = cohY / cohCount; this.vx += (cx - this.x) * 0.0006 * schoolWeight; this.vy += (cy - this.y) * 0.0006 * schoolWeight; }

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
    this.vx += Math.cos(tide.angle) * tide.strength * 0.006;
    this.vy += Math.sin(tide.angle) * tide.strength * 0.006;
    const flow = sampleFlow(this.x, this.y, time);
    this.vx += flow.fx * 0.005;
    this.vy += flow.fy * 0.005;

    // Food attraction - all distances measured from the mouth tip
    const mouthX = this.x + Math.cos(this.angle) * this.len * 0.5 * viewScale;
    const mouthY = this.y + Math.sin(this.angle) * this.len * 0.5 * viewScale;
    const foodRange = 400 * viewScale;
    let closestFood = null;
    let closestFoodDist = foodRange;
    for (const fp of foodPellets) {
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

      if (this.idle) { this.idle = false; this.idleTimer = 2; }
      if (this.distracted && closestFoodDist < foodRange * 0.5) {
        this.distracted = false; this.distractTimer = 3;
      }

      const eatDist = 6 * viewScale;
      const biteDist = 3 * viewScale;
      // Fish can only eat when mouth is directly at the food
      if (closestFoodDist < eatDist && angleMismatch < 0.5) {
        this.vx *= 0.85;
        this.vy *= 0.85;
        if (closestFoodDist < biteDist && angleMismatch < 0.3 && !this.eating) {
          closestFood.bites--;
          closestFood.size *= 0.97;
          closestFood.vx += Math.cos(this.angle) * 0.3;
          closestFood.vy += Math.sin(this.angle) * 0.3;
          this.eating = true;
          this.eatTimer = 0.3 + Math.random() * 0.2;
          const bitesTaken = (closestFood.startBites || closestFood.bites + 1) - closestFood.bites;
          if (bitesTaken > 5 && Math.random() < 0.25) {
            const fragAngle = Math.random() * Math.PI * 2;
            foodPellets.push({
              x: closestFood.x + Math.cos(fragAngle) * 4,
              y: closestFood.y + Math.sin(fragAngle) * 4,
              size: 0.6 + Math.random() * 0.4,
              bites: 1,
              vx: Math.cos(fragAngle) * (0.2 + Math.random() * 0.3),
              vy: Math.sin(fragAngle) * (0.2 + Math.random() * 0.3),
            });
          }
          if (closestFood.bites <= 0) closestFood.size = 0;
        }
      } else {
        // Always steer toward food by turning - never set velocity directly
        // Fish must swim a forward arc to reach food, like a real approach
        const turnStr = angleMismatch > 1.2 ? 0.04 : 0.06 + (1 - closestFoodDist / foodRange) * 0.08;
        const turnDir = headingDiff > 0 ? 1 : -1;
        // Apply as a gentle heading bias, not a velocity override
        this.vx += Math.cos(this.angle + turnDir * 0.3) * turnStr;
        this.vy += Math.sin(this.angle + turnDir * 0.3) * turnStr;
        // Speed up when mostly aligned
        if (angleMismatch < 1.0) {
          const boost = (1 - angleMismatch) * (1 - closestFoodDist / foodRange) * 0.05;
          this.vx += Math.cos(this.angle) * boost;
          this.vy += Math.sin(this.angle) * boost;
        }
      }
    }

    // Mouse avoidance - cursor still spooks fish even in food mode
    if (mouse.active) {
      const mdx = this.x - mouse.x;
      const mdy = this.y - mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      const fleeR = mouse.down ? 80 : 25 + mouse.speed * 4;
      if (mDist < fleeR && mDist > 0.1) {
        const force = 0.15 * (1 - mDist / fleeR);
        this.vx += (mdx / mDist) * force;
        this.vy += (mdy / mDist) * force;
        this.fleeing = true;
        this.fleeTimer = 0.4;
      }
    }

    // Ripple avoidance
    for (const r of ripples) {
      const rdx = this.x - r.x;
      const rdy = this.y - r.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      if (Math.abs(rDist - r.radius) < 20 && r.opacity > 0.1 && rDist > 0.1) {
        const force = 0.12 * r.opacity;
        this.vx += (rdx / rDist) * force;
        this.vy += (rdy / rDist) * force;
        this.fleeing = true;
        this.fleeTimer = 0.3;
      }
    }

    if (this.fleeTimer > 0) this.fleeTimer -= dt;
    else this.fleeing = false;

    // Idle state - sometimes fish just drift lazily
    this.idleTimer -= dt;
    if (this.idleTimer <= 0) {
      this.idle = !this.idle;
      this.idleTimer = this.idle ? 2 + Math.random() * 5 : 3 + Math.random() * 6;
    }

    // Speed management - idle fish slow way down, active fish are gentle
    let targetSpeed;
    const scaledSpeed = this.baseSpeed * viewScale * (1 + (viewScale - 1) * 0.5);
    if (this.fleeing) targetSpeed = scaledSpeed * 1.15;
    else if (this.idle) targetSpeed = scaledSpeed * 0.15;
    else targetSpeed = scaledSpeed;

    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > 0.01) {
      const desired = currentSpeed + (targetSpeed - currentSpeed) * 0.02;
      const ratio = desired / currentSpeed;
      this.vx *= ratio;
      this.vy *= ratio;
    }

    // Reef avoidance - steer around submerged obstacles (shape-aware)
    for (const rf of reefs) {
      const rdx = this.x - rf.x;
      const rdy = this.y - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const angle = Math.atan2(rdy, rdx);
      const shapeR = rf.radiusAt(angle, rf.baseRadii);
      const avoid = shapeR * 0.85 * viewScale + this.len * 0.5;
      if (rDist < avoid * 1.8 && rDist > 0.1) {
        // Outer zone: gentle steering tangent to the reef surface
        const penetration = 1 - rDist / (avoid * 1.8);
        // Push outward
        const pushStr = penetration * 0.12;
        this.vx += (rdx / rDist) * pushStr;
        this.vy += (rdy / rDist) * pushStr;
        // Also steer tangentially so fish flow around, not just bounce off
        // Cross product of (velocity, reef direction) picks the natural turn side
        const cross = this.vx * rdy - this.vy * rdx;
        const tangentSign = cross >= 0 ? 1 : -1;
        const tx = -rdy / rDist * tangentSign;
        const ty = rdx / rDist * tangentSign;
        this.vx += tx * penetration * 0.06;
        this.vy += ty * penetration * 0.06;
      }
    }

    // Fish can only swim forward - kill lateral drift and backward motion
    const headX = Math.cos(this.angle);
    const headY = Math.sin(this.angle);
    const fwdSpeed = this.vx * headX + this.vy * headY;
    const latSpeed = this.vx * (-headY) + this.vy * headX;
    // Heavily dampen sideways drift - fish aren't crabs
    this.vx -= (-headY) * latSpeed * 0.45;
    this.vy -= headX * latSpeed * 0.45;
    // Prevent backward movement entirely - clamp forward component
    if (fwdSpeed < 0) {
      this.vx -= headX * fwdSpeed * 0.6;
      this.vy -= headY * fwdSpeed * 0.6;
    }

    // Drag - smooths out micro-jitter
    this.vx *= 0.985;
    this.vy *= 0.985;

    // Soft return from offscreen - fish can swim 30% beyond viewport
    const overflow = 0.3;
    const minX = -w * overflow, maxX = w * (1 + overflow);
    const minY = -h * overflow, maxY = h * (1 + overflow);
    // Gentle pull when offscreen, normalized so it's consistent at any viewport size
    if (this.x < 0) this.vx += (Math.abs(this.x) / w) * 0.3;
    if (this.x > w) this.vx -= ((this.x - w) / w) * 0.3;
    if (this.y < 0) this.vy += (Math.abs(this.y) / h) * 0.3;
    if (this.y > h) this.vy -= ((this.y - h) / h) * 0.3;
    // Wake from idle if way offscreen
    if (this.idle && (this.x < -w * 0.15 || this.x > w * 1.15 || this.y < -h * 0.15 || this.y > h * 1.15)) {
      this.idle = false;
      this.idleTimer = 3 + Math.random() * 4;
    }

    // Move - allowed 30% beyond viewport
    this.x += this.vx;
    this.y += this.vy;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
    // Hard reef collision - push fish out if they ended up inside (shape-aware)
    for (const rf of reefs) {
      const rdx = this.x - rf.x;
      const rdy = this.y - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const angle = Math.atan2(rdy, rdx);
      const solidR = rf.radiusAt(angle, rf.baseRadii) * 0.7 * viewScale;
      if (rDist < solidR && rDist > 0.1) {
        this.x = rf.x + (rdx / rDist) * solidR;
        this.y = rf.y + (rdy / rDist) * solidR;
        // Deflect velocity tangentially
        const dot = (this.vx * rdx + this.vy * rdy) / (rDist * rDist);
        if (dot < 0) { // only if moving inward
          this.vx -= rdx / rDist * dot * rDist * 1.5;
          this.vy -= rdy / rDist * dot * rDist * 1.5;
        }
      }
    }

    // Angle tracks velocity direction but with turn rate limit
    // Fish must move forward to turn - can't pivot in place
    const targetAngle = Math.atan2(this.vy, this.vx);
    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const maxTurn = 0.15 + currentSpeed * 0.15; // responsive head tracking
    this.angle += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

    // Update chain: head leads, each joint trails behind the one ahead
    // Like pulling a chain through water - body follows the head's path
    this._joints[0].x = this.x;
    this._joints[0].y = this.y;
    for (let j = 1; j <= this._jointCount; j++) {
      const prev = this._joints[j - 1];
      const curr = this._joints[j];
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      // Constrain to segment length - joint snaps to trail behind previous
      curr.x = prev.x + (dx / dist) * this._segLen;
      curr.y = prev.y + (dy / dist) * this._segLen;
    }
    this.speed = currentSpeed;
  }

  draw(ctx) {
    const vs = viewScale;
    const segs = this._jointCount;
    const totalLen = this.len;

    // Smoothed swim intensity
    const rawIntensity = Math.min(1, this.speed * 0.8);
    this._swimSmooth += (rawIntensity - this._swimSmooth) * 0.015;
    const si = this._swimSmooth;

    // Undulation phase for swimming wave - slow and graceful
    const phase = Date.now() * 0.0003 * (0.5 + si * 0.5) + this._phaseOffset;

    // Build spine directly from world-space joint positions
    // Transform joints into local space (relative to head position and heading)
    const cosH = Math.cos(-this.angle), sinH = Math.sin(-this.angle);
    const spineX = new Array(segs + 1);
    const spineY = new Array(segs + 1);
    const widths = new Array(segs + 1);

    for (let i = 0; i <= segs; i++) {
      const jx = this._joints[i].x - this.x;
      const jy = this._joints[i].y - this.y;
      // Rotate into local space (head-forward = +X)
      let lx = jx * cosH - jy * sinH;
      let ly = jx * sinH + jy * cosH;

      // Add swim undulation as lateral offset
      // Peaks in the mid-body, tapers off at tail (chain already whips the tail)
      if (i > 0) {
        const t = i / segs;
        // Bell curve: low at head, peaks ~60% along body, fades at tail tip
        const flex = Math.sin(t * Math.PI * 0.85) * (t < 0.12 ? t / 0.12 : 1);
        const undulAmp = flex * this.len * 0.05 * (0.2 + si * 0.8);
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
    ctx.rotate(this.angle);
    ctx.scale(vs, vs);

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

    ctx.restore();
  }
}

// Create fish in schools with distinct colors
const schoolColors = [
  { color: 'rgb(130, 155, 170)', belly: 'rgb(160, 185, 200)' },   // blue-silver
  { color: 'rgb(160, 140, 100)', belly: 'rgb(190, 175, 140)' },   // golden
  { color: 'rgb(100, 150, 130)', belly: 'rgb(140, 185, 165)' },   // teal
  { color: 'rgb(150, 130, 150)', belly: 'rgb(180, 165, 180)' },   // lavender-silver
];
const fishCount = Math.max(50, Math.floor((w * h) / 4000));
const fish = [];
// Fish swim in as school groups from edges
let fishToSpawn = fishCount;
let fishSpawned = 0;
let spawnTimer = 0;
// Pre-plan school entry points: each school enters from a different edge
const schoolEntries = schoolColors.map((_, si) => {
  const edge = si % 4;
  const margin = 40;
  let x, y, angle;
  if (edge === 0) { x = -margin; y = h * 0.2 + Math.random() * h * 0.6; angle = (Math.random() - 0.5) * 0.5; }
  else if (edge === 1) { x = w + margin; y = h * 0.2 + Math.random() * h * 0.6; angle = Math.PI + (Math.random() - 0.5) * 0.5; }
  else if (edge === 2) { x = w * 0.2 + Math.random() * w * 0.6; y = -margin; angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; }
  else { x = w * 0.2 + Math.random() * w * 0.6; y = h + margin; angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; }
  return { x, y, angle };
});

// Rocks - scattered across the tidepool floor
const rocks = [];
for (let i = 0; i < 15; i++) {
  rocks.push({
    x: Math.random() * w, y: Math.random() * h,
    size: 8 + Math.random() * 18,
    color: `rgb(${40 + Math.floor(Math.random() * 20)}, ${45 + Math.floor(Math.random() * 15)}, ${50 + Math.floor(Math.random() * 15)})`,
    elongation: 0.5 + Math.random() * 0.5,
    angle: Math.random() * Math.PI,
  });
}

// Reef structures - partially submerged obstacles
// Each reef has an irregular outline generated from noisy radius samples
function makeReef(x, y, sizeMultiplier = 1) {
  const baseR = (60 + Math.random() * 90) * sizeMultiplier * viewScale;
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

  // Color palette - dark wet rock tones
  const g = 30 + Math.floor(Math.random() * 25);
  const baseColor = `rgb(${g - 5}, ${g}, ${g + 8})`;
  const crownColor = `rgb(${g + 25}, ${g + 22}, ${g + 15})`;
  const rimColor = `rgba(${g + 50}, ${g + 45}, ${g + 35}, 0.6)`;

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

  return {
    x, y, baseR, crownR, crownOffX, crownOffY,
    baseShape, crownShape, baseColor, crownColor, rimColor,
    baseRadii, crownRadii, radiusAt,
    // Avoidance uses shape-aware radius
    avoidR: baseR * 0.85,
  };
}

const reefs = [];
const reefCount = Math.max(2, Math.floor(Math.sqrt(w * h) / 200));
for (let i = 0; i < reefCount; i++) {
  // First reef is the dominant one - much larger than the rest
  const sizeMult = i === 0 ? 1.8 + Math.random() * 0.5 : 1;
  // Place reefs away from edges and away from each other
  // Estimate radius for spacing check before creating
  const estR = (60 + 45) * sizeMult * viewScale;
  let rx, ry, tries = 0;
  do {
    rx = w * 0.12 + Math.random() * w * 0.76;
    ry = h * 0.12 + Math.random() * h * 0.76;
    tries++;
  } while (tries < 40 && reefs.some(r => {
    const dx = r.x - rx, dy = r.y - ry;
    // Both radii matter - no overlapping
    return Math.sqrt(dx * dx + dy * dy) < r.baseR + estR + 40;
  }));
  reefs.push(makeReef(rx, ry, sizeMult));
}

// Seaweed fronds around perimeter
class Frond {
  constructor(x, y, growAngle) {
    this.x = x;
    this.y = y;
    this.growAngle = growAngle;
    this.len = (40 + Math.random() * 55) * viewScale;
    this.branches = 2 + Math.floor(Math.random() * 3);
    this.phase = Math.random() * Math.PI * 2;
    this.branchSide = Math.random() < 0.5 ? 1 : -1;
    this.branchData = [];
    for (let b = 0; b < this.branches; b++) {
      const t = 0.15 + (b / (this.branches - 1)) * 0.8;
      const taper = Math.pow(1 - t, 0.6);
      this.branchData.push({ t, lenScale: (0.7 + Math.random() * 0.3) * taper, leaflets: Math.max(1, Math.floor((1 + Math.random() * 2) * taper)) });
    }
    this.segCount = 6;
    this.segs = [];
    for (let i = 0; i <= this.segCount; i++) {
      const t = i / this.segCount;
      this.segs.push({ x: x + Math.cos(growAngle) * t * this.len, y: y + Math.sin(growAngle) * t * this.len, vx: 0, vy: 0 });
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

  draw(ctx, time) {
    const segs = this.segs;
    ctx.lineCap = 'round';
    for (let i = 0; i < segs.length - 1; i++) {
      const t = i / (segs.length - 1);
      ctx.beginPath();
      ctx.moveTo(segs[i].x, segs[i].y);
      ctx.lineTo(segs[i + 1].x, segs[i + 1].y);
      ctx.strokeStyle = 'rgb(20, 70, 50)';
      ctx.lineWidth = 1.6 * viewScale * (1 - t * 0.7);
      ctx.stroke();
    }
    for (let b = 0; b < this.branches; b++) {
      const bd = this.branchData[b];
      const segIdx = Math.min(Math.floor(bd.t * this.segCount), this.segCount - 1);
      const base = segs[segIdx];
      const next = segs[Math.min(segIdx + 1, this.segCount)];
      const stemAngle = Math.atan2(next.y - base.y, next.x - base.x);
      const side = (b % 2 === 0 ? 1 : -1) * this.branchSide;
      const branchAngle = stemAngle + side * (0.4 + Math.sin(time * 0.001 + b + this.phase) * 0.1);
      const branchLen = this.len * (0.35 - bd.t * 0.2) * bd.lenScale;
      const tipX = base.x + Math.cos(branchAngle) * branchLen;
      const tipY = base.y + Math.sin(branchAngle) * branchLen;
      const taper = Math.pow(1 - bd.t, 0.6);
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(tipX, tipY);
      ctx.strokeStyle = 'rgb(30, 85, 55)';
      ctx.lineWidth = 0.3 + taper * 0.8;
      ctx.stroke();
      for (let l = 0; l < bd.leaflets; l++) {
        const lt = 0.3 + (l / bd.leaflets) * 0.6;
        const lx = base.x + (tipX - base.x) * lt;
        const ly = base.y + (tipY - base.y) * lt;
        const leafAngle = branchAngle + ((l % 2 === 0 ? 1 : -1)) * (0.5 + l * 0.07);
        const leafLen = branchLen * (0.2 + taper * 0.15);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + Math.cos(leafAngle) * leafLen, ly + Math.sin(leafAngle) * leafLen);
        ctx.strokeStyle = 'rgb(35, 95, 60)';
        ctx.lineWidth = 0.3 + taper * 0.4;
        ctx.stroke();
      }
    }
  }
}

const plants = [];
for (let i = 0; i < 20; i++) {
  const edge = Math.floor(Math.random() * 4);
  let px, py, growAngle;
  const inset = Math.random() * 5;
  if (edge === 0) { px = Math.random() * w; py = inset; growAngle = Math.PI / 2; }
  else if (edge === 1) { px = w - inset; py = Math.random() * h; growAngle = Math.PI; }
  else if (edge === 2) { px = Math.random() * w; py = h - inset; growAngle = -Math.PI / 2; }
  else { px = inset; py = Math.random() * h; growAngle = 0; }
  growAngle += (Math.random() - 0.5) * 0.5;
  plants.push(new Frond(px, py, growAngle));
}
for (let i = 0; i < 60; i++) {
  for (const p of plants) p.update(0.016, i * 16);
}

let lastTime = 0;
let waveTime = 0;
let settleTime = 0; // no centering needed - fish swim in from edges

function draw(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (settleTime > 0) settleTime -= dt;

  // Spawn fish as school groups swimming in from edges
  if (fishSpawned < fishToSpawn) {
    spawnTimer += dt;
    // Small batches every ~0.15s so schools arrive as clusters
    while (spawnTimer >= 0.15 && fishSpawned < fishToSpawn) {
      spawnTimer -= 0.15;
      // Spawn 2-4 fish from the same school entry point
      const batchSize = Math.min(2 + Math.floor(Math.random() * 3), fishToSpawn - fishSpawned);
      const school = fishSpawned % schoolColors.length;
      const entry = schoolEntries[school];
      for (let b = 0; b < batchSize; b++) {
        const f = new Fish(entry);
        f.school = school;
        f.color = schoolColors[school].color;
        f.bellyColor = schoolColors[school].belly;
        fish.push(f);
        fishSpawned++;
      }
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
    v.x += Math.cos(v.driftAngle) * v.driftSpeed;
    v.y += Math.sin(v.driftAngle) * v.driftSpeed;
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
    if (ww.life <= 0) { washWaves.splice(i, 1); continue; }
    // Push things in the wave's path
    const pushForce = ww.strength * ww.life;
    const cosA = Math.cos(ww.angle);
    const sinA = Math.sin(ww.angle);
    for (const f of fish) {
      // Distance from wave front line (perpendicular)
      const rel = (f.x - ww.x) * cosA + (f.y - ww.y) * sinA;
      if (rel > -5 && rel < ww.width) {
        // Noticeable push as wave passes directly over
        f.vx += cosA * pushForce * 0.025;
        f.vy += sinA * pushForce * 0.025;
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
    // Waves hitting reefs: spawn foam along the actual rock shape
    for (const rf of reefs) {
      const rel = (rf.x - ww.x) * cosA + (rf.y - ww.y) * sinA;
      if (rel > -rf.baseR && rel < rf.baseR + ww.width) {
        const splashCount = Math.ceil(3 * viewScale);
        if (foamBits.length < 200) {
          for (let si = 0; si < splashCount; si++) {
            const edgeAngle = Math.atan2(-sinA, -cosA) + (Math.random() - 0.5) * Math.PI * 0.8;
            const shapeR = rf.radiusAt(edgeAngle, rf.baseRadii);
            const spawnR = shapeR * (0.85 + Math.random() * 0.3);
            foamBits.push({
              x: rf.x + Math.cos(edgeAngle) * spawnR,
              y: rf.y + Math.sin(edgeAngle) * spawnR,
              size: (0.5 + Math.random() * 1.5) * viewScale,
              vx: Math.cos(edgeAngle) * (0.5 + Math.random()) * pushForce * 0.3,
              vy: Math.sin(edgeAngle) * (0.5 + Math.random()) * pushForce * 0.3,
              life: 1,
              maxLife: 3 + Math.random() * 5,
            });
          }
        }
      }
    }
  }

  // Clear - dark tidepool water
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  gradient.addColorStop(0, '#142833');
  gradient.addColorStop(0.6, '#0f1f2a');
  gradient.addColorStop(1, '#0a1520');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Rocks
  for (const r of rocks) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, r.size, r.size * r.elongation, 0, 0, Math.PI * 2);
    ctx.fillStyle = r.color;
    ctx.fill();
    ctx.restore();
  }

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
    // Submerged rock base - irregular outline
    ctx.beginPath();
    ctx.moveTo(rf.baseShape[0].x, rf.baseShape[0].y);
    for (let i = 0; i < rf.baseShape.length; i++) {
      const next = rf.baseShape[(i + 1) % rf.baseShape.length];
      const mx = (rf.baseShape[i].x + next.x) * 0.5;
      const my = (rf.baseShape[i].y + next.y) * 0.5;
      ctx.quadraticCurveTo(rf.baseShape[i].x, rf.baseShape[i].y, mx, my);
    }
    ctx.closePath();
    ctx.fillStyle = rf.baseColor;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Plants
  for (const p of plants) {
    p.update(dt, time);
    p.draw(ctx, time);
  }

  // Displace plants from fish
  for (const f of fish) {
    if (f.speed < 0.5) continue;
    for (const p of plants) {
      p.displace(f.x, f.y, 20 * f.scale, f.speed * 0.1);
    }
  }

  // Debris - affected by tide
  for (const d of debris) {
    d.vx += Math.cos(tide.angle) * tide.strength * 0.008;
    d.vy += Math.sin(tide.angle) * tide.strength * 0.008;
    const dFlow = sampleFlow(d.x, d.y, time);
    d.vx += dFlow.fx * 0.015;
    d.vy += dFlow.fy * 0.015;
    d.vx *= 0.97;
    d.vy *= 0.97;
    d.x += d.vx;
    d.y += d.vy;
    // Deflect debris around reefs - follows organic shape
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
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 120, 130, ${d.opacity})`;
    ctx.fill();
  }

  // Update and draw floating foam bits
  for (let i = foamBits.length - 1; i >= 0; i--) {
    const fb = foamBits[i];
    fb.life -= dt / fb.maxLife;
    if (fb.life <= 0) { foamBits.splice(i, 1); continue; }
    const flow = sampleFlow(fb.x, fb.y, time);
    fb.vx += Math.cos(tide.angle) * tide.strength * 0.012 + flow.fx * 0.02;
    fb.vy += Math.sin(tide.angle) * tide.strength * 0.012 + flow.fy * 0.02;
    fb.vx *= 0.96;
    fb.vy *= 0.96;
    fb.x += fb.vx;
    fb.y += fb.vy;
    // Foam deflects around reefs - follows organic shape
    for (const rf of reefs) {
      const rdx = fb.x - rf.x, rdy = fb.y - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const angle = Math.atan2(rdy, rdx);
      const edgeR = rf.radiusAt(angle, rf.baseRadii) * 0.9;
      if (rDist < edgeR && rDist > 0.1) {
        fb.x = rf.x + (rdx / rDist) * edgeR;
        fb.y = rf.y + (rdy / rDist) * edgeR;
        // Tangential slide along the edge
        const spd = Math.sqrt(fb.vx * fb.vx + fb.vy * fb.vy);
        const cross = fb.vx * rdy - fb.vy * rdx;
        const sign = cross >= 0 ? 1 : -1;
        fb.vx = (-rdy / rDist) * sign * spd * 0.6;
        fb.vy = (rdx / rDist) * sign * spd * 0.6;
      }
    }
    if (fb.x < -20 || fb.x > w + 20 || fb.y < -20 || fb.y > h + 20) { foamBits.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(fb.x, fb.y, fb.size * fb.life, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 225, 235, ${fb.life * 0.25})`;
    ctx.fill();
  }

  // Update and draw food pellets
  for (let i = foodPellets.length - 1; i >= 0; i--) {
    const fp = foodPellets[i];
    fp.vx *= 0.98;
    fp.vy *= 0.98;
    fp.vx += Math.cos(tide.angle) * tide.strength * 0.003;
    fp.vy += Math.sin(tide.angle) * tide.strength * 0.003;
    fp.x += fp.vx;
    fp.y += fp.vy;
    // Keep food outside reefs so fish can always reach it
    for (const rf of reefs) {
      const rdx = fp.x - rf.x, rdy = fp.y - rf.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      const angle = Math.atan2(rdy, rdx);
      const edgeR = rf.radiusAt(angle, rf.baseRadii) + 3;
      if (rDist < edgeR && rDist > 0.1) {
        fp.x = rf.x + (rdx / rDist) * edgeR;
        fp.y = rf.y + (rdy / rDist) * edgeR;
        // Slide along the edge
        const dot = (fp.vx * rdx + fp.vy * rdy) / (rDist * rDist);
        if (dot < 0) { fp.vx -= rdx / rDist * dot * rDist; fp.vy -= rdy / rDist * dot * rDist; }
      }
    }
    if (fp.bites <= 0 || fp.size < 0.3) { foodPellets.splice(i, 1); continue; }
    ctx.beginPath();
    ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 130, 60, ${Math.min(0.8, 0.3 + fp.size * 0.2)})`;
    ctx.fill();
  }

  // Draw wash wave fronts - foam shed behind the wave, not in front
  for (const ww of washWaves) {
    if (ww.life <= 0) continue;
    if (!ww.blobs) ww.blobs = [];
    // Continuously spawn foam at the wave front - scales with viewport
    const cosA = Math.cos(ww.angle);
    const sinA = Math.sin(ww.angle);
    const span = Math.max(w, h) * 1.2;
    const foamCount = Math.ceil(4 * viewScale);
    if (ww.life > 0.1) {
      for (let i = 0; i < foamCount; i++) {
        const lateral = (Math.random() - 0.5) * span;
        const behind = Math.random() * 5 * viewScale;
        ww.blobs.push({
          x: ww.x - cosA * behind + (-sinA) * lateral,
          y: ww.y - sinA * behind + cosA * lateral,
          size: (0.4 + Math.pow(Math.random(), 2) * 3.5) * viewScale,
          elongX: 0.7 + Math.random() * 1.3,
          elongY: 0.5 + Math.random() * 0.7,
          rot: Math.random() * Math.PI,
          age: 0,
          maxAge: 2 + Math.random() * 3,
        });
      }
    }
    // Shed tiny foam bits into the water (cap at 150)
    if (ww.life > 0.1 && foamBits.length < 150) {
      for (let i = 0; i < 2; i++) {
        const lateral = (Math.random() - 0.5) * span;
        foamBits.push({
          x: ww.x - cosA * Math.random() * 10 + (-sinA) * lateral,
          y: ww.y - sinA * Math.random() * 10 + cosA * lateral,
          size: (0.3 + Math.random() * 0.8) * viewScale,
          vx: 0, vy: 0,
          life: 1,
          maxLife: 6 + Math.random() * 10,
        });
      }
    }

    // Draw wave front - 4 continuous turbulent lines at different offsets
    const perpX = -sinA;
    const perpY = cosA;
    if (!ww.seed) ww.seed = Math.random() * 100;
    const t = ww.traveled * 0.02;
    const lines = [
      { behind: 0, thick: 1.8 * viewScale, alpha: 0.35, freq: 1.0 },
      { behind: 4 * viewScale, thick: 1.2 * viewScale, alpha: 0.2, freq: 1.3 },
      { behind: 9 * viewScale, thick: 0.8 * viewScale, alpha: 0.12, freq: 0.8 },
      { behind: 15 * viewScale, thick: 0.5 * viewScale, alpha: 0.07, freq: 1.6 },
    ];
    for (const ln of lines) {
      ctx.beginPath();
      const step = 3;
      let first = true;
      for (let pos = -span; pos <= span; pos += step) {
        const f = ln.freq;
        const vs = viewScale;
        const offset = (Math.sin(pos * 0.015 * f + t * 0.6 + ww.seed) * 10
                     + Math.sin(pos * 0.04 * f + t * 1.1 + ww.seed * 2.3) * 5
                     + Math.sin(pos * 0.11 * f + t * 2.3 + ww.seed * 4.7) * 2.5
                     + Math.sin(pos * 0.23 * f + t * 3.1 + ww.seed * 7) * 1) * vs;
        const px = ww.x + perpX * pos + cosA * (offset - ln.behind);
        const py = ww.y + perpY * pos + sinA * (offset - ln.behind);
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
      const shrink = 0.3 + life * 0.7;
      ctx.save();
      ctx.globalAlpha = life * 0.22;
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
    r.radius += dt * 70;
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

  // Cursor glow
  if (mouse.active && !mouse.down) {
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180, 210, 220, 0.06)';
    ctx.fill();
  }

  // Update and draw fish
  for (const f of fish) f.update(dt, fish, time);

  // Draw by depth
  const deepFish = fish.filter(f => f.depth > 0).sort((a, b) => b.depth - a.depth);
  for (const f of deepFish) {
    ctx.save();
    ctx.filter = 'blur(' + (f.depth * 3) + 'px)';
    f.draw(ctx);
    ctx.restore();
  }
  for (const f of fish) {
    if (f.depth === 0) f.draw(ctx);
  }

  // Caustics - light refracting through water surface
  for (let i = 0; i < 5; i++) {
    const cx = w * 0.3 + Math.sin(time * 0.00012 + i * 1.3) * w * 0.35;
    const cy = h * 0.3 + Math.cos(time * 0.00016 + i * 1.9) * h * 0.35;
    const cr = 40 + Math.sin(time * 0.0003 + i) * 20;
    const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    cg.addColorStop(0, 'rgba(100, 160, 180, 0.03)');
    cg.addColorStop(1, 'rgba(100, 160, 180, 0)');
    ctx.fillStyle = cg;
    ctx.fillRect(cx - cr, cy - cr, cr * 2, cr * 2);
  }


  // Reef structures - waterline effects then above-water crown
  for (const rf of reefs) {
    ctx.save();
    ctx.translate(rf.x, rf.y);
    const nv = rf.crownShape.length;
    const t = time * 0.001; // seconds

    // Waterline ripples - animated rings that lap around the crown edge
    // Multiple offset rings at slightly different radii create a lapping effect
    for (let ring = 0; ring < 3; ring++) {
      const ringPhase = t * (0.4 + ring * 0.15) + ring * 2.1;
      const ringOffset = Math.sin(ringPhase) * 2 + ring * 1.5;
      ctx.beginPath();
      for (let i = 0; i <= nv; i++) {
        const idx = i % nv;
        const cp = rf.crownShape[idx];
        // Each point oscillates outward independently for organic lapping
        const pointPhase = ringPhase + idx * 0.7;
        const wobble = Math.sin(pointPhase) * 2.5 + Math.sin(pointPhase * 2.3 + 1.7) * 1.2;
        const dist = Math.sqrt(cp.x * cp.x + cp.y * cp.y) || 1;
        const nx = cp.x / dist, ny = cp.y / dist;
        const px = cp.x + nx * (ringOffset + wobble);
        const py = cp.y + ny * (ringOffset + wobble);
        if (i === 0) ctx.moveTo(px, py);
        else {
          const prev = rf.crownShape[(i - 1) % nv];
          const prevDist = Math.sqrt(prev.x * prev.x + prev.y * prev.y) || 1;
          const prevPhase = ringPhase + ((i - 1) % nv) * 0.7;
          const prevWobble = Math.sin(prevPhase) * 2.5 + Math.sin(prevPhase * 2.3 + 1.7) * 1.2;
          const prevPx = prev.x + (prev.x / prevDist) * (ringOffset + prevWobble);
          const prevPy = prev.y + (prev.y / prevDist) * (ringOffset + prevWobble);
          const mx = (prevPx + px) * 0.5, my = (prevPy + py) * 0.5;
          ctx.quadraticCurveTo(prevPx, prevPy, mx, my);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(180, 210, 225, ${0.15 - ring * 0.04})`;
      ctx.lineWidth = 1.2 - ring * 0.3;
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
      const foamSize = (1.5 + Math.sin(t * 0.5 + i * 2.7) * 0.8) * viewScale;
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
    sheenGrad.addColorStop(0, 'rgba(160, 200, 220, 0.08)');
    sheenGrad.addColorStop(1, 'rgba(160, 200, 220, 0)');

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
    ctx.restore();
  }

  // DOF haze
  blurCanvas.width = canvas.width;
  blurCanvas.height = canvas.height;
  blurCtx.filter = 'blur(5px)';
  blurCtx.drawImage(canvas, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(blurCanvas, 0, 0);
  ctx.restore();
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Vignette
  const vigGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.65);
  vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vigGrad.addColorStop(1, 'rgba(5, 10, 15, 0.5)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, w, h);

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
</script>
