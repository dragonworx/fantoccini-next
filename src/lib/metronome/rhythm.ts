import { TimeSignature } from "./time_signature";

/**
 * Valid note division values for subdivisions in a rhythm.
 * These values represent how many subdivisions occur per beat.
 *
 * @typedef {1|2|4|8|16|32|64} NoteDivision
 */
export type NoteDivision = 1 | 2 | 4 | 8 | 16 | 32 | 64;

/**
 * Represents a quarter note (one subdivision per beat).
 * @type {NoteDivision}
 */
export const quarter: NoteDivision = 1;

/**
 * Represents an eighth note (two subdivisions per beat).
 * @type {NoteDivision}
 */
export const quaver: NoteDivision = 2;

/**
 * Represents a sixteenth note (four subdivisions per beat).
 * @type {NoteDivision}
 */
export const semiquaver: NoteDivision = 4;

/**
 * Represents a thirty-second note (eight subdivisions per beat).
 * @type {NoteDivision}
 */
export const demisemiquaver: NoteDivision = 8;

/**
 * Represents a sixty-fourth note (sixteen subdivisions per beat).
 * @type {NoteDivision}
 */
export const hemidemisemiquaver: NoteDivision = 16;

/**
 * Represents a hundred twenty-eighth note (thirty-two subdivisions per beat).
 * @type {NoteDivision}
 */
export const semihemidemisemiquaver: NoteDivision = 32;

/**
 * Represents a two hundred fifty-sixth note (sixty-four subdivisions per beat).
 * @type {NoteDivision}
 */
export const demisemihemidemisemiquaver: NoteDivision = 64;

/**
 * Represents a musical rhythm with tempo, time signature, and subdivision patterns.
 *
 * The Rhythm class is the foundation of timing calculations in the metronome system,
 * defining both regular and complex rhythmic structures.
 *
 * @class Rhythm
 * @memberof metronome
 *
 * @example
 * // Create a standard 4/4 rhythm at 120 BPM
 * const standardRhythm = new Rhythm({
 *   bpm: 120,
 *   timeSignature: TimeSignature.four_four
 * });
 *
 * @example
 * // Create a complex 7/8 rhythm with grouping pattern [3, 2, 2] at 100 BPM
 * const complexRhythm = new Rhythm({
 *   bpm: 100,
 *   timeSignature: TimeSignature.seven_eight,
 *   customGrouping: [3, 2, 2]
 * });
 *
 * @see metronome.TimeSignature
 */
export class Rhythm {
  /**
   * Tempo in beats per minute.
   * @type {number}
   */
  bpm: number;

  /**
   * Time signature that defines the meter of the rhythm.
   * @type {TimeSignature}
   */
  timeSignature: TimeSignature;

  /**
   * Number of subdivisions per beat.
   * For example, 1 = quarter notes, 2 = eighth notes, 4 = sixteenth notes.
   * @type {number}
   */
  subDivisions: number;

  /**
   * Optional custom grouping pattern for irregular meters.
   * For example, [3, 2, 2] would group a 7/8 time signature into a 3+2+2 pattern.
   * @type {number[]}
   * @example
   * // 7/8 time signature with grouping of 3+2+2
   * customGrouping: [3, 2, 2]
   */
  customGrouping?: number[];

  /**
   * Optional variable subdivisions for each beat in a measure.
   * Allows for polyrhythms or mixed subdivision patterns.
   * @type {number[]}
   * @example
   * // A measure where first beat has duplets, second has triplets, third has duplets
   * variableSubDivisions: [2, 3, 2]
   */
  variableSubDivisions?: number[];

  /**
   * Creates a new Rhythm instance.
   *
   * @param {Object} options - Configuration options for the rhythm
   * @param {number} options.bpm - Tempo in beats per minute
   * @param {TimeSignature} [options.timeSignature=TimeSignature.four_four] - Time signature
   * @param {number} [options.subDivisions=1] - Number of subdivisions per beat
   * @param {number[]} [options.customGrouping] - Optional custom beat grouping pattern
   * @param {number[]} [options.variableSubDivisions] - Optional different subdivisions for each beat
   *
   * @example
   * // Create a rhythm at 120 BPM in 3/4 time with eighth note subdivisions
   * const waltzRhythm = new Rhythm({
   *   bpm: 120,
   *   timeSignature: TimeSignature.three_four,
   *   subDivisions: 2  // eighth notes
   * });
   */
  constructor(options: {
    bpm: number;
    timeSignature?: TimeSignature;
    subDivisions?: number;
    customGrouping?: number[];
    variableSubDivisions?: number[];
  }) {
    this.bpm = options.bpm;
    this.timeSignature = options.timeSignature ?? TimeSignature.four_four;
    this.subDivisions = options.subDivisions ?? 1;
    this.customGrouping = options.customGrouping;
    this.variableSubDivisions = options.variableSubDivisions;
  }

  /**
   * Calculates the total number of pulses per measure based on time signature,
   * subdivisions, and any custom groupings or variable subdivisions.
   *
   * @returns {number} The total number of pulses in one complete measure
   *
   * @example
   * // For a standard 4/4 rhythm with eighth note subdivisions
   * // pulsesPerMeasure = 4 beats × 2 subdivisions = 8 pulses
   *
   * @example
   * // For a 7/8 rhythm with custom grouping [3,2,2] and sixteenth note subdivisions
   * // pulsesPerMeasure = (3+2+2) beats × 4 subdivisions = 28 pulses
   */
  get pulsesPerMeasure(): number {
    if (this.customGrouping) {
      const groupSum = this.customGrouping.reduce((a, b) => a + b, 0);
      const subdivSum = this.variableSubDivisions
        ? this.variableSubDivisions.reduce((a, b) => a + b, 0)
        : this.subDivisions;
      return groupSum * subdivSum;
    }
    return this.timeSignature.upper * this.subDivisions;
  }
}
