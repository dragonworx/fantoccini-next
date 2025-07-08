# System Design: Hierarchical Timeline Animation Engine

## 1\. Overview

This document specifies the architecture for a rendering-agnostic, hierarchical animation engine in TypeScript. The design is centered on a self-nesting `Timeline` entity that provides a flexible and powerful way to choreograph complex animations.

The core principles of this design are:

  * **Hierarchical Time:** Timelines can be nested within each other, each maintaining its own local time context (framerate, start time, time scale) relative to its parent. This allows for modular and complex animation sequencing.[1, 2, 3]
  * **Decoupled Updates:** The system uses the Observer pattern to propagate time updates through the hierarchy, ensuring that parent and child timelines are loosely coupled for greater maintainability and flexibility.
  * **Component-Based Objects:** Animatable objects (`TimelineObject`) are treated as components that can be placed on any timeline. These objects are responsible for their own property schemas and for applying the final animated state, making the engine rendering-agnostic.
  * **Data-Driven Properties:** Animation data is stored in `AnimatableProperty` channels as a sparse collection of keyframes. These channels are responsible for resolving a property's value at any given time through interpolation, with a robust fallback to a default value.

## 2\. Core Entities & Data Structures

The system is composed of the following core interfaces and types.

### 2.1. `IKeyframe`

The atomic unit of animation data. It defines a property's value at a single point in time.

```typescript
/**
 * Represents a single point of change for a property on a timeline.
 * @template T The data type of the value (e.g., number, string).
 */
interface IKeyframe<T> {
  time: number; // Time in seconds, relative to the parent timeline's local time.
  value: T;     // The value of the property at this keyframe.

  /** The interpolation method to use for the segment leading to this keyframe. */
  interpolation: 'Step' | 'Linear' | 'Bezier'; // And others like 'CatmullRom', etc.
}
```

### 2.2. `IAnimatableProperty`

A channel that manages the keyframes for a single animatable property. It is responsible for resolving the property's value at any given time.

```typescript
/**
 * Manages a collection of keyframes for a single animatable property.
 * @template T The data type of the value.
 */
interface IAnimatableProperty<T> {
  /** The value to return if no keyframes exist or if time is outside the keyframe range. */
  readonly defaultValue: T;

  /** A time-sorted array of keyframes. */
  keyframes: IKeyframe<T>;

  /**
   * Resolves the property's value at a given local time.
   * It finds the surrounding keyframes and interpolates between them.
   * If no keyframes are present, it returns the defaultValue.
   * @param localTime The time (in seconds) at which to evaluate the value.
   * @returns The interpolated value of type T.
   */
  resolveValue(localTime: number): T;
}
```

### 2.3. `ITimelineObject`

An object that can be placed on a timeline. It encapsulates a schema of animatable properties and is responsible for applying the final animated state to its target. This makes it the bridge to any rendering system (DOM, Three.js, etc.).

```typescript
/**
 * An object with animatable properties that can be placed on a timeline.
 * It observes its parent timeline for time updates.
 */
interface ITimelineObject extends IObserver {
  /** A map defining the object's animatable properties schema. */
  readonly properties: Map<string, IAnimatableProperty<any>>;

  /**
   * Receives time updates from the parent timeline.
   * This method resolves all property values and applies them to the object's target.
   * @param localTime The current local time from the parent timeline.
   */
  update(localTime: number): void;
}
```

### 2.4. `ITimeline`

The core entity for managing time, playback, and hierarchy. It is self-nestable and acts as a container for `ITimelineObject`s and other child `ITimeline`s.

```typescript
/**
 * A self-nesting temporal container that manages playback and time conversion.
 * It acts as both an Observer (of its parent) and an Observable (to its children).
 */
interface ITimeline extends IObserver, IObservable {
  // --- Hierarchy ---
  parent: ITimeline | null;
  children: ITimeline;
  objects: ITimelineObject;

  // --- Timing Properties ---
  /** The start time of this timeline, in seconds, relative to its parent's local time. */
  startTime: number;
  /** The intrinsic duration of this timeline in seconds. */
  duration: number;
  /** The playback frame rate for this timeline's context. */
  framerate: number;
  /** A multiplier for playback speed relative to the parent. 1.0 is normal speed. */
  timeScale: number;
  /** The current local time of this timeline in seconds. */
  readonly currentTime: number;

  // --- Playback State & Control ---
  isPlaying: boolean;
  play(cascade?: boolean): void;
  pause(cascade?: boolean): void;
  seek(time: number, cascade?: boolean): void;

  // --- Utility Methods ---
  /** Converts a local time in seconds to a local frame number based on the timeline's framerate. */
  localTimeToFrames(time: number): number;
  /** Converts a local frame number to a local time in seconds based on the timeline's framerate. */
  framesToLocalTime(frame: number): number;
}
```

### 2.5. Observer Pattern Interfaces

These interfaces provide the foundation for a decoupled update cascade.

```typescript
/** An object that can be notified of state changes from an IObservable. */
interface IObserver {
  update(context: any): void;
}

/** An object that can be observed and can notify its observers of state changes. */
interface IObservable {
  subscribe(observer: IObserver): void;
  unsubscribe(observer: IObserver): void;
  notify(context: any): void;
}
```

## 3\. System Architecture and Data Flow

### 3.1. Hierarchical Structure

The animation system is structured as a tree of `ITimeline` instances. A single root timeline drives the global animation time. Any timeline can contain child timelines and `ITimelineObject`s. This allows for complex, modular animation sequences where, for example, a "Scene" timeline can contain a "Character" timeline, which in turn contains timelines for individual actions.[1, 2, 3]

### 3.2. Time Management and Conversion

Each `ITimeline` maintains its own local time context, independent of its parent's framerate or time scale.

  * **Global to Local Time Conversion:** The core of the hierarchical timing model is the conversion of a parent's time into a child's local time. This happens during the update cascade. For any given child timeline, its `currentTime` is calculated as:

    ```
    child.currentTime = (parent.currentTime - child.startTime) * child.timeScale;
    ```

    This process is applied recursively down the hierarchy.[4, 5] A root timeline (where `parent` is `null`) advances its `currentTime` based on the delta time provided by the browser's `requestAnimationFrame` loop.

  * **Frame/Time Conversion:** The `framerate` property allows for easy conversion between time (seconds) and frames, which is essential for authoring tools. The formulas are:

      * `frames = timeInSeconds * framerate`
      * `timeInSeconds = frames / framerate`

### 3.3. Update Cascade via Observer Pattern

To avoid tight coupling between parent and child entities, the system uses the **Observer pattern** for updates.

1.  **Subscription:** When a child `ITimeline` or `ITimelineObject` is added to a parent `ITimeline`, it subscribes to the parent.
2.  **Notification Flow:**
      * The main application loop calls `update()` on the root `ITimeline`.
      * The root timeline updates its `currentTime` and then calls `notify()` on its children, passing its new time.
      * Each child `ITimeline` receives this update, calculates its own local `currentTime`, and then recursively calls `notify()` on its own children and objects.
      * Each `ITimelineObject` receives the final local time from its parent timeline in its `update()` method.
3.  **State Application:** Inside its `update()` method, the `ITimelineObject` iterates through its `properties` map, calls `resolveValue(localTime)` on each `IAnimatableProperty`, and applies the returned values to its target (e.g., a DOM element's style or a Three.js object's position).

This architecture ensures that timelines only need to know that their children are `IObserver`s, not what their concrete types are, promoting modularity and maintainability.

### 3.4. Animatable Property Model

  * **Data Storage:** Each `IAnimatableProperty` stores its `IKeyframe` data in a simple, time-sorted array. This is the industry-standard approach for performance-critical animation systems, as it leverages CPU cache locality during sequential playback and allows for fast `$O(\log n)$` lookups using binary search.[6, 7]
  * **Value Resolution:** The `resolveValue(localTime)` method performs a binary search to find the keyframes immediately before and after the given `localTime`. It then uses the specified `interpolation` method to calculate the intermediate value.
  * **Default Value:** If `resolveValue` is called for a time outside the range of existing keyframes, or if the `keyframes` array is empty, the property's `defaultValue` is returned. This ensures that an object always has a predictable and valid state.
