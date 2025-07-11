<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: number = 0; // angle in degrees
	export let size: number = 60;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let isDragging = false;
	let rect: DOMRect;

	$: if (canvas && ctx && value !== undefined) {
		drawDial();
	}

	function initCanvas() {
		if (!canvas) return;
		ctx = canvas.getContext('2d')!;
		rect = canvas.getBoundingClientRect();
		drawDial();
	}

	// Initialize canvas when component mounts
	$: if (canvas && !ctx) {
		initCanvas();
	}

	function drawDial() {
		if (!ctx) return;

		const centerX = size / 2;
		const centerY = size / 2;
		const radius = size / 2 - 4;

		// Clear canvas
		ctx.clearRect(0, 0, size, size);

		// Draw outer circle
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
		ctx.strokeStyle = '#555';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Draw background
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
		ctx.fillStyle = '#2a2a2a';
		ctx.fill();

		// Draw angle line
		const angleRad = (value * Math.PI) / 180;
		const lineEndX = centerX + Math.cos(angleRad - Math.PI / 2) * (radius - 4);
		const lineEndY = centerY + Math.sin(angleRad - Math.PI / 2) * (radius - 4);

		ctx.beginPath();
		ctx.moveTo(centerX, centerY);
		ctx.lineTo(lineEndX, lineEndY);
		ctx.strokeStyle = '#ffd700';
		ctx.lineWidth = 2;
		ctx.stroke();

		// Draw center dot
		ctx.beginPath();
		ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
		ctx.fillStyle = '#ffd700';
		ctx.fill();
	}

	function handleMouseDown(event: MouseEvent) {
		if (disabled) return;
		isDragging = true;
		rect = canvas.getBoundingClientRect();
		updateAngle(event);
		event.preventDefault();
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isDragging || disabled) return;
		updateAngle(event);
	}

	function handleMouseUp() {
		isDragging = false;
	}

	function updateAngle(event: MouseEvent) {
		if (!rect) return;

		const centerX = rect.left + size / 2;
		const centerY = rect.top + size / 2;
		const mouseX = event.clientX - centerX;
		const mouseY = event.clientY - centerY;

		let angle = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
		angle += 90; // Adjust so 0 degrees is at the top

		// Normalize angle to 0-360 range
		if (angle < 0) angle += 360;
		if (angle >= 360) angle -= 360;

		const newValue = Math.round(angle);
		if (newValue !== value) {
			value = newValue;
			dispatch('change', { value: newValue });
			console.log('Rotation updated to:', newValue);
		}
	}
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<canvas
	bind:this={canvas}
	width={size}
	height={size}
	class="rotation-dial"
	class:disabled
	on:mousedown={handleMouseDown}
/>

<style>
  .rotation-dial {
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #555;
  }

  .rotation-dial.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .rotation-dial:hover:not(.disabled) {
    border-color: #4f8cff;
  }
</style>