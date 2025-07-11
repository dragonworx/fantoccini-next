import { Rhythm } from './rhythm';
import { MetronomeScheduler } from './metronome_scheduler';
import { Pulse } from './pulse';
import { EventEmitter } from '../event-emitter';

/**
 * Event map for metronome events with type-safe payloads.
 *
 * @interface MetronomeEventMap
 * @memberof core.metronome
 */
export interface MetronomeEventMap {
	/** Emitted when the metronome starts */
	'start': { currentTime: number; bpm: number };
	/** Emitted when the metronome stops */
	'stop': { finalTime: number; totalPulses: number };
	/** Emitted when the metronome pauses */
	'pause': { currentTime: number; currentPulse: number };
	/** Emitted when the metronome resumes */
	'resume': { currentTime: number; currentPulse: number };
	/** Emitted when the metronome settings are updated */
	'updated': { oldRhythm: Rhythm; newRhythm: Rhythm };
	/** Emitted on each metronome pulse */
	'pulse': Pulse;
	/** Emitted when the metronome completes a full measure */
	'measure': { measureNumber: number; totalBeats: number };
	/** Emitted when the metronome reaches a downbeat */
	'downbeat': { measureNumber: number; beat: number };
	/** Emitted when the tempo changes */
	'tempo:change': { oldBpm: number; newBpm: number };
	/** Emitted when the time signature changes */
	'timeSignature:change': { oldSignature: string; newSignature: string };
	/** Index signature for extensibility */
	[key: string]: unknown;
}

/**
 * A musical metronome that manages timing, beats, and rhythmic patterns.
 *
 * The Metronome class provides functionality to start, stop, and control
 * musical timing with precise control over tempo, time signature, and subdivisions.
 * It emits pulses and events that can be used to synchronize visual or audio elements.
 *
 * @class Metronome
 * @memberof core.metronome
 *
 * @example
 * // Create a metronome with default 4/4 rhythm at 120 BPM
 * import { Rhythm } from "./rhythm";
 * import { TimeSignature } from "./time_signature";
 *
 * const rhythm = new Rhythm({
 *   bpm: 120,
 *   timeSignature: TimeSignature.four_four
 * });
 *
 * const metronome = new Metronome(rhythm);
 * metronome.onPulse(pulse => {
 *   if (pulse.isDownBeat) {
 *     console.log(`Beat ${pulse.beat} of measure ${pulse.measure}`);
 *   }
 * });
 *
 * metronome.start();
 *
 * @see metronome.Rhythm
 * @see metronome.Pulse
 */
export class Metronome extends EventEmitter<MetronomeEventMap> {
	/**
   * The rhythm settings for this metronome.
   * Contains tempo, time signature, and subdivision information.
   *
   * @type {Rhythm}
   */
	public settings: Rhythm;

	/**
   * The scheduler that manages timing for this metronome.
   *
   * @readonly
   * @type {MetronomeScheduler}
   */
	public readonly timer: MetronomeScheduler;

	/**
   * Total number of pulses emitted since starting.
   *
   * @private
   * @type {number}
   */
	private _totalPulses = 0;

	/**
   * Time when the metronome was started.
   *
   * @private
   * @type {number}
   */
	private _startTime = 0;

	/**
   * Whether the metronome has been initialized.
   *
   * @private
   * @type {boolean}
   */
	private _isInitialized = false;

	/**
   * Current pulse count.
   *
   * @private
   * @type {number}
   */
	private _pulse = 1;

	/**
   * Current measure count.
   *
   * @private
   * @type {number}
   */
	private _measure = 1;

	/**
   * Current beat within the measure.
   *
   * @private
   * @type {number}
   */
	private _beat = 1;

	/**
   * Current index within custom grouping patterns.
   *
   * @private
   * @type {number}
   */
	private _currentGroupIndex = 0;

	/**
   * Creates a new Metronome instance with the specified rhythm settings.
   *
   * @param {Rhythm} settings - The rhythm settings for this metronome
   */
	public constructor(settings: Rhythm) {
		super({ keepHistory: false });
		this.settings = settings;
		this.timer = new MetronomeScheduler();
		this.timer.onPulse((pulse) => {
			this.emit('pulse', pulse);
		});
	}

	/**
   * Registers a listener for metronome pulses.
   * The listener will be called on each pulse with timing information.
   *
   * @param {Function} listener - The callback function to execute on each pulse
   * @returns {Function} An unsubscribe function that removes this listener when called
   *
   * @example
   * const metronome = new Metronome(rhythm);
   * const unsubscribe = metronome.onPulse(pulse => {
   *   if (pulse.isDownBeat) {
   *     playSound();
   *   }
   * });
   */
	public onPulse(listener: (pulse: Pulse) => void): (() => boolean) {
		return this.on('pulse', listener);
	}

	/**
   * Registers a listener for metronome state events.
   *
   * @param {string} event - The event type to listen for
   * @param {Function} listener - The callback function to execute when the event occurs
   * @returns {Function} An unsubscribe function that removes this listener when called
   *
   * @example
   * const metronome = new Metronome(rhythm);
   * const unsubscribe = metronome.onEvent('start', (data) => {
   *   console.log(`Metronome started at ${data.bpm} BPM`);
   * });
   */
	public onEvent<K extends keyof MetronomeEventMap>(
		event: K,
		listener: (data: MetronomeEventMap[K]) => void
	): (() => boolean) {
		return this.on(event, listener);
	}

	/**
   * Manually triggers a specific number of pulses.
   * Useful for testing or manually advancing the metronome.
   *
   * @param {number} [pulses=1] - Number of pulses to trigger
   * @returns {Promise<void>} A promise that resolves when all pulses are processed
   *
   * @example
   * // Manually trigger 4 pulses (one measure in 4/4 time)
   * await metronome.manualPulse(4);
   */
	public async manualPulse(pulses: number = 1): Promise<void> {
		if (!this._isInitialized) {
			this._initializeMetronome();
		}
		for (let i = 0; i < pulses; i++) {
			this._onPulse();
		}
		await Promise.resolve();
	}

	/**
   * Initializes the metronome's internal state.
   *
   * @private
   */
	private _initializeMetronome(): void {
		this._resetCounters();
		this._isInitialized = true;
	}

	/**
   * Starts the metronome.
   * Resets all counters and begins emitting pulses at the specified tempo.
   *
   * @returns {void}
   *
   * @example
   * const metronome = new Metronome(rhythm);
   * metronome.start(); // Start the metronome
   */
	public start(): void {
		this._startTime = Date.now();
		this._totalPulses = 0;
		this._resetCounters();
		this.timer.start(this._calculateTempoBeat(), () => this._onPulse());
		this.emit('start', { currentTime: this._startTime, bpm: this.settings.bpm });
	}

	/**
   * Stops the metronome.
   * Halts all pulses and resets counters to initial state.
   *
   * @returns {void}
   *
   * @example
   * metronome.stop(); // Stop the metronome and reset counters
   */
	public stop(): void {
		this.timer.stop();
		const finalTime = Date.now();
		this.emit('stop', { finalTime, totalPulses: this._totalPulses });
		this._resetCounters();
	}

	/**
   * Pauses the metronome.
   * Temporarily halts pulses without resetting counters.
   *
   * @returns {void}
   *
   * @example
   * metronome.pause(); // Pause without losing position
   */
	public pause(): void {
		this.timer.pause();
		this.emit('pause', { currentTime: Date.now(), currentPulse: this._pulse });
	}

	/**
   * Resumes the metronome from a paused state.
   * Continues from the current position.
   *
   * @returns {void}
   *
   * @example
   * metronome.pause();
   * // Some time later...
   * metronome.resume(); // Continue from where it was paused
   */
	public resume(): void {
		this.emit('resume', { currentTime: Date.now(), currentPulse: this._pulse });
		this.timer.resume(this._calculateTempoBeat(), () => this._onPulse());
	}

	/**
   * Updates the metronome with new rhythm settings.
   * Stops the current timing, applies new settings, and restarts.
   *
   * @param {Rhythm} newSettings - New rhythm settings to apply
   * @returns {void}
   *
   * @example
   * // Change to a faster tempo
   * const newRhythm = new Rhythm({...metronome.settings, bpm: 160});
   * metronome.update(newRhythm);
   */
	public update(newSettings: Rhythm): void {
		const oldSettings = this.settings;
		this.settings = newSettings;
		this._resetCounters();
		this.timer.stop();
		this.timer.start(this._calculateTempoBeat(), () => this._onPulse());
		this.emit('updated', { oldRhythm: oldSettings, newRhythm: newSettings });

		// Emit specific change events if tempo or time signature changed
		if (oldSettings.bpm !== newSettings.bpm) {
			this.emit('tempo:change', { oldBpm: oldSettings.bpm, newBpm: newSettings.bpm });
		}

		if (oldSettings.timeSignature !== newSettings.timeSignature) {
			this.emit('timeSignature:change', {
				oldSignature: `${oldSettings.timeSignature.upper}/${oldSettings.timeSignature.lower}`,
				newSignature: `${newSettings.timeSignature.upper}/${newSettings.timeSignature.lower}`
			});
		}
	}

	/**
   * Resets all internal counters to their initial values.
   *
   * @private
   */
	private _resetCounters(): void {
		this._pulse = 1;
		this._measure = 1;
		this._beat = 1;
		this._currentGroupIndex = 0;
		this._totalPulses = 0;
	}

	/**
   * Handles a single pulse of the metronome.
   * Creates a Pulse object, updates counters, and notifies listeners.
   *
   * @private
   */
	private _onPulse(): void {
		const { settings } = this;
		const pulsesInCurrentGroup =
      settings.customGrouping &&
      this._currentGroupIndex < settings.customGrouping.length
      	? settings.customGrouping[this._currentGroupIndex]
      	: settings.timeSignature.upper;

		const subdivisionsInCurrentBeat = settings.subDivisions;
		const isDownBeat = (this._pulse - 1) % subdivisionsInCurrentBeat === 0;

		// Create a Pulse object with the current timing information
		const pulseObj = new Pulse({
			pulse: this._pulse,
			pulses: settings.pulsesPerMeasure,
			subdivs: subdivisionsInCurrentBeat,
			complete: this._pulse / settings.pulsesPerMeasure,
			measure: this._measure,
			beat: this._beat,
			isDownBeat: isDownBeat,
		});

		// Emit downbeat event if this is a downbeat
		if (isDownBeat) {
			this.emit('downbeat', { measureNumber: this._measure, beat: this._beat });
		}

		this.timer.emitPulse(pulseObj);
		this._totalPulses++;

		const oldMeasure = this._measure;
		this._pulse++;

		// Handle measure boundary
		if (this._pulse > settings.pulsesPerMeasure) {
			this._pulse = 1;
			this._measure++;
			this._beat = 1;
			this._currentGroupIndex = 0;

			// Emit measure completion event
			this.emit('measure', {
				measureNumber: oldMeasure,
				totalBeats: settings.timeSignature.upper
			});
		} else {
			// Handle beat boundary
			if ((this._pulse - 1) % subdivisionsInCurrentBeat === 0) {
				this._beat++;
			}

			// Special handling for 12/8 time signature
			if (
				settings.timeSignature.upper === 12 &&
        subdivisionsInCurrentBeat === 3
			) {
				if ((this._pulse - 1) % 12 === 0) {
					this._beat = 1;
					this._measure++;
				}
			} else {
				// Handle custom grouping patterns
				if (this._beat > pulsesInCurrentGroup) {
					this._beat = 1;
					this._currentGroupIndex =
            (this._currentGroupIndex + 1) %
            (settings.customGrouping?.length ?? 1);
				}
			}
		}
	}

	/**
   * Calculates the interval between beats in milliseconds.
   * Takes into account BPM, subdivisions, and time signature.
   *
   * @private
   * @returns {number} The interval between beats in milliseconds
   */
	private _calculateTempoBeat(): number {
		const { bpm, subDivisions, timeSignature } = this.settings;
		return (60000 / bpm / subDivisions) * (4 / timeSignature.lower);
	}

	/**
   * Cleans up all resources used by the metronome.
   * Stops all timers and clears all event listeners.
   *
   * @example
   * // When you're done with the metronome
   * metronome.dispose();
   */
	public dispose(): void {
		this.timer.dispose();
		super.dispose();
	}
}
