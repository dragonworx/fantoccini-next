/**
 * Test suite for the Clip-based Animation System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Clip } from '../src/lib/components/animation/Clip';
import { AnimatableProperty } from '../src/lib/components/animation/AnimatableProperty';
import { AnimatableObject } from '../src/lib/components/animation/AnimatableObject';
import type { RawDataPoint, ClipConfig } from '../src/lib/components/animation/types/ClipTypes';

describe('Clip System', () => {
	describe('Clip', () => {
		let rawData: RawDataPoint[];
		let clipConfig: ClipConfig;

		beforeEach(() => {
			rawData = [
				{ time: 0, value: 0, timestamp: Date.now() },
				{ time: 0.5, value: 50, timestamp: Date.now() + 500 },
				{ time: 1, value: 100, timestamp: Date.now() + 1000 },
				{ time: 1.5, value: 150, timestamp: Date.now() + 1500 },
				{ time: 2, value: 200, timestamp: Date.now() + 2000 }
			];

			clipConfig = {
				name: 'Test Clip',
				startOffset: 0,
				rawData: rawData,
				enabled: true,
				muted: false,
				tags: ['test']
			};
		});

		it('should create a clip with raw data', () => {
			const clip = new Clip(0, 2, clipConfig);
			
			expect(clip.id).toBeDefined();
			expect(clip.metadata.name).toBe('Test Clip');
			expect(clip.startOffset).toBe(0);
			expect(clip.duration).toBe(2);
			expect(clip.rawData).toHaveLength(5);
			expect(clip.enabled).toBe(true);
			expect(clip.muted).toBe(false);
		});

		it('should generate keyframes from raw data', () => {
			const clip = new Clip(0, 2, clipConfig);
			
			const keyframes = clip.generateKeyframes();
			
			expect(keyframes.length).toBeGreaterThan(0);
			expect(keyframes[0].clipId).toBe(clip.id);
			expect(keyframes[0].isGenerated).toBe(true);
		});

		it('should clear keyframes', () => {
			const clip = new Clip(0, 2, clipConfig);
			
			clip.generateKeyframes();
			expect(clip.keyframes.length).toBeGreaterThan(0);
			
			clip.clearKeyframes();
			expect(clip.keyframes.length).toBe(0);
		});

		it('should check if active at specific time', () => {
			const clip = new Clip(5, 3, clipConfig); // starts at 5, duration 3
			
			expect(clip.isActiveAtTime(4)).toBe(false);
			expect(clip.isActiveAtTime(5)).toBe(true);
			expect(clip.isActiveAtTime(6.5)).toBe(true);
			expect(clip.isActiveAtTime(8)).toBe(true);
			expect(clip.isActiveAtTime(8.1)).toBe(false);
		});

		it('should convert between local and global time', () => {
			const clip = new Clip(10, 5, clipConfig);
			
			expect(clip.getLocalTime(12)).toBe(2);
			expect(clip.getGlobalTime(3)).toBe(13);
		});

		it('should get value at time with interpolation', () => {
			const clip = new Clip(0, 2, clipConfig);
			clip.generateKeyframes();
			
			// Should interpolate between keyframes
			const value = clip.getValueAtTime(0.5);
			expect(value).toBeGreaterThan(0);
			expect(value).toBeLessThan(200);
		});

		it('should return 0 when muted or disabled', () => {
			const clip = new Clip(0, 2, clipConfig);
			clip.generateKeyframes();
			
			// Test muted
			clip.muted = true;
			expect(clip.getValueAtTime(1)).toBe(0);
			
			// Test disabled
			clip.muted = false;
			clip.enabled = false;
			expect(clip.getValueAtTime(1)).toBe(0);
		});

		it('should clone with overrides', () => {
			const clip = new Clip(0, 2, clipConfig);
			const clone = clip.clone({ name: 'Cloned Clip' });
			
			expect(clone.id).not.toBe(clip.id);
			expect(clone.metadata.name).toBe('Cloned Clip');
			expect(clone.startOffset).toBe(clip.startOffset);
			expect(clone.duration).toBe(clip.duration);
			expect(clone.rawData).toEqual(clip.rawData);
		});

		it('should trim to new duration', () => {
			const clip = new Clip(0, 2, clipConfig);
			const originalDataLength = clip.rawData.length;
			
			clip.trim(1);
			
			expect(clip.duration).toBe(1);
			expect(clip.rawData.length).toBeLessThan(originalDataLength);
		});

		it('should shift to new start offset', () => {
			const clip = new Clip(0, 2, clipConfig);
			clip.generateKeyframes();
			const originalKeyframeTime = clip.keyframes[0]?.time || 0;
			
			clip.shift(5);
			
			expect(clip.startOffset).toBe(5);
			expect(clip.keyframes[0]?.time).toBe(originalKeyframeTime + 5);
		});

		it('should emit events for state changes', () => {
			const clip = new Clip(0, 2, clipConfig);
			const enabledHandler = vi.fn();
			const mutedHandler = vi.fn();
			const keyframesHandler = vi.fn();
			
			clip.on('clip:enabled-changed', enabledHandler);
			clip.on('clip:muted-changed', mutedHandler);
			clip.on('clip:keyframes-generated', keyframesHandler);
			
			clip.enabled = false;
			clip.muted = true;
			clip.generateKeyframes();
			
			expect(enabledHandler).toHaveBeenCalledWith({ clip, enabled: false });
			expect(mutedHandler).toHaveBeenCalledWith({ clip, muted: true });
			expect(keyframesHandler).toHaveBeenCalled();
		});
	});

	describe('AnimatableProperty', () => {
		let property: AnimatableProperty;
		let clip1: Clip;
		let clip2: Clip;

		beforeEach(() => {
			property = new AnimatableProperty('x', { initialValue: 100 });
			
			const rawData1: RawDataPoint[] = [
				{ time: 0, value: 0, timestamp: Date.now() },
				{ time: 1, value: 50, timestamp: Date.now() + 1000 }
			];
			
			const rawData2: RawDataPoint[] = [
				{ time: 0, value: 100, timestamp: Date.now() },
				{ time: 1, value: 150, timestamp: Date.now() + 1000 }
			];
			
			clip1 = new Clip(0, 2, {
				name: 'Clip 1',
				startOffset: 0,
				rawData: rawData1
			});
			
			clip2 = new Clip(3, 2, {
				name: 'Clip 2',
				startOffset: 3,
				rawData: rawData2
			});
		});

		it('should create property with initial value', () => {
			expect(property.name).toBe('x');
			expect(property.value).toBe(100);
			expect(property.clips).toHaveLength(0);
			expect(property.keyframes).toHaveLength(0);
		});

		it('should add clips and maintain sort order', () => {
			property.addClip(clip2); // Add second clip first
			property.addClip(clip1); // Add first clip second
			
			expect(property.clips).toHaveLength(2);
			expect(property.clips[0].startOffset).toBe(0);
			expect(property.clips[1].startOffset).toBe(3);
		});

		it('should remove clips', () => {
			property.addClip(clip1);
			property.addClip(clip2);
			
			property.removeClip(clip1.id);
			
			expect(property.clips).toHaveLength(1);
			expect(property.clips[0].id).toBe(clip2.id);
		});

		it('should get clips by ID', () => {
			property.addClip(clip1);
			
			const foundClip = property.getClip(clip1.id);
			expect(foundClip).toBe(clip1);
			
			const notFoundClip = property.getClip('invalid-id');
			expect(notFoundClip).toBeUndefined();
		});

		it('should get active clips at time', () => {
			property.addClip(clip1); // active 0-2
			property.addClip(clip2); // active 3-5
			
			expect(property.getActiveClipsAtTime(1)).toEqual([clip1]);
			expect(property.getActiveClipsAtTime(2.5)).toEqual([]);
			expect(property.getActiveClipsAtTime(4)).toEqual([clip2]);
		});

		it('should get value at time considering all clips', () => {
			property.addClip(clip1);
			property.addClip(clip2);
			
			// Within clip1's range
			const value1 = property.getValueAtTime(0.5);
			expect(value1).toBeGreaterThan(0);
			
			// Between clips - should return base value
			const value2 = property.getValueAtTime(2.5);
			expect(value2).toBe(100);
			
			// Within clip2's range
			const value3 = property.getValueAtTime(4);
			expect(value3).toBeGreaterThan(0);
		});

		it('should rebuild keyframes when clips change', () => {
			const keyframesHandler = vi.fn();
			property.on('property:keyframes-updated', keyframesHandler);
			
			property.addClip(clip1);
			clip1.generateKeyframes();
			
			expect(keyframesHandler).toHaveBeenCalled();
			expect(property.keyframes.length).toBeGreaterThan(0);
		});

		it('should handle overlapping clips correctly', () => {
			const overlappingClip = new Clip(1, 2, {
				name: 'Overlapping',
				startOffset: 1,
				rawData: [
					{ time: 0, value: 75, timestamp: Date.now() },
					{ time: 1, value: 125, timestamp: Date.now() + 1000 }
				]
			});
			
			property.addClip(clip1);
			property.addClip(overlappingClip);
			
			// Should prioritize the later clip
			const activeClips = property.getActiveClipsAtTime(1.5);
			expect(activeClips).toHaveLength(2);
		});

		it('should check for overlaps', () => {
			property.addClip(clip1); // 0-2
			property.addClip(clip2); // 3-5
			
			expect(property.wouldOverlap(0.5, 1)).toBe(true); // overlaps clip1
			expect(property.wouldOverlap(2.5, 0.4)).toBe(false); // no overlap
			expect(property.wouldOverlap(4, 1)).toBe(true); // overlaps clip2
		});

		it('should find correct insertion point', () => {
			property.addClip(clip1); // 0-2
			property.addClip(clip2); // 3-5
			
			expect(property.findInsertionPoint(-1)).toBe(0);
			expect(property.findInsertionPoint(1)).toBe(1);
			expect(property.findInsertionPoint(6)).toBe(2);
		});

		it('should dispose properly', () => {
			property.addClip(clip1);
			property.addClip(clip2);
			
			property.dispose();
			
			expect(property.clips).toHaveLength(0);
			expect(property.keyframes).toHaveLength(0);
		});
	});

	describe('AnimatableObject', () => {
		let animatableObject: AnimatableObject;

		beforeEach(() => {
			animatableObject = new AnimatableObject('TestObject', {
				properties: ['x', 'y', 'rotation'],
				initialValues: { x: 100, y: 200, rotation: 0 }
			});
		});

		it('should create object with properties', () => {
			expect(animatableObject.name).toBe('TestObject');
			expect(animatableObject.properties).toHaveLength(3);
			expect(animatableObject.getPropertyNames()).toEqual(['x', 'y', 'rotation']);
		});

		it('should get and set property values', () => {
			expect(animatableObject.getPropertyValueAtTime('x', 0)).toBe(100);
			
			animatableObject.setPropertyValue('x', 150);
			const xProperty = animatableObject.getProperty('x');
			expect(xProperty?.value).toBe(150);
		});

		it('should add and remove properties', () => {
			animatableObject.addProperty('scale', 1);
			expect(animatableObject.getPropertyNames()).toContain('scale');
			
			animatableObject.removeProperty('scale');
			expect(animatableObject.getPropertyNames()).not.toContain('scale');
		});

		it('should start and stop recording', () => {
			const startHandler = vi.fn();
			const stopHandler = vi.fn();
			
			animatableObject.on('object:recording-started', startHandler);
			animatableObject.on('object:recording-stopped', stopHandler);
			
			animatableObject.startRecording(['x', 'y']);
			expect(animatableObject.isRecording).toBe(true);
			expect(startHandler).toHaveBeenCalled();
			
			// Simulate some value changes
			animatableObject.setPropertyValue('x', 120);
			animatableObject.setPropertyValue('y', 220);
			
			const clips = animatableObject.stopRecording('Test Recording');
			expect(animatableObject.isRecording).toBe(false);
			expect(clips.length).toBeGreaterThan(0);
			expect(stopHandler).toHaveBeenCalled();
		});

		it('should create clips from raw data', () => {
			const rawData: RawDataPoint[] = [
				{ time: 0, value: 0, timestamp: Date.now() },
				{ time: 1, value: 100, timestamp: Date.now() + 1000 }
			];
			
			const clip = animatableObject.createClip('x', 0, rawData);
			
			expect(clip.id).toBeDefined();
			expect(clip.rawData).toEqual(rawData);
			
			const xProperty = animatableObject.getProperty('x');
			expect(xProperty?.clips).toContain(clip);
		});

		it('should get all clips', () => {
			const rawData: RawDataPoint[] = [
				{ time: 0, value: 0, timestamp: Date.now() },
				{ time: 1, value: 100, timestamp: Date.now() + 1000 }
			];
			
			const clip1 = animatableObject.createClip('x', 0, rawData);
			const clip2 = animatableObject.createClip('y', 2, rawData);
			
			const allClips = animatableObject.getAllClips();
			expect(allClips).toContain(clip1);
			expect(allClips).toContain(clip2);
		});

		it('should remove clips', () => {
			const rawData: RawDataPoint[] = [
				{ time: 0, value: 0, timestamp: Date.now() },
				{ time: 1, value: 100, timestamp: Date.now() + 1000 }
			];
			
			const clip = animatableObject.createClip('x', 0, rawData);
			animatableObject.removeClip('x', clip.id);
			
			const xProperty = animatableObject.getProperty('x');
			expect(xProperty?.clips).not.toContain(clip);
		});

		it('should capture data during recording', () => {
			animatableObject.startRecording(['x']);
			
			// Simulate value changes
			animatableObject.setPropertyValue('x', 50);
			animatableObject.setPropertyValue('x', 75);
			animatableObject.setPropertyValue('x', 100);
			
			const clips = animatableObject.stopRecording();
			expect(clips.length).toBe(1);
			expect(clips[0].rawData.length).toBeGreaterThan(0);
		});

		it('should validate properties before recording', () => {
			expect(() => {
				animatableObject.startRecording(['nonexistent']);
			}).toThrow('Property nonexistent does not exist');
		});

		it('should prevent duplicate recording', () => {
			animatableObject.startRecording(['x']);
			
			expect(() => {
				animatableObject.startRecording(['y']);
			}).toThrow('Already recording');
		});

		it('should dispose properly', () => {
			const rawData: RawDataPoint[] = [
				{ time: 0, value: 0, timestamp: Date.now() },
				{ time: 1, value: 100, timestamp: Date.now() + 1000 }
			];
			
			animatableObject.createClip('x', 0, rawData);
			
			animatableObject.dispose();
			
			expect(animatableObject.properties).toHaveLength(0);
			expect(animatableObject.getAllClips()).toHaveLength(0);
		});
	});

	describe('Integration', () => {
		it('should handle complex timeline scenarios', () => {
			const animatableObject = new AnimatableObject('ComplexObject', {
				properties: ['x', 'y'],
				initialValues: { x: 0, y: 0 }
			});
			
			// Create multiple clips for the same property
			const rawData1: RawDataPoint[] = [
				{ time: 0, value: 0, timestamp: Date.now() },
				{ time: 1, value: 100, timestamp: Date.now() + 1000 }
			];
			
			const rawData2: RawDataPoint[] = [
				{ time: 0, value: 200, timestamp: Date.now() },
				{ time: 1, value: 300, timestamp: Date.now() + 1000 }
			];
			
			const clip1 = animatableObject.createClip('x', 0, rawData1);
			const clip2 = animatableObject.createClip('x', 5, rawData2);
			
			// Test value at different times
			expect(animatableObject.getPropertyValueAtTime('x', 0.5)).toBeGreaterThan(0); // In clip1
			expect(animatableObject.getPropertyValueAtTime('x', 3)).toBe(0); // Between clips
			expect(animatableObject.getPropertyValueAtTime('x', 5.5)).toBeGreaterThan(200); // In clip2
		});

		it('should handle clip regeneration with different parameters', () => {
			const animatableObject = new AnimatableObject('RegenerateTest');
			
			// Create noisy data
			const rawData: RawDataPoint[] = [];
			for (let i = 0; i <= 100; i++) {
				rawData.push({
					time: i * 0.01,
					value: Math.sin(i * 0.1) * 100 + (Math.random() - 0.5) * 20,
					timestamp: Date.now() + i * 10
				});
			}
			
			const clip = animatableObject.createClip('x', 0, rawData);
			const initialKeyframes = clip.keyframes.length;
			
			// Regenerate with different parameters
			const newKeyframes = clip.generateKeyframes({
				smoothingFactor: 0.5,
				minTimeDelta: 0.05,
				useCurveFitting: true
			});
			
			expect(newKeyframes.length).toBeDefined();
			expect(newKeyframes.length).toBeGreaterThan(0);
		});
	});
});