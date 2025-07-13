<script lang="ts">
	import { onMount } from 'svelte';
	import { createView, createBoxElement } from '$lib/../core/graphics';
	import type { View } from '$lib/../core/graphics';

	let container: HTMLElement;
	let view: View;

	// Layout demo state
	let selectedContainerId: string | null = null;
	let selectedContainer: any = null;
	
	// Property controls
	let flexDirection = 'row';
	let justifyContent = 'flex-start';
	let alignItems = 'stretch';
	let flexWrap = 'nowrap';
	let flexGrow = 1;
	let flexShrink = 1;
	let gap = 10;

	// Demo containers for different scenarios
	const containers: any[] = [];

	onMount(() => {
		// Ensure container is ready before creating view
		if (container) {
			createLayoutDemo();
		}
		return () => {
			view?.dispose();
		};
	});

	function createLayoutDemo() {
		// Ensure container exists
		if (!container) {
			console.warn('Container not ready for view creation');
			return;
		}

		// Dispose existing view
		if (view) {
			view.dispose();
		}

		// Clear containers array
		containers.length = 0;

		// Create new view
		view = createView(1200, 800, {
			backgroundColor: '#f0f2f5',
			enableEvents: true
		});

		// Mount to DOM
		view.mount(container);

		// Create multiple demo containers
		createInteractiveDemo();
		
		// Force immediate layout calculation and render
		view.calculateLayout();
		view.render();
		
		console.log('Demo created, view mounted:', view.canvas.width, 'x', view.canvas.height);
	}

	function createInteractiveDemo() {
		// Create main layout container
		const mainContainer = createBoxElement(view, {
			backgroundColor: 'transparent',
			layoutProperties: {
				width: 1200,
				height: 800,
				flexDirection: 'column',
				paddingTop: 20,
				paddingRight: 20,
				paddingBottom: 20,
				paddingLeft: 20
			}
		});

		// Create title
		const title = createBoxElement(view, {
			content: 'Interactive Flexbox Layout Demo - Click containers to select and modify',
			backgroundColor: '#34495e',
			textColor: '#ffffff',
			fontSize: 18,
			textAlign: 'center',
			layoutProperties: {
				width: 1160,
				height: 50,
				marginBottom: 20,
				justifyContent: 'center',
				alignItems: 'center'
			}
		});
		
		console.log('Title element created:', title);

		// Create demo scenarios grid
		const demoGrid = createBoxElement(view, {
			backgroundColor: '#e8e8e8',
			layoutProperties: {
				width: 1160,
				height: 710,
				flexDirection: 'row',
				flexWrap: 'wrap',
				justifyContent: 'space-between',
				alignItems: 'flex-start',
				paddingTop: 10,
				paddingRight: 10,
				paddingBottom: 10,
				paddingLeft: 10
			}
		});

		// Demo 1: Basic Row Layout
		createDemoContainer('demo1', 'Row Layout', demoGrid, 560, 220, {
			flexDirection: 'row',
			justifyContent: 'flex-start',
			alignItems: 'center',
			paddingTop: 20,
			paddingRight: 20,
			paddingBottom: 20,
			paddingLeft: 20
		});

		// Demo 2: Column Layout
		createDemoContainer('demo2', 'Column Layout', demoGrid, 560, 220, {
			flexDirection: 'column',
			justifyContent: 'flex-start',
			alignItems: 'center',
			paddingTop: 20,
			paddingRight: 20,
			paddingBottom: 20,
			paddingLeft: 20
		});

		// Demo 3: Center Everything
		createDemoContainer('demo3', 'Center Layout', demoGrid, 560, 220, {
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			paddingTop: 20,
			paddingRight: 20,
			paddingBottom: 20,
			paddingLeft: 20
		});

		// Demo 4: Space Between
		createDemoContainer('demo4', 'Space Between', demoGrid, 560, 220, {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingTop: 20,
			paddingRight: 20,
			paddingBottom: 20,
			paddingLeft: 20
		});

		mainContainer.appendChild(title);
		mainContainer.appendChild(demoGrid);
		view.rootElement.appendChild(mainContainer);
		
		console.log('Interactive demo created:', {
			mainContainer,
			title,
			demoGrid,
			rootChildren: view.rootElement.children.length,
			containers: containers.length
		});
	}

	function createDemoContainer(id: string, title: string, parent: any, width: number, height: number, layoutProps: any) {
		// Container wrapper with border
		const wrapper = createBoxElement(view, {
			backgroundColor: '#ffffff',
			layoutProperties: {
				width: width,
				height: height,
				marginBottom: 20,
				paddingTop: 10,
				paddingRight: 10,
				paddingBottom: 10,
				paddingLeft: 10,
				flexDirection: 'column'
			}
		});

		// Title bar
		const titleBar = createBoxElement(view, {
			content: title,
			backgroundColor: '#3498db',
			textColor: '#ffffff',
			fontSize: 14,
			textAlign: 'center',
			layoutProperties: {
				width: width - 20,
				height: 30,
				marginBottom: 10,
				justifyContent: 'center',
				alignItems: 'center'
			}
		});

		// Demo container (this is what gets selected and modified)
		const demoContainer = createBoxElement(view, {
			backgroundColor: '#ecf0f1',
			layoutProperties: {
				width: width - 20,
				height: height - 50,
				...layoutProps
			}
		});

		// Add selection behavior
		demoContainer.on('click', () => {
			selectContainer(id, demoContainer);
		});

		// Add container to tracking array
		containers.push({
			id: id,
			element: demoContainer,
			title: title
		});

		// Create child items for demonstration
		const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
		for (let i = 0; i < 3; i++) {
			const item = createBoxElement(view, {
				content: `Item ${i + 1}`,
				backgroundColor: colors[i],
				textColor: '#ffffff',
				fontSize: 12,
				textAlign: 'center',
				layoutProperties: {
					width: 60,
					height: 40,
					marginTop: 5,
					marginRight: 5,
					marginBottom: 5,
					marginLeft: 5,
					justifyContent: 'center',
					alignItems: 'center'
				}
			});
			demoContainer.appendChild(item);
		}

		wrapper.appendChild(titleBar);
		wrapper.appendChild(demoContainer);
		parent.appendChild(wrapper);
	}

	function selectContainer(id: string, container: any) {
		// Clear previous selection
		if (selectedContainer) {
			selectedContainer.backgroundColor = '#ecf0f1';
		}

		// Select new container
		selectedContainerId = id;
		selectedContainer = container;
		container.backgroundColor = '#fff3cd'; // Highlight selected

		// Update controls to match selected container's properties
		const layoutProps = container.layoutStyle || {};
		flexDirection = layoutProps.flexDirection || 'row';
		justifyContent = layoutProps.justifyContent || 'flex-start';
		alignItems = layoutProps.alignItems || 'stretch';
		flexWrap = layoutProps.flexWrap || 'nowrap';

		view.render();
	}

	function updateSelectedContainer() {
		if (!selectedContainer) return;

		// Update the selected container's layout properties
		selectedContainer.setLayoutProperties({
			flexDirection: flexDirection,
			justifyContent: justifyContent,
			alignItems: alignItems,
			flexWrap: flexWrap
		});

		view.render();
	}

	// Reactive updates when controls change - only if container is selected
	$: if (selectedContainer) {
		updateSelectedContainer();
	}
</script>

<div class="layout-demo">
	<div class="controls">
		<h1>Interactive Layout System Demo</h1>
		<p>Explore the power of our pure TypeScript flexbox layout engine!</p>
		
		{#if selectedContainerId}
			<div class="selected-info">
				<h3>Selected: {containers.find(c => c.id === selectedContainerId)?.title || 'None'}</h3>
				<p>Use the controls below to modify the selected container's layout properties.</p>
			</div>

			<div class="control-group">
				<label>Flex Direction:</label>
				<select bind:value={flexDirection}>
					<option value="row">Row</option>
					<option value="column">Column</option>
					<option value="row-reverse">Row Reverse</option>
					<option value="column-reverse">Column Reverse</option>
				</select>
			</div>

			<div class="control-group">
				<label>Justify Content:</label>
				<select bind:value={justifyContent}>
					<option value="flex-start">Flex Start</option>
					<option value="flex-end">Flex End</option>
					<option value="center">Center</option>
					<option value="space-between">Space Between</option>
					<option value="space-around">Space Around</option>
					<option value="space-evenly">Space Evenly</option>
				</select>
			</div>

			<div class="control-group">
				<label>Align Items:</label>
				<select bind:value={alignItems}>
					<option value="flex-start">Flex Start</option>
					<option value="flex-end">Flex End</option>
					<option value="center">Center</option>
					<option value="stretch">Stretch</option>
					<option value="baseline">Baseline</option>
				</select>
			</div>

			<div class="control-group">
				<label>Flex Wrap:</label>
				<select bind:value={flexWrap}>
					<option value="nowrap">No Wrap</option>
					<option value="wrap">Wrap</option>
					<option value="wrap-reverse">Wrap Reverse</option>
				</select>
			</div>
		{:else}
			<div class="no-selection">
				<p><strong>No container selected.</strong> Click on any of the layout containers below to select it and modify its properties.</p>
			</div>
		{/if}
	</div>
	
	<div class="canvas-wrapper">
		<div bind:this={container} class="canvas-container"></div>
	</div>
	
	<div class="info-panel">
		<h3>Layout System Features:</h3>
		<div class="features-grid">
			<div class="feature">
				<h4>Pure TypeScript</h4>
				<p>No external dependencies, reliable browser compatibility</p>
			</div>
			<div class="feature">
				<h4>Complete Flexbox</h4>
				<p>Full flexbox property support with proper behavior</p>
			</div>
			<div class="feature">
				<h4>Performance Optimized</h4>
				<p>Dirty flag system, layout caching, and efficient algorithms</p>
			</div>
			<div class="feature">
				<h4>Type Safe</h4>
				<p>Comprehensive TypeScript types for all layout properties</p>
			</div>
			<div class="feature">
				<h4>Reactive Updates</h4>
				<p>Automatic layout recalculation when properties change</p>
			</div>
			<div class="feature">
				<h4>Nested Layouts</h4>
				<p>Support for complex nested flexbox containers</p>
			</div>
		</div>
	</div>
</div>

<style>
	.layout-demo {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.controls {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		text-align: center;
	}

	.controls h1 {
		color: #2c3e50;
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.controls p {
		color: #7f8c8d;
		margin: 0 0 1.5rem 0;
		font-size: 1.1rem;
	}

	.selected-info {
		background: #e8f5e8;
		border: 2px solid #4caf50;
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	.selected-info h3 {
		margin: 0 0 0.5rem 0;
		color: #2e7d32;
		font-size: 1.2rem;
	}

	.selected-info p {
		margin: 0;
		color: #388e3c;
		font-size: 0.9rem;
	}

	.no-selection {
		background: #fff3e0;
		border: 2px solid #ff9800;
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.no-selection p {
		margin: 0;
		color: #f57c00;
		font-size: 1rem;
	}

	.demo-selector {
		margin-bottom: 1rem;
	}

	.control-group {
		display: inline-block;
		margin: 0 1rem 1rem 0;
	}

	.control-group label {
		display: block;
		color: #2c3e50;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.control-group select,
	.demo-selector select {
		padding: 0.5rem;
		border: 2px solid #bdc3c7;
		border-radius: 4px;
		background: white;
		font-size: 1rem;
		min-width: 150px;
	}

	.control-group select:focus,
	.demo-selector select:focus {
		outline: none;
		border-color: #3498db;
	}

	.demo-selector label {
		display: inline-block;
		color: #2c3e50;
		font-weight: 600;
		margin-right: 1rem;
		vertical-align: middle;
	}

	.canvas-wrapper {
		background: #ffffff;
		border: 2px solid #bdc3c7;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 2rem;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
	}

	.canvas-container {
		display: flex;
		justify-content: center;
		border: 1px dashed #95a5a6;
		border-radius: 4px;
		background: #fafafa;
		min-height: 820px; /* Ensure container has height for the canvas */
		width: 100%;
	}

	.info-panel {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
	}

	.info-panel h3 {
		margin: 0 0 1.5rem 0;
		text-align: center;
		font-size: 1.5rem;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.feature {
		background: rgba(255,255,255,0.1);
		padding: 1.5rem;
		border-radius: 8px;
		backdrop-filter: blur(10px);
	}

	.feature h4 {
		margin: 0 0 0.5rem 0;
		color: #ffffff;
		font-size: 1.1rem;
	}

	.feature p {
		margin: 0;
		color: rgba(255,255,255,0.9);
		font-size: 0.9rem;
		line-height: 1.4;
	}

	@media (max-width: 768px) {
		.layout-demo {
			padding: 1rem;
		}
		
		.control-group {
			display: block;
			margin-bottom: 1rem;
		}
		
		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>