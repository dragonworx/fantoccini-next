<script lang="ts">
	import { onMount } from 'svelte';
	import { View } from '$core/ui';
	import { Element } from '$core/ui';
	
	let canvas: HTMLCanvasElement;
	
	onMount(() => {
		console.log('Test UI demo starting...');
		
		// Create view
		const view = new View(canvas);
		console.log('View created:', view);
		
		// Create a simple element
		const element = new Element({
			x: 100,
			y: 100,
			width: 200,
			height: 150,
			backgroundColor: '#ff0000'
		});
		console.log('Element created:', element);
		
		// Add element to view
		view.root.addChild(element);
		console.log('Element added to view root');
		
		// Render
		view.render();
		console.log('Render called');
		
		// Check scene
		console.log('Scene children:', view.scene.children.length);
		console.log('Root children:', view.root.children.length);
		console.log('Camera:', view.camera);
		console.log('Renderer size:', view.renderer.getSize(new (window as any).THREE.Vector2()));
		
		// Force another render after a delay
		setTimeout(() => {
			console.log('Forcing another render...');
			view.render();
			
			// Log element details
			console.log('Element visible:', element.visible);
			console.log('Element material:', element.material);
			console.log('Element geometry:', (element as any).planeGeometry);
		}, 1000);
	});
</script>

<h1>Test UI Demo</h1>
<canvas bind:this={canvas} width="800" height="600" style="border: 1px solid black; display: block;"></canvas>