<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import type { IKeyframe } from '../../../core/timeline/index.js';
	import type { TimelineViewport, TimelineTrackConfig, InterpolationType, EasingPreset } from './types/TimelineTypes.js';
	import { timeToPixel, pixelToTime, isPointInDiamond, getKeyframeBounds } from './utils/TimelineUtils.js';
	import { EASING_PRESETS } from './types/TimelineTypes.js';
  
	export let track: TimelineTrackConfig;
	export let viewport: TimelineViewport;
	export let keyframes: Array<{ id: string; keyframe: IKeyframe<any> }> = [];
	export let selectedKeyframes: Set<string> = new Set();
	export const currentTime: number = 0;
	export let framerate: number = 60;
	export let theme: any = {};
	export const showEasingControls: boolean = false;
	export let allowClickToAdd: boolean = false;
  
	const dispatch = createEventDispatcher();
  
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let isDragging = false;
	let dragKeyframeId: string | null = null;
	let dragStartX = 0;
	let dragStartTime = 0;
	let showContextMenu = false;
	let contextMenuX = 0;
	let contextMenuY = 0;
	let contextKeyframeId: string | null = null;
	let showEasingPanel = false;
	let easingKeyframeId: string | null = null;
  
	// Colors from theme
	$: backgroundColor = theme.colors?.track || '#2a2a2a';
	$: borderColor = theme.colors?.trackBorder || '#3a3a3a';
	$: keyframeColor = theme.colors?.keyframe || '#4f8cff';
	$: keyframeSelectedColor = theme.colors?.keyframeSelected || '#ff6b6b';
	$: keyframeHoverColor = theme.colors?.keyframeHover || '#64a3ff';
	$: textColor = theme.colors?.text || '#ffffff';
	$: textMutedColor = theme.colors?.textMuted || '#999999';
  
	// Dimensions from theme
	$: trackHeight = theme.tracks?.height || 32;
	$: keyframeSize = theme.keyframes?.size || 8;
	$: keyframeShape = theme.keyframes?.shape || 'diamond';
  
	let hoveredKeyframeId: string | null = null;
  
	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d')!;
			updateCanvas();
		}
	});
  
	onDestroy(() => {
	// Clean up any event listeners
	});
  
	// Update canvas when viewport or keyframes change
	$: if (canvas && ctx) {
		updateCanvas();
	}
  
	function updateCanvas() {
		if (!canvas || !ctx) return;
    
		// Set canvas size
		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);
    
		// Clear canvas
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, rect.width, rect.height);
    
		// Draw track background
		ctx.fillStyle = track.muted ? 'rgba(102, 102, 102, 0.5)' : backgroundColor;
		ctx.fillRect(0, 0, rect.width, trackHeight);
    
		// Draw keyframes
		drawKeyframes();
    
		// Draw interpolation curves if enabled
		if (keyframes.length > 1) {
			drawInterpolationCurves();
		}
	}
  
	function drawKeyframes() {
		const centerY = trackHeight / 2;
    
		for (const { id, keyframe } of keyframes) {
			const x = timeToPixel(keyframe.time, viewport);
      
			// Skip if outside viewport
			if (x < -keyframeSize || x > viewport.width + keyframeSize) continue;
      
			// Determine color
			let color = keyframeColor;
			if (selectedKeyframes.has(id)) {
				color = keyframeSelectedColor;
			} else if (hoveredKeyframeId === id) {
				color = keyframeHoverColor;
			}
      
			// Draw keyframe
			ctx.fillStyle = color;
			ctx.strokeStyle = color;
			ctx.lineWidth = 1;
      
			if (keyframeShape === 'diamond') {
				drawDiamond(ctx, x, centerY, keyframeSize);
			} else if (keyframeShape === 'circle') {
				drawCircle(ctx, x, centerY, keyframeSize);
			} else {
				drawSquare(ctx, x, centerY, keyframeSize);
			}
      
			// Draw selection outline
			if (selectedKeyframes.has(id)) {
				ctx.strokeStyle = keyframeSelectedColor;
				ctx.lineWidth = 2;
				ctx.stroke();
			}
		}
	}
  
	function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
		const halfSize = size / 2;
		ctx.beginPath();
		ctx.moveTo(x, y - halfSize);
		ctx.lineTo(x + halfSize, y);
		ctx.lineTo(x, y + halfSize);
		ctx.lineTo(x - halfSize, y);
		ctx.closePath();
		ctx.fill();
	}
  
	function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
		ctx.beginPath();
		ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
		ctx.fill();
	}
  
	function drawSquare(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
		const halfSize = size / 2;
		ctx.fillRect(x - halfSize, y - halfSize, size, size);
	}
  
	function drawInterpolationCurves() {
		if (keyframes.length < 2) return;
    
		const sortedKeyframes = [...keyframes].sort((a, b) => a.keyframe.time - b.keyframe.time);
    
		ctx.strokeStyle = keyframeColor;
		ctx.lineWidth = 1;
		ctx.globalAlpha = 0.5;
    
		for (let i = 0; i < sortedKeyframes.length - 1; i++) {
			const startKf = sortedKeyframes[i].keyframe;
			const endKf = sortedKeyframes[i + 1].keyframe;
      
			const startX = timeToPixel(startKf.time, viewport);
			const endX = timeToPixel(endKf.time, viewport);
      
			// Skip if both points are outside viewport
			if ((startX < 0 && endX < 0) || (startX > viewport.width && endX > viewport.width)) continue;
      
			const centerY = trackHeight / 2;
      
			ctx.beginPath();
			ctx.moveTo(startX, centerY);
      
			if (endKf.interpolation === 'Step') {
				// Step interpolation - draw right angle
				ctx.lineTo(endX, centerY);
				ctx.lineTo(endX, centerY);
			} else if (endKf.interpolation === 'Bezier' && endKf.bezierControlPoints) {
				// Bezier interpolation - draw curve
				const cp1x = endKf.bezierControlPoints.cp1.time;
				const cp1y = endKf.bezierControlPoints.cp1.value;
				const cp2x = endKf.bezierControlPoints.cp2.time;
				const cp2y = endKf.bezierControlPoints.cp2.value;
				const controlPoint1X = startX + (endX - startX) * cp1x;
				const controlPoint1Y = centerY + (centerY * cp1y);
				const controlPoint2X = startX + (endX - startX) * cp2x;
				const controlPoint2Y = centerY + (centerY * cp2y);
        
				ctx.bezierCurveTo(controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y, endX, centerY);
			} else {
				// Linear interpolation
				ctx.lineTo(endX, centerY);
			}
      
			ctx.stroke();
		}
    
		ctx.globalAlpha = 1;
	}
  
	function handleMouseDown(event: MouseEvent) {
		if (!canvas) return;
    
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
    
		// Check if clicking on a keyframe
		const clickedKeyframe = getKeyframeAtPosition(x, y);
    
		if (clickedKeyframe) {
			// Start dragging
			isDragging = true;
			dragKeyframeId = clickedKeyframe.id;
			dragStartX = x;
			dragStartTime = clickedKeyframe.keyframe.time;
      
			// Select keyframe
			if (!selectedKeyframes.has(clickedKeyframe.id)) {
				const multiSelect = event.ctrlKey || event.metaKey;
				dispatch('keyframe:select', {
					trackId: track.id,
					keyframeIds: [clickedKeyframe.id],
					multiSelect
				});
			}
		} else {
			// Clear selection if not holding ctrl/cmd
			if (!(event.ctrlKey || event.metaKey)) {
				dispatch('keyframe:deselect', {
					trackId: track.id,
					keyframeIds: Array.from(selectedKeyframes)
				});
			}
      
			// Add keyframe at clicked position (only if allowed)
			if (allowClickToAdd) {
				const clickTime = pixelToTime(x, viewport);
				const snappedTime = Math.round(clickTime * framerate) / framerate;
        
				dispatch('keyframe:add', {
					trackId: track.id,
					time: snappedTime,
					value: getDefaultValueForProperty(track.property)
				});
			}
		}
	}
  
	function handleMouseMove(event: MouseEvent) {
		if (!canvas) return;
    
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
    
		if (isDragging && dragKeyframeId) {
			// Drag keyframe
			const deltaX = x - dragStartX;
			const deltaTime = pixelToTime(deltaX, viewport) - pixelToTime(0, viewport);
			const newTime = Math.max(0, dragStartTime + deltaTime);
			const snappedTime = Math.round(newTime * framerate) / framerate;
      
			dispatch('keyframe:move', {
				trackId: track.id,
				keyframeId: dragKeyframeId,
				newTime: snappedTime
			});
		} else {
			// Update hover state
			const hoveredKeyframe = getKeyframeAtPosition(x, y);
			const newHoveredId = hoveredKeyframe ? hoveredKeyframe.id : null;
      
			if (newHoveredId !== hoveredKeyframeId) {
				hoveredKeyframeId = newHoveredId;
				updateCanvas();
			}
      
			// Update cursor
			canvas.style.cursor = hoveredKeyframe ? 'grab' : 'crosshair';
		}
	}
  
	function handleMouseUp() {
		isDragging = false;
		dragKeyframeId = null;
    
		if (canvas) {
			canvas.style.cursor = 'crosshair';
		}
	}
  
	function handleContextMenu(event: MouseEvent) {
		event.preventDefault();
    
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
    
		const clickedKeyframe = getKeyframeAtPosition(x, y);
    
		if (clickedKeyframe) {
			contextKeyframeId = clickedKeyframe.id;
			contextMenuX = event.clientX;
			contextMenuY = event.clientY;
			showContextMenu = true;
		}
	}
  
	function getKeyframeAtPosition(x: number, y: number): { id: string; keyframe: IKeyframe<any> } | null {
		const centerY = trackHeight / 2;
    
		for (const { id, keyframe } of keyframes) {
			const kfX = timeToPixel(keyframe.time, viewport);
      
			if (keyframeShape === 'diamond') {
				if (isPointInDiamond(x, y, kfX, centerY, keyframeSize)) {
					return { id, keyframe };
				}
			} else {
				const bounds = getKeyframeBounds(kfX, centerY, keyframeSize);
				if (x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom) {
					return { id, keyframe };
				}
			}
		}
    
		return null;
	}
  
	function getDefaultValueForProperty(property: string): any {
		switch (property) {
			case 'x':
			case 'y':
			case 'rotation':
				return 0;
			case 'scaleX':
			case 'scaleY':
				return 1;
			case 'alpha':
				return 1;
			case 'color':
				return '#ffffff';
			default:
				return 0;
		}
	}
  
	function handleDeleteKeyframe() {
		if (contextKeyframeId) {
			dispatch('keyframe:remove', {
				trackId: track.id,
				keyframeId: contextKeyframeId
			});
		}
		closeContextMenu();
	}
  
	function handleEditKeyframe() {
		if (contextKeyframeId) {
			// For now, just log - in a real implementation, this would open an edit dialog
			console.log('Edit keyframe:', contextKeyframeId);
		}
		closeContextMenu();
	}
  
	function handleSetEasing() {
		if (contextKeyframeId) {
			easingKeyframeId = contextKeyframeId;
			showEasingPanel = true;
		}
		closeContextMenu();
	}
  
	function closeContextMenu() {
		showContextMenu = false;
		contextKeyframeId = null;
	}
  
	function handleEasingChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const preset = EASING_PRESETS.find(p => p.name === target.value);
    
		if (preset && easingKeyframeId) {
			dispatch('keyframe:easing', {
				trackId: track.id,
				keyframeId: easingKeyframeId,
				interpolation: preset.type,
				controlPoints: preset.controlPoints
			});
		}
	}
  
	function closeEasingPanel() {
		showEasingPanel = false;
		easingKeyframeId = null;
	}
  
	function handleTrackToggle() {
		dispatch('track:toggle', {
			trackId: track.id,
			visible: !track.visible
		});
	}
  
	function handleTrackMute() {
		dispatch('track:mute', {
			trackId: track.id,
			muted: !track.muted
		});
	}
</script>

<svelte:window on:mouseup={handleMouseUp} on:click={closeContextMenu} />

<div class="timeline-track" style="height: {trackHeight}px;">
	<!-- Track Header -->
	<div class="track-header">
		<button
			class="track-toggle"
			class:visible={track.visible}
			on:click={handleTrackToggle}
			title="Toggle visibility"
		>
			<svg width="16" height="16" viewBox="0 0 16 16">
				{#if track.visible}
					<path d="M8 2C4.5 2 1.5 4.5 0 8c1.5 3.5 4.5 6 8 6s6.5-2.5 8-6c-1.5-3.5-4.5-6-8-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="currentColor"/>
					<circle cx="8" cy="8" r="2" fill="currentColor"/>
				{:else}
					<path d="M2 2l12 12M8 2C4.5 2 1.5 4.5 0 8c1.5 3.5 4.5 6 8 6s6.5-2.5 8-6c-1.5-3.5-4.5-6-8-6z" fill="none" stroke="currentColor" stroke-width="2"/>
				{/if}
			</svg>
		</button>
    
		<button
			class="track-mute"
			class:muted={track.muted}
			on:click={handleTrackMute}
			title="Toggle mute"
		>
			M
		</button>
    
		<div class="track-label" style="color: {track.color};">
			{track.label}
		</div>
	</div>
  
	<!-- Track Canvas -->
	<div class="track-canvas-container">
		<canvas
			bind:this={canvas}
			class="track-canvas"
			on:mousedown={handleMouseDown}
			on:mousemove={handleMouseMove}
			on:contextmenu={handleContextMenu}
			style="height: {trackHeight}px;"
		/>
	</div>
</div>

<!-- Context Menu -->
{#if showContextMenu}
	<div
		class="context-menu"
		style="left: {contextMenuX}px; top: {contextMenuY}px;"
	>
		<button on:click={handleEditKeyframe}>Edit Value</button>
		<button on:click={handleSetEasing}>Set Easing</button>
		<button on:click={handleDeleteKeyframe}>Delete</button>
	</div>
{/if}

<!-- Easing Panel -->
{#if showEasingPanel}
	<div class="easing-panel">
		<div class="easing-header">
			<h3>Keyframe Easing</h3>
			<button on:click={closeEasingPanel}>×</button>
		</div>
    
		<div class="easing-content">
			<label>
				Easing Type:
				<select on:change={handleEasingChange}>
					{#each EASING_PRESETS as preset}
						<option value={preset.name}>{preset.name}</option>
					{/each}
				</select>
			</label>
		</div>
	</div>
{/if}

<style>
  .timeline-track {
    display: flex;
    background: #2a2a2a;
    border-bottom: 1px solid #3a3a3a;
    user-select: none;
  }
  
  .track-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    width: 200px;
    min-width: 200px;
    background: #1a1a1a;
    border-right: 1px solid #3a3a3a;
  }
  
  .track-toggle {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 2px;
    border-radius: 2px;
  }
  
  .track-toggle.visible {
    color: #4f8cff;
  }
  
  .track-toggle:hover {
    background: #3a3a3a;
  }
  
  .track-mute {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 10px;
    font-weight: bold;
  }
  
  .track-mute.muted {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }
  
  .track-mute:hover {
    background: #3a3a3a;
  }
  
  .track-label {
    font-size: 11px;
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .track-canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;
  }
  
  .track-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  
  .context-menu {
    position: fixed;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    padding: 4px 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
  }
  
  .context-menu button {
    display: block;
    width: 100%;
    padding: 6px 12px;
    background: none;
    border: none;
    color: #ffffff;
    text-align: left;
    cursor: pointer;
    font-size: 12px;
  }
  
  .context-menu button:hover {
    background: #3a3a3a;
  }
  
  .easing-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    z-index: 1000;
    min-width: 300px;
  }
  
  .easing-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #3a3a3a;
  }
  
  .easing-header h3 {
    margin: 0;
    font-size: 14px;
    color: #ffffff;
  }
  
  .easing-header button {
    background: none;
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 18px;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
  }
  
  .easing-header button:hover {
    background: #3a3a3a;
    color: #ffffff;
  }
  
  .easing-content {
    padding: 16px;
  }
  
  .easing-content label {
    display: block;
    color: #ffffff;
    font-size: 12px;
    margin-bottom: 8px;
  }
  
  .easing-content select {
    width: 100%;
    padding: 6px 8px;
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
    border-radius: 4px;
    color: #ffffff;
    font-size: 12px;
  }
  
  .easing-content select:focus {
    outline: none;
    border-color: #4f8cff;
  }
</style>