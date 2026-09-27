// Composes the footer parallax layers into public/foliage/ and writes their
// painted-row bounds into the foliage-boxes block of src/styles/global.css.
//
// Usage: node scripts/foliage-compose.mjs [forest=forest3-1] [ground=strip3-2] ...
//
// Sources live in art-src/foliage/ (git-ignored — ~220MB of PNGs): the
// gpt-image-1 generations (scripts/aux-image.mjs, prompts in
// art-src/foliage/prompts/) and their 4x upscales (<name>-x4.png), made with
// Real-ESRGAN (realesrgan-ncnn-vulkan, model realesrgan-x4plus-anime).
// After re-composing, re-run scripts/og-card.mjs so the share card matches.
//
// Rules: no hard edges anywhere except each layer's bottom. Every cut made
// here (center splits, crops) is feathered; splits land on the emptiest
// column so they rarely cut a plant at all.
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const L = resolve(root, 'art-src/foliage');
const OUT = resolve(root, 'public/foliage');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split('=')));
const SRC = {
  forest: `${L}/${args.forest || 'forest3-1'}-x4.png`,
  back: `${L}/back-1-x4.png`,
  mid: `${L}/mid-1-x4.png`,
  front: `${L}/front-1-x4.png`,
  ground: `${L}/${args.ground || 'strip3-2'}-x4.png`,  // one continuous full-width strip
};

const blank = (w, h) => sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });

async function alphaOf(buf) {
  return sharp(buf).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
}

// Crop to painted pixels by alpha (sharp's trim() is fooled by the RGB noise
// that fully transparent pixels carry in these files).
async function alphaTrim(buf) {
  const { data, info } = await alphaOf(buf);
  let top = info.height, bottom = -1, left = info.width, right = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] > 8) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  return sharp(buf).extract({ left, top, width: right - left + 1, height: bottom - top + 1 }).png().toBuffer({ resolveWithObject: true });
}

// Column with the least paint between fromFrac and toFrac of the width —
// the natural gap between clusters, so a split there cuts as little as possible.
async function emptiestColumn(input, fromFrac, toFrac) {
  const { data, info } = await alphaOf(await sharp(input).png().toBuffer());
  let best = -1, bestSum = Infinity;
  for (let x = Math.round(info.width * fromFrac); x < Math.round(info.width * toFrac); x++) {
    let sum = 0;
    for (let y = 0; y < info.height; y++) sum += data[y * info.width + x];
    if (sum < bestSum) { bestSum = sum; best = x; }
  }
  return best;
}

// Multiply alpha by linear ramps on the given edges (px). Bottoms stay hard by
// default — the one place a hard edge is allowed — except the reed layer,
// whose raised base fades out like marsh mist.
async function feather(buf, { left = 0, right = 0, top = 0, bottom = 0 }) {
  const { width, height } = await sharp(buf).metadata();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="h" x1="0" x2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="${left ? 0 : 1}"/>
        <stop offset="${left / width}" stop-color="#fff" stop-opacity="1"/>
        <stop offset="${1 - right / width}" stop-color="#fff" stop-opacity="1"/>
        <stop offset="1" stop-color="#fff" stop-opacity="${right ? 0 : 1}"/>
      </linearGradient>
      <linearGradient id="v" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="${top ? 0 : 1}"/>
        <stop offset="${top / height}" stop-color="#000" stop-opacity="1"/>
        <stop offset="${1 - bottom / height}" stop-color="#000" stop-opacity="1"/>
        <stop offset="1" stop-color="#000" stop-opacity="${bottom ? 0 : 1}"/>
      </linearGradient>
      <mask id="m"><rect width="100%" height="100%" fill="url(#h)"/></mask>
    </defs>
    <rect width="100%" height="100%" fill="url(#v)" mask="url(#m)"/>
  </svg>`;
  return sharp(buf).composite([{ input: Buffer.from(svg), blend: 'dest-in' }]).png().toBuffer();
}

// Split a corner-heavy layer at its emptiest middle column into two trimmed
// pieces, feathering the inner (cut) edge and the top.
async function splitPieces(input, { mistBottom = 0 } = {}) {
  const { width: W, height: H } = await sharp(input).metadata();
  const split = await emptiestColumn(input, 0.35, 0.65);
  const out = [];
  for (const [region, side] of [[{ left: 0, top: 0, width: split, height: H }, 'left'], [{ left: split, top: 0, width: W - split, height: H }, 'right']]) {
    const { data, info } = await alphaTrim(await sharp(input).extract(region).png().toBuffer());
    const cutEdge = side === 'left' ? 'right' : 'left';
    const soft = await feather(data, { [cutEdge]: Math.round(info.width * 0.06), top: Math.round(info.height * 0.04), bottom: Math.round(info.height * mistBottom) });
    out.push({ data: soft, info, side });
  }
  return out;
}

// Ground: one continuous strip across the full width (two corner clusters
// left a visible gap in the middle on wide screens). A single painted strip is
// too deep for its width — stretched to full width it fills half the band —
// so a wider panorama is built first: the main strip (the one birch log with
// oyster mushrooms) in the middle, flanked by the log-free mossy left parts of
// two other carpet-moss strips (different art each side, so no mirror image). Each piece overlaps the previous with a
// feathered edge so the joins dissolve; only one log, so nothing reads as a
// mirror image. Then it's scaled to heightPx and center-cropped.
let PANORAMA = null;
async function groundPanorama() {
  if (PANORAMA) return PANORAMA;
  const a = await alphaTrim(await sharp(SRC.ground).png().toBuffer());
  // log-free left portion of a strip, cut at its emptiest column before the log
  const flankFrom = async (name, from, to) => {
    const file = `${L}/${name}-x4.png`;
    const { height: H1 } = await sharp(file).metadata();
    const cut = await emptiestColumn(file, from, to);
    return alphaTrim(await sharp(file).extract({ left: 0, top: 0, width: cut, height: H1 }).png().toBuffer());
  };
  const b = await flankFrom(args.flank || 'strip3-3', 0.33, 0.46);
  // a different strip for the left flank, so the two sides aren't mirror images
  const c = await flankFrom(args.leftFlank || 'strip3-1', 0.33, 0.46);
  const H = a.info.height;
  const toH = async (buf, info) => {
    const w = Math.round(info.width * (H / info.height));
    return { data: await sharp(buf).resize(w, H).png().toBuffer(), w };
  };
  const flank = await toH(b.data, b.info);
  const left = await toH(c.data, c.info);
  const overlap = Math.round(a.info.width * 0.12);
  // Outer ends stay unfeathered: each flank's outer edge is its source
  // image's own edge (painted right up to it), so the strip runs cleanly
  // behind the side panels instead of fading out just short of them. Only the
  // inner cut edges, where pieces overlap, get feathered. The right flank is
  // flipped so its image edge faces out and its cut edge faces the middle.
  const leftFlank = { data: await feather(left.data, { right: overlap }), w: left.w };
  const middle = { data: await feather(a.data, { left: overlap }), w: a.info.width };
  const rightFlank = { data: await feather(await sharp(flank.data).flop().png().toBuffer(), { left: overlap }), w: flank.w };
  const pieces = [leftFlank, middle, rightFlank];
  const total = pieces.reduce((sum, p) => sum + p.w, 0) - overlap * (pieces.length - 1);
  const comps = [];
  let x = 0;
  for (const p of pieces) {
    comps.push({ input: p.data, left: x, top: 0 });
    x += p.w - overlap;
  }
  PANORAMA = { data: await blank(total, H).composite(comps).png().toBuffer(), info: { width: total, height: H } };
  return PANORAMA;
}
async function groundStrip(cw, ch, heightPx) {
  const { data, info } = await groundPanorama();
  const scale = Math.max(heightPx / info.height, cw / info.width);
  const w = Math.round(info.width * scale);
  const h = Math.round(info.height * scale);
  const scaled = await sharp(data).resize(w, h).png().toBuffer();
  const cropped = await sharp(scaled).extract({ left: Math.round((w - cw) / 2), top: 0, width: cw, height: h }).png().toBuffer();
  const overhang = Math.round(h * 0.04);  // tuck the ragged bottom just below the canvas
  return blank(cw, ch).composite([{ input: cropped, left: 0, top: ch - h + overhang }]).png().toBuffer();
}

// Place pieces bottom-anchored at the left/right edges of [x0, x1]. Size by
// a fixed `scale`, or fit to `height` capped by `maxW`. `sides` breaks the
// mirror symmetry of split layers: per-side scale multiplier and a drop
// (fraction of the piece's height pushed below the anchor), so matching
// flowers in the two halves don't sit at identical spots.
async function pinPieces(pieces, cw, ch, { x0, x1, scale, height, maxW = Infinity, overhang = 0.04, bottom = ch, sides = {} }) {
  const comps = [];
  for (const p of pieces) {
    const { scale: sideScale = 1, drop = 0 } = sides[p.side] || {};
    const s = (scale ?? Math.min(height / p.info.height, maxW / p.info.width)) * sideScale;
    const w = Math.round(p.info.width * s);
    const h = Math.round(p.info.height * s);
    const x = p.side === 'left' ? x0 : x1 - w;
    const top = Math.round(bottom - h + h * (overhang + drop));
    // clip anything pushed past the canvas bottom (a bottom edge — allowed)
    const visibleH = Math.min(h, ch - top);
    let input = await sharp(p.data).resize(w, h).png().toBuffer();
    if (visibleH < h) input = await sharp(input).extract({ left: 0, top: 0, width: w, height: visibleH }).png().toBuffer();
    comps.push({ input, left: Math.round(x), top });
  }
  return blank(cw, ch).composite(comps).png().toBuffer();
}

// Forest: fill the width, anchor the painted top at topFrac, let the solid
// base run off the canvas bottom (hidden behind nearer layers).
async function forestBand(cw, ch, topFrac) {
  const { data, info } = await alphaTrim(await sharp(SRC.forest).png().toBuffer());
  const scale = Math.max(((1 - topFrac) * ch) / info.height, cw / info.width);
  const w = Math.round(info.width * scale);
  const h = Math.round(info.height * scale);
  const top = Math.round(topFrac * ch);
  const scaled = await sharp(data).resize(w, h).png().toBuffer();
  const cropLeft = Math.max(0, Math.round((w - cw) / 2));
  const cropped = await sharp(scaled).extract({ left: cropLeft, top: 0, width: Math.min(cw, w), height: Math.min(h, ch - top) }).png().toBuffer();
  return blank(cw, ch).composite([{ input: cropped, left: 0, top }]).png().toBuffer();
}

// Crop to the painted rows (transparent sky costs as much memory as paint)
// and record where they sit in the full canvas, for the CSS content box.
const BOXES = {};
async function save(buf, name, w1, w2) {
  const { data, info } = await alphaOf(buf);
  const rowPainted = (y) => { for (let x = 0; x < info.width; x++) if (data[y * info.width + x] > 0) return true; return false; };
  let top = 0; while (top < info.height - 1 && !rowPainted(top)) top++;
  let bottom = info.height - 1; while (bottom > top && !rowPainted(bottom)) bottom--;
  // snap to whole output pixels at the 1x width so CSS and bitmap agree
  const step = info.width / w1;
  top = Math.floor(top / step) * step;
  bottom = Math.min(info.height, Math.ceil((bottom + 1) / step) * step);
  const cropped = await sharp(buf).extract({ left: 0, top: Math.round(top), width: info.width, height: Math.round(bottom - top) }).png().toBuffer();
  BOXES[name] = { top: top / info.height, bottom: bottom / info.height };
  const a = await sharp(cropped).resize(w1).avif({ quality: 55, effort: 6 }).toFile(`${OUT}/${name}.avif`);
  // w2 = null: no 2x file (hazy desktop forest/reeds are served 1x everywhere)
  const b = w2 ? await sharp(cropped).resize(w2).avif({ quality: 50, effort: 6 }).toFile(`${OUT}/${name}@2x.avif`) : null;
  console.log(name.padEnd(9), `${a.width}x${a.height}`, `rows ${BOXES[name].top.toFixed(3)}–${BOXES[name].bottom.toFixed(3)}`, `${(a.size / 1024).toFixed(0)}KB / ${b ? (b.size / 1024).toFixed(0) + 'KB' : '—'}`);
}

// Opposite asymmetry on mid and front so neither layer's flower pair (irises,
// marigolds) mirrors across the screen, and the two layers don't line up.
const MID_SIDES = { right: { scale: 0.88, drop: 0.1 } };
const FRONT_SIDES = { left: { scale: 0.86, drop: 0.12 } };

// ---- desktop: 3:2 canvas, drawn at max(100%, 150vh) wide ----
{
  const CW = 4200, CH = 2800;
  const SRC_H = 4096;  // 1024px generations upscaled 4x
  await save(await forestBand(CW, CH, 0.15), 'forest', 1400, null);
  // Frame band / canvas height is ~0.7 across desktop sizes (70vh band vs a
  // 150vh-wide 3:2 layer). The reed layer is raised so its misty base ends
  // ~72% down the band at the end of the page — behind ferns and leaves,
  // never down at their ground line.
  const FRAME_D = 0.7 * CH;
  const backBottom = 0.72 * FRAME_D - 0.55 * (FRAME_D - CH);
  // CSS pins the reed base at 72% of the band at the end of the page, so the
  // painted height must fit in that 72% (with margin) or the band's top edge
  // slices the cattails flat. Band ≈ 0.7 × canvas on desktop and landscape.
  await save(await pinPieces(await splitPieces(SRC.back, { mistBottom: 0.22 }), CW, CH, { x0: 0, x1: CW, height: 0.72 * FRAME_D * 0.94, maxW: CW * 0.55, overhang: 0, bottom: backBottom }), 'back', 1400, null);
  await save(await pinPieces(await splitPieces(SRC.mid), CW, CH, { x0: 0, x1: CW, scale: (CH / SRC_H) * 0.75, overhang: 0, sides: MID_SIDES }), 'mid', 1400, 2800);
  await save(await pinPieces(await splitPieces(SRC.front), CW, CH, { x0: 0, x1: CW, scale: (CH / SRC_H) * 0.55, overhang: 0, sides: FRONT_SIDES }), 'front', 1400, 2800);
  // strip ~20% of the band tall (band ≈ 0.7 × canvas)
  await save(await groundStrip(CW, CH, 0.2 * FRAME_D), 'ground', 1400, 2800);
}

// ---- phone: only the visible strip. The layer is 100% of the frame wide
// and 2x as tall (forest 2.5x), so the vertical pan geometry matches the old
// square drawn at 200% — without decoding or compositing the off-screen
// sides. Placement is solved from where each layer's painted top should sit
// in the 55vh band at the end of the page. FRAME = band height / strip width
// on a ~390x844 phone. Exported at true 2x (800px wide) to keep GPU memory low.
{
  const V = 2400;
  const FRAME = 1.19 * V;
  const solve = (depth, topFrac, stripH, bottomFrac = 1.04) => {
    const T = depth * (FRAME - stripH);  // end-of-page translate
    return { top: topFrac * FRAME - T, bottom: bottomFrac * FRAME - T };
  };
  await save(await forestBand(V, V * 2.5, 0.15), 'forest-m', 400, 800);
  //              depth  top   maxHalfW  bottom  mist
  const cfg = {
    back:  [0.55, 0.10, 0.7, 0.72, 0.22],
    mid:   [0.8, 0.45, 0.6, 1.04, 0],
    front: [1, 0.62, 0.5, 1.04, 0],
  };
  for (const [name, [depth, topFrac, maxHalfW, bottomFrac, mist]] of Object.entries(cfg)) {
    const { top, bottom } = solve(depth, topFrac, V * 2, bottomFrac);
    const pieces = await splitPieces(SRC[name], { mistBottom: mist });
    const sides = name === 'mid' ? MID_SIDES : name === 'front' ? FRONT_SIDES : {};
    await save(await pinPieces(pieces, V, V * 2, { x0: 0, x1: V, height: bottom - top, maxW: V * maxHalfW, overhang: 0, bottom, sides }), `${name}-m`, 400, 800);
  }
  // same ~20% of the band as desktop, center-cropped to the phone's width
  await save(await groundStrip(V, V * 2, 0.2 * FRAME), 'ground-m', 400, 800);
}

// Write the painted-row bounds into global.css between the foliage-boxes markers.
{
  const { readFileSync, writeFileSync } = await import('node:fs');
  const cssPath = resolve(root, 'src/styles/global.css');
  const rule = (sel, b) => `${sel} { --content-top: ${b.top.toFixed(4)}; --content-bottom: ${b.bottom.toFixed(4)}; }`;
  const desk = ['forest', 'back', 'mid', 'front', 'ground'].map((n) => rule(`.foliage-frame--${n} .foliage-layer`, BOXES[n]));
  const phone = ['forest', 'back', 'mid', 'front', 'ground'].map((n) => '  ' + rule(`.foliage-frame--${n} .foliage-layer`, BOXES[`${n}-m`]));
  const block = `/* foliage-boxes:start — painted-row bounds per layer, written by the compositor */\n${desk.join('\n')}\n@media (max-width: 720px) and (orientation: portrait) {\n${phone.join('\n')}\n}\n/* foliage-boxes:end */`;
  const css = readFileSync(cssPath, 'utf8');
  const next = css.replace(/\/\* foliage-boxes:start[\s\S]*?foliage-boxes:end \*\//, block);
  if (!/foliage-boxes:start[\s\S]*?foliage-boxes:end/.test(css)) throw new Error('foliage-boxes markers not found in global.css');
  writeFileSync(cssPath, next);
  console.log('wrote content boxes to global.css');
}
