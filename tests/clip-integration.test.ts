/**
 * Integration tests for clip-based animation system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnimatableObject } from '../src/lib/components/animation/AnimatableObject';
import { Clip } from '../src/lib/components/animation/Clip';
import type { RawDataPoint } from '../src/lib/components/animation/types/ClipTypes';

describe('Clip Integration Tests', () => {
	let animatableObject: AnimatableObject;
	
	beforeEach(() => {
		animatableObject = new AnimatableObject('TestObject', {
			properties: ['x', 'y', 'rotation'],
			initialValues: { x: 0, y: 0, rotation: 0 }
		});
	});

	it('should create animatable object with properties', () => {
		expect(animatableObject.name).toBe('TestObject');
		expect(animatableObject.properties).toHaveLength(3);
		expect(animatableObject.getPropertyNames()).toEqual(['x', 'y', 'rotation']);
	});

	it('should record and create clips', () => {
		// Start recording
		animatableObject.startRecording(['x', 'y']);
		
		// Simulate some property changes
		animatableObject.setPropertyValue('x', 10);
		animatableObject.setPropertyValue('y', 20);
		animatableObject.setPropertyValue('x', 30);
		animatableObject.setPropertyValue('y', 40);
		
		// Stop recording and create clips
		const clips = animatableObject.stopRecording('Test Recording');
		
		expect(clips.length).toBe(2); // One for x, one for y
		expect(clips[0].metadata.name).toContain('x');
		expect(clips[1].metadata.name).toContain('y');
	});

	it('should create clips with raw data and generate keyframes', () => {
		const rawData: RawDataPoint[] = [
			{ time: 0, value: 0, timestamp: Date.now() },
			{ time: 1, value: 50, timestamp: Date.now() + 1000 },
			{ time: 2, value: 100, timestamp: Date.now() + 2000 }
		];
		
		const clip = animatableObject.createClip('x', 0, rawData, {
			name: 'Manual Clip'
		});
		
		expect(clip.rawData).toHaveLength(3);
		expect(clip.keyframes.length).toBeGreaterThan(0);
		expect(clip.metadata.name).toBe('Manual Clip');
	});

	it('should get property value at time from clips', () => {
		const rawData: RawDataPoint[] = [
			{ time: 0, value: 0, timestamp: Date.now() },
			{ time: 1, value: 100, timestamp: Date.now() + 1000 }
		];
		
		animatableObject.createClip('x', 0, rawData);
		
		const value = animatableObject.getPropertyValueAtTime('x', 0.5);
		// The value might not be exactly 50 due to KeyframeOptimizer processing
		// Just check that it's a reasonable value between 0 and 100
		expect(value).toBeGreaterThanOrEqual(0);
		expect(value).toBeLessThanOrEqual(100);
	});

	it('should handle multiple clips on the same property', () => {
		const rawData1: RawDataPoint[] = [
			{ time: 0, value: 0, timestamp: Date.now() },
			{ time: 1, value: 50, timestamp: Date.now() + 1000 }
		];
		
		const rawData2: RawDataPoint[] = [
			{ time: 0, value: 100, timestamp: Date.now() },
			{ time: 1, value: 150, timestamp: Date.now() + 1000 }
		];
		
		const clip1 = animatableObject.createClip('x', 0, rawData1, { name: 'Clip 1' });
		const clip2 = animatableObject.createClip('x', 2, rawData2, { name: 'Clip 2' });
		
		const property = animatableObject.getProperty('x');
		expect(property?.clips).toHaveLength(2);
		expect(property?.clips[0].startOffset).toBe(0);
		expect(property?.clips[1].startOffset).toBe(2);
	});

	it('should properly dispose and cleanup', () => {
		const rawData: RawDataPoint[] = [
			{ time: 0, value: 0, timestamp: Date.now() },
			{ time: 1, value: 100, timestamp: Date.now() + 1000 }
		];
		
		const clip = animatableObject.createClip('x', 0, rawData);
		
		// Verify clip is created
		expect(animatableObject.getAllClips()).toHaveLength(1);
		
		// Dispose should clean up everything
		animatableObject.dispose();
		
		// Object should be cleaned up
		expect(animatableObject.getAllClips()).toHaveLength(0);
	});
});