<script lang="ts">
	import { onMount } from 'svelte';
	import { createStandardDemo } from '$lib/ui-demo-utils';
	import { Rectangle } from '$lib/ui/Rectangle';
	import { Stack } from '$lib/ui/Stack';
	import UIDemoNav from '$lib/components/UIDemoNav.svelte';
	
	let demoContainer: HTMLDivElement;
	
	onMount(() => {
		// Create the standard demo setup
		const demo = createStandardDemo({
			title: 'Stack Layout Demo',
			description: 'Demonstrates vertical and horizontal stack layouts for automatic element arrangement.',
			canvasConfig: { width: 600, height: 500 }
		});
		
		// Add the demo container to our component
		demoContainer.appendChild(demo.container);
		
		// Create a vertical stack
		const vStack = new Stack({
			x: 50,
			y: 50,
			direction: 'vertical',
			spacing: 10,
			padding: 20,
			backgroundColor: '#f5f5f5'
		});
		
		// Add items to vertical stack
		for (let i = 0; i < 3; i++) {
			const rect = new Rectangle({
				width: 150,
				height: 50,
				backgroundColor: `hsl(${i * 120}, 70%, 60%)`
			});
			vStack.addChild(rect);
		}
		
		// Create a horizontal stack
		const hStack = new Stack({
			x: 250,
			y: 50,
			direction: 'horizontal',
			spacing: 15,
			padding: 20,
			backgroundColor: '#e8e8e8'
		});
		
		// Add items to horizontal stack
		for (let i = 0; i < 3; i++) {
			const rect = new Rectangle({
				width: 60,
				height: 60,
				backgroundColor: `hsl(${i * 120 + 60}, 70%, 60%)`
			});
			hStack.addChild(rect);
		}
		
		// Add stacks to view
		demo.view.root.addChild(vStack);
		demo.view.root.addChild(hStack);
		
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