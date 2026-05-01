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

// Mouse tracking with velocity
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
  const dx = mouse.x - mouse.prevX;
  const dy = mouse.y - mouse.prevY;
  mouse.speed = Math.sqrt(dx * dx + dy * dy);

  // Dragging with mouse down creates continuous ripples
  if (mouse.down && mouse.speed > 1) {
    ripples.push({ x: mouse.x, y: mouse.y, radius: 5, maxRadius: 40 + mouse.speed * 2, opacity: 0.3, age: 0 });
  }
});
canvas.addEventListener('mouseleave', () => { mouse.active = false; mouse.down = false; mouse.x = -1000; mouse.y = -1000; mouse.speed = 0; });
canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  mouse.down = true;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  // Tap creates a strong ripple
  ripples.push({ x: mx, y: my, radius: 3, maxRadius: 100, opacity: 0.5, age: 0 });
  // Push nearby particles outward from tap
  for (const f of food) {
    const dx = f.x - mx;
    const dy = f.y - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 100 && dist > 0.1) {
      const force = 2 * (1 - dist / 100);
      f.vx += (dx / dist) * force;
      f.vy += (dy / dist) * force;
    }
  }
  for (const d of debris) {
    const dx = d.x - mx;
    const dy = d.y - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 100 && dist > 0.1) {
      const force = 1.5 * (1 - dist / 100);
      d.vx += (dx / dist) * force;
      d.vy += (dy / dist) * force;
    }
  }
});
canvas.addEventListener('mouseup', () => { mouse.down = false; });

// Touch support - taps create ripples, no persistent hover
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  mouse.x = touch.clientX - rect.left;
  mouse.y = touch.clientY - rect.top;
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.active = true;
  mouse.down = true;
  mouse.speed = 0;
  ripples.push({ x: mouse.x, y: mouse.y, radius: 3, maxRadius: 80, opacity: 0.4, age: 0 });
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.x = touch.clientX - rect.left;
  mouse.y = touch.clientY - rect.top;
  const dx = mouse.x - mouse.prevX;
  const dy = mouse.y - mouse.prevY;
  mouse.speed = Math.sqrt(dx * dx + dy * dy);
  if (mouse.speed > 1) {
    ripples.push({ x: mouse.x, y: mouse.y, radius: 5, maxRadius: 40 + mouse.speed * 2, opacity: 0.3, age: 0 });
  }
}, { passive: false });
canvas.addEventListener('touchend', () => { mouse.active = false; mouse.down = false; mouse.x = -1000; mouse.y = -1000; mouse.speed = 0; });

// Ripple system - expanding rings from taps and drags
const ripples = [];

// Food particles - algae bits drifting in the water
const food = [];
function spawnFood() {
  if (food.length < 40) {
    food.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 1.5 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      drift: (Math.random() - 0.5) * 0.15,
      life: 1,
    });
  }
}

// Dirt/debris particles - tiny bits that float and get pushed around
const debris = [];
for (let i = 0; i < 500; i++) {
  debris.push({
    x: Math.random() * w,
    y: Math.random() * h,
    size: 0.2 + Math.random() * 0.8,
    vx: 0,
    vy: 0,
    opacity: 0.04 + Math.random() * 0.14,
    drift: (Math.random() - 0.5) * 0.02,
  });
}

// Tadpole class
class Tadpole {
  constructor() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 0;
    this.flitSpeed = 2.5 + Math.random() * 1.5;
    this.targetAngle = this.angle;

    // Body segments
    const scale = w < 500 ? 0.75 : 1;
    this.segments = [];
    this.segCount = 12;
    this.segLen = (5 + Math.random() * 2) * scale;
    for (let i = 0; i < this.segCount; i++) {
      this.segments.push({ x: this.x - Math.cos(this.angle) * i * this.segLen,
                           y: this.y - Math.sin(this.angle) * i * this.segLen });
    }

    // Size
    this.headSize = (7 + Math.random() * 4) * scale;
    this.bodyWidth = this.headSize * 1.1;

    // Personality - each tadpole has different tendencies
    this.restlessness = Math.random(); // 0 = sedentary, 1 = hyperactive
    this.grazeChance = 0.1 + Math.random() * 0.4; // likelihood to scrape/graze
    this.idleMin = 1 + (1 - this.restlessness) * 6; // calm ones sit much longer
    this.idleMax = this.idleMin + 3 + (1 - this.restlessness) * 8;

    // Needs
    this.hunger = Math.random() * 0.4;
    this.energy = 0.6 + Math.random() * 0.4;

    // State machine
    // idle: sitting still
    // flit: short burst of movement
    // seek_food: heading toward food
    // eat: consuming food particle
    // graze: scraping algae off something (nibbling in place)
    // drift: slow lazy glide, barely moving
    // flee: startled escape
    this.state = Math.random() < 0.3 ? 'graze' : 'idle';
    this.stateTimer = 1 + Math.random() * 4;
    this.target = null;
    this.grazeAngle = 0; // head wobble while grazing
    this.grazeDir = 1;

    // Wiggle
    this.wigglePhase = Math.random() * Math.PI * 2;
    this.wiggleSpeed = 0;
    this.wiggleAmp = 0;

    // Some tadpoles are further along in metamorphosis - tiny back legs
    this.hasLegs = Math.random() < 0.35;
    this.legLen = this.headSize * (0.8 + Math.random() * 0.4);
    this.legPhase = Math.random() * Math.PI * 2;

    // Color variation
    const shade = Math.floor(15 + Math.random() * 25);
    this.color = `rgb(${shade}, ${shade + 8}, ${shade})`;
    this.bellyColor = `rgb(${shade + 40}, ${shade + 45}, ${shade + 25})`;
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

  pickNextState() {
    // Hungry? go find food
    if (this.hunger > 0.5) {
      const f = this.findFood();
      if (f) {
        this.target = f;
        return 'seek_food';
      }
    }

    const roll = Math.random();

    // Personality-weighted state selection
    if (roll < this.grazeChance) {
      // Start grazing - nibbling at a surface
      this.grazeDir = Math.random() < 0.5 ? 1 : -1;
      this.stateTimer = 3 + Math.random() * 6;
      return 'graze';
    }
    if (roll < this.grazeChance + 0.15 && this.restlessness < 0.5) {
      // Lazy drift - very slow glide
      this.targetAngle = this.angle + (Math.random() - 0.5) * 1.0;
      this.speed = 0.2 + Math.random() * 0.3;
      this.wiggleSpeed = 3;
      this.wiggleAmp = 0.1;
      this.stateTimer = 2 + Math.random() * 4;
      return 'drift';
    }

    // Flit to a new spot
    this.targetAngle = this.angle + (Math.random() - 0.5) * 2.5;
    this.speed = this.flitSpeed * (0.6 + Math.random() * 0.4);
    this.wiggleSpeed = 14 + Math.random() * 6;
    this.wiggleAmp = 0.4 + Math.random() * 0.2;
    this.stateTimer = 0.15 + Math.random() * 0.35;
    return 'flit';
  }

  update(dt) {
    this.stateTimer -= dt;
    this.hunger += dt * 0.006;
    this.energy = Math.max(0, Math.min(1, this.energy + dt * 0.003));

    // Check mouse proximity for flee - slow sneaky movement doesn't startle
    const mdx = mouse.x - this.x;
    const mdy = mouse.y - this.y;
    const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy);
    // Fast cursor movement startles from further away, slow movement needs to be very close
    const fleeRadius = mouse.down ? 120 : 20 + mouse.speed * 8;
    if (mouse.active && mouseDist < fleeRadius && mouse.speed > 2) {
      this.state = 'flee';
      this.stateTimer = 0.3 + Math.random() * 0.3;
      this.targetAngle = Math.atan2(-mdy, -mdx) + (Math.random() - 0.5) * 0.6;
      this.speed = this.flitSpeed * 2;
      this.wiggleSpeed = 25;
      this.wiggleAmp = 0.6;
    }
    // Ripples also startle - check expanding ripples
    for (const r of ripples) {
      const rdx = r.x - this.x;
      const rdy = r.y - this.y;
      const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
      // Startle when the ripple wavefront passes through the tadpole
      if (Math.abs(rDist - r.radius) < 15 && r.opacity > 0.15 && this.state !== 'flee') {
        this.state = 'flee';
        this.stateTimer = 0.3 + Math.random() * 0.4;
        this.targetAngle = Math.atan2(-rdy, -rdx) + (Math.random() - 0.5) * 0.8;
        this.speed = this.flitSpeed * 1.8;
        this.wiggleSpeed = 22;
        this.wiggleAmp = 0.5;
      }
    }

    switch (this.state) {
      case 'idle':
        this.speed *= 0.88;
        this.wiggleSpeed *= 0.92;
        this.wiggleAmp *= 0.92;
        if (this.speed < 0.05) this.speed = 0;

        if (this.stateTimer <= 0) {
          this.state = this.pickNextState();
        }
        break;

      case 'flit':
        this.speed *= 0.96;
        if (this.stateTimer <= 0 || this.speed < 0.3) {
          this.state = 'idle';
          this.stateTimer = this.idleMin + Math.random() * (this.idleMax - this.idleMin);
        }
        break;

      case 'drift':
        // Very slow glide, barely any tail movement
        this.speed *= 0.995;
        if (this.speed < 0.1) this.speed = 0.15;
        this.wiggleAmp = 0.08;
        this.wiggleSpeed = 2;
        if (this.stateTimer <= 0) {
          this.state = 'idle';
          this.stateTimer = this.idleMin + Math.random() * (this.idleMax - this.idleMin);
        }
        break;

      case 'graze':
        // Scraping algae - mostly stationary with small head wobbles
        this.speed *= 0.85;
        if (this.speed < 0.05) this.speed = 0;

        // Head wobbles side to side like nibbling
        this.grazeAngle += dt * 3 * this.grazeDir;
        if (Math.abs(this.grazeAngle) > 0.15) this.grazeDir *= -1;
        this.targetAngle = this.angle + this.grazeAngle * 0.3;

        // Tiny tail twitches while grazing
        this.wiggleSpeed = 4;
        this.wiggleAmp = 0.08 + Math.sin(this.grazeAngle * 10) * 0.05;

        // Occasionally shuffle position slightly
        if (Math.random() < 0.005) {
          this.speed = 0.3;
          this.targetAngle = this.angle + (Math.random() - 0.5) * 0.5;
        }

        if (this.stateTimer <= 0) {
          this.hunger = Math.max(0, this.hunger - 0.15);
          this.state = 'idle';
          this.stateTimer = this.idleMin + Math.random() * (this.idleMax - this.idleMin);
        }
        break;

      case 'seek_food':
        if (!this.target || food.indexOf(this.target) === -1) {
          this.state = 'idle';
          this.stateTimer = 1 + Math.random() * 2;
          break;
        }
        const fdx = this.target.x - this.x;
        const fdy = this.target.y - this.y;
        const fdist = Math.sqrt(fdx * fdx + fdy * fdy);
        this.targetAngle = Math.atan2(fdy, fdx);

        if (this.speed < 0.5) {
          this.speed = this.flitSpeed * 0.8;
          this.wiggleSpeed = 12;
          this.wiggleAmp = 0.35;
        }
        this.speed *= 0.97;

        if (fdist < 10) {
          this.state = 'eat';
          this.stateTimer = 0.5;
          this.speed = 0;
        }
        break;

      case 'eat':
        this.speed *= 0.85;
        this.wiggleSpeed *= 0.9;
        this.wiggleAmp *= 0.9;
        if (this.target && food.indexOf(this.target) !== -1) {
          food.splice(food.indexOf(this.target), 1);
          this.hunger = Math.max(0, this.hunger - 0.3);
          this.energy = Math.min(1, this.energy + 0.1);
        }
        if (this.stateTimer <= 0) {
          this.state = 'idle';
          this.stateTimer = 2 + Math.random() * 3;
        }
        break;

      case 'flee':
        this.speed *= 0.94;
        if (this.stateTimer <= 0) {
          this.state = 'idle';
          this.stateTimer = 2 + Math.random() * 3;
        }
        break;
    }

    // Wiggle phase only advances when moving
    if (this.speed > 0.1) {
      this.wigglePhase += dt * this.wiggleSpeed;
    }

    // Smooth turning - faster when actively moving
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    const turnSpeed = this.speed > 0.5 ? 0.12 : 0.03;
    this.angle += angleDiff * turnSpeed;

    // Move head
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    // Boundary avoidance - hard clamp + strong turn near edges
    const margin = 30;
    const hardMargin = 5;
    let boundaryUrgency = 0;
    if (this.x < margin) { this.targetAngle = 0; boundaryUrgency = 1 - this.x / margin; }
    if (this.x > w - margin) { this.targetAngle = Math.PI; boundaryUrgency = 1 - (w - this.x) / margin; }
    if (this.y < margin) { this.targetAngle = Math.PI / 2; boundaryUrgency = 1 - this.y / margin; }
    if (this.y > h - margin) { this.targetAngle = -Math.PI / 2; boundaryUrgency = 1 - (h - this.y) / margin; }
    // Force fast turning when near boundary
    if (boundaryUrgency > 0) {
      let angleDiff2 = this.targetAngle - this.angle;
      while (angleDiff2 > Math.PI) angleDiff2 -= Math.PI * 2;
      while (angleDiff2 < -Math.PI) angleDiff2 += Math.PI * 2;
      this.angle += angleDiff2 * (0.15 + boundaryUrgency * 0.35);
    }
    // Hard clamp - never leave the canvas
    this.x = Math.max(hardMargin, Math.min(w - hardMargin, this.x));
    this.y = Math.max(hardMargin, Math.min(h - hardMargin, this.y));

    // Update body segments - follow the leader with wiggle
    // Front segments (body) are stiff, flex only in the tail
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
      // Stiffness: front 40% of body barely flexes, tail gets all the wiggle
      const t = i / (this.segCount - 1);
      const flex = t < 0.4 ? t * 0.1 : Math.pow((t - 0.4) / 0.6, 1.5);
      const wiggle = Math.sin(this.wigglePhase - i * 0.7) * this.wiggleAmp * flex;
      const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
      seg.x += Math.cos(perpAngle) * wiggle * Math.min(this.speed, 3) * 2;
      seg.y += Math.sin(perpAngle) * wiggle * Math.min(this.speed, 3) * 2;
    }
  }

  draw(ctx) {
    const segs = this.segments;

    // Draw tail as a thin tapered line that just ends - no fish fin
    // The body tapering handles it naturally via the segment widths

    // Draw body as tapered shape through segments
    // Tadpole shape: big round front, long thin tail that tapers to nothing
    ctx.beginPath();
    // Build outline going down one side and back up the other
    const points = [];
    const pointsR = [];
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const next = segs[Math.min(i + 1, segs.length - 1)];
      const angle = Math.atan2(next.y - seg.y, next.x - seg.x);

      // Tadpole profile: bulbous front third, then long linear taper
      const t = i / (segs.length - 1);
      let width;
      if (t < 0.15) {
        // Head region - swells to full width
        width = this.bodyWidth * (0.8 + t * 1.3);
      } else if (t < 0.3) {
        // Body - stays wide
        width = this.bodyWidth * 1.0;
      } else {
        // Tail - long smooth taper to a point
        const tailT = (t - 0.3) / 0.7;
        width = this.bodyWidth * (1.0 - tailT) * 0.6;
      }
      width = Math.max(width, 0.3);

      const perpL = angle + Math.PI / 2;
      const perpR = angle - Math.PI / 2;
      points.push({ x: seg.x + Math.cos(perpL) * width, y: seg.y + Math.sin(perpL) * width });
      pointsR.unshift({ x: seg.x + Math.cos(perpR) * width, y: seg.y + Math.sin(perpR) * width });
    }

    // Draw smooth outline
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    // Tail tip
    const lastSeg = segs[segs.length - 1];
    ctx.lineTo(lastSeg.x, lastSeg.y);
    // Back up the other side
    for (let i = 0; i < pointsR.length; i++) {
      ctx.lineTo(pointsR[i].x, pointsR[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();

    // Back legs - frog-style, pointing backward with sharp knee bend
    if (this.hasLegs) {
      const legSeg = segs[3];
      const legNext = segs[4];
      const bodyDir = Math.atan2(legNext.y - legSeg.y, legNext.x - legSeg.x);
      // Kick: knee opens and closes
      const kick = this.speed > 0.3 ? Math.sin(this.wigglePhase * 0.8 + this.legPhase) * 0.6 : 0;
      for (const side of [-1, 1]) {
        // Hip attaches at sides of body
        const hipAngle = bodyDir + Math.PI / 2 * side;
        const hipX = legSeg.x + Math.cos(hipAngle) * this.bodyWidth * 0.5;
        const hipY = legSeg.y + Math.sin(hipAngle) * this.bodyWidth * 0.5;
        // Thigh goes backward and outward
        const thighAngle = bodyDir + Math.PI * 0.8 * side + kick * 0.3 * side;
        const kneeX = hipX + Math.cos(thighAngle) * this.legLen * 0.5;
        const kneeY = hipY + Math.sin(thighAngle) * this.legLen * 0.5;
        // Shin bends sharply back from knee (frog Z-shape)
        const shinAngle = thighAngle - Math.PI * (0.6 + kick * 0.4) * side;
        const footX = kneeX + Math.cos(shinAngle) * this.legLen * 0.5;
        const footY = kneeY + Math.sin(shinAngle) * this.legLen * 0.5;
        // Draw as two segments with visible knee joint
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.strokeStyle = this.bellyColor;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }


    // Head (big round blob - the defining tadpole feature)
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.headSize, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // Eyes - positioned based on body direction, not steering angle
    const bodyAngle = Math.atan2(segs[0].y - segs[1].y, segs[0].x - segs[1].x);
    const eyeOffset = this.headSize * 0.45;
    const eyeSize = this.headSize * 0.18;
    const eyeAngleL = bodyAngle + 0.7;
    const eyeAngleR = bodyAngle - 0.7;
    for (const ea of [eyeAngleL, eyeAngleR]) {
      const ex = this.x + Math.cos(ea) * eyeOffset;
      const ey = this.y + Math.sin(ea) * eyeOffset;
      // White of eye
      ctx.beginPath();
      ctx.arc(ex, ey, eyeSize + 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 200, 180, 0.4)';
      ctx.fill();
      // Pupil
      ctx.beginPath();
      ctx.arc(ex, ey, eyeSize, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
    }
  }
}

// Create tadpoles
const tadpoles = [];
const count = Math.max(8, Math.floor((w * h) / 18000));
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

  // Displace particles near moving tadpole segments
  for (const t of tadpoles) {
    if (t.speed < 0.3) continue; // only disturb when actually moving
    for (const seg of t.segments) {
      const pushRadius = t.headSize * 1.8;
      const pushStrength = t.speed * 0.15;
      // Push food
      for (const f of food) {
        const dx = f.x - seg.x;
        const dy = f.y - seg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < pushRadius && dist > 0.1) {
          const force = pushStrength * (1 - dist / pushRadius);
          f.vx += (dx / dist) * force;
          f.vy += (dy / dist) * force;
        }
      }
      // Push debris
      for (const d of debris) {
        const dx = d.x - seg.x;
        const dy = d.y - seg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < pushRadius && dist > 0.1) {
          const force = pushStrength * (1 - dist / pushRadius);
          d.vx += (dx / dist) * force;
          d.vy += (dy / dist) * force;
        }
      }
    }
  }

  // Update and draw food
  for (const f of food) {
    f.vx += f.drift * dt;
    f.vy += Math.sin(time * 0.002 + f.x) * 0.003;
    f.vx *= 0.97; // water drag
    f.vy *= 0.97;
    f.x += f.vx;
    f.y += f.vy;
    // Wrap edges
    if (f.x < 0) f.x = w;
    if (f.x > w) f.x = 0;
    if (f.y < 0) f.y = h;
    if (f.y > h) f.y = 0;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80, 140, 50, ${0.4 + Math.sin(time * 0.003 + f.x) * 0.15})`;
    ctx.fill();
  }

  // Update and draw debris
  for (const d of debris) {
    d.vx += d.drift * dt;
    d.vy += Math.sin(time * 0.0015 + d.x * 0.1) * 0.002;
    d.vx *= 0.98; // lighter drag - they float more
    d.vy *= 0.98;
    d.x += d.vx;
    d.y += d.vy;
    if (d.x < 0) d.x = w;
    if (d.x > w) d.x = 0;
    if (d.y < 0) d.y = h;
    if (d.y > h) d.y = 0;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120, 110, 80, ${d.opacity})`;
    ctx.fill();
  }

  // Spawn food periodically
  foodTimer += dt;
  if (foodTimer > 0.8) {
    foodTimer = 0;
    spawnFood();
  }

  // Update and draw ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.age += dt;
    r.radius += dt * 80; // expansion speed
    r.opacity = Math.max(0, r.opacity * (1 - dt * 1.5));

    // Push particles as wavefront passes
    if (r.opacity > 0.05) {
      for (const f of food) {
        const dx = f.x - r.x;
        const dy = f.y - r.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(dist - r.radius) < 10 && dist > 0.1) {
          const force = r.opacity * 0.4;
          f.vx += (dx / dist) * force;
          f.vy += (dy / dist) * force;
        }
      }
      for (const d of debris) {
        const dx = d.x - r.x;
        const dy = d.y - r.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(dist - r.radius) < 10 && dist > 0.1) {
          const force = r.opacity * 0.3;
          d.vx += (dx / dist) * force;
          d.vy += (dy / dist) * force;
        }
      }
    }

    // Draw ripple ring
    if (r.opacity > 0.01 && r.radius < r.maxRadius) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200, 220, 200, ${r.opacity})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Second ring slightly behind
      if (r.radius > 15) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 220, 200, ${r.opacity * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Remove dead ripples
    if (r.radius >= r.maxRadius || r.opacity < 0.01) {
      ripples.splice(i, 1);
    }
  }

  // Subtle cursor glow when hovering (no startle)
  if (mouse.active && !mouse.down) {
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200, 220, 200, 0.06)';
    ctx.fill();
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
