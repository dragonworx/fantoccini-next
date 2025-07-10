import { Pulse } from './pulse';

/**
 * A callback function that's executed on each metronome pulse.
 * @callback PulseCallback
 * @returns {void}
 */
type PulseCallback = () => void;

/**
 * Configuration options for the MetronomeScheduler.
 * @interface MetronomeSchedulerOptions
 * @memberof metronome
 *
 * @property {number} [tempoBeat] - Duration of a beat in milliseconds
 * @property {number[]} [rhythmPattern] - Array of beat multipliers (e.g., [1, 0.5, 1.5] for swing)
 * @property {boolean} [autoStart] - Whether to start the scheduler immediately upon creation
 *
 * @example
 * // Create a scheduler with swing rhythm
 * const options = {
 *   tempoBeat: 500, // 500ms (120 BPM)
 *   rhythmPattern: [1.5, 0.5], // Swing rhythm
 *   autoStart: true
 * };
 */
export interface MetronomeSchedulerOptions {
  tempoBeat?: number;
  rhythmPattern?: number[];
  autoStart?: boolean;
}

/**
 * A high-precision timing system that manages metronome pulses.
 *
 * MetronomeScheduler handles the scheduling and timing of metronome pulses,
 * with support for tempo changes, rhythmic patterns (like swing), and
 * pause/resume functionality.
 *
 * @class MetronomeScheduler
 * @memberof metronome
 *
 * @example
 * // Create a basic scheduler
 * const scheduler = new MetronomeScheduler();
 *
 * // Start at 120 BPM (500ms per beat)
 * scheduler.start(500, () => console.log('Pulse!'));
 *
 * // Later, pause and resume
 * scheduler.pause();
 * setTimeout(() => scheduler.resume(), 2000);
 */
export class MetronomeScheduler {
	/** Listeners for pulse events */
	private _pulseController: ((pulse: Pulse) => void)[] = [];

	/** Active timer reference */
	private _timer: number | null = null;

	/** Whether the scheduler is currently running */
	private _running: boolean = false;

	/** Expected timestamp for the next pulse */
	private _expectedNextSysMs: number = 0;

	/** Current tempo in milliseconds per beat */
	private _tempoBeat: number;

	/** Optional pattern for rhythmic variations like swing */
	private _rhythmPattern: number[] | null;

	/** Current position in the rhythm pattern */
	private _patternIndex: number = 0;

	/** Remaining time when paused */
	private _remainingInterval: number | null = null;

	/** Timestamp when paused */
	private _lastPauseTime: number | null = null;

	/** Flag for first pulse after resuming */
	private _resumeNextIsFirst: boolean = false;

	/**
   * Creates a new MetronomeScheduler instance.
   *
   * @param {MetronomeSchedulerOptions} [options={}] - Configuration options
   * @param {number} [options.tempoBeat=600] - Duration of a beat in milliseconds (default is 600ms or 100 BPM)
   * @param {number[]} [options.rhythmPattern] - Array of beat multipliers for creating rhythmic patterns
   * @param {boolean} [options.autoStart] - Whether to start the scheduler immediately
   *
   * @example
   * // Create a metronome scheduler with swing feel at 120 BPM
   * const scheduler = new MetronomeScheduler({
   *   tempoBeat: 500,
   *   rhythmPattern: [1.5, 0.5],  // Long-short swing pattern
   *   autoStart: true
   * });
   */
	public constructor(options: MetronomeSchedulerOptions = {}) {
		this._tempoBeat = options.tempoBeat ?? 600;
		this._rhythmPattern = options.rhythmPattern ?? null;
		if (options.autoStart) {
			this.start(this._tempoBeat, () => {});
		}
	}

	/**
   * Registers a listener for metronome pulse events.
   *
   * @param {function} listener - Function that receives Pulse objects
   * @returns {function} A function that when called, unsubscribes the listener
   *
   * @example
   * const unsubscribe = scheduler.onPulse(pulse => {
   *   console.log(`Beat ${pulse.beat} of measure ${pulse.measure}`);
   *   if (pulse.isDownBeat) {
   *     playSound('click.mp3');
   *   }
   * });
   *
   * // Later, to unsubscribe:
   * unsubscribe();
   *
   * @see metronome.Pulse
   */
	public onPulse(listener: (pulse: Pulse) => void): () => void {
		this._pulseController.push(listener);
		return () => {
			const idx = this._pulseController.indexOf(listener);
			if (idx !== -1) {
				this._pulseController.splice(idx, 1);
			}
		};
	}

	/**
   * Starts the metronome scheduler and begins emitting pulses.
   *
   * @param {number} [tempoBeat] - Duration of a beat in milliseconds (overrides constructor setting)
   * @param {PulseCallback} [onPulseCallback] - Callback function to execute on each pulse
   * @returns {void}
   *
   * @example
   * // Start at 120 BPM (500ms per beat)
   * scheduler.start(500, () => {
   *   // This executes on every pulse
   *   playClick();
   * });
   *
   * @see pause
   * @see resume
   * @see stop
   */
	public start(tempoBeat?: number, onPulseCallback?: PulseCallback): void {
		if (tempoBeat !== undefined) {
			this._tempoBeat = tempoBeat;
		}
		this._running = true;
		this._resetTimer();
		this._patternIndex = 0;
		this._schedulePulse(this._tempoBeat, onPulseCallback ?? ((): void => {}));
	}

	/**
   * Stops the metronome scheduler completely.
   * Unlike pause, this resets the internal state.
   *
   * @returns {void}
   *
   * @example
   * // Stop the metronome completely
   * scheduler.stop();
   *
   * @see start
   * @see pause
   */
	public stop(): void {
		this._running = false;
		if (this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}
	}

	/**
   * Pauses the metronome scheduler temporarily.
   * The metronome can be resumed later from the same position.
   *
   * @returns {void}
   *
   * @example
   * // Pause temporarily
   * scheduler.pause();
   *
   * // Later resume from the same position
   * scheduler.resume();
   *
   * @see resume
   * @see stop
   */
	public pause(): void {
		this._running = false;
		if (this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}
		// Calculate remaining interval until next pulse
		if (this._expectedNextSysMs > 0) {
			this._lastPauseTime = Date.now();
			this._remainingInterval = this._expectedNextSysMs - this._lastPauseTime;
			if (this._remainingInterval < 0) {
				this._remainingInterval = 0;
			}
		}
	}

	/**
   * Resumes the metronome scheduler from a paused state.
   * Continues timing from where it was paused, maintaining beat integrity.
   *
   * @param {number} [tempoBeat] - Optional new tempo in milliseconds per beat
   * @param {PulseCallback} [onPulseCallback] - Callback function to execute on each pulse
   * @returns {void}
   *
   * @example
   * // Pause the metronome
   * scheduler.pause();
   *
   * // Later, resume with the same tempo
   * scheduler.resume();
   *
   * // Or resume with a new tempo
   * scheduler.resume(400); // 150 BPM
   *
   * @see pause
   */
	public resume(tempoBeat?: number, onPulseCallback?: PulseCallback): void {
		if (this._running) {
			return;
		} // Prevent multiple timers
		if (tempoBeat !== undefined) {
			this._tempoBeat = tempoBeat;
		}
		// If we have a remaining interval from pause, use it for the first pulse, but always set _expectedNextSysMs to now + normal interval
		if (this._remainingInterval !== null) {
			this._running = true;
			this._resumeNextIsFirst = true;
			const delay = this._remainingInterval;
			this._remainingInterval = null;
			setTimeout(
				() => {
					if (!this._running) {
						return;
					}
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
					this._schedulePulse(this._tempoBeat, onPulseCallback ?? ((): void => {}));
				},
				Math.max(0, delay),
			);
		} else {
			this._running = true;
			this._schedulePulse(this._tempoBeat, onPulseCallback ?? ((): void => {}));
		}
	}

	/**
   * Resets the internal timer state.
   *
   * @returns {void}
   */
	private _resetTimer(): void {
		this._expectedNextSysMs = 0;
		if (this._timer) {
			clearTimeout(this._timer);
			this._timer = null;
		}
	}

	/**
   * Schedules the next pulse with high-precision timing.
   * Uses adaptive scheduling to maintain accurate timing even with system jitter.
   *
   * @param {number} tempoBeat - Duration of a beat in milliseconds
   * @param {PulseCallback} onPulseCallback - Function to call on each pulse
   * @param {boolean} [isResume=false] - Whether this is the first pulse after resuming
   * @returns {void}
   */
	private _schedulePulse(
		tempoBeat: number,
		onPulseCallback: PulseCallback,
		isResume: boolean = false,
	): void {
		if (!this._running) {
			return;
		}

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
   * Emits a pulse event to all registered listeners.
   *
   * @param {Pulse} pulse - The pulse object containing timing information
   * @returns {void}
   *
   * @example
   * const pulse = new Pulse({...});
   * scheduler.emitPulse(pulse);
   *
   * @see onPulse
   */
	public emitPulse(pulse: Pulse): void {
		for (const listener of this._pulseController) {
			listener(pulse);
		}
	}

	/**
   * Sets a new rhythm pattern for creating rhythmic variations.
   *
   * @param {number[]} pattern - Array of beat duration multipliers
   * @returns {void}
   *
   * @example
   * // Set a swing rhythm (long-short pattern)
   * scheduler.setRhythmPattern([1.5, 0.5]);
   *
   * // Set a "shuffle" feel
   * scheduler.setRhythmPattern([1.33, 0.67]);
   *
   * // Set an even rhythm (removes any pattern)
   * scheduler.setRhythmPattern([1]);
   */
	public setRhythmPattern(pattern: number[]): void {
		this._rhythmPattern = pattern;
		this._patternIndex = 0;
	}

	/**
   * Sets a new tempo in milliseconds per beat.
   *
   * @param {number} tempoBeat - Beat duration in milliseconds
   * @returns {void}
   *
   * @example
   * // Set to 120 BPM (500ms per beat)
   * scheduler.setTempo(500);
   *
   * // Set to 90 BPM (667ms per beat)
   * scheduler.setTempo(667);
   */
	public setTempo(tempoBeat: number): void {
		this._tempoBeat = tempoBeat;
	}

	/**
   * Disposes the metronome scheduler and releases all resources.
   * Call this method when the scheduler is no longer needed to prevent memory leaks.
   *
   * @returns {void}
   *
   * @example
   * // Clean up when the scheduler is no longer needed
   * scheduler.dispose();
   */
	public dispose(): void {
		this.stop();
		this._pulseController = [];
		this._remainingInterval = null;
		this._lastPauseTime = null;
		this._resumeNextIsFirst = false;
		this._expectedNextSysMs = 0;
		this._running = false;
	}
}
