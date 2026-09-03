// Particul8 export. A second engine renders offscreen at the target size,
// replaying the same seed, and hands each frame to a sink: WebCodecs video,
// GIF, a zipped PNG sequence, or nothing at all for the standalone HTML file.
// The preview is never touched, and the codecs are dynamic imports so the
// page only pays for them when someone actually clicks Export.
import { Particul8, tokenize, frameSecondsFor, spreadFor } from './engine.js';
import { encodeSettings, fontStylesheetUrl } from './common.js';

export const SIZES = [
  { id: '720p', label: '1280 × 720', w: 1280, h: 720 },
  { id: '1080p', label: '1920 × 1080', w: 1920, h: 1080 },
  { id: '4k', label: '3840 × 2160', w: 3840, h: 2160 },
  { id: 'square', label: '1080 × 1080 square', w: 1080, h: 1080 },
  { id: 'vertical', label: '1080 × 1920 vertical', w: 1080, h: 1920 },
];
export const FORMATS = [
  ['video', 'Video (MP4)'],
  ['gif', 'GIF'],
  ['png', 'PNG sequence (zip)'],
  ['html', 'Standalone HTML'],
];
export const GIF_MAX_WIDTH = 640;
// GIF delays are whole centiseconds and browsers slow anything under 2 cs to
// 10 cs, so 50 fps is the format's real ceiling; 25 halves the file size.
export const GIF_FPS_OPTIONS = [25, 50];
export const VIDEO_FPS_OPTIONS = [30, 60];
export const gifFps = (fps) => (GIF_FPS_OPTIONS.includes(fps) ? fps : GIF_FPS_OPTIONS[0]);

export const canEncodeVideo = () => typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const even = (n) => Math.max(2, Math.round(n / 2) * 2);   // H.264 wants even dimensions

// --- quality -----------------------------------------------------------------
// One 0..1 slider, meaning per format: bitrate for video, palette depth for
// GIF. PNG is lossless and HTML is source, so neither listens to it.
export const QUALITY_DEFAULT = 0.7;
export const videoBitrate = (w, h, fps, quality) => {
  const bitsPerPixel = 0.02 + quality * quality * 0.28;   // 0.7 lands on ~9 Mbps at 1080p30
  return Math.min(80e6, Math.round(w * h * fps * bitsPerPixel));
};
export const gifDepth = (quality) => Math.round(4 + quality * 4);   // 4..8 bits = 16..256 colours
export function qualityLabel(format, sizeId, fps, quality) {
  if (format === 'gif') return `${1 << gifDepth(quality)} colors`;
  if (format === 'video') {
    const t = resolveTarget(format, sizeId, fps);
    return `${(videoBitrate(t.pixelW, t.pixelH, t.fps, quality) / 1e6).toFixed(1)} Mbps`;
  }
  return '';
}

export function resolveTarget(format, sizeId, fps) {
  const size = SIZES.find((s) => s.id === sizeId) || SIZES[1];
  let pixelW = size.w, pixelH = size.h;
  if (format === 'gif') {
    const scale = Math.min(1, GIF_MAX_WIDTH / pixelW);
    pixelW = even(pixelW * scale); pixelH = even(pixelH * scale);
    fps = gifFps(fps);
  }
  return { pixelW, pixelH, fps };
}

// Clip timeline. With several shapes the clip starts at shape 0 already
// settled and runs one full cycle, so it loops cleanly; with one shape the
// clip is the entrance from a random cloud.
function timeline(settings, fps) {
  const shapes = tokenize(settings.text, settings.granularity).length;
  const per = frameSecondsFor(settings);
  const preroll = shapes > 1 ? per - settings.hold : 0;
  const seconds = per * shapes;
  return { shapes, seconds, preroll, frames: Math.ceil(seconds * fps) };
}

export function estimate(settings, format, fps) {
  const f = format === 'gif' ? gifFps(fps) : fps;
  const tl = timeline(settings, f);
  return { seconds: tl.seconds, frames: tl.frames, fps: f };
}

// Offscreen engine at the target pixel size. The sim runs at the preview's
// logical width so the export is what you saw; dpr carries it up to pixels.
function makeEngine(settings, pixelW, pixelH, logicalWidth) {
  const canvas = document.createElement('canvas');
  // first getContext call wins its attributes; GIF and PNG sinks read pixels back every frame
  canvas.getContext('2d', { willReadFrequently: true });
  const engine = new Particul8(canvas, { ...settings, autoplay: true });
  const w = Math.round(logicalWidth);
  const h = Math.round((w * pixelH) / pixelW);
  engine.resize(w, h, pixelW / w, { width: pixelW, height: pixelH });
  return { canvas, engine };
}

async function renderFrames({ settings, pixelW, pixelH, fps, logicalWidth, onProgress, signal, sink }) {
  const { canvas, engine } = makeEngine(settings, pixelW, pixelH, logicalWidth);
  const tl = timeline(settings, fps);
  const stepsPerSecond = Math.round(1 / Particul8.DT);
  const prerollSteps = Math.round(tl.preroll * stepsPerSecond);
  for (let k = 0; k < prerollSteps; k++) {
    engine.advance();
    if (k % 2 === 1) engine.render();   // keep drawing so trails are warm at the loop point
  }
  let steps = prerollSteps;
  for (let i = 0; i < tl.frames; i++) {
    if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
    // fractional stepping: 25 fps alternates 2 and 3 sim steps, never drifts
    const target = prerollSteps + Math.round((i * stepsPerSecond) / fps);
    while (steps < target) { engine.advance(); steps++; }
    engine.render();
    await sink(canvas, i, tl.frames);
    onProgress?.((i + 1) / tl.frames, i + 1, tl.frames);
    await sleep(0);   // let the page breathe between frames
  }
  return tl;
}

// --- video: WebCodecs + a vendored muxer ------------------------------------
function avcLevel(w, h, fps) {
  const mbs = Math.ceil(w / 16) * Math.ceil(h / 16), rate = mbs * fps;
  const levels = [['1F', 3600, 108000], ['28', 8192, 245760], ['2A', 8704, 522240], ['33', 36864, 983040], ['34', 36864, 2073600]];
  for (const [hex, maxFrame, maxRate] of levels) if (mbs <= maxFrame && rate <= maxRate) return hex;
  return '34';
}

async function pickVideoCodec(w, h, fps, bitrate) {
  const level = avcLevel(w, h, fps);
  const vp9Level = w * h > 1920 * 1080 ? '51' : '41';
  const base = { width: w, height: h, bitrate, framerate: fps, latencyMode: 'quality' };
  const candidates = [
    { codec: `avc1.6400${level}`, container: 'mp4', muxCodec: 'avc', mime: 'video/mp4', ext: 'mp4', extra: { avc: { format: 'avc' } } },
    { codec: `avc1.4D00${level}`, container: 'mp4', muxCodec: 'avc', mime: 'video/mp4', ext: 'mp4', extra: { avc: { format: 'avc' } } },
    { codec: `vp09.00.${vp9Level}.08`, container: 'webm', muxCodec: 'V_VP9', mime: 'video/webm', ext: 'webm', extra: {} },
    { codec: 'vp8', container: 'webm', muxCodec: 'V_VP8', mime: 'video/webm', ext: 'webm', extra: {} },
  ];
  for (const c of candidates) {
    const config = { ...base, codec: c.codec, ...c.extra };
    try {
      const r = await VideoEncoder.isConfigSupported(config);
      if (r.supported) return { ...c, config };
    } catch { /* try the next one */ }
  }
  return null;
}

async function videoSink(pixelW, pixelH, fps, quality) {
  if (!canEncodeVideo()) throw new Error('This browser has no WebCodecs video encoder. GIF and PNG sequence still work.');
  const pick = await pickVideoCodec(pixelW, pixelH, fps, videoBitrate(pixelW, pixelH, fps, quality));
  if (!pick) throw new Error('No supported video codec at this size. Try a smaller size, GIF, or PNG sequence.');
  const mod = await import(pick.container === 'mp4' ? './vendor/mp4-muxer.js' : './vendor/webm-muxer.js');
  const target = new mod.ArrayBufferTarget();
  const video = { codec: pick.muxCodec, width: pixelW, height: pixelH, frameRate: fps };
  const muxer = new mod.Muxer(pick.container === 'mp4' ? { target, video, fastStart: 'in-memory' } : { target, video });
  let failure = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { failure = e; },
  });
  encoder.configure(pick.config);
  const usPerFrame = Math.round(1e6 / fps);
  return {
    async frame(canvas, i) {
      if (failure) throw failure;
      while (encoder.encodeQueueSize > 6) await sleep(4);   // backpressure: don't bury the encoder
      const vf = new VideoFrame(canvas, { timestamp: i * usPerFrame, duration: usPerFrame });
      encoder.encode(vf, { keyFrame: i % (fps * 2) === 0 });
      vf.close();
    },
    async finish() {
      await encoder.flush();
      if (failure) throw failure;
      encoder.close();
      muxer.finalize();
      return { blob: new Blob([target.buffer], { type: pick.mime }), ext: pick.ext };
    },
    abort() { try { encoder.close(); } catch { /* already closed */ } },
  };
}

// --- gif ---------------------------------------------------------------------
// Quantize one canvas to `depth` bits and write it into a gifenc encoder.
// Per-frame palettes so glow gradients keep their steps; fewer colours means
// longer runs for LZW, which is where the quality slider buys its bytes.
function gifFrame(lib, gif, canvas, pixelW, pixelH, depth, delay) {
  const data = canvas.getContext('2d').getImageData(0, 0, pixelW, pixelH).data;
  const palette = lib.quantize(data, 1 << depth, { format: 'rgb565' });
  const index = lib.applyPalette(data, palette, 'rgb565');
  gif.writeFrame(index, pixelW, pixelH, { palette, delay, repeat: 0, colorDepth: depth });
}

async function gifSink(pixelW, pixelH, fps, quality) {
  const lib = await import('./vendor/gifenc.js');
  const gif = lib.GIFEncoder();
  const delay = Math.round(1000 / fps);
  const depth = gifDepth(quality);
  return {
    async frame(canvas) { gifFrame(lib, gif, canvas, pixelW, pixelH, depth, delay); },
    async finish() {
      gif.finish();
      return { blob: new Blob([gif.bytes()], { type: 'image/gif' }), ext: 'gif' };
    },
    abort() {},
  };
}

// --- png sequence: hand-rolled STORE zip -------------------------------------
// PNGs are already deflated, so a compressing zip would only burn time. A
// store-only writer is ~40 lines; that beats a dependency.
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(bytes) {
  let c = -1;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function dosDateTime(d) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}
class ZipWriter {
  constructor() { this.parts = []; this.central = []; this.offset = 0; this.count = 0; }
  async add(name, blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const nameBytes = new TextEncoder().encode(name);
    const crc = crc32(bytes), size = bytes.length;
    const { time, date } = dosDateTime(new Date());
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0, true); local.setUint16(8, 0, true);
    local.setUint16(10, time, true); local.setUint16(12, date, true); local.setUint32(14, crc, true);
    local.setUint32(18, size, true); local.setUint32(22, size, true); local.setUint16(26, nameBytes.length, true); local.setUint16(28, 0, true);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0, true); cd.setUint16(10, 0, true);
    cd.setUint16(12, time, true); cd.setUint16(14, date, true); cd.setUint32(16, crc, true); cd.setUint32(20, size, true); cd.setUint32(24, size, true);
    cd.setUint16(28, nameBytes.length, true); cd.setUint16(30, 0, true); cd.setUint16(32, 0, true); cd.setUint16(34, 0, true); cd.setUint16(36, 0, true);
    cd.setUint32(38, 0, true); cd.setUint32(42, this.offset, true);
    // keep the Blob, not the bytes: the browser can page large blobs to disk
    this.parts.push(local, nameBytes, blob);
    this.central.push(cd, nameBytes);
    this.offset += 30 + nameBytes.length + size;
    this.count++;
    if (this.offset > 0xfff00000) throw new Error('Zip would pass 4 GB. Pick a smaller size or a shorter clip.');
  }
  blob() {
    const cdSize = this.central.reduce((n, p) => n + p.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(4, 0, true); end.setUint16(6, 0, true);
    end.setUint16(8, this.count, true); end.setUint16(10, this.count, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, this.offset, true); end.setUint16(20, 0, true);
    return new Blob([...this.parts, ...this.central, end], { type: 'application/zip' });
  }
}

function pngSink(fps, transparent, shareUrl) {
  const zip = new ZipWriter();
  let count = 0;
  return {
    async frame(canvas, i) {
      const blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG encode failed'))), 'image/png'));
      await zip.add(`particul8_${String(i + 1).padStart(4, '0')}.png`, blob);
      count = i + 1;
    },
    async finish() {
      const readme = [
        `Particul8 PNG sequence: ${count} frames at ${fps} fps${transparent ? ', transparent background' : ''}.`,
        '',
        'Stitch with ffmpeg, alpha preserved (ProRes 4444):',
        `  ffmpeg -framerate ${fps} -i particul8_%04d.png -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le particul8.mov`,
        'Or WebM with alpha:',
        `  ffmpeg -framerate ${fps} -i particul8_%04d.png -c:v libvpx-vp9 -pix_fmt yuva420p particul8.webm`,
        '',
        `Recreate or tweak this clip: ${shareUrl}`,
        '',
      ].join('\n');
      await zip.add('README.txt', new Blob([readme], { type: 'text/plain' }));
      return { blob: zip.blob(), ext: 'zip' };
    },
    abort() {},
  };
}

// --- standalone html ---------------------------------------------------------
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// One file, no network except the optional Google Font: the engine source is
// inlined verbatim (inline module scripts may contain export declarations).
export async function exportHtml(settings, shareUrl) {
  const res = await fetch(new URL('./engine.js', import.meta.url));
  if (!res.ok) throw new Error(`Could not fetch engine source (${res.status})`);
  const src = await res.text();
  const json = JSON.stringify(settings).replace(/</g, '\\u003c');   // keeps </script> out of the payload
  const fontUrl = fontStylesheetUrl(settings.font);
  const bg = settings.background === 'transparent' ? '#000' : settings.background;
  const html = [
    '<!doctype html>',
    '<html lang="en">',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(settings.text.slice(0, 60))} - Particul8</title>`,
    fontUrl ? `<link rel="stylesheet" href="${fontUrl}">` : '',
    `<style>html,body{margin:0;height:100%;background:${escapeHtml(bg)};overflow:hidden}canvas{display:block;width:100vw;height:100vh}</style>`,
    '<canvas id="p8" aria-label="Particle text animation"></canvas>',
    '<script type="module">',
    `// Made with Particul8. Edit this clip: ${shareUrl}`,
    src,
    `const settings = ${json};`,
    'const canvas = document.getElementById("p8");',
    'const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;',
    'const engine = new Particul8(canvas, { ...settings, autoplay: !reduced });',
    'const fit = () => engine.resize(innerWidth, innerHeight);',
    'addEventListener("resize", fit);',
    'fit();',
    'engine.start();',
    'document.fonts.load(`${settings.weight} 32px "${settings.font}"`).catch(() => {}).then(() => engine.refresh());',
    'canvas.addEventListener("click", () => (engine.playing ? engine.pause() : engine.play()));',
    'window.particul8 = engine;',
    '</script>',
    '</html>',
    '',
  ].filter((l) => l !== '').join('\n');
  return { blob: new Blob([html], { type: 'text/html' }), filename: `${slug(settings.text)}.html` };
}

// --- embed snippets ----------------------------------------------------------
export function embedSnippet(settings, kind = 'element') {
  const base = new URL('./', import.meta.url).href;
  const config = encodeSettings(settings);
  if (kind === 'iframe') {
    return `<iframe src="${base}embed.html#p8=${config}" width="800" height="450" style="border:0;max-width:100%" loading="lazy" title="Particul8"></iframe>`;
  }
  return `<script type="module" src="${base}embed.js"></script>\n<particul-8 config="${config}" style="width:100%;aspect-ratio:16/9"></particul-8>`;
}

// --- orchestration -----------------------------------------------------------
export function slug(text) {
  const s = String(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return s ? `particul8-${s}` : 'particul8';
}

// Projected output size in bytes. Video is arithmetic from the bitrate. GIF
// and PNG depend on what's on screen, so two frames are encoded for real at
// the export size - one settled, one mid-morph - and weighted by how long the
// clip spends in each state. HTML is the engine source plus settings.
export async function estimateSize({ settings, format, sizeId, fps = 30, transparent = false, quality = QUALITY_DEFAULT, logicalWidth }) {
  const tl = timeline(settings, format === 'gif' ? gifFps(fps) : fps);
  if (format === 'html') return 34000 + settings.text.length * 2;
  const { pixelW, pixelH, fps: f } = resolveTarget(format, sizeId, fps);
  if (format === 'video') return Math.round((videoBitrate(pixelW, pixelH, f, quality) / 8) * tl.seconds * 1.02);

  const clear = transparent && format === 'png';
  const s = { ...settings, background: clear ? 'transparent' : settings.background };
  const { canvas, engine } = makeEngine(s, pixelW, pixelH, logicalWidth);
  let encode;
  if (format === 'gif') {
    const lib = await import('./vendor/gifenc.js');
    const depth = gifDepth(quality), delay = Math.round(1000 / f);
    encode = async () => {
      const g = lib.GIFEncoder();
      gifFrame(lib, g, canvas, pixelW, pixelH, depth, delay);
      return g.bytesView().length;
    };
  } else {
    encode = () => new Promise((res) => canvas.toBlob((b) => res(b ? b.size : 0), 'image/png'));
  }

  const per = frameSecondsFor(s), spread = spreadFor(s);
  const morphSeconds = Math.min(per, spread + 1.0);   // sweep plus the colour transit tail
  const settledAt = per - s.hold;
  const morphAt = (tl.shapes > 1 ? per : 0) + spread * 0.5 + 0.2;
  const steps = (sec) => Math.round(sec * 60);
  let at = 0;
  const runTo = (target) => { for (const t = steps(target); at < t; at++) { engine.advance(); if (at % 2) engine.render(); } engine.render(); };
  const samples = {};
  for (const [name, t] of [['settled', settledAt], ['morph', morphAt]].sort((a, b) => a[1] - b[1])) {
    runTo(t);
    samples[name] = await encode();
  }
  const morphFrac = morphSeconds / per;
  return Math.round(tl.frames * (morphFrac * samples.morph + (1 - morphFrac) * samples.settled));
}

export async function exportClip({ settings, format, sizeId, fps = 30, transparent = false, quality = QUALITY_DEFAULT, logicalWidth, onProgress, signal, shareUrl }) {
  if (format === 'html') return exportHtml(settings, shareUrl);
  const { pixelW, pixelH, fps: f } = resolveTarget(format, sizeId, fps);
  fps = f;
  const clear = transparent && format === 'png';
  const s = { ...settings, background: clear ? 'transparent' : settings.background };
  const sink = format === 'video' ? await videoSink(pixelW, pixelH, fps, quality)
    : format === 'gif' ? await gifSink(pixelW, pixelH, fps, quality)
    : pngSink(fps, clear, shareUrl);
  try {
    await renderFrames({ settings: s, pixelW, pixelH, fps, logicalWidth, onProgress, signal, sink: sink.frame });
    const { blob, ext } = await sink.finish();
    return { blob, filename: `${slug(settings.text)}-${pixelW}x${pixelH}.${ext}` };
  } catch (e) {
    sink.abort();
    throw e;
  }
}
