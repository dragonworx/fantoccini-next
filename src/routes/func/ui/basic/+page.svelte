<script lang="ts">
	import { onMount } from 'svelte';
	import { createStandardDemo } from '$lib/ui-demo-utils';
	import { Rectangle } from '$lib/ui/Rectangle';
	import UIDemoNav from '$lib/components/UIDemoNav.svelte';
	
	let demoContainer: HTMLDivElement;
	
	onMount(() => {
		// Create the standard demo setup
		const demo = createStandardDemo({
			title: 'Basic Rectangle Demo',
			description: 'Demonstrates the simplest UI rendering - a single colored rectangle.',
			canvasConfig: { width: 600, height: 400 }
		});
		
		// Add the demo container to our component
		demoContainer.appendChild(demo.container);
		
		// Create a simple red rectangle
		const rect = new Rectangle({
			x: 50,
			y: 50,
			width: 200,
			height: 150,
			backgroundColor: '#ff0000'
		});
		
		// Add the rectangle to the view
		demo.view.root.addChild(rect);
		
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