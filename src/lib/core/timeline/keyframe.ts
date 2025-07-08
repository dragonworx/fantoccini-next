/**
 * Keyframe and AnimatableProperty implementations for the timeline animation engine.
 * Handles animation data storage and value interpolation.
 */

/**
 * Control points for Bezier curve interpolation.
 * For cubic Bezier: cp1 and cp2 are control points between the keyframes.
 * Values are relative to the keyframe values (0-1 range typically).
 */
export interface BezierControlPoints {
  /** First control point (typically outgoing tangent from previous keyframe) */
  cp1: { time: number; value: number };
  /** Second control point (typically incoming tangent to current keyframe) */
  cp2: { time: number; value: number };
}

/**
 * Represents a single point of change for a property on a timeline.
 * @template T The data type of the value (e.g., number, string).
 */
export interface IKeyframe<T> {
  /** Time in seconds, relative to the parent timeline's local time. */
  time: number;
  /** The value of the property at this keyframe. */
  value: T;
  /** The interpolation method to use for the segment leading to this keyframe. */
  interpolation: 'Step' | 'Linear' | 'Bezier' | 'CatmullRom';
  /** Control points for Bezier interpolation (only used when interpolation is 'Bezier') */
  bezierControlPoints?: BezierControlPoints;
}

/**
 * Manages a collection of keyframes for a single animatable property.
 * @template T The data type of the value.
 */
export interface IAnimatableProperty<T> {
  /** The value to return if no keyframes exist or if time is outside the keyframe range. */
  readonly defaultValue: T;
  /** A time-sorted array of keyframes. */
  keyframes: IKeyframe<T>[];
  /**
   * Resolves the property's value at a given local time.
   * It finds the surrounding keyframes and interpolates between them.
   * If no keyframes are present, it returns the defaultValue.
   * @param localTime The time (in seconds) at which to evaluate the value.
   * @returns The interpolated value of type T.
   */
  resolveValue(localTime: number): T;
}

/**
 * Implementation of IAnimatableProperty that handles interpolation between keyframes.
 */
export class AnimatableProperty<T> implements IAnimatableProperty<T> {
  public keyframes: IKeyframe<T>[] = [];
  
  constructor(public readonly defaultValue: T) {}

  /**
   * Adds a keyframe to the property, maintaining time-sorted order.
   */
  addKeyframe(keyframe: IKeyframe<T>): void {
    this.keyframes.push(keyframe);
    this.keyframes.sort((a, b) => a.time - b.time);
  }

  /**
   * Removes all keyframes from the property.
   */
  clearKeyframes(): void {
    this.keyframes = [];
  }

  /**
   * Resolves the property's value at a given local time using interpolation.
   */
  resolveValue(localTime: number): T {
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
   */
  private findKeyframeSegment(localTime: number) {
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
      after: this.keyframes[left]
    };
  }

  /**
   * Interpolates between two keyframes based on the interpolation method.
   */
  private interpolateValue(before: IKeyframe<T>, after: IKeyframe<T>, localTime: number): T {
    const timeDelta = after.time - before.time;
    const progress = timeDelta === 0 ? 0 : (localTime - before.time) / timeDelta;

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
   */
  private bezierInterpolate(before: IKeyframe<T>, after: IKeyframe<T>, progress: number): T {
    // Only support numeric values for Bezier interpolation
    if (typeof before.value !== 'number' || typeof after.value !== 'number') {
      return this.linearInterpolate(before.value, after.value, progress);
    }

    const fromValue = before.value as number;
    const toValue = after.value as number;

    // Get control points or use ease curve (CSS standard) - more obvious non-linear
    const controlPoints = after.bezierControlPoints || {
      cp1: { time: 0.25, value: 0.1 },
      cp2: { time: 0.25, value: 1 }
    };

    // Use Newton-Raphson to solve for the Y value given the X (time) progress
    const t = this.solveBezierT(progress, controlPoints.cp1.time, controlPoints.cp2.time);
    
    // Calculate the Y value using the solved t parameter
    const valueProgress = this.cubicBezier(t, 0, controlPoints.cp1.value, controlPoints.cp2.value, 1);
    
    return (fromValue + (toValue - fromValue) * valueProgress) as T;
  }

  /**
   * Solves for parameter t in cubic Bezier curve given x coordinate.
   * Uses Newton-Raphson method for numerical solution.
   */
  private solveBezierT(x: number, cp1x: number, cp2x: number, precision: number = 1e-6): number {
    // Handle edge cases
    if (x <= 0) return 0;
    if (x >= 1) return 1;

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
   */
  private cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const oneMinusT = 1 - t;
    const oneMinusT2 = oneMinusT * oneMinusT;
    const oneMinusT3 = oneMinusT2 * oneMinusT;
    const t2 = t * t;
    const t3 = t2 * t;
    
    return oneMinusT3 * p0 + 
           3 * oneMinusT2 * t * p1 + 
           3 * oneMinusT * t2 * p2 + 
           t3 * p3;
  }

  /**
   * Evaluates the derivative of cubic Bezier curve at parameter t.
   */
  private cubicBezierDerivative(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const oneMinusT = 1 - t;
    const oneMinusT2 = oneMinusT * oneMinusT;
    const t2 = t * t;
    
    return 3 * oneMinusT2 * (p1 - p0) + 
           6 * oneMinusT * t * (p2 - p1) + 
           3 * t2 * (p3 - p2);
  }

  /**
   * Performs Catmull-Rom spline interpolation.
   * Requires at least 4 points for proper interpolation.
   */
  private catmullRomInterpolate(before: IKeyframe<T>, after: IKeyframe<T>, localTime: number): T {
    // Only support numeric values for Catmull-Rom interpolation
    if (typeof before.value !== 'number' || typeof after.value !== 'number') {
      return this.linearInterpolate(before.value, after.value, (localTime - before.time) / (after.time - before.time));
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
    const result = this.catmullRomFormula(t, p0.value, p1.value, p2.value, p3.value);
    
    return result as T;
  }

  /**
   * Gets control point for Catmull-Rom spline, handling edge cases.
   */
  private getCatmullRomControlPoint(index: number): { time: number; value: number } {
    if (index < 0) {
      // Extrapolate from first two points
      const p1 = this.keyframes[0];
      const p2 = this.keyframes[1] || p1;
      const timeDiff = p2.time - p1.time;
      const valueDiff = (p2.value as number) - (p1.value as number);
      return {
        time: p1.time - timeDiff,
        value: (p1.value as number) - valueDiff
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
        value: (p2.value as number) + valueDiff
      };
    }
    
    return {
      time: this.keyframes[index].time,
      value: this.keyframes[index].value as number
    };
  }

  /**
   * Catmull-Rom spline formula.
   */
  private catmullRomFormula(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    
    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
  }

  /**
   * Helper method to create a keyframe with Bezier control points.
   */
  static createBezierKeyframe<T>(
    time: number, 
    value: T, 
    controlPoints?: BezierControlPoints
  ): IKeyframe<T> {
    return {
      time,
      value,
      interpolation: 'Bezier',
      bezierControlPoints: controlPoints
    };
  }

  /**
   * Helper method to create a Catmull-Rom keyframe.
   */
  static createCatmullRomKeyframe<T>(time: number, value: T): IKeyframe<T> {
    return {
      time,
      value,
      interpolation: 'CatmullRom'
    };
  }

  /**
   * Helper method to create common easing curves as Bezier keyframes.
   */
  static createEasingKeyframe<T>(
    time: number, 
    value: T, 
    easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  ): IKeyframe<T> {
    const easingCurves = {
      'ease': { cp1: { time: 0.25, value: 0.1 }, cp2: { time: 0.25, value: 1 } },
      'ease-in': { cp1: { time: 0.42, value: 0 }, cp2: { time: 1, value: 1 } },
      'ease-out': { cp1: { time: 0, value: 0 }, cp2: { time: 0.58, value: 1 } },
      'ease-in-out': { cp1: { time: 0.42, value: 0 }, cp2: { time: 0.58, value: 1 } }
    };

    return {
      time,
      value,
      interpolation: 'Bezier',
      bezierControlPoints: easingCurves[easing]
    };
  }
}