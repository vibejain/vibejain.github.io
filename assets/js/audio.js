/* ============================================================
   CHIPTUNE — a tiny self-contained 8-bit audio engine.
   Procedural WebAudio: looping background music + SFX.
   No assets, no dependencies, no licensing. Authentic retro.
   ============================================================ */
(function () {
  "use strict";

  const AC = window.AudioContext || window.webkitAudioContext;

  const Chiptune = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    musicOn: true,
    sfxOn: true,
    playing: false,

    // sequencer
    bpm: 132,
    step: 0,
    nextTime: 0,
    timer: null,
    LOOKAHEAD: 25,      // ms
    SCHEDULE_AHEAD: 0.12, // s

    /* 16-step loop. Chord progression Am - F - C - G. */
    bass: [110.00, 0, 110.00, 0, 87.31, 0, 87.31, 0, 130.81, 0, 130.81, 0, 98.00, 0, 98.00, 0],
    lead: [440.00, 523.25, 659.25, 523.25,
           440.00, 523.25, 698.46, 523.25,
           523.25, 659.25, 783.99, 659.25,
           493.88, 587.33, 783.99, 587.33],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],

    init() {
      if (this.ctx) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicOn ? 0.32 : 0.0001;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxOn ? 0.5 : 0.0001;
      this.sfxGain.connect(this.master);
    },

    resume() {
      this.init();
      if (this.ctx.state === "suspended") this.ctx.resume();
    },

    /* ---- low-level voice ---- */
    voice(type, freq, t, dur, dest, vol) {
      if (!freq) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest);
      o.start(t); o.stop(t + dur + 0.02);
    },

    noiseHit(t, dur, vol) {
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g); g.connect(this.musicGain);
      src.start(t);
    },

    /* ---- sequencer ---- */
    scheduleStep(step, t) {
      const spb = (60 / this.bpm) / 4; // 16th-note length
      this.voice("triangle", this.bass[step], t, spb * 1.6, this.musicGain, 0.5);
      this.voice("square", this.lead[step], t, spb * 0.9, this.musicGain, 0.16);
      if (this.kick[step]) this.noiseHit(t, 0.06, 0.18);
    },

    tick() {
      const spb = (60 / this.bpm) / 4;
      while (this.nextTime < this.ctx.currentTime + this.SCHEDULE_AHEAD) {
        this.scheduleStep(this.step, this.nextTime);
        this.nextTime += spb;
        this.step = (this.step + 1) % 16;
      }
    },

    startMusic() {
      this.resume();
      if (this.playing) return;
      this.playing = true;
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.06;
      this.timer = setInterval(() => this.tick(), this.LOOKAHEAD);
    },

    toggleMusic() {
      this.resume();
      this.musicOn = !this.musicOn;
      const v = this.musicOn ? 0.32 : 0.0001;
      this.musicGain.gain.exponentialRampToValueAtTime(v, this.ctx.currentTime + 0.1);
      if (this.musicOn && !this.playing) this.startMusic();
      return this.musicOn;
    },

    toggleSfx() {
      this.resume();
      this.sfxOn = !this.sfxOn;
      this.sfxGain.gain.value = this.sfxOn ? 0.5 : 0.0001;
      return this.sfxOn;
    },

    /* ---- SFX (route to sfxGain) ---- */
    blip(freq, type, dur, vol) {
      if (!this.ctx || !this.sfxOn) return;
      this.voice(type || "square", freq || 660, this.ctx.currentTime, dur || 0.08, this.sfxGain, vol || 0.4);
    },
    hover() { this.blip(880, "square", 0.04, 0.18); },
    click() { this.blip(523.25, "square", 0.06, 0.4); this.blip(784, "square", 0.09, 0.3); },
    coin() {
      if (!this.ctx || !this.sfxOn) return;
      const t = this.ctx.currentTime;
      this.voice("square", 988, t, 0.07, this.sfxGain, 0.4);
      this.voice("square", 1319, t + 0.07, 0.12, this.sfxGain, 0.4);
    },
    powerup() {
      if (!this.ctx || !this.sfxOn) return;
      const t = this.ctx.currentTime;
      [523, 659, 784, 1047].forEach((f, i) =>
        this.voice("square", f, t + i * 0.05, 0.1, this.sfxGain, 0.35));
    },
    levelup() {
      if (!this.ctx || !this.sfxOn) return;
      const t = this.ctx.currentTime;
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
        this.voice("square", f, t + i * 0.07, 0.14, this.sfxGain, 0.4));
    },
    secret() {
      if (!this.ctx || !this.sfxOn) return;
      const t = this.ctx.currentTime;
      [1047, 988, 1047, 1319, 1047, 1568].forEach((f, i) =>
        this.voice("triangle", f, t + i * 0.08, 0.16, this.sfxGain, 0.4));
    },
    error() { this.blip(160, "sawtooth", 0.18, 0.3); },
  };

  window.Chiptune = Chiptune;
})();
