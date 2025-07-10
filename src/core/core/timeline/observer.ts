/**
 * Observer pattern interfaces for the timeline animation engine.
 * Provides decoupled update cascade through the timeline hierarchy.
 *
 * This module implements the Observer design pattern, allowing objects to subscribe
 * to and be notified of changes in other objects. In the timeline system, this is used
 * to propagate time changes from parent to child timelines and objects.
 *
 * @module observer
 *
 * @example
 * // Create an observable timeline
 * const parentTimeline = new Timeline();
 *
 * // Create observers (child timelines or objects)
 * const childTimeline = new Timeline();
 *
 * // Subscribe the observer to the observable
 * parentTimeline.subscribe(childTimeline);
 *
 * @see {@link https://en.wikipedia.org/wiki/Observer_pattern|Observer pattern on Wikipedia}
 */

/**
 * An object that can be notified of state changes from an IObservable.
 *
 * Observers implement the `update` method to handle notifications from
 * observables they are subscribed to.
 *
 * @interface IObserver
 *
 * @example
 * class MyObserver implements IObserver {
 *   update(context: any): void {
 *     console.log('Received update with context:', context);
 *   }
 * }
 */
export interface IObserver<T = unknown> {
  update(context: T): void;
}

/**
 * An object that can be observed and can notify its observers of state changes.
 *
 * Observables maintain a list of observers and notify them when their internal
 * state changes.
 *
 * @interface IObservable
 *
 * @example
 * class MyObservable implements IObservable {
 *   private observers: Set<IObserver> = new Set();
 *
 *   subscribe(observer: IObserver): void {
 *     this.observers.add(observer);
 *   }
 *
 *   unsubscribe(observer: IObserver): void {
 *     this.observers.delete(observer);
 *   }
 *
 *   notify(context: any): void {
 *     this.observers.forEach(observer => observer.update(context));
 *   }
 *
 *   // Example of triggering a notification
 *   doSomething(): void {
 *     // Do work...
 *     this.notify('Something happened');
 *   }
 * }
 */
export interface IObservable<T = unknown> {
  subscribe(observer: IObserver<T>): void;
  unsubscribe(observer: IObserver<T>): void;
  notify(context: T): void;
}

/**
 * Base implementation of IObservable that manages a list of observers.
 *
 * This abstract class provides the core functionality for the Observer pattern
 * by managing a collection of observers and providing methods to subscribe,
 * unsubscribe, and notify them.
 *
 * @abstract
 * @class Observable
 * @implements {IObservable}
 *
 * @example
 * class MyTimelineObject extends Observable {
 *   private _value: number = 0;
 *
 *   set value(newValue: number) {
 *     this._value = newValue;
 *     // Notify observers when value changes
 *     this.notify(this._value);
 *   }
 *
 *   get value(): number {
 *     return this._value;
 *   }
 * }
 */
export abstract class Observable<T = unknown> implements IObservable<T> {
	/**
   * Set of observers that are subscribed to this observable.
  * @private
   */
	private observers: Set<IObserver<T>> = new Set();

	/**
   * Adds an observer to the list of observers.
   * Once subscribed, the observer will receive notifications via its update method.
   *
   * @param {IObserver} observer - The observer to subscribe
   * @returns {void}
   */
	public subscribe(observer: IObserver): void {
		this.observers.add(observer);
	}

	/**
   * Removes an observer from the list of observers.
   * The observer will no longer receive notifications.
   *
   * @param {IObserver} observer - The observer to unsubscribe
   * @returns {void}
   */
	public unsubscribe(observer: IObserver): void {
		this.observers.delete(observer);
	}

	/**
   * Notifies all observers by calling their update method with the provided context.
   *
   * @param {any} context - Information to pass to the observers
   * @returns {void}
   *
   * @example
   * // Notify observers of a time change
   * this.notify(this.currentTime);
   */
	public notify(context: T): void {
		this.observers.forEach((observer) => observer.update(context));
	}

	/**
   * Gets the current number of subscribed observers.
   *
   * @protected
   * @returns {number} Number of observers
   */
	protected getObserverCount(): number {
		return this.observers.size;
	}
}
