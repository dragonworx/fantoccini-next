/**
 * @namespace core.timeline
 * @description Timeline Animation Engine
 *
 * A hierarchical, rendering-agnostic animation system built on the Observer pattern.
 * Supports nested timelines with independent time contexts and keyframe-based property animation.
 *
 * Key features include:
 *
 * - Nested timelines with independent time contexts
 * - Support for variable playback speeds and looping
 * - Frame-rate independent animation
 * - Observer pattern for time-based events
 * - Keyframe-based property animation
 *
 * @example
 * // Create a root timeline that runs at 60fps
 * const rootTimeline = new Timeline({
 *   framerate: 60
 * });
 *
 * // Create a child timeline that starts after 1 second
 * const childTimeline = new Timeline({
 *   startTime: 1,
 *   duration: 5,
 *   loop: true
 * });
 *
 * rootTimeline.addChild(childTimeline);
 * rootTimeline.play();
 */

/**
 * Core components of the timeline animation system.
 * @memberof core.timeline
 * @see core.timeline.IObserver - Interface for objects that observe timeline changes
 * @see core.timeline.IObservable - Interface for objects that emit timeline events
 * @see core.timeline.Keyframe - Defines property values at specific points in time
 * @see core.timeline.ITimelineObject - Interface for objects that can be animated on a timeline
 * @see core.timeline.ITimeline - Interface defining the timeline API
 * @see core.timeline.Timeline - Main implementation of the timeline system
 */
export * from './observer.js';
export * from './keyframe.js';
export * from './timeline-object.js';
export * from './timeline.js';
