---
title: Tidepool
description: Tiny fish schooling in a shallow tidepool. Watch the current shift.
---

A rocky tidepool. Tiny silver fish school together, responding to the shifting current and each other. Tap to scatter them.

<canvas id="pool" style="width:100%;aspect-ratio:16/9;border-radius:var(--radius);cursor:none;display:block;background:#0f1f2a;"></canvas>

<script type="module">
const canvas = document.getElementById('pool');
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
  ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, radius: 3, maxRadius: 120, opacity: 0.5 });
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
  ripples.push({ x: mouse.x, y: mouse.y, radius: 3, maxRadius: 90, opacity: 0.4 });
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

// Tidal current - gentle drift that shifts direction
const tide = { angle: 0, strength: 0.4, targetAngle: Math.random() * Math.PI * 2, targetStrength: 0.3 + Math.random() * 0.4 };

// Debris particles
const debris = [];
for (let i = 0; i < 400; i++) {
  debris.push({
    x: Math.random() * w, y: Math.random() * h,
    size: 0.2 + Math.random() * 0.7,
    vx: 0, vy: 0,
    opacity: 0.05 + Math.random() * 0.12,
  });
}

// Small fish class - schooling behavior (boids)
class Fish {
  constructor() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
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
  }

  update(dt, fish, time) {
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

    // Apply boids
    if (sepCount > 0) { this.vx += sepX * 0.15; this.vy += sepY * 0.15; }
    if (alignCount > 0) { this.vx += (alignX / alignCount - this.vx) * 0.05; this.vy += (alignY / alignCount - this.vy) * 0.05; }
    if (cohCount > 0) { const cx = cohX / cohCount; const cy = cohY / cohCount; this.vx += (cx - this.x) * 0.0008; this.vy += (cy - this.y) * 0.0008; }

    // Tidal current - gentle drift, not a shove
    this.vx += Math.cos(tide.angle) * tide.strength * 0.012;
    this.vy += Math.sin(tide.angle) * tide.strength * 0.012;

    // Mouse avoidance
    if (mouse.active) {
      const mdx = this.x - mouse.x;
      const mdy = this.y - mouse.y;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      const fleeR = mouse.down ? 100 : 30 + mouse.speed * 5;
      if (mDist < fleeR && mDist > 0.1) {
        const force = 3 * (1 - mDist / fleeR);
        this.vx += (mdx / mDist) * force;
        this.vy += (mdy / mDist) * force;
        this.fleeing = true;
        this.fleeTimer = 0.5;
      }
    }

    // Ripple avoidance
    for (const r of ripples) {
      const rdx = this.x - r.x;
      const rdy = this.y - r.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      if (Math.abs(rDist - r.radius) < 20 && r.opacity > 0.1 && rDist > 0.1) {
        const force = 2 * r.opacity;
        this.vx += (rdx / rDist) * force;
        this.vy += (rdy / rDist) * force;
        this.fleeing = true;
        this.fleeTimer = 0.4;
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
    if (this.fleeing) targetSpeed = this.baseSpeed * 2.5;
    else if (this.idle) targetSpeed = this.baseSpeed * 0.15;
    else targetSpeed = this.baseSpeed;

    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > 0.01) {
      const desired = currentSpeed + (targetSpeed - currentSpeed) * 0.02;
      const ratio = desired / currentSpeed;
      this.vx *= ratio;
      this.vy *= ratio;
    }

    // Gentle drag
    this.vx *= 0.99;
    this.vy *= 0.99;

    // Active edge avoidance - fish swim away from edges, stronger the closer they get
    const edgeMargin = 60;
    const hardMargin = 20;
    if (this.x < edgeMargin) { const urgency = Math.pow(1 - this.x / edgeMargin, 2); this.vx += urgency * 0.15; }
    if (this.x > w - edgeMargin) { const urgency = Math.pow(1 - (w - this.x) / edgeMargin, 2); this.vx -= urgency * 0.15; }
    if (this.y < edgeMargin) { const urgency = Math.pow(1 - this.y / edgeMargin, 2); this.vy += urgency * 0.15; }
    if (this.y > h - edgeMargin) { const urgency = Math.pow(1 - (h - this.y) / edgeMargin, 2); this.vy -= urgency * 0.15; }
    // If near edge and idle, wake up and swim away
    if (this.idle && (this.x < hardMargin || this.x > w - hardMargin || this.y < hardMargin || this.y > h - hardMargin)) {
      this.idle = false;
      this.idleTimer = 3 + Math.random() * 4;
    }

    // Move
    this.x += this.vx;
    this.y += this.vy;
    this.x = Math.max(1, Math.min(w - 1, this.x));
    this.y = Math.max(1, Math.min(h - 1, this.y));
    this.angle = Math.atan2(this.vy, this.vx);
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
const fishCount = Math.max(25, Math.floor((w * h) / 7000));
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
    this.len = 25 + Math.random() * 40;
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
for (let i = 0; i < 12; i++) {
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
let tideShiftTimer = 0;

function draw(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Update tide - slowly shifts direction
  tideShiftTimer += dt;
  if (tideShiftTimer > 8) {
    tideShiftTimer = 0;
    tide.targetAngle = Math.random() * Math.PI * 2;
    tide.targetStrength = 0.3 + Math.random() * 0.4;
  }
  let angleDiff = tide.targetAngle - tide.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  tide.angle += angleDiff * 0.015;
  tide.strength += (tide.targetStrength - tide.strength) * 0.02;

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

  // Current indicator - visible directional streaks
  ctx.globalAlpha = tide.strength * 0.08;
  for (let i = 0; i < 12; i++) {
    const sx = (w * 0.08 + i * w * 0.08 + time * tide.strength * 0.03) % w;
    const sy = (h * 0.08 + i * h * 0.09 + time * tide.strength * 0.02) % h;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(tide.angle) * 20, sy + Math.sin(tide.angle) * 20);
    ctx.strokeStyle = 'rgba(150, 200, 210, 1)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

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
