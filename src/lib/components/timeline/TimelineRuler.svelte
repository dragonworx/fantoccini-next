<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { TimelineViewport } from './types/TimelineTypes.js';
	import { calculateRulerTicks, timeToPixel, pixelToTime } from './utils/TimelineUtils.js';
  
	export let viewport: TimelineViewport;
	export let framerate: number = 60;
	export let currentTime: number = 0;
	export let inMarker: number = 0;
	export let outMarker: number = 10;
	export let showMarkers: boolean = true;
	export let showRecordingRegion: boolean = true;
	export let showPlayhead: boolean = true;
	export let theme: any = {};
  
	const dispatch = createEventDispatcher();
  
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let isDragging = false;
	let dragTarget: 'playhead' | 'inMarker' | 'outMarker' | null = null;
	let lastMouseX = 0;
  
	// Reactive calculations
	$: playheadX = timeToPixel(currentTime, viewport);
	$: inMarkerX = timeToPixel(inMarker, viewport);
	$: outMarkerX = timeToPixel(outMarker, viewport);
	$: ticks = calculateRulerTicks(viewport, framerate);
  
	// Colors from theme
	$: backgroundColor = theme.colors?.ruler || '#1a1a1a';
	$: textColor = theme.colors?.rulerText || '#cccccc';
	$: tickColor = theme.colors?.border || '#333333';
	$: playheadColor = theme.colors?.playhead || '#ff6b6b';
	$: inMarkerColor = theme.colors?.primary || '#4f8cff';
	$: outMarkerColor = theme.colors?.accent || '#ff6b6b';
  
	// Dimensions from theme
	$: rulerHeight = theme.ruler?.height || 40;
	$: majorTickHeight = theme.ruler?.majorTickHeight || 12;
	$: minorTickHeight = theme.ruler?.minorTickHeight || 6;
	$: textSize = theme.ruler?.textSize || 11;
  
	onMount(() => {
		if (canvas) {
			ctx = canvas.getContext('2d')!;
			updateCanvas();
		}
	});
  
	// Update canvas when viewport, currentTime, or other properties change
	$: if (canvas && ctx && (viewport || currentTime || inMarker || outMarker || theme)) {
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
    
		// Draw ruler background
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(0, 0, rect.width, rulerHeight);
    
		// Draw recording region if enabled and markers are set
		if (showRecordingRegion && inMarker < outMarker) {
			const recordingStart = Math.max(0, inMarkerX);
			const recordingEnd = Math.min(rect.width, outMarkerX);
			if (recordingStart < recordingEnd) {
				ctx.fillStyle = theme.colors?.recordingRegion || 'rgba(255, 107, 107, 0.1)';
				ctx.fillRect(recordingStart, 0, recordingEnd - recordingStart, rulerHeight);
			}
		}
    
		// Draw minor ticks
		ctx.strokeStyle = tickColor;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (const tick of ticks.minor) {
			const x = tick.position;
			if (x >= 0 && x <= rect.width) {
				ctx.moveTo(x, rulerHeight - minorTickHeight);
				ctx.lineTo(x, rulerHeight);
			}
		}
		ctx.stroke();
    
		// Draw major ticks and labels
		ctx.strokeStyle = tickColor;
		ctx.lineWidth = 1;
		ctx.fillStyle = textColor;
		ctx.font = `${textSize}px monospace`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
    
		ctx.beginPath();
		for (const tick of ticks.major) {
			const x = tick.position;
			if (x >= 0 && x <= rect.width) {
				// Draw tick line
				ctx.moveTo(x, rulerHeight - majorTickHeight);
				ctx.lineTo(x, rulerHeight);
        
				// Draw label
				ctx.fillText(tick.label, x, rulerHeight - majorTickHeight - 8);
			}
		}
		ctx.stroke();
    
		// Draw markers
		if (showMarkers) {
			// In marker
			if (inMarkerX >= 0 && inMarkerX <= rect.width) {
				drawMarker(ctx, inMarkerX, inMarkerColor, 'in');
			}
      
			// Out marker
			if (outMarkerX >= 0 && outMarkerX <= rect.width) {
				drawMarker(ctx, outMarkerX, outMarkerColor, 'out');
			}
		}
    
		// Draw playhead
		if (showPlayhead && playheadX >= 0 && playheadX <= rect.width) {
			drawPlayhead(ctx, playheadX, playheadColor);
		}
	}
  
	function drawMarker(ctx: CanvasRenderingContext2D, x: number, color: string, type: 'in' | 'out') {
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.lineWidth = 2;
    
		// Draw marker line
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, rulerHeight);
		ctx.stroke();
    
		// Draw marker triangle (larger and more prominent)
		ctx.beginPath();
		if (type === 'in') {
			ctx.moveTo(x, 0);
			ctx.lineTo(x + 10, 0);
			ctx.lineTo(x, 10);
		} else {
			ctx.moveTo(x, 0);
			ctx.lineTo(x - 10, 0);
			ctx.lineTo(x, 10);
		}
		ctx.closePath();
		ctx.fill();
    
		// Draw marker label
		ctx.fillStyle = '#ffffff';
		ctx.font = '10px Arial';
		ctx.textAlign = 'center';
		const label = type === 'in' ? 'IN' : 'OUT';
		const labelY = type === 'in' ? 25 : 25;
		ctx.fillText(label, x, labelY);
	}
  
	function drawPlayhead(ctx: CanvasRenderingContext2D, x: number, color: string) {
		ctx.fillStyle = color;
		ctx.strokeStyle = color;
		ctx.lineWidth = 2;
    
		// Draw playhead line
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, rulerHeight);
		ctx.stroke();
    
		// Draw playhead triangle
		ctx.beginPath();
		ctx.moveTo(x, rulerHeight);
		ctx.lineTo(x - 6, rulerHeight - 12);
		ctx.lineTo(x + 6, rulerHeight - 12);
		ctx.closePath();
		ctx.fill();
	}
  
	function handleMouseDown(event: MouseEvent) {
		if (!canvas) return;
    
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
    
		// Check what was clicked
		const clickTime = pixelToTime(x, viewport);
    
		// Check if clicking on markers (with tolerance)
		const tolerance = 12; // pixels
    
		if (showMarkers) {
			if (Math.abs(x - inMarkerX) < tolerance) {
				isDragging = true;
				dragTarget = 'inMarker';
				lastMouseX = x;
				return;
			}
      
			if (Math.abs(x - outMarkerX) < tolerance) {
				isDragging = true;
				dragTarget = 'outMarker';
				lastMouseX = x;
				return;
			}
		}
    
		// Check if clicking on playhead
		if (showPlayhead && Math.abs(x - playheadX) < tolerance) {
			isDragging = true;
			dragTarget = 'playhead';
			lastMouseX = x;
			return;
		}
    
		// Otherwise, seek to clicked position
		dispatch('seek', { time: clickTime });
	}
  
	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || !canvas || !dragTarget) return;
    
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const time = pixelToTime(x, viewport);
    
		switch (dragTarget) {
			case 'playhead':
				dispatch('seek', { time: Math.max(0, time) });
				break;
			case 'inMarker':
				dispatch('marker:in', { time: Math.max(0, Math.min(time, outMarker - 0.01)) });
				break;
			case 'outMarker':
				dispatch('marker:out', { time: Math.max(inMarker + 0.01, time) });
				break;
		}
    
		lastMouseX = x;
	}
  
	function handleMouseUp() {
		isDragging = false;
		dragTarget = null;
	}
  
	function handleMouseLeave() {
		isDragging = false;
		dragTarget = null;
	}
  
	// Update cursor style
	function handleMouseMoveForCursor(event: MouseEvent) {
		if (!canvas) return;
    
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const tolerance = 12;
    
		let cursor = 'default';
    
		if (showMarkers && (Math.abs(x - inMarkerX) < tolerance || Math.abs(x - outMarkerX) < tolerance)) {
			cursor = 'ew-resize';
		} else if (showPlayhead && Math.abs(x - playheadX) < tolerance) {
			cursor = 'ew-resize';
		} else {
			cursor = 'pointer';
		}
    
		canvas.style.cursor = cursor;
	}
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<div class="timeline-ruler" style="height: {rulerHeight}px;">
	<canvas
		bind:this={canvas}
		class="ruler-canvas"
		on:mousedown={handleMouseDown}
		on:mousemove={handleMouseMoveForCursor}
		on:mouseleave={handleMouseLeave}
		role="slider"
		aria-label="Timeline ruler"
		aria-valuenow={currentTime}
		aria-valuemin={viewport.startTime}
		aria-valuemax={viewport.endTime}
		tabindex="0"
	/>
</div>

<style>
  .timeline-ruler {
    position: relative;
    width: 100%;
    border-bottom: 1px solid #333;
    user-select: none;
  }
  
  .ruler-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
  
  .ruler-canvas:focus {
    outline: 2px solid #4f8cff;
    outline-offset: -2px;
  }
</style>