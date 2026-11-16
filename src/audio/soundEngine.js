export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
    this.rainGain = null;
    this.warmthGain = null;
  }

  init() {
    if (this.initialized) {
      if (this.ctx && (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted')) {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.42;
      this.master.connect(this.ctx.destination);

      this._startAmbientRain();
      this._startBoilerWarmthHum();
      this.initialized = true;
    } catch {
      // Safe fallback in restricted audio environments
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.42, this.ctx.currentTime, 0.05);
    }
    return !this.muted;
  }

  _startAmbientRain() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.03 * white) / 1.03;
      lastOut = data[i];
      data[i] *= 1.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 680;
    filter.Q.value = 0.7;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.09;

    noise.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.master);
    noise.start();
  }

  _startBoilerWarmthHum() {
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 62;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 130;

    this.warmthGain = this.ctx.createGain();
    this.warmthGain.gain.value = 0.015;

    osc.connect(filter);
    filter.connect(this.warmthGain);
    this.warmthGain.connect(this.master);
    osc.start();
  }

  setAtmosphere(isNight, inRestoredRoom) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.rainGain) {
      const targetRain = isNight ? 0.14 : inRestoredRoom ? 0.045 : 0.085;
      this.rainGain.gain.setTargetAtTime(targetRain, now, 0.5);
    }
    if (this.warmthGain) {
      this.warmthGain.gain.setTargetAtTime(inRestoredRoom ? 0.065 : 0.012, now, 0.5);
    }
  }

  playTone(freq, duration = 0.16, type = 'sine', vol = 0.15, slideTo = null) {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // Rising metallic coin-slot clink!
  playCoinSlot(slotIndex = 0, totalSlots = 3) {
    const step = Math.min(8, slotIndex);
    const freq = 660 * Math.pow(1.12, step);
    this.playTone(freq, 0.12, 'triangle', 0.15, freq * 1.04);
    setTimeout(() => this.playTone(freq * 1.5, 0.14, 'sine', 0.1), 25);
    if (slotIndex + 1 >= totalSlots) {
      setTimeout(() => this.playTone(freq * 2, 0.28, 'triangle', 0.14), 75);
    }
  }

  playCoinDrop() {
    this.playTone(920, 0.08, 'sine', 0.11, 680);
    setTimeout(() => this.playTone(1180, 0.11, 'triangle', 0.1), 55);
  }

  playCoinPickup() {
    this.playTone(780, 0.08, 'sine', 0.12, 1170);
    setTimeout(() => this.playTone(1170, 0.12, 'triangle', 0.1), 40);
  }

  playCoinScatter() {
    this.playTone(170, 0.2, 'sawtooth', 0.15, 75);
    [820, 980, 740].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.09, 'triangle', 0.1), 40 + i * 45);
    });
  }

  playBellFlare() {
    this.playTone(880, 0.45, 'triangle', 0.16);
    this.playTone(1318.5, 0.55, 'sine', 0.12);
    setTimeout(() => this.playTone(1760, 0.45, 'sine', 0.1), 45);
  }

  playHammerTick() {
    this.playTone(420, 0.06, 'square', 0.07, 220);
  }

  playLimelightBolt() {
    this.playTone(620, 0.11, 'triangle', 0.1, 980);
  }

  playShadeBanish() {
    this.playTone(320, 0.22, 'sine', 0.13, 840);
  }

  playDuskToll() {
    // Deep Victorian grandfather clock tolling at Dusk
    [196, 146.83].forEach((n, i) => {
      setTimeout(() => {
        this.playTone(n, 0.9, 'triangle', 0.16);
        this.playTone(n * 2, 0.65, 'sine', 0.08);
      }, i * 360);
    });
  }

  playDawnChime() {
    const notes = [293.66, 369.99, 440, 587.33];
    notes.forEach((n, i) => setTimeout(() => this.playTone(n, 0.55, 'triangle', 0.12), i * 95));
  }

  playRoomRestored() {
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.75, 'triangle', 0.14), idx * 65);
    });
  }

  playRiftShatter() {
    this.playTone(110, 0.45, 'sawtooth', 0.16, 55);
    const chord = [293.66, 440, 554.37, 739.99, 880];
    chord.forEach((n, i) => setTimeout(() => this.playTone(n, 0.95, 'triangle', 0.15), 140 + i * 70));
  }
}
