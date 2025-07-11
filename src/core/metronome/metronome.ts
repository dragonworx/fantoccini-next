import { Rhythm } from './rhythm';
import { MetronomeScheduler } from './metronome_scheduler';
import { Pulse } from './pulse';

/**
 * Valid events that can be emitted by the Metronome.
 *
 * @typedef {"start" | "stop" | "pause" | "resume" | "updated"} MetronomeEvent
 */
type MetronomeEvent = 'start' | 'stop' | 'pause' | 'resume' | 'updated';

/**
 * Function type for event listeners that respond to metronome events.
 *
 * @callback EventListener
 * @param {MetronomeEvent} event - The event type that occurred
 * @returns {void}
 */
type EventListener = (event: MetronomeEvent) => void;

/**
 * Function type for pulse listeners that respond to metronome pulses.
 *
 * @callback PulseListener
 * @param {Pulse} pulse - The pulse object containing timing information
 * @returns {void}
 */
type PulseListener = (pulse: Pulse) => void;

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
export class Metronome {
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
   * Set of event listeners for metronome state changes.
   *
   * @private
   * @type {Set<EventListener>}
   */
	private eventListeners: Set<EventListener> = new Set();

	/**
   * Set of pulse listeners that respond to each metronome pulse.
   *
   * @private
   * @type {Set<PulseListener>}
   */
	private pulseListeners: Set<PulseListener> = new Set();

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
		this.settings = settings;
		this.timer = new MetronomeScheduler();
		this.timer.onPulse((pulse) => {
			this.pulseListeners.forEach((listener) => listener(pulse));
		});
	}

	/**
   * Registers a listener for metronome events (start, stop, pause, etc.).
   *
   * @param {EventListener} listener - The callback function to execute when events occur
   * @returns {Function} An unsubscribe function that removes this listener when called
   *
   * @example
   * const metronome = new Metronome(rhythm);
   * const unsubscribe = metronome.onEvent(event => {
   *   console.log(`Metronome ${event}`);
   * });
   *
   * // Later, to stop listening:
   * unsubscribe();
   */
	public onEvent(listener: EventListener): (() => boolean) {
		this.eventListeners.add(listener);
		return () => this.eventListeners.delete(listener);
	}

	/**
   * Registers a listener for metronome pulses.
   * The listener will be called on each pulse with timing information.
   *
   * @param {PulseListener} listener - The callback function to execute on each pulse
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
	public onPulse(listener: PulseListener): (() => boolean) {
		this.pulseListeners.add(listener);
		return () => this.pulseListeners.delete(listener);
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
		this._emitEvent('start');
		this._resetCounters();
		this.timer.start(this._calculateTempoBeat(), () => this._onPulse());
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
		this._emitEvent('stop');
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
		this._emitEvent('pause');
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
		this._emitEvent('resume');
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
		this.settings = newSettings;
		this._resetCounters();
		this.timer.stop();
		this.timer.start(this._calculateTempoBeat(), () => this._onPulse());
		this._emitEvent('updated');
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

		// Create a Pulse object with the current timing information
		const pulseObj = new Pulse({
			pulse: this._pulse,
			pulses: settings.pulsesPerMeasure,
			subdivs: subdivisionsInCurrentBeat,
			complete: this._pulse / settings.pulsesPerMeasure,
			measure: this._measure,
			beat: this._beat,
			isDownBeat: (this._pulse - 1) % subdivisionsInCurrentBeat === 0,
		});

		this.timer.emitPulse(pulseObj);

		this._pulse++;

		// Handle measure boundary
		if (this._pulse > settings.pulsesPerMeasure) {
			this._pulse = 1;
			this._measure++;
			this._beat = 1;
			this._currentGroupIndex = 0;
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
   * Emits an event to all registered event listeners.
   *
   * @private
   * @param {MetronomeEvent} eventType - The type of event to emit
   */
	private _emitEvent(eventType: MetronomeEvent): void {
		this.eventListeners.forEach((listener) => listener(eventType));
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
		this.eventListeners.clear();
		this.pulseListeners.clear();
	}
}
