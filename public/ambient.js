// Ambient beds for the main site: day (wind, leaves, birdsong) and night
// (a soft breeze, tree crickets, owls). Everything is
// synthesized live with Web Audio, the same approach as Driftglass: nothing
// to download, and nothing loops audibly because every call is rolled fresh.
//
// Loaded on demand by the Sound toggle in Base.astro, which owns the
// AudioContext (it has to be created inside the user's tap for iOS).

import { createBirds } from './birds.js';

const LEVEL = 0.55;        // master level once faded in
const WIND_LEVEL = 0.56;   // day and night wind beds, relative to the rest
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
  // leaf rustle rides on top of the gusts, flickering as twigs catch the air
  const leafG = gain(0.01);
  const leafFlicker = gain(0);
  loop(pink, 1.13).connect(filt('highpass', 3500)).connect(leafG).connect(leafFlicker).connect(dayWind);
  flicker().connect(leafFlicker.gain);
  // low body so the wind isn't all hiss
  loop(brown).connect(filt('lowpass', 220)).connect(gain(0.3)).connect(dayWind);

  // night: darker and quieter, mostly low rumble with a hint of air
  const nightWindF = filt('lowpass', 380, 0.5);
  const nightWindG = gain(0.1);
  loop(brown, 0.9).connect(nightWindF).connect(nightWindG).connect(gain(WIND_LEVEL)).connect(night);

  // a smooth random wobble (0.3-1, ~9 moves a second) to modulate the leaves;
  // 17 s so it never lines up with the 8 s noise loops, ends where it starts
  function flicker(secs = 17, rate = 9) {
    const n = Math.floor(ctx.sampleRate * secs), pts = Math.floor(secs * rate);
    const knots = Array.from({ length: pts }, () => between(0.3, 1));
    knots.push(knots[0]);
    const b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) {
      const x = (i / n) * pts, k = Math.floor(x), u = x - k;
      d[i] = knots[k] + (knots[k + 1] - knots[k]) * (u * u * (3 - 2 * u));
    }
    const s = ctx.createBufferSource();
    s.buffer = b; s.loop = true; s.start(0, rnd() * secs);
    return s;
  }

  // --- wind movement -------------------------------------------------------
  // Wind moves on several timescales at once: the weather drifts over a
  // minute or so, gusts come at no fixed period (quick to build, slow to
  // die, mostly small, now and then a big one, sometimes in clusters), and
  // the air wobbles under both. One regular swell of level and filter
  // together reads as surf, which is what this replaced.
  const ease = (v, to, tc, dt) => to + (v - to) * Math.exp(-dt / tc);
  const wind = {
    last: 0, weather: 0.5, weatherTo: 0.5, weatherAt: 0,
    gust: 0, gustTo: 0, gustTc: 1, gustEnd: 0, nextGust: 0,
    wobble: 0, leaves: 0,
  };

  function windTick(now) {
    const w = wind, dt = w.last ? Math.min(1, now - w.last) : TICK_MS / 1000;
    w.last = now;
    if (now >= w.weatherAt) { w.weatherTo = between(0.25, 1); w.weatherAt = now + between(20, 60); }
    if (now >= w.nextGust) {
      w.gustTo = rnd() ** 1.8;
      w.gustTc = between(0.4, 1.4);
      w.gustEnd = now + w.gustTc * 2 + between(0.3, 3);
      w.nextGust = now + (rnd() < 0.35 ? between(0.8, 4) : between(4, 14));
    }
    if (now >= w.gustEnd && w.gustTo) { w.gustTo = 0; w.gustTc = between(1.5, 5); }

    w.weather = ease(w.weather, w.weatherTo, 15, dt);
    w.gust = ease(w.gust, w.gustTo, w.gustTc, dt);
    w.wobble = ease(w.wobble, between(-1, 1), 0.6, dt);
    const s = Math.max(0, w.weather * (0.3 + 0.9 * w.gust) + 0.08 * w.wobble);
    w.leaves = ease(w.leaves, s, 0.8, dt);  // the canopy lags the air a little

    const tc = 0.35;  // smooths the 200 ms control steps
    windG.gain.setTargetAtTime(0.07 + 0.24 * s, now, tc);
    windF.frequency.setTargetAtTime(330 + 300 * s, now, tc);
    leafG.gain.setTargetAtTime(0.002 + 0.026 * w.leaves * w.leaves, now, tc);
    nightWindG.gain.setTargetAtTime(0.05 + 0.09 * s, now, tc);
    nightWindF.frequency.setTargetAtTime(260 + 200 * s, now, tc);
  }

  // --- birds ---------------------------------------------------------------
  // species, behaviour and seasons live in birds.js
  const birds = createBirds(ctx, { day, night, verbIn });

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

  // --- scheduler -----------------------------------------------------------
  let isNight = false;
  let timer = null;
  let stopTimer = null;

  function tick() {
    const now = ctx.currentTime;
    windTick(now);
    if (isNight) {
      crickets.forEach(c => cricketTick(c, now));
      birds.night(now);
    } else {
      birds.day(now);
    }
  }

  function setNight(night_) {
    isNight = night_;
    glide(day.gain, isNight ? 0 : 1, CROSSFADE_TC);
    glide(night.gain, isNight ? 1 : 0, CROSSFADE_TC);
    const now = ctx.currentTime;
    birds.reset();
    if (isNight) crickets.forEach((c, i) => { c.singing = false; c.switchAt = now + i * between(0.5, 2); });
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
