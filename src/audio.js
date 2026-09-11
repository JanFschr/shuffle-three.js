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
      this.effects.gain.value = .8;
      this.effects.connect(this.master);
      this.music = this.context.createGain();
      this.music.gain.value = .22;
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
    this.tone(bass, .20, .045, "sawtooth", this.music);
    if (this.musicStep % 2 === 0) this.noise(.035, .018);
    if (this.musicStep % 4 === 2) this.tone(220, .055, .018, "square", this.music);
    this.musicStep++;
    void ctx;
  }

  tone(frequency, duration, volume, type, destination = this.effects, delay = 0) {
    const ctx = this.ensure(), oscillator = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency * .72), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain); gain.connect(destination); oscillator.start(now); oscillator.stop(now + duration);
  }

  noise(duration, volume, destination = this.music) {
    const ctx = this.ensure(), length = Math.ceil(ctx.sampleRate * duration), buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = buffer; filter.type = "highpass"; filter.frequency.value = 1800; gain.gain.value = volume;
    source.connect(filter); filter.connect(gain); gain.connect(destination); source.start();
  }

  hit(kind, intensity = .5) {
    if (!this.enabled) return;
    this.ensure();
    const strength = Math.max(.1, Math.min(1, intensity));
    if (kind === "rail") {
      this.tone(190, .11, .08 + strength * .12, "triangle");
      this.noise(.045, .025 + strength * .04, this.effects);
    } else if (kind === "striker") {
      this.tone(105, .14, .1 + strength * .14, "square");
      this.tone(64, .18, .06, "sine", this.effects, .012);
    } else if (kind === "goal") {
      this.tone(62, .42, .2, "sawtooth");
      this.noise(.22, .11, this.effects);
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
