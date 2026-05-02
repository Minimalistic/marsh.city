---
title: Drift Traces
description: Slime mold-inspired particles forage and leave glowing trails that slowly fade.
---

Particles sense nearby food sources and leave trails as they forage. Trails accumulate and slowly fade, revealing emergent networks. Food replenishes over time.

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

// Food sources that attract particles
const foods = [];
const maxFoods = 6;

function spawnFood() {
  foods.push({
    x: 40 + Math.random() * (w - 80),
    y: 40 + Math.random() * (h - 80),
    energy: 0.6 + Math.random() * 0.4,
    radius: 30 + Math.random() * 40,
    hue: 50 + Math.random() * 30,
    decay: 0.0003 + Math.random() * 0.0003,
  });
}

for (let i = 0; i < maxFoods; i++) spawnFood();

// Slime mold agents
const agentCount = Math.max(80, Math.floor((w * h) / 2500));
const agents = [];

const agentColors = [
  { h: 160, s: 50, l: 55 }, // teal
  { h: 200, s: 45, l: 60 }, // blue
  { h: 40, s: 50, l: 55 },  // golden
  { h: 280, s: 35, l: 58 }, // lavender
];

for (let i = 0; i < agentCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const color = agentColors[i % agentColors.length];
  agents.push({
    x: Math.random() * w,
    y: Math.random() * h,
    angle,
    speed: 0.4 + Math.random() * 0.4,
    vx: Math.cos(angle) * 0.3,
    vy: Math.sin(angle) * 0.3,
    prevX: 0,
    prevY: 0,
    sensorDist: 20 + Math.random() * 15,
    sensorAngle: 0.4 + Math.random() * 0.3,
    turnSpeed: 0.06 + Math.random() * 0.04,
    size: 0.4 + Math.random() * 0.6,
    color,
    fed: 0,
  });
}

// Vortices for ambient flow
const vortices = [];
for (let i = 0; i < 3; i++) {
  vortices.push({
    x: Math.random() * w, y: Math.random() * h,
    radius: 80 + Math.random() * 100,
    strength: (Math.random() < 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.15),
    driftAngle: Math.random() * Math.PI * 2,
    driftSpeed: 0.04 + Math.random() * 0.06,
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

// Find strongest food signal from a sensor position
function senseFood(sx, sy) {
  let pull = 0;
  for (const f of foods) {
    const dx = f.x - sx;
    const dy = f.y - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < f.radius * 3) {
      pull += f.energy / (1 + dist * 0.02);
    }
  }
  return pull;
}

let lastTime = 0;
let foodTimer = 0;

function draw(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  // Slow fade instead of clear - trails accumulate
  ctx.fillStyle = 'rgba(10, 21, 32, 0.006)';
  ctx.fillRect(0, 0, w, h);

  // Drift vortices
  for (const v of vortices) {
    v.x += Math.cos(v.driftAngle) * v.driftSpeed;
    v.y += Math.sin(v.driftAngle) * v.driftSpeed;
    v.driftAngle += (Math.random() - 0.5) * 0.02;
    if (v.x < -50) v.x = w + 50; if (v.x > w + 50) v.x = -50;
    if (v.y < -50) v.y = h + 50; if (v.y > h + 50) v.y = -50;
    v.strength = (v.strength > 0 ? 1 : -1) * (0.15 + Math.sin(time * 0.0003 + v.phase) * 0.08);
  }

  // Draw food sources as soft glows
  for (const f of foods) {
    if (f.energy > 0.05) {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
      grad.addColorStop(0, `hsla(${f.hue}, 60%, 65%, ${f.energy * 0.3})`);
      grad.addColorStop(0.5, `hsla(${f.hue}, 50%, 50%, ${f.energy * 0.12})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x - f.radius, f.y - f.radius, f.radius * 2, f.radius * 2);
    }
  }

  // Update and draw agents
  for (const a of agents) {
    a.prevX = a.x;
    a.prevY = a.y;

    // Sensor-based steering toward food (slime mold style)
    const leftAngle = a.angle - a.sensorAngle;
    const rightAngle = a.angle + a.sensorAngle;
    const forwardX = a.x + Math.cos(a.angle) * a.sensorDist;
    const forwardY = a.y + Math.sin(a.angle) * a.sensorDist;
    const leftX = a.x + Math.cos(leftAngle) * a.sensorDist;
    const leftY = a.y + Math.sin(leftAngle) * a.sensorDist;
    const rightX = a.x + Math.cos(rightAngle) * a.sensorDist;
    const rightY = a.y + Math.sin(rightAngle) * a.sensorDist;

    const fwd = senseFood(forwardX, forwardY);
    const left = senseFood(leftX, leftY);
    const right = senseFood(rightX, rightY);

    if (fwd >= left && fwd >= right) {
      // keep going
    } else if (left > right) {
      a.angle -= a.turnSpeed;
    } else if (right > left) {
      a.angle += a.turnSpeed;
    }

    // Random wiggle
    a.angle += (Math.random() - 0.5) * 0.15;

    // Ambient flow influence
    const flow = sampleFlow(a.x, a.y);
    a.vx = Math.cos(a.angle) * a.speed + flow.fx * 0.005;
    a.vy = Math.sin(a.angle) * a.speed + flow.fy * 0.005;

    a.x += a.vx;
    a.y += a.vy;

    // Consume food on contact
    for (const f of foods) {
      const dx = f.x - a.x;
      const dy = f.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < f.radius && f.energy > 0) {
        const consume = Math.min(0.002, f.energy);
        f.energy -= consume;
        a.fed = Math.min(1, a.fed + consume * 5);
      }
    }

    a.fed *= 0.998;

    // Wrap edges - track whether we wrapped to skip trail
    let wrapped = false;
    if (a.x < 0) { a.x += w; wrapped = true; }
    if (a.x > w) { a.x -= w; wrapped = true; }
    if (a.y < 0) { a.y += h; wrapped = true; }
    if (a.y > h) { a.y -= h; wrapped = true; }

    // Draw trail
    if (!wrapped) {
      const brightness = a.fed > 0.1 ? a.color.l + 15 : a.color.l;
      const alpha = 0.5 + a.fed * 0.4;
      ctx.beginPath();
      ctx.moveTo(a.prevX, a.prevY);
      ctx.lineTo(a.x, a.y);
      ctx.strokeStyle = `hsla(${a.color.h}, ${a.color.s}%, ${brightness}%, ${alpha})`;
      ctx.lineWidth = a.size + a.fed * 0.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  // Replenish and respawn food
  foodTimer += dt;
  if (foodTimer > 8) {
    foodTimer = 0;
    // Remove depleted food and spawn new
    for (let i = foods.length - 1; i >= 0; i--) {
      if (foods[i].energy < 0.02) foods.splice(i, 1);
    }
    while (foods.length < maxFoods) spawnFood();
  }

  // Slowly recharge existing food
  for (const f of foods) {
    if (f.energy < 0.8) f.energy += 0.0001;
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
</script>
