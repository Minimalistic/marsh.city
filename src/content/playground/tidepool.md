---
title: Tidepool
description: Tiny fish schooling in a shallow tidepool. Watch the current shift.
---

A rocky tidepool. Tiny silver fish school together, responding to the shifting current and each other.

<div style="position:relative;width:100%;aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;">
<canvas id="pool" style="width:100%;height:100%;cursor:none;display:block;background:#0f1f2a;"></canvas>
<div id="toolbar" style="position:absolute;top:8px;right:8px;display:flex;flex-direction:column;gap:6px;z-index:10;">
  <button data-tool="observe" class="pool-tool active" title="Observe">👁</button>
  <button data-tool="food" class="pool-tool" title="Drop food">🪱</button>
  <button data-tool="rock" class="pool-tool" title="Drop rock">🪨</button>
  <div class="pool-sound-wrap">
    <button id="sound-toggle" class="pool-tool" title="Toggle ocean sound">🔇</button>
    <input id="volume-slider" type="range" min="0" max="100" value="50" class="pool-volume" title="Volume">
  </div>
</div>
</div>
<style>
.pool-tool {
  width: 32px; height: 32px; border-radius: 6px; border: 1px solid rgba(150,180,200,0.3);
  background: rgba(10,20,30,0.7); backdrop-filter: blur(4px); cursor: pointer;
  font-size: 14px; display: flex; align-items: center; justify-content: center;
  transition: border-color 0.2s, background 0.2s;
}
.pool-tool:hover { border-color: rgba(150,200,220,0.6); }
.pool-tool.active { border-color: rgba(150,200,220,0.8); background: rgba(30,60,80,0.8); }
.pool-sound-wrap { display: flex; align-items: center; gap: 4px; }
.pool-volume {
  width: 0; opacity: 0; transition: width 0.2s, opacity 0.2s;
  height: 4px; accent-color: rgba(150,200,220,0.8); cursor: pointer;
}
.pool-sound-wrap:hover .pool-volume { width: 60px; opacity: 1; }
</style>

<script type="module">
const canvas = document.getElementById('pool');
const ctx = canvas.getContext('2d');

// Tool selection
let activeTool = 'observe';
document.querySelectorAll('.pool-tool[data-tool]').forEach(btn => {
  btn.addEventListener('click', e => {
    document.querySelectorAll('.pool-tool[data-tool]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTool = btn.dataset.tool;
    canvas.style.cursor = activeTool === 'observe' ? 'none' : 'crosshair';
  });
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
  if (soundEnabled) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    oceanGain.gain.setTargetAtTime(masterVolume * 0.3, audioCtx.currentTime, 0.5);
    btn.textContent = '🔊';
  } else {
    oceanGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.3);
    btn.textContent = '🔇';
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

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w: rect.width, h: rect.height };
}

let { w, h } = resize();
window.addEventListener('resize', () => { ({ w, h } = resize()); });

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
    const b = 25 + Math.floor(Math.random() * 6);
    foodPellets.push({ x: mx, y: my, size: 3, bites: b, startBites: b, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 });
    ripples.push({ x: mx, y: my, radius: 2, maxRadius: 20, opacity: 0.2 });
  } else if (activeTool === 'rock') {
    ripples.push({ x: mx, y: my, radius: 3, maxRadius: 150, opacity: 0.7 });
    ripples.push({ x: mx, y: my, radius: 3, maxRadius: 80, opacity: 0.4 });
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
    const b2 = 25 + Math.floor(Math.random() * 6);
    foodPellets.push({ x: mouse.x, y: mouse.y, size: 3, bites: b2, startBites: b2, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 });
    ripples.push({ x: mouse.x, y: mouse.y, radius: 2, maxRadius: 20, opacity: 0.2 });
  } else if (activeTool === 'rock') {
    ripples.push({ x: mouse.x, y: mouse.y, radius: 3, maxRadius: 150, opacity: 0.7 });
    ripples.push({ x: mouse.x, y: mouse.y, radius: 3, maxRadius: 80, opacity: 0.4 });
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
    speed: 0.8 + intensity * 2,
    width: 15 + intensity * 40,
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
  constructor() {
    // Spawn in center 60% of viewport
    this.x = w * 0.2 + Math.random() * w * 0.6;
    this.y = h * 0.2 + Math.random() * h * 0.6;
    this.angle = Math.random() * Math.PI * 2;
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

    // Size - small and slender for top-down view
    this.len = (5 + Math.random() * 2.5) * this.scale;
    this.bodyWidth = this.len * 0.15;

    // Color assigned per school (set after construction)
    this.school = 0;
    this.color = 'rgb(140, 150, 160)';
    this.bellyColor = 'rgb(170, 180, 190)';

    // Schooling parameters
    this.separationDist = 15 * this.scale;
    this.alignDist = 50 * this.scale;
    this.cohesionDist = 80 * this.scale;

    // Flee state
    this.fleeing = false;
    this.fleeTimer = 0;
    // Eating pause
    this.eating = false;
    this.eatTimer = 0;
    // Distraction - sometimes fish wander off from the school
    this.distracted = Math.random() < 0.15;
    this.distractTimer = this.distracted ? 3 + Math.random() * 8 : 5 + Math.random() * 10;
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

    // Faint gradient pull toward center - stronger near edges, zero in middle
    const edgeX = Math.max(0, Math.abs(this.x - w / 2) / (w / 2) - 0.5) * 2; // 0 in center 50%, ramps to 1 at edge
    const edgeY = Math.max(0, Math.abs(this.y - h / 2) / (h / 2) - 0.5) * 2;
    this.vx += (w / 2 - this.x) * edgeX * 0.0002;
    this.vy += (h / 2 - this.y) * edgeY * 0.0002;

    // Tidal current + local turbulence
    this.vx += Math.cos(tide.angle) * tide.strength * 0.012;
    this.vy += Math.sin(tide.angle) * tide.strength * 0.012;
    const flow = sampleFlow(this.x, this.y, time);
    this.vx += flow.fx * 0.01;
    this.vy += flow.fy * 0.01;

    // Food attraction - fish are very interested, urgency fades with distance
    let closestFood = null;
    let closestFoodDist = 300;
    for (const fp of foodPellets) {
      if (fp.bites <= 0) continue;
      const fdx = fp.x - this.x;
      const fdy = fp.y - this.y;
      const fd = Math.sqrt(fdx * fdx + fdy * fdy);
      if (fd < closestFoodDist) { closestFood = fp; closestFoodDist = fd; }
    }
    if (closestFood) {
      const fdx = closestFood.x - this.x;
      const fdy = closestFood.y - this.y;
      const desiredAngle = Math.atan2(fdy, fdx);
      // Check angle between current heading and food direction
      let headingDiff = desiredAngle - this.angle;
      while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
      while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;
      const angleMismatch = Math.abs(headingDiff);

      if (this.idle) { this.idle = false; this.idleTimer = 2; }

      if (closestFoodDist < 10) {
        // Close enough to eat - stop and bite
        this.vx *= 0.8;
        this.vy *= 0.8;
        if (closestFoodDist < 6 && !this.eating) {
          closestFood.bites--;
          closestFood.size *= 0.97;
          // Jostle the food from the bite impact
          const biteAngle = this.angle;
          closestFood.vx += Math.cos(biteAngle) * 0.3;
          closestFood.vy += Math.sin(biteAngle) * 0.3;
          this.eating = true;
          this.eatTimer = 0.3 + Math.random() * 0.2; // brief pause to chew
          // Spawn a fragment only after ~5 bites taken, then 25% chance
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
      } else if (angleMismatch < 1.4) {
        // Good approach angle - steer toward food, stronger when closer
        const proximity = 1 - closestFoodDist / 300;
        const steer = 0.02 + proximity * 0.06;
        const desiredVx = Math.cos(desiredAngle) * this.baseSpeed * (1 + proximity * 0.5);
        const desiredVy = Math.sin(desiredAngle) * this.baseSpeed * (1 + proximity * 0.5);
        this.vx += (desiredVx - this.vx) * steer;
        this.vy += (desiredVy - this.vy) * steer;
      } else if (closestFoodDist < 60) {
        // Close but bad angle - gentle turn to come around
        this.vx += (Math.cos(desiredAngle) - Math.cos(this.angle)) * 0.01;
        this.vy += (Math.sin(desiredAngle) - Math.sin(this.angle)) * 0.01;
      }
    }

    // Mouse avoidance - dart away, not blast away
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
    if (this.fleeing) targetSpeed = this.baseSpeed * 1.15;
    else if (this.idle) targetSpeed = this.baseSpeed * 0.15;
    else targetSpeed = this.baseSpeed;

    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > 0.01) {
      const desired = currentSpeed + (targetSpeed - currentSpeed) * 0.02;
      const ratio = desired / currentSpeed;
      this.vx *= ratio;
      this.vy *= ratio;
    }

    // Drag - smooths out micro-jitter
    this.vx *= 0.985;
    this.vy *= 0.985;

    // Soft return from offscreen - fish can swim 30% beyond viewport
    // but get gently pulled back toward the visible area
    const overflow = 0.3;
    const minX = -w * overflow, maxX = w * (1 + overflow);
    const minY = -h * overflow, maxY = h * (1 + overflow);
    // Start pulling back when beyond the viewport edge
    if (this.x < 0) this.vx += Math.abs(this.x) * 0.003;
    if (this.x > w) this.vx -= (this.x - w) * 0.003;
    if (this.y < 0) this.vy += Math.abs(this.y) * 0.003;
    if (this.y > h) this.vy -= (this.y - h) * 0.003;
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
    // Angle tracks velocity direction but with turn rate limit
    // Fish must move forward to turn - can't pivot in place
    const targetAngle = Math.atan2(this.vy, this.vx);
    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const maxTurn = 0.08 + currentSpeed * 0.1; // faster fish can turn quicker
    this.angle += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));
    this.speed = currentSpeed;
  }

  draw(ctx) {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    // Fish body - streamlined oval
    ctx.beginPath();
    // Nose
    const noseX = this.x + cos * this.len * 0.5;
    const noseY = this.y + sin * this.len * 0.5;
    // Tail base
    const tailX = this.x - cos * this.len * 0.5;
    const tailY = this.y - sin * this.len * 0.5;

    // Elliptical body
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, this.len * 0.45, this.bodyWidth, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Belly highlight
    ctx.beginPath();
    ctx.ellipse(this.len * 0.05, this.bodyWidth * 0.15, this.len * 0.25, this.bodyWidth * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = this.bellyColor;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Tail fin - forked
    const tailWiggle = Math.sin(Date.now() * 0.01 + this.x) * 0.2 * this.speed;
    ctx.beginPath();
    ctx.moveTo(-this.len * 0.4, 0);
    ctx.lineTo(-this.len * 0.65, (-this.bodyWidth * 0.8 + tailWiggle));
    ctx.lineTo(-this.len * 0.5, 0);
    ctx.lineTo(-this.len * 0.65, (this.bodyWidth * 0.8 + tailWiggle));
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Eye
    ctx.beginPath();
    ctx.arc(this.len * 0.25, -this.bodyWidth * 0.15, this.len * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#111';
    ctx.fill();

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
const fishCount = Math.max(60, Math.floor((w * h) / 2750));
const fish = [];
for (let i = 0; i < fishCount; i++) {
  const f = new Fish();
  const school = Math.floor(i / (fishCount / schoolColors.length));
  f.school = school;
  f.color = schoolColors[school].color;
  f.bellyColor = schoolColors[school].belly;
  fish.push(f);
}

// Rocks - tidepool has rocky edges
const rocks = [];
for (let i = 0; i < 15; i++) {
  const edge = Math.floor(Math.random() * 4);
  let rx, ry;
  if (edge === 0) { rx = Math.random() * w; ry = Math.random() * 25; }
  else if (edge === 1) { rx = w - Math.random() * 25; ry = Math.random() * h; }
  else if (edge === 2) { rx = Math.random() * w; ry = h - Math.random() * 25; }
  else { rx = Math.random() * 25; ry = Math.random() * h; }
  rocks.push({
    x: rx, y: ry,
    size: 8 + Math.random() * 18,
    color: `rgb(${40 + Math.floor(Math.random() * 20)}, ${45 + Math.floor(Math.random() * 15)}, ${50 + Math.floor(Math.random() * 15)})`,
    elongation: 0.5 + Math.random() * 0.5,
    angle: Math.random() * Math.PI,
  });
}

// Seaweed fronds around perimeter
class Frond {
  constructor(x, y, growAngle) {
    this.x = x;
    this.y = y;
    this.growAngle = growAngle;
    this.len = 40 + Math.random() * 55;
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
    const currentX = Math.cos(tide.angle) * tide.strength * 0.04 + Math.sin(time * 0.0002 + this.phase) * 0.02;
    const currentY = Math.sin(tide.angle) * tide.strength * 0.04 + Math.cos(time * 0.00015 + this.phase) * 0.015;
    for (let i = 1; i < this.segs.length; i++) {
      const s = this.segs[i];
      const t = i / this.segCount;
      s.vx += currentX * t;
      s.vy += currentY * t;
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
      ctx.lineWidth = 1.6 * (1 - t * 0.7);
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
let settleTime = 3; // seconds of gentle centering at start

function draw(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (settleTime > 0) settleTime -= dt;

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
        // Very slight nudge - fish mostly hold their ground
        f.vx += cosA * pushForce * 0.005;
        f.vy += sinA * pushForce * 0.005;
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
    if (d.x < 0) d.x = w; if (d.x > w) d.x = 0;
    if (d.y < 0) d.y = h; if (d.y > h) d.y = 0;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 120, 130, ${d.opacity})`;
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
    // Continuously spawn foam at the wave front (in world space)
    const cosA = Math.cos(ww.angle);
    const sinA = Math.sin(ww.angle);
    const span = Math.max(w, h) * 1.2;
    if (ww.life > 0.1) {
      for (let i = 0; i < 4; i++) {
        const lateral = (Math.random() - 0.5) * span;
        // Spawn slightly behind the front (positive = behind in wave direction)
        const behind = Math.random() * 5;
        ww.blobs.push({
          x: ww.x - cosA * behind + (-sinA) * lateral,
          y: ww.y - sinA * behind + cosA * lateral,
          size: 0.4 + Math.pow(Math.random(), 2) * 3.5,
          elongX: 0.7 + Math.random() * 1.3,
          elongY: 0.5 + Math.random() * 0.7,
          rot: Math.random() * Math.PI,
          age: 0,
          maxAge: 2 + Math.random() * 3,
        });
      }
    }
    // Draw the wave front - continuously evolving shape
    const perpX = -sinA;
    const perpY = cosA;
    // Seed per wave for unique character, but shape morphs over time
    if (!ww.seed) ww.seed = Math.random() * 100;
    const t = ww.traveled * 0.02; // time evolution
    const step = 6;
    let inStroke = false;
    for (let pos = -span; pos <= span; pos += step) {
      // Layered sine noise that evolves with travel distance
      const large = Math.sin(pos * 0.018 + t * 0.7 + ww.seed) * 9;
      const medium = Math.sin(pos * 0.06 + t * 1.3 + ww.seed * 2) * 4;
      const small = Math.sin(pos * 0.15 + t * 2.5 + ww.seed * 3) * 2;
      const offset = large + medium + small;
      const thickness = 1.2 + (Math.sin(pos * 0.04 + t * 0.9) * 0.5 + 0.5) * 2;
      const opacity = 0.2 + (Math.sin(pos * 0.03 + t * 0.6 + 1) * 0.5 + 0.5) * 0.25;
      // Gaps that shift over time
      const gapNoise = Math.sin(pos * 0.09 + t * 1.8 + ww.seed * 4);
      if (gapNoise > 0.85) {
        if (inStroke) { ctx.stroke(); inStroke = false; }
        continue;
      }
      const px = ww.x + perpX * pos + cosA * offset;
      const py = ww.y + perpY * pos + sinA * offset;
      if (!inStroke) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.globalAlpha = ww.life * opacity;
        ctx.strokeStyle = 'rgba(200, 230, 245, 1)';
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        inStroke = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    if (inStroke) ctx.stroke();

    // Update and draw blobs - drift with current and turbulence, fade out
    for (let i = ww.blobs.length - 1; i >= 0; i--) {
      const b = ww.blobs[i];
      b.age += dt;
      if (b.age > b.maxAge) { ww.blobs.splice(i, 1); continue; }
      // Move with current and local turbulence
      const flow = sampleFlow(b.x, b.y, time);
      b.x += Math.cos(tide.angle) * tide.strength * 0.3 + flow.fx * 0.4;
      b.y += Math.sin(tide.angle) * tide.strength * 0.3 + flow.fy * 0.4;
      b.rot += flow.fx * 0.02; // spin slightly from turbulence
      // Shrink as they dissipate
      const life = 1 - b.age / b.maxAge;
      const shrink = 0.5 + life * 0.5;
      ctx.save();
      ctx.globalAlpha = life * 0.2;
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, b.size * b.elongX * shrink, b.size * b.elongY * shrink, 0, 0, Math.PI * 2);
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
