<script lang="ts">
	import { onMount } from 'svelte';
	import { createStandardDemo } from '$lib/ui-demo-utils';
	import { Text } from '$lib/ui/Text';
	import { Container } from '$lib/ui/Container';
	import { Stack } from '$lib/ui/Stack';
	import UIDemoNav from '$lib/components/UIDemoNav.svelte';
	
	let demoContainer: HTMLDivElement;
	
	onMount(() => {
		// Create the standard demo setup
		const demo = createStandardDemo({
			title: 'Text Rendering Demo',
			description: 'Demonstrates text rendering with various fonts, sizes, and styles.',
			canvasConfig: { width: 700, height: 600 }
		});
		
		// Add the demo container to our component
		demoContainer.appendChild(demo.container);
		
		// Create a container for text samples
		const textContainer = new Stack({
			x: 50,
			y: 50,
			direction: 'vertical',
			spacing: 20,
			padding: 20,
			backgroundColor: '#f9f9f9'
		});
		
		// Basic text
		const basicText = new Text({
			text: 'Basic Text - Default Settings',
			fontSize: 16,
			color: '#333'
		});
		textContainer.addChild(basicText);
		
		// Large bold text
		const largeText = new Text({
			text: 'Large Bold Text',
			fontSize: 32,
			fontWeight: 'bold',
			color: '#2c3e50'
		});
		textContainer.addChild(largeText);
		
		// Italic text with custom font
		const italicText = new Text({
			text: 'Italic text with serif font',
			fontSize: 20,
			fontFamily: 'Georgia, serif',
			fontStyle: 'italic',
			color: '#8b4513'
		});
		textContainer.addChild(italicText);
		
		// Colored text samples
		const colorContainer = new Container({
			x: 50,
			y: 250,
			width: 600,
			height: 100,
			padding: 20,
			backgroundColor: '#333'
		});
		
		const coloredText1 = new Text({
			text: 'Colorful',
			x: 20,
			y: 30,
			fontSize: 28,
			fontWeight: 'bold',
			color: '#ff6b6b'
		});
		
		const coloredText2 = new Text({
			text: 'Text',
			x: 120,
			y: 30,
			fontSize: 28,
			fontWeight: 'bold',
			color: '#4ecdc4'
		});
		
		const coloredText3 = new Text({
			text: 'Samples',
			x: 180,
			y: 30,
			fontSize: 28,
			fontWeight: 'bold',
			color: '#ffe66d'
		});
		
		colorContainer.addChild(coloredText1);
		colorContainer.addChild(coloredText2);
		colorContainer.addChild(coloredText3);
		
		// Text alignment demo
		const alignContainer = new Stack({
			x: 50,
			y: 380,
			direction: 'vertical',
			spacing: 10,
			width: 400,
			padding: 15,
			backgroundColor: '#e8e8e8'
		});
		
		const leftText = new Text({
			text: 'Left aligned text',
			textAlign: 'left',
			width: 360
		});
		
		const centerText = new Text({
			text: 'Center aligned text',
			textAlign: 'center',
			width: 360
		});
		
		const rightText = new Text({
			text: 'Right aligned text',
			textAlign: 'right',
			width: 360
		});
		
		alignContainer.addChild(leftText);
		alignContainer.addChild(centerText);
		alignContainer.addChild(rightText);
		
		// Add all elements to view
		demo.view.root.addChild(textContainer);
		demo.view.root.addChild(colorContainer);
		demo.view.root.addChild(alignContainer);
		
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