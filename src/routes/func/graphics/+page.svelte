<script lang="ts">
	import { onMount } from 'svelte';
	import { createView, createBoxElement } from '../../../core/graphics';
	import type { View } from '../../../core/graphics';

	let container: HTMLElement;
	let view: View;

	onMount(() => {
		view = createView(800, 600, {
			backgroundColor: '#f8f9fa',
			enableEvents: true
		});

		view.mount(container);

		// Basic box
		const box1 = createBoxElement(view, {
			content: 'Box',
			backgroundColor: '#ff6b6b',
			textColor: '#ffffff',
			fontSize: 16,
			layoutProperties: {
				width: 100,
				height: 60,
				marginTop: 20,
				marginLeft: 20
			}
		});

		// Click box
		const box2 = createBoxElement(view, {
			content: 'Click',
			backgroundColor: '#4ecdc4',
			textColor: '#ffffff',
			fontSize: 16,
			layoutProperties: {
				width: 100,
				height: 60,
				marginTop: 20,
				marginLeft: 140
			}
		});
		box2.on('click', () => {
			box2.backgroundColor = box2.backgroundColor === '#4ecdc4' ? '#34495e' : '#4ecdc4';
			view.invalidate();
		});

		// Large box
		const box3 = createBoxElement(view, {
			content: 'Large',
			backgroundColor: '#45b7d1',
			textColor: '#ffffff',
			fontSize: 20,
			layoutProperties: {
				width: 150,
				height: 80,
				marginTop: 20,
				marginLeft: 260
			}
		});

		// Rounded corners
		const box4 = createBoxElement(view, {
			content: 'Round',
			backgroundColor: '#96ceb4',
			textColor: '#ffffff',
			fontSize: 14,
			borderRadius: 15,
			layoutProperties: {
				width: 120,
				height: 50,
				marginTop: 120,
				marginLeft: 20
			}
		});

		// Border
		const box5 = createBoxElement(view, {
			content: 'Border',
			backgroundColor: '#feca57',
			borderColor: '#ff7675',
			borderWidth: 3,
			fontSize: 14,
			layoutProperties: {
				width: 120,
				height: 50,
				marginTop: 120,
				marginLeft: 160
			}
		});

		// Transparent
		const box6 = createBoxElement(view, {
			content: 'Alpha',
			backgroundColor: 'rgba(108, 92, 231, 0.7)',
			textColor: '#ffffff',
			fontSize: 14,
			layoutProperties: {
				width: 120,
				height: 50,
				marginTop: 120,
				marginLeft: 300
			}
		});

		// Text only
		const box7 = createBoxElement(view, {
			content: 'Text Only',
			textColor: '#2c3e50',
			fontSize: 18,
			textAlign: 'center',
			layoutProperties: {
				width: 150,
				height: 30,
				marginTop: 200,
				marginLeft: 20
			}
		});

		// Hover
		const box8 = createBoxElement(view, {
			content: 'Hover',
			backgroundColor: '#e17055',
			textColor: '#ffffff',
			fontSize: 14,
			layoutProperties: {
				width: 120,
				height: 50,
				marginTop: 200,
				marginLeft: 190
			}
		});

		view.rootElement.appendChild(box1);
		view.rootElement.appendChild(box2);
		view.rootElement.appendChild(box3);
		view.rootElement.appendChild(box4);
		view.rootElement.appendChild(box5);
		view.rootElement.appendChild(box6);
		view.rootElement.appendChild(box7);
		view.rootElement.appendChild(box8);

		view.render();

		return () => {
			view.dispose();
		};
	});
</script>

<div bind:this={container}></div>

<style>
	div {
		display: block;
	}
</style>

