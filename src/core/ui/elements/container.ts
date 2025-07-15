/**
 * Container class for managing child elements
 * @namespace core.ui
 * @memberof core.ui
 */

import * as THREE from 'three';
import { Element } from './element';
import type { IContainerConfig, ILayoutManager } from '../types';
import { DirtyFlags } from '../types';

/**
 * A specialized Element that can contain child elements
 * @memberof core.ui
 */
export class Container extends Element {
	// Child management
	public children: Element[] = [];
	
	// Layout
	public layoutManager: ILayoutManager | null = null;
	
	// Three.js group for children
	protected group: THREE.Group | null = null;

	/**
	 * Creates a new Container
	 */
	public constructor(config?: IContainerConfig) {
		super(config);
		
		if (config) {
			// Handle layout manager
			if (config.layoutManager || config.layout) {
				this.layoutManager = config.layoutManager || config.layout!;
			}
			
			// Handle padding shorthand
			if (config.padding !== undefined) {
				const p = config.padding;
				if (typeof p === 'number') {
					this._layout.paddingTop = p;
					this._layout.paddingRight = p;
					this._layout.paddingBottom = p;
					this._layout.paddingLeft = p;
				} else if (Array.isArray(p)) {
					if (p.length === 2) {
						this._layout.paddingTop = p[0];
						this._layout.paddingBottom = p[0];
						this._layout.paddingLeft = p[1];
						this._layout.paddingRight = p[1];
					} else if (p.length === 4) {
						this._layout.paddingTop = p[0];
						this._layout.paddingRight = p[1];
						this._layout.paddingBottom = p[2];
						this._layout.paddingLeft = p[3];
					}
				}
			}
		}
	}

	/**
	 * Add a child element
	 */
	public addChild(child: Element): void {
		if (child.parent === this) {
			return;
		}
		
		// Remove from previous parent
		if (child.parent) {
			child.parent.removeChild(child);
		}
		
		// Add to children array
		this.children.push(child);
		child.parent = this;
		child.view = this.view;
		
		// Mount if we're mounted
		if (this.view && this.group) {
			child.mount();
			const mesh = child.getMesh();
			if (mesh) {
				this.group.add(mesh);
			}
		}
		
		// Mark for layout
		this.markDirty(DirtyFlags.Layout);
		
		// Emit events
		this.emit('childAdded', child);
		child.emit('addedToParent', this);
	}

	/**
	 * Remove a child element
	 */
	public removeChild(child: Element): boolean {
		const index = this.children.indexOf(child);
		if (index === -1) {
			return false;
		}
		
		// Remove from array
		this.children.splice(index, 1);
		
		// Remove from Three.js group
		if (this.group && child.getMesh()) {
			const mesh = child.getMesh();
			if (mesh) {
				this.group.remove(mesh);
			}
			child.unmount();
		}
		
		// Clear parent reference
		child.parent = null;
		child.view = null;
		
		// Mark for layout
		this.markDirty(DirtyFlags.Layout);
		
		// Emit events
		this.emit('childRemoved', child);
		child.emit('removedFromParent', this);
		
		return true;
	}

	/**
	 * Remove all children
	 */
	public removeAllChildren(): void {
		const children = [...this.children];
		for (const child of children) {
			this.removeChild(child);
		}
	}

	/**
	 * Get child by ID
	 */
	public getChildById(id: string): Element | null {
		for (const child of this.children) {
			if (child.id === id) {
				return child;
			}
			if (child instanceof Container) {
				const found = child.getChildById(id);
				if (found) {
					return found;
				}
			}
		}
		return null;
	}

	/**
	 * Get children at point
	 */
	public getChildrenAt(x: number, y: number): Element[] {
		const hits: Element[] = [];
		
		// Test children in reverse order (top to bottom)
		for (let i = this.children.length - 1; i >= 0; i--) {
			const child = this.children[i];
			if (child.hitTest(x, y)) {
				hits.push(child);
				
				// If it's a container, check its children
				if (child instanceof Container) {
					hits.push(...child.getChildrenAt(x, y));
				}
			}
		}
		
		return hits;
	}

	/**
	 * Calculate layout
	 */
	public calcLayout(): void {
		// Mark self for layout
		this.markDirty(DirtyFlags.Layout);
		
		// Use layout manager if available
		if (this.layoutManager) {
			this.layoutManager.calculateLayout(this);
		}
		
		// Recursively calculate child layouts
		for (const child of this.children) {
			if (child instanceof Container) {
				child.calcLayout();
			}
		}
		
		// Clear layout dirty flag
		this.clearDirty(DirtyFlags.Layout);
	}

	/**
	 * Override mount to handle children
	 */
	public mount(): void {
		super.mount();
		
		// Mount all children
		for (const child of this.children) {
			child.view = this.view;
			child.mount();
			const mesh = child.getMesh();
			if (mesh && this.group) {
				this.group.add(mesh);
			}
		}
	}

	/**
	 * Override unmount to handle children
	 */
	public unmount(): void {
		// Unmount all children
		for (const child of this.children) {
			child.unmount();
		}
		
		super.unmount();
	}

	/**
	 * Override update to handle children
	 */
	public update(): void {
		super.update();
		
		// Update all children
		for (const child of this.children) {
			child.update();
		}
	}

	/**
	 * Override createThreeObjects to create group
	 */
	protected createThreeObjects(): void {
		super.createThreeObjects();
		
		// Create group for children
		this.group = new THREE.Group();
		if (this.mesh) {
			this.mesh.add(this.group);
		}
	}

	/**
	 * Check if this is the root container
	 */
	public isRoot(): boolean {
		return this.parent === null && this.view !== null;
	}

	/**
	 * Override updateAppearance to skip rendering for root
	 */
	protected updateAppearance(): void {
		if (this.isRoot()) {
			// Don't render appearance for root container
			if (this.material) {
				this.material.visible = false;
			}
			return;
		}
		super.updateAppearance();
	}

	/**
	 * Override destroyThreeObjects to clean up group
	 */
	protected destroyThreeObjects(): void {
		this.group = null;
		super.destroyThreeObjects();
	}

	/**
	 * Override destroy to clean up children
	 */
	public destroy(): void {
		this.removeAllChildren();
		super.destroy();
	}
}