// Ambient beds for the main site: day (wind, leaves, birdsong) and night
// (a soft breeze, tree crickets, a rare distant owl). Everything is
// synthesized live with Web Audio, the same approach as Driftglass: nothing
// to download, and nothing loops audibly because every call is rolled fresh.
//
// Loaded on demand by the Sound toggle in Base.astro, which owns the
// AudioContext (it has to be created inside the user's tap for iOS).

const LEVEL = 0.55;        // master level once faded in
const WIND_LEVEL = 0.75;   // day and night wind beds, relative to the rest
const FADE_IN_TC = 0.9;    // setTargetAtTime time constants, in seconds
const FADE_OUT_TC = 0.35;
const CROSSFADE_TC = 0.9;  // day ↔ night, roughly matches the visual crossfade
const TICK_MS = 200;       // scheduler cadence
const LOOKAHEAD = 0.6;     // seconds of chirps scheduled ahead of the clock

export function createAmbient(ctx) {
  const rnd = Math.random;
  const between = (a, b) => a + rnd() * (b - a);

  const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
  const filt = (type, f, q = 0.7) => {
    const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b;
  };
  const glide = (param, v, tc) => param.setTargetAtTime(v, ctx.currentTime, tc);

  // --- noise sources -------------------------------------------------------
  // Stereo buffers whose channels differ, so the wind has width. The ends are
  // crossfaded so the loop has no click.
  function noiseBuffer(kind, secs = 8) {
    const n = Math.floor(ctx.sampleRate * secs);
    const buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < n; i++) {
        const w = rnd() * 2 - 1;
        if (kind === 'brown') {
          last = (last + 0.02 * w) / 1.02;
          d[i] = last * 3.2;
        } else { // Paul Kellet's pink noise filter
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.969 * b2 + w * 0.153852;    b3 = 0.8665 * b3 + w * 0.3104856;
          b4 = 0.55 * b4 + w * 0.5329522;    b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
          b6 = w * 0.115926;
        }
      }
      const x = Math.floor(ctx.sampleRate * 0.25);
      for (let i = 0; i < x; i++) { const a = i / x; d[i] = d[i] * a + d[n - x + i] * (1 - a); }
    }
    return buf;
  }
  function loop(buf, rate = 1) {
    const s = ctx.createBufferSource();
    s.buffer = buf; s.loop = true; s.loopEnd = buf.duration - 0.25; s.playbackRate.value = rate;
    s.start(0, rnd() * 3);
    return s;
  }

  // a short, soft room so calls sit in the trees instead of in your ear
  function impulse(secs, decay) {
    const n = Math.floor(ctx.sampleRate * secs);
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }

  // --- graph ---------------------------------------------------------------
  // day/night beds → master → rumble cut → gentle compressor → speakers.
  // Brown noise piles energy below 20 Hz that nobody hears but that would
  // still pump the compressor, hence the high-pass.
  const master = gain(0);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -22; comp.knee.value = 12; comp.ratio.value = 3;
  comp.attack.value = 0.02; comp.release.value = 0.4;
  master.connect(filt('highpass', 40)).connect(comp).connect(ctx.destination);

  const verb = ctx.createConvolver();
  verb.buffer = impulse(2.8, 3);
  const verbIn = gain(1);
  verbIn.connect(verb).connect(gain(0.4)).connect(master);

  const day = gain(0);
  const night = gain(0);
  day.connect(master);
  night.connect(master);

  const pink = noiseBuffer('pink');
  const brown = noiseBuffer('brown');

  // day wind: pink noise through a wide bandpass; gusts move its centre and level
  const dayWind = gain(WIND_LEVEL);
  dayWind.connect(day);
  const windF = filt('bandpass', 450, 0.6);
  const windG = gain(0.2);
  loop(pink).connect(windF).connect(windG).connect(dayWind);
  // leaf rustle rides on top of the gusts
  const leafG = gain(0.01);
  loop(pink, 1.13).connect(filt('highpass', 3500)).connect(leafG).connect(dayWind);
  // low body so the wind isn't all hiss
  loop(brown).connect(filt('lowpass', 220)).connect(gain(0.3)).connect(dayWind);

  // night: darker and quieter, mostly low rumble with a hint of air
  const nightWindF = filt('lowpass', 380, 0.5);
  const nightWindG = gain(0.1);
  loop(brown, 0.9).connect(nightWindF).connect(nightWindG).connect(gain(WIND_LEVEL)).connect(night);

  // --- day: gusts ----------------------------------------------------------
  let nextGust = 0;
  function gust(now) {
    const g = rnd(); // 0 = lull, 1 = proper gust
    const tc = between(1.2, 3.5);
    windG.gain.setTargetAtTime(0.1 + 0.26 * g, now, tc);
    windF.frequency.setTargetAtTime(300 + 550 * g, now, tc);
    leafG.gain.setTargetAtTime(0.003 + 0.028 * g * g, now, tc * 0.8);
    nightWindG.gain.setTargetAtTime(0.06 + 0.1 * g, now, tc);
    nightWindF.frequency.setTargetAtTime(260 + 260 * g, now, tc);
    nextGust = now + between(3, 9);
  }

  // --- day: birds ----------------------------------------------------------
  // One whistled note: a sine with a pitch glide and optional vibrato,
  // placed somewhere in the stereo field. Far-off birds are quieter and wetter.
  function note(t0, dur, f0, f1, lvl, dest, vibHz = 0, vibDepth = 0) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    if (vibHz) {
      const vib = ctx.createOscillator(); const vg = gain(vibDepth);
      vib.frequency.value = vibHz; vib.connect(vg).connect(o.frequency);
      vib.start(t0); vib.stop(t0 + dur + 0.05);
    }
    const e = gain(0);
    e.gain.setValueAtTime(0, t0);
    e.gain.linearRampToValueAtTime(lvl, t0 + Math.min(0.02, dur * 0.3));
    e.gain.setTargetAtTime(0, t0 + dur * 0.6, dur * 0.15);
    o.connect(e).connect(dest);
    o.start(t0); o.stop(t0 + dur + 0.1);
  }

  function birdVoice(distance) {
    const pan = ctx.createStereoPanner();
    pan.pan.value = between(-0.85, 0.85);
    const out = gain(1);
    const send = gain(0.25 + distance * 0.6);
    out.connect(pan).connect(day);
    out.connect(send).connect(verbIn);
    return out;
  }

  const SONGS = [
    // "fee-bee-bee": one high whistle, then two or four lower ones
    (t, out, lvl) => {
      const hi = between(3300, 3900);
      const lows = rnd() < 0.5 ? 2 : 4;
      note(t, 0.32, hi, hi * 0.97, lvl, out);
      for (let k = 0; k < lows; k++) {
        const at = t + 0.42 + k * 0.34;
        note(at, 0.26, hi * 0.86, hi * 0.83, lvl * (0.9 - k * 0.06), out);
      }
    },
    // dry trill: a quick run of identical chips
    (t, out, lvl) => {
      const n = 8 + Math.floor(rnd() * 9), f = between(4200, 5200), step = between(0.055, 0.075);
      for (let k = 0; k < n; k++) note(t + k * step, 0.035, f * 1.15, f * 0.8, lvl * 0.7, out);
    },
    // warbler: short phrases of gliding, fluttering notes
    (t, out, lvl) => {
      const phrases = 2 + Math.floor(rnd() * 3);
      let at = t;
      for (let p = 0; p < phrases; p++) {
        const notes = 2 + Math.floor(rnd() * 2);
        for (let k = 0; k < notes; k++) {
          const f = between(2100, 3300), dur = between(0.12, 0.22);
          note(at, dur, f, f * between(0.85, 1.2), lvl * 0.8, out, between(18, 30), f * 0.03);
          at += dur + 0.04;
        }
        at += between(0.15, 0.35);
      }
    },
    // a couple of bright upslurred tweets
    (t, out, lvl) => {
      const n = 1 + Math.floor(rnd() * 3), f = between(2800, 3400);
      for (let k = 0; k < n; k++) note(t + k * 0.16, 0.09, f, f * 1.45, lvl * 0.8, out);
    },
  ];

  let nextBird = 0;
  function bird(now) {
    const distance = rnd();
    const lvl = 0.05 * (1 - distance * 0.7);
    const song = SONGS[Math.floor(rnd() * SONGS.length)];
    song(now + 0.05, birdVoice(distance), lvl);
    // sometimes a second bird answers from elsewhere
    if (rnd() < 0.3) song(now + between(1.2, 2.2), birdVoice(rnd()), lvl * 0.7);
    nextBird = now + between(2.5, 9);
  }

  // --- night: crickets -----------------------------------------------------
  // Tree crickets: a soft, low (~2.1-2.5 kHz) pulse on a steady beat, the
  // gentle end of the cricket spectrum. Each one sings in short runs with
  // long rests, so there are stretches of just breeze instead of a drone.
  const crickets = [0, 1, 2].map(() => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = between(2100, 2500);
    const env = gain(0);
    const pan = ctx.createStereoPanner();
    pan.pan.value = between(-0.9, 0.9);
    const send = gain(0.5);
    osc.connect(env).connect(pan).connect(night);
    pan.connect(send).connect(verbIn);
    osc.start();
    return {
      env,
      level: between(0.005, 0.011),
      period: between(0.48, 0.7),   // seconds between chirps
      pulses: 2 + Math.floor(rnd() * 3),
      singing: false,
      nextChirp: 0,
      switchAt: 0,
    };
  });

  function cricketTick(c, now) {
    if (now >= c.switchAt) {
      c.singing = !c.singing;
      c.switchAt = now + (c.singing ? between(4, 12) : between(10, 35));
      c.nextChirp = now + 0.05;
    }
    if (!c.singing) return;
    while (c.nextChirp < now + LOOKAHEAD) {
      const t = c.nextChirp;
      for (let p = 0; p < c.pulses; p++) {
        const pt = t + p * 0.028;
        c.env.gain.setValueAtTime(0, pt);
        c.env.gain.linearRampToValueAtTime(c.level, pt + 0.006);
        c.env.gain.linearRampToValueAtTime(0, pt + 0.02);
      }
      c.nextChirp = t + c.period * between(0.97, 1.03);
    }
  }

  // a great horned owl, far off and rare: hoo, h'HOO, hoo, hoo
  let nextOwl = 0;
  function owl(now) {
    const out = gain(1);
    const pan = ctx.createStereoPanner();
    pan.pan.value = between(-0.7, 0.7);
    const lp = filt('lowpass', 900);
    out.connect(lp).connect(pan).connect(night);
    pan.connect(gain(0.9)).connect(verbIn);
    const f = between(300, 360), lvl = 0.045;
    const t = now + 0.05;
    note(t, 0.35, f, f * 0.96, lvl, out);
    note(t + 0.55, 0.12, f * 0.98, f, lvl * 0.7, out);
    note(t + 0.7, 0.45, f * 1.04, f * 0.95, lvl, out);
    note(t + 1.35, 0.35, f, f * 0.95, lvl * 0.85, out);
    note(t + 1.9, 0.35, f * 0.98, f * 0.93, lvl * 0.75, out);
    nextOwl = now + between(45, 110);
  }

  // --- scheduler -----------------------------------------------------------
  let isNight = false;
  let timer = null;
  let stopTimer = null;

  function tick() {
    const now = ctx.currentTime;
    if (now >= nextGust) gust(now);
    if (isNight) {
      crickets.forEach(c => cricketTick(c, now));
      if (nextOwl && now >= nextOwl) owl(now);
    } else if (now >= nextBird) {
      bird(now);
    }
  }

  function setNight(night_) {
    isNight = night_;
    glide(day.gain, isNight ? 0 : 1, CROSSFADE_TC);
    glide(night.gain, isNight ? 1 : 0, CROSSFADE_TC);
    const now = ctx.currentTime;
    if (isNight) {
      if (!nextOwl) nextOwl = now + between(20, 60);
      crickets.forEach((c, i) => { c.singing = false; c.switchAt = now + i * between(0.5, 2); });
    } else {
      nextBird = now + between(1, 3);
    }
  }

  return {
    start(night_) {
      clearTimeout(stopTimer);
      setNight(night_);
      glide(master.gain, LEVEL, FADE_IN_TC);
      if (!timer) timer = setInterval(tick, TICK_MS);
    },
    stop() {
      glide(master.gain, 0, FADE_OUT_TC);
      clearTimeout(stopTimer);
      // let the fade finish, then park the clock so nothing runs while off
      stopTimer = setTimeout(() => {
        clearInterval(timer);
        timer = null;
        ctx.suspend();
      }, FADE_OUT_TC * 5000);
    },
    setNight,
  };
}
