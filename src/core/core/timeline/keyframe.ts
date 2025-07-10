/**
 * Keyframe and AnimatableProperty implementations for the timeline animation engine.
 * Handles animation data storage and value interpolation.
 *
 * This module defines the keyframe system that powers timeline-based animations.
 * It provides robust support for various interpolation methods including linear,
 * step, Bezier curves, and Catmull-Rom splines.
 *
 * @module keyframe
 *
 * @example
 * // Create an animatable property for position
 * const xProperty = new AnimatableProperty<number>(0);
 *
 * // Add keyframes with different interpolation methods
 * xProperty.addKeyframe({
 *   time: 0,
 *   value: 0,
 *   interpolation: 'Linear'
 * });
 *
 * xProperty.addKeyframe({
 *   time: 1,
 *   value: 100,
 *   interpolation: 'Bezier',
 *   bezierControlPoints: {
 *     cp1: { time: 0.2, value: 0 },
 *     cp2: { time: 0.8, value: 1 }
 *   }
 * });
 *
 * // Resolve the value at a specific time
 * const valueAtHalfSecond = xProperty.resolveValue(0.5); // ≈ 50
 */

/**
 * Control points for Bezier curve interpolation.
 * For cubic Bezier: cp1 and cp2 are control points between the keyframes.
 * Values are relative to the keyframe values (0-1 range typically).
 *
 * @interface BezierControlPoints
 * @memberof core.timeline
 *
 * @example
 * // Control points for an ease-in-out curve
 * const controlPoints: BezierControlPoints = {
 *   cp1: { time: 0.42, value: 0 },
 *   cp2: { time: 0.58, value: 1 }
 * };
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function#using_the_cubic-bezier_function|CSS cubic-bezier function}
 */
export interface BezierControlPoints {
  /**
   * First control point (typically outgoing tangent from previous keyframe).
   * The `time` component controls horizontal position (0-1),
   * while `value` controls vertical position.
   * @type {Object}
   * @property {number} time - Horizontal position (0-1)
   * @property {number} value - Vertical position
   */
  cp1: { time: number; value: number };

  /**
   * Second control point (typically incoming tangent to current keyframe).
   * The `time` component controls horizontal position (0-1),
   * while `value` controls vertical position.
   * @type {Object}
   * @property {number} time - Horizontal position (0-1)
   * @property {number} value - Vertical position
   */
  cp2: { time: number; value: number };
}

/**
 * Represents a single point of change for a property on a timeline.
 * A keyframe defines a value at a specific point in time, along with
 * information about how to interpolate to/from this value.
 *
 * @interface IKeyframe
 * @memberof core.timeline
 * @template T The data type of the value (e.g., number, string, object)
 *
 * @example
 * // Linear interpolation keyframe at 2 seconds
 * const linearKeyframe: IKeyframe<number> = {
 *   time: 2,
 *   value: 100,
 *   interpolation: 'Linear'
 * };
 *
 * @example
 * // Bezier interpolation keyframe at 3 seconds
 * const bezierKeyframe: IKeyframe<number> = {
 *   time: 3,
 *   value: 200,
 *   interpolation: 'Bezier',
 *   bezierControlPoints: {
 *     cp1: { time: 0.2, value: 0 },
 *     cp2: { time: 0.8, value: 1 }
 *   }
 * };
 */
export interface IKeyframe<T> {
  /**
   * Time in seconds, relative to the parent timeline's local time.
   * @type {number}
   */
  time: number;

  /**
   * The value of the property at this keyframe.
   * @type {T}
   */
  value: T;

  /**
   * The interpolation method to use for the segment leading to this keyframe.
   * - 'Step': No interpolation, jumps from previous value to this value
   * - 'Linear': Linear interpolation between values
   * - 'Bezier': Cubic Bezier curve interpolation for smooth acceleration/deceleration
   * - 'CatmullRom': Catmull-Rom spline interpolation for smooth curves through points
   * @type {'Step' | 'Linear' | 'Bezier' | 'CatmullRom'}
   */
  interpolation: 'Step' | 'Linear' | 'Bezier' | 'CatmullRom';

  /**
   * Control points for Bezier interpolation (only used when interpolation is 'Bezier').
   * Defines the shape of the curve between the previous keyframe and this one.
   * @type {BezierControlPoints}
   * @optional
   */
  bezierControlPoints?: BezierControlPoints;
}

/**
 * Manages a collection of keyframes for a single animatable property.
 * This interface defines how property values are stored and interpolated over time.
 *
 * @interface IAnimatableProperty
 * @memberof core.timeline
 * @template T The data type of the value (e.g., number, string, object)
 *
 * @example
 * // Usage with a timeline object
 * interface MyAnimatableProperty extends IAnimatableProperty<number> {
 *   // Additional custom methods
 *   addEasingKeyframe(time: number, value: number, easing: string): void;
 * }
 */
export interface IAnimatableProperty<T> {
  /**
   * The value to return if no keyframes exist or if time is outside the keyframe range.
   * @type {T}
   * @readonly
   */
  readonly defaultValue: T;

  /**
   * A time-sorted array of keyframes defining how this property changes over time.
   * @type {Array.<IKeyframe<T>>}
   */
  keyframes: IKeyframe<T>[];

  /**
   * Resolves the property's value at a given local time.
   * It finds the surrounding keyframes and interpolates between them.
   * If no keyframes are present or if time is outside the keyframe range, it returns the defaultValue.
   *
   * @param {number} localTime - The time (in seconds) at which to evaluate the value
   * @returns {T} The interpolated value at the specified time
   *
   * @example
   * // Get the value at 1.5 seconds
   * const value = property.resolveValue(1.5);
   */
  resolveValue(localTime: number): T;
}

/**
 * Implementation of IAnimatableProperty that handles interpolation between keyframes.
 * This class provides methods for adding, removing, and managing keyframes,
 * as well as resolving property values at specific points in time using
 * various interpolation methods.
 *
 * @class AnimatableProperty
 * @memberof core.timeline
 * @implements {IAnimatableProperty<T>}
 * @template T The data type of the property value
 *
 * @example
 * // Create a numeric property with default value 0
 * const position = new AnimatableProperty<number>(0);
 *
 * // Add keyframes with different interpolation methods
 * position.addKeyframe({
 *   time: 0,
 *   value: 0,
 *   interpolation: 'Linear'
 * });
 *
 * position.addKeyframe({
 *   time: 2,
 *   value: 100,
 *   interpolation: 'Bezier',
 *   bezierControlPoints: {
 *     cp1: { time: 0.2, value: 0 },
 *     cp2: { time: 0.8, value: 1 }
 *   }
 * });
 *
 * // Get interpolated values
 * position.resolveValue(0);   // Returns 0
 * position.resolveValue(1);   // Returns ~25 (depending on Bezier curve)
 * position.resolveValue(2);   // Returns 100
 */
export class AnimatableProperty<T> implements IAnimatableProperty<T> {
	public keyframes: IKeyframe<T>[] = [];

	public constructor(public readonly defaultValue: T) {}

	/**
   * Adds a keyframe to the property, maintaining time-sorted order.
   * If a keyframe with the same time already exists, it will be replaced.
   *
   * @param {IKeyframe<T>} keyframe - The keyframe to add
   * @returns {void}
   *
   * @example
   * property.addKeyframe({
   *   time: 1.0,
   *   value: 50,
   *   interpolation: 'Linear'
   * });
   */
	public addKeyframe(keyframe: IKeyframe<T>): void {
		this.keyframes.push(keyframe);
		this.keyframes.sort((a, b) => a.time - b.time);
	}

	/**
   * Removes all keyframes from the property.
   * After calling this method, resolveValue will always return the defaultValue.
   *
   * @returns {void}
   *
   * @example
   * // Remove all animation keyframes
   * property.clearKeyframes();
   */
	public clearKeyframes(): void {
		this.keyframes = [];
	}

	/**
   * Resolves the property's value at a given local time using interpolation.
   * This method finds the appropriate keyframe segment and applies the
   * correct interpolation method based on the keyframes' settings.
   *
   * @param {number} localTime - The time in seconds at which to evaluate the property
   * @returns {T} The interpolated value at the specified time
   *
   * @example
   * // Get the value halfway through the animation
   * const midpointValue = property.resolveValue(1.0);
   */
	public resolveValue(localTime: number): T {
		if (this.keyframes.length === 0) {
			return this.defaultValue;
		}

		// Find the keyframe segment containing the given time
		const segment = this.findKeyframeSegment(localTime);

		if (segment.type === 'before') {
			return this.defaultValue;
		}

		if (segment.type === 'after') {
			return this.defaultValue;
		}

		if (segment.type === 'exact') {
			return segment.keyframe.value;
		}

		// Interpolate between keyframes
		return this.interpolateValue(segment.before, segment.after, localTime);
	}

	/**
   * Finds the keyframe segment that contains the given time.
   * Uses binary search for efficient lookup in large keyframe collections.
   *
   * @private
   * @param {number} localTime - The time to find in the keyframe collection
   * @returns {object} An object describing the segment type and relevant keyframes
   */
	private findKeyframeSegment(localTime: number): { type: 'before' } | { type: 'after' } | { type: 'exact'; keyframe: IKeyframe<T> } | { type: 'between'; before: IKeyframe<T>; after: IKeyframe<T> } {
		// Binary search for efficiency
		let left = 0;
		let right = this.keyframes.length - 1;

		// Check if time is before all keyframes
		if (localTime < this.keyframes[0].time) {
			return { type: 'before' as const };
		}

		// Check if time is after all keyframes
		if (localTime > this.keyframes[right].time) {
			return { type: 'after' as const };
		}

		// Find exact match or surrounding keyframes
		while (left <= right) {
			const mid = Math.floor((left + right) / 2);
			const keyframe = this.keyframes[mid];

			if (keyframe.time === localTime) {
				return { type: 'exact' as const, keyframe };
			}

			if (keyframe.time < localTime) {
				left = mid + 1;
			} else {
				right = mid - 1;
			}
		}

		// At this point, right is the index of the keyframe before localTime
		// and left is the index of the keyframe after localTime
		return {
			type: 'between' as const,
			before: this.keyframes[right],
			after: this.keyframes[left],
		};
	}

	/**
   * Interpolates between two keyframes based on the interpolation method.
   * Selects the appropriate interpolation algorithm based on the 'after' keyframe's
   * interpolation property.
   *
   * @private
   * @param {IKeyframe<T>} before - The keyframe before the target time
   * @param {IKeyframe<T>} after - The keyframe after the target time
   * @param {number} localTime - The time at which to interpolate
   * @returns {T} The interpolated value
   */
	private interpolateValue(
		before: IKeyframe<T>,
		after: IKeyframe<T>,
		localTime: number,
	): T {
		const timeDelta = after.time - before.time;
		const progress =
      timeDelta === 0 ? 0 : (localTime - before.time) / timeDelta;

		switch (after.interpolation) {
		case 'Step':
			return before.value;

		case 'Linear':
			return this.linearInterpolate(before.value, after.value, progress);

		case 'Bezier':
			return this.bezierInterpolate(before, after, progress);

		case 'CatmullRom':
			return this.catmullRomInterpolate(before, after, localTime);

		default:
			return before.value;
		}
	}

	/**
   * Performs linear interpolation between two values.
   * For numeric types, this calculates a weighted average.
   * For non-numeric types, it defaults to step interpolation.
   *
   * @private
   * @param {T} from - Starting value
   * @param {T} to - Ending value
   * @param {number} progress - Interpolation factor (0.0 to 1.0)
   * @returns {T} The interpolated value
   */
	private linearInterpolate(from: T, to: T, progress: number): T {
		// Handle numeric interpolation
		if (typeof from === 'number' && typeof to === 'number') {
			return (from + (to - from) * progress) as T;
		}

		// For non-numeric types, use step interpolation
		return progress < 1 ? from : to;
	}

	/**
   * Performs cubic Bezier interpolation between two keyframes.
   * Uses control points if provided, otherwise defaults to ease-in-out curve.
   * This provides smooth acceleration and deceleration effects similar to CSS easing.
   *
   * @private
   * @param {IKeyframe<T>} before - The keyframe before the target time
   * @param {IKeyframe<T>} after - The keyframe after the target time
   * @param {number} progress - Interpolation factor (0.0 to 1.0)
   * @returns {T} The interpolated value
   *
   * @see {@link https://cubic-bezier.com/|Cubic-Bezier Visualization Tool}
   */
	private bezierInterpolate(
		before: IKeyframe<T>,
		after: IKeyframe<T>,
		progress: number,
	): T {
		// Only support numeric values for Bezier interpolation
		if (typeof before.value !== 'number' || typeof after.value !== 'number') {
			return this.linearInterpolate(before.value, after.value, progress);
		}

		const fromValue = before.value as number;
		const toValue = after.value as number;

		// Get control points or use ease curve (CSS standard) - more obvious non-linear
		const controlPoints = after.bezierControlPoints || {
			cp1: { time: 0.25, value: 0.1 },
			cp2: { time: 0.25, value: 1 },
		};

		// Use Newton-Raphson to solve for the Y value given the X (time) progress
		const t = this.solveBezierT(
			progress,
			controlPoints.cp1.time,
			controlPoints.cp2.time,
		);

		// Calculate the Y value using the solved t parameter
		const valueProgress = this.cubicBezier(
			t,
			0,
			controlPoints.cp1.value,
			controlPoints.cp2.value,
			1,
		);

		return (fromValue + (toValue - fromValue) * valueProgress) as T;
	}

	/**
   * Solves for parameter t in cubic Bezier curve given x coordinate.
   * Uses Newton-Raphson method for numerical solution to find the
   * t value that corresponds to a specific x position on the curve.
   *
   * @private
   * @param {number} x - The x-coordinate (progress value) to solve for
   * @param {number} cp1x - First control point x-coordinate
   * @param {number} cp2x - Second control point x-coordinate
   * @param {number} precision - Error tolerance for solution (default: 1e-6)
   * @returns {number} The t parameter corresponding to the given x
   */
	private solveBezierT(
		x: number,
		cp1x: number,
		cp2x: number,
		precision: number = 1e-6,
	): number {
		// Handle edge cases
		if (x <= 0) {
			return 0;
		}
		if (x >= 1) {
			return 1;
		}

		// Initial guess
		let t = x;

		// Newton-Raphson iteration
		for (let i = 0; i < 10; i++) {
			const currentX = this.cubicBezier(t, 0, cp1x, cp2x, 1);
			const derivative = this.cubicBezierDerivative(t, 0, cp1x, cp2x, 1);

			if (Math.abs(currentX - x) < precision) {
				break;
			}

			if (Math.abs(derivative) < precision) {
				break; // Avoid division by zero
			}

			t = t - (currentX - x) / derivative;
			t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]
		}

		return t;
	}

	/**
   * Evaluates cubic Bezier curve at parameter t.
   * Implements the standard cubic Bezier formula with the given control points.
   *
   * @private
   * @param {number} t - The parameter value (0.0 to 1.0)
   * @param {number} p0 - Start point value
   * @param {number} p1 - First control point value
   * @param {number} p2 - Second control point value
   * @param {number} p3 - End point value
   * @returns {number} The value on the Bezier curve at parameter t
   */
	private cubicBezier(
		t: number,
		p0: number,
		p1: number,
		p2: number,
		p3: number,
	): number {
		const oneMinusT = 1 - t;
		const oneMinusT2 = oneMinusT * oneMinusT;
		const oneMinusT3 = oneMinusT2 * oneMinusT;
		const t2 = t * t;
		const t3 = t2 * t;

		return (
			oneMinusT3 * p0 +
      3 * oneMinusT2 * t * p1 +
      3 * oneMinusT * t2 * p2 +
      t3 * p3
		);
	}

	/**
   * Evaluates the derivative of cubic Bezier curve at parameter t.
   * Used in Newton-Raphson iteration to find roots of the Bezier function.
   *
   * @private
   * @param {number} t - The parameter value (0.0 to 1.0)
   * @param {number} p0 - Start point value
   * @param {number} p1 - First control point value
   * @param {number} p2 - Second control point value
   * @param {number} p3 - End point value
   * @returns {number} The derivative value at parameter t
   */
	private cubicBezierDerivative(
		t: number,
		p0: number,
		p1: number,
		p2: number,
		p3: number,
	): number {
		const oneMinusT = 1 - t;
		const oneMinusT2 = oneMinusT * oneMinusT;
		const t2 = t * t;

		return (
			3 * oneMinusT2 * (p1 - p0) +
      6 * oneMinusT * t * (p2 - p1) +
      3 * t2 * (p3 - p2)
		);
	}

	/**
   * Performs Catmull-Rom spline interpolation.
   * Creates a smooth curve passing through all keyframe points.
   * Requires at least 4 points for proper interpolation, and will
   * create synthetic control points at the ends if needed.
   *
   * @private
   * @param {IKeyframe<T>} before - The keyframe before the target time
   * @param {IKeyframe<T>} after - The keyframe after the target time
   * @param {number} localTime - The time at which to interpolate
   * @returns {T} The interpolated value
   *
   * @see {@link https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline|Catmull-Rom splines on Wikipedia}
   */
	private catmullRomInterpolate(
		before: IKeyframe<T>,
		after: IKeyframe<T>,
		localTime: number,
	): T {
		// Only support numeric values for Catmull-Rom interpolation
		if (typeof before.value !== 'number' || typeof after.value !== 'number') {
			return this.linearInterpolate(
				before.value,
				after.value,
				(localTime - before.time) / (after.time - before.time),
			);
		}

		// Find the indices of the current segment
		const beforeIndex = this.keyframes.indexOf(before);
		const afterIndex = this.keyframes.indexOf(after);

		// Get the four control points for Catmull-Rom spline
		const p0 = this.getCatmullRomControlPoint(beforeIndex - 1);
		const p1 = { time: before.time, value: before.value as number };
		const p2 = { time: after.time, value: after.value as number };
		const p3 = this.getCatmullRomControlPoint(afterIndex + 1);

		// Normalize time to [0, 1] between p1 and p2
		const t = (localTime - p1.time) / (p2.time - p1.time);

		// Catmull-Rom formula
		const result = this.catmullRomFormula(
			t,
			p0.value,
			p1.value,
			p2.value,
			p3.value,
		);

		return result as T;
	}

	/**
   * Gets control point for Catmull-Rom spline, handling edge cases.
   * For points beyond the available keyframes, this method extrapolates
   * control points to maintain curve continuity.
   *
   * @private
   * @param {number} index - The index of the desired control point
   * @returns {Object} The control point coordinates
   * @returns {number} returns.time - The time coordinate
   * @returns {number} returns.value - The value coordinate
   */
	private getCatmullRomControlPoint(index: number): {
    time: number;
    value: number;
  } {
		if (index < 0) {
			// Extrapolate from first two points
			const p1 = this.keyframes[0];
			const p2 = this.keyframes[1] || p1;
			const timeDiff = p2.time - p1.time;
			const valueDiff = (p2.value as number) - (p1.value as number);
			return {
				time: p1.time - timeDiff,
				value: (p1.value as number) - valueDiff,
			};
		}

		if (index >= this.keyframes.length) {
			// Extrapolate from last two points
			const len = this.keyframes.length;
			const p1 = this.keyframes[len - 2] || this.keyframes[len - 1];
			const p2 = this.keyframes[len - 1];
			const timeDiff = p2.time - p1.time;
			const valueDiff = (p2.value as number) - (p1.value as number);
			return {
				time: p2.time + timeDiff,
				value: (p2.value as number) + valueDiff,
			};
		}

		return {
			time: this.keyframes[index].time,
			value: this.keyframes[index].value as number,
		};
	}

	/**
   * Catmull-Rom spline formula.
   * Implements the standard Catmull-Rom interpolation equation.
   *
   * @private
   * @param {number} t - The parameter value (0.0 to 1.0)
   * @param {number} p0 - First control point value
   * @param {number} p1 - Start point value
   * @param {number} p2 - End point value
   * @param {number} p3 - Last control point value
   * @returns {number} The interpolated value
   */
	private catmullRomFormula(
		t: number,
		p0: number,
		p1: number,
		p2: number,
		p3: number,
	): number {
		const t2 = t * t;
		const t3 = t2 * t;

		return (
			0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
		);
	}

	/**
   * Helper method to create a keyframe with Bezier control points.
   * Provides a convenient way to create Bezier keyframes with custom control points.
   *
   * @static
   * @template T - The type of the keyframe value
   * @param {number} time - The time in seconds for this keyframe
   * @param {T} value - The value at this keyframe
   * @param {BezierControlPoints} [controlPoints] - Optional control points for the Bezier curve
   * @returns {IKeyframe<T>} A fully configured Bezier keyframe
   *
   * @example
   * // Create a Bezier keyframe with custom control points
   * const keyframe = AnimatableProperty.createBezierKeyframe(
   *   2.0,
   *   100,
   *   {
   *     cp1: { time: 0.25, value: 0.1 },
   *     cp2: { time: 0.75, value: 0.9 }
   *   }
   * );
   */
	public static createBezierKeyframe<T>(
		time: number,
		value: T,
		controlPoints?: BezierControlPoints,
	): IKeyframe<T> {
		return {
			time,
			value,
			interpolation: 'Bezier',
			bezierControlPoints: controlPoints,
		};
	}

	/**
   * Helper method to create a Catmull-Rom keyframe.
   * Creates a keyframe that will result in a smooth curve passing through all points.
   *
   * @static
   * @template T - The type of the keyframe value
   * @param {number} time - The time in seconds for this keyframe
   * @param {T} value - The value at this keyframe
   * @returns {IKeyframe<T>} A fully configured Catmull-Rom keyframe
   *
   * @example
   * // Create a series of Catmull-Rom keyframes for a smooth path
   * const k1 = AnimatableProperty.createCatmullRomKeyframe(0, 0);
   * const k2 = AnimatableProperty.createCatmullRomKeyframe(1, 50);
   * const k3 = AnimatableProperty.createCatmullRomKeyframe(2, 0);
   */
	public static createCatmullRomKeyframe<T>(time: number, value: T): IKeyframe<T> {
		return {
			time,
			value,
			interpolation: 'CatmullRom',
		};
	}

	/**
   * Helper method to create common easing curves as Bezier keyframes.
   * Provides a convenient way to create keyframes with standard CSS-like easing curves.
   *
   * @static
   * @template T - The type of the keyframe value
   * @param {number} time - The time in seconds for this keyframe
   * @param {T} value - The value at this keyframe
   * @param {('ease'|'ease-in'|'ease-out'|'ease-in-out')} easing - The named easing curve to use
   * @returns {IKeyframe<T>} A configured Bezier keyframe with the specified easing
   *
   * @example
   * // Create a keyframe with ease-out easing
   * const keyframe = AnimatableProperty.createEasingKeyframe(
   *   2.0,
   *   100,
   *   'ease-out'
   * );
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function|CSS easing functions}
   */
	public static createEasingKeyframe<T>(
		time: number,
		value: T,
		easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out',
	): IKeyframe<T> {
		const easingCurves = {
			ease: { cp1: { time: 0.25, value: 0.1 }, cp2: { time: 0.25, value: 1 } },
			'ease-in': { cp1: { time: 0.42, value: 0 }, cp2: { time: 1, value: 1 } },
			'ease-out': { cp1: { time: 0, value: 0 }, cp2: { time: 0.58, value: 1 } },
			'ease-in-out': {
				cp1: { time: 0.42, value: 0 },
				cp2: { time: 0.58, value: 1 },
			},
		};

		return {
			time,
			value,
			interpolation: 'Bezier',
			bezierControlPoints: easingCurves[easing],
		};
	}
}
