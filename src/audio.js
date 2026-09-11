export class GameAudio {
  enabled = true;
  musicTimer = 0;
  musicStep = 0;

  ensure() {
    this.context ??= new AudioContext();
    if (!this.master) {
      this.master = this.context.createGain();
      this.master.gain.value = .18;
      this.master.connect(this.context.destination);
      this.effects = this.context.createGain();
      this.effects.gain.value = .88;
      this.effects.connect(this.master);
      this.music = this.context.createGain();
      this.music.gain.value = .085;
      this.music.connect(this.master);
    }
    void this.context.resume();
    return this.context;
  }

  startMusic() {
    if (!this.enabled || this.musicTimer) return;
    this.ensure();
    this.scheduleBeat();
    this.musicTimer = window.setInterval(() => this.scheduleBeat(), 250);
  }

  scheduleBeat() {
    if (!this.enabled) return;
    const ctx = this.ensure();
    const bass = [55, 55, 65.41, 49, 55, 82.41, 65.41, 49][this.musicStep % 8];
    this.tone(bass, .20, .038, "sawtooth", this.music);
    if (this.musicStep % 2 === 0) this.noise(.03, .012);
    if (this.musicStep % 4 === 2) this.tone(220, .05, .013, "square", this.music);
    this.musicStep++;
    void ctx;
  }

  tone(frequency, duration, volume, type, destination = this.effects, delay = 0) {
    const ctx = this.ensure();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency * .72), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  noise(duration, volume, destination = this.music, highpass = 1800) {
    const ctx = this.ensure();
    const length = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = highpass;
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start();
  }

  duckMusic(amount = .35, duration = .22) {
    if (!this.music || !this.context) return;
    const now = this.context.currentTime;
    this.music.gain.cancelScheduledValues(now);
    this.music.gain.setTargetAtTime(.085 * amount, now, .012);
    this.music.gain.setTargetAtTime(.085, now + duration, .08);
  }

  hit(kind, intensity = .5, pan = 0) {
    if (!this.enabled) return;
    this.ensure();
    const strength = Math.max(.1, Math.min(1, intensity));

    if (kind === "rail") {
      const panner = this.context.createStereoPanner();
      panner.pan.value = Math.max(-.7, Math.min(.7, pan));
      panner.connect(this.effects);
      this.tone(510 + strength * 220, .05, .075 + strength * .1, "triangle", panner);
      this.noise(.022, .016 + strength * .026, panner, 2400);
    } else if (kind === "striker") {
      this.tone(118 + strength * 78, .06, .11 + strength * .15, "square");
      this.tone(68, .085, .05 + strength * .035, "sine", this.effects, .005);
      this.duckMusic(.72, .12);
    } else if (kind === "goal") {
      this.tone(58, .34, .22, "sawtooth");
      this.tone(210, .12, .07 + strength * .06, "triangle", this.effects, .014);
      this.noise(.18, .14, this.effects, 1350);
      this.duckMusic(.28, .34);
    } else if (kind === "shatter") {
      this.tone(48, .52, .25, "sawtooth");
      this.noise(.38, .2, this.effects, 900);
      [390, 520, 720].forEach((note, index) => this.tone(note, .12, .065, "triangle", this.effects, index * .035));
      this.duckMusic(.12, .65);
    } else if (kind === "surge") {
      this.tone(92, .17, .13, "sawtooth");
      this.tone(184, .14, .08, "triangle", this.effects, .045);
      this.noise(.06, .035, this.effects, 2200);
    } else if (kind === "ready") {
      this.tone(330, .08, .045, "triangle");
      this.tone(440, .09, .035, "triangle", this.effects, .07);
    } else {
      [110, 146.83, 220, 293.66].forEach((note, index) => this.tone(note, .5, .1, "sawtooth", this.effects, index * .09));
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.setTargetAtTime(this.enabled ? .18 : .0001, this.context.currentTime, .03);
    if (this.enabled) this.startMusic();
    return this.enabled;
  }
}
