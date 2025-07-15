/**
 * Base Element class for UI components
 * @namespace core.ui
 * @memberof core.ui
 */

import * as THREE from 'three';
import { EventEmitter } from '../../event-emitter';
import type { 
	IGeometry, 
	IAppearance, 
	ILayout, 
	IElementConfig,
	DirtyFlags 
} from '../types';
import { DirtyFlags as DirtyFlagsEnum } from '../types';
import type { Container } from './container';
import type { View } from '../view';

/**
 * Base building block of the UI system
 * @memberof core.ui
 */
export class Element extends EventEmitter {
	// Core properties
	public id: string;
	public parent: Container | null = null;
	public view: View | null = null;

	// State
	public visible: boolean = true;
	public interactive: boolean = true;

	// Dirty tracking
	public dirtyFlags: DirtyFlags = DirtyFlagsEnum.All;

	// Property storage
	protected _geometry: IGeometry = {
		left: 0,
		top: 0,
		width: 100,
		height: 100
	};

	protected _appearance: IAppearance = {
		alpha: 1,
		backgroundColor: 0xFFFFFF,
		borderColor: 0x000000,
		borderWidth: 0,
		borderRadius: 0
	};

	protected _layout: ILayout = {
		paddingLeft: 0,
		paddingRight: 0,
		paddingTop: 0,
		paddingBottom: 0,
		marginLeft: 0,
		marginRight: 0,
		marginTop: 0,
		marginBottom: 0,
		hAlign: 'left',
		vAlign: 'top'
	};

	// Three.js objects
	protected mesh: THREE.Mesh | null = null;
	protected material: THREE.MeshBasicMaterial | null = null;
	protected planeGeometry: THREE.PlaneGeometry | null = null;

	// Computed bounds cache
	protected _globalBounds: THREE.Box2 | null = null;

	/**
	 * Creates a new Element
	 */
	public constructor(config?: IElementConfig) {
		super();
		
		this.id = config?.id || `element-${Math.random().toString(36).substr(2, 9)}`;
		
		if (config) {
			if (config.visible !== undefined) {
				this.visible = config.visible;
			}
			if (config.interactive !== undefined) {
				this.interactive = config.interactive;
			}
			
			// Handle common shorthand properties
			if ('x' in config) {
				this._geometry.left = config.x as number;
			}
			if ('y' in config) {
				this._geometry.top = config.y as number;
			}
			if ('width' in config) {
				this._geometry.width = config.width as number;
			}
			if ('height' in config) {
				this._geometry.height = config.height as number;
			}
			if ('backgroundColor' in config) {
				this._appearance.backgroundColor = this.parseColor(config.backgroundColor as string | number);
			}
			if ('alpha' in config || 'opacity' in config) {
				this._appearance.alpha = (config.alpha ?? config.opacity) as number;
			}
			
			// Handle structured properties
			if (config.geometry) {
				Object.assign(this._geometry, config.geometry);
			}
			if (config.appearance) {
				Object.assign(this._appearance, config.appearance);
			}
			if (config.layout) {
				Object.assign(this._layout, config.layout);
			}
		}
	}

	/**
	 * Get geometry properties
	 */
	public getGeometry(): IGeometry {
		return { ...this._geometry };
	}

	/**
	 * Set geometry properties
	 */
	public setGeometry(value: Partial<IGeometry>): void {
		const changed = Object.keys(value).some(key => {
			const k = key as keyof IGeometry;
			return this._geometry[k] !== value[k];
		});

		if (changed) {
			Object.assign(this._geometry, value);
			this.markDirty(DirtyFlagsEnum.Geometry | DirtyFlagsEnum.Transform);
			this._globalBounds = null;
		}
	}

	/**
	 * Get appearance properties
	 */
	public getAppearance(): IAppearance {
		return { ...this._appearance };
	}

	/**
	 * Set appearance properties
	 */
	public setAppearance(value: Partial<IAppearance>): void {
		const changed = Object.keys(value).some(key => {
			const k = key as keyof IAppearance;
			return this._appearance[k] !== value[k];
		});

		if (changed) {
			Object.assign(this._appearance, value);
			this.markDirty(DirtyFlagsEnum.Appearance);
		}
	}

	/**
	 * Get layout properties
	 */
	public getLayout(): ILayout {
		return { ...this._layout };
	}

	/**
	 * Set layout properties
	 */
	public setLayout(value: Partial<ILayout>): void {
		const changed = Object.keys(value).some(key => {
			const k = key as keyof ILayout;
			return this._layout[k] !== value[k];
		});

		if (changed) {
			Object.assign(this._layout, value);
			this.markDirty(DirtyFlagsEnum.Layout);
			if (this.parent) {
				this.parent.markDirty(DirtyFlagsEnum.Layout);
			}
		}
	}

	// Property accessors for convenience
	public get geometry(): IGeometry {
		return this.getGeometry(); 
	}
	public set geometry(value: Partial<IGeometry>) {
		this.setGeometry(value); 
	}
	
	public get appearance(): IAppearance {
		return this.getAppearance(); 
	}
	public set appearance(value: Partial<IAppearance>) {
		this.setAppearance(value); 
	}
	
	public get layout(): ILayout {
		return this.getLayout(); 
	}
	public set layout(value: Partial<ILayout>) {
		this.setLayout(value); 
	}

	/**
	 * Mark element as dirty
	 */
	public markDirty(flags: DirtyFlags): void {
		this.dirtyFlags |= flags;
		
		// Notify view if attached
		if (this.view) {
			this.view.markDirty(this, flags);
		}
		
		// Propagate to parent for layout changes
		if ((flags & DirtyFlagsEnum.Layout) && this.parent) {
			this.parent.markDirty(DirtyFlagsEnum.Layout);
		}
	}

	/**
	 * Clear dirty flags
	 */
	public clearDirty(flags: DirtyFlags): void {
		this.dirtyFlags &= ~flags;
	}

	/**
	 * Check if element is dirty
	 */
	public isDirty(flags?: DirtyFlags): boolean {
		if (flags === undefined) {
			return this.dirtyFlags !== DirtyFlagsEnum.None;
		}
		return (this.dirtyFlags & flags) !== 0;
	}

	/**
	 * Get global bounds of element
	 */
	public getGlobalBounds(): THREE.Box2 {
		if (!this._globalBounds || this.isDirty(DirtyFlagsEnum.Geometry | DirtyFlagsEnum.Transform)) {
			this._globalBounds = new THREE.Box2();
			
			let x = this._geometry.left;
			let y = this._geometry.top;
			
			// Add parent offsets
			let parent = this.parent;
			while (parent) {
				x += parent._geometry.left;
				y += parent._geometry.top;
				parent = parent.parent;
			}
			
			this._globalBounds.min.set(x, y);
			this._globalBounds.max.set(x + this._geometry.width, y + this._geometry.height);
		}
		
		return this._globalBounds.clone();
	}

	/**
	 * Hit test point against element
	 */
	public hitTest(x: number, y: number): boolean {
		if (!this.visible || !this.interactive) {
			return false;
		}
		
		const bounds = this.getGlobalBounds();
		return x >= bounds.min.x && x <= bounds.max.x &&
		       y >= bounds.min.y && y <= bounds.max.y;
	}

	/**
	 * Mount element
	 */
	public mount(): void {
		this.createThreeObjects();
		this.updateThreeObjects();
		this.emit('mount');
		// Element mounted successfully
	}

	/**
	 * Unmount element
	 */
	public unmount(): void {
		this.destroyThreeObjects();
		this.emit('unmount');
	}

	/**
	 * Update element
	 */
	public update(): void {
		if (!this.isDirty()) {
			return;
		}
		
		if (this.isDirty(DirtyFlagsEnum.Geometry | DirtyFlagsEnum.Transform)) {
			this.updateTransform();
		}
		
		if (this.isDirty(DirtyFlagsEnum.Appearance)) {
			this.updateAppearance();
		}
		
		this.clearDirty(DirtyFlagsEnum.All);
	}

	/**
	 * Create Three.js objects
	 */
	protected createThreeObjects(): void {
		// Create geometry
		this.planeGeometry = new THREE.PlaneGeometry(1, 1);
		
		// Create material
		this.material = new THREE.MeshBasicMaterial({
			color: new THREE.Color(this._appearance.backgroundColor),
			transparent: this._appearance.alpha < 1,
			opacity: this._appearance.alpha,
			side: THREE.DoubleSide
		});
		
		// Create mesh
		this.mesh = new THREE.Mesh(this.planeGeometry, this.material);
		this.mesh.userData.element = this;
		
		// Initial transform
		this.updateTransform();
	}

	/**
	 * Update Three.js transform
	 */
	protected updateTransform(): void {
		if (!this.mesh) {
			return;
		}
		
		// Calculate global position
		const x = this._geometry.left + this._geometry.width / 2;
		const y = this._geometry.top + this._geometry.height / 2;
		
		// Position in Three.js coordinate system (Y-up in Three.js, but we're using inverted camera)
		this.mesh.position.set(x, y, 0);
		
		// Scale to match element size
		this.mesh.scale.set(this._geometry.width, this._geometry.height, 1);
		
		// Transform updated
		
		this.clearDirty(DirtyFlagsEnum.Geometry | DirtyFlagsEnum.Transform);
	}

	/**
	 * Update Three.js appearance
	 */
	protected updateAppearance(): void {
		if (!this.material) {
			return;
		}
		
		this.material.color.setHex(this._appearance.backgroundColor);
		this.material.opacity = this._appearance.alpha;
		this.material.transparent = this._appearance.alpha < 1;
		this.material.needsUpdate = true;
		
		this.clearDirty(DirtyFlagsEnum.Appearance);
	}

	/**
	 * Update all Three.js objects
	 */
	protected updateThreeObjects(): void {
		this.updateTransform();
		this.updateAppearance();
		
		if (this.mesh) {
			this.mesh.visible = this.visible;
		}
	}

	/**
	 * Destroy Three.js objects
	 */
	protected destroyThreeObjects(): void {
		if (this.planeGeometry) {
			this.planeGeometry.dispose();
			this.planeGeometry = null;
		}
		
		if (this.material) {
			this.material.dispose();
			this.material = null;
		}
		
		this.mesh = null;
	}

	/**
	 * Get Three.js mesh
	 */
	public getMesh(): THREE.Mesh | null {
		return this.mesh;
	}

	/**
	 * Parse color from string or number
	 */
	protected parseColor(color: string | number): number {
		if (typeof color === 'number') {
			return color;
		}
		
		// Handle hex strings
		if (color.startsWith('#')) {
			return parseInt(color.replace('#', ''), 16);
		}
		
		// Handle rgb/rgba
		if (color.startsWith('rgb')) {
			const matches = color.match(/\d+/g);
			if (matches && matches.length >= 3) {
				const r = parseInt(matches[0]);
				const g = parseInt(matches[1]);
				const b = parseInt(matches[2]);
				return (r << 16) | (g << 8) | b;
			}
		}
		
		// Default to white
		return 0xFFFFFF;
	}

	/**
	 * Destroy element
	 */
	public destroy(): void {
		this.unmount();
		this.removeAllListeners();
		this.parent = null;
		this.view = null;
	}
}