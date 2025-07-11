/**
 * Comprehensive test suite for the EventEmitter base class
 * Tests all functionality including type safety, event history, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter, BaseEventMap, EventListener, EventUnsubscriber, EventHistoryEntry } from "../src/core/event-emitter";

// Test event map for type safety testing
interface TestEventMap extends BaseEventMap {
	'data:change': { value: number; timestamp: number };
	'user:login': { userId: string; username: string };
	'error': { message: string; code: number };
	'simple': string;
	'empty': void;
	'complex': {
		nested: {
			data: number[];
			metadata: { id: string; tags: string[] };
		};
		flags: boolean[];
	};
}

// Concrete implementation for testing
class TestEventEmitter extends EventEmitter<TestEventMap> {
	public constructor(options = {}) {
		super(options);
	}

	// Expose protected emit method for testing
	public testEmit<K extends keyof TestEventMap>(event: K, payload: TestEventMap[K]): number {
		return this.emit(event, payload);
	}
}

describe("EventEmitter", () => {
	let emitter: TestEventEmitter;
	let mockConsoleWarn: ReturnType<typeof vi.fn>;
	let mockConsoleError: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		emitter = new TestEventEmitter();
		mockConsoleWarn = vi.fn();
		mockConsoleError = vi.fn();
		vi.spyOn(console, 'warn').mockImplementation(mockConsoleWarn);
		vi.spyOn(console, 'error').mockImplementation(mockConsoleError);
	});

	afterEach(() => {
		emitter.dispose();
		vi.restoreAllMocks();
	});

	describe("Constructor and Configuration", () => {
		it("should create with default options", () => {
			const defaultEmitter = new TestEventEmitter();
			expect(defaultEmitter).toBeInstanceOf(EventEmitter);
			expect(defaultEmitter.eventNames()).toEqual([]);
			expect(defaultEmitter.getEventHistory()).toEqual([]);
		});

		it("should create with custom options", () => {
			const customEmitter = new TestEventEmitter({
				keepHistory: true,
				maxHistorySize: 50,
				warnOnManyListeners: false,
				maxListeners: 5
			});
			expect(customEmitter).toBeInstanceOf(EventEmitter);
			customEmitter.dispose();
		});

		it("should merge options correctly", () => {
			const partialEmitter = new TestEventEmitter({
				keepHistory: true,
				maxListeners: 3
			});
			expect(partialEmitter).toBeInstanceOf(EventEmitter);
			partialEmitter.dispose();
		});
	});

	describe("Event Listener Management", () => {
		describe("on() method", () => {
			it("should add event listeners", () => {
				const listener = vi.fn();
				const unsubscribe = emitter.on('data:change', listener);
				
				expect(typeof unsubscribe).toBe('function');
				expect(emitter.listenerCount('data:change')).toBe(1);
				expect(emitter.eventNames()).toContain('data:change');
			});

			it("should support multiple listeners for same event", () => {
				const listener1 = vi.fn();
				const listener2 = vi.fn();
				const listener3 = vi.fn();

				emitter.on('data:change', listener1);
				emitter.on('data:change', listener2);
				emitter.on('data:change', listener3);

				expect(emitter.listenerCount('data:change')).toBe(3);
			});

			it("should support listeners for different events", () => {
				const dataListener = vi.fn();
				const userListener = vi.fn();
				const errorListener = vi.fn();

				emitter.on('data:change', dataListener);
				emitter.on('user:login', userListener);
				emitter.on('error', errorListener);

				expect(emitter.listenerCount('data:change')).toBe(1);
				expect(emitter.listenerCount('user:login')).toBe(1);
				expect(emitter.listenerCount('error')).toBe(1);
				expect(emitter.eventNames()).toHaveLength(3);
			});

			it("should return unsubscriber function", () => {
				const listener = vi.fn();
				const unsubscribe = emitter.on('data:change', listener);
				
				expect(emitter.listenerCount('data:change')).toBe(1);
				
				const result = unsubscribe();
				expect(result).toBe(true);
				expect(emitter.listenerCount('data:change')).toBe(0);
			});

			it("should warn about many listeners", () => {
				const warnEmitter = new TestEventEmitter({
					warnOnManyListeners: true,
					maxListeners: 2
				});

				warnEmitter.on('data:change', vi.fn());
				warnEmitter.on('data:change', vi.fn());
				expect(mockConsoleWarn).not.toHaveBeenCalled();

				warnEmitter.on('data:change', vi.fn());
				expect(mockConsoleWarn).toHaveBeenCalledWith(
					expect.stringContaining("Many listeners (3) added for event 'data:change'")
				);

				warnEmitter.dispose();
			});

			it("should not warn when warnOnManyListeners is disabled", () => {
				const noWarnEmitter = new TestEventEmitter({
					warnOnManyListeners: false,
					maxListeners: 1
				});

				noWarnEmitter.on('data:change', vi.fn());
				noWarnEmitter.on('data:change', vi.fn());
				noWarnEmitter.on('data:change', vi.fn());
				
				expect(mockConsoleWarn).not.toHaveBeenCalled();
				noWarnEmitter.dispose();
			});
		});

		describe("once() method", () => {
			it("should add one-time listeners", () => {
				const listener = vi.fn();
				const unsubscribe = emitter.once('data:change', listener);
				
				expect(typeof unsubscribe).toBe('function');
				expect(emitter.listenerCount('data:change')).toBe(1);
			});

			it("should remove listener after one emission", () => {
				const listener = vi.fn();
				emitter.once('data:change', listener);
				
				expect(emitter.listenerCount('data:change')).toBe(1);
				
				emitter.testEmit('data:change', { value: 42, timestamp: Date.now() });
				expect(listener).toHaveBeenCalledTimes(1);
				expect(emitter.listenerCount('data:change')).toBe(0);
				
				// Second emission should not call listener
				emitter.testEmit('data:change', { value: 43, timestamp: Date.now() });
				expect(listener).toHaveBeenCalledTimes(1);
			});

			it("should support multiple once listeners", () => {
				const listener1 = vi.fn();
				const listener2 = vi.fn();
				
				emitter.once('data:change', listener1);
				emitter.once('data:change', listener2);
				
				expect(emitter.listenerCount('data:change')).toBe(2);
				
				emitter.testEmit('data:change', { value: 42, timestamp: Date.now() });
				expect(listener1).toHaveBeenCalledTimes(1);
				expect(listener2).toHaveBeenCalledTimes(1);
				expect(emitter.listenerCount('data:change')).toBe(0);
			});

			it("should return unsubscriber function", () => {
				const listener = vi.fn();
				const unsubscribe = emitter.once('data:change', listener);
				
				expect(emitter.listenerCount('data:change')).toBe(1);
				
				const result = unsubscribe();
				expect(result).toBe(true);
				expect(emitter.listenerCount('data:change')).toBe(0);
				
				// Listener should not be called after unsubscribe
				emitter.testEmit('data:change', { value: 42, timestamp: Date.now() });
				expect(listener).not.toHaveBeenCalled();
			});
		});

		describe("off() method", () => {
			it("should remove specific listeners", () => {
				const listener1 = vi.fn();
				const listener2 = vi.fn();
				
				emitter.on('data:change', listener1);
				emitter.on('data:change', listener2);
				
				expect(emitter.listenerCount('data:change')).toBe(2);
				
				const result = emitter.off('data:change', listener1);
				expect(result).toBe(true);
				expect(emitter.listenerCount('data:change')).toBe(1);
				
				emitter.testEmit('data:change', { value: 42, timestamp: Date.now() });
				expect(listener1).not.toHaveBeenCalled();
				expect(listener2).toHaveBeenCalledTimes(1);
			});

			it("should return false for non-existent listener", () => {
				const listener = vi.fn();
				
				const result = emitter.off('data:change', listener);
				expect(result).toBe(false);
			});

			it("should return false for non-existent event", () => {
				const listener = vi.fn();
				
				const result = emitter.off('nonexistent' as any, listener);
				expect(result).toBe(false);
			});

			it("should not affect other listeners", () => {
				const listener1 = vi.fn();
				const listener2 = vi.fn();
				const listener3 = vi.fn();
				
				emitter.on('data:change', listener1);
				emitter.on('data:change', listener2);
				emitter.on('user:login', listener3);
				
				emitter.off('data:change', listener1);
				
				expect(emitter.listenerCount('data:change')).toBe(1);
				expect(emitter.listenerCount('user:login')).toBe(1);
			});
		});

		describe("offOnce() method", () => {
			it("should remove specific once listeners", () => {
				const listener1 = vi.fn();
				const listener2 = vi.fn();
				
				emitter.once('data:change', listener1);
				emitter.once('data:change', listener2);
				
				expect(emitter.listenerCount('data:change')).toBe(2);
				
				const result = emitter.offOnce('data:change', listener1);
				expect(result).toBe(true);
				expect(emitter.listenerCount('data:change')).toBe(1);
				
				emitter.testEmit('data:change', { value: 42, timestamp: Date.now() });
				expect(listener1).not.toHaveBeenCalled();
				expect(listener2).toHaveBeenCalledTimes(1);
			});

			it("should return false for non-existent listener", () => {
				const listener = vi.fn();
				
				const result = emitter.offOnce('data:change', listener);
				expect(result).toBe(false);
			});
		});

		describe("removeAllListeners() method", () => {
			it("should remove all listeners for specific event", () => {
				const listener1 = vi.fn();
				const listener2 = vi.fn();
				const listener3 = vi.fn();
				
				emitter.on('data:change', listener1);
				emitter.on('data:change', listener2);
				emitter.once('data:change', listener3);
				
				expect(emitter.listenerCount('data:change')).toBe(3);
				
				const removedCount = emitter.removeAllListeners('data:change');
				expect(removedCount).toBe(3);
				expect(emitter.listenerCount('data:change')).toBe(0);
			});

			it("should remove all listeners for all events", () => {
				emitter.on('data:change', vi.fn());
				emitter.on('data:change', vi.fn());
				emitter.on('user:login', vi.fn());
				emitter.once('error', vi.fn());
				
				expect(emitter.listenerCount('data:change')).toBe(2);
				expect(emitter.listenerCount('user:login')).toBe(1);
				expect(emitter.listenerCount('error')).toBe(1);
				
				const removedCount = emitter.removeAllListeners();
				expect(removedCount).toBe(4);
				expect(emitter.listenerCount('data:change')).toBe(0);
				expect(emitter.listenerCount('user:login')).toBe(0);
				expect(emitter.listenerCount('error')).toBe(0);
				expect(emitter.eventNames()).toHaveLength(0);
			});

			it("should return 0 for non-existent event", () => {
				const removedCount = emitter.removeAllListeners('nonexistent' as any);
				expect(removedCount).toBe(0);
			});

			it("should return 0 when no listeners exist", () => {
				const removedCount = emitter.removeAllListeners();
				expect(removedCount).toBe(0);
			});
		});
	});

	describe("Event Emission", () => {
		describe("emit() method", () => {
			it("should call listeners with correct payload", () => {
				const listener1 = vi.fn();
				const listener2 = vi.fn();
				const payload = { value: 42, timestamp: Date.now() };
				
				emitter.on('data:change', listener1);
				emitter.on('data:change', listener2);
				
				const callCount = emitter.testEmit('data:change', payload);
				
				expect(callCount).toBe(2);
				expect(listener1).toHaveBeenCalledWith(payload);
				expect(listener2).toHaveBeenCalledWith(payload);
			});

			it("should call once listeners and remove them", () => {
				const regularListener = vi.fn();
				const onceListener = vi.fn();
				const payload = { value: 42, timestamp: Date.now() };
				
				emitter.on('data:change', regularListener);
				emitter.once('data:change', onceListener);
				
				expect(emitter.listenerCount('data:change')).toBe(2);
				
				const callCount = emitter.testEmit('data:change', payload);
				
				expect(callCount).toBe(2);
				expect(regularListener).toHaveBeenCalledWith(payload);
				expect(onceListener).toHaveBeenCalledWith(payload);
				expect(emitter.listenerCount('data:change')).toBe(1);
			});

			it("should handle different payload types", () => {
				const stringListener = vi.fn();
				const complexListener = vi.fn();
				const emptyListener = vi.fn();
				
				emitter.on('simple', stringListener);
				emitter.on('complex', complexListener);
				emitter.on('empty', emptyListener);
				
				emitter.testEmit('simple', 'hello world');
				emitter.testEmit('complex', {
					nested: {
						data: [1, 2, 3],
						metadata: { id: 'test', tags: ['a', 'b'] }
					},
					flags: [true, false]
				});
				emitter.testEmit('empty', undefined);
				
				expect(stringListener).toHaveBeenCalledWith('hello world');
				expect(complexListener).toHaveBeenCalledWith({
					nested: {
						data: [1, 2, 3],
						metadata: { id: 'test', tags: ['a', 'b'] }
					},
					flags: [true, false]
				});
				expect(emptyListener).toHaveBeenCalledWith(undefined);
			});

			it("should return 0 for events with no listeners", () => {
				const callCount = emitter.testEmit('data:change', { value: 42, timestamp: Date.now() });
				expect(callCount).toBe(0);
			});

			it("should handle listener errors gracefully", () => {
				const goodListener = vi.fn();
				const errorListener = vi.fn(() => {
					throw new Error('Test error');
				});
				const anotherGoodListener = vi.fn();
				
				emitter.on('data:change', goodListener);
				emitter.on('data:change', errorListener);
				emitter.on('data:change', anotherGoodListener);
				
				const payload = { value: 42, timestamp: Date.now() };
				const callCount = emitter.testEmit('data:change', payload);
				
				expect(callCount).toBe(3);
				expect(goodListener).toHaveBeenCalledWith(payload);
				expect(errorListener).toHaveBeenCalledWith(payload);
				expect(anotherGoodListener).toHaveBeenCalledWith(payload);
				
				expect(mockConsoleError).toHaveBeenCalledWith(
					expect.stringContaining("Error in event listener for 'data:change'"),
					expect.any(Error)
				);
			});

			it("should handle once listener errors gracefully", () => {
				const goodListener = vi.fn();
				const errorListener = vi.fn(() => {
					throw new Error('Test error');
				});
				
				emitter.once('data:change', goodListener);
				emitter.once('data:change', errorListener);
				
				const payload = { value: 42, timestamp: Date.now() };
				const callCount = emitter.testEmit('data:change', payload);
				
				expect(callCount).toBe(2);
				expect(goodListener).toHaveBeenCalledWith(payload);
				expect(errorListener).toHaveBeenCalledWith(payload);
				expect(emitter.listenerCount('data:change')).toBe(0);
				
				expect(mockConsoleError).toHaveBeenCalledWith(
					expect.stringContaining("Error in once event listener for 'data:change'"),
					expect.any(Error)
				);
			});
		});

		describe("emitEvent() method", () => {
			it("should be a public wrapper for emit", () => {
				const listener = vi.fn();
				const payload = { value: 42, timestamp: Date.now() };
				
				emitter.on('data:change', listener);
				
				const callCount = emitter.emitEvent('data:change', payload);
				
				expect(callCount).toBe(1);
				expect(listener).toHaveBeenCalledWith(payload);
			});
		});
	});

	describe("Event History", () => {
		let historyEmitter: TestEventEmitter;

		beforeEach(() => {
			historyEmitter = new TestEventEmitter({ keepHistory: true });
		});

		afterEach(() => {
			historyEmitter.dispose();
		});

		describe("getEventHistory() method", () => {
			it("should return empty array when no events emitted", () => {
				const history = historyEmitter.getEventHistory();
				expect(history).toEqual([]);
			});

			it("should record events when history is enabled", () => {
				const payload1 = { value: 42, timestamp: Date.now() };
				const payload2 = { userId: 'user123', username: 'testuser' };
				
				historyEmitter.testEmit('data:change', payload1);
				historyEmitter.testEmit('user:login', payload2);
				
				const history = historyEmitter.getEventHistory();
				expect(history).toHaveLength(2);
				
				expect(history[0]).toMatchObject({
					event: 'data:change',
					payload: payload1,
					timestamp: expect.any(Number),
					id: expect.any(String)
				});
				
				expect(history[1]).toMatchObject({
					event: 'user:login',
					payload: payload2,
					timestamp: expect.any(Number),
					id: expect.any(String)
				});
			});

			it("should not record events when history is disabled", () => {
				const payload = { value: 42, timestamp: Date.now() };
				
				emitter.testEmit('data:change', payload);
				
				const history = emitter.getEventHistory();
				expect(history).toEqual([]);
			});

			it("should trim history when exceeding max size", () => {
				const smallHistoryEmitter = new TestEventEmitter({
					keepHistory: true,
					maxHistorySize: 3
				});
				
				// Emit 5 events
				for (let i = 0; i < 5; i++) {
					smallHistoryEmitter.testEmit('data:change', { value: i, timestamp: Date.now() });
				}
				
				const history = smallHistoryEmitter.getEventHistory();
				expect(history).toHaveLength(3);
				
				// Should keep the last 3 events
				expect(history[0].payload).toEqual({ value: 2, timestamp: expect.any(Number) });
				expect(history[1].payload).toEqual({ value: 3, timestamp: expect.any(Number) });
				expect(history[2].payload).toEqual({ value: 4, timestamp: expect.any(Number) });
				
				smallHistoryEmitter.dispose();
			});

			it("should generate unique IDs for events", () => {
				historyEmitter.testEmit('data:change', { value: 1, timestamp: Date.now() });
				historyEmitter.testEmit('data:change', { value: 2, timestamp: Date.now() });
				historyEmitter.testEmit('user:login', { userId: 'user', username: 'test' });
				
				const history = historyEmitter.getEventHistory();
				const ids = history.map(entry => entry.id);
				const uniqueIds = [...new Set(ids)];
				
				expect(uniqueIds).toHaveLength(3);
			});
		});

		describe("clearEventHistory() method", () => {
			it("should clear event history", () => {
				historyEmitter.testEmit('data:change', { value: 42, timestamp: Date.now() });
				historyEmitter.testEmit('user:login', { userId: 'user', username: 'test' });
				
				expect(historyEmitter.getEventHistory()).toHaveLength(2);
				
				historyEmitter.clearEventHistory();
				
				expect(historyEmitter.getEventHistory()).toHaveLength(0);
			});
		});

		describe("replayEvents() method", () => {
			it("should replay all events", () => {
				const listener = vi.fn();
				historyEmitter.on('data:change', listener);
				
				const payload1 = { value: 1, timestamp: Date.now() };
				const payload2 = { value: 2, timestamp: Date.now() };
				
				historyEmitter.testEmit('data:change', payload1);
				historyEmitter.testEmit('data:change', payload2);
				
				expect(listener).toHaveBeenCalledTimes(2);
				
				listener.mockClear();
				
				historyEmitter.replayEvents();
				
				expect(listener).toHaveBeenCalledTimes(2);
				expect(listener).toHaveBeenNthCalledWith(1, payload1);
				expect(listener).toHaveBeenNthCalledWith(2, payload2);
			});

			it("should replay events from specific time", async () => {
				const listener = vi.fn();
				historyEmitter.on('data:change', listener);
				
				const payload1 = { value: 1, timestamp: Date.now() };
				
				historyEmitter.testEmit('data:change', payload1);
				
				// Get the timestamp of the first event from history
				const history = historyEmitter.getEventHistory();
				const firstEventTime = history[0].timestamp;
				
				// Wait a bit to ensure time difference
				await new Promise(resolve => setTimeout(resolve, 10));
				
				const payload2 = { value: 2, timestamp: Date.now() };
				historyEmitter.testEmit('data:change', payload2);
				
				expect(listener).toHaveBeenCalledTimes(2);
				listener.mockClear();
				
				// Replay events from after the first event
				historyEmitter.replayEvents(firstEventTime + 1);
				
				expect(listener).toHaveBeenCalledTimes(1);
				expect(listener).toHaveBeenCalledWith(payload2);
			});

			it("should replay events with filter", () => {
				const dataListener = vi.fn();
				const userListener = vi.fn();
				
				historyEmitter.on('data:change', dataListener);
				historyEmitter.on('user:login', userListener);
				
				historyEmitter.testEmit('data:change', { value: 1, timestamp: Date.now() });
				historyEmitter.testEmit('user:login', { userId: 'user', username: 'test' });
				historyEmitter.testEmit('data:change', { value: 2, timestamp: Date.now() });
				
				expect(dataListener).toHaveBeenCalledTimes(2);
				expect(userListener).toHaveBeenCalledTimes(1);
				
				dataListener.mockClear();
				userListener.mockClear();
				
				historyEmitter.replayEvents(0, (entry) => entry.event === 'data:change');
				
				expect(dataListener).toHaveBeenCalledTimes(2);
				expect(userListener).not.toHaveBeenCalled();
			});

			it("should warn when history is disabled", () => {
				emitter.replayEvents();
				
				expect(mockConsoleWarn).toHaveBeenCalledWith(
					'EventEmitter: Cannot replay events - history is disabled'
				);
			});
		});
	});

	describe("Utility Methods", () => {
		describe("listenerCount() method", () => {
			it("should return 0 for events with no listeners", () => {
				expect(emitter.listenerCount('data:change')).toBe(0);
				expect(emitter.listenerCount('nonexistent' as any)).toBe(0);
			});

			it("should count regular listeners", () => {
				emitter.on('data:change', vi.fn());
				emitter.on('data:change', vi.fn());
				
				expect(emitter.listenerCount('data:change')).toBe(2);
			});

			it("should count once listeners", () => {
				emitter.once('data:change', vi.fn());
				emitter.once('data:change', vi.fn());
				
				expect(emitter.listenerCount('data:change')).toBe(2);
			});

			it("should count both regular and once listeners", () => {
				emitter.on('data:change', vi.fn());
				emitter.once('data:change', vi.fn());
				emitter.on('data:change', vi.fn());
				
				expect(emitter.listenerCount('data:change')).toBe(3);
			});
		});

		describe("eventNames() method", () => {
			it("should return empty array when no listeners", () => {
				expect(emitter.eventNames()).toEqual([]);
			});

			it("should return event names with listeners", () => {
				emitter.on('data:change', vi.fn());
				emitter.on('user:login', vi.fn());
				emitter.once('error', vi.fn());
				
				const eventNames = emitter.eventNames();
				expect(eventNames).toHaveLength(3);
				expect(eventNames).toContain('data:change');
				expect(eventNames).toContain('user:login');
				expect(eventNames).toContain('error');
			});

			it("should not duplicate event names", () => {
				emitter.on('data:change', vi.fn());
				emitter.on('data:change', vi.fn());
				emitter.once('data:change', vi.fn());
				
				const eventNames = emitter.eventNames();
				expect(eventNames).toEqual(['data:change']);
			});
		});
	});

	describe("Cleanup and Disposal", () => {
		describe("dispose() method", () => {
			it("should clear all listeners", () => {
				emitter.on('data:change', vi.fn());
				emitter.on('user:login', vi.fn());
				emitter.once('error', vi.fn());
				
				expect(emitter.eventNames()).toHaveLength(3);
				
				emitter.dispose();
				
				expect(emitter.eventNames()).toHaveLength(0);
				expect(emitter.listenerCount('data:change')).toBe(0);
				expect(emitter.listenerCount('user:login')).toBe(0);
				expect(emitter.listenerCount('error')).toBe(0);
			});

			it("should clear event history", () => {
				const historyEmitter = new TestEventEmitter({ keepHistory: true });
				
				historyEmitter.testEmit('data:change', { value: 42, timestamp: Date.now() });
				expect(historyEmitter.getEventHistory()).toHaveLength(1);
				
				historyEmitter.dispose();
				expect(historyEmitter.getEventHistory()).toHaveLength(0);
			});

			it("should be safe to call multiple times", () => {
				emitter.on('data:change', vi.fn());
				
				emitter.dispose();
				emitter.dispose();
				emitter.dispose();
				
				expect(emitter.eventNames()).toHaveLength(0);
			});
		});
	});

	describe("Type Safety", () => {
		it("should enforce event map types at compile time", () => {
			// These should all compile without errors
			emitter.on('data:change', (data) => {
				expect(typeof data.value).toBe('number');
				expect(typeof data.timestamp).toBe('number');
			});

			emitter.on('user:login', (data) => {
				expect(typeof data.userId).toBe('string');
				expect(typeof data.username).toBe('string');
			});

			emitter.on('error', (data) => {
				expect(typeof data.message).toBe('string');
				expect(typeof data.code).toBe('number');
			});

			emitter.on('simple', (data) => {
				expect(typeof data).toBe('string');
			});

			emitter.on('empty', (data) => {
				expect(data).toBeUndefined();
			});

			emitter.on('complex', (data) => {
				expect(Array.isArray(data.nested.data)).toBe(true);
				expect(typeof data.nested.metadata.id).toBe('string');
				expect(Array.isArray(data.nested.metadata.tags)).toBe(true);
				expect(Array.isArray(data.flags)).toBe(true);
			});
		});
	});

	describe("Integration with Existing Systems", () => {
		it("should work with composition pattern", () => {
			class TestClass {
				private eventEmitter = new TestEventEmitter();

				public on<K extends keyof TestEventMap>(
					event: K,
					listener: EventListener<TestEventMap[K]>
				): EventUnsubscriber {
					return this.eventEmitter.on(event, listener);
				}

				public emit<K extends keyof TestEventMap>(
					event: K,
					payload: TestEventMap[K]
				): void {
					this.eventEmitter.emitEvent(event, payload);
				}

				public dispose(): void {
					this.eventEmitter.dispose();
				}
			}

			const testInstance = new TestClass();
			const listener = vi.fn();
			
			testInstance.on('data:change', listener);
			testInstance.emit('data:change', { value: 42, timestamp: Date.now() });
			
			expect(listener).toHaveBeenCalledTimes(1);
			
			testInstance.dispose();
		});
	});
});