import { Pulse } from "./pulse";

type PulseCallback = () => void;

export interface MetronomeSchedulerOptions {
  tempoBeat?: number; // Duration of a beat in ms
  rhythmPattern?: number[]; // Array of beat multipliers (e.g., [1, 0.5, 1.5] for swing)
  autoStart?: boolean;
}

export class MetronomeScheduler {
  private _pulseController: ((pulse: Pulse) => void)[] = [];
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _running: boolean = false;
  private _expectedNextSysMs: number = 0;
  private _tempoBeat: number;
  private _rhythmPattern: number[] | null;
  private _patternIndex: number = 0;
  private _remainingInterval: number | null = null;
  private _lastPauseTime: number | null = null;
  private _resumeNextIsFirst: boolean = false;

  /**
   * Create a new MetronomeScheduler.
   * @param options Optional settings for tempo, rhythm, and autostart
   */
  constructor(options: MetronomeSchedulerOptions = {}) {
    this._tempoBeat = options.tempoBeat ?? 600;
    this._rhythmPattern = options.rhythmPattern ?? null;
    if (options.autoStart) {
      this.start(this._tempoBeat, () => {});
    }
  }

  /**
   * Subscribe to pulse events.
   * @param listener
   * @returns unsubscribe function
   */
  onPulse(listener: (pulse: Pulse) => void): () => void {
    this._pulseController.push(listener);
    return () => {
      const idx = this._pulseController.indexOf(listener);
      if (idx !== -1) this._pulseController.splice(idx, 1);
    };
  }

  /**
   * Start the metronome scheduler.
   * @param tempoBeat Duration of a beat in ms (optional, overrides constructor)
   * @param onPulseCallback Callback to trigger on each pulse
   */
  start(tempoBeat?: number, onPulseCallback?: PulseCallback): void {
    if (tempoBeat !== undefined) this._tempoBeat = tempoBeat;
    this._running = true;
    this._resetTimer();
    this._patternIndex = 0;
    this._schedulePulse(this._tempoBeat, onPulseCallback ?? (() => {}));
  }

  /**
   * Stop the metronome timer.
   */
  stop(): void {
    this._running = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  /**
   * Pause the metronome timer.
   */
  pause(): void {
    this._running = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    // Calculate remaining interval until next pulse
    if (this._expectedNextSysMs > 0) {
      this._lastPauseTime = Date.now();
      this._remainingInterval = this._expectedNextSysMs - this._lastPauseTime;
      if (this._remainingInterval < 0) this._remainingInterval = 0;
    }
  }

  /**
   * Resume the metronome scheduler.
   * @param tempoBeat
   * @param onPulseCallback
   */
  resume(tempoBeat?: number, onPulseCallback?: PulseCallback): void {
    if (this._running) return; // Prevent multiple timers
    if (tempoBeat !== undefined) this._tempoBeat = tempoBeat;
    // If we have a remaining interval from pause, use it for the first pulse, but always set _expectedNextSysMs to now + normal interval
    if (this._remainingInterval !== null) {
      this._running = true;
      this._resumeNextIsFirst = true;
      const delay = this._remainingInterval;
      this._remainingInterval = null;
      setTimeout(
        () => {
          if (!this._running) return;
          onPulseCallback?.();
          // After first resumed pulse, set _expectedNextSysMs to now + normal interval
          let interval;
          if (this._rhythmPattern && this._rhythmPattern.length > 0) {
            this._patternIndex =
              (this._patternIndex + 1) % this._rhythmPattern.length;
            interval =
              this._tempoBeat * this._rhythmPattern[this._patternIndex];
          } else {
            interval = this._tempoBeat;
          }
          this._expectedNextSysMs = Date.now() + interval;
          this._schedulePulse(this._tempoBeat, onPulseCallback ?? (() => {}));
        },
        Math.max(0, delay),
      );
    } else {
      this._running = true;
      this._schedulePulse(this._tempoBeat, onPulseCallback ?? (() => {}));
    }
  }

  /**
   * Reset the timer state.
   */
  private _resetTimer(): void {
    this._expectedNextSysMs = 0;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  /**
   * Schedule the next pulse.
   * @param tempoBeat
   * @param onPulseCallback
   */
  private _schedulePulse(
    tempoBeat: number,
    onPulseCallback: PulseCallback,
    isResume: boolean = false,
  ): void {
    if (!this._running) return;

    const currentTime = Date.now();

    let interval = tempoBeat;
    if (this._rhythmPattern && this._rhythmPattern.length > 0) {
      interval = tempoBeat * this._rhythmPattern[this._patternIndex];
    }

    if (this._expectedNextSysMs === 0 || isResume) {
      this._expectedNextSysMs = currentTime + interval;
      // If resuming, after this first pulse, reset _expectedNextSysMs to use normal interval from now
      if (isResume) {
        this._resumeNextIsFirst = true;
      }
    }

    const actualInterval = this._expectedNextSysMs - currentTime;

    this._timer = setTimeout(
      () => {
        onPulseCallback();

        // Normal scheduling after resume
        if (this._rhythmPattern && this._rhythmPattern.length > 0) {
          this._patternIndex =
            (this._patternIndex + 1) % this._rhythmPattern.length;
          interval = tempoBeat * this._rhythmPattern[this._patternIndex];
        } else {
          interval = tempoBeat;
        }
        this._expectedNextSysMs += interval;
        this._schedulePulse(tempoBeat, onPulseCallback);
      },
      Math.max(0, actualInterval),
    );
  }

  /**
   * Emit a pulse to all listeners.
   * @param pulse
   */
  emitPulse(pulse: Pulse): void {
    for (const listener of this._pulseController) {
      listener(pulse);
    }
  }

  /**
   * Set a new rhythm pattern.
   * @param pattern Array of multipliers for each beat (e.g., [1, 0.5, 1.5])
   */
  setRhythmPattern(pattern: number[]): void {
    this._rhythmPattern = pattern;
    this._patternIndex = 0;
  }

  /**
   * Set a new tempo (ms per beat).
   * @param tempoBeat
   */
  setTempo(tempoBeat: number): void {
    this._tempoBeat = tempoBeat;
  }

  /**
   * Dispose the metronome scheduler.
   */
  dispose(): void {
    this.stop();
    this._pulseController = [];
    this._remainingInterval = null;
    this._lastPauseTime = null;
    this._resumeNextIsFirst = false;
    this._expectedNextSysMs = 0;
    this._running = false;
  }
}
