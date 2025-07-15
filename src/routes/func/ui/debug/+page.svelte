<script lang="ts">
	import { onMount } from 'svelte';
	import { View } from '$core/ui';
	import { Element } from '$core/ui';
	import { Container } from '$core/ui';
	import * as THREE from 'three';
	
	let canvas: HTMLCanvasElement;
	let logContainer: HTMLDivElement;
	
	function log(message: string, data?: any) {
		const entry = document.createElement('div');
		entry.style.marginBottom = '5px';
		entry.innerHTML = `<strong>${message}</strong>`;
		if (data !== undefined) {
			entry.innerHTML += `: <code>${JSON.stringify(data)}</code>`;
		}
		logContainer.appendChild(entry);
		console.log(message, data);
	}
	
	onMount(() => {
		log('Starting debug UI demo...');
		
		try {
			// Create view
			const view = new View(canvas);
			log('View created', {
				width: view.canvas.width,
				height: view.canvas.height,
				renderer: !!view.renderer,
				scene: !!view.scene,
				camera: !!view.camera,
				root: !!view.root
			});
			
			// Check camera setup
			log('Camera info', {
				type: view.camera.type,
				left: view.camera.left,
				right: view.camera.right,
				top: view.camera.top,
				bottom: view.camera.bottom,
				position: view.camera.position.toArray(),
				projectionMatrix: view.camera.projectionMatrix.elements.slice(0, 4)
			});
			
			// Create and set root container
			const root = new Container({
				width: canvas.width,
				height: canvas.height
			});
			view.setRoot(root);
			
			// Check root container
			if (view.root) {
				log('Root container', {
					id: view.root.id,
					width: view.root.width,
					height: view.root.height,
					backgroundColor: view.root.backgroundColor,
					mesh: !!view.root.getMesh(),
					visible: view.root.visible
				});
			}
			
			// Create a simple element
			const element = new Element({
				x: 100,
				y: 100,
				width: 200,
				height: 150,
				backgroundColor: '#ff0000'
			});
			log('Element created', {
				x: element.x,
				y: element.y,
				width: element.width,
				height: element.height,
				backgroundColor: element.backgroundColor
			});
			
			// Add element to root
			view.root!.addChild(element);
			log('Element added to root');
			
			// Check element mesh
			const mesh = element.getMesh();
			if (mesh) {
				log('Element mesh', {
					position: mesh.position.toArray(),
					scale: mesh.scale.toArray(),
					visible: mesh.visible,
					material: {
						type: mesh.material.type,
						color: (mesh.material as THREE.MeshBasicMaterial).color.getHex(),
						opacity: (mesh.material as THREE.MeshBasicMaterial).opacity,
						transparent: (mesh.material as THREE.MeshBasicMaterial).transparent
					},
					geometry: {
						type: mesh.geometry.type
					}
				});
			}
			
			// Check scene children
			log('Scene children count', view.scene.children.length);
			view.scene.children.forEach((child, index) => {
				log(`Scene child ${index}`, {
					type: child.type,
					visible: child.visible,
					position: child.position.toArray()
				});
			});
			
			// Render
			view.render();
			log('Render called');
			
			// Check renderer state
			const renderInfo = view.renderer.info;
			log('Render info', {
				render: {
					calls: renderInfo.render.calls,
					triangles: renderInfo.render.triangles,
					points: renderInfo.render.points,
					lines: renderInfo.render.lines
				}
			});
			
			// Force update and render again
			element.markDirty(0x1F); // All flags
			view.update();
			view.render();
			log('Force update and render');
			
			// Add a second element to test
			const element2 = new Container({
				x: 350,
				y: 100,
				width: 150,
				height: 150,
				backgroundColor: 0x00ff00
			});
			view.root!.addChild(element2);
			view.render();
			log('Added second green element');
			
			// Debug renderer capabilities
			const gl = view.renderer.getContext();
			log('WebGL context', {
				vendor: gl.getParameter(gl.VENDOR),
				renderer: gl.getParameter(gl.RENDERER)
			});
			
			// Make view available globally for console debugging
			(window as any).debugView = view;
			log('View available as window.debugView for console debugging');
			
		} catch (error) {
			log('ERROR', error.message);
			console.error(error);
		}
	});
</script>

<h1>Debug UI Demo</h1>
<div style="display: flex; gap: 20px;">
	<div>
		<h3>Canvas</h3>
		<canvas bind:this={canvas} width="800" height="600" style="border: 2px solid red; display: block; background: white;"></canvas>
	</div>
	<div style="flex: 1;">
		<h3>Debug Log</h3>
		<div bind:this={logContainer} style="font-family: monospace; font-size: 12px; max-height: 600px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background: #f5f5f5;"></div>
	</div>
</div>