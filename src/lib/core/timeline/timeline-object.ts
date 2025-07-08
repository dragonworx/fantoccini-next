/**
 * TimelineObject implementation for the timeline animation engine.
 * Represents an object with animatable properties that can be placed on a timeline.
 */

import { IObserver } from "./observer.js";
import { IAnimatableProperty, AnimatableProperty } from "./keyframe.js";

/**
 * An object with animatable properties that can be placed on a timeline.
 * It observes its parent timeline for time updates.
 */
export interface ITimelineObject extends IObserver {
  /** A map defining the object's animatable properties schema. */
  readonly properties: Map<string, IAnimatableProperty<any>>;

  /**
   * Receives time updates from the parent timeline.
   * This method resolves all property values and applies them to the object's target.
   * @param localTime The current local time from the parent timeline.
   */
  update(localTime: number): void;
}

/**
 * Base implementation of ITimelineObject that manages animatable properties.
 */
export abstract class TimelineObject implements ITimelineObject {
  public readonly properties: Map<string, IAnimatableProperty<any>> = new Map();

  /**
   * Adds an animatable property to this object.
   * @param name The name of the property.
   * @param defaultValue The default value for the property.
   */
  addProperty<T>(name: string, defaultValue: T): AnimatableProperty<T> {
    const property = new AnimatableProperty(defaultValue);
    this.properties.set(name, property);
    return property;
  }

  /**
   * Gets an animatable property by name.
   * @param name The name of the property.
   * @returns The animatable property, or undefined if not found.
   */
  getProperty<T>(name: string): IAnimatableProperty<T> | undefined {
    return this.properties.get(name) as IAnimatableProperty<T> | undefined;
  }

  /**
   * Receives time updates from the parent timeline.
   * Resolves all property values and calls applyState to update the target.
   */
  update(localTime: number): void {
    const resolvedValues: Map<string, any> = new Map();

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
   * @param values A map of property names to their resolved values.
   */
  protected abstract applyState(values: Map<string, any>): void;
}

/**
 * Example implementation of TimelineObject for DOM elements.
 */
export class DOMTimelineObject extends TimelineObject {
  constructor(private element: HTMLElement) {
    super();

    // Add common CSS properties
    this.addProperty("x", 0);
    this.addProperty("y", 0);
    this.addProperty("rotation", 0);
    this.addProperty("scaleX", 1);
    this.addProperty("scaleY", 1);
    this.addProperty("opacity", 1);
  }

  protected applyState(values: Map<string, any>): void {
    const x = values.get("x") || 0;
    const y = values.get("y") || 0;
    const rotation = values.get("rotation") || 0;
    const scaleX = values.get("scaleX") || 1;
    const scaleY = values.get("scaleY") || 1;
    const opacity = values.get("opacity") || 1;

    // Apply transform
    this.element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;

    // Apply opacity
    this.element.style.opacity = opacity.toString();
  }
}

/**
 * Generic TimelineObject implementation that stores resolved values
 * for testing and custom applications.
 */
export class GenericTimelineObject extends TimelineObject {
  private currentValues: Map<string, any> = new Map();

  /**
   * Gets the current resolved value for a property.
   */
  getCurrentValue<T>(propertyName: string): T | undefined {
    return this.currentValues.get(propertyName);
  }

  /**
   * Gets all current resolved values.
   */
  getCurrentValues(): Map<string, any> {
    return new Map(this.currentValues);
  }

  protected applyState(values: Map<string, any>): void {
    this.currentValues.clear();
    for (const [name, value] of values) {
      this.currentValues.set(name, value);
    }
  }
}
