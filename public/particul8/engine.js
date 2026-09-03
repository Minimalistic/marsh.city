// Particul8 engine. Text and emoji are rasterized into target points; a fixed
// pool of particles springs from one shape to the next. The sim runs in CSS
// pixel space at a fixed 60 Hz step with a seeded RNG, so the same settings
// replay identically - that determinism is what makes offline export possible.

export const DEFAULTS = {
  text: 'Hello 🌿 World',
  font: 'Lora',
  weight: 400,
  granularity: 'word',     // char | word | sentence | all
  hold: 1.2,               // seconds a shape sits before morphing on
  particles: 5000,
  size: 1.4,
  shape: 'circle',         // circle | square
  colorMode: 'sampled',    // sampled | solid | palette
  color: '#8db860',
  palette: ['#8db860', '#e2b04a', '#d9643a', '#5aa7c9'],
  transitColor: '#ffd28a',
  transitBlend: 0.5,       // how strongly the transit color shows mid-flight
  glow: 0.5,
  trails: 0.35,
  scatter: 0,              // jitter around targets
  transition: 'flow',      // flow | radial | nearest | scatter
  flowAngle: 0,            // degrees, flow transition only
  stiffness: 0.7,          // spring strength - "speed" in the UI
  damping: 0.5,            // 0 bouncy, 1 syrupy
  stagger: 0.3,            // how spread out particle release times are
  turbulence: 0.4,         // curl-noise drift while in flight
  wobble: 0.15,            // idle breathing once settled
  background: '#0c150f',   // hex or 'transparent'
  seed: 1,
  autoplay: true,
};

const TAU = Math.PI * 2;
const DT = 1 / 60;
const COLOR_TRANSIT_SECONDS = 1.0;
const SETTLE_SECONDS = 1.2;
const EMOJI_STACK = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';

// mulberry32: tiny seeded PRNG - determinism matters more than quality here.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const GX = [1, -1, 1, -1, 1, -1, 0, 0];
const GY = [1, 1, -1, -1, 0, 0, 1, -1];

// 2D gradient noise with a seeded permutation. Curl of this field drives the
// in-flight drift - divergence-free, so particles swirl instead of clumping.
class Noise {
  constructor(rand) {
    const perm = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    this.p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.p[i] = perm[i & 255];
  }
  at(x, y) {
    const p = this.p;
    const fx = Math.floor(x), fy = Math.floor(y);
    const X = fx & 255, Y = fy & 255;
    x -= fx; y -= fy;
    const u = fade(x), v = fade(y);
    const A = p[X] + Y, B = p[X + 1] + Y;
    const g = (h, dx, dy) => GX[h & 7] * dx + GY[h & 7] * dy;
    return lerp(v,
      lerp(u, g(p[A], x, y), g(p[B], x - 1, y)),
      lerp(u, g(p[A + 1], x, y - 1), g(p[B + 1], x - 1, y - 1)));
  }
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function tokenize(text, granularity) {
  const t = String(text ?? '').trim();
  if (!t) return [''];
  if (granularity === 'all') return [t.replace(/\s+/g, ' ')];
  if (granularity === 'word') return t.split(/\s+/);
  const hasSegmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl;
  if (granularity === 'sentence') {
    if (!hasSegmenter) return t.split(/(?<=[.!?])\s+/);
    const seg = new Intl.Segmenter(undefined, { granularity: 'sentence' });
    return [...seg.segment(t)].map((s) => s.segment.trim()).filter(Boolean);
  }
  // char: grapheme clusters so ZWJ emoji like 👨‍👩‍👧 stay whole
  const parts = hasSegmenter
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(t)].map((s) => s.segment)
    : [...t];
  return parts.filter((c) => !/^\s+$/.test(c));
}

function wrapLines(ctx, words, maxW) {
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function argsort(values) {
  const idx = new Int32Array(values.length);
  for (let i = 0; i < idx.length; i++) idx[i] = i;
  return idx.sort((a, b) => values[a] - values[b]);
}

export class Particul8 {
  constructor(canvas, settings = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.layer = document.createElement('canvas');   // particles only, no trails
    this.lctx = this.layer.getContext('2d');
    this.glowA = document.createElement('canvas');   // 1/4 res downsample = cheap bloom
    this.glowB = document.createElement('canvas');   // 1/8 res for the soft halo
    this.gctxA = this.glowA.getContext('2d');
    this.gctxB = this.glowB.getContext('2d');
    this.raster = document.createElement('canvas');
    this.rctx = this.raster.getContext('2d', { willReadFrequently: true });

    this.settings = { ...DEFAULTS, ...settings };
    this.width = 0; this.height = 0; this.dpr = 1;
    this.ready = false;
    this.frames = [];
    this.frameIndex = -1;
    this.time = 0; this.acc = 0; this.lastNow = null;
    this.transitStart = 0; this.spread = 0; this.holdUntil = Infinity;
    this.playing = this.settings.autoplay;
    this.running = false;
    this.loop = true;
    this.onFrame = null;
    this._curl = [0, 0];

    this.reseed();
    this.allocate();
  }

  reseed() {
    this.rand = mulberry32(this.settings.seed);
    this.noise = new Noise(this.rand);
  }

  allocate(keepExisting = false) {
    const n = Math.max(1, Math.floor(this.settings.particles));
    const old = keepExisting ? { n: this.n, x: this.x, y: this.y, cr: this.cr, cg: this.cg, cb: this.cb } : null;
    this.n = n;
    for (const k of ['x', 'y', 'vx', 'vy', 'tx', 'ty', 'ptx', 'pty', 'delay',
      'cr', 'cg', 'cb', 'sr', 'sg', 'sb', 'tr', 'tg', 'tb', 'phase', 'sz']) {
      this[k] = new Float32Array(n);
    }
    this.paletteIdx = new Uint16Array(n);
    const rand = this.rand;
    const w = this.width || 1, h = this.height || 1;
    for (let i = 0; i < n; i++) {
      const reuse = old && i < old.n;
      this.x[i] = reuse ? old.x[i] : rand() * w;
      this.y[i] = reuse ? old.y[i] : rand() * h;
      this.cr[i] = reuse ? old.cr[i] : 1;
      this.cg[i] = reuse ? old.cg[i] : 1;
      this.cb[i] = reuse ? old.cb[i] : 1;
      this.tx[i] = this.ptx[i] = this.x[i];
      this.ty[i] = this.pty[i] = this.y[i];
      this.phase[i] = rand() * TAU;
      this.sz[i] = 0.7 + rand() * 0.6;
      this.paletteIdx[i] = Math.floor(rand() * 65535);
    }
  }

  resize(w, h, dpr = window.devicePixelRatio || 1) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (w === this.width && h === this.height && dpr === this.dpr) return;
    const sx = this.width ? w / this.width : 1;
    const sy = this.height ? h / this.height : 1;
    this.width = w; this.height = h; this.dpr = dpr;
    for (const [c, ctx] of [[this.canvas, this.ctx], [this.layer, this.lctx]]) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.glowA.width = Math.max(1, w >> 2); this.glowA.height = Math.max(1, h >> 2);
    this.glowB.width = Math.max(1, w >> 3); this.glowB.height = Math.max(1, h >> 3);
    this.raster.width = w; this.raster.height = h;
    if (!this.ready) {
      this.ready = true;
      for (let i = 0; i < this.n; i++) {
        this.x[i] = this.tx[i] = this.ptx[i] = this.rand() * w;
        this.y[i] = this.ty[i] = this.pty[i] = this.rand() * h;
      }
      this.rebuildFrames();
    } else {
      for (let i = 0; i < this.n; i++) {
        this.x[i] *= sx; this.tx[i] *= sx; this.ptx[i] *= sx;
        this.y[i] *= sy; this.ty[i] *= sy; this.pty[i] *= sy;
      }
    }
    this.clear();
  }

  clear() {
    const { ctx, width: w, height: h } = this;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    if (this.settings.background !== 'transparent') {
      ctx.fillStyle = this.settings.background;
      ctx.fillRect(0, 0, w, h);
    }
  }

  setSettings(patch) {
    const prev = this.settings;
    const s = this.settings = { ...prev, ...patch };
    const changed = (k) => JSON.stringify(prev[k]) !== JSON.stringify(s[k]);
    if (changed('seed')) this.reseed();
    if (changed('particles')) this.allocate(true);
    if (!this.ready) return;
    if (changed('text') || changed('granularity')) { this.rebuildFrames(); return; }
    const retargetKeys = ['font', 'weight', 'color', 'colorMode', 'palette', 'scatter',
      'transition', 'flowAngle', 'particles', 'seed', 'stagger'];
    if (retargetKeys.some(changed)) this.retarget(Math.max(0, this.frameIndex));
    if (changed('background')) this.clear();
  }

  // Re-rasterize the current frame in place - used after a web font finishes loading.
  refresh() { if (this.ready && this.frameIndex >= 0) this.retarget(this.frameIndex); }

  rebuildFrames() {
    this.frames = tokenize(this.settings.text, this.settings.granularity);
    this.retarget(0);
  }

  // Draw one frame's text to the raster canvas and return lit points as a flat
  // [x, y, r, g, b, ...] array, sampled at a stride that lands near the pool size.
  rasterize(text) {
    const { width: w, height: h, rctx: ctx } = this;
    const s = this.settings;
    ctx.clearRect(0, 0, w, h);
    if (!text) return { pts: [], stride: 1 };
    const maxW = w * 0.86, maxH = h * 0.72;
    const fontFor = (px) => `${s.weight} ${px}px "${s.font}", ${EMOJI_STACK}, sans-serif`;
    const words = text.split(/\s+/);
    let size = Math.min(maxH, w * 0.5);
    let lines = [text];
    for (let iter = 0; iter < 40; iter++) {
      ctx.font = fontFor(size);
      lines = wrapLines(ctx, words, maxW);
      const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (lines.length * size * 1.15 <= maxH && widest <= maxW) break;
      size *= 0.88;
      if (size < 10) break;
    }
    ctx.font = fontFor(size);
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lineH = size * 1.15;
    const y0 = h / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((l, i) => ctx.fillText(l, w / 2, y0 + i * lineH));

    const img = ctx.getImageData(0, 0, w, h).data;
    let lit = 0;
    for (let i = 3; i < img.length; i += 4) if (img[i] > 90) lit++;
    if (!lit) return { pts: [], stride: 1 };
    const stride = Math.max(1, Math.floor(Math.sqrt(lit / this.n)));
    const pts = [];
    for (let y = 0; y < h; y += stride) {
      for (let x = 0; x < w; x += stride) {
        const k = (y * w + x) * 4;
        if (img[k + 3] > 90) pts.push(x, y, img[k] / 255, img[k + 1] / 255, img[k + 2] / 255);
      }
    }
    return { pts, stride };
  }

  // Build exactly n targets from the raster, pair them to particles by the
  // chosen transition, and start the clock on the morph.
  retarget(index) {
    if (!this.ready || !this.frames.length) return;
    const s = this.settings;
    const n = this.n, rand = this.rand;
    const w = this.width, h = this.height;
    this.frameIndex = index;
    const { pts, stride } = this.rasterize(this.frames[index]);
    const m = pts.length / 5;

    const T = new Float32Array(n * 5);
    const solid = hexToRgb(s.color);
    const pal = (s.palette && s.palette.length ? s.palette : [s.color]).map(hexToRgb);
    const jitter = m < n ? 1.2 : stride * 0.5;
    const scatter = s.scatter * 60;
    for (let i = 0; i < n; i++) {
      const o = i * 5;
      if (m === 0) {
        // Empty frame: drift into a loose cloud rather than collapsing to a point.
        T[o] = rand() * w; T[o + 1] = rand() * h;
        T[o + 2] = solid[0] * 0.4; T[o + 3] = solid[1] * 0.4; T[o + 4] = solid[2] * 0.4;
        continue;
      }
      const j = (m >= n ? Math.floor((i * m) / n) : i % m) * 5;
      T[o] = pts[j] + (rand() - 0.5) * 2 * jitter + (rand() - 0.5) * scatter;
      T[o + 1] = pts[j + 1] + (rand() - 0.5) * 2 * jitter + (rand() - 0.5) * scatter;
      let c;
      if (s.colorMode === 'solid') c = solid;
      else if (s.colorMode === 'palette') c = pal[this.paletteIdx[i] % pal.length];
      else c = [pts[j + 2], pts[j + 3], pts[j + 4]];
      T[o + 2] = c[0]; T[o + 3] = c[1]; T[o + 4] = c[2];
    }

    const spread = s.stagger * 2.0;
    this.spread = spread;
    this.transitStart = this.time;
    const order = new Int32Array(n);
    const delay = this.delay;
    const type = s.transition;

    if (type === 'flow' || type === 'radial') {
      const projP = new Float32Array(n), projT = new Float32Array(n);
      const cx = w / 2, cy = h / 2;
      const a = (s.flowAngle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
      for (let i = 0; i < n; i++) {
        const noiseP = (rand() - 0.5) * 12, noiseT = (rand() - 0.5) * 12;
        if (type === 'radial') {
          projP[i] = Math.hypot(this.x[i] - cx, this.y[i] - cy) + noiseP;
          projT[i] = Math.hypot(T[i * 5] - cx, T[i * 5 + 1] - cy) + noiseT;
        } else {
          projP[i] = this.x[i] * ca + this.y[i] * sa + noiseP;
          projT[i] = T[i * 5] * ca + T[i * 5 + 1] * sa + noiseT;
        }
      }
      const sp = argsort(projP), st = argsort(projT);
      for (let r = 0; r < n; r++) {
        order[sp[r]] = st[r];
        delay[sp[r]] = (r / n) * spread;
      }
    } else if (type === 'nearest') {
      this.pairNearest(T, order);
      for (let i = 0; i < n; i++) delay[i] = rand() * spread;
    } else {
      // scatter: random pairing plus an outward burst before converging
      for (let i = 0; i < n; i++) order[i] = i;
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const t = order[i]; order[i] = order[j]; order[j] = t;
      }
      let mx = 0, my = 0;
      for (let i = 0; i < n; i++) { mx += this.x[i]; my += this.y[i]; }
      mx /= n; my /= n;
      for (let i = 0; i < n; i++) {
        delay[i] = rand() * spread * 0.3;
        const dx = this.x[i] - mx, dy = this.y[i] - my;
        const d = Math.hypot(dx, dy) || 1;
        const kick = 250 + rand() * 450;
        this.vx[i] += (dx / d) * kick + (rand() - 0.5) * 200;
        this.vy[i] += (dy / d) * kick + (rand() - 0.5) * 200;
      }
    }

    for (let i = 0; i < n; i++) {
      const k = order[i] * 5;
      this.ptx[i] = this.tx[i]; this.pty[i] = this.ty[i];
      this.tx[i] = T[k]; this.ty[i] = T[k + 1];
      this.sr[i] = this.cr[i]; this.sg[i] = this.cg[i]; this.sb[i] = this.cb[i];
      this.tr[i] = T[k + 2]; this.tg[i] = T[k + 3]; this.tb[i] = T[k + 4];
    }
    this.holdUntil = this.time + spread + SETTLE_SECONDS + s.hold;
    if (this.onFrame) this.onFrame(index, this.frames);
  }

  // Greedy nearest-unclaimed pairing through a spatial hash. Not optimal
  // (that's the Hungarian algorithm), but O(n) and it looks like melting.
  pairNearest(T, order) {
    const n = this.n, cell = 24;
    const cols = Math.ceil(this.width / cell) + 1, rows = Math.ceil(this.height / cell) + 1;
    const grid = new Array(cols * rows);
    for (let k = 0; k < n; k++) {
      const gx = Math.min(cols - 1, Math.max(0, (T[k * 5] / cell) | 0));
      const gy = Math.min(rows - 1, Math.max(0, (T[k * 5 + 1] / cell) | 0));
      const c = gy * cols + gx;
      (grid[c] || (grid[c] = [])).push(k);
    }
    const visit = new Int32Array(n);
    for (let i = 0; i < n; i++) visit[i] = i;
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(this.rand() * (i + 1));
      const t = visit[i]; visit[i] = visit[j]; visit[j] = t;
    }
    const leftovers = [];
    for (let v = 0; v < n; v++) {
      const i = visit[v];
      const px = this.x[i], py = this.y[i];
      const gx = Math.min(cols - 1, Math.max(0, (px / cell) | 0));
      const gy = Math.min(rows - 1, Math.max(0, (py / cell) | 0));
      let best = -1, bestD = Infinity, bestCell = null, bestSlot = -1;
      for (let r = 0; r < 40 && best < 0; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const cx = gx + dx, cy = gy + dy;
            if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
            const bucket = grid[cy * cols + cx];
            if (!bucket || !bucket.length) continue;
            for (let b = 0; b < bucket.length; b++) {
              const k = bucket[b];
              const d = (T[k * 5] - px) ** 2 + (T[k * 5 + 1] - py) ** 2;
              if (d < bestD) { bestD = d; best = k; bestCell = bucket; bestSlot = b; }
            }
          }
        }
      }
      if (best >= 0) {
        bestCell[bestSlot] = bestCell[bestCell.length - 1];
        bestCell.pop();
        order[i] = best;
      } else {
        leftovers.push(i);
      }
    }
    if (leftovers.length) {
      const unclaimed = [];
      for (const bucket of grid) if (bucket) unclaimed.push(...bucket);
      leftovers.forEach((i, idx) => { order[i] = unclaimed[idx] ?? 0; });
    }
  }

  curl(x, y, t) {
    const n = this.noise, e = 0.02;
    const sx = x + t * 0.15, sy = y - t * 0.1;
    const dndx = (n.at(sx + e, sy) - n.at(sx - e, sy)) / (2 * e);
    const dndy = (n.at(sx, sy + e) - n.at(sx, sy - e)) / (2 * e);
    this._curl[0] = dndy; this._curl[1] = -dndx;
    return this._curl;
  }

  step(dt) {
    const s = this.settings;
    const t = this.time;
    const k = 30 + s.stiffness * s.stiffness * 700;
    const c = (0.15 + s.damping * 1.6) * 2 * Math.sqrt(k);
    const turb = s.turbulence * 50 * Math.sqrt(k);
    const wob = s.wobble * 4;
    const nscale = 0.004;
    const et = t - this.transitStart;
    const trans = hexToRgb(s.transitColor);
    const blend = s.transitBlend;
    const { x, y, vx, vy, tx, ty, ptx, pty, delay, cr, cg, cb, sr, sg, sb, tr, tg, tb, phase } = this;

    for (let i = 0; i < this.n; i++) {
      const released = et >= delay[i];
      let gx = released ? tx[i] : ptx[i];
      let gy = released ? ty[i] : pty[i];
      if (wob > 0) {
        gx += wob * Math.sin(t * 1.3 + phase[i]);
        gy += wob * Math.cos(t * 1.7 + phase[i] * 1.3);
      }
      const dx = gx - x[i], dy = gy - y[i];
      let ax = dx * k, ay = dy * k;
      if (turb > 0) {
        const dist = Math.hypot(dx, dy);
        if (dist > 2) {
          const f = Math.min(1, dist / 80);
          const cv = this.curl(x[i] * nscale, y[i] * nscale, t);
          ax += cv[0] * turb * f; ay += cv[1] * turb * f;
        }
      }
      // implicit damping keeps the spring stable at any damping value
      vx[i] = (vx[i] + ax * dt) / (1 + c * dt);
      vy[i] = (vy[i] + ay * dt) / (1 + c * dt);
      x[i] += vx[i] * dt;
      y[i] += vy[i] * dt;

      const p = released ? clamp01((et - delay[i]) / COLOR_TRANSIT_SECONDS) : 0;
      const mix = Math.sin(p * Math.PI) * blend;
      cr[i] = lerp(lerp(sr[i], tr[i], p), trans[0], mix);
      cg[i] = lerp(lerp(sg[i], tg[i], p), trans[1], mix);
      cb[i] = lerp(lerp(sb[i], tb[i], p), trans[2], mix);
    }
    this.time += dt;
  }

  render() {
    if (!this.ready) return;
    const s = this.settings;
    const { ctx, lctx: l, width: w, height: h } = this;

    // particles to the layer, batched into one Path2D per quantized color
    l.clearRect(0, 0, w, h);
    const buckets = new Map();
    const base = s.size, circle = s.shape === 'circle';
    const { x, y, cr, cg, cb, sz } = this;
    for (let i = 0; i < this.n; i++) {
      const key = ((cr[i] * 31 + 0.5 | 0) << 10) | ((cg[i] * 31 + 0.5 | 0) << 5) | (cb[i] * 31 + 0.5 | 0);
      let p = buckets.get(key);
      if (!p) { p = new Path2D(); buckets.set(key, p); }
      const r = base * sz[i];
      if (circle) { p.moveTo(x[i] + r, y[i]); p.arc(x[i], y[i], r, 0, TAU); }
      else p.rect(x[i] - r, y[i] - r, r * 2, r * 2);
    }
    for (const [key, p] of buckets) {
      const r = (((key >> 10) & 31) * 255) / 31, g = (((key >> 5) & 31) * 255) / 31, b = ((key & 31) * 255) / 31;
      l.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      l.fill(p);
    }

    // trails: fade the previous frame instead of clearing it
    const fadeAlpha = 1 - s.trails * 0.95;
    ctx.globalAlpha = 1;
    if (s.background === 'transparent') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      const [r, g, b] = hexToRgb(s.background);
      ctx.fillStyle = `rgba(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0},${fadeAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    if (s.glow > 0) {
      const { glowA, glowB, gctxA, gctxB } = this;
      gctxA.clearRect(0, 0, glowA.width, glowA.height);
      gctxA.drawImage(this.layer, 0, 0, glowA.width, glowA.height);
      gctxB.clearRect(0, 0, glowB.width, glowB.height);
      gctxB.drawImage(glowA, 0, 0, glowB.width, glowB.height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = s.glow * 0.9;
      ctx.drawImage(glowA, 0, 0, w, h);
      ctx.globalAlpha = s.glow * 0.7;
      ctx.drawImage(glowB, 0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(this.layer, 0, 0, w, h);
  }

  tick = (now) => {
    if (!this.running) return;
    this._raf = requestAnimationFrame(this.tick);
    const elapsed = this.lastNow == null ? DT : Math.min(0.1, (now - this.lastNow) / 1000);
    this.lastNow = now;
    if (this.playing) {
      this.acc += elapsed;
      while (this.acc >= DT) {
        this.step(DT);
        this.acc -= DT;
        if (this.loop && this.frames.length > 1 && this.time >= this.holdUntil) {
          this.retarget((this.frameIndex + 1) % this.frames.length);
        }
      }
    }
    this.render();
  };

  start() {
    if (this.running) return;
    this.running = true; this.lastNow = null;
    this._raf = requestAnimationFrame(this.tick);
  }
  stop() {
    this.running = false;
    // cancel the pending frame so a quick stop/start can't leave two loops running
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }
  play() { this.playing = true; }
  pause() { this.playing = false; }
  next() { if (this.frames.length) this.retarget((this.frameIndex + 1) % this.frames.length); }
  prev() { if (this.frames.length) this.retarget((this.frameIndex - 1 + this.frames.length) % this.frames.length); }
}
