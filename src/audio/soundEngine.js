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
      // Safe fallback in restricted/headless environments
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
      data[i] *= 1.8;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 680;
    filter.Q.value = 0.6;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.14;

    noise.connect(filter);
    filter.connect(this.rainGain);
    this.rainGain.connect(this.master);
    noise.start();
  }

  _startBoilerWarmthHum() {
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 68;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 140;

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
      this.rainGain.gain.setTargetAtTime(isRestored ? 0.07 : 0.16, now, 0.5);
    }
    if (this.warmthGain) {
      this.warmthGain.gain.setTargetAtTime(isRestored ? 0.07 : 0.01, now, 0.5);
    }
  }

  playTone(freq, duration = 0.18, type = 'sine', vol = 0.18, slideTo = null) {
    if (!this.initialized || this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playFootstep(onWarmFloor = false) {
    this.playTone(onWarmFloor ? 135 : 98, 0.055, 'triangle', 0.06, 58);
  }

  playSalvage() {
    this.playTone(520, 0.09, 'triangle', 0.15, 760);
    setTimeout(() => this.playTone(790, 0.11, 'sine', 0.12), 55);
  }

  playRepairWrench() {
    // Crisp metallic brass clink + steam valve seat
    this.playTone(680, 0.08, 'square', 0.09, 980);
    setTimeout(() => this.playTone(920, 0.12, 'triangle', 0.14, 1240), 70);
    setTimeout(() => this.playTone(540, 0.22, 'sine', 0.14), 130);
  }

  playSteamStoke() {
    this.playTone(190, 0.25, 'sawtooth', 0.08, 340);
  }

  playGhostBanish() {
    this.playTone(360, 0.32, 'sine', 0.16, 880);
    setTimeout(() => this.playTone(660, 0.36, 'triangle', 0.12, 1120), 80);
  }

  playSpookyWhisper() {
    this.playTone(295, 0.65, 'sine', 0.06, 235);
  }

  playThunder() {
    this.playTone(62, 1.1, 'sawtooth', 0.11, 32);
  }

  playDoorUnseal() {
    this.playTone(150, 0.25, 'triangle', 0.18, 260);
    setTimeout(() => this.playTone(440, 0.22, 'sine', 0.14), 120);
  }

  playRoomReclaimedChord() {
    // Resonant C# major bell-brass harmonic chord
    const notes = [277.18, 349.23, 415.3, 554.37, 698.46];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.95, 'triangle', 0.14), idx * 70);
    });
  }
}
