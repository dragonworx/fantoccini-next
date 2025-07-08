/**
 * Observer pattern interfaces for the timeline animation engine.
 * Provides decoupled update cascade through the timeline hierarchy.
 */

/** An object that can be notified of state changes from an IObservable. */
export interface IObserver {
  update(context: any): void;
}

/** An object that can be observed and can notify its observers of state changes. */
export interface IObservable {
  subscribe(observer: IObserver): void;
  unsubscribe(observer: IObserver): void;
  notify(context: any): void;
}

/**
 * Base implementation of IObservable that manages a list of observers.
 */
export abstract class Observable implements IObservable {
  private observers: Set<IObserver> = new Set();

  subscribe(observer: IObserver): void {
    this.observers.add(observer);
  }

  unsubscribe(observer: IObserver): void {
    this.observers.delete(observer);
  }

  notify(context: any): void {
    this.observers.forEach(observer => observer.update(context));
  }

  protected getObserverCount(): number {
    return this.observers.size;
  }
}