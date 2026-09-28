// Northern Minnesota birds, one entry per species. Numbers come from
// spectrogram measurements (Birds of the World, Cornell, published papers)
// where they exist; the few marked "est." are best guesses by ear.
//
// Each entry:
//   kind     resident (holds a spot and sings bouts), flyby, or night
//   months   [from, to] present near Duluth; songMonths when it sings
//            rather than just calls (outside those it only calls)
//   weight   how common, a number or one value per month
//   every    [min, max] seconds of rest between songs (callEvery for calls)
//   near/far distance range, loud relative level
//   song/call(v, out, t, lvl, bird) schedule notes, return seconds used
//
// v.tone(out, t, dur, freq, lvl, opts) and v.hiss(out, t, dur, freq, q, lvl)
// are the primitives in birds.js; bird.pitch is that bird's own key and
// bird.state lets it remember its song types between songs.

const H_NASAL = [0.5, 1, 0.9, 0.7, 0.5, 0.35, 0.22, 0.12];
const H_HOARSE = [1, 0.8, 0.9, 0.7, 0.6, 0.45, 0.35, 0.25, 0.18, 0.12];
const H_HOOT = [1, 0.18, 0.05];

// a song repertoire, made once per bird and reused, the way real birds do
function repertoire(b, key, n, make) {
  return (b.state[key] ??= Array.from({ length: n }, make));
}

export const SPECIES = {
  // "fee-bee": a falling whistle then a level one about 20% lower, the bee
  // with a small dip in the middle. Holds one key for 31-41 songs, then
  // transposes the whole song while keeping the interval.
  chickadee: {
    kind: 'resident', months: [1, 12], songMonths: [2, 6], weight: 5, flock: true,
    every: [2, 4.5], callEvery: [4, 12], callShare: 0.3,
    song(v, out, t, lvl, b) {
      const s = b.state;
      if (!s.fee || --s.left <= 0) { s.fee = v.between(3900, 4300); s.left = Math.round(v.between(31, 41)); }
      const f = s.fee;
      v.tone(out, t, 0.38, [f, f * 0.97, f * 0.92], lvl);
      v.tone(out, t + 0.46, 0.4, [f * 0.8, f * 0.79], lvl * 0.9, { shape: [1, 1, 0.5, 1, 0.9] });
      return 0.9;
    },
    // chick-a-dee-dee: two high sweeps, then nasal buzzy dees (more dees = more alarmed)
    call(v, out, t, lvl, b) {
      v.tone(out, t, 0.04, [8500 * b.pitch, 5500 * b.pitch], lvl * 0.7);
      v.tone(out, t + 0.07, 0.04, [7200 * b.pitch, 4600 * b.pitch], lvl * 0.6);
      const dees = 2 + Math.floor(v.rnd() * 4), f = 470 * b.pitch;
      for (let k = 0; k < dees; k++) {
        v.tone(out, t + 0.16 + k * 0.19, 0.15, [f * 0.97, f * 1.02, f], lvl * 0.8,
          { harm: [0.05, 0.1, 0.2, 0.35, 0.6, 0.85, 1, 0.9, 0.7, 0.45, 0.25, 0.12], am: [60, 0.4] });
      }
      return 0.3 + dees * 0.19;
    },
  },

  // two long pure whistles then repeated three-note (or, spreading east
  // from the Rockies, two-note) phrases: "oh sweet canada canada canada"
  whitethroat: {
    kind: 'resident', months: [4, 10], songMonths: [4, 9], weight: [0, 0, 0, 3, 5, 5, 4, 3, 4, 3, 0, 0],
    every: [6, 14], callEvery: [3, 8], near: 0.15,
    song(v, out, t, lvl, b) {
      const s = b.state;
      if (!s.lo) {
        s.lo = v.between(2900, 3600);
        s.hi = s.lo * v.pick([1.26, 1.33, 1.2, 0.9]);  // most step up; some birds sing it falling
        s.group = v.rnd() < 0.4 ? 2 : 3;
      }
      let at = t;
      v.tone(out, at, 0.6, [s.lo, s.lo * 0.995], lvl); at += 0.72;
      v.tone(out, at, 0.5, [s.hi, s.hi * 0.99], lvl); at += 0.64;
      const groups = 3 + Math.floor(v.rnd() * 2);
      for (let g = 0; g < groups; g++) {
        for (let k = 0; k < s.group; k++) {
          v.tone(out, at, 0.13, [s.hi * 1.03, s.hi * 0.97], lvl * (0.95 - g * 0.08));
          at += 0.16;
        }
        at += 0.03;
      }
      return at - t;
    },
    call(v, out, t, lvl) {  // sharp "chink"
      v.tone(out, t, 0.03, [6200, 4200], lvl * 0.6, { harm: [1, 0.4, 0.2] });
      return 0.1;
    },
  },

  // Built on true overtone ratios: an intro whistle, then a quick flutey
  // cascade from the same harmonic series with a second voice overlapping.
  // Each song is one of the bird's song types, at a new pitch every time.
  hermitthrush: {
    kind: 'resident', months: [4, 10], songMonths: [5, 8], weight: [0, 0, 0, 1, 3, 3, 3, 2, 1, 1, 0, 0],
    every: [3, 6], callEvery: [5, 12], near: 0.3,
    song(v, out, t, lvl, b) {
      const types = repertoire(b, 'types', 6, () => ({
        f0: v.between(1000, 1250) * 2 ** v.between(-0.5, 0.9),
        steps: Array.from({ length: 6 + Math.floor(v.rnd() * 4) }, () => v.pick([4, 5, 6, 6, 7, 8])),
      }));
      let k = Math.floor(v.rnd() * types.length);
      if (k === b.state.last) k = (k + 1) % types.length;
      b.state.last = k;
      const { f0, steps } = types[k];
      v.tone(out, t, 0.32, [f0 * 3, f0 * 3.02], lvl * 0.8, { atk: 0.04 });
      let at = t + 0.36;
      for (const h of steps) {
        const d = v.between(0.05, 0.08);
        v.tone(out, at, d, [f0 * h * 0.97, f0 * h], lvl * 0.7, { atk: 0.006 });
        v.tone(out, at + 0.012, d, [f0 * (h + 1) * 0.98, f0 * (h + 1)], lvl * 0.3);
        at += d + 0.012;
      }
      return at - t + 0.2;
    },
    call(v, out, t, lvl) {  // low "chuck"
      v.tone(out, t, 0.05, [1800, 1500], lvl * 0.6, { harm: [1, 0.5, 0.3] });
      return 0.1;
    },
  },

  // "vee-ur vee-ur veer veer": a rolling, fluttering phrase stepping down
  // in a spiral, two voices at once
  veery: {
    kind: 'resident', months: [5, 9], songMonths: [5, 7], weight: [0, 0, 0, 0, 2, 3, 2, 1, 1, 0, 0, 0],
    every: [3, 7], callEvery: [6, 14], near: 0.35,
    song(v, out, t, lvl, b) {
      let f = v.between(4300, 4800) * b.pitch, at = t;
      const n = 4 + Math.floor(v.rnd() * 2);
      for (let k = 0; k < n; k++) {
        const d = 0.34;
        v.tone(out, at, d, [f, f * 0.92], lvl * (1 - k * 0.1), { vib: [v.between(24, 30), f * 0.07] });
        v.tone(out, at, d, [f * 0.84, f * 0.78], lvl * 0.35 * (1 - k * 0.1), { vib: [27, f * 0.05] });
        at += d + 0.04; f *= 0.87;
      }
      return at - t;
    },
    call(v, out, t, lvl) {  // "veer"
      v.tone(out, t, 0.28, [3000, 2600, 2100], lvl * 0.7);
      return 0.3;
    },
  },

  // short robin-like phrases, one every second or so, all day: a
  // "question" ending up, then an "answer" ending down
  vireo: {
    kind: 'resident', months: [5, 9], songMonths: [5, 8], weight: [0, 0, 0, 0, 4, 5, 5, 3, 1, 0, 0, 0],
    every: [0.6, 1.2], callEvery: [6, 15], stay: [60, 180],
    song(v, out, t, lvl, b) {
      const up = (b.state.q = !b.state.q);
      const n = 2 + Math.floor(v.rnd() * 3);
      let at = t;
      for (let k = 0; k < n; k++) {
        const f = v.between(2400, 4200) * b.pitch, d = v.between(0.07, 0.12);
        const last = k === n - 1;
        const to = last ? (up ? f * 1.35 : f * 0.7) : f * v.between(0.8, 1.25);
        v.tone(out, at, d, [f, (f + to) / 2 * 1.05, to], lvl * 0.85);
        at += d + 0.03;
      }
      return at - t;
    },
    call(v, out, t, lvl) {  // nasal whining "myah"
      v.tone(out, t, 0.2, [2600, 2800, 2200], lvl * 0.5, { harm: H_NASAL });
      return 0.25;
    },
  },

  // "teacher TEACHER TEACHER", 8-13 times, getting louder
  ovenbird: {
    kind: 'resident', months: [5, 9], songMonths: [5, 7], weight: [0, 0, 0, 0, 3, 4, 3, 2, 1, 0, 0, 0],
    every: [8, 16], callEvery: [5, 12], near: 0.25, loud: 1.2,
    song(v, out, t, lvl, b) {
      const n = 8 + Math.floor(v.rnd() * 6), p = b.pitch;
      for (let k = 0; k < n; k++) {
        const at = t + k * 0.27, a = lvl * (0.35 + 0.65 * (k / (n - 1)));
        v.tone(out, at, 0.05, [4300 * p, 5200 * p], a * 0.8);
        v.tone(out, at + 0.07, 0.03, [5200 * p, 4600 * p], a * 0.6);
        v.tone(out, at + 0.12, 0.08, [5100 * p, 4200 * p], a);
      }
      return n * 0.27;
    },
    call(v, out, t, lvl) {
      v.tone(out, t, 0.03, [5200, 3800], lvl * 0.6, { harm: [1, 0.3] });
      return 0.1;
    },
  },

  // 5-10 seconds of tumbling notes and trills, 3-8.5 kHz, far too fast
  // to follow. A few fixed song types per bird.
  winterwren: {
    kind: 'resident', months: [4, 10], songMonths: [4, 7], weight: [0, 0, 0, 1, 2, 2, 2, 1, 1, 0, 0, 0],
    every: [8, 16], callEvery: [5, 12], near: 0.2, far: 0.7,
    song(v, out, t, lvl, b) {
      const songs = repertoire(b, 'songs', 4, () => {
        const ev = []; let at = 0;
        while (at < v.between(5, 7.5)) {
          if (v.rnd() < 0.45) {  // a trill: one note repeated 25-40 times a second
            const f = v.between(4000, 7500), step = 1 / v.between(25, 40), n = Math.floor(v.between(6, 16));
            for (let k = 0; k < n; k++) ev.push([at + k * step, step * 0.7, f * 1.08, f * 0.9]);
            at += n * step + 0.02;
          } else {                // a run of quick slurred notes
            const n = Math.floor(v.between(4, 10));
            for (let k = 0; k < n; k++) {
              const f = v.between(3100, 8500), d = v.between(0.025, 0.05);
              ev.push([at, d, f, f * v.between(0.75, 1.3)]); at += d + 0.012;
            }
            at += 0.02;
          }
        }
        return ev;
      });
      const song = v.pick(songs);
      for (const [at, d, f0, f1] of song) v.tone(out, t + at, d, [f0, f1], lvl * 0.75, { atk: 0.004, rel: 0.008 });
      const [at, d] = song[song.length - 1];
      return at + d;
    },
    call(v, out, t, lvl) {  // "chimp chimp"
      for (let k = 0; k < 2; k++) v.tone(out, t + k * 0.15, 0.04, [5400, 4200], lvl * 0.6, { harm: [1, 0.4] });
      return 0.25;
    },
  },

  // "zee zee zoo zee": buzzy notes, the zoo lower, the last one falling
  btgreen: {
    kind: 'resident', months: [5, 9], songMonths: [5, 7], weight: [0, 0, 0, 0, 3, 4, 3, 1, 1, 0, 0, 0],
    every: [5, 11], callEvery: [6, 14], near: 0.35,
    song(v, out, t, lvl, b) {
      const p = b.pitch, buzz = { am: [v.between(85, 115), 0.9] };
      const zees = v.rnd() < 0.5 ? 3 : 4;
      let at = t;
      for (let k = 0; k < zees; k++) { v.tone(out, at, 0.2, [4800 * p, 4850 * p], lvl * 0.7, buzz); at += 0.27; }
      v.tone(out, at, 0.28, [4000 * p, 3900 * p], lvl * 0.8, buzz); at += 0.34;
      v.tone(out, at, 0.26, [5600 * p, 5400 * p, 4600 * p], lvl * 0.8, buzz);
      return at - t + 0.26;
    },
    call(v, out, t, lvl) {  // thin "tsip"
      v.tone(out, t, 0.04, [4200, 4000], lvl * 0.5);
      return 0.1;
    },
  },

  // a musical trill on one pitch: ~22 notes a second for 1-2 seconds
  junco: {
    kind: 'resident', months: [3, 11], songMonths: [3, 7], weight: [0, 0, 2, 4, 3, 3, 2, 2, 4, 5, 3, 0],
    flock: true, every: [4, 10], callEvery: [2, 7],
    song(v, out, t, lvl, b) {
      const trills = repertoire(b, 'trills', 3, () => ({ f: v.between(4600, 6500), rate: v.between(19, 24.5) }));
      const { f, rate } = v.pick(trills), n = Math.floor(v.between(20, 42));
      for (let k = 0; k < n; k++) v.tone(out, t + k / rate, 0.8 / rate, [f * 1.12, f * 0.86], lvl * 0.7, { atk: 0.004, rel: 0.01 });
      return n / rate;
    },
    call(v, out, t, lvl) {  // flock twitter: a few sharp "tsik"s
      const n = 1 + Math.floor(v.rnd() * 3);
      for (let k = 0; k < n; k++) v.tone(out, t + k * v.between(0.1, 0.3), 0.02, [7000, 5600], lvl * 0.5, { harm: [1, 0.3] });
      return 0.6;
    },
  },

  // unhurried caroling: two- and three-note whistled phrases with pauses,
  // the odd thin high "hisselly" note tucked between
  robin: {
    kind: 'resident', months: [3, 10], songMonths: [4, 7], weight: [0, 0, 2, 4, 4, 4, 3, 2, 2, 1, 0, 0],
    every: [2, 5], callEvery: [4, 12], near: 0.2,
    song(v, out, t, lvl, b) {
      const phrases = repertoire(b, 'phrases', 8, () =>
        Array.from({ length: 2 + Math.floor(v.rnd() * 2) }, () => {
          const f = v.between(2000, 3600);
          return [v.between(0.1, 0.18), f, f * v.between(0.8, 1.25)];
        }));
      let at = t;
      const n = 4 + Math.floor(v.rnd() * 5);
      for (let k = 0; k < n; k++) {
        for (const [d, f0, f1] of v.pick(phrases)) {
          v.tone(out, at, d, [f0, (f0 + f1) / 2 * 1.04, f1], lvl * 0.8, { harm: [1, 0.08] });
          at += d + 0.04;
        }
        if (v.rnd() < 0.25) { v.tone(out, at, 0.08, [6500, 5200], lvl * 0.25); at += 0.1; }
        at += v.between(0.25, 0.5);
      }
      return at - t;
    },
    call(v, out, t, lvl) {  // "tut tut tut"
      const n = 2 + Math.floor(v.rnd() * 3);
      for (let k = 0; k < n; k++) v.tone(out, t + k * 0.22, 0.05, [2800, 3100, 2600], lvl * 0.6, { harm: [1, 0.5, 0.25] });
      return n * 0.22;
    },
  },

  // tin-horn "yank yank": nasal, heavy harmonics; fundamental est. ~1.6 kHz
  nuthatch: {
    kind: 'resident', months: [1, 12], weight: 3, every: [3, 10], near: 0.2,
    song(v, out, t, lvl, b) {
      const n = 2 + Math.floor(v.rnd() * 6), f = 1600 * b.pitch;
      let at = t;
      for (let k = 0; k < n; k++) {
        v.tone(out, at, 0.1, [f * 0.95, f * 1.04, f], lvl * 0.6, { harm: H_NASAL });
        at += v.between(0.28, 0.5);
      }
      return at - t;
    },
  },

  // harsh "jeer" (broadband, fundamental ~800 Hz, energy to 3 kHz+), and
  // now and then the tonal "queedle" at ~1.6 kHz. Busiest in the fall.
  bluejay: {
    kind: 'resident', months: [1, 12], weight: [2, 2, 2, 2, 2, 2, 2, 3, 5, 5, 3, 2],
    every: [6, 18], near: 0.2, loud: 1.2,
    song(v, out, t, lvl, b) {
      if (v.rnd() < 0.3) {
        for (let k = 0; k < 2; k++) v.tone(out, t + k * 0.45, 0.3, [1500, 1800, 1620], lvl * 0.7, { harm: [1, 0.3, 0.1] });
        return 0.8;
      }
      const n = 1 + Math.floor(v.rnd() * 3), f = 820 * b.pitch;
      for (let k = 0; k < n; k++) {
        const at = t + k * 0.45;
        v.tone(out, at, 0.34, [f * 0.95, f, f * 0.85], lvl * 0.45, { harm: H_HOARSE, shape: [0.6, 1, 0.8, 0.5] });
        v.hiss(out, at, 0.34, [2600, 3000, 2400], 1.5, lvl * 2.2, { shape: [0.6, 1, 0.8, 0.5] });
      }
      return n * 0.45;
    },
  },

  // caws in twos to fives, hoarse, fundamental est. ~400 Hz; usually off a way
  crow: {
    kind: 'resident', months: [1, 12], weight: 2, every: [8, 25], near: 0.5, loud: 1.3, stay: [30, 90],
    song(v, out, t, lvl, b) {
      const n = 2 + Math.floor(v.rnd() * 4), f = 400 * b.pitch;
      for (let k = 0; k < n; k++) {
        const at = t + k * v.between(0.55, 0.75), d = v.between(0.3, 0.45);
        v.tone(out, at, d, [f * 0.9, f * 1.08, f, f * 0.85], lvl * 0.5, { harm: H_HOARSE });
        v.hiss(out, at, d, 1400, 1, lvl * 1.2);
      }
      return n * 0.7;
    },
  },

  // deep, rolling "gronk", fundamental 200-650 Hz, rough (AM ~40 Hz)
  raven: {
    kind: 'resident', months: [1, 12], weight: 1.5, every: [10, 30], near: 0.4, loud: 1.5, stay: [30, 90],
    song(v, out, t, lvl, b) {
      const n = 1 + Math.floor(v.rnd() * 3), f = v.between(330, 450) * b.pitch;
      for (let k = 0; k < n; k++) {
        v.tone(out, t + k * 1.4, 0.32, [f * 0.9, f * 1.1, f], lvl * 0.6, { harm: H_HOARSE, am: [v.between(35, 45), 0.6] });
      }
      return n * 1.4;
    },
  },

  // "coo-OOO-oo, oo, oo": soft low hoots, the second slurring up and down
  dove: {
    kind: 'resident', months: [4, 10], songMonths: [4, 8], weight: 2,
    every: [12, 25], near: 0.3, loud: 2.2,
    song(v, out, t, lvl, b) {
      const f = 500 * b.pitch, o = { harm: [1, 0.25, 0.08], atk: 0.08, rel: 0.12 };
      v.tone(out, t, 0.35, [f, f * 1.12], lvl * 0.7, o);
      v.tone(out, t + 0.38, 0.6, [f * 1.3, f * 1.4, f * 1.05], lvl, o);
      for (let k = 0; k < 3; k++) v.tone(out, t + 1.35 + k * 0.72, 0.5, [f * 0.98, f * 0.93], lvl * 0.8, o);
      return 3.5;
    },
    call(v, out, t, lvl) {  // wing whistle as one flushes
      v.hiss(out, t, 0.7, [2000, 2400, 1800], 3, lvl * 0.8, { shape: [0.3, 1, 0.8, 1, 0.3] });
      return 0.8;
    },
  },

  // Drums in spring: 11-30 knocks at ~15 a second, faster at the start and
  // end. Otherwise the loud, irregular "wuk wuk wuk" (~740 Hz).
  pileated: {
    kind: 'resident', months: [1, 12], songMonths: [2, 6], weight: 1.5, callShare: 0.5,
    every: [30, 70], near: 0.4, loud: 1.4,
    song(v, out, t, lvl) {
      const n = Math.floor(v.between(11, 30));
      let at = t;
      for (let k = 0; k < n; k++) {
        const u = k / (n - 1), rate = 15.5 * (1 + 0.18 * (Math.abs(u - 0.5) * 2) ** 2);
        v.hiss(out, at, 0.02, 750, 3, lvl * 3 * (1 - u * 0.5), { atk: 0.001, rel: 0.015 });
        v.tone(out, at, 0.03, [220, 160], lvl * 0.6 * (1 - u * 0.5), { atk: 0.001, rel: 0.02 });
        at += 1 / rate;
      }
      return at - t;
    },
    call(v, out, t, lvl, b) {
      const n = Math.floor(v.between(8, 18)), f = 740 * b.pitch;
      let at = t;
      for (let k = 0; k < n; k++) {
        const u = k / n, g = Math.sin(Math.PI * Math.min(1, u * 1.4 + 0.15));
        v.tone(out, at, 0.08, [f * 0.95, f * (1.05 + 0.08 * g), f], lvl * (0.6 + 0.4 * g), { harm: [1, 0.5, 0.3, 0.15] });
        at += v.between(0.12, 0.18);
      }
      return at - t;
    },
  },

  // Canada geese passing over, honking, left to right or back:
  // each honk an atonal "h" then a louder nasal tone that falls at the end
  geese: {
    kind: 'flyby', months: [3, 11], weight: [0, 0, 3, 3, 1, 1, 1, 1, 4, 5, 3, 0], loud: 1.4,
    pass(v, spot, t, lvl) {
      const dur = v.between(9, 15), dir = v.rnd() < 0.5 ? -1 : 1;
      spot.pan.setValueAtTime(-0.95 * dir, t);
      spot.pan.linearRampToValueAtTime(0.95 * dir, t + dur);
      const birds = Array.from({ length: Math.floor(v.between(3, 9)) }, () =>
        v.rnd() < 0.5 ? v.between(300, 420) : v.between(480, 560));
      for (let at = 0.3; at < dur - 0.5; at += v.between(0.12, 0.7)) {
        const f = v.pick(birds), near = 1 - Math.abs(2 * at / dur - 1) * 0.75;
        v.hiss(spot.out, t + at, 0.06, 900, 2, lvl * near * 1.5);
        v.tone(spot.out, t + at + 0.05, v.between(0.18, 0.28), [f * 0.9, f * 1.15, f * 1.1, f * 0.8], lvl * near * 0.6, { harm: H_NASAL });
      }
    },
  },

  // --- night ---------------------------------------------------------------

  // Common loon, out on the lake. The wail: a long tonal "ooo" near
  // 600-750 Hz breaking up into "AAH" and sometimes back. The tremolo:
  // a laughing warble, about 10 pulses a second.
  loon: {
    kind: 'night', months: [4, 11], weight: [0, 0, 0, 2, 4, 4, 4, 3, 3, 2, 1, 0], loud: 1.6,
    song(v, out, t, lvl, b) {
      const f = v.between(620, 740) * b.pitch, o = { harm: [1, 0.35, 0.12, 0.05], atk: 0.25, rel: 0.45, vib: [5, 3] };
      if (v.rnd() < 0.3) {
        const d = v.between(1.2, 2.2);
        v.tone(out, t, d, [f * 1.4, f * 1.5, f * 1.45], lvl * 0.8, { harm: [1, 0.5, 0.2], am: [10, 0.9], vib: [10, 40] });
        return d;
      }
      const d1 = v.between(1.2, 2), d2 = v.between(1.6, 2.6);
      v.tone(out, t, d1, [f, f * 1.05, f * 1.09], lvl * 0.8, o);
      v.tone(out, t + d1 - 0.05, d2, [f * 1.45, f * 1.52, f * 1.5, f * 1.38], lvl, o);
      if (v.rnd() < 0.4) v.tone(out, t + d1 + d2 - 0.1, 1.4, [f * 1.25, f * 1.22, f * 1.1], lvl * 0.7, o);
      return d1 + d2 + 1.3;
    },
  },

  // "who cooks for you, who cooks for you-all": the fourth note of each
  // half accented, the last sliding down
  barredowl: {
    kind: 'night', months: [1, 12], weight: [4, 5, 5, 4, 3, 3, 3, 3, 4, 4, 4, 3], loud: 1.8,
    song(v, out, t, lvl, b) {
      const f = v.between(380, 440) * b.pitch, o = { harm: H_HOOT, atk: 0.04, rel: 0.08 };
      const half = (at, last) => {
        v.tone(out, at, 0.16, [f, f * 1.03], lvl * 0.7, o);
        v.tone(out, at + 0.24, 0.16, [f * 1.05, f * 1.08], lvl * 0.75, o);
        v.tone(out, at + 0.48, 0.18, [f * 1.1, f * 1.14], lvl * 0.8, o);
        v.tone(out, at + 0.74, last ? 0.9 : 0.45, last ? [f * 1.25, f * 1.3, f * 1.1, f * 0.75] : [f * 1.2, f * 1.25, f * 0.95], lvl, o);
      };
      half(t, false);
      half(t + 1.7, true);
      return 3.4;
    },
  },

  // great horned owl: low (300-400 Hz), breathy, "hoo, h'HOO, hoo, hoo"
  horned: {
    kind: 'night', months: [1, 12], weight: [3, 3, 2, 1, 1, 1, 1, 1, 2, 3, 3, 3], loud: 2,
    song(v, out, t, lvl, b) {
      const f = v.between(300, 360) * b.pitch, o = { harm: [1, 0.15], atk: 0.05, rel: 0.12 };
      v.tone(out, t, 0.35, [f, f * 0.96], lvl, o);
      v.tone(out, t + 0.55, 0.12, [f * 0.98, f], lvl * 0.7, o);
      v.tone(out, t + 0.7, 0.45, [f * 1.04, f * 0.95], lvl, o);
      v.tone(out, t + 1.35, 0.35, [f, f * 0.95], lvl * 0.85, o);
      v.tone(out, t + 1.9, 0.35, [f * 0.98, f * 0.93], lvl * 0.75, o);
      return 2.3;
    },
  },
};
