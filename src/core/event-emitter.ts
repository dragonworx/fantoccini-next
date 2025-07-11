/**
 * Generic EventEmitter base class with type-safe event handling.
 * 
 * This class provides a foundation for event-driven architecture with full TypeScript
 * type safety. Classes extending EventEmitter can define their own event maps to get
 * strong typing for event names and payloads.
 *
 * @module event-emitter
 * @memberof core
 * 
 * @example
 * // Define your event map
 * interface MyEventMap {
 *   'data:change': { value: number; timestamp: number };
 *   'user:login': { userId: string; username: string };
 *   'error': { message: string; code: number };
 * }
 * 
 * // Extend EventEmitter with your event map
 * class MyClass extends EventEmitter<MyEventMap> {
 *   updateData(value: number) {
 *     this.emit('data:change', { value, timestamp: Date.now() });
 *   }
 * }
 * 
 * // Usage with full type safety
 * const instance = new MyClass();
 * instance.on('data:change', (data) => {
 *   console.log(data.value); // TypeScript knows this is a number
 * });
 */

/**
 * Base event map interface that all event maps must extend.
 * Maps event names to their payload types.
 */
export interface BaseEventMap {
	[event: string]: unknown;
}

/**
 * Function type for event listeners.
 * 
 * @template T - The payload type for this event
 * @param payload - The event payload
 * @returns void or a cleanup function
 */
export type EventListener<T = unknown> = (payload: T) => void;

/**
 * Function type for event listener cleanup.
 * 
 * @returns true if the listener was removed, false if it wasn't found
 */
export type EventUnsubscriber = () => boolean;

/**
 * Event history entry for debugging and replay functionality.
 * 
 * @template TEventMap - The event map type
 */
export interface EventHistoryEntry<TEventMap extends BaseEventMap = BaseEventMap> {
	/** The event name */
	event: keyof TEventMap;
	/** The event payload */
	payload: TEventMap[keyof TEventMap];
	/** When the event was emitted */
	timestamp: number;
	/** Unique identifier for this event */
	id: string;
}

/**
 * Options for configuring EventEmitter behavior.
 */
export interface EventEmitterOptions {
	/** Whether to keep a history of emitted events for debugging */
	keepHistory?: boolean;
	/** Maximum number of events to keep in history */
	maxHistorySize?: number;
	/** Whether to warn when adding many listeners to the same event */
	warnOnManyListeners?: boolean;
	/** Threshold for "many listeners" warning */
	maxListeners?: number;
}

/**
 * Generic EventEmitter base class with full TypeScript type safety.
 * 
 * This class provides a robust foundation for event-driven architecture.
 * Extending classes can define their own event maps to get complete type safety
 * for event names and payloads.
 * 
 * @template TEventMap - The event map defining available events and their payloads
 * 
 * @class EventEmitter
 * @memberof core
 * 
 * @example
 * // Define events for a media player
 * interface MediaPlayerEvents {
 *   'play': { currentTime: number };
 *   'pause': { currentTime: number };
 *   'seek': { from: number; to: number };
 *   'error': { message: string; code: number };
 * }
 * 
 * class MediaPlayer extends EventEmitter<MediaPlayerEvents> {
 *   private currentTime = 0;
 *   
 *   play() {
 *     // TypeScript ensures payload matches the event map
 *     this.emit('play', { currentTime: this.currentTime });
 *   }
 *   
 *   pause() {
 *     this.emit('pause', { currentTime: this.currentTime });
 *   }
 * }
 * 
 * // Usage with full type safety
 * const player = new MediaPlayer();
 * player.on('play', (data) => {
 *   console.log(`Playing at ${data.currentTime}s`); // TypeScript knows data structure
 * });
 */
export abstract class EventEmitter<TEventMap extends BaseEventMap = BaseEventMap> {
	/**
	 * Map of event names to their listener sets.
	 * 
	 * @private
	 */
	private listeners = new Map<keyof TEventMap, Set<EventListener<any>>>();
	
	/**
	 * Map of event names to their once-only listener sets.
	 * 
	 * @private
	 */
	private onceListeners = new Map<keyof TEventMap, Set<EventListener<any>>>();
	
	/**
	 * History of emitted events for debugging and replay.
	 * 
	 * @private
	 */
	private eventHistory: EventHistoryEntry<TEventMap>[] = [];
	
	/**
	 * Configuration options for this EventEmitter.
	 * 
	 * @private
	 */
	private options: EventEmitterOptions;
	
	/**
	 * Counter for generating unique event IDs.
	 * 
	 * @private
	 */
	private eventIdCounter = 0;
	
	/**
	 * Creates a new EventEmitter instance.
	 * 
	 * @param options - Configuration options
	 */
	public constructor(options: EventEmitterOptions = {}) {
		this.options = {
			keepHistory: false,
			maxHistorySize: 1000,
			warnOnManyListeners: true,
			maxListeners: 10,
			...options
		};
	}
	
	/**
	 * Adds an event listener for the specified event.
	 * 
	 * @template K - The event name type
	 * @param event - The event name
	 * @param listener - The event listener function
	 * @returns A function to remove this listener
	 * 
	 * @example
	 * const unsubscribe = emitter.on('data:change', (data) => {
	 *   console.log('Data changed:', data.value);
	 * });
	 * 
	 * // Later, remove the listener
	 * unsubscribe();
	 */
	public on<K extends keyof TEventMap>(
		event: K,
		listener: EventListener<TEventMap[K]>
	): EventUnsubscriber {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		
		const eventListeners = this.listeners.get(event)!;
		eventListeners.add(listener);
		
		// Warn about many listeners if enabled
		if (this.options.warnOnManyListeners && eventListeners.size > this.options.maxListeners!) {
			console.warn(
				`EventEmitter: Many listeners (${eventListeners.size}) added for event '${String(event)}'. ` +
				'This may indicate a memory leak.'
			);
		}
		
		return () => this.off(event, listener);
	}
	
	/**
	 * Adds a one-time event listener for the specified event.
	 * The listener will be automatically removed after being called once.
	 * 
	 * @template K - The event name type
	 * @param event - The event name
	 * @param listener - The event listener function
	 * @returns A function to remove this listener
	 * 
	 * @example
	 * emitter.once('ready', () => {
	 *   console.log('Ready event fired - this will only run once');
	 * });
	 */
	public once<K extends keyof TEventMap>(
		event: K,
		listener: EventListener<TEventMap[K]>
	): EventUnsubscriber {
		if (!this.onceListeners.has(event)) {
			this.onceListeners.set(event, new Set());
		}
		
		this.onceListeners.get(event)!.add(listener);
		
		return () => this.offOnce(event, listener);
	}
	
	/**
	 * Removes an event listener for the specified event.
	 * 
	 * @template K - The event name type
	 * @param event - The event name
	 * @param listener - The event listener function to remove
	 * @returns true if the listener was removed, false if it wasn't found
	 * 
	 * @example
	 * const listener = (data) => console.log(data);
	 * emitter.on('test', listener);
	 * emitter.off('test', listener); // Returns true
	 */
	public off<K extends keyof TEventMap>(
		event: K,
		listener: EventListener<TEventMap[K]>
	): boolean {
		const eventListeners = this.listeners.get(event);
		if (!eventListeners) {
			return false;
		}
		
		return eventListeners.delete(listener);
	}
	
	/**
	 * Removes a one-time event listener for the specified event.
	 * 
	 * @template K - The event name type
	 * @param event - The event name
	 * @param listener - The event listener function to remove
	 * @returns true if the listener was removed, false if it wasn't found
	 */
	public offOnce<K extends keyof TEventMap>(
		event: K,
		listener: EventListener<TEventMap[K]>
	): boolean {
		const eventListeners = this.onceListeners.get(event);
		if (!eventListeners) {
			return false;
		}
		
		return eventListeners.delete(listener);
	}
	
	/**
	 * Removes all listeners for the specified event, or all listeners if no event is specified.
	 * 
	 * @param event - The event name to remove listeners for, or undefined to remove all
	 * @returns The number of listeners removed
	 * 
	 * @example
	 * emitter.removeAllListeners('data:change'); // Remove all listeners for this event
	 * emitter.removeAllListeners(); // Remove all listeners for all events
	 */
	public removeAllListeners<K extends keyof TEventMap>(event?: K): number {
		let removedCount = 0;
		
		if (event) {
			// Remove listeners for specific event
			const eventListeners = this.listeners.get(event);
			if (eventListeners) {
				removedCount += eventListeners.size;
				eventListeners.clear();
			}
			
			const onceEventListeners = this.onceListeners.get(event);
			if (onceEventListeners) {
				removedCount += onceEventListeners.size;
				onceEventListeners.clear();
			}
		} else {
			// Remove all listeners
			this.listeners.forEach(eventListeners => {
				removedCount += eventListeners.size;
				eventListeners.clear();
			});
			this.onceListeners.forEach(eventListeners => {
				removedCount += eventListeners.size;
				eventListeners.clear();
			});
		}
		
		return removedCount;
	}
	
	/**
	 * Emits an event with the specified payload.
	 * All listeners for this event will be called with the payload.
	 * 
	 * @template K - The event name type
	 * @param event - The event name
	 * @param payload - The event payload
	 * @returns The number of listeners that were called
	 * 
	 * @example
	 * emitter.emit('data:change', { value: 42, timestamp: Date.now() });
	 */
	protected emit<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): number {
		let calledCount = 0;
		
		// Record event in history if enabled
		if (this.options.keepHistory) {
			this.addToHistory(event, payload);
		}
		
		// Call regular listeners
		const eventListeners = this.listeners.get(event);
		if (eventListeners) {
			eventListeners.forEach(listener => {
				try {
					listener(payload);
					calledCount++;
				} catch (error) {
					console.error(`Error in event listener for '${String(event)}':`, error);
				}
			});
		}
		
		// Call once-only listeners and remove them
		const onceEventListeners = this.onceListeners.get(event);
		if (onceEventListeners) {
			onceEventListeners.forEach(listener => {
				try {
					listener(payload);
					calledCount++;
				} catch (error) {
					console.error(`Error in once event listener for '${String(event)}':`, error);
				}
			});
			onceEventListeners.clear();
		}
		
		return calledCount;
	}
	
	/**
	 * Gets the number of listeners for the specified event.
	 * 
	 * @template K - The event name type
	 * @param event - The event name
	 * @returns The number of listeners for this event
	 * 
	 * @example
	 * const count = emitter.listenerCount('data:change');
	 * console.log(`${count} listeners for data:change event`);
	 */
	public listenerCount<K extends keyof TEventMap>(event: K): number {
		const regularListeners = this.listeners.get(event)?.size || 0;
		const onceListeners = this.onceListeners.get(event)?.size || 0;
		return regularListeners + onceListeners;
	}
	
	/**
	 * Gets all event names that have listeners.
	 * 
	 * @returns Array of event names with listeners
	 * 
	 * @example
	 * const events = emitter.eventNames();
	 * console.log('Events with listeners:', events);
	 */
	public eventNames(): (keyof TEventMap)[] {
		const events = new Set<keyof TEventMap>();
		
		this.listeners.forEach((_, event) => events.add(event));
		this.onceListeners.forEach((_, event) => events.add(event));
		
		return Array.from(events);
	}
	
	/**
	 * Gets the event history for debugging and replay.
	 * Only available if keepHistory option is enabled.
	 * 
	 * @returns Array of event history entries
	 * 
	 * @example
	 * const history = emitter.getEventHistory();
	 * console.log('Recent events:', history);
	 */
	public getEventHistory(): EventHistoryEntry<TEventMap>[] {
		return [...this.eventHistory];
	}
	
	/**
	 * Clears the event history.
	 * 
	 * @example
	 * emitter.clearEventHistory();
	 */
	public clearEventHistory(): void {
		this.eventHistory = [];
	}
	
	/**
	 * Replays events from the history.
	 * Only available if keepHistory option is enabled.
	 * 
	 * @param fromTime - Only replay events from this timestamp onwards
	 * @param filter - Optional filter function to select which events to replay
	 * 
	 * @example
	 * // Replay all events from the last 5 seconds
	 * emitter.replayEvents(Date.now() - 5000);
	 * 
	 * // Replay only specific events
	 * emitter.replayEvents(0, (entry) => entry.event === 'data:change');
	 */
	public replayEvents(
		fromTime: number = 0,
		filter?: (entry: EventHistoryEntry<TEventMap>) => boolean
	): void {
		if (!this.options.keepHistory) {
			console.warn('EventEmitter: Cannot replay events - history is disabled');
			return;
		}
		
		let eventsToReplay = this.eventHistory.filter(entry => entry.timestamp >= fromTime);
		
		if (filter) {
			eventsToReplay = eventsToReplay.filter(filter);
		}
		
		eventsToReplay.forEach(entry => {
			this.emit(entry.event, entry.payload);
		});
	}
	
	/**
	 * Adds an event to the history.
	 * 
	 * @private
	 * @template K - The event name type
	 * @param event - The event name
	 * @param payload - The event payload
	 */
	private addToHistory<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): void {
		const entry: EventHistoryEntry<TEventMap> = {
			event,
			payload,
			timestamp: Date.now(),
			id: `${this.eventIdCounter++}`
		};
		
		this.eventHistory.push(entry);
		
		// Trim history if it exceeds max size
		if (this.eventHistory.length > this.options.maxHistorySize!) {
			this.eventHistory = this.eventHistory.slice(-this.options.maxHistorySize!);
		}
	}
	
	/**
	 * Cleans up all listeners and resources.
	 * Should be called when the EventEmitter is no longer needed.
	 * 
	 * @example
	 * emitter.dispose();
	 */
	public dispose(): void {
		this.listeners.clear();
		this.onceListeners.clear();
		this.eventHistory = [];
	}
}