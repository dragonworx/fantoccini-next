/**
 * TimelineObject implementation for the timeline animation engine.
 * Represents an object with animatable properties that can be placed on a timeline.
 *
 * TimelineObjects are the fundamental units that can be animated within a Timeline.
 * They contain a set of properties that can be interpolated over time using keyframes.
 *
 * @module timeline-object
 *
 * @example
 * // Create a DOM element timeline object
 * const element = document.createElement('div');
 * const object = new DOMTimelineObject(element);
 *
 * // Add keyframes to animate properties
 * const xProperty = object.getProperty('x');
 * xProperty.addKeyframe(0, 0);      // Start at x=0
 * xProperty.addKeyframe(1, 100);    // End at x=100 after 1 second
 *
 * // Add the object to a timeline
 * timeline.addObject(object);
 */

import { IObserver } from './observer.js';
import { IAnimatableProperty, AnimatableProperty } from './keyframe.js';

/**
 * An object with animatable properties that can be placed on a timeline.
 * It observes its parent timeline for time updates.
 *
 * Timeline objects implement the Observer interface to receive time updates
 * from their parent timeline. When the timeline's time changes, the object
 * recalculates all property values and applies them to its target.
 *
 * @interface ITimelineObject
 * @extends IObserver
 *
 * @example
 * class MyCustomObject implements ITimelineObject {
 *   readonly properties: Map<string, IAnimatableProperty<any>> = new Map();
 *
 *   constructor() {
 *     // Initialize with a position property
 *     const position = new AnimatableProperty({ x: 0, y: 0 });
 *     this.properties.set("position", position);
 *   }
 *
 *   update(localTime: number): void {
 *     // Handle timeline updates
 *     const position = this.properties.get("position").resolveValue(localTime);
 *     // Apply position to target
 *   }
 * }
 */
export interface ITimelineObject extends IObserver {
  /**
   * A map defining the object's animatable properties schema.
   * Each property name maps to an IAnimatableProperty that manages keyframes
   * and interpolation for that property.
   *
   * @type {Map<string, IAnimatableProperty<unknown>>}
   */
  readonly properties: Map<string, IAnimatableProperty<unknown>>;

  /**
   * Receives time updates from the parent timeline.
   * This method resolves all property values and applies them to the object's target.
   *
   * @param {number} localTime - The current local time from the parent timeline in seconds
   * @returns {void}
   *
   * @example
   * // This is called automatically when the parent timeline's time changes
   * timelineObject.update(2.5); // Update to 2.5 seconds
   */
  update(localTime: number): void;
}

/**
 * Base implementation of ITimelineObject that manages animatable properties.
 *
 * This abstract class provides the core functionality for timeline objects,
 * including property management and time-based updates. Concrete subclasses
 * must implement the `applyState` method to apply resolved property values
 * to their specific targets.
 *
 * @abstract
 * @class TimelineObject
 * @implements {ITimelineObject}
 *
 * @example
 * // Creating a custom timeline object
 * class MyTimelineObject extends TimelineObject {
 *   private target: MyCustomTarget;
 *
 *   constructor(target: MyCustomTarget) {
 *     super();
 *     this.target = target;
 *
 *     // Add animatable properties
 *     this.addProperty("x", 0);
 *     this.addProperty("color", "#000000");
 *   }
 *
 *   protected applyState(values: Map<string, any>): void {
 *     // Apply values to the target
 *     this.target.x = values.get("x");
 *     this.target.color = values.get("color");
 *   }
 * }
 */
export abstract class TimelineObject implements ITimelineObject {
	public readonly properties: Map<string, IAnimatableProperty<unknown>> = new Map();

	/**
   * Adds an animatable property to this object.
   * Creates a new AnimatableProperty with the specified default value and
   * registers it under the given name.
   *
   * @template T - The type of the property value
   * @param {string} name - The name of the property
   * @param {T} defaultValue - The default value for the property
   * @returns {AnimatableProperty<T>} The created property instance
   *
   * @example
   * // Add a numeric property with default value 0
   * const xProperty = timelineObject.addProperty("x", 0);
   *
   * // Add keyframes to the property
   * xProperty.addKeyframe(0, 0);
   * xProperty.addKeyframe(1, 100);
   */
	public addProperty<T>(name: string, defaultValue: T): AnimatableProperty<T> {
		const property = new AnimatableProperty(defaultValue);
		this.properties.set(name, property);
		return property;
	}

	/**
   * Gets an animatable property by name.
   * Retrieves a previously registered property for adding keyframes or
   * configuring interpolation.
   *
   * @template T - The type of the property value
   * @param {string} name - The name of the property
   * @returns {IAnimatableProperty<T> | undefined} The animatable property, or undefined if not found
   *
   * @example
   * // Get the "x" property to add keyframes
   * const xProperty = timelineObject.getProperty<number>("x");
   * if (xProperty) {
   *   xProperty.addKeyframe(0, 0);
   *   xProperty.addKeyframe(1, 100);
   * }
   */
	public getProperty<T>(name: string): IAnimatableProperty<T> | undefined {
		return this.properties.get(name) as IAnimatableProperty<T> | undefined;
	}

	/**
   * Receives time updates from the parent timeline.
   * Resolves all property values at the given time and calls applyState to update the target.
   * This method is automatically called by the parent timeline during its update cycle.
   *
   * @param {number} localTime - The current time in seconds, relative to the parent timeline
   * @returns {void}
   *
   * @example
   * // This happens automatically when the parent timeline updates:
   * timelineObject.update(1.5); // Update all properties to their values at 1.5 seconds
   */
	public update(localTime: number): void {
		const resolvedValues: Map<string, unknown> = new Map();

		// Resolve all property values at the current time
		for (const [name, property] of this.properties) {
			resolvedValues.set(name, property.resolveValue(localTime));
		}

		// Apply the resolved values to the target
		this.applyState(resolvedValues);
	}

  /**
   * Abstract method that subclasses must implement to apply resolved values
   * to their specific target (DOM element, Three.js object, etc.).
   * This is where the actual application of animated values happens.
   *
   * @protected
   * @abstract
   * @param {Map<string, any>} values - A map of property names to their resolved values
   * @returns {void}
   *
   * @example
   * // Example implementation for a DOM element
   * protected applyState(values: Map<string, any>): void {
   *   const x = values.get("x") || 0;
   *   const y = values.get("y") || 0;
   *   this.element.style.transform = `translate(${x}px, ${y}px)`;
   * }
   */
  protected abstract applyState(values: Map<string, unknown>): void;
}

/**
 * Example implementation of TimelineObject for DOM elements.
 *
 * This class provides a ready-to-use timeline object that animates common CSS properties
 * of an HTML element, including position, scale, rotation, and opacity.
 *
 * @class DOMTimelineObject
 * @extends {TimelineObject}
 *
 * @example
 * // Create a DOM timeline object for a div element
 * const div = document.createElement('div');
 * document.body.appendChild(div);
 *
 * const domObject = new DOMTimelineObject(div);
 *
 * // Set up an animation
 * const xProp = domObject.getProperty<number>("x");
 * const opacityProp = domObject.getProperty<number>("opacity");
 *
 * xProp.addKeyframe(0, 0);      // Start position
 * xProp.addKeyframe(2, 300);    // End position after 2 seconds
 *
 * opacityProp.addKeyframe(0, 0);   // Start transparent
 * opacityProp.addKeyframe(0.5, 1); // Fade in over 0.5 seconds
 *
 * // Add to a timeline
 * timeline.addObject(domObject);
 */
export class DOMTimelineObject extends TimelineObject {
	public constructor(private element: HTMLElement) {
		super();

		// Add common CSS properties
		this.addProperty('x', 0);
		this.addProperty('y', 0);
		this.addProperty('rotation', 0);
		this.addProperty('scaleX', 1);
		this.addProperty('scaleY', 1);
		this.addProperty('opacity', 1);
	}

	protected applyState(values: Map<string, unknown>): void {
		const x = values.get('x') || 0;
		const y = values.get('y') || 0;
		const rotation = values.get('rotation') || 0;
		const scaleX = values.get('scaleX') || 1;
		const scaleY = values.get('scaleY') || 1;
		const opacity = values.get('opacity') || 1;

		// Apply transform
		this.element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;

		// Apply opacity
		this.element.style.opacity = opacity.toString();
	}
}

/**
 * Generic TimelineObject implementation that stores resolved values
 * for testing and custom applications.
 *
 * This utility class doesn't apply values to any specific target but instead
 * stores them internally where they can be retrieved for testing or for use
 * in custom rendering logic.
 *
 * @class GenericTimelineObject
 * @extends {TimelineObject}
 *
 * @example
 * // Create a generic timeline object for testing
 * const testObject = new GenericTimelineObject();
 *
 * // Add properties and keyframes
 * testObject.addProperty("value", 0);
 * testObject.getProperty<number>("value").addKeyframe(0, 0);
 * testObject.getProperty<number>("value").addKeyframe(1, 100);
 *
 * // Simulate timeline updates
 * testObject.update(0.5);
 *
 * // Check interpolated value (should be 50)
 * console.log(testObject.getCurrentValue("value")); // 50
 */
export class GenericTimelineObject extends TimelineObject {
	private currentValues: Map<string, unknown> = new Map();

	/**
   * Gets the current resolved value for a property.
   *
   * @template T - The type of the property value
   * @param {string} propertyName - The name of the property to retrieve
   * @returns {T | undefined} The current value of the property, or undefined if not found
   *
   * @example
   * const object = new GenericTimelineObject();
   * object.addProperty("x", 0);
   * object.update(1.0);
   * const currentX = object.getCurrentValue<number>("x");
   */
	public getCurrentValue<T>(propertyName: string): T | undefined {
		return this.currentValues.get(propertyName) as T | undefined;
	}

	/**
   * Gets all current resolved values.
   * Returns a new Map containing all property values at the current time.
   *
   * @returns {Map<string, any>} A map of all property names to their current values
   *
   * @example
   * const object = new GenericTimelineObject();
   * object.addProperty("x", 0);
   * object.addProperty("y", 0);
   * object.update(1.0);
   *
   * const allValues = object.getCurrentValues();
   * console.log(allValues.get("x"), allValues.get("y"));
   */
	public getCurrentValues(): Map<string, unknown> {
		return new Map(this.currentValues);
	}

	protected applyState(values: Map<string, unknown>): void {
		this.currentValues.clear();
		for (const [name, value] of values) {
			this.currentValues.set(name, value);
		}
	}
}
