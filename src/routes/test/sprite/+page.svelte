<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { Sprite, type FillStyle } from '$core';

	// Sprite management
	let sprites: Sprite[] = [];
	let selectedSprite: Sprite | null = null;
	let spriteContainer: HTMLDivElement;
	let spriteIdCounter = 0;

	// No longer need to extend Sprite as these properties are now built-in
	type ExtendedSprite = Sprite;

	// Property definitions for extensible UI generation
	interface PropertyConfig {
		key: keyof Sprite;
		label: string;
		type: 'number' | 'select' | 'text' | 'range' | 'fillstyle';
		min?: number;
		max?: number;
		step?: number;
		options?: { value: any; label: string }[];
		defaultValue: any;
	}

	const spriteProperties: PropertyConfig[] = [
		// Position & Dimensions
		{
			key: 'x',
			label: 'X Position',
			type: 'range',
			min: -200,
			max: 400,
			step: 1,
			defaultValue: 150,
		},
		{
			key: 'y',
			label: 'Y Position',
			type: 'range',
			min: -200,
			max: 400,
			step: 1,
			defaultValue: 150,
		},
		{
			key: 'z',
			label: 'Z Position',
			type: 'range',
			min: -100,
			max: 100,
			step: 1,
			defaultValue: 0,
		},
		{
			key: 'width',
			label: 'Width',
			type: 'range',
			min: 10,
			max: 300,
			step: 1,
			defaultValue: 100,
		},
		{
			key: 'height',
			label: 'Height',
			type: 'range',
			min: 10,
			max: 300,
			step: 1,
			defaultValue: 100,
		},

		// Transform Origin
		{
			key: 'originX',
			label: 'Origin X',
			type: 'select',
			options: [
				{ value: '0%', label: 'Left (0%)' },
				{ value: '50%', label: 'Center (50%)' },
				{ value: '100%', label: 'Right (100%)' },
				{ value: 0, label: '0px' },
				{ value: 50, label: '50px' },
			],
			defaultValue: '50%',
		},
		{
			key: 'originY',
			label: 'Origin Y',
			type: 'select',
			options: [
				{ value: '0%', label: 'Top (0%)' },
				{ value: '50%', label: 'Center (50%)' },
				{ value: '100%', label: 'Bottom (100%)' },
				{ value: 0, label: '0px' },
				{ value: 50, label: '50px' },
			],
			defaultValue: '50%',
		},

		// Rotation
		{
			key: 'rotation',
			label: 'Rotation',
			type: 'range',
			min: -180,
			max: 180,
			step: 1,
			defaultValue: 0,
		},
		{
			key: 'rotationX',
			label: 'Rotation X',
			type: 'range',
			min: -180,
			max: 180,
			step: 1,
			defaultValue: 0,
		},
		{
			key: 'rotationY',
			label: 'Rotation Y',
			type: 'range',
			min: -180,
			max: 180,
			step: 1,
			defaultValue: 0,
		},
		{
			key: 'rotationZ',
			label: 'Rotation Z',
			type: 'range',
			min: -180,
			max: 180,
			step: 1,
			defaultValue: 0,
		},

		// Scale
		{
			key: 'scaleX',
			label: 'Scale X',
			type: 'range',
			min: 0.1,
			max: 3,
			step: 0.1,
			defaultValue: 1,
		},
		{
			key: 'scaleY',
			label: 'Scale Y',
			type: 'range',
			min: 0.1,
			max: 3,
			step: 0.1,
			defaultValue: 1,
		},

		// Skew
		{
			key: 'skewX',
			label: 'Skew X',
			type: 'range',
			min: -45,
			max: 45,
			step: 1,
			defaultValue: 0,
		},
		{
			key: 'skewY',
			label: 'Skew Y',
			type: 'range',
			min: -45,
			max: 45,
			step: 1,
			defaultValue: 0,
		},

		// Border
		{
			key: 'border',
			label: 'Border',
			type: 'text',
			defaultValue: '2px solid #4f8cff',
		},
	];

	// Reactive properties object
	let properties: Record<string, any> = {};

	// Fill style options
	let fillType: 'color' | 'gradient' | 'image' = 'color';
	let fillColor = '#4f8cff';
	let fillGradient = 'linear-gradient(45deg, #4f8cff, #00ff99)';
	let fillImage = 'https://placekitten.com/200/200';
	let fillStyle: FillStyle;

	// Initialize properties with defaults
	function initializeProperties() {
		properties = {};
		spriteProperties.forEach((prop) => {
			properties[prop.key] = prop.defaultValue;
		});
	}

	// Reactive fill style based on type
	$: fillStyle =
		fillType === 'color'
			? ({ type: 'color', value: fillColor } as FillStyle)
			: fillType === 'gradient'
			? ({ type: 'gradient', value: fillGradient } as FillStyle)
			: ({ type: 'image', value: fillImage } as FillStyle);

	// Animation control
	let isAnimating = false;
	let animationFrame: number | null = null;

	// Update selected sprite when properties change
	$: if (selectedSprite && browser) {
		// Update all numeric/string properties
		spriteProperties.forEach((prop) => {
			if (properties[prop.key] !== undefined) {
				(selectedSprite as any)[prop.key] = properties[prop.key];
			}
		});

		// Update fill style
		selectedSprite.fill = fillStyle;

		// Update the visual representation
		selectedSprite.updateStyle();
	}

	// Animation functions
	function startAnimation() {
		if (!selectedSprite || isAnimating) return;
		isAnimating = true;

		const startTime = performance.now();

		function animate(currentTime: number) {
			if (!selectedSprite || !isAnimating) return;

			const elapsed = currentTime - startTime;
			const time = elapsed / 1000; // Convert to seconds for easier timing

			// Calculate rotation values with different sin wave speeds
			const rotationX = Math.sin(time * Math.PI) * 30; // ±30 degrees, 2 second cycle
			const rotationY = Math.sin(time * Math.PI * 1.33) * 45; // ±45 degrees, 1.5 second cycle
			const rotationZ = Math.sin(time * Math.PI * 2) * 60; // ±60 degrees, 1 second cycle
			const rotation = Math.sin(time * Math.PI * 0.67) * 180; // ±180 degrees, 3 second cycle

			// Calculate position oscillation
			const centerX = properties.x || 150;
			const centerY = properties.y || 150;
			const x = centerX + Math.sin(time * Math.PI * 0.5) * 20; // gentle horizontal sway
			const y = centerY + Math.cos(time * Math.PI * 0.7) * 15; // gentle vertical float

			// Calculate scale animation
			const scaleX = 1 + Math.sin(time * Math.PI * 1.2) * 0.1;
			const scaleY = 1 + Math.cos(time * Math.PI * 1.4) * 0.1;

			// Apply transform directly to DOM element
			const transform = `
				translate3d(${x}px, ${y}px, 0)
				rotateX(${rotationX}deg)
				rotateY(${rotationY}deg)
				rotateZ(${rotationZ}deg)
				rotate(${rotation}deg)
				scale(${scaleX}, ${scaleY})
			`;

			selectedSprite.el.style.transform = transform;
			animationFrame = requestAnimationFrame(animate);
		}

		animationFrame = requestAnimationFrame(animate);
	}

	function stopAnimation() {
		isAnimating = false;
		if (animationFrame !== null) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}

		// Reset transform to current property values
		if (selectedSprite) {
			selectedSprite.el.style.transform = '';
			selectedSprite.updateStyle();
		}
	}

	function toggleAnimation() {
		if (isAnimating) {
			stopAnimation();
		} else {
			startAnimation();
		}
	}

	function resetProperties() {
		stopAnimation();
		if (selectedSprite) {
			loadPropertiesFromSprite(selectedSprite as ExtendedSprite);
		} else {
			initializeProperties();
			fillType = 'color';
			fillColor = '#4f8cff';
		}
	}

	// Sprite creation
	function createSprite(parent?: ExtendedSprite): ExtendedSprite {
		const newSprite = new Sprite({
			x: 150,
			y: 150,
			z: 0,
			width: 100,
			height: 100,
			fill: { type: 'color', value: '#4f8cff' },
		}) as ExtendedSprite;

		newSprite.id = ++spriteIdCounter;
		newSprite.children = [];
		newSprite.selected = false;

		// Add selection styling
		newSprite.el.style.cursor = 'pointer';
		newSprite.el.addEventListener('click', (e) => {
			e.stopPropagation();
			selectSprite(newSprite);
		});

		if (parent) {
			newSprite.parent = parent;
			parent.children?.push(newSprite);
		}

		// Add to sprites array and DOM
		sprites.push(newSprite);
		newSprite.updateStyle();
		spriteContainer.appendChild(newSprite.el);

		return newSprite;
	}

	// Select a sprite
	function selectSprite(sprite: ExtendedSprite) {
		// If this sprite is from a DOM element, select the root instead
		if (sprite.isFromDOMElement) {
			sprite = Sprite.findDOMElementRoot(sprite) as ExtendedSprite;
		}

		// Deselect current sprite
		if (selectedSprite) {
			selectedSprite.selected = false;
			updateSpriteSelection(selectedSprite as ExtendedSprite);
		}

		// Select new sprite
		selectedSprite = sprite;
		selectedSprite!.selected = true;
		updateSpriteSelection(selectedSprite as ExtendedSprite);

		// Load sprite properties into controls
		loadPropertiesFromSprite(selectedSprite as ExtendedSprite);
	}

	function updateSpriteSelection(sprite: ExtendedSprite) {
		if (sprite.selected) {
			sprite.el.style.boxShadow = '0 0 0 4px rgba(79, 140, 255, 0.8)';
			sprite.el.style.zIndex = '1000';
		} else {
			sprite.el.style.boxShadow = 'none';
			sprite.el.style.zIndex = String(Math.round(sprite.z));
		}
	}

	function loadPropertiesFromSprite(sprite: ExtendedSprite) {
		spriteProperties.forEach((prop) => {
			properties[prop.key] = (sprite as any)[prop.key];
		});

		// Load fill style
		if (sprite.fill.type === 'color') {
			fillType = 'color';
			fillColor = sprite.fill.value;
		} else if (sprite.fill.type === 'gradient') {
			fillType = 'gradient';
			fillGradient = sprite.fill.value;
		} else if (sprite.fill.type === 'image') {
			fillType = 'image';
			fillImage = sprite.fill.value;
		}
	}

	function addChildSprite() {
		if (!selectedSprite) return;
		const newSprite = createSprite(selectedSprite as ExtendedSprite);
		selectSprite(newSprite as ExtendedSprite);
	}

	function deleteSprite() {
		if (!selectedSprite || sprites.length <= 1) return;

		// Remove from parent's children array
		if (selectedSprite.parent) {
			const parentChildren = selectedSprite.parent.children || [];
			const index = parentChildren.indexOf(selectedSprite);
			if (index >= 0) {
				parentChildren.splice(index, 1);
			}
		}

		// Remove from DOM
		if (selectedSprite.el.parentNode) {
			selectedSprite.el.parentNode.removeChild(selectedSprite.el);
		}

		// Remove from sprites array
		const index = sprites.indexOf(selectedSprite);
		if (index >= 0) {
			sprites.splice(index, 1);
		}

		// Select the first remaining sprite
		if (sprites.length > 0) {
			selectSprite(sprites[0] as ExtendedSprite);
		} else {
			selectedSprite = null;
			initializeProperties();
		}
	}

	// DOM Element Examples
	function createDOMElementExamples() {
		// Create a complex card structure
		const cardElement = document.createElement('div');
		cardElement.className = 'demo-card';
		cardElement.innerHTML = `
			<div class="card-header">
				<h3>Sample Card</h3>
				<button class="card-button">Action</button>
			</div>
			<div class="card-body">
				<p>This is a card created from a DOM element hierarchy.</p>
				<div class="card-stats">
					<span class="stat">Views: 42</span>
					<span class="stat">Likes: 7</span>
				</div>
			</div>
			<div class="card-footer">
				<small>Created from DOM</small>
			</div>
		`;

		// Style the card
		Object.assign(cardElement.style, {
			width: '250px',
			height: '200px',
			background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			borderRadius: '12px',
			color: 'white',
			padding: '0',
			boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
			overflow: 'hidden',
			fontFamily: 'Arial, sans-serif'
		});

		// Style card sections
		const header = cardElement.querySelector('.card-header') as HTMLElement;
		if (header) {
			Object.assign(header.style, {
				padding: '16px',
				borderBottom: '1px solid rgba(255,255,255,0.2)',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center'
			});
		}

		const body = cardElement.querySelector('.card-body') as HTMLElement;
		if (body) {
			Object.assign(body.style, {
				padding: '16px',
				flex: '1'
			});
		}

		const footer = cardElement.querySelector('.card-footer') as HTMLElement;
		if (footer) {
			Object.assign(footer.style, {
				padding: '12px 16px',
				background: 'rgba(0,0,0,0.2)',
				borderTop: '1px solid rgba(255,255,255,0.1)'
			});
		}

		const button = cardElement.querySelector('.card-button') as HTMLElement;
		if (button) {
			Object.assign(button.style, {
				background: 'rgba(255,255,255,0.2)',
				border: '1px solid rgba(255,255,255,0.3)',
				color: 'white',
				padding: '6px 12px',
				borderRadius: '6px',
				cursor: 'pointer',
				fontSize: '12px'
			});
		}

		const stats = cardElement.querySelector('.card-stats') as HTMLElement;
		if (stats) {
			Object.assign(stats.style, {
				display: 'flex',
				gap: '16px',
				marginTop: '12px'
			});
		}

		const statElements = cardElement.querySelectorAll('.stat');
		statElements.forEach(stat => {
			Object.assign((stat as HTMLElement).style, {
				background: 'rgba(255,255,255,0.1)',
				padding: '4px 8px',
				borderRadius: '4px',
				fontSize: '12px'
			});
		});

		// Create sprite from DOM element
		const cardSprite = Sprite.fromDOMElement(cardElement, {
			preserveElementStyles: true,
			recursive: true
		});

		// Position the card
		cardSprite.x = 400;
		cardSprite.y = 50;
		cardSprite.id = ++spriteIdCounter;

		// Add to sprites array
		sprites.push(cardSprite);
		spriteContainer.appendChild(cardSprite.el);
		cardSprite.updateStyle();

		// Create a navigation menu structure
		const navElement = document.createElement('nav');
		navElement.className = 'demo-nav';
		navElement.innerHTML = `
			<div class="nav-brand">Logo</div>
			<ul class="nav-menu">
				<li class="nav-item"><a href="#" class="nav-link">Home</a></li>
				<li class="nav-item"><a href="#" class="nav-link">About</a></li>
				<li class="nav-item"><a href="#" class="nav-link">Services</a></li>
				<li class="nav-item"><a href="#" class="nav-link">Contact</a></li>
			</ul>
			<div class="nav-actions">
				<button class="nav-btn">Sign In</button>
				<button class="nav-btn primary">Sign Up</button>
			</div>
		`;

		// Create sprite from navigation
		const navSprite = Sprite.fromDOMElement(navElement, {
			preserveElementStyles: true,
			recursive: true
		});

		// Position the navigation
		navSprite.x = 50;
		navSprite.y = 280;
		navSprite.id = ++spriteIdCounter;

		// Add to sprites array
		sprites.push(navSprite);
		spriteContainer.appendChild(navSprite.el);
		navSprite.updateStyle();

		// Add click handlers to make DOM elements interactive
		[cardSprite, navSprite].forEach(sprite => {
			sprite.el.addEventListener('click', (e) => {
				e.stopPropagation();
				selectSprite(sprite);
			});
		});
	}

	onMount(() => {
		if (!browser) return;

		initializeProperties();

		// Create initial sprite
		const initialSprite = createSprite();
		selectSprite(initialSprite);

		// Create DOM element examples
		createDOMElementExamples();

		// Add keyboard shortcut for testing (space key)
		// eslint-disable-next-line no-undef
		const handleKeydown = (e: KeyboardEvent) => {
			if (e.code === 'Space') {
				e.preventDefault();
				toggleAnimation();
			}
		};
		window.addEventListener('keydown', handleKeydown);

		// Clean up event listener
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	onDestroy(() => {
		stopAnimation();
		sprites.forEach((sprite) => sprite.remove());
		sprites = [];
		selectedSprite = null;
	});
</script>

<div class="page-center">
	<div class="demo-layout">
		<!-- Controls Panel -->
		<div class="controls-panel">
			<div class="controls-header">
				<h2>Sprite Controls</h2>
			</div>
			<div class="controls-grid">
				<!-- Transform Properties -->
				<div class="section-header">
					<h3>Transform Properties</h3>
				</div>
				{#each spriteProperties as prop}
					<div class="control-group">
						<label for={prop.key}>{prop.label}</label>

						{#if prop.type === 'range'}
							<div class="range-container">
								<input
									id={prop.key}
									type="range"
									min={prop.min}
									max={prop.max}
									step={prop.step}
									bind:value={properties[prop.key]}
								/>
								<span class="range-value"
								>{properties[prop.key]}</span
								>
							</div>
						{:else if prop.type === 'select'}
							<select
								id={prop.key}
								bind:value={properties[prop.key]}
							>
								{#each prop.options || [] as option}
									<option value={option.value}
									>{option.label}</option
									>
								{/each}
							</select>
						{:else if prop.type === 'text'}
							<input
								id={prop.key}
								type="text"
								bind:value={properties[prop.key]}
							/>
						{/if}
					</div>
				{/each}

				<!-- Fill Style Controls -->
				<div class="section-header">
					<h3>Fill Style</h3>
				</div>
				<div class="control-group fill-controls">
					<label id="fill-style-label" for="color-radio"
					>Fill Style</label
					>
					<div
						class="fill-type-selector"
						aria-labelledby="fill-style-label"
					>
						<label class="radio-label">
							<input
								id="color-radio"
								type="radio"
								bind:group={fillType}
								value="color"
							/>
							Color
						</label>
						<label class="radio-label">
							<input
								type="radio"
								bind:group={fillType}
								value="gradient"
							/>
							Gradient
						</label>
						<label class="radio-label">
							<input
								type="radio"
								bind:group={fillType}
								value="image"
							/>
							Image
						</label>
					</div>

					{#if fillType === 'color'}
						<input type="color" bind:value={fillColor} />
					{:else if fillType === 'gradient'}
						<input
							type="text"
							bind:value={fillGradient}
							placeholder="CSS gradient"
						/>
					{:else if fillType === 'image'}
						<input
							type="text"
							bind:value={fillImage}
							placeholder="Image URL"
						/>
					{/if}
				</div>

				<!-- DOM Element Controls -->
				<div class="button-row">
					<h4>DOM Element Info</h4>
					{#if selectedSprite?.isFromDOMElement}
						<div class="dom-info">
							<p>✓ Created from DOM element</p>
							<p>Preserve styles: {selectedSprite.preserveElementStyles ? 'Yes' : 'No'}</p>
							<p>Element: {selectedSprite.el.tagName.toLowerCase()}</p>
							{#if selectedSprite.el.className}
								<p>Class: {selectedSprite.el.className}</p>
							{/if}
						</div>
					{:else}
						<p>Regular sprite (not from DOM)</p>
					{/if}
				</div>

				<!-- Sprite Management -->
				<div class="button-row">
					<h4>Sprite Management</h4>
					<div class="button-group">
						<button
							class="main-btn"
							on:click={addChildSprite}
							disabled={!selectedSprite}
						>
							Add Child
						</button>
						<button
							class="danger-btn"
							on:click={deleteSprite}
							disabled={!selectedSprite || sprites.length <= 1}
						>
							Delete
						</button>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="button-row">
					<h4>Animation & Controls</h4>
					<p style="font-size: 12px; color: #aaa; margin: 5px 0;">Press SPACE to toggle animation</p>
					<div class="button-group">
						<button class="main-btn" on:click={toggleAnimation}>
							{isAnimating ? 'Stop Animation' : 'Start Animation'}
						</button>
						<button
							class="secondary-btn"
							on:click={resetProperties}
						>
							Reset Properties
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Sprite Display Area -->
		<div class="sprite-display">
			<div class="sprite-container" bind:this={spriteContainer}>
				<!-- Sprite will be rendered here -->
			</div>

			<!-- Property Display -->
			<div class="property-display">
				<h3>
					{#if selectedSprite}
						Selected Sprite #{selectedSprite.id}
						{#if selectedSprite.parent}
							(Child of #{selectedSprite.parent.id})
						{/if}
					{:else}
						No Sprite Selected
					{/if}
				</h3>

				{#if selectedSprite}
					<div class="sprite-info">
						<div class="property-item">
							<span class="property-name">ID:</span>
							<span class="property-value"
							>{selectedSprite.id}</span
							>
						</div>
						<div class="property-item">
							<span class="property-name">Children:</span>
							<span class="property-value"
							>{selectedSprite.children?.length || 0}</span
							>
						</div>
					</div>

					<div class="property-grid">
						{#each spriteProperties as prop}
							<div class="property-item">
								<span class="property-name">{prop.label}:</span>
								<span class="property-value"
								>{properties[prop.key]}</span
								>
							</div>
						{/each}
						<div class="property-item">
							<span class="property-name">Fill:</span>
							<span class="property-value"
							>{fillType} - {fillStyle.value}</span
							>
						</div>
					</div>

					{#if sprites.length > 1}
						<div class="sprite-hierarchy">
							<h4>Sprite Hierarchy</h4>
							<div class="hierarchy-list">
								{#each sprites.filter((s) => !s.parent) as rootSprite}
									<div
										class="hierarchy-item"
										class:selected={rootSprite ===
											selectedSprite}
									>
										<button
											class="sprite-selector"
											on:click={() =>
												selectSprite(rootSprite)}
										>
											Sprite #{rootSprite.id}
										</button>
										{#if rootSprite.children && rootSprite.children.length > 0}
											<div class="children">
												{#each rootSprite.children as childSprite}
													<div
														class="hierarchy-item child"
														class:selected={childSprite ===
															selectedSprite}
													>
														<button
															class="sprite-selector"
															on:click={() =>
																selectSprite(
																	childSprite,
																)}
														>
															└ Sprite #{childSprite.id}
														</button>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{:else}
					<p>
						Click on a sprite to select it and view its properties.
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
    :root {
        --primary-blue: #4f8cff;
        --secondary-blue: #1e63e0;
        --dark-bg: #1a1a1a;
        --panel-bg: #2a2a2a;
        --text-color: #ffffff;
        --border-color: #3a3a3a;
    }

    .page-center {
        position: absolute;
        top: 50px; /* Offset by header height */
        bottom: 40px; /* Offset by footer height */
        left: 0;
        right: 0;
        padding: 10px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
    }

    .demo-layout {
        width: 100%;
        max-width: 1200px;
        height: 100%;
        display: flex;
        flex-direction: row;
        gap: 15px;
    }

    .controls-panel {
        flex: 0 0 300px;
        background-color: var(--panel-bg);
        border-radius: 10px;
        padding: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        max-height: 100%;
    }

    .controls-header {
        padding: 20px 20px 10px 20px;
        border-bottom: 1px solid var(--border-color);
        flex-shrink: 0;
    }

    .controls-header h2 {
        margin: 0;
        font-size: 18px;
        color: var(--text-color);
    }

    .controls-grid {
        display: flex;
        flex-direction: column;
        gap: 15px;
        padding: 20px;
        overflow-y: auto;
        flex: 1;
    }

    .controls-grid::-webkit-scrollbar {
        width: 8px;
    }

    .controls-grid::-webkit-scrollbar-track {
        background: var(--panel-bg);
    }

    .controls-grid::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 4px;
    }

    .controls-grid::-webkit-scrollbar-thumb:hover {
        background: #666;
    }

    .section-header {
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-color);
    }

    .section-header h3 {
        margin: 0;
        font-size: 16px;
        color: var(--primary-blue);
        font-weight: 500;
    }

    .control-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .control-group label {
        font-size: 14px;
        font-weight: 500;
        color: #ccc;
        margin-bottom: 4px;
    }

    .range-container {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .range-container input[type="range"] {
        flex: 1;
        height: 6px;
        background: #444;
        border-radius: 3px;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
    }

    .range-container input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        background: var(--primary-blue);
        border-radius: 50%;
        cursor: pointer;
    }

    .range-value {
        min-width: 40px;
        text-align: right;
        font-size: 14px;
        font-family: monospace;
    }

    input[type="text"],
    input[type="color"],
    select {
        padding: 8px 10px;
        background: #333;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        color: white;
        font-size: 14px;
    }

    input[type="text"]:focus,
    select:focus {
        outline: none;
        border-color: var(--primary-blue);
        box-shadow: 0 0 0 2px rgba(79, 140, 255, 0.3);
    }

    .fill-controls {
        padding: 10px;
        background: #333;
        border-radius: 8px;
    }

    .fill-type-selector {
        display: flex;
        gap: 15px;
        margin-bottom: 10px;
    }

    .radio-label {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 14px;
        cursor: pointer;
    }

    .button-row {
        display: flex;
        flex-direction: column;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid var(--border-color);
    }

    .button-row:first-of-type {
        border-top: none;
        padding-top: 0;
        margin-top: 15px;
    }

    .button-group {
        display: flex;
        gap: 10px;
        margin-top: 8px;
    }

    .button-row h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        color: #ccc;
    }

    .main-btn {
        background: linear-gradient(
            90deg,
            var(--primary-blue) 60%,
            #1a5fd0 100%
        );
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 15px;
        font-weight: 600;
        cursor: pointer;
        flex: 1;
        transition: all 0.2s;
    }

    .main-btn:hover {
        background: var(--secondary-blue);
    }

    .secondary-btn {
        background: #444;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 15px;
        font-weight: 500;
        cursor: pointer;
    }

    .secondary-btn:hover {
        background: #555;
    }

    .danger-btn {
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 15px;
        font-weight: 600;
        cursor: pointer;
    }

    .danger-btn:hover {
        background: #c0392b;
    }

    .danger-btn:disabled,
    .main-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .danger-btn:disabled:hover,
    .main-btn:disabled:hover {
        background: #e74c3c;
        opacity: 0.5;
    }

    .main-btn:disabled:hover {
        background: linear-gradient(
            90deg,
            var(--primary-blue) 60%,
            #1a5fd0 100%
        );
        opacity: 0.5;
    }

    .sprite-display {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
        overflow: hidden;
        min-height: 0;
        min-width: 0;
    }

    .sprite-container {
        flex: 1;
        background-color: var(--panel-bg);
        border-radius: 10px;
        position: relative;
        overflow: hidden;
        min-height: 0;
        min-width: 400px; /* Minimum width for demo content */
    }

    .property-display {
        background-color: var(--panel-bg);
        border-radius: 10px;
        padding: 10px;
        height: 200px; /* Fixed height */
        overflow-y: auto;
        overflow-x: hidden;
        flex-shrink: 0;
    }

    .property-display::-webkit-scrollbar {
        width: 8px;
    }

    .property-display::-webkit-scrollbar-track {
        background: var(--panel-bg);
    }

    .property-display::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 4px;
    }

    .property-display::-webkit-scrollbar-thumb:hover {
        background: #666;
    }

    .property-display h3 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 18px;
    }

    .property-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }

    .property-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 5px 0;
        border-bottom: 1px solid var(--border-color);
    }

    .property-name {
        color: #bbb;
    }

    .property-value {
        font-weight: 500;
        font-family: monospace;
        background: #333;
        padding: 2px 6px;
        border-radius: 4px;
    }

    .sprite-info {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-color);
    }

    .sprite-hierarchy {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid var(--border-color);
    }

    .sprite-hierarchy h4 {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #ccc;
    }

    .hierarchy-list {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .hierarchy-item {
        padding: 2px 0;
    }

    .hierarchy-item.child {
        margin-left: 20px;
    }

    .sprite-selector {
        background: none;
        border: none;
        color: #ccc;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        text-align: left;
        width: 100%;
    }

    .sprite-selector:hover {
        background: #444;
        color: white;
    }

    .hierarchy-item.selected .sprite-selector {
        background: var(--primary-blue);
        color: white;
    }

    .children {
        margin-top: 5px;
        padding-left: 10px;
        border-left: 1px solid var(--border-color);
    }

    .dom-info {
        background: #333;
        padding: 12px;
        border-radius: 6px;
        margin-top: 8px;
    }

    .dom-info p {
        margin: 4px 0;
        font-size: 14px;
        color: #ccc;
    }

    .dom-info p:first-child {
        color: #4f8cff;
        font-weight: 500;
    }

    @media (max-width: 1000px) {
        .page-center {
            height: auto;
            min-height: 100vh;
            overflow: visible;
        }

        .demo-layout {
            flex-direction: column;
            height: auto;
        }

        .controls-panel {
            flex: auto;
            width: 100%;
            max-height: 60vh;
        }

        .sprite-container {
            min-height: 300px;
        }

        .property-display {
            height: auto;
            max-height: 300px;
        }
    }
</style>
