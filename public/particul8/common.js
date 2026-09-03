// Shared between the playground UI (app.js) and the embeddable element
// (embed.js): the settings <-> share-string codec and on-demand font loading.
// Pulled out of app.js once the embed needed the same two things.
import { DEFAULTS } from './engine.js';

export const GOOGLE_FONTS = {
  'Fraunces': 'Fraunces:wght@400;700;900',
  'Playfair Display': 'Playfair+Display:wght@400;700;900',
  'Bebas Neue': 'Bebas+Neue',
  'Pacifico': 'Pacifico',
  'Monoton': 'Monoton',
  'Rubik Mono One': 'Rubik+Mono+One',
  'Space Mono': 'Space+Mono:wght@400;700',
};

export const LIMITS = { text: 500, font: 60 };

// Whitelist against DEFAULTS: unknown keys dropped, types enforced, strings
// capped. Everything that arrives from a URL or an attribute goes through here.
export function sanitize(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw || {})) {
    if (!(k in DEFAULTS)) continue;
    const d = DEFAULTS[k];
    if (typeof d === 'number') { if (Number.isFinite(v)) out[k] = v; }
    else if (typeof d === 'boolean') { if (typeof v === 'boolean') out[k] = v; }
    else if (Array.isArray(d)) { if (Array.isArray(v) && v.every((c) => /^#[0-9a-f]{6}$/i.test(c))) out[k] = v.slice(0, 8); }
    else if (typeof v === 'string') out[k] = v.slice(0, LIMITS[k] || 40);
  }
  return out;
}

// Diff from DEFAULTS as base64url JSON - short for near-default setups, and
// safe to drop straight into a URL hash or an HTML attribute.
export function encodeSettings(settings) {
  const diff = {};
  for (const k of Object.keys(DEFAULTS)) {
    if (k === 'autoplay') continue;
    if (JSON.stringify(settings[k]) !== JSON.stringify(DEFAULTS[k])) diff[k] = settings[k];
  }
  const bytes = new TextEncoder().encode(JSON.stringify(diff));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSettings(encoded) {
  if (!encoded || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return sanitize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return null; }
}

export function fontStylesheetUrl(family) {
  return GOOGLE_FONTS[family] ? `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS[family]}&display=swap` : null;
}

const loadedFonts = new Set();
// Only families in GOOGLE_FONTS ever get a stylesheet injected - a font name
// from a share link or attribute can't point the page at an arbitrary URL.
export async function ensureFont(family, weight, doc = document) {
  const url = fontStylesheetUrl(family);
  if (url && !loadedFonts.has(family)) {
    loadedFonts.add(family);
    const link = doc.createElement('link');
    link.rel = 'stylesheet'; link.href = url;
    doc.head.append(link);
  }
  try { await doc.fonts.load(`${weight} 32px "${family}"`); } catch { /* fall back to whatever the browser resolves */ }
}
