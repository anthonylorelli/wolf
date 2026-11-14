export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
    this.rainGain = null;
    this.warmthGain = null;
    this._comboStep = 0;
    this._lastPickupAt = 0;
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
      // Safe fallback in restricted environments
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
      data[i] *= 1.6;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 720;
    filter.Q.value = 0.65;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.11;

    noise.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.master);
    noise.start();
  }

  _startBoilerWarmthHum() {
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 65;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 135;

    this.warmthGain = this.ctx.createGain();
    this.warmthGain.gain.value = 0.01;

    osc.connect(filter);
    filter.connect(this.warmthGain);
    this.warmthGain.connect(this.master);
    osc.start();
  }

  setRoomAtmosphere(isRestored) {
    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(isRestored ? 0.05 : 0.13, now, 0.4);
    }
    if (this.warmthGain) {
      this.warmthGain.gain.setTargetAtTime(isRestored ? 0.065 : 0.01, now, 0.4);
    }
  }

  playTone(freq, duration = 0.16, type = 'sine', vol = 0.16, slideTo = null) {
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
    g.gain.linearRampToValueAtTime(vol, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playWrenchSwing() {
    this.playTone(260, 0.09, 'triangle', 0.14, 120);
  }

  playCrateSmash() {
    this.playTone(155, 0.11, 'sawtooth', 0.14, 65);
    setTimeout(() => this.playTone(580, 0.08, 'triangle', 0.11, 820), 35);
  }

  playDeflect() {
    this.playTone(880, 0.12, 'square', 0.11, 1420);
  }

  playGearPickup() {
    const now = performance.now();
    if (now - this._lastPickupAt < 900) {
      this._comboStep = Math.min(8, this._comboStep + 1);
    } else {
      this._comboStep = 0;
    }
    this._lastPickupAt = now;
    const base = 540 * Math.pow(1.06, this._comboStep);
    this.playTone(base, 0.085, 'sine', 0.13, base * 1.28);
  }

  playSteamDash() {
    this.playTone(240, 0.16, 'sawtooth', 0.11, 95);
    setTimeout(() => this.playTone(420, 0.1, 'triangle', 0.08, 180), 25);
  }

  playRepairWrench() {
    this.playTone(680, 0.08, 'square', 0.09, 980);
    setTimeout(() => this.playTone(940, 0.12, 'triangle', 0.14, 1280), 65);
    setTimeout(() => this.playTone(560, 0.2, 'sine', 0.14), 125);
  }

  playGhostShatter() {
    this.playTone(340, 0.28, 'sine', 0.16, 920);
    setTimeout(() => this.playTone(720, 0.3, 'triangle', 0.13, 1240), 65);
  }

  playPlayerHit() {
    this.playTone(150, 0.22, 'sawtooth', 0.16, 62);
  }

  playSecretPassage() {
    const notes = [220, 277.18, 329.63, 440, 554.37];
    notes.forEach((n, i) => setTimeout(() => this.playTone(n, 0.35, 'triangle', 0.14), i * 65));
  }

  playUpgradeBought() {
    this.playTone(440, 0.12, 'triangle', 0.15, 660);
    setTimeout(() => this.playTone(660, 0.22, 'sine', 0.15, 880), 90);
  }

  playRoomReclaimedChord() {
    const notes = [277.18, 349.23, 415.3, 554.37, 698.46];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.85, 'triangle', 0.14), idx * 65);
    });
  }
}
