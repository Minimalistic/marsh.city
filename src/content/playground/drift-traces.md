---
title: Drift Traces
description: Generative art from schooling fish and tidal waves - trails build up then wash clean.
---

Fish school and drift through tidal currents, painting trails as they move. Waves periodically wash the canvas clean, and the painting begins again. Each cycle is unique.

<canvas id="drift" style="width:100%;aspect-ratio:16/9;border-radius:var(--radius);cursor:none;display:block;background:#0a1520;"></canvas>

<script type="module">
const canvas = document.getElementById('drift');
const ctx = canvas.getContext('2d');

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

// Wave current
const waveBaseAngle = Math.random() * Math.PI * 2;
const tide = { angle: 0, strength: 0 };
let waveTime = 0;

// Vortices for local turbulence
const vortices = [];
for (let i = 0; i < 4; i++) {
  vortices.push({
    x: Math.random() * w, y: Math.random() * h,
    radius: 80 + Math.random() * 100,
    strength: (Math.random() < 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.3),
    driftAngle: Math.random() * Math.PI * 2,
    driftSpeed: 0.08 + Math.random() * 0.1,
    phase: Math.random() * Math.PI * 2,
  });
}

function sampleFlow(px, py) {
  let fx = 0, fy = 0;
  for (const v of vortices) {
    const dx = px - v.x;
    const dy = py - v.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < v.radius && dist > 1) {
      const t = dist / v.radius;
      const falloff = t * Math.pow(1 - t, 0.5) * 4;
      fx += (-dy / dist) * v.strength * falloff;
      fy += (dx / dist) * v.strength * falloff;
    }
  }
  return { fx, fy };
}

// Particles that leave trails
const particles = [];
for (let i = 0; i < 300; i++) {
  particles.push({
    x: Math.random() * w, y: Math.random() * h,
    vx: 0, vy: 0,
    size: 0.3 + Math.random() * 0.8,
    hue: 180 + Math.random() * 40, // teal range
    sat: 30 + Math.random() * 30,
    light: 50 + Math.random() * 20,
    alpha: 0.3 + Math.random() * 0.4,
  });
}

// Schooling fish that paint trails
const schoolColors = [
  { h: 200, s: 50, l: 65 }, // blue-silver
  { h: 40, s: 45, l: 60 },  // golden
  { h: 160, s: 40, l: 55 }, // teal
  { h: 280, s: 30, l: 60 }, // lavender
];

class Fish {
  constructor(school) {
    this.x = w * 0.2 + Math.random() * w * 0.6;
    this.y = h * 0.2 + Math.random() * h * 0.6;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0.4 + Math.random() * 0.3;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.school = school;
    this.len = 4 + Math.random() * 2;
    this.prevX = this.x;
    this.prevY = this.y;
    this.separationDist = 12;
    this.alignDist = 45;
    this.cohesionDist = 70;
  }

  update(dt, allFish) {
    let sepX = 0, sepY = 0, sepCount = 0;
    let alignX = 0, alignY = 0, alignCount = 0;
    let cohX = 0, cohY = 0, cohCount = 0;

    for (const other of allFish) {
      if (other === this) continue;
      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.separationDist && dist > 0.1) { sepX -= dx / dist; sepY -= dy / dist; sepCount++; }
      if (dist < this.alignDist && other.school === this.school) { alignX += other.vx; alignY += other.vy; alignCount++; }
      if (dist < this.cohesionDist && other.school === this.school) { cohX += other.x; cohY += other.y; cohCount++; }
    }

    if (sepCount > 0) { this.vx += sepX * 0.1; this.vy += sepY * 0.1; }
    if (alignCount > 0) { this.vx += (alignX / alignCount - this.vx) * 0.03; this.vy += (alignY / alignCount - this.vy) * 0.03; }
    if (cohCount > 0) { const cx = cohX / cohCount; const cy = cohY / cohCount; this.vx += (cx - this.x) * 0.0005; this.vy += (cy - this.y) * 0.0005; }

    // Tide + turbulence
    this.vx += Math.cos(tide.angle) * tide.strength * 0.01;
    this.vy += Math.sin(tide.angle) * tide.strength * 0.01;
    const flow = sampleFlow(this.x, this.y);
    this.vx += flow.fx * 0.008;
    this.vy += flow.fy * 0.008;

    // Speed control
    const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (spd > 0.01) {
      const desired = spd + (this.speed - spd) * 0.02;
      this.vx *= desired / spd;
      this.vy *= desired / spd;
    }
    this.vx *= 0.985;
    this.vy *= 0.985;

    // Soft boundary
    if (this.x < 0) this.vx += 0.02; if (this.x > w) this.vx -= 0.02;
    if (this.y < 0) this.vy += 0.02; if (this.y > h) this.vy -= 0.02;

    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx;
    this.y += this.vy;
    this.angle = Math.atan2(this.vy, this.vx);
  }

  drawTrail(ctx) {
    const c = schoolColors[this.school];
    ctx.beginPath();
    ctx.moveTo(this.prevX, this.prevY);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = `hsla(${c.h}, ${c.s}%, ${c.l}%, 0.4)`;
    ctx.lineWidth = this.len * 0.3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

const fishCount = Math.max(40, Math.floor((w * h) / 4000));
const fish = [];
for (let i = 0; i < fishCount; i++) {
  fish.push(new Fish(i % schoolColors.length));
}

// Wash wave - clears the canvas
let washTimer = 12 + Math.random() * 10;
let washing = false;
let washProgress = 0;
let washAngle = 0;

let lastTime = 0;

function draw(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Wave
  waveTime += dt;
  const waveCycle = Math.sin(waveTime * 0.4);
  const secondaryWave = Math.sin(waveTime * 0.17) * 0.3;
  tide.angle = waveBaseAngle + secondaryWave;
  tide.strength = 0.3 + waveCycle * 0.35;

  // Vortices drift
  for (const v of vortices) {
    v.x += Math.cos(v.driftAngle) * v.driftSpeed;
    v.y += Math.sin(v.driftAngle) * v.driftSpeed;
    v.driftAngle += (Math.random() - 0.5) * 0.02;
    if (v.x < -50) v.x = w + 50; if (v.x > w + 50) v.x = -50;
    if (v.y < -50) v.y = h + 50; if (v.y > h + 50) v.y = -50;
    v.strength = (v.strength > 0 ? 1 : -1) * (0.3 + Math.sin(time * 0.0005 + v.phase) * 0.15);
  }

  // Wash timer - periodically wipe the canvas
  washTimer -= dt;
  if (washTimer <= 0 && !washing) {
    washing = true;
    washProgress = 0;
    washAngle = waveBaseAngle + (Math.random() - 0.5) * 0.4;
  }

  if (washing) {
    // Wipe across with a gradient edge
    washProgress += dt * 0.8;
    const cosA = Math.cos(washAngle);
    const sinA = Math.sin(washAngle);
    const frontPos = washProgress * Math.max(w, h) * 1.5 - Math.max(w, h) * 0.3;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(washAngle);
    ctx.translate(-w / 2, -h / 2);
    // Dark wash sweeping across
    const grad = ctx.createLinearGradient(frontPos - 60, 0, frontPos + 10, 0);
    grad.addColorStop(0, 'rgba(10, 21, 32, 1)');
    grad.addColorStop(0.7, 'rgba(10, 21, 32, 0.9)');
    grad.addColorStop(1, 'rgba(10, 21, 32, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(frontPos - Math.max(w, h), -h, Math.max(w, h) + 60, h * 3);
    ctx.restore();

    // Foam at the wash front
    for (let i = 0; i < 6; i++) {
      const lateral = (Math.random() - 0.5) * Math.max(w, h);
      const fx = w / 2 + cosA * (frontPos - Math.max(w, h) * 0.2) + (-sinA) * lateral;
      const fy = h / 2 + sinA * (frontPos - Math.max(w, h) * 0.2) + cosA * lateral;
      ctx.beginPath();
      ctx.arc(fx, fy, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 225, 240, ${0.15 * (1 - washProgress)})`;
      ctx.fill();
    }

    if (washProgress > 1.2) {
      washing = false;
      washTimer = 15 + Math.random() * 12;
    }
  }

  // Don't fully clear - just a very faint dim so trails accumulate
  if (!washing) {
    ctx.fillStyle = 'rgba(10, 21, 32, 0.008)';
    ctx.fillRect(0, 0, w, h);
  }

  // Update and draw particle trails
  for (const p of particles) {
    const prevX = p.x;
    const prevY = p.y;
    p.vx += Math.cos(tide.angle) * tide.strength * 0.006;
    p.vy += Math.sin(tide.angle) * tide.strength * 0.006;
    const flow = sampleFlow(p.x, p.y);
    p.vx += flow.fx * 0.012;
    p.vy += flow.fy * 0.012;
    p.vx *= 0.97;
    p.vy *= 0.97;
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

    // Draw trail segment
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${p.alpha * 0.3})`;
    ctx.lineWidth = p.size;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Update and draw fish trails
  for (const f of fish) {
    f.update(dt, fish);
    f.drawTrail(ctx);
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
</script>
