/**
 * Represents a single timing pulse from the metronome.
 *
 * Pulse objects contain detailed timing information about the current musical position,
 * including measure, beat, and subdivision information. These objects are emitted
 * by the metronome and passed to pulse listeners.
 *
 * @class Pulse
 * @memberof metronome
 *
 * @example
 * metronome.onPulse(pulse => {
 *   if (pulse.isDownBeat) {
 *     // This is the first subdivision of a beat
 *     console.log(`Beat ${pulse.beat} of measure ${pulse.measure}`);
 *   }
 *
 *   // Visual progress indicator
 *   progressBar.style.width = `${pulse.complete * 100}%`;
 * });
 *
 * @see metronome.Metronome#onPulse
 */
export class Pulse {
	/**
   * Current pulse number within the measure (1-based index).
   * @type {number}
   */
	public readonly pulse: number;

	/**
   * Total pulses in the current measure.
   * @type {number}
   */
	public readonly pulses: number;

	/**
   * Number of subdivisions per beat.
   * For example, 1 = quarter notes, 2 = eighth notes, 4 = sixteenth notes.
   * @type {number}
   */
	public readonly subdivs: number;

	/**
   * Completion percentage of the current measure (0.0 - 1.0).
   * Useful for visual progress indicators.
   * @type {number}
   */
	public readonly complete: number;

	/**
   * Current measure count (1-based index).
   * Increases each time a complete measure is finished.
   * @type {number}
   */
	public readonly measure: number;

	/**
   * Current beat within the measure (1-based index).
   * @type {number}
   */
	public readonly beat: number;

	/**
   * Indicates if this pulse is the downbeat (first pulse of a beat).
   * Useful for accenting the first beat or playing different sounds.
   * @type {boolean}
   */
	public readonly isDownBeat: boolean;

	/**
   * Creates a new Pulse instance with timing information.
   *
   * @param {Object} params - Timing parameters
   * @param {number} params.pulse - Current pulse within the measure (1-based)
   * @param {number} params.pulses - Total pulses in the current measure
   * @param {number} params.subdivs - Number of subdivisions per beat
   * @param {number} params.complete - Completion percentage of the measure (0.0-1.0)
   * @param {number} params.measure - Current measure count (1-based)
   * @param {number} params.beat - Current beat within the measure (1-based)
   * @param {boolean} params.isDownBeat - Whether this is the first pulse of a beat
   *
   * @example
   * const pulse = new Pulse({
   *   pulse: 5,      // Fifth pulse in the measure
   *   pulses: 16,    // Total of 16 pulses in the measure
   *   subdivs: 4,    // Four subdivisions per beat (sixteenth notes)
   *   complete: 0.25, // 25% through the measure
   *   measure: 2,    // Second measure
   *   beat: 2,       // Second beat of the measure
   *   isDownBeat: true // This is the first subdivision of the beat
   * });
   */
	public constructor(params: {
    pulse: number;
    pulses: number;
    subdivs: number;
    complete: number;
    measure: number;
    beat: number;
    isDownBeat: boolean;
  }) {
		this.pulse = params.pulse;
		this.pulses = params.pulses;
		this.subdivs = params.subdivs;
		this.complete = params.complete;
		this.measure = params.measure;
		this.beat = params.beat;
		this.isDownBeat = params.isDownBeat;
	}
}
