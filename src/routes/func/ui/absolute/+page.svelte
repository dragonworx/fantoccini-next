<script lang="ts">
	import { onMount } from 'svelte';
	import { createStandardDemo } from '$lib/ui-demo-utils';
	import { Rectangle } from '$lib/ui/Rectangle';
	import { Container } from '$lib/ui/Container';
	import UIDemoNav from '$lib/components/UIDemoNav.svelte';
	
	let demoContainer: HTMLDivElement;
	
	onMount(() => {
		// Create the standard demo setup
		const demo = createStandardDemo({
			title: 'Absolute Positioning Demo',
			description: 'Shows how UI elements can be positioned absolutely within their parent container.',
			canvasConfig: { width: 600, height: 400 }
		});
		
		// Add the demo container to our component
		demoContainer.appendChild(demo.container);
		
		// Create a container with absolute positioning
		const container = new Container({
			x: 50,
			y: 50,
			width: 400,
			height: 300,
			backgroundColor: '#f0f0f0'
		});
		
		// Add absolutely positioned rectangles
		const rect1 = new Rectangle({
			x: 20,
			y: 20,
			width: 100,
			height: 80,
			backgroundColor: '#ff6b6b'
		});
		
		const rect2 = new Rectangle({
			x: 150,
			y: 50,
			width: 120,
			height: 100,
			backgroundColor: '#4ecdc4'
		});
		
		const rect3 = new Rectangle({
			x: 80,
			y: 120,
			width: 90,
			height: 90,
			backgroundColor: '#45b7d1'
		});
		
		// Add rectangles to container
		container.addChild(rect1);
		container.addChild(rect2);
		container.addChild(rect3);
		
		// Add container to view
		demo.view.root.addChild(container);
		
		// Render the scene
		demo.view.render();
	});
</script>

<UIDemoNav />
<div bind:this={demoContainer}></div>

<style>
	div {
		padding: 20px;
	}
</style>