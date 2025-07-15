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
		if (!container) throw new Error('Container not found');

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
			this.addManyElements(50);
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
		const size = 40 + Math.random() * 80;
		const sprite = new Sprite2D(size, size);
		
		// Random position if not specified
		if (x === undefined || y === undefined) {
			const bounds = this.view.getViewport();
			x = (Math.random() - 0.5) * bounds.width * 0.8;
			y = (Math.random() - 0.5) * bounds.height * 0.8;
		}
		
		sprite.position.set(x, y, 0);

		// Random color and style
		const color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
		const hasBorder = Math.random() > 0.5;
		const borderRadius = Math.random() > 0.7 ? Math.random() * 20 : 0;
		
		sprite.setStyle({
			backgroundColor: color,
			backgroundOpacity: 0.8 + Math.random() * 0.2,
			borderWidth: hasBorder ? 2 + Math.random() * 3 : 0,
			borderColor: '#ffffff',
			borderOpacity: 0.8,
			borderRadius: borderRadius
		});

		// Apply style through material
		const material = StyleManager.getInstance().compileStyle(sprite.getStyle()!);
		sprite.material = material;

		// Add hover interaction
		sprite.events.on('hover:enter', () => {
			sprite.scale.set(1.1, 1.1, 1);
		});

		sprite.events.on('hover:exit', () => {
			sprite.scale.set(1, 1, 1);
		});

		sprite.events.on('click', () => {
			const newColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
			sprite.setStyle({
				...sprite.getStyle()!,
				backgroundColor: newColor
			});
			sprite.material = StyleManager.getInstance().compileStyle(sprite.getStyle()!);
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
		if (this.sprites.length < 2) return;

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

	private clearAll(): void {
		this.sprites.forEach(sprite => {
			this.scene.remove(sprite);
			sprite.destroy();
		});
		this.sprites = [];
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
		const width = window.innerWidth;
		const height = window.innerHeight;
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