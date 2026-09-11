class SoundManager {
  private ctx: AudioContext | null = null;
  private flightOsc: OscillatorNode | null = null;
  private flightGain: GainNode | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const saved = localStorage.getItem('aviator_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('aviator_muted', String(this.isMuted));
    if (this.isMuted) {
      this.stopFlightSound();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext policy catch
    }
  }

  public startFlightSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.stopFlightSound();

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      this.flightOsc = osc;
      this.flightGain = gain;
    } catch {
      // Ignore
    }
  }

  public updateFlightPitch(multiplier: number) {
    if (this.isMuted || !this.flightOsc || !this.ctx) return;
    try {
      // Map multiplier 1.0 -> 20.0 to 140Hz -> 520Hz
      const targetFreq = Math.min(650, 140 + Math.log2(multiplier) * 110);
      this.flightOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    } catch {
      // Ignore
    }
  }

  public stopFlightSound() {
    if (this.flightOsc) {
      try {
        this.flightGain?.gain.setTargetAtTime(0.0001, this.ctx?.currentTime || 0, 0.05);
        setTimeout(() => {
          this.flightOsc?.stop();
          this.flightOsc?.disconnect();
          this.flightOsc = null;
          this.flightGain = null;
        }, 60);
      } catch {
        this.flightOsc = null;
      }
    }
  }

  public playCashout() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Arpeggio chime: E5, G#5, B5, E6
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.36);
      });
    } catch {
      // Ignore
    }
  }

  public playCrash() {
    this.stopFlightSound();
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Deep punch sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Ignore
    }
  }
}

export const sounds = new SoundManager();
