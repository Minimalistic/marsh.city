---
title: Tadpole Pond
description: A shallow pond full of wriggly tadpoles with tiny brains. Hover to spook them.
---

A shallow pond. The tadpoles have rudimentary needs - they get hungry, scrounge for food, rest, and startle when you hover your cursor over them. Their bodies flex and bend as they swim. Each one is doing its own thing.

<canvas id="pond" style="width:100%;aspect-ratio:16/9;border-radius:var(--radius);cursor:none;display:block;background:#1a2f1a;"></canvas>

<script type="module">
const canvas = document.getElementById('pond');
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

// Mouse tracking
let mouse = { x: -1000, y: -1000, active: false };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
  mouse.active = true;
});
canvas.addEventListener('mouseleave', () => { mouse.active = false; mouse.x = -1000; mouse.y = -1000; });

// Food particles - algae bits drifting in the water
const food = [];
function spawnFood() {
  if (food.length < 40) {
    food.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 1.5 + Math.random() * 2.5,
      drift: (Math.random() - 0.5) * 0.15,
      life: 1,
    });
  }
}

// Tadpole class
class Tadpole {
  constructor() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0.4 + Math.random() * 0.6;
    this.baseSpeed = this.speed;
    this.turnRate = 0;
    this.targetAngle = this.angle;

    // Body segments for bendy movement
    this.segments = [];
    this.segCount = 8;
    this.segLen = 3 + Math.random() * 1.5;
    for (let i = 0; i < this.segCount; i++) {
      this.segments.push({ x: this.x - Math.cos(this.angle) * i * this.segLen,
                           y: this.y - Math.sin(this.angle) * i * this.segLen });
    }

    // Size variation
    this.headSize = 3 + Math.random() * 2;
    this.bodyWidth = this.headSize * 0.9;

    // Needs
    this.hunger = Math.random() * 0.4;
    this.energy = 0.6 + Math.random() * 0.4;

    // State machine
    this.state = 'wander'; // wander, seek_food, eat, flee, rest
    this.stateTimer = 0;
    this.target = null;

    // Wiggle
    this.wigglePhase = Math.random() * Math.PI * 2;
    this.wiggleSpeed = 6 + Math.random() * 4;
    this.wiggleAmp = 0.3 + Math.random() * 0.2;

    // Color variation
    const shade = Math.floor(20 + Math.random() * 30);
    this.color = `rgb(${shade}, ${shade + 10}, ${shade})`;
    this.bellyColor = `rgb(${shade + 30}, ${shade + 35}, ${shade + 20})`;
  }

  findFood() {
    let closest = null;
    let closestDist = 120;
    for (const f of food) {
      const dx = f.x - this.x;
      const dy = f.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closest = f;
        closestDist = dist;
      }
    }
    return closest;
  }

  update(dt) {
    this.stateTimer -= dt;
    this.hunger += dt * 0.008;
    this.energy = Math.max(0, Math.min(1, this.energy + dt * 0.002));
    this.wigglePhase += dt * this.wiggleSpeed;

    // Check mouse proximity for flee
    const mdx = mouse.x - this.x;
    const mdy = mouse.y - this.y;
    const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);
    if (mouse.active && mouseDist < 80) {
      this.state = 'flee';
      this.stateTimer = 0.8 + Math.random() * 0.5;
      this.targetAngle = Math.atan2(-mdy, -mdx) + (Math.random() - 0.5) * 0.8;
      this.speed = this.baseSpeed * 3.5;
      this.wiggleSpeed = 18;
    }

    switch (this.state) {
      case 'wander':
        this.speed += (this.baseSpeed - this.speed) * 0.03;
        this.wiggleSpeed += (8 - this.wiggleSpeed) * 0.05;
        if (this.stateTimer <= 0) {
          this.targetAngle = this.angle + (Math.random() - 0.5) * 1.8;
          this.stateTimer = 1 + Math.random() * 3;
        }
        // Get hungry -> seek food
        if (this.hunger > 0.6) {
          const f = this.findFood();
          if (f) {
            this.target = f;
            this.state = 'seek_food';
          }
        }
        // Low energy -> rest
        if (this.energy < 0.2 && Math.random() < 0.01) {
          this.state = 'rest';
          this.stateTimer = 2 + Math.random() * 3;
        }
        break;

      case 'seek_food':
        if (!this.target || food.indexOf(this.target) === -1) {
          this.state = 'wander';
          this.stateTimer = 0.5;
          break;
        }
        const fdx = this.target.x - this.x;
        const fdy = this.target.y - this.y;
        const fdist = Math.sqrt(fdx * fdx + fdy * fdy);
        this.targetAngle = Math.atan2(fdy, fdx);
        this.speed = this.baseSpeed * 1.4;
        this.wiggleSpeed = 10;
        if (fdist < 6) {
          this.state = 'eat';
          this.stateTimer = 0.4;
        }
        break;

      case 'eat':
        this.speed *= 0.9;
        this.wiggleSpeed = 3;
        if (this.target && food.indexOf(this.target) !== -1) {
          food.splice(food.indexOf(this.target), 1);
          this.hunger = Math.max(0, this.hunger - 0.3);
          this.energy = Math.min(1, this.energy + 0.1);
        }
        if (this.stateTimer <= 0) {
          this.state = 'wander';
          this.stateTimer = 1 + Math.random() * 2;
        }
        break;

      case 'flee':
        if (this.stateTimer <= 0) {
          this.state = 'wander';
          this.stateTimer = 0.5 + Math.random();
          this.speed = this.baseSpeed;
          this.wiggleSpeed = 8;
        }
        break;

      case 'rest':
        this.speed *= 0.92;
        this.wiggleSpeed = 2;
        this.wiggleAmp = 0.1;
        this.energy = Math.min(1, this.energy + dt * 0.01);
        if (this.stateTimer <= 0) {
          this.state = 'wander';
          this.stateTimer = 1;
          this.wiggleAmp = 0.3 + Math.random() * 0.2;
        }
        break;
    }

    // Smooth turning
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * 0.08;

    // Move head
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    // Wrap at edges with soft turning
    const margin = 20;
    if (this.x < margin) this.targetAngle = 0;
    if (this.x > w - margin) this.targetAngle = Math.PI;
    if (this.y < margin) this.targetAngle = Math.PI / 2;
    if (this.y > h - margin) this.targetAngle = -Math.PI / 2;

    // Update body segments - follow the leader with wiggle
    this.segments[0] = { x: this.x, y: this.y };
    for (let i = 1; i < this.segCount; i++) {
      const prev = this.segments[i - 1];
      const seg = this.segments[i];
      const dx = seg.x - prev.x;
      const dy = seg.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.segLen) {
        const ratio = this.segLen / dist;
        seg.x = prev.x + dx * ratio;
        seg.y = prev.y + dy * ratio;
      }
      // Lateral wiggle increases toward tail
      const wiggle = Math.sin(this.wigglePhase - i * 0.8) * this.wiggleAmp * (i / this.segCount);
      const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
      seg.x += Math.cos(perpAngle) * wiggle * this.speed * 2;
      seg.y += Math.sin(perpAngle) * wiggle * this.speed * 2;
    }
  }

  draw(ctx) {
    const segs = this.segments;

    // Draw tail fin (thin tapered end)
    const tail = segs[segs.length - 1];
    const preTail = segs[segs.length - 2];
    const tailAngle = Math.atan2(tail.y - preTail.y, tail.x - preTail.x);
    const tailWiggle = Math.sin(this.wigglePhase) * 3 * (this.speed / this.baseSpeed);

    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(
      tail.x + Math.cos(tailAngle + 0.6) * 5 + Math.cos(tailAngle + Math.PI / 2) * tailWiggle,
      tail.y + Math.sin(tailAngle + 0.6) * 5 + Math.sin(tailAngle + Math.PI / 2) * tailWiggle
    );
    ctx.lineTo(
      tail.x + Math.cos(tailAngle - 0.6) * 5 + Math.cos(tailAngle + Math.PI / 2) * tailWiggle,
      tail.y + Math.sin(tailAngle - 0.6) * 5 + Math.sin(tailAngle + Math.PI / 2) * tailWiggle
    );
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw body as tapered shape through segments
    ctx.beginPath();
    for (let side = 0; side < 2; side++) {
      const dir = side === 0 ? 1 : -1;
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        const next = segs[Math.min(i + 1, segs.length - 1)];
        const angle = Math.atan2(next.y - seg.y, next.x - seg.x);
        const perpAngle = angle + (Math.PI / 2) * dir;

        // Taper: wide at head, narrow at tail
        let width;
        const t = i / (segs.length - 1);
        if (t < 0.25) {
          width = this.bodyWidth * (0.7 + t * 1.2); // head swells
        } else {
          width = this.bodyWidth * (1 - (t - 0.25) * 1.1); // tapers to tail
        }
        width = Math.max(width, 0.5);

        const px = seg.x + Math.cos(perpAngle) * width;
        const py = seg.y + Math.sin(perpAngle) * width;

        if (i === 0 && side === 0) ctx.moveTo(px, py);
        else if (side === 0) ctx.lineTo(px, py);
      }
      if (side === 0) {
        // Continue along the other side in reverse
        for (let i = segs.length - 1; i >= 0; i--) {
          const seg = segs[i];
          const next = segs[Math.min(i + 1, segs.length - 1)];
          const angle = Math.atan2(next.y - seg.y, next.x - seg.x);
          const perpAngle = angle - Math.PI / 2;

          let width;
          const t = i / (segs.length - 1);
          if (t < 0.25) {
            width = this.bodyWidth * (0.7 + t * 1.2);
          } else {
            width = this.bodyWidth * (1 - (t - 0.25) * 1.1);
          }
          width = Math.max(width, 0.5);

          const px = seg.x + Math.cos(perpAngle) * width;
          const py = seg.y + Math.sin(perpAngle) * width;
          ctx.lineTo(px, py);
        }
      }
    }
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    // Belly highlight
    ctx.beginPath();
    const belly = segs[1];
    ctx.ellipse(belly.x, belly.y, this.bodyWidth * 0.5, this.bodyWidth * 0.3,
                Math.atan2(segs[2].y - segs[0].y, segs[2].x - segs[0].x), 0, Math.PI * 2);
    ctx.fillStyle = this.bellyColor;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Head (round)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.headSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Eyes
    const eyeOffset = this.headSize * 0.5;
    const eyeAngleL = this.angle + 0.6;
    const eyeAngleR = this.angle - 0.6;
    for (const ea of [eyeAngleL, eyeAngleR]) {
      const ex = this.x + Math.cos(ea) * eyeOffset;
      const ey = this.y + Math.sin(ea) * eyeOffset;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
    }
  }
}

// Create tadpoles
const tadpoles = [];
const count = Math.max(12, Math.floor((w * h) / 8000));
for (let i = 0; i < count; i++) {
  tadpoles.push(new Tadpole());
}

// Pond floor details - pebbles and plants
const pebbles = [];
for (let i = 0; i < 30; i++) {
  pebbles.push({
    x: Math.random() * w,
    y: Math.random() * h,
    size: 2 + Math.random() * 5,
    color: `rgba(${60 + Math.random() * 40}, ${70 + Math.random() * 30}, ${50 + Math.random() * 30}, 0.3)`,
    elongation: 0.5 + Math.random() * 0.5,
    angle: Math.random() * Math.PI,
  });
}

// Pond plants
const plants = [];
for (let i = 0; i < 8; i++) {
  plants.push({
    x: Math.random() * w,
    y: Math.random() * h,
    blades: 3 + Math.floor(Math.random() * 4),
    height: 15 + Math.random() * 25,
    phase: Math.random() * Math.PI * 2,
  });
}

let lastTime = 0;
let foodTimer = 0;

function drawPond(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Clear with pond water color
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
  gradient.addColorStop(0, '#1e3a20');
  gradient.addColorStop(0.6, '#1a2f1a');
  gradient.addColorStop(1, '#142414');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Pebbles
  for (const p of pebbles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size, p.size * p.elongation, 0, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }

  // Plants swaying
  for (const p of plants) {
    const sway = Math.sin(time * 0.001 + p.phase) * 4;
    ctx.strokeStyle = 'rgba(60, 120, 40, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    for (let b = 0; b < p.blades; b++) {
      const spread = (b - p.blades / 2) * 4;
      ctx.beginPath();
      ctx.moveTo(p.x + spread, p.y);
      ctx.quadraticCurveTo(
        p.x + spread + sway + b * 2, p.y - p.height * 0.6,
        p.x + spread + sway * 1.5, p.y - p.height + b * 3
      );
      ctx.stroke();
    }
  }

  // Food
  for (const f of food) {
    f.x += f.drift;
    f.y += Math.sin(time * 0.002 + f.x) * 0.05;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80, 140, 50, ${0.4 + Math.sin(time * 0.003 + f.x) * 0.15})`;
    ctx.fill();
  }

  // Spawn food periodically
  foodTimer += dt;
  if (foodTimer > 0.8) {
    foodTimer = 0;
    spawnFood();
  }

  // Mouse ripple indicator
  if (mouse.active) {
    const rippleRadius = 80;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, rippleRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(200, 220, 200, ${0.08 + Math.sin(time * 0.005) * 0.04})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Inner ripple
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, rippleRadius * 0.4 + Math.sin(time * 0.008) * 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(200, 220, 200, 0.06)';
    ctx.stroke();
  }

  // Update and draw tadpoles
  for (const t of tadpoles) {
    t.update(dt);
    t.draw(ctx);
  }

  // Surface caustics effect (subtle)
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 6; i++) {
    const cx = w * 0.3 + Math.sin(time * 0.0005 + i) * w * 0.3;
    const cy = h * 0.3 + Math.cos(time * 0.0007 + i * 1.5) * h * 0.3;
    const cr = 40 + Math.sin(time * 0.001 + i * 2) * 20;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = '#4a8a3a';
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  requestAnimationFrame(drawPond);
}

requestAnimationFrame(drawPond);
</script>
