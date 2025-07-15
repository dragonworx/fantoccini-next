<script lang="ts">
	import { onMount } from 'svelte';
	import { createStandardDemo } from '$lib/ui-demo-utils';
	import { Rectangle } from '$lib/ui/Rectangle';
	import { FlexContainer } from '$lib/ui/FlexContainer';
	import UIDemoNav from '$lib/components/UIDemoNav.svelte';
	
	let demoContainer: HTMLDivElement;
	
	onMount(() => {
		// Create the standard demo setup
		const demo = createStandardDemo({
			title: 'Flex Layout Demo',
			description: 'Shows flexible box layouts with various alignment and distribution options.',
			canvasConfig: { width: 700, height: 500 }
		});
		
		// Add the demo container to our component
		demoContainer.appendChild(demo.container);
		
		// Create a flex container with justify-content: space-between
		const flex1 = new FlexContainer({
			x: 50,
			y: 50,
			width: 600,
			height: 80,
			direction: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: 10,
			backgroundColor: '#f0f0f0'
		});
		
		// Add items to first flex container
		for (let i = 0; i < 4; i++) {
			const rect = new Rectangle({
				width: 80,
				height: 50,
				backgroundColor: `hsl(${i * 90}, 70%, 60%)`
			});
			flex1.addChild(rect);
		}
		
		// Create a flex container with align-items variations
		const flex2 = new FlexContainer({
			x: 50,
			y: 150,
			width: 600,
			height: 120,
			direction: 'row',
			justifyContent: 'space-around',
			alignItems: 'flex-end',
			padding: 10,
			backgroundColor: '#e8e8e8'
		});
		
		// Add items of different heights
		const heights = [40, 60, 80, 50];
		for (let i = 0; i < 4; i++) {
			const rect = new Rectangle({
				width: 70,
				height: heights[i],
				backgroundColor: `hsl(${i * 90 + 45}, 70%, 60%)`
			});
			flex2.addChild(rect);
		}
		
		// Create a column flex container
		const flex3 = new FlexContainer({
			x: 50,
			y: 290,
			width: 200,
			height: 150,
			direction: 'column',
			justifyContent: 'center',
			alignItems: 'stretch',
			padding: 15,
			gap: 10,
			backgroundColor: '#ddd'
		});
		
		// Add stretched items
		for (let i = 0; i < 3; i++) {
			const rect = new Rectangle({
				height: 30,
				backgroundColor: `hsl(${i * 120 + 180}, 60%, 55%)`
			});
			flex3.addChild(rect);
		}
		
		// Add all flex containers to view
		demo.view.root.addChild(flex1);
		demo.view.root.addChild(flex2);
		demo.view.root.addChild(flex3);
		
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