/**
 * Comprehensive test suite for the Timeline Animation Engine
 * Tests all specification requirements and edge cases.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  IObserver,
  IObservable,
  Observable,
  IKeyframe,
  IAnimatableProperty,
  AnimatableProperty,
  ITimelineObject,
  TimelineObject,
  GenericTimelineObject,
  DOMTimelineObject,
  ITimeline,
  Timeline,
} from "../src/core";

// Mock DOM for testing
Object.defineProperty(globalThis, "document", {
  value: {
    createElement: (tag: string) => ({
      tagName: tag.toUpperCase(),
      style: {},
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    }),
  },
});

describe("Observer Pattern", () => {
  let observable: Observable;
  let observer: IObserver;

  beforeEach(() => {
    observable = new (class extends Observable {})();
    observer = {
      update: vi.fn(),
    };
  });

  it("should allow observers to subscribe and receive notifications", () => {
    observable.subscribe(observer);
    observable.notify("test context");

    expect(observer.update).toHaveBeenCalledWith("test context");
  });

  it("should allow observers to unsubscribe", () => {
    observable.subscribe(observer);
    observable.unsubscribe(observer);
    observable.notify("test context");

    expect(observer.update).not.toHaveBeenCalled();
  });

  it("should notify multiple observers", () => {
    const observer2 = { update: vi.fn() };

    observable.subscribe(observer);
    observable.subscribe(observer2);
    observable.notify("test context");

    expect(observer.update).toHaveBeenCalledWith("test context");
    expect(observer2.update).toHaveBeenCalledWith("test context");
  });

  it("should handle unsubscribing non-existent observers gracefully", () => {
    expect(() => observable.unsubscribe(observer)).not.toThrow();
  });
});

describe("Keyframes and AnimatableProperty", () => {
  let property: AnimatableProperty<number>;

  beforeEach(() => {
    property = new AnimatableProperty(0);
  });

  describe("Keyframe Management", () => {
    it("should return default value when no keyframes exist", () => {
      expect(property.resolveValue(5)).toBe(0);
    });

    it("should maintain time-sorted order when adding keyframes", () => {
      property.addKeyframe({ time: 3, value: 30, interpolation: "Linear" });
      property.addKeyframe({ time: 1, value: 10, interpolation: "Linear" });
      property.addKeyframe({ time: 2, value: 20, interpolation: "Linear" });

      expect(property.keyframes.map((k) => k.time)).toEqual([1, 2, 3]);
      expect(property.keyframes.map((k) => k.value)).toEqual([10, 20, 30]);
    });

    it("should clear all keyframes", () => {
      property.addKeyframe({ time: 1, value: 10, interpolation: "Linear" });
      property.clearKeyframes();

      expect(property.keyframes).toHaveLength(0);
      expect(property.resolveValue(1)).toBe(0); // default value
    });
  });

  describe("Value Resolution", () => {
    beforeEach(() => {
      property.addKeyframe({ time: 1, value: 10, interpolation: "Linear" });
      property.addKeyframe({ time: 3, value: 30, interpolation: "Linear" });
      property.addKeyframe({ time: 5, value: 50, interpolation: "Step" });
    });

    it("should return default value for time before first keyframe", () => {
      expect(property.resolveValue(0.5)).toBe(0);
    });

    it("should return default value for time after last keyframe", () => {
      expect(property.resolveValue(6)).toBe(0);
    });

    it("should return exact value for time matching keyframe", () => {
      expect(property.resolveValue(1)).toBe(10);
      expect(property.resolveValue(3)).toBe(30);
      expect(property.resolveValue(5)).toBe(50);
    });

    it("should interpolate linearly between keyframes", () => {
      // Between time 1 (value 10) and time 3 (value 30)
      expect(property.resolveValue(2)).toBe(20); // halfway point
      expect(property.resolveValue(1.5)).toBe(15); // quarter point
      expect(property.resolveValue(2.5)).toBe(25); // three-quarter point
    });

    it("should use step interpolation", () => {
      // Between time 3 (value 30) and time 5 (value 50) with Step interpolation
      expect(property.resolveValue(4)).toBe(30); // step interpolation uses previous value
      expect(property.resolveValue(4.9)).toBe(30);
    });
  });

  describe("Non-numeric Values", () => {
    it("should handle string values with step interpolation", () => {
      const stringProperty = new AnimatableProperty("default");
      stringProperty.addKeyframe({
        time: 1,
        value: "first",
        interpolation: "Linear",
      });
      stringProperty.addKeyframe({
        time: 3,
        value: "second",
        interpolation: "Linear",
      });

      expect(stringProperty.resolveValue(0.5)).toBe("default");
      expect(stringProperty.resolveValue(1)).toBe("first");
      expect(stringProperty.resolveValue(2)).toBe("first"); // non-numeric uses step
      expect(stringProperty.resolveValue(3)).toBe("second");
    });
  });

  describe("Bezier Interpolation", () => {
    let property: AnimatableProperty<number>;

    beforeEach(() => {
      property = new AnimatableProperty(0);
    });

    it("should use default ease-in-out curve when no control points provided", () => {
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({ time: 2, value: 100, interpolation: "Bezier" });

      const midValue = property.resolveValue(1);
      // Should be different from linear interpolation (50)
      expect(midValue).not.toBe(50);
      expect(midValue).toBeGreaterThan(0);
      expect(midValue).toBeLessThan(100);
    });

    it("should use custom control points for Bezier interpolation", () => {
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({
        time: 2,
        value: 100,
        interpolation: "Bezier",
        bezierControlPoints: {
          cp1: { time: 0.25, value: 0.8 }, // Steep start
          cp2: { time: 0.75, value: 0.9 }, // Gentle end
        },
      });

      const quarterValue = property.resolveValue(0.5); // Quarter through time
      const halfValue = property.resolveValue(1); // Half through time
      const threeQuarterValue = property.resolveValue(1.5); // Three quarters through time

      // With steep start control point, early values should be higher
      expect(quarterValue).toBeGreaterThan(10);
      expect(halfValue).toBeGreaterThan(50);
      expect(threeQuarterValue).toBeGreaterThan(80);
    });

    it("should handle edge cases for Bezier interpolation", () => {
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({
        time: 1,
        value: 100,
        interpolation: "Bezier",
        bezierControlPoints: {
          cp1: { time: 0, value: 0 },
          cp2: { time: 1, value: 1 },
        },
      });

      // Should behave like linear at extremes
      expect(property.resolveValue(0)).toBe(0);
      expect(property.resolveValue(1)).toBe(100);
    });

    it("should fall back to linear for non-numeric values", () => {
      const stringProperty = new AnimatableProperty("start");
      stringProperty.addKeyframe({
        time: 0,
        value: "start",
        interpolation: "Linear",
      });
      stringProperty.addKeyframe({
        time: 1,
        value: "end",
        interpolation: "Bezier",
      });

      expect(stringProperty.resolveValue(0.5)).toBe("start"); // Step behavior for non-numeric
      expect(stringProperty.resolveValue(1)).toBe("end");
    });

    it("should work with helper method for creating easing keyframes", () => {
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe(
        AnimatableProperty.createEasingKeyframe(2, 100, "ease-in"),
      );

      const midValue = property.resolveValue(1);
      // Ease-in should start slow
      expect(midValue).toBeLessThan(50);
      expect(midValue).toBeGreaterThan(0);
    });

    it("should support all standard easing curves", () => {
      const easings: Array<"ease" | "ease-in" | "ease-out" | "ease-in-out"> = [
        "ease",
        "ease-in",
        "ease-out",
        "ease-in-out",
      ];

      easings.forEach((easing) => {
        const testProperty = new AnimatableProperty(0);
        testProperty.addKeyframe({
          time: 0,
          value: 0,
          interpolation: "Linear",
        });
        testProperty.addKeyframe(
          AnimatableProperty.createEasingKeyframe(1, 100, easing),
        );

        const midValue = testProperty.resolveValue(0.5);
        expect(midValue).toBeGreaterThan(0);
        expect(midValue).toBeLessThan(100);
      });
    });
  });

  describe("Catmull-Rom Spline Interpolation", () => {
    let property: AnimatableProperty<number>;

    beforeEach(() => {
      property = new AnimatableProperty(0);
    });

    it("should create smooth curves through multiple points", () => {
      // Create a wave-like pattern
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({
        time: 1,
        value: 100,
        interpolation: "CatmullRom",
      });
      property.addKeyframe({ time: 2, value: 0, interpolation: "CatmullRom" });
      property.addKeyframe({
        time: 3,
        value: -100,
        interpolation: "CatmullRom",
      });
      property.addKeyframe({ time: 4, value: 0, interpolation: "CatmullRom" });

      // Check smooth interpolation between keyframes
      const value1_5 = property.resolveValue(1.5); // Between 100 and 0
      const value2_5 = property.resolveValue(2.5); // Between 0 and -100

      expect(value1_5).toBeGreaterThan(0);
      expect(value1_5).toBeLessThan(100);
      expect(value2_5).toBeLessThan(0);
      expect(value2_5).toBeGreaterThan(-100);
    });

    it("should handle edge cases with extrapolation", () => {
      // Only two points - should extrapolate for missing neighbors
      property.addKeyframe({ time: 1, value: 10, interpolation: "Linear" });
      property.addKeyframe({ time: 2, value: 20, interpolation: "CatmullRom" });

      const midValue = property.resolveValue(1.5);
      expect(midValue).toBeCloseTo(15, 1); // Should be close to linear
    });

    it("should work with single keyframe segments", () => {
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({ time: 1, value: 50, interpolation: "CatmullRom" });
      property.addKeyframe({ time: 2, value: 100, interpolation: "Linear" });

      const value = property.resolveValue(0.5);
      // Should interpolate between 0 and 50
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(50);
    });

    it("should fall back to linear for non-numeric values", () => {
      const colorProperty = new AnimatableProperty("red");
      colorProperty.addKeyframe({
        time: 0,
        value: "red",
        interpolation: "Linear",
      });
      colorProperty.addKeyframe({
        time: 1,
        value: "blue",
        interpolation: "CatmullRom",
      });

      expect(colorProperty.resolveValue(0.5)).toBe("red"); // Step behavior
      expect(colorProperty.resolveValue(1)).toBe("blue");
    });

    it("should create smooth derivatives at keyframes", () => {
      // Test that Catmull-Rom creates smooth transitions
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({ time: 1, value: 10, interpolation: "CatmullRom" });
      property.addKeyframe({ time: 2, value: 30, interpolation: "CatmullRom" });
      property.addKeyframe({ time: 3, value: 60, interpolation: "CatmullRom" });

      // Sample points around keyframe at t=2
      const before = property.resolveValue(1.9);
      const at = property.resolveValue(2.0);
      const after = property.resolveValue(2.1);

      expect(at).toBe(30); // Exact value at keyframe

      // Slopes should be similar (smooth transition)
      const slopeBefore = (at - before) / 0.1;
      const slopeAfter = (after - at) / 0.1;
      const slopeDifference = Math.abs(slopeBefore - slopeAfter);

      expect(slopeDifference).toBeLessThan(5); // Should be relatively smooth
    });

    it("should work with helper method for creating Catmull-Rom keyframes", () => {
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe(AnimatableProperty.createCatmullRomKeyframe(1, 100));
      property.addKeyframe(AnimatableProperty.createCatmullRomKeyframe(2, 0));

      const midValue = property.resolveValue(1.5);
      expect(midValue).toBeGreaterThan(0);
      expect(midValue).toBeLessThan(100);
    });
  });

  describe("Mixed Interpolation Types", () => {
    let property: AnimatableProperty<number>;

    beforeEach(() => {
      property = new AnimatableProperty(0);
    });

    it("should handle different interpolation types in sequence", () => {
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({ time: 1, value: 50, interpolation: "Step" });
      property.addKeyframe({ time: 2, value: 100, interpolation: "Linear" });
      property.addKeyframe(
        AnimatableProperty.createEasingKeyframe(3, 0, "ease-out"),
      );
      property.addKeyframe(AnimatableProperty.createCatmullRomKeyframe(4, 75));

      // Test each segment
      expect(property.resolveValue(0.5)).toBe(0); // Step
      expect(property.resolveValue(1.5)).toBe(75); // Linear
      expect(property.resolveValue(2.5)).not.toBe(50); // Bezier (ease-out)
      expect(property.resolveValue(3.5)).not.toBe(37.5); // Catmull-Rom
    });
  });

  describe("Performance and Precision", () => {
    it("should handle Bezier curves with high precision", () => {
      const property = new AnimatableProperty(0);
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({
        time: 1,
        value: 100,
        interpolation: "Bezier",
        bezierControlPoints: {
          cp1: { time: 0.33, value: 0.33 },
          cp2: { time: 0.67, value: 0.67 },
        },
      });

      // Test precision at boundaries
      expect(property.resolveValue(0)).toBeCloseTo(0, 6);
      expect(property.resolveValue(1)).toBeCloseTo(100, 6);

      // Test monotonicity for linear-like curve
      const samples = [0, 0.25, 0.5, 0.75, 1].map((t) =>
        property.resolveValue(t),
      );
      for (let i = 1; i < samples.length; i++) {
        expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1]);
      }
    });

    it("should handle complex Catmull-Rom splines efficiently", () => {
      const property = new AnimatableProperty(0);

      // Create a complex spline with many points
      for (let i = 0; i <= 10; i++) {
        const value = Math.sin((i * Math.PI) / 5) * 100;
        property.addKeyframe(
          AnimatableProperty.createCatmullRomKeyframe(i, value),
        );
      }

      const startTime = performance.now();

      // Sample many points along the curve
      for (let t = 0; t <= 10; t += 0.1) {
        property.resolveValue(t);
      }

      const endTime = performance.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(50);
    });

    it("should solve Bezier curves with Newton-Raphson accurately", () => {
      const property = new AnimatableProperty(0);
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({
        time: 1,
        value: 100,
        interpolation: "Bezier",
        bezierControlPoints: {
          cp1: { time: 0.1, value: 0.9 }, // Fast start
          cp2: { time: 0.9, value: 0.1 }, // Slow end
        },
      });

      // Test that curve passes through expected ranges
      const earlyValue = property.resolveValue(0.1);
      const midValue = property.resolveValue(0.5);
      const lateValue = property.resolveValue(0.9);

      // Verify the Bezier curve produces the mathematically correct values
      // With control points (0.1, 0.9) and (0.9, 0.1), the curve has a specific shape
      expect(earlyValue).toBeCloseTo(32.14, 1); // Early value based on curve math
      expect(midValue).toBe(50); // Middle should be at 50 for this curve
      expect(lateValue).toBeCloseTo(67.86, 1); // Late value based on curve math
    });

    it("should maintain continuity between different interpolation types", () => {
      const property = new AnimatableProperty(0);

      // Create a sequence with different interpolation types
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({ time: 1, value: 50, interpolation: "Linear" });
      property.addKeyframe({ time: 2, value: 100, interpolation: "Bezier" });
      property.addKeyframe({ time: 3, value: 75, interpolation: "CatmullRom" });
      property.addKeyframe({ time: 4, value: 0, interpolation: "Step" });

      // Test continuity at transition points
      expect(property.resolveValue(1)).toBe(50);
      expect(property.resolveValue(2)).toBe(100);
      expect(property.resolveValue(3)).toBe(75);
      expect(property.resolveValue(4)).toBe(0);
    });
  });
});

describe("TimelineObject", () => {
  let timelineObject: GenericTimelineObject;

  beforeEach(() => {
    timelineObject = new GenericTimelineObject();
  });

  describe("Property Management", () => {
    it("should add and retrieve properties", () => {
      const xProperty = timelineObject.addProperty("x", 0);
      const yProperty = timelineObject.addProperty("y", 10);

      expect(timelineObject.getProperty("x")).toBe(xProperty);
      expect(timelineObject.getProperty("y")).toBe(yProperty);
      expect(timelineObject.getProperty("nonexistent")).toBeUndefined();
    });

    it("should maintain property map", () => {
      timelineObject.addProperty("x", 0);
      timelineObject.addProperty("y", 10);

      expect(timelineObject.properties.size).toBe(2);
      expect(timelineObject.properties.has("x")).toBe(true);
      expect(timelineObject.properties.has("y")).toBe(true);
    });
  });

  describe("Update and State Application", () => {
    beforeEach(() => {
      const xProperty = timelineObject.addProperty("x", 0);
      const yProperty = timelineObject.addProperty("y", 0);

      xProperty.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      xProperty.addKeyframe({ time: 2, value: 100, interpolation: "Linear" });

      yProperty.addKeyframe({ time: 1, value: 0, interpolation: "Linear" });
      yProperty.addKeyframe({ time: 3, value: 200, interpolation: "Linear" });
    });

    it("should resolve and apply property values at given time", () => {
      timelineObject.update(1); // halfway through x animation, start of y animation

      expect(timelineObject.getCurrentValue("x")).toBe(50);
      expect(timelineObject.getCurrentValue("y")).toBe(0);
    });

    it("should handle multiple property updates", () => {
      timelineObject.update(2); // end of x animation, halfway through y

      expect(timelineObject.getCurrentValue("x")).toBe(100);
      expect(timelineObject.getCurrentValue("y")).toBe(100);
    });

    it("should return all current values", () => {
      timelineObject.update(1.5);
      const values = timelineObject.getCurrentValues();

      expect(values.get("x")).toBe(75);
      expect(values.get("y")).toBe(50);
    });
  });
});

describe("DOMTimelineObject", () => {
  let element: HTMLElement;
  let domObject: DOMTimelineObject;

  beforeEach(() => {
    element = document.createElement("div");
    domObject = new DOMTimelineObject(element);
  });

  it("should apply transform styles to DOM element", () => {
    const xProperty = domObject.getProperty<number>(
      "x",
    )! as AnimatableProperty<number>;
    const yProperty = domObject.getProperty<number>(
      "y",
    )! as AnimatableProperty<number>;
    const rotationProperty = domObject.getProperty<number>(
      "rotation",
    )! as AnimatableProperty<number>;

    xProperty.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
    xProperty.addKeyframe({ time: 1, value: 100, interpolation: "Linear" });

    yProperty.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
    yProperty.addKeyframe({ time: 1, value: 50, interpolation: "Linear" });

    rotationProperty.addKeyframe({
      time: 0,
      value: 0,
      interpolation: "Linear",
    });
    rotationProperty.addKeyframe({
      time: 1,
      value: 45,
      interpolation: "Linear",
    });

    domObject.update(0.5);

    expect(element.style.transform).toBe(
      "translate(50px, 25px) rotate(22.5deg) scale(1, 1)",
    );
  });

  it("should apply opacity styles", () => {
    const opacityProperty = domObject.getProperty<number>(
      "opacity",
    )! as AnimatableProperty<number>;
    opacityProperty.addKeyframe({ time: 0, value: 1, interpolation: "Linear" });
    opacityProperty.addKeyframe({ time: 1, value: 0, interpolation: "Linear" });

    domObject.update(0.5);

    expect(element.style.opacity).toBe("0.5");
  });
});

describe("Timeline", () => {
  let timeline: Timeline;

  beforeEach(() => {
    timeline = new Timeline();
  });

  describe("Construction and Configuration", () => {
    it("should initialize with default values", () => {
      expect(timeline.startTime).toBe(0);
      expect(timeline.duration).toBeNull(); // Changed: default is now null (infinite duration)
      expect(timeline.framerate).toBe(60);
      expect(timeline.timeScale).toBe(1);
      expect(timeline.currentTime).toBe(0);
      expect(timeline.isPlaying).toBe(false);
      expect(timeline.parent).toBeNull();
      expect(timeline.children).toHaveLength(0);
      expect(timeline.objects).toHaveLength(0);
      expect(timeline.loop).toBe(false);
      expect(timeline.repeatCount).toBe(0);
      expect(timeline.currentLoop).toBe(0);
    });

    it("should accept configuration options", () => {
      const configuredTimeline = new Timeline({
        startTime: 2,
        duration: 5,
        framerate: 30,
        timeScale: 0.5,
        loop: true,
        repeatCount: 3,
      });

      expect(configuredTimeline.startTime).toBe(2);
      expect(configuredTimeline.duration).toBe(5);
      expect(configuredTimeline.framerate).toBe(30);
      expect(configuredTimeline.timeScale).toBe(0.5);
      expect(configuredTimeline.loop).toBe(true);
      expect(configuredTimeline.repeatCount).toBe(3);
    });

    it("should initialize with null duration by default", () => {
      expect(timeline.duration).toBeNull();
      expect(timeline.loop).toBe(false);
      expect(timeline.repeatCount).toBe(0);
      expect(timeline.currentLoop).toBe(0);
    });
  });

  describe("Playback Control", () => {
    it("should start and stop playback", () => {
      expect(timeline.isPlaying).toBe(false);

      timeline.play();
      expect(timeline.isPlaying).toBe(true);

      timeline.pause();
      expect(timeline.isPlaying).toBe(false);
    });

    it("should seek to specific time", () => {
      timeline.seek(5);
      expect(timeline.currentTime).toBe(5);
    });

    it("should not seek to negative time", () => {
      timeline.seek(-5);
      expect(timeline.currentTime).toBe(0);
    });

    it("should cascade playback control to children", () => {
      const child1 = new Timeline();
      const child2 = new Timeline();

      timeline.addChild(child1);
      timeline.addChild(child2);

      timeline.play(true);
      expect(child1.isPlaying).toBe(true);
      expect(child2.isPlaying).toBe(true);

      timeline.pause(true);
      expect(child1.isPlaying).toBe(false);
      expect(child2.isPlaying).toBe(false);
    });

    it("should emit playback events", () => {
      const events: string[] = [];
      
      timeline.on('play', (data) => {
        events.push('play');
        expect(data.currentTime).toBe(0);
        expect(data.cascade).toBe(true);
      });
      
      timeline.on('pause', (data) => {
        events.push('pause');
        expect(data.currentTime).toBe(0);
        expect(data.cascade).toBe(true);
      });
      
      timeline.on('seek', (data) => {
        events.push('seek');
        expect(data.time).toBe(5);
        expect(data.previousTime).toBe(0);
        expect(data.cascade).toBe(true);
      });
      
      timeline.play();
      timeline.pause();
      timeline.seek(5);
      
      expect(events).toEqual(['play', 'pause', 'seek']);
    });

    it("should emit time update events", () => {
      const timeUpdateEvents: Array<{ currentTime: number; deltaTime: number }> = [];
      
      timeline.on('timeUpdate', (data) => {
        timeUpdateEvents.push(data);
      });
      
      // Root timeline update with delta time
      timeline.play();
      timeline.update(0.1); // 100ms delta
      
      expect(timeUpdateEvents).toHaveLength(1);
      expect(timeUpdateEvents[0].currentTime).toBe(0.1);
      expect(timeUpdateEvents[0].deltaTime).toBe(0.1);
    });
  });

  describe("Hierarchy Management", () => {
    it("should add and remove child timelines", () => {
      const child = new Timeline();

      timeline.addChild(child);
      expect(timeline.children).toContain(child);
      expect(child.parent).toBe(timeline);

      timeline.removeChild(child);
      expect(timeline.children).not.toContain(child);
      expect(child.parent).toBeNull();
    });

    it("should emit hierarchy events", () => {
      const childEvents: Array<{ child: Timeline; childCount: number }> = [];
      const objectEvents: Array<{ object: ITimelineObject; objectCount: number }> = [];
      
      timeline.on('childAdded', (data) => {
        childEvents.push({ child: data.child as Timeline, childCount: data.childCount });
      });
      
      timeline.on('childRemoved', (data) => {
        childEvents.push({ child: data.child as Timeline, childCount: data.childCount });
      });
      
      timeline.on('objectAdded', (data) => {
        objectEvents.push(data);
      });
      
      timeline.on('objectRemoved', (data) => {
        objectEvents.push(data);
      });
      
      const child = new Timeline();
      const mockObject = {
        update: vi.fn(),
        dispose: vi.fn(),
      } as unknown as ITimelineObject;
      
      timeline.addChild(child);
      timeline.addObject(mockObject);
      timeline.removeChild(child);
      timeline.removeObject(mockObject);
      
      expect(childEvents).toHaveLength(2);
      expect(childEvents[0].child).toBe(child);
      expect(childEvents[0].childCount).toBe(1);
      expect(childEvents[1].child).toBe(child);
      expect(childEvents[1].childCount).toBe(0);
      
      expect(objectEvents).toHaveLength(2);
      expect(objectEvents[0].object).toBe(mockObject);
      expect(objectEvents[0].objectCount).toBe(1);
      expect(objectEvents[1].object).toBe(mockObject);
      expect(objectEvents[1].objectCount).toBe(0);
    });

    it("should emit property change events", () => {
      const durationEvents: Array<{ oldDuration: number | null; newDuration: number | null }> = [];
      const framerateEvents: Array<{ oldFramerate: number; newFramerate: number }> = [];
      const timeScaleEvents: Array<{ oldTimeScale: number; newTimeScale: number }> = [];
      
      timeline.on('durationChange', (data) => {
        durationEvents.push(data);
      });
      
      timeline.on('framerateChange', (data) => {
        framerateEvents.push(data);
      });
      
      timeline.on('timeScaleChange', (data) => {
        timeScaleEvents.push(data);
      });
      
      timeline.duration = 10;
      timeline.framerate = 30;
      timeline.timeScale = 2;
      
      expect(durationEvents).toHaveLength(1);
      expect(durationEvents[0].oldDuration).toBeNull();
      expect(durationEvents[0].newDuration).toBe(10);
      
      expect(framerateEvents).toHaveLength(1);
      expect(framerateEvents[0].oldFramerate).toBe(60);
      expect(framerateEvents[0].newFramerate).toBe(30);
      
      expect(timeScaleEvents).toHaveLength(1);
      expect(timeScaleEvents[0].oldTimeScale).toBe(1);
      expect(timeScaleEvents[0].newTimeScale).toBe(2);
    });

    it("should support event listener cleanup", () => {
      const listener = vi.fn();
      
      const unsubscribe = timeline.on('play', listener);
      
      timeline.play();
      expect(listener).toHaveBeenCalledTimes(1);
      
      timeline.pause();
      listener.mockClear();
      
      // Remove listener
      const removed = unsubscribe();
      expect(removed).toBe(true);
      
      timeline.play();
      expect(listener).not.toHaveBeenCalled();
    });

    it("should support once listeners", () => {
      const listener = vi.fn();
      
      timeline.once('play', listener);
      
      timeline.play();
      expect(listener).toHaveBeenCalledTimes(1);
      
      timeline.pause();
      timeline.play();
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it("should transfer child from one parent to another", () => {
      const parent1 = new Timeline();
      const parent2 = new Timeline();
      const child = new Timeline();

      parent1.addChild(child);
      expect(parent1.children).toContain(child);
      expect(child.parent).toBe(parent1);

      parent2.addChild(child);
      expect(parent1.children).not.toContain(child);
      expect(parent2.children).toContain(child);
      expect(child.parent).toBe(parent2);
    });

    it("should add and remove timeline objects", () => {
      const object = new GenericTimelineObject();

      timeline.addObject(object);
      expect(timeline.objects).toContain(object);

      timeline.removeObject(object);
      expect(timeline.objects).not.toContain(object);
    });
  });

  describe("Time Conversion Utilities", () => {
    beforeEach(() => {
      timeline.framerate = 30; // 30 FPS for easier calculation
    });

    it("should convert time to frames", () => {
      expect(timeline.localTimeToFrames(1)).toBe(30); // 1 second = 30 frames
      expect(timeline.localTimeToFrames(0.5)).toBe(15); // 0.5 seconds = 15 frames
      expect(timeline.localTimeToFrames(2)).toBe(60); // 2 seconds = 60 frames
    });

    it("should convert frames to time", () => {
      expect(timeline.framesToLocalTime(30)).toBe(1); // 30 frames = 1 second
      expect(timeline.framesToLocalTime(15)).toBe(0.5); // 15 frames = 0.5 seconds
      expect(timeline.framesToLocalTime(60)).toBe(2); // 60 frames = 2 seconds
    });
  });

  describe("Hierarchical Time Updates", () => {
    let parentTimeline: Timeline;
    let childTimeline: Timeline;
    let timelineObject: GenericTimelineObject;

    beforeEach(() => {
      parentTimeline = new Timeline();
      childTimeline = new Timeline({ startTime: 1, timeScale: 2 });
      timelineObject = new GenericTimelineObject();

      parentTimeline.addChild(childTimeline);
      childTimeline.addObject(timelineObject);

      // Add a simple animation property
      const property = timelineObject.addProperty("value", 0);
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({ time: 2, value: 100, interpolation: "Linear" });
    });

    it("should update child timeline with correct local time", () => {
      // Parent at time 2, child starts at 1 with 2x speed scale
      // Child local time = (2 - 1) * 2 = 2
      parentTimeline.seek(2);

      expect(childTimeline.currentTime).toBe(2);
      expect(timelineObject.getCurrentValue("value")).toBe(100);
    });

    it("should handle time before child start time", () => {
      // Parent at time 0.5, child starts at 1
      // Child local time = max(0, (0.5 - 1) * 2) = 0
      parentTimeline.seek(0.5);

      expect(childTimeline.currentTime).toBe(0);
      expect(timelineObject.getCurrentValue("value")).toBe(0);
    });

    it("should handle time scaling correctly", () => {
      // Parent at time 1.5, child starts at 1 with 2x speed
      // Child local time = (1.5 - 1) * 2 = 1
      parentTimeline.seek(1.5);

      expect(childTimeline.currentTime).toBe(1);
      expect(timelineObject.getCurrentValue("value")).toBe(50); // halfway through animation
    });

    it("should update through multiple hierarchy levels", () => {
      const grandchildTimeline = new Timeline({
        startTime: 0.5,
        timeScale: 0.5,
      });
      const grandchildObject = new GenericTimelineObject();

      childTimeline.addChild(grandchildTimeline);
      grandchildTimeline.addObject(grandchildObject);

      const property = grandchildObject.addProperty("nested", 0);
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({ time: 1, value: 200, interpolation: "Linear" });

      // Parent: 3, Child: (3-1)*2 = 4, Grandchild: (4-0.5)*0.5 = 1.75
      parentTimeline.seek(3);

      expect(grandchildTimeline.currentTime).toBe(1.75);
      expect(grandchildObject.getCurrentValue("nested")).toBe(0); // Time 1.75 is after last keyframe (time 1), returns default value
    });
  });

  describe("Root Timeline Updates", () => {
    let timelineObject: GenericTimelineObject;

    beforeEach(() => {
      timelineObject = new GenericTimelineObject();
      timeline.addObject(timelineObject);

      const property = timelineObject.addProperty("progress", 0);
      property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      property.addKeyframe({ time: 1, value: 100, interpolation: "Linear" });
    });

    it("should advance time when playing and receiving delta time", () => {
      timeline.play();

      // Simulate 0.5 seconds delta time
      timeline.update(0.5);
      expect(timeline.currentTime).toBe(0.5);
      expect(timelineObject.getCurrentValue("progress")).toBe(50);

      // Another 0.3 seconds
      timeline.update(0.3);
      expect(timeline.currentTime).toBe(0.8);
      expect(timelineObject.getCurrentValue("progress")).toBe(80);
    });

    it("should not advance time when paused", () => {
      timeline.pause();

      timeline.update(0.5);
      expect(timeline.currentTime).toBe(0);
      expect(timelineObject.getCurrentValue("progress")).toBe(0);
    });

    it("should respect time scale", () => {
      timeline.timeScale = 2; // Double speed
      timeline.play();

      timeline.update(0.5); // 0.5 seconds delta time * 2 scale = 1 second timeline time
      expect(timeline.currentTime).toBe(1);
      expect(timelineObject.getCurrentValue("progress")).toBe(100);
    });
  });

  describe("Debug and Inspection Methods", () => {
    it("should count total children recursively", () => {
      const child1 = new Timeline();
      const child2 = new Timeline();
      const grandchild = new Timeline();

      timeline.addChild(child1);
      timeline.addChild(child2);
      child1.addChild(grandchild);

      expect(timeline.getTotalChildCount()).toBe(3); // child1, child2, grandchild
      expect(child1.getTotalChildCount()).toBe(1); // grandchild
      expect(child2.getTotalChildCount()).toBe(0);
    });

    it("should count total objects recursively", () => {
      const child = new Timeline();
      const object1 = new GenericTimelineObject();
      const object2 = new GenericTimelineObject();
      const childObject = new GenericTimelineObject();

      timeline.addObject(object1);
      timeline.addObject(object2);
      timeline.addChild(child);
      child.addObject(childObject);

      expect(timeline.getTotalObjectCount()).toBe(3); // object1, object2, childObject
      expect(child.getTotalObjectCount()).toBe(1); // childObject
    });

    it("should calculate hierarchy depth", () => {
      const child = new Timeline();
      const grandchild = new Timeline();

      timeline.addChild(child);
      child.addChild(grandchild);

      expect(timeline.getDepth()).toBe(0); // root
      expect(child.getDepth()).toBe(1);
      expect(grandchild.getDepth()).toBe(2);
    });
  });

  describe("Duration and Looping", () => {
    let timelineWithDuration: Timeline;

    beforeEach(() => {
      timelineWithDuration = new Timeline({ duration: 2 }); // 2 second duration
    });

    describe("Optional Duration", () => {
      it("should handle infinite duration (null)", () => {
        timeline.seek(1000); // Very large time
        expect(timeline.currentTime).toBe(1000);
        expect(timeline.isComplete()).toBe(false);
        expect(timeline.getTotalDuration()).toBeNull();
      });

      it("should handle finite duration without looping", () => {
        timelineWithDuration.seek(3); // Beyond duration
        expect(timelineWithDuration.currentTime).toBe(2); // Clamped to duration
        expect(timelineWithDuration.isComplete()).toBe(true);
        expect(timelineWithDuration.getTotalDuration()).toBe(2);
      });

      it("should stop playback when reaching duration without loops", () => {
        timelineWithDuration.play();
        timelineWithDuration.update(3); // Beyond duration
        expect(timelineWithDuration.isPlaying).toBe(false);
        expect(timelineWithDuration.currentTime).toBe(2);
      });
    });

    describe("Infinite Looping", () => {
      beforeEach(() => {
        timelineWithDuration.setInfiniteLoop();
      });

      it("should setup infinite looping correctly", () => {
        expect(timelineWithDuration.loop).toBe(true);
        expect(timelineWithDuration.repeatCount).toBe(0);
        expect(timelineWithDuration.getTotalDuration()).toBeNull();
      });

      it("should loop continuously", () => {
        timelineWithDuration.seek(0.5); // First loop, halfway
        expect(timelineWithDuration.currentTime).toBe(0.5);
        expect(timelineWithDuration.currentLoop).toBe(0);

        timelineWithDuration.seek(2.5); // Second loop, halfway
        expect(timelineWithDuration.currentTime).toBe(0.5);
        expect(timelineWithDuration.currentLoop).toBe(1);

        timelineWithDuration.seek(6.75); // Fourth loop, 3/4 through
        expect(timelineWithDuration.currentTime).toBe(0.75);
        expect(timelineWithDuration.currentLoop).toBe(3);
      });

      it("should never complete with infinite loops", () => {
        timelineWithDuration.seek(1000);
        expect(timelineWithDuration.isComplete()).toBe(false);
      });

      it("should maintain playback state during infinite loops", () => {
        timelineWithDuration.play();
        timelineWithDuration.update(10); // Way beyond single duration
        expect(timelineWithDuration.isPlaying).toBe(true);
      });

      it("should provide correct loop progress", () => {
        timelineWithDuration.seek(1.5); // 3/4 through first loop
        expect(timelineWithDuration.getCurrentLoopProgress()).toBe(0.75);
        expect(timelineWithDuration.getTotalProgress()).toBeNull(); // Infinite
      });
    });

    describe("Finite Looping", () => {
      beforeEach(() => {
        timelineWithDuration.setFiniteLoop(3); // 3 loops
      });

      it("should setup finite looping correctly", () => {
        expect(timelineWithDuration.loop).toBe(true);
        expect(timelineWithDuration.repeatCount).toBe(3);
        expect(timelineWithDuration.getTotalDuration()).toBe(6); // 2 * 3
      });

      it("should loop for specified count", () => {
        timelineWithDuration.seek(0.5); // First loop
        expect(timelineWithDuration.currentTime).toBe(0.5);
        expect(timelineWithDuration.currentLoop).toBe(0);

        timelineWithDuration.seek(2.5); // Second loop
        expect(timelineWithDuration.currentTime).toBe(0.5);
        expect(timelineWithDuration.currentLoop).toBe(1);

        timelineWithDuration.seek(4.5); // Third loop
        expect(timelineWithDuration.currentTime).toBe(0.5);
        expect(timelineWithDuration.currentLoop).toBe(2);
      });

      it("should stop after finite loops complete", () => {
        timelineWithDuration.play();
        timelineWithDuration.update(7); // Beyond all loops
        expect(timelineWithDuration.isPlaying).toBe(false);
        expect(timelineWithDuration.currentTime).toBe(2); // At end of last loop
        expect(timelineWithDuration.currentLoop).toBe(2); // Last loop (0-indexed)
        expect(timelineWithDuration.isComplete()).toBe(true);
      });

      it("should handle seeking beyond finite loops", () => {
        timelineWithDuration.seek(10); // Way beyond total duration
        expect(timelineWithDuration.currentTime).toBe(2); // Clamped to end
        expect(timelineWithDuration.currentLoop).toBe(2); // Last loop
        expect(timelineWithDuration.isComplete()).toBe(true);
      });

      it("should provide correct progress calculations", () => {
        timelineWithDuration.seek(3); // Halfway through total duration
        expect(timelineWithDuration.getCurrentLoopProgress()).toBe(0.5); // Half through current loop
        expect(timelineWithDuration.getTotalProgress()).toBe(0.5); // Half through total

        timelineWithDuration.seek(5); // 5/6 through total duration
        expect(timelineWithDuration.getTotalProgress()).toBeCloseTo(5 / 6, 2);
      });
    });

    describe("Loop Control Methods", () => {
      it("should reset timeline state", () => {
        timelineWithDuration.setInfiniteLoop();
        timelineWithDuration.seek(5.5); // Multiple loops in

        timelineWithDuration.reset();
        expect(timelineWithDuration.currentTime).toBe(0);
        expect(timelineWithDuration.currentLoop).toBe(0);
      });

      it("should disable looping", () => {
        timelineWithDuration.setInfiniteLoop();
        timelineWithDuration.disableLoop();

        expect(timelineWithDuration.loop).toBe(false);
        expect(timelineWithDuration.repeatCount).toBe(0);

        timelineWithDuration.seek(3);
        expect(timelineWithDuration.currentTime).toBe(2); // Clamped, no loop
      });

      it("should throw error when trying to loop without duration", () => {
        expect(() => timeline.setInfiniteLoop()).toThrow(
          "Cannot loop a timeline without a duration",
        );
        expect(() => timeline.setFiniteLoop(3)).toThrow(
          "Cannot loop a timeline without a duration",
        );
      });

      it("should throw error for invalid repeat count", () => {
        expect(() => timelineWithDuration.setFiniteLoop(0)).toThrow(
          "Repeat count must be at least 1",
        );
        expect(() => timelineWithDuration.setFiniteLoop(-1)).toThrow(
          "Repeat count must be at least 1",
        );
      });
    });

    describe("Edge Cases and Boundary Conditions", () => {
      it("should handle exact duration boundaries", () => {
        timelineWithDuration.setFiniteLoop(2);

        // Exact end of first loop
        timelineWithDuration.seek(2);
        expect(timelineWithDuration.currentTime).toBe(0); // Start of second loop
        expect(timelineWithDuration.currentLoop).toBe(1);

        // Exact end of all loops
        timelineWithDuration.seek(4);
        expect(timelineWithDuration.currentTime).toBe(2); // End position
        expect(timelineWithDuration.currentLoop).toBe(1); // Last completed loop
      });

      it("should handle zero time correctly", () => {
        timelineWithDuration.setInfiniteLoop();
        timelineWithDuration.seek(0);
        expect(timelineWithDuration.currentTime).toBe(0);
        expect(timelineWithDuration.currentLoop).toBe(0);
      });

      it("should handle very small durations", () => {
        const microTimeline = new Timeline({
          duration: 0.001,
          loop: true,
          repeatCount: 2,
        });
        microTimeline.seek(0.0015); // 1.5 loops
        expect(microTimeline.currentTime).toBe(0.0005);
        expect(microTimeline.currentLoop).toBe(1);
      });

      it("should handle negative seek values", () => {
        timelineWithDuration.setInfiniteLoop();
        timelineWithDuration.seek(-5);
        expect(timelineWithDuration.currentTime).toBe(0); // Clamped to 0
        expect(timelineWithDuration.currentLoop).toBe(0);
      });
    });

    describe("Loop Integration with Timeline Objects", () => {
      let timelineObject: GenericTimelineObject;

      beforeEach(() => {
        timelineObject = new GenericTimelineObject();
        timelineWithDuration.addObject(timelineObject);
        timelineWithDuration.setInfiniteLoop();

        const property = timelineObject.addProperty("value", 0);
        property.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
        property.addKeyframe({ time: 2, value: 100, interpolation: "Linear" });
      });

      it("should animate correctly across loop boundaries", () => {
        // First loop - quarter way through
        timelineWithDuration.seek(0.5);
        expect(timelineObject.getCurrentValue("value")).toBe(25);

        // Second loop - quarter way through
        timelineWithDuration.seek(2.5);
        expect(timelineObject.getCurrentValue("value")).toBe(25);

        // Third loop - three quarters through
        timelineWithDuration.seek(5.5);
        expect(timelineObject.getCurrentValue("value")).toBe(75);
      });

      it("should handle keyframes at loop boundaries", () => {
        // End of first loop
        timelineWithDuration.seek(2);
        expect(timelineObject.getCurrentValue("value")).toBe(0); // Loop restarts

        // Start of second loop
        timelineWithDuration.seek(2.001);
        expect(timelineObject.getCurrentValue("value")).toBeCloseTo(0.05, 1);
      });
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle removing non-existent children gracefully", () => {
      const nonChild = new Timeline();
      expect(() => timeline.removeChild(nonChild)).not.toThrow();
    });

    it("should handle removing non-existent objects gracefully", () => {
      const nonObject = new GenericTimelineObject();
      expect(() => timeline.removeObject(nonObject)).not.toThrow();
    });

    it("should handle updates with invalid context", () => {
      timeline.play();
      expect(() => timeline.update("invalid")).not.toThrow();
      expect(timeline.currentTime).toBe(0); // should remain unchanged
    });

    it("should handle zero framerate gracefully", () => {
      timeline.framerate = 0;
      expect(timeline.framesToLocalTime(30)).toBe(Infinity);
      expect(timeline.localTimeToFrames(1)).toBe(0);
    });
  });
});

describe("Integration Tests", () => {
  describe("Complex Animation Scenario", () => {
    it("should handle a complex nested animation with multiple objects", () => {
      // Create a scene with multiple animated elements
      const sceneTimeline = new Timeline({ duration: 10, framerate: 60 });
      const characterTimeline = new Timeline({
        startTime: 1,
        duration: 5,
        timeScale: 1.5,
      });
      const backgroundTimeline = new Timeline({
        startTime: 0,
        duration: 8,
        timeScale: 0.8,
      });

      sceneTimeline.addChild(characterTimeline);
      sceneTimeline.addChild(backgroundTimeline);

      // Create animated objects
      const character = new GenericTimelineObject();
      const background = new GenericTimelineObject();

      characterTimeline.addObject(character);
      backgroundTimeline.addObject(background);

      // Set up character animation (walk cycle)
      const charX = character.addProperty("x", 0);
      charX.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      charX.addKeyframe({ time: 3, value: 300, interpolation: "Linear" });

      const charBob = character.addProperty("y", 100);
      charBob.addKeyframe({ time: 0, value: 100, interpolation: "Linear" });
      charBob.addKeyframe({ time: 0.5, value: 90, interpolation: "Linear" });
      charBob.addKeyframe({ time: 1, value: 100, interpolation: "Linear" });

      // Set up background parallax
      const bgX = background.addProperty("x", 0);
      bgX.addKeyframe({ time: 0, value: 0, interpolation: "Linear" });
      bgX.addKeyframe({ time: 5, value: -200, interpolation: "Linear" });

      // Test at various scene times
      sceneTimeline.seek(2.5); // Character halfway through walk, background partway

      // Character time: (2.5 - 1) * 1.5 = 2.25
      expect(characterTimeline.currentTime).toBe(2.25);
      expect(character.getCurrentValue("x")).toBe(225); // 2.25/3 * 300

      // Background time: (2.5 - 0) * 0.8 = 2.0
      expect(backgroundTimeline.currentTime).toBe(2.0);
      expect(background.getCurrentValue("x")).toBe(-80); // 2/5 * -200

      // Test character bobbing - time 2.25 is after last keyframe (time 1), returns default value
      const bobValue = character.getCurrentValue("y");
      expect(bobValue).toBe(100); // Default value since time 2.25 > last keyframe time 1
    });
  });

  describe("Performance Characteristics", () => {
    it("should handle large numbers of keyframes efficiently", () => {
      const property = new AnimatableProperty(0);

      // Add 1000 keyframes
      for (let i = 0; i < 1000; i++) {
        property.addKeyframe({
          time: i * 0.1,
          value: Math.sin(i * 0.1) * 100,
          interpolation: "Linear",
        });
      }

      const startTime = performance.now();

      // Resolve values at 100 different times
      for (let i = 0; i < 100; i++) {
        property.resolveValue(i * 0.5);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 10ms on modern hardware)
      expect(duration).toBeLessThan(10);
    });

    it("should handle deep timeline hierarchies efficiently", () => {
      let currentTimeline = new Timeline();
      const rootTimeline = currentTimeline;

      // Create a 20-level deep hierarchy
      for (let i = 0; i < 20; i++) {
        const child = new Timeline({ startTime: 0.1, timeScale: 0.95 });
        const object = new GenericTimelineObject();
        object.addProperty("depth", i);

        child.addObject(object);
        currentTimeline.addChild(child);
        currentTimeline = child;
      }

      const startTime = performance.now();

      // Update the entire hierarchy
      rootTimeline.seek(5);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(5);
      expect(rootTimeline.getTotalChildCount()).toBe(20);
      expect(rootTimeline.getTotalObjectCount()).toBe(20);
    });
  });
});
