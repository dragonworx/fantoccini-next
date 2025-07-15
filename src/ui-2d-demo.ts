import * as THREE from 'three';
import { 
	Scene, 
	View2D, 
	Sprite2D, 
	AnchorPoint,
	BasicMaterial,
	StyleManager
} from './ui-system';

// Color palette for random elements
const COLOR_PALETTE = [
	'#FF6B6B', '#4ECDC4', '#45B7D1', '#F9C74F', '#90BE6D',
	'#F94144', '#F3722C', '#F8961E', '#F9844A', '#43AA8B',
	'#277DA1', '#577590', '#4D908E', '#6A4C93', '#C77DFF',
	'#E07A5F', '#3D405B', '#81B29A', '#F2CC8F', '#D62828'
];

// Demo application class
class UI2DDemo {
	private scene: Scene;
	private view: View2D;
	private sprites: Sprite2D[] = [];
	private selectedSprite: Sprite2D | null = null;
	private hoveredSprite: Sprite2D | null = null;
	private animationId: number | null = null;
	private lastTime = 0;
	private frameCount = 0;
	private fpsTime = 0;
	
	// UI references
	private elementCountEl: HTMLElement;
	private fpsEl: HTMLElement;
	private renderTimeEl: HTMLElement;

	public constructor() {
		// Get container
		const container = document.getElementById('canvas-container');
		if (!container) {
			throw new Error('Container not found');
		}

		// Create scene
		this.scene = new Scene();

		// Create view
		const canvas = document.createElement('canvas');
		container.appendChild(canvas);
		this.view = new View2D(this.scene, undefined, canvas);
		
		// Set initial size
		this.handleResize();
		window.addEventListener('resize', () => this.handleResize());

		// Get UI elements
		this.elementCountEl = document.getElementById('element-count')!;
		this.fpsEl = document.getElementById('fps')!;
		this.renderTimeEl = document.getElementById('render-time')!;

		// Setup controls
		this.setupControls();

		// Setup scene events
		this.setupSceneEvents();

		// Setup keyboard events
		this.setupKeyboardEvents();

		// Start render loop
		this.animate();

		// Add initial elements
		this.addManyElements(20);
	}

	private setupControls(): void {
		// Element generation
		document.getElementById('add-random')!.addEventListener('click', () => {
			this.addRandomElement();
		});

		document.getElementById('add-many')!.addEventListener('click', () => {
			this.addManyElements(20);
		});

		document.getElementById('clear-all')!.addEventListener('click', () => {
			this.clearAll();
		});

		// Layout patterns
		document.getElementById('layout-grid')!.addEventListener('click', () => {
			this.layoutGrid();
		});

		document.getElementById('layout-circle')!.addEventListener('click', () => {
			this.layoutCircle();
		});

		document.getElementById('layout-cascade')!.addEventListener('click', () => {
			this.layoutCascade();
		});

		document.getElementById('layout-random')!.addEventListener('click', () => {
			this.layoutRandom();
		});

		// Animation
		document.getElementById('animate-pulse')!.addEventListener('click', () => {
			this.startPulseAnimation();
		});

		document.getElementById('animate-rotate')!.addEventListener('click', () => {
			this.startRotateAnimation();
		});

		document.getElementById('stop-animation')!.addEventListener('click', () => {
			this.stopAnimation();
		});
	}

	private setupSceneEvents(): void {
		// Listen to render events for performance monitoring
		this.scene.events.on('render:end', (data) => {
			this.renderTimeEl.textContent = data.duration.toFixed(2);
		});
	}

	private addRandomElement(x?: number, y?: number): Sprite2D {
		// More varied sizes
		const sizeOptions = [
			40,  // Small
			60,  // Medium-small
			80,  // Medium
			100, // Medium-large
			120, // Large
			Math.random() * 80 + 40, // Random between 40-120
		];
		const size = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
		
		// Occasionally make rectangles instead of squares
		const isRectangle = Math.random() > 0.7;
		const width = size;
		const height = isRectangle ? size * (0.5 + Math.random() * 1.0) : size;
		
		const sprite = new Sprite2D(width, height);
		
		// Random position if not specified
		if (x === undefined || y === undefined) {
			const bounds = this.view.getViewport();
			x = (Math.random() - 0.5) * bounds.width * 0.8;
			y = (Math.random() - 0.5) * bounds.height * 0.8;
		}
		
		sprite.position.set(x, y, Math.random() * 2); // Add slight z variation for testing

		// Random color and base style
		const color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
		
		// More varied border styles
		const borderStyles = [
			{ width: 0, color: '#ffffff', opacity: 1.0 }, // No border
			{ width: 1, color: '#ffffff', opacity: 1.0 }, // Thin white
			{ width: 2, color: '#000000', opacity: 1.0 }, // Medium black
			{ width: 3, color: '#ff0000', opacity: 1.0 }, // Medium red
			{ width: 4, color: '#0000ff', opacity: 1.0 }, // Thick blue
			{ width: 5, color: '#ffff00', opacity: 1.0 }, // Thick yellow
			{ width: 6, color: '#ff00ff', opacity: 1.0 }, // Extra thick magenta
			{ width: 2, color: color, opacity: 0.5 }, // Semi-transparent same color
			{ width: 8, color: '#ffffff', opacity: 0.3 }, // Thick semi-transparent white
			{ width: 4, color: '#000000', opacity: 0.5 }, // Medium semi-transparent black
		];
		
		const borderStyle = borderStyles[Math.floor(Math.random() * borderStyles.length)];
		
		// More varied border radius options
		const minDimension = Math.min(width, height);
		const radiusOptions = [
			0,    // Square
			4,    // Slightly rounded
			8,    // Rounded
			12,   // More rounded
			16,   // Very rounded
			24,   // Extra rounded
			minDimension / 2, // Fully round (circle/ellipse)
			Math.random() * minDimension / 3, // Random radius
		];
		
		const borderRadius = radiusOptions[Math.floor(Math.random() * radiusOptions.length)];
		
		// Store base style for the sprite - always 100% opacity
		const baseStyle = {
			backgroundColor: color,
			backgroundOpacity: 1.0,
			borderWidth: borderStyle.width,
			borderColor: borderStyle.color,
			borderOpacity: borderStyle.opacity,
			borderRadius: borderRadius
		};
		
		sprite.setStyle(baseStyle);
		sprite.userData.baseStyle = baseStyle;
		sprite.userData.name = `Sprite ${this.sprites.length + 1}`;
		
		// Apply style through material
		const material = StyleManager.getInstance().compileStyle(sprite.getStyle()!);
		sprite.material = material;

		// Mouse hover events - only change border
		sprite.events.on('hover:enter', () => {
			this.hoveredSprite = sprite;
			// Don't change hover state if this is the selected sprite
			if (sprite === this.selectedSprite) {
				return;
			}
			
			const currentStyle = sprite.getStyle()!;
			const hoverStyle = {
				...currentStyle,
				borderWidth: Math.max(currentStyle.borderWidth || 0, 3), // At least 3px for visibility
				borderColor: '#00ff88',
				borderOpacity: 1
			};
			sprite.setStyle(hoverStyle);
			const newMaterial = StyleManager.getInstance().compileStyle(hoverStyle);
			sprite.material = newMaterial;
			sprite.update(); // Force immediate update
		});

		sprite.events.on('hover:exit', () => {
			if (this.hoveredSprite === sprite) {
				this.hoveredSprite = null;
			}
			if (sprite !== this.selectedSprite) {
				sprite.setStyle(sprite.userData.baseStyle);
				sprite.material = StyleManager.getInstance().compileStyle(sprite.userData.baseStyle);
				sprite.update(); // Force immediate update
			}
		});

		// Mouse down/up events - fade effect
		sprite.events.on('mousedown', () => {
			console.log('MOUSEDOWN event fired for sprite:', sprite.userData.name);
			const currentStyle = sprite.getStyle()!;
			const pressStyle = {
				...currentStyle,
				backgroundOpacity: 0.6 // 60% opacity when pressed
			};
			console.log('Setting opacity to 0.6');
			sprite.setStyle(pressStyle);
			sprite.material = StyleManager.getInstance().compileStyle(pressStyle);
			sprite.update();
		});

		sprite.events.on('mouseup', () => {
			console.log('MOUSEUP event fired for sprite:', sprite.userData.name);
			if (sprite === this.selectedSprite) {
				// Restore to focus style
				const focusStyle = {
					...sprite.userData.baseStyle,
					borderWidth: 4,
					borderColor: '#00ccff',
					borderOpacity: 1,
					backgroundOpacity: 1 // Restore full opacity
				};
				console.log('Restoring to focus style with opacity 1');
				sprite.setStyle(focusStyle);
				sprite.material = StyleManager.getInstance().compileStyle(focusStyle);
			} else if (sprite === this.hoveredSprite) {
				// Restore to hover style
				const hoverStyle = {
					...sprite.userData.baseStyle,
					borderWidth: Math.max(sprite.userData.baseStyle.borderWidth || 0, 3),
					borderColor: '#00ff88',
					borderOpacity: 1
				};
				console.log('Restoring to hover style with opacity 1');
				sprite.setStyle(hoverStyle);
				sprite.material = StyleManager.getInstance().compileStyle(hoverStyle);
			} else {
				// Restore to base style
				console.log('Restoring to base style with opacity 1');
				sprite.setStyle(sprite.userData.baseStyle);
				sprite.material = StyleManager.getInstance().compileStyle(sprite.userData.baseStyle);
			}
			sprite.update();
		});

		// Click event - focus selection
		sprite.events.on('click', () => {
			this.selectSprite(sprite);
		});

		// Focus/blur events
		sprite.events.on('focus', () => {
			console.log(`Sprite focused at position (${sprite.position.x.toFixed(1)}, ${sprite.position.y.toFixed(1)})`);
			const focusStyle = {
				...sprite.userData.baseStyle,
				borderWidth: 4,
				borderColor: '#00ccff',
				borderOpacity: 1,
				backgroundOpacity: 1
			};
			sprite.setStyle(focusStyle);
			sprite.material = StyleManager.getInstance().compileStyle(focusStyle);
			sprite.update();
		});

		sprite.events.on('blur', () => {
			console.log(`Sprite blurred at position (${sprite.position.x.toFixed(1)}, ${sprite.position.y.toFixed(1)})`);
			sprite.setStyle(sprite.userData.baseStyle);
			sprite.material = StyleManager.getInstance().compileStyle(sprite.userData.baseStyle);
			sprite.update();
		});

		this.scene.add(sprite);
		this.sprites.push(sprite);
		this.updateStats();

		return sprite;
	}

	private addManyElements(count: number): void {
		for (let i = 0; i < count; i++) {
			this.addRandomElement();
		}
		
		// Position them relative to each other
		this.positionRelativeToEdges();
	}

	private positionRelativeToEdges(): void {
		if (this.sprites.length < 2) {
			return;
		}

		// Position elements relative to each other's edges
		for (let i = 1; i < this.sprites.length; i++) {
			const target = this.sprites[i - 1];
			const current = this.sprites[i];
			
			// Random edge attachment
			const edge = Math.floor(Math.random() * 4);
			const offset = 10;
			
			switch (edge) {
			case 0: // Right
				current.position.x = target.position.x + target.size.x / 2 + current.size.x / 2 + offset;
				current.position.y = target.position.y + (Math.random() - 0.5) * target.size.y;
				break;
			case 1: // Bottom
				current.position.x = target.position.x + (Math.random() - 0.5) * target.size.x;
				current.position.y = target.position.y - target.size.y / 2 - current.size.y / 2 - offset;
				break;
			case 2: // Left
				current.position.x = target.position.x - target.size.x / 2 - current.size.x / 2 - offset;
				current.position.y = target.position.y + (Math.random() - 0.5) * target.size.y;
				break;
			case 3: // Top
				current.position.x = target.position.x + (Math.random() - 0.5) * target.size.x;
				current.position.y = target.position.y + target.size.y / 2 + current.size.y / 2 + offset;
				break;
			}
		}
	}

	private selectSprite(sprite: Sprite2D | null): void {
		// Blur previous selection
		if (this.selectedSprite) {
			this.selectedSprite.events.emitEvent('blur', { sprite: this.selectedSprite });
		}
		
		this.selectedSprite = sprite;
		
		// Update UI
		const selectedInfo = document.getElementById('selected-info')!;
		const selectedPos = document.getElementById('selected-pos')!;
		
		if (sprite) {
			sprite.events.emitEvent('focus', { sprite });
			selectedInfo.style.display = 'block';
			selectedPos.textContent = `(${sprite.position.x.toFixed(1)}, ${sprite.position.y.toFixed(1)})`;
		} else {
			selectedInfo.style.display = 'none';
		}
	}

	private setupKeyboardEvents(): void {
		window.addEventListener('keydown', (event) => {
			if (!this.selectedSprite) {
				return;
			}
			
			console.log(`Key pressed: ${event.key} (code: ${event.code})`);
			
			// Visual feedback for key press
			const currentStyle = this.selectedSprite.getStyle()!;
			
			switch(event.key) {
			case 'ArrowUp':
				event.preventDefault();
				this.selectedSprite.position.y += 10;
				this.flashSprite(this.selectedSprite, '#00ff00');
				this.updateSelectedPosition();
				break;
			case 'ArrowDown': 
				event.preventDefault();
				this.selectedSprite.position.y -= 10;
				this.flashSprite(this.selectedSprite, '#ff0000');
				this.updateSelectedPosition();
				break;
			case 'ArrowLeft':
				event.preventDefault();
				this.selectedSprite.position.x -= 10;
				this.flashSprite(this.selectedSprite, '#0000ff');
				this.updateSelectedPosition();
				break;
			case 'ArrowRight':
				event.preventDefault();
				this.selectedSprite.position.x += 10;
				this.flashSprite(this.selectedSprite, '#ffff00');
				this.updateSelectedPosition();
				break;
			case ' ':
				event.preventDefault();
				// Rotate sprite
				this.selectedSprite.rotation.z += Math.PI / 4;
				this.flashSprite(this.selectedSprite, '#ff00ff');
				break;
			case 'Delete':
			case 'Backspace':
				event.preventDefault();
				// Remove selected sprite
				const index = this.sprites.indexOf(this.selectedSprite);
				if (index > -1) {
					this.sprites.splice(index, 1);
					this.scene.remove(this.selectedSprite);
					this.selectedSprite.destroy();
					this.selectedSprite = null;
					this.updateStats();
				}
				break;
			default:
				// Flash white for any other key
				this.flashSprite(this.selectedSprite, '#ffffff');
			}
		});
		
		window.addEventListener('keyup', (event) => {
			if (!this.selectedSprite) {
				return;
			}
			
			// Restore focus style after key release
			this.selectedSprite.setStyle({
				...this.selectedSprite.userData.baseStyle,
				borderWidth: 4,
				borderColor: '#00ccff',
				borderOpacity: 1,
				backgroundOpacity: 1
			});
			this.selectedSprite.material = StyleManager.getInstance().compileStyle(this.selectedSprite.getStyle()!);
		});
		
		// Handle click on empty space to deselect
		// We need to check if a sprite was clicked after View2D processes the event
		this.view.canvas.addEventListener('click', (event) => {
			// Use a small timeout to let View2D process the click first
			setTimeout(() => {
				// If no sprite handled the click, clear selection
				if (!event.defaultPrevented) {
					// Check if we clicked on empty space by seeing if any sprite was under the cursor
					const rect = this.view.canvas.getBoundingClientRect();
					const x = event.clientX;
					const y = event.clientY;
					
					// Use View2D's sprite detection (via reflection since it's private)
					const viewAny = this.view as any;
					if (viewAny.getSpriteAtPosition) {
						const sprite = viewAny.getSpriteAtPosition(x, y);
						if (!sprite) {
							this.selectSprite(null);
						}
					}
				}
			}, 0);
		});
	}

	private flashSprite(sprite: Sprite2D, color: string): void {
		sprite.setStyle({
			...sprite.getStyle()!,
			backgroundColor: color,
			backgroundOpacity: 1,
			borderWidth: 6,
			borderColor: color,
			borderOpacity: 1
		});
		sprite.material = StyleManager.getInstance().compileStyle(sprite.getStyle()!);
	}

	private updateSelectedPosition(): void {
		if (this.selectedSprite) {
			const selectedPos = document.getElementById('selected-pos')!;
			selectedPos.textContent = `(${this.selectedSprite.position.x.toFixed(1)}, ${this.selectedSprite.position.y.toFixed(1)})`;
		}
	}

	private clearAll(): void {
		this.sprites.forEach(sprite => {
			this.scene.remove(sprite);
			sprite.destroy();
		});
		this.sprites = [];
		this.selectedSprite = null;
		this.updateStats();
		StyleManager.getInstance().clearCache();
	}

	private layoutGrid(): void {
		const cols = Math.ceil(Math.sqrt(this.sprites.length));
		const spacing = 100;
		const startX = -(cols - 1) * spacing / 2;
		const startY = -(Math.ceil(this.sprites.length / cols) - 1) * spacing / 2;

		this.sprites.forEach((sprite, i) => {
			const col = i % cols;
			const row = Math.floor(i / cols);
			sprite.position.set(
				startX + col * spacing,
				startY + row * spacing,
				0
			);
		});
	}

	private layoutCircle(): void {
		const radius = Math.min(this.view.getViewport().width, this.view.getViewport().height) * 0.3;
		const angleStep = (Math.PI * 2) / this.sprites.length;

		this.sprites.forEach((sprite, i) => {
			const angle = i * angleStep;
			sprite.position.set(
				Math.cos(angle) * radius,
				Math.sin(angle) * radius,
				0
			);
		});
	}

	private layoutCascade(): void {
		const offsetX = 30;
		const offsetY = 30;
		const startX = -this.sprites.length * offsetX / 2;
		const startY = this.sprites.length * offsetY / 2;

		this.sprites.forEach((sprite, i) => {
			sprite.position.set(
				startX + i * offsetX,
				startY - i * offsetY,
				i * 0.1 // Slight z-offset for layering
			);
		});
	}

	private layoutRandom(): void {
		const bounds = this.view.getViewport();
		this.sprites.forEach(sprite => {
			sprite.position.set(
				(Math.random() - 0.5) * bounds.width * 0.8,
				(Math.random() - 0.5) * bounds.height * 0.8,
				0
			);
		});
	}

	private startPulseAnimation(): void {
		this.stopAnimation();
		
		const startTime = performance.now();
		const animate = () => {
			const elapsed = performance.now() - startTime;
			const scale = 1 + Math.sin(elapsed * 0.003) * 0.1;
			
			this.sprites.forEach((sprite, i) => {
				const delay = i * 50;
				const localScale = 1 + Math.sin((elapsed - delay) * 0.003) * 0.1;
				sprite.scale.set(localScale, localScale, 1);
			});
			
			this.animationId = requestAnimationFrame(animate);
		};
		
		animate();
	}

	private startRotateAnimation(): void {
		this.stopAnimation();
		
		const startTime = performance.now();
		const centerX = 0;
		const centerY = 0;
		
		const animate = () => {
			const elapsed = performance.now() - startTime;
			const angle = elapsed * 0.0005;
			
			this.sprites.forEach((sprite, i) => {
				const dx = sprite.position.x - centerX;
				const dy = sprite.position.y - centerY;
				const distance = Math.sqrt(dx * dx + dy * dy);
				const currentAngle = Math.atan2(dy, dx);
				
				sprite.position.x = centerX + Math.cos(currentAngle + angle) * distance;
				sprite.position.y = centerY + Math.sin(currentAngle + angle) * distance;
				sprite.rotation.z = angle * 2;
			});
			
			this.animationId = requestAnimationFrame(animate);
		};
		
		animate();
	}

	private stopAnimation(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
		
		// Reset transforms
		this.sprites.forEach(sprite => {
			sprite.scale.set(1, 1, 1);
			sprite.rotation.z = 0;
		});
	}

	private updateStats(): void {
		this.elementCountEl.textContent = this.sprites.length.toString();
	}

	private handleResize(): void {
		const container = document.getElementById('canvas-container')!;
		const width = container.clientWidth;
		const height = container.clientHeight;
		this.view.resize(width, height);
	}

	private animate(): void {
		requestAnimationFrame(() => this.animate());

		const currentTime = performance.now();
		const deltaTime = currentTime - this.lastTime;
		this.lastTime = currentTime;

		// Update FPS
		this.frameCount++;
		if (currentTime - this.fpsTime > 1000) {
			this.fpsEl.textContent = this.frameCount.toString();
			this.frameCount = 0;
			this.fpsTime = currentTime;
		}

		// Flush any pending updates before render
		this.scene.flushUpdates();
		
		// Render
		this.scene.renderAllViews();
	}
}

// Initialize demo when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => new UI2DDemo());
} else {
	new UI2DDemo();
}