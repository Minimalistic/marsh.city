// Birds for the ambient beds: real northern Minnesota species (the Arrowhead,
// mixed boreal and hardwood forest near Lake Superior), synthesized from
// spectrogram measurements instead of generic whistles.
//
// What makes it read as birds rather than beeps:
// - each species has its own note shapes: pure whistles, nasal harmonic
//   stacks, AM buzzes, or filtered noise, with real frequency contours
// - a few resident birds hold spots around you and repeat their song at
//   their species' pace, then move on and someone else arrives
// - who is around, and whether they sing or only call, follows the month
// - distance takes the highs off as well as the level, and adds room
//
// Audition from the address bar: ?birdmonth=6 pretends it's June,
// ?bird=loon solos one species (night birds need the dark theme on).

import { SPECIES } from './bird-species.js';

export function createBirds(ctx, { day, night, verbIn }) {
  const rnd = Math.random;
  const between = (a, b) => a + rnd() * (b - a);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];

  const params = new URLSearchParams(location.search);
  const monthParam = parseInt(params.get('birdmonth'), 10);
  const month = () => (monthParam >= 1 && monthParam <= 12 ? monthParam : new Date().getMonth() + 1);
  const solo = params.get('bird');
  if (solo && !SPECIES[solo]) console.warn('[birds] unknown ?bird=', solo, 'try one of', Object.keys(SPECIES).join(', '));

  const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };

  // --- sound primitives ----------------------------------------------------
  // A contour is a number, or an array of values spread evenly over the note.
  function curve(c, n) {
    const pts = Array.isArray(c) ? c : [c];
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * (pts.length - 1);
      const k = Math.min(Math.floor(x), pts.length - 2);
      out[i] = pts.length === 1 ? pts[0] : pts[k] + (pts[k + 1] - pts[k]) * (x - k);
    }
    return out;
  }

  // raised-cosine attack and release, times an optional loudness shape
  function envelope(dur, lvl, shape, atk = 0.012, rel = 0.025) {
    const n = Math.max(16, Math.min(256, Math.ceil(dur * 400)));
    const a = Math.min(atk, dur * 0.3), r = Math.min(rel, dur * 0.4);
    const sh = shape ? curve(shape, n) : null;
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const tt = (i / (n - 1)) * dur;
      let v = 1;
      if (tt < a) v = Math.sin((Math.PI / 2) * (tt / a)) ** 2;
      else if (tt > dur - r) v = Math.sin((Math.PI / 2) * ((dur - tt) / r)) ** 2;
      out[i] = v * lvl * (sh ? sh[i] : 1);
    }
    out[n - 1] = 0;
    return out;
  }

  // harmonic stacks for nasal and hoarse voices; a PeriodicWave keeps every
  // harmonic locked to the fundamental's contour for the price of one oscillator
  const waves = new Map();
  function wave(harm) {
    const key = harm.join(',');
    if (!waves.has(key)) {
      const real = new Float32Array(harm.length + 1), imag = new Float32Array(harm.length + 1);
      harm.forEach((h, i) => { imag[i + 1] = h; });
      waves.set(key, ctx.createPeriodicWave(real, imag));
    }
    return waves.get(key);
  }

  // One voiced note.
  //   f     frequency contour (Hz)
  //   harm  harmonic amplitudes [1, h2, h3...]; omit for a pure whistle
  //   am    [rateHz, depth 0..1] amplitude buzz
  //   vib   [rateHz, depthHz] frequency flutter
  //   shape loudness contour, atk/rel attack and release seconds
  function tone(out, t, dur, f, lvl, o = {}) {
    const osc = ctx.createOscillator();
    if (o.harm) osc.setPeriodicWave(wave(o.harm));
    const fc = curve(f, Math.max(8, Math.min(256, Math.ceil(dur * 300))));
    osc.frequency.value = fc[0];
    osc.frequency.setValueCurveAtTime(fc, t, dur);
    const nodes = [osc];
    if (o.vib) {
      const lfo = ctx.createOscillator(), d = gain(o.vib[1]);
      lfo.frequency.value = o.vib[0];
      lfo.connect(d).connect(osc.frequency);
      nodes.push(lfo);
    }
    const env = gain(0);
    env.gain.setValueCurveAtTime(envelope(dur, lvl, o.shape, o.atk, o.rel), t, dur);
    let head = osc;
    if (o.am) {
      const am = gain(1 - o.am[1] / 2), lfo = ctx.createOscillator(), d = gain(o.am[1] / 2);
      lfo.frequency.value = o.am[0];
      lfo.connect(d).connect(am.gain);
      head = head.connect(am);
      nodes.push(lfo);
    }
    head.connect(env).connect(out);
    for (const n of nodes) { n.start(t); n.stop(t + dur + 0.02); }
  }

  // A burst of band-passed noise, for harsh calls and woodpecker knocks.
  const noiseBuf = (() => {
    const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = rnd() * 2 - 1;
    return b;
  })();
  function hiss(out, t, dur, f, q, lvl, o = {}) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    // two bandpasses in series: one alone has skirts so gentle the noise
    // still hisses right up the spectrum
    const fc = curve(f, 32);
    const bands = [0, 1].map(() => {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = q;
      bp.frequency.value = fc[0];
      bp.frequency.setValueCurveAtTime(fc, t, dur);
      return bp;
    });
    const env = gain(0);
    env.gain.setValueCurveAtTime(envelope(dur, lvl, o.shape, o.atk ?? 0.004, o.rel ?? 0.02), t, dur);
    src.connect(bands[0]).connect(bands[1]).connect(env).connect(out);
    src.start(t, rnd() * 1.5); src.stop(t + dur + 0.02);
  }

  // --- placement -----------------------------------------------------------
  // distance 0 = the next tree, 1 = across the clearing. Air soaks up the
  // highs with distance, so far birds get darker as well as quieter.
  function perch(bed, distance, pan = between(-0.85, 0.85)) {
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 16000 - distance * 11000; lp.Q.value = 0.5;
    const out = gain(1);
    out.connect(lp).connect(p).connect(bed);
    lp.connect(gain(0.2 + distance * 0.7)).connect(verbIn);
    return { out, pan: p.pan, level: 1 - distance * 0.65 };
  }

  const voice = { tone, hiss, between, pick, rnd };

  // --- who's around --------------------------------------------------------
  const inSeason = (sp, m) => {
    const [a, b] = sp.months;
    return a <= b ? m >= a && m <= b : m >= a || m <= b;
  };
  const singing = (sp, m) => !sp.songMonths || inSeason({ months: sp.songMonths }, m);

  function available(kind) {
    const m = month();
    if (solo) return SPECIES[solo]?.kind === kind ? [[solo, SPECIES[solo]]] : [];
    return Object.entries(SPECIES).filter(([, sp]) => sp.kind === kind && inSeason(sp, m) && weightOf(sp) > 0);
  }

  const weightOf = sp => (Array.isArray(sp.weight) ? sp.weight[month() - 1] : sp.weight);

  function weighted(list) {
    const total = list.reduce((s, [, sp]) => s + weightOf(sp), 0);
    let r = rnd() * total;
    for (const e of list) { r -= weightOf(e[1]); if (r <= 0) return e; }
    return list[list.length - 1];
  }

  // the dawn-to-summer peak of song, thinning through fall to a quiet winter
  const CAST_BY_MONTH = [2, 2, 2, 3, 5, 5, 4, 3, 3, 3, 2, 2];

  // residents: birds holding a spot and singing a bout from it
  let cast = [];
  function recruit(now) {
    const pool = available('resident').filter(([name, sp]) => sp.flock || solo || !cast.some(b => b.name === name));
    if (!pool.length) return;
    const [name, sp] = weighted(pool);
    const distance = between(sp.near ?? 0.1, sp.far ?? 1);
    const spot = perch(day, distance);
    cast.push({
      name, sp, spot,
      lvl: 0.05 * spot.level * (sp.loud ?? 1),
      pitch: between(0.94, 1.06),           // each bird has its own key
      state: {},                             // per-bird memory (song type, etc.)
      next: now + between(0.3, 4),
      leave: now + between(...(sp.stay ?? [45, 150])),
    });
  }

  function sing(b, now) {
    const m = month();
    const useSong = !b.sp.call || (singing(b.sp, m) && rnd() > (b.sp.callShare ?? 0.2));
    const act = useSong ? b.sp.song : b.sp.call;
    const len = act(voice, b.spot.out, now + 0.05, b.lvl, b) || 2;
    const [lo, hi] = useSong ? b.sp.every : (b.sp.callEvery ?? b.sp.every);
    b.next = now + len + between(lo, hi);
  }

  // passers-by: geese overhead, a woodpecker drumming across the stand
  let nextFlyby = 0;
  function flyby(now) {
    const pool = available('flyby');
    if (pool.length) {
      const [, sp] = weighted(pool);
      const spot = perch(day, between(0.3, 0.8), 0);
      sp.pass(voice, spot, now + 0.05, 0.05 * spot.level * (sp.loud ?? 1));
    }
    nextFlyby = now + (solo ? between(10, 16) : between(40, 120));
  }

  // night: loons out on the water, owls in the woods
  let nextNight = 0;
  function nightCall(now) {
    const pool = available('night');
    if (pool.length) {
      const [, sp] = weighted(pool);
      const spot = perch(night, between(0.45, 0.95));
      sp.song(voice, spot.out, now + 0.05, 0.05 * spot.level * (sp.loud ?? 1), { pitch: between(0.95, 1.05), state: {} });
    }
    nextNight = now + (solo ? between(8, 14) : between(25, 75));
  }

  return {
    day(now) {
      const want = solo ? 1 : CAST_BY_MONTH[month() - 1];
      cast = cast.filter(b => now < b.leave);
      while (cast.length < want && available('resident').length) {
        const before = cast.length;
        recruit(now);
        if (cast.length === before) break;
      }
      for (const b of cast) if (now >= b.next) sing(b, now);
      if (!nextFlyby) nextFlyby = now + (solo ? 1 : between(15, 50));
      if (now >= nextFlyby) flyby(now);
    },
    night(now) {
      if (!nextNight) nextNight = now + (solo ? 1 : between(12, 40));
      if (now >= nextNight) nightCall(now);
    },
    // coming back to day: a fresh set of neighbours, not the ones from before
    reset() { cast = []; nextFlyby = 0; nextNight = 0; },
  };
}
