// Trilha instrumental original sintetizada no navegador, sem samples externos.
// A síntese é propositalmente suave para ambientes compartilhados de aprendizagem.
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

export class AmbientSynth {
  constructor({ onEnded = () => {} } = {}) {
    this.context = null;
    this.master = null;
    this.track = null;
    this.position = 0;
    this.startedAt = 0;
    this.nextBeat = 0;
    this.timer = null;
    this.playing = false;
    this.volume = 0.4;
    this.muted = false;
    this.onEnded = onEnded;
  }
  async ensureContext() {
    if (this.context) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("O navegador não oferece suporte ao áudio sintetizado.");
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.volume * 0.12;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1700;
    this.master.connect(filter);
    filter.connect(this.context.destination);
  }
  load(track) {
    this.pause();
    this.track = track;
    this.position = 0;
    this.nextBeat = 0;
  }
  get currentTime() {
    if (!this.track) return 0;
    if (!this.playing) return this.position;
    return Math.min(this.track.duration, Math.max(0, performance.now() / 1000 - this.startedAt));
  }
  get duration() { return this.track?.duration || 0; }
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume * 0.12, this.context.currentTime, 0.03);
  }
  setMuted(muted) {
    this.muted = Boolean(muted);
    this.setVolume(this.volume);
  }
  async play() {
    if (!this.track) return;
    await this.ensureContext();
    if (this.currentTime >= this.duration) this.position = 0;
    await this.context.resume();
    this.startedAt = performance.now() / 1000 - this.position;
    this.nextBeat = Math.floor(this.position / (60 / this.track.bpm));
    this.playing = true;
    this.schedule();
    this.timer = window.setInterval(() => this.schedule(), 100);
  }
  pause() {
    if (!this.playing) return;
    this.position = this.currentTime;
    this.playing = false;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    if (this.context?.state === "running") this.context.suspend().catch(() => {});
  }
  seek(value) {
    const resume = this.playing;
    this.pause();
    this.position = Math.max(0, Math.min(this.duration, Number(value) || 0));
    this.nextBeat = Math.floor(this.position / (60 / (this.track?.bpm || 70)));
    if (resume) this.play().catch(() => {});
  }
  schedule() {
    if (!this.playing || !this.track || !this.context) return;
    const t = this.currentTime;
    if (t >= this.duration) {
      this.pause();
      this.position = this.duration;
      this.onEnded();
      return;
    }
    const beatLength = 60 / this.track.bpm;
    const horizon = Math.min(this.duration, t + 0.35);
    while (this.nextBeat * beatLength < horizon) {
      const beat = this.nextBeat;
      const offset = beat * beatLength - t;
      // Não agenda notas do passado quando o usuário avança a reprodução.
      if (offset >= -0.075) this.note(beat, Math.max(this.context.currentTime + 0.01, this.context.currentTime + offset));
      this.nextBeat++;
    }
  }
  tone(frequency, start, duration, amplitude, wave = "sine") {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, amplitude), start + 0.035);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
  note(beat, time) {
    const t = this.track;
    const chord = t.chords[Math.floor(beat / 4) % t.chords.length];
    if (beat % 4 === 0) {
      for (const semitone of chord) this.tone(hz(t.root + semitone), time, 2.8 * (60 / t.bpm), 0.15, "sine");
      this.tone(hz(t.root - 12 + chord[0]), time, 0.52, 0.17, "triangle");
    }
    if (beat % 2 === 0) {
      const note = t.motif[Math.floor(beat / 2) % t.motif.length];
      this.tone(hz(t.root + 12 + note), time + 0.08, 0.52, 0.16, "triangle");
    }
    // Pulso grave e discreto, com baixa energia para uso em sala.
    if (beat % 4 === 0 || beat % 4 === 2) this.tone(hz(34), time, 0.12, 0.08);
  }
  dispose() {
    this.pause();
    this.context?.close().catch(() => {});
    this.context = null;
  }
}
