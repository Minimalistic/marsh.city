// Northern Minnesota birds, one entry per species. Numbers come from
// spectrogram measurements (Birds of the World, Cornell, published papers)
// where they exist; the few marked "est." are best guesses by ear.
//
// Each entry:
//   kind     resident (holds a spot and sings bouts) or night
//   months   [from, to] present near Duluth; songMonths when it sings
//            rather than just calls (outside those it only calls)
//   weight   how common, a number or one value per month
//   every    [min, max] seconds of rest between songs (callEvery for calls)
//   near/far distance range (0 next tree .. 1.5 far treeline), loud relative level
//   answers  false to stop far neighbours replying; match(b, n) to shape a reply
//   duet     night: a mate answers at this pitch ratio
//   song/call(v, out, t, lvl, bird) schedule notes, return seconds used
//
// v.tone(out, t, dur, freq, lvl, opts) and v.hiss(out, t, dur, freq, q, lvl)
// are the primitives in birds.js; bird.pitch is that bird's own key and
// bird.state lets it remember its song types between songs.

const H_NASAL = [0.5, 1, 0.9, 0.7, 0.5, 0.35, 0.22, 0.12];

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
    // countersinging chickadees match each other's pitch
    match(b, n) { if (b.state.fee) { n.state.fee = b.state.fee; n.state.left = 3; } },
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

  // short robin-like phrases, one every second or so, all day: a
  // "question" ending up, then an "answer" ending down
  vireo: {
    kind: 'resident', months: [5, 9], songMonths: [5, 8], weight: [0, 0, 0, 0, 4, 5, 5, 3, 1, 0, 0, 0],
    every: [0.6, 1.2], callEvery: [6, 15], stay: [60, 180], answers: false,  // sings nonstop; replies would pile up
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

  // --- night ---------------------------------------------------------------

  // Common loon, far out on the lake, now and then: just the tremolo, the
  // quick laughing call (~10 pulses a second, 1.5-7 pulses, 1-2
  // harmonics). Always distant, with a faint darker echo off the far
  // shore. Rare on purpose: one every several minutes at most.
  loon: {
    kind: 'night', months: [4, 11], weight: [0, 0, 0, 0.2, 0.3, 0.3, 0.3, 0.3, 0.2, 0.2, 0.1, 0],
    near: 0.95, far: 1.5, loud: 1.1,
    song(v, out, t, lvl, b) {
      const f = v.between(900, 1050) * b.pitch, rate = v.between(9, 11);
      const d = Math.round(v.between(3, 7)) / rate + 0.3;
      const trem = (at, a, harm) => v.tone(out, at, d, [f * 0.98, f * 1.03, f * 1.01, f * 0.96], a,
        { harm, am: [rate, 0.85], vib: [rate, f * 0.04], atk: 0.12, rel: 0.25, shape: [0.6, 1, 0.9, 0.7] });
      trem(t, lvl, [1, 0.3, 0.08]);
      trem(t + v.between(0.45, 0.7), lvl * 0.2, [1, 0.06]);
      return d + 0.7;
    },
  },

  // great horned owl: low (300-400 Hz), breathy, "hoo, h'HOO, hoo, hoo"
  horned: {
    kind: 'night', months: [1, 12], weight: [3, 3, 2, 1, 1, 1, 1, 1, 2, 3, 3, 3], loud: 2,
    duet: 1.15,  // pairs call back and forth; the female's hoot is higher
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
