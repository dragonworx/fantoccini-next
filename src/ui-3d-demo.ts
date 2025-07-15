import * as THREE from 'three';
import { 
	Scene, 
	View3D, 
	Sprite3D,
	PhysicalMaterial
} from './ui-system';

// Material presets
const MATERIAL_PRESETS = {
	red: { color: 0xff0000, metalness: 0.3, roughness: 0.4 },
	green: { color: 0x00ff00, metalness: 0.3, roughness: 0.4 },
	blue: { color: 0x0000ff, metalness: 0.3, roughness: 0.4 },
	gold: { color: 0xffd700, metalness: 0.8, roughness: 0.2 },
	silver: { color: 0xc0c0c0, metalness: 0.9, roughness: 0.1 },
	glass: { color: 0xffffff, metalness: 0, roughness: 0, transmission: 0.9, ior: 1.5 },
	plastic: { color: 0xff6b6b, metalness: 0, roughness: 0.5 },
	rubber: { color: 0x333333, metalness: 0, roughness: 0.9 }
};

// Animation types
enum AnimationType {
	Rotate = 'rotate',
	Bounce = 'bounce',
	Orbit = 'orbit',
	Wave = 'wave'
}

// Demo application class
class UI3DDemo {
	private scene: Scene;
	private view: View3D;
	private sprites: Sprite3D[] = [];
	private selectedSprite: Sprite3D | null = null;
	private animationSpeed = 1.0;
	private activeAnimation: AnimationType = AnimationType.Rotate;
	private gridHelper: THREE.GridHelper;
	private axesHelper: THREE.AxesHelper;
	private lights: THREE.Light[] = [];
	private raycaster = new THREE.Raycaster();
	private mouse = new THREE.Vector2();
	
	// Animation state
	private animationTime = 0;
	private lastTime = 0;
	private frameCount = 0;
	private fpsTime = 0;
	
	// UI references
	private objectCountEl: HTMLElement;
	private fpsEl: HTMLElement;
	private renderTimeEl: HTMLElement;
	private speedSlider: HTMLInputElement;
	private speedValueEl: HTMLElement;
	private selectedInfoEl: HTMLElement;

	public constructor() {
		// Get container
		const container = document.getElementById('canvas-container');
		if (!container) throw new Error('Container not found');

		// Create scene
		this.scene = new Scene();
		this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 100);

		// Create view
		const canvas = document.createElement('canvas');
		container.appendChild(canvas);
		this.view = new View3D(this.scene, undefined, canvas);
		
		// Set initial size
		this.handleResize();
		window.addEventListener('resize', () => this.handleResize());

		// Setup lighting
		this.setupLighting();

		// Setup helpers
		this.setupHelpers();

		// Get UI elements
		this.objectCountEl = document.getElementById('object-count')!;
		this.fpsEl = document.getElementById('fps')!;
		this.renderTimeEl = document.getElementById('render-time')!;
		this.speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
		this.speedValueEl = document.getElementById('speed-value')!;
		this.selectedInfoEl = document.getElementById('selected-info')!;

		// Setup controls
		this.setupControls();

		// Setup mouse events
		this.setupMouseEvents();

		// Setup scene events
		this.setupSceneEvents();

		// Start render loop
		this.animate();

		// Add initial objects
		this.addManyRandomObjects(10);
	}

	private setupLighting(): void {
		// Ambient light
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
		this.scene.add(ambientLight);
		this.lights.push(ambientLight);

		// Main directional light
		const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
		dirLight.position.set(5, 10, 5);
		dirLight.castShadow = true;
		dirLight.shadow.camera.left = -10;
		dirLight.shadow.camera.right = 10;
		dirLight.shadow.camera.top = 10;
		dirLight.shadow.camera.bottom = -10;
		dirLight.shadow.camera.near = 0.1;
		dirLight.shadow.camera.far = 50;
		dirLight.shadow.mapSize.width = 2048;
		dirLight.shadow.mapSize.height = 2048;
		this.scene.add(dirLight);
		this.lights.push(dirLight);

		// Fill light
		const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
		fillLight.position.set(-5, 5, -5);
		this.scene.add(fillLight);
		this.lights.push(fillLight);

		// Point light for interest
		const pointLight = new THREE.PointLight(0xff8844, 0.5, 20);
		pointLight.position.set(0, 5, 0);
		this.scene.add(pointLight);
		this.lights.push(pointLight);
	}

	private setupHelpers(): void {
		// Grid helper
		this.gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
		this.scene.add(this.gridHelper);

		// Axes helper
		this.axesHelper = new THREE.AxesHelper(5);
		this.scene.add(this.axesHelper);
	}

	private setupControls(): void {
		// Object creation
		document.getElementById('add-cube')!.addEventListener('click', () => {
			this.addCube();
		});

		document.getElementById('add-sphere')!.addEventListener('click', () => {
			this.addSphere();
		});

		document.getElementById('add-torus')!.addEventListener('click', () => {
			this.addTorus();
		});

		document.getElementById('add-many')!.addEventListener('click', () => {
			this.addManyRandomObjects(20);
		});

		document.getElementById('clear-all')!.addEventListener('click', () => {
			this.clearAll();
		});

		// Animations
		const animButtons = {
			'anim-rotate': AnimationType.Rotate,
			'anim-bounce': AnimationType.Bounce,
			'anim-orbit': AnimationType.Orbit,
			'anim-wave': AnimationType.Wave
		};

		Object.entries(animButtons).forEach(([id, type]) => {
			const button = document.getElementById(id)!;
			button.addEventListener('click', () => {
				this.setAnimation(type);
				// Update button states
				document.querySelectorAll('.controls button').forEach(btn => {
					btn.classList.remove('active');
				});
				button.classList.add('active');
			});
		});

		document.getElementById('stop-animation')!.addEventListener('click', () => {
			this.activeAnimation = null as any;
			document.querySelectorAll('.controls button').forEach(btn => {
				btn.classList.remove('active');
			});
		});

		// Helpers
		document.getElementById('toggle-grid')!.addEventListener('click', () => {
			this.gridHelper.visible = !this.gridHelper.visible;
		});

		document.getElementById('toggle-axes')!.addEventListener('click', () => {
			this.axesHelper.visible = !this.axesHelper.visible;
		});

		document.getElementById('toggle-shadows')!.addEventListener('click', () => {
			this.view.getRenderer().shadowMap.enabled = !this.view.getRenderer().shadowMap.enabled;
			this.sprites.forEach(sprite => {
				sprite.setCastShadow(this.view.getRenderer().shadowMap.enabled);
				sprite.setReceiveShadow(this.view.getRenderer().shadowMap.enabled);
			});
		});

		// Speed control
		this.speedSlider.addEventListener('input', () => {
			this.animationSpeed = parseFloat(this.speedSlider.value) / 100;
			this.speedValueEl.textContent = `${this.speedSlider.value}%`;
		});
	}

	private setupMouseEvents(): void {
		const canvas = this.view.canvas;

		canvas.addEventListener('click', (event) => {
			const rect = canvas.getBoundingClientRect();
			this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

			this.raycaster.setFromCamera(this.mouse, this.view.camera);

			// Check for intersections with sprites
			const meshes = this.sprites.map(s => s.mesh);
			const intersects = this.raycaster.intersectObjects(meshes);

			if (intersects.length > 0) {
				const mesh = intersects[0].object;
				const sprite = this.sprites.find(s => s.mesh === mesh);
				if (sprite) {
					this.selectSprite(sprite);
				}
			} else {
				this.selectSprite(null);
			}
		});
	}

	private setupSceneEvents(): void {
		// Listen to render events for performance monitoring
		this.scene.events.on('render:end', (data) => {
			this.renderTimeEl.textContent = data.duration.toFixed(2);
		});
	}

	private addCube(): Sprite3D {
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = this.getRandomMaterial();
		const sprite = new Sprite3D(geometry, material);
		
		this.positionRandomly(sprite);
		this.setupSpriteInteraction(sprite);
		
		this.scene.add(sprite);
		this.sprites.push(sprite);
		this.updateStats();
		
		return sprite;
	}

	private addSphere(): Sprite3D {
		const geometry = new THREE.SphereGeometry(0.5, 32, 16);
		const material = this.getRandomMaterial();
		const sprite = new Sprite3D(geometry, material);
		
		this.positionRandomly(sprite);
		this.setupSpriteInteraction(sprite);
		
		this.scene.add(sprite);
		this.sprites.push(sprite);
		this.updateStats();
		
		return sprite;
	}

	private addTorus(): Sprite3D {
		const geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32);
		const material = this.getRandomMaterial();
		const sprite = new Sprite3D(geometry, material);
		
		this.positionRandomly(sprite);
		this.setupSpriteInteraction(sprite);
		
		this.scene.add(sprite);
		this.sprites.push(sprite);
		this.updateStats();
		
		return sprite;
	}

	private addManyRandomObjects(count: number): void {
		for (let i = 0; i < count; i++) {
			const type = Math.floor(Math.random() * 3);
			switch (type) {
				case 0:
					this.addCube();
					break;
				case 1:
					this.addSphere();
					break;
				case 2:
					this.addTorus();
					break;
			}
		}
	}

	private getRandomMaterial(): PhysicalMaterial {
		const presets = Object.values(MATERIAL_PRESETS);
		const preset = presets[Math.floor(Math.random() * presets.length)];
		return new PhysicalMaterial(preset);
	}

	private positionRandomly(sprite: Sprite3D): void {
		sprite.position.set(
			(Math.random() - 0.5) * 10,
			Math.random() * 3 + 0.5,
			(Math.random() - 0.5) * 10
		);
		sprite.rotation.set(
			Math.random() * Math.PI,
			Math.random() * Math.PI,
			Math.random() * Math.PI
		);
		const scale = 0.5 + Math.random() * 1.5;
		sprite.scale.set(scale, scale, scale);
	}

	private setupSpriteInteraction(sprite: Sprite3D): void {
		sprite.setCastShadow(true);
		sprite.setReceiveShadow(true);

		sprite.events.on('hover:enter', () => {
			if (sprite !== this.selectedSprite) {
				sprite.scale.multiplyScalar(1.1);
			}
		});

		sprite.events.on('hover:exit', () => {
			if (sprite !== this.selectedSprite) {
				sprite.scale.divideScalar(1.1);
			}
		});
	}

	private selectSprite(sprite: Sprite3D | null): void {
		// Deselect previous
		if (this.selectedSprite) {
			this.selectedSprite.scale.divideScalar(1.2);
		}

		this.selectedSprite = sprite;

		if (sprite) {
			sprite.scale.multiplyScalar(1.2);
			
			// Update info panel
			this.selectedInfoEl.classList.remove('hidden');
			document.getElementById('selected-type')!.textContent = sprite.geometry.type;
			document.getElementById('selected-pos')!.textContent = 
				`${sprite.position.x.toFixed(1)}, ${sprite.position.y.toFixed(1)}, ${sprite.position.z.toFixed(1)}`;
			document.getElementById('selected-mat')!.textContent = sprite.material?.constructor.name || 'None';
		} else {
			this.selectedInfoEl.classList.add('hidden');
		}
	}

	private clearAll(): void {
		this.sprites.forEach(sprite => {
			this.scene.remove(sprite);
			sprite.destroy();
		});
		this.sprites = [];
		this.selectedSprite = null;
		this.selectedInfoEl.classList.add('hidden');
		this.updateStats();
	}

	private setAnimation(type: AnimationType): void {
		this.activeAnimation = type;
	}

	private updateAnimations(deltaTime: number): void {
		if (!this.activeAnimation) return;

		this.animationTime += deltaTime * this.animationSpeed;

		switch (this.activeAnimation) {
			case AnimationType.Rotate:
				this.animateRotate();
				break;
			case AnimationType.Bounce:
				this.animateBounce();
				break;
			case AnimationType.Orbit:
				this.animateOrbit();
				break;
			case AnimationType.Wave:
				this.animateWave();
				break;
		}
	}

	private animateRotate(): void {
		this.sprites.forEach((sprite, i) => {
			sprite.rotation.x += 0.01 * this.animationSpeed;
			sprite.rotation.y += 0.015 * this.animationSpeed;
			sprite.rotation.z += 0.005 * this.animationSpeed;
		});
	}

	private animateBounce(): void {
		this.sprites.forEach((sprite, i) => {
			const offset = i * 0.5;
			const bounce = Math.abs(Math.sin(this.animationTime * 0.003 + offset)) * 2;
			sprite.position.y = bounce + 0.5;
		});
	}

	private animateOrbit(): void {
		const centerX = 0;
		const centerZ = 0;
		
		this.sprites.forEach((sprite, i) => {
			const angle = (i / this.sprites.length) * Math.PI * 2 + this.animationTime * 0.001;
			const radius = 5;
			sprite.position.x = centerX + Math.cos(angle) * radius;
			sprite.position.z = centerZ + Math.sin(angle) * radius;
			sprite.position.y = Math.sin(this.animationTime * 0.002 + i) + 2;
		});
	}

	private animateWave(): void {
		this.sprites.forEach((sprite, i) => {
			const x = sprite.position.x;
			const z = sprite.position.z;
			const distance = Math.sqrt(x * x + z * z);
			const wave = Math.sin(distance - this.animationTime * 0.005) * 0.5;
			sprite.position.y = wave + 2;
			
			// Also rotate based on wave
			sprite.rotation.x = wave * 0.2;
			sprite.rotation.z = wave * 0.2;
		});
	}

	private updateStats(): void {
		this.objectCountEl.textContent = this.sprites.length.toString();
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

		// Update animations
		this.updateAnimations(deltaTime);

		// Update sprites that have animations
		this.sprites.forEach(sprite => {
			sprite.updateAnimations(deltaTime / 1000);
		});

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
	document.addEventListener('DOMContentLoaded', () => new UI3DDemo());
} else {
	new UI3DDemo();
}