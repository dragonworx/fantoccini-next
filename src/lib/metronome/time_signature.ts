/**
 * Represents a musical time signature, which defines the rhythm of a piece of music.
 *
 * Time signatures consist of two numbers:
 * - The upper number (numerator) indicates how many beats are in each measure
 * - The lower number (denominator) indicates what note value constitutes one beat
 *
 * @class TimeSignature
 * @memberof metronome
 *
 * @example
 * // Create a 3/4 time signature (waltz time)
 * const waltzTime = new TimeSignature(3, 4);
 *
 * @example
 * // Create a 4/4 time signature (common time)
 * const commonTime = TimeSignature.four_four;
 *
 * @see {@link https://en.wikipedia.org/wiki/Time_signature|Time signature on Wikipedia}
 */
export class TimeSignature {
	/**
   * The note value that represents one beat.
   * This number is almost always a power of 2:
   * - 2 corresponds to the half note (minim)
   * - 4 corresponds to the quarter note (crotchet)
   * - 8 corresponds to the eighth note (quaver)
   * - 16 corresponds to the sixteenth note (semiquaver)
   *
   * @readonly
   * @type {number}
   */
	public readonly lower: number;

	/**
   * How many beats constitute a complete measure/bar.
   *
   * @readonly
   * @type {number}
   */
	public readonly upper: number;

	/**
   * Creates a new TimeSignature instance.
   *
   * @param {number} upper - The number of beats per measure (numerator)
   * @param {number} lower - The note value that gets the beat (denominator)
   */
	public constructor(upper: number, lower: number) {
		this.upper = upper;
		this.lower = lower;
	}

	/**
   * Returns the default time signature (4/4).
   *
   * @static
   * @returns {TimeSignature} A 4/4 time signature
   */
	public static get default(): TimeSignature {
		return TimeSignature.four_four;
	}

	/**
   * Returns a 4/4 time signature (common time).
   * This is the most common time signature in Western music.
   *
   * @static
   * @returns {TimeSignature} A 4/4 time signature
   */
	public static get four_four(): TimeSignature {
		return new TimeSignature(4, 4);
	}

	/**
   * Returns a 3/4 time signature.
   * Often used for waltzes and minuets.
   *
   * @static
   * @returns {TimeSignature} A 3/4 time signature
   */
	public static get three_four(): TimeSignature {
		return new TimeSignature(3, 4);
	}

	/**
   * Returns a 2/4 time signature.
   * Often used for marches and polkas.
   *
   * @static
   * @returns {TimeSignature} A 2/4 time signature
   */
	public static get two_four(): TimeSignature {
		return new TimeSignature(2, 4);
	}

	/**
   * Returns a 6/8 time signature.
   * A compound duple meter, commonly used in various dance forms.
   *
   * @static
   * @returns {TimeSignature} A 6/8 time signature
   */
	public static get six_eight(): TimeSignature {
		return new TimeSignature(6, 8);
	}

	/**
   * Returns a 5/4 time signature.
   * An irregular meter used in contemporary and some folk music.
   *
   * @example
   * // The famous "Take Five" by Dave Brubeck uses 5/4 time
   * const takeFiveTimeSignature = TimeSignature.five_four;
   *
   * @static
   * @returns {TimeSignature} A 5/4 time signature
   */
	public static get five_four(): TimeSignature {
		return new TimeSignature(5, 4);
	}

	/**
   * Returns a 9/8 time signature.
   * A compound triple meter, often used in waltzes and jigs.
   *
   * @static
   * @returns {TimeSignature} A 9/8 time signature
   */
	public static get nine_eight(): TimeSignature {
		return new TimeSignature(9, 8);
	}

	/**
   * Returns a 12/8 time signature.
   * A compound quadruple meter, often used in blues, gospel, and R&B.
   *
   * @static
   * @returns {TimeSignature} A 12/8 time signature
   */
	public static get twelve_eight(): TimeSignature {
		return new TimeSignature(12, 8);
	}

	/**
   * Returns a 7/8 time signature.
   * An irregular meter common in Eastern European folk music and progressive rock.
   *
   * @static
   * @returns {TimeSignature} A 7/8 time signature
   */
	public static get seven_eight(): TimeSignature {
		return new TimeSignature(7, 8);
	}
}
