/**
 * Timeline implementation for the timeline animation engine.
 * Core entity for managing time, playback, and hierarchy.
 */

import { IObserver, IObservable, Observable } from './observer.js';
import { ITimelineObject } from './timeline-object.js';
import { EventEmitter } from '../event-emitter.js';

/**
 * Concrete EventEmitter implementation for Timeline events.
 * @class TimelineEventEmitter
 * @memberof core.timeline
 */
class TimelineEventEmitter extends EventEmitter<TimelineEventMap> {
	public constructor() {
		super({ keepHistory: false });
	}
}

/**
 * Event map for timeline events with type-safe payloads.
 *
 * @interface TimelineEventMap
 * @memberof core.timeline
 */
export interface TimelineEventMap {
	/** Emitted when the timeline starts playing */
	'play': { currentTime: number; cascade: boolean };
	/** Emitted when the timeline pauses */
	'pause': { currentTime: number; cascade: boolean };
	/** Emitted when the timeline seeks to a specific time */
	'seek': { time: number; previousTime: number; cascade: boolean };
	/** Emitted when the timeline's time updates */
	'timeUpdate': { currentTime: number; deltaTime: number };
	/** Emitted when the timeline completes a loop iteration */
	'loopComplete': { loopNumber: number; currentTime: number };
	/** Emitted when the timeline completes all loops and stops */
	'complete': { totalTime: number; totalLoops: number };
	/** Emitted when the timeline resets to the beginning */
	'reset': { previousTime: number };
	/** Emitted when a child timeline is added */
	'childAdded': { child: ITimeline; childCount: number };
	/** Emitted when a child timeline is removed */
	'childRemoved': { child: ITimeline; childCount: number };
	/** Emitted when a timeline object is added */
	'objectAdded': { object: ITimelineObject; objectCount: number };
	/** Emitted when a timeline object is removed */
	'objectRemoved': { object: ITimelineObject; objectCount: number };
	/** Emitted when the timeline's duration changes */
	'durationChange': { oldDuration: number | null; newDuration: number | null };
	/** Emitted when the timeline's frame rate changes */
	'framerateChange': { oldFramerate: number; newFramerate: number };
	/** Emitted when the timeline's time scale changes */
	'timeScaleChange': { oldTimeScale: number; newTimeScale: number };
	/** Emitted when the timeline's loop settings change */
	'loopSettingsChange': { loop: boolean; repeatCount: number };
	/** Index signature for extensibility */
	[key: string]: unknown;
}

/**
 * A self-nesting temporal container that manages playback and time conversion.
 * It acts as both an Observer (of its parent) and an Observable (to its children).
 * @interface ITimeline
 * @memberof core.timeline
 */
export interface ITimeline extends IObserver, IObservable {
  // --- Hierarchy ---
  parent: ITimeline | null;
  children: ITimeline[];
  objects: ITimelineObject[];

  // --- Timing Properties ---
  /** The start time of this timeline, in seconds, relative to its parent's local time. */
  startTime: number;
  /** The intrinsic duration of this timeline in seconds. If null, timeline has infinite duration. */
  duration: number | null;
  /** The playback frame rate for this timeline's context. */
  framerate: number;
  /** A multiplier for playback speed relative to the parent. 1.0 is normal speed. */
  timeScale: number;
  /** The current local time of this timeline in seconds. */
  readonly currentTime: number;

  // --- Loop Properties ---
  /** Whether this timeline should loop when it reaches its duration. */
  loop: boolean;
  /** Number of times to repeat the loop. 0 means infinite loops, >1 means finite repeats. */
  repeatCount: number;
  /** The current loop iteration (read-only). */
  readonly currentLoop: number;

  // --- Playback State & Control ---
  isPlaying: boolean;
  play(cascade?: boolean): void;
  pause(cascade?: boolean): void;
  seek(time: number, cascade?: boolean): void;

  // --- Hierarchy Management ---
  addChild(child: ITimeline): void;
  removeChild(child: ITimeline): void;
  addObject(object: ITimelineObject): void;
  removeObject(object: ITimelineObject): void;

  // --- Utility Methods ---
  /** Converts a local time in seconds to a local frame number based on the timeline's framerate. */
  localTimeToFrames(time: number): number;
  /** Converts a local frame number to a local time in seconds based on the timeline's framerate. */
  framesToLocalTime(frame: number): number;
}

/**
 * Implementation of ITimeline that manages hierarchical time and playback.
 * Extends both Observable (for backward compatibility) and EventEmitter (for new event system).
 * @class Timeline
 * @memberof core.timeline
 */
export class Timeline extends Observable implements ITimeline {
	private eventEmitter: TimelineEventEmitter;
	// Hierarchy
	public parent: ITimeline | null = null;
	public children: ITimeline[] = [];
	public objects: ITimelineObject[] = [];

	// Timing Properties
	public startTime: number = 0;
	private _duration: number | null = null; // Default null (infinite duration)
	private _framerate: number = 60; // Default 60 FPS
	private _timeScale: number = 1; // Normal speed

	// Loop Properties
	public loop: boolean = false;
	public repeatCount: number = 0; // 0 = infinite, >0 = finite repeats
	private _currentLoop: number = 0;

	// Playback State
	public isPlaying: boolean = false;
	private _currentTime: number = 0;
	private _rawTime: number = 0; // Unprocessed time for loop calculations

	public constructor(options: Partial<Pick<Timeline, 'startTime' | 'duration' | 'framerate' | 'timeScale' | 'loop' | 'repeatCount'>> = {}) {
		super();
		this.eventEmitter = new TimelineEventEmitter();
		Object.assign(this, options);
	}

	public get currentTime(): number {
		return this._currentTime;
	}

	public get currentLoop(): number {
		return this._currentLoop;
	}

	public get duration(): number | null {
		return this._duration;
	}

	public set duration(value: number | null) {
		const oldDuration = this._duration;
		this._duration = value;
		if (oldDuration !== value) {
			this.emitEvent('durationChange', { oldDuration, newDuration: value });
		}
	}

	public get framerate(): number {
		return this._framerate;
	}

	public set framerate(value: number) {
		const oldFramerate = this._framerate;
		this._framerate = value;
		if (oldFramerate !== value) {
			this.emitEvent('framerateChange', { oldFramerate, newFramerate: value });
		}
	}

	public get timeScale(): number {
		return this._timeScale;
	}

	public set timeScale(value: number) {
		const oldTimeScale = this._timeScale;
		this._timeScale = value;
		if (oldTimeScale !== value) {
			this.emitEvent('timeScaleChange', { oldTimeScale, newTimeScale: value });
		}
	}

	// --- EventEmitter Delegation ---

	/**
	 * Adds an event listener for the specified timeline event.
	 *
	 * @template K - The event name type
	 * @param event - The event name
	 * @param listener - The event listener function
	 * @returns A function to remove this listener
	 */
	public on<K extends keyof TimelineEventMap>(
		event: K,
		listener: (data: TimelineEventMap[K]) => void
	): () => boolean {
		return this.eventEmitter.on(event, listener);
	}

	/**
	 * Adds a one-time event listener for the specified timeline event.
	 *
	 * @template K - The event name type
	 * @param event - The event name
	 * @param listener - The event listener function
	 * @returns A function to remove this listener
	 */
	public once<K extends keyof TimelineEventMap>(
		event: K,
		listener: (data: TimelineEventMap[K]) => void
	): () => boolean {
		return this.eventEmitter.once(event, listener);
	}

	/**
	 * Removes an event listener for the specified timeline event.
	 *
	 * @template K - The event name type
	 * @param event - The event name
	 * @param listener - The event listener function to remove
	 * @returns true if the listener was removed, false if it wasn't found
	 */
	public off<K extends keyof TimelineEventMap>(
		event: K,
		listener: (data: TimelineEventMap[K]) => void
	): boolean {
		return this.eventEmitter.off(event, listener);
	}

	/**
	 * Emits a timeline event with the specified payload.
	 *
	 * @template K - The event name type
	 * @param event - The event name
	 * @param payload - The event payload
	 * @returns The number of listeners that were called
	 */
	private emitEvent<K extends keyof TimelineEventMap>(event: K, payload: TimelineEventMap[K]): number {
		return this.eventEmitter.emitEvent(event, payload);
	}

	// --- Playback Control ---

	public play(cascade: boolean = true): void {
		this.isPlaying = true;
		this.emitEvent('play', { currentTime: this._currentTime, cascade });

		if (cascade) {
			this.children.forEach(child => child.play(true));
		}
	}

	public pause(cascade: boolean = true): void {
		this.isPlaying = false;
		this.emitEvent('pause', { currentTime: this._currentTime, cascade });

		if (cascade) {
			this.children.forEach(child => child.pause(true));
		}
	}

	public seek(time: number, cascade: boolean = true): void {
		const previousTime = this._currentTime;
		this._rawTime = Math.max(0, time);
		this.updateTimeFromRaw();

		this.emitEvent('seek', { time: this._currentTime, previousTime, cascade });

		// Update timeline objects (not children - they'll be updated via cascade)
		this.objects.forEach(object => {
			object.update(this._currentTime);
		});

		if (cascade) {
			this.children.forEach(child => {
				const childLocalTime = this.parentTimeToChildTime(this._currentTime, child);
				child.seek(childLocalTime, true);
			});
		}
	}

	// --- Hierarchy Management ---

	public addChild(child: ITimeline): void {
		if (child.parent) {
			child.parent.removeChild(child);
		}

		child.parent = this;
		this.children.push(child);
		this.subscribe(child);
		this.emitEvent('childAdded', { child, childCount: this.children.length });
	}

	public removeChild(child: ITimeline): void {
		const index = this.children.indexOf(child);
		if (index >= 0) {
			this.children.splice(index, 1);
			child.parent = null;
			this.unsubscribe(child);
			this.emitEvent('childRemoved', { child, childCount: this.children.length });
		}
	}

	public addObject(object: ITimelineObject): void {
		this.objects.push(object);
		this.subscribe(object);
		this.emitEvent('objectAdded', { object, objectCount: this.objects.length });
	}

	public removeObject(object: ITimelineObject): void {
		const index = this.objects.indexOf(object);
		if (index >= 0) {
			this.objects.splice(index, 1);
			this.unsubscribe(object);
			this.emitEvent('objectRemoved', { object, objectCount: this.objects.length });
		}
	}

	// --- Time Updates ---

	/**
   * Updates the timeline with a delta time (for root timelines)
   * or receives update from parent timeline.
   */
	public update(context: number | unknown): void {
		const previousTime = this._currentTime;
		let deltaTime = 0;

		if (this.parent === null) {
			// Root timeline - context should be delta time in seconds
			if (this.isPlaying && typeof context === 'number') {
				deltaTime = context * this.timeScale;
				this._rawTime += deltaTime;
				this.updateTimeFromRaw();
			}
		} else {
			// Child timeline - context should be parent's current time
			if (typeof context === 'number') {
				this._rawTime = this.parentTimeToChildTime(context, this);
				this.updateTimeFromRaw();
				deltaTime = this._currentTime - previousTime;
			}
		}

		// Emit time update event if time changed
		if (this._currentTime !== previousTime) {
			this.emitEvent('timeUpdate', { currentTime: this._currentTime, deltaTime });
		}

		this.updateChildren();
	}

	/**
   * Processes raw time according to duration and looping rules.
   * Maps the raw time to the correct timeline local time.
   */
	private updateTimeFromRaw(): void {
		const previousLoop = this._currentLoop;
		const wasPlaying = this.isPlaying;

		if (this.duration === null) {
			// Infinite duration - raw time becomes current time
			this._currentTime = Math.max(0, this._rawTime);
			this._currentLoop = 0;
			return;
		}

		const duration = this.duration;
		const rawTime = Math.max(0, this._rawTime);

		if (!this.loop) {
			// No looping - clamp to duration
			this._currentTime = Math.min(rawTime, duration);
			this._currentLoop = 0;

			// Stop playback if we've reached the end
			if (rawTime >= duration) {
				this.isPlaying = false;
				if (wasPlaying) {
					this.emitEvent('complete', { totalTime: this._rawTime, totalLoops: 0 });
				}
			}
			return;
		}

		// Looping enabled
		if (rawTime < duration) {
			// Within first iteration
			this._currentTime = rawTime;
			this._currentLoop = 0;
			return;
		}

		// Calculate loop iteration and local time
		const totalLoops = Math.floor(rawTime / duration);
		const localTime = rawTime % duration;

		if (this.repeatCount > 0 && totalLoops >= this.repeatCount) {
			// Finite loops - stop at the end of final iteration
			this._currentTime = duration;
			this._currentLoop = this.repeatCount - 1;
			this.isPlaying = false;
			if (wasPlaying) {
				this.emitEvent('complete', { totalTime: this._rawTime, totalLoops: this.repeatCount });
			}
		} else {
			// Continue looping (infinite or within repeat count)
			this._currentTime = localTime;
			this._currentLoop = totalLoops;

			// Emit loop complete event if we moved to a new loop
			if (this._currentLoop > previousLoop) {
				this.emitEvent('loopComplete', { loopNumber: previousLoop, currentTime: this._currentTime });
			}
		}
	}

	/**
   * Updates all child timelines and objects with the current time.
   */
	private updateChildren(): void {
		// Update child timelines
		this.children.forEach(child => {
			if (child instanceof Timeline) {
				child.update(this._currentTime);
			}
		});

		// Update timeline objects
		this.objects.forEach(object => {
			object.update(this._currentTime);
		});

		// Notify observers
		this.notify(this._currentTime);
	}

	/**
   * Converts parent time to child's local time.
   */
	private parentTimeToChildTime(parentTime: number, child: ITimeline): number {
		return Math.max(0, (parentTime - child.startTime) * child.timeScale);
	}

	// --- Utility Methods ---

	public localTimeToFrames(time: number): number {
		return time * this.framerate;
	}

	public framesToLocalTime(frame: number): number {
		return frame / this.framerate;
	}

	// --- Loop Control Methods ---

	/**
   * Resets the timeline to the beginning and clears loop state.
   */
	public reset(): void {
		const previousTime = this._currentTime;
		this._rawTime = 0;
		this._currentTime = 0;
		this._currentLoop = 0;
		this.updateChildren();
		this.emitEvent('reset', { previousTime });
	}

	/**
   * Gets the total duration including all loops.
   * Returns null if the timeline has infinite duration or infinite loops.
   */
	public getTotalDuration(): number | null {
		if (this.duration === null || (this.loop && this.repeatCount === 0)) {
			return null; // Infinite duration
		}

		if (!this.loop) {
			return this.duration;
		}

		return this.duration * this.repeatCount;
	}

	/**
   * Gets the progress through the entire timeline including loops (0-1).
   * Returns null if the timeline has infinite duration.
   */
	public getTotalProgress(): number | null {
		const totalDuration = this.getTotalDuration();
		if (totalDuration === null) {
			return null;
		}

		return Math.min(1, this._rawTime / totalDuration);
	}

	/**
   * Gets the progress through the current loop iteration (0-1).
   * Returns null if the timeline has no duration.
   */
	public getCurrentLoopProgress(): number | null {
		if (this.duration === null) {
			return null;
		}

		return Math.min(1, this._currentTime / this.duration);
	}

	/**
   * Checks if the timeline has completed all its loops.
   */
	public isComplete(): boolean {
		if (this.duration === null || (this.loop && this.repeatCount === 0)) {
			return false; // Infinite timelines never complete
		}

		if (!this.loop) {
			return this._rawTime >= this.duration;
		}

		return this.repeatCount > 0 && this._currentLoop >= this.repeatCount - 1 && this._currentTime >= this.duration;
	}

	/**
   * Sets up the timeline for infinite looping.
   */
	public setInfiniteLoop(): void {
		if (this.duration === null) {
			throw new Error('Cannot loop a timeline without a duration');
		}
		this.loop = true;
		this.repeatCount = 0;
		this.emitEvent('loopSettingsChange', { loop: true, repeatCount: 0 });
	}

	/**
   * Sets up the timeline for finite looping.
   */
	public setFiniteLoop(repeatCount: number): void {
		if (this.duration === null) {
			throw new Error('Cannot loop a timeline without a duration');
		}
		if (repeatCount < 1) {
			throw new Error('Repeat count must be at least 1');
		}
		this.loop = true;
		this.repeatCount = repeatCount;
		this.emitEvent('loopSettingsChange', { loop: true, repeatCount });
	}

	/**
   * Disables looping for the timeline.
   */
	public disableLoop(): void {
		this.loop = false;
		this.repeatCount = 0;
		this.emitEvent('loopSettingsChange', { loop: false, repeatCount: 0 });
	}

	// --- Debugging/Inspection ---

	/**
   * Gets the total number of child timelines (including nested children).
   */
	public getTotalChildCount(): number {
		let count = this.children.length;
		this.children.forEach(child => {
			if (child instanceof Timeline) {
				count += child.getTotalChildCount();
			}
		});
		return count;
	}

	/**
   * Gets the total number of timeline objects (including in nested children).
   */
	public getTotalObjectCount(): number {
		let count = this.objects.length;
		this.children.forEach(child => {
			if (child instanceof Timeline) {
				count += child.getTotalObjectCount();
			}
		});
		return count;
	}

	/**
   * Gets the depth of this timeline in the hierarchy (root = 0).
   */
	public getDepth(): number {
		let depth = 0;
		let current = this.parent;
		while (current) {
			depth++;
			current = current.parent;
		}
		return depth;
	}

	/**
   * Disposes of the timeline and cleans up all resources.
   * This should be called when the timeline is no longer needed.
   */
	public dispose(): void {
		this.eventEmitter.dispose();

		// Clean up hierarchy
		this.children.forEach(child => {
			if (child instanceof Timeline) {
				child.dispose();
			}
		});
		this.children = [];
		this.objects = [];

		// Remove from parent if attached
		if (this.parent) {
			this.parent.removeChild(this);
		}
	}
}
