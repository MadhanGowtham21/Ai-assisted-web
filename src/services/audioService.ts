/**
 * Native Web Audio API Sound Synthesizer
 * Produces crisp, non-intrusive scientific laboratory sound effects
 * without external audio assets.
 */

class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private humOscillator: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('thesis_workbench_muted');
      if (storedMute !== null) {
        this.isMuted = storedMute === 'true';
      }
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('thesis_workbench_muted', String(muted));
    }
    if (muted && this.humOscillator) {
      this.stopProcessHum();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Soft 800Hz gentle tick when clicking action buttons.
   */
  public playClick(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      // Exponential frequency drop creates a tight mechanical click
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Audio errors are safely caught
    }
  }

  /**
   * Soft low-frequency hum during algorithm execution.
   */
  public startProcessHum(): void {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx || this.humOscillator) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      this.humOscillator = osc;
      this.humGain = gain;
    } catch {
      // Ignore audio failure
    }
  }

  public stopProcessHum(): void {
    if (!this.humOscillator || !this.humGain || !this.ctx) return;
    try {
      const stopTime = this.ctx.currentTime + 0.1;
      this.humGain.gain.linearRampToValueAtTime(0.0001, stopTime);
      this.humOscillator.stop(stopTime);
      setTimeout(() => {
        this.humOscillator = null;
        this.humGain = null;
      }, 150);
    } catch {
      this.humOscillator = null;
      this.humGain = null;
    }
  }

  /**
   * Harmonious two-tone chime (520Hz -> 660Hz) when an algorithm finishes computation.
   */
  public playSuccess(): void {
    if (this.isMuted) return;
    this.stopProcessHum();
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: 520Hz (C5# harmonic)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.07, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.23);

      // Note 2: 659.25Hz (E5 harmonic chord)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.08, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.46);
    } catch {
      // Audio errors safely caught
    }
  }
}

export const audioService = new AudioService();
