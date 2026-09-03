// <particul-8> - Particul8 as a drop-in element for any page.
//
//   <script type="module" src="https://marsh.city/particul8/embed.js"></script>
//   <particul-8 text="Hello 🌿 World" transition="wick"></particul-8>
//
// Any setting from engine.js DEFAULTS works as an attribute (kebab-case or
// camelCase), or pass the share-link payload as config="...". Attributes win
// over config. The element pauses when scrolled offscreen and honours
// prefers-reduced-motion, so it's a polite guest on someone else's site.
import { Particul8, DEFAULTS } from './engine.js';
import { decodeSettings, sanitize, ensureFont } from './common.js';

const KEYS = Object.keys(DEFAULTS).filter((k) => k !== 'autoplay');
const kebab = (k) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function parseAttr(key, raw) {
  const d = DEFAULTS[key];
  if (typeof d === 'number') return Number(raw);
  if (typeof d === 'boolean') return raw !== 'false' && raw !== '0';
  if (Array.isArray(d)) return raw.split(/[\s,]+/).filter(Boolean);
  return raw;
}

class Particul8Element extends HTMLElement {
  static get observedAttributes() { return ['config', ...KEYS.map(kebab), ...KEYS]; }

  connectedCallback() {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText = 'display:block;width:100%;height:100%';
      this.canvas.setAttribute('aria-label', 'Particle text animation');
      this.append(this.canvas);
    }
    if (getComputedStyle(this).display === 'inline') this.style.display = 'block';
    if (!this.clientHeight) this.style.aspectRatio = '16 / 9';

    const settings = this.readSettings();
    if (!this.engine) {
      this.engine = new Particul8(this.canvas, settings);
      this.ro = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) this.engine.resize(width, height);
      });
      // start/stop with visibility so an offscreen embed costs nothing
      this.io = new IntersectionObserver(([entry]) => {
        entry.isIntersecting ? this.engine.start() : this.engine.stop();
      });
    } else {
      this.engine.setSettings(settings);
    }
    this.ro.observe(this);
    this.io.observe(this);
    ensureFont(settings.font, settings.weight).then(() => this.engine.refresh());
  }

  disconnectedCallback() {
    this.engine?.stop();
    this.ro?.disconnect();
    this.io?.disconnect();
  }

  attributeChangedCallback() {
    if (!this.engine || !this.isConnected) return;
    const s = this.readSettings();
    this.engine.setSettings(s);
    ensureFont(s.font, s.weight).then(() => this.engine.refresh());
  }

  readSettings() {
    const fromConfig = decodeSettings(this.getAttribute('config')) || {};
    const fromAttrs = {};
    for (const k of KEYS) {
      const raw = this.getAttribute(kebab(k)) ?? this.getAttribute(k);
      if (raw != null) fromAttrs[k] = parseAttr(k, raw);
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return { ...DEFAULTS, ...fromConfig, ...sanitize(fromAttrs), autoplay: !reduced };
  }

  // Small JS surface for pages that want to drive it.
  get settings() { return this.engine ? { ...this.engine.settings } : this.readSettings(); }
  set settings(patch) { this.engine?.setSettings(sanitize(patch)); }
  play() { this.engine?.play(); }
  pause() { this.engine?.pause(); }
  next() { this.engine?.next(); }
  prev() { this.engine?.prev(); }
}

if (!customElements.get('particul-8')) customElements.define('particul-8', Particul8Element);
export { Particul8Element };
