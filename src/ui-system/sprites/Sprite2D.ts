import * as THREE from 'three';
import { Sprite } from './Sprite';
import type { Material } from '../materials/Material';
import type { StyleSheet } from '../styling/StyleSheet';

/**
 * Anchor point enumeration for positioning.
 * @enum {string}
 * @memberof ui-system.sprites
 */
export enum AnchorPoint {
	TopLeft = 'top-left',
	TopCenter = 'top-center',
	TopRight = 'top-right',
	MiddleLeft = 'middle-left',
	MiddleCenter = 'middle-center',
	MiddleRight = 'middle-right',
	BottomLeft = 'bottom-left',
	BottomCenter = 'bottom-center',
	BottomRight = 'bottom-right'
}

/**
 * Flat rectangular sprite optimized for 2D UI elements.
 * 
 * @class Sprite2D
 * @extends Sprite
 * @memberof ui-system.sprites
 */
export class Sprite2D extends Sprite {
	/**
	 * Plane geometry for the sprite.
	 * @private
	 */
	private plane: THREE.PlaneGeometry;

	/**
	 * Mesh instance.
	 * @private
	 */
	private _mesh: THREE.Mesh;

	/**
	 * Current style.
	 * @private
	 */
	private _style: StyleSheet | null = null;

	/**
	 * Texture for the sprite.
	 * @private
	 */
	private _texture: THREE.Texture | null = null;

	/**
	 * Creates a new Sprite2D instance.
	 * @public
	 * @param {number} [width=100] - Width
	 * @param {number} [height=100] - Height
	 * @param {Material} [material] - Optional material
	 */
	public constructor(width: number = 100, height: number = 100, material?: Material) {
		super(material);
		
		this._size.set(width, height);
		
		// Create plane geometry
		this.plane = new THREE.PlaneGeometry(width, height);
		
		// Create default material if none provided
		const defaultMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			side: THREE.DoubleSide,
			transparent: true
		});
		
		// Create mesh
		this._mesh = new THREE.Mesh(this.plane, material?.threeMaterial || defaultMaterial);
		this.add(this._mesh);
		
		// Apply origin offset
		this.updateGeometry();
	}

	/**
	 * Gets the mesh.
	 * @public
	 * @override
	 * @returns {THREE.Mesh} The mesh
	 */
	public get mesh(): THREE.Mesh {
		return this._mesh;
	}

	/**
	 * Gets the texture.
	 * @public
	 * @returns {THREE.Texture | null} The texture
	 */
	public get texture(): THREE.Texture | null {
		return this._texture;
	}

	/**
	 * Sets the texture.
	 * @public
	 * @param {THREE.Texture | null} value - New texture
	 * @returns {void}
	 */
	public set texture(value: THREE.Texture | null) {
		this._texture = value;
		if (this._material) {
			this._material.setTexture(value);
		} else if (this._mesh.material instanceof THREE.MeshBasicMaterial) {
			this._mesh.material.map = value;
			this._mesh.material.needsUpdate = true;
		}
	}

	/**
	 * Sets the style.
	 * @public
	 * @param {StyleSheet} style - New style
	 * @returns {void}
	 */
	public setStyle(style: StyleSheet): void {
		this._style = style;
		// Style application will be implemented with StyleManager
		this.markNeedsUpdate();
	}

	/**
	 * Gets the style.
	 * @public
	 * @returns {StyleSheet | null} The style
	 */
	public getStyle(): StyleSheet | null {
		return this._style ? { ...this._style } : null;
	}

	/**
	 * Sets anchor point for positioning.
	 * @public
	 * @param {AnchorPoint} anchor - Anchor point
	 * @returns {void}
	 */
	public setAnchor(anchor: AnchorPoint): void {
		switch (anchor) {
			case AnchorPoint.TopLeft:
				this._origin.set(0, 1);
				break;
			case AnchorPoint.TopCenter:
				this._origin.set(0.5, 1);
				break;
			case AnchorPoint.TopRight:
				this._origin.set(1, 1);
				break;
			case AnchorPoint.MiddleLeft:
				this._origin.set(0, 0.5);
				break;
			case AnchorPoint.MiddleCenter:
				this._origin.set(0.5, 0.5);
				break;
			case AnchorPoint.MiddleRight:
				this._origin.set(1, 0.5);
				break;
			case AnchorPoint.BottomLeft:
				this._origin.set(0, 0);
				break;
			case AnchorPoint.BottomCenter:
				this._origin.set(0.5, 0);
				break;
			case AnchorPoint.BottomRight:
				this._origin.set(1, 0);
				break;
		}
		this.markNeedsUpdate();
	}

	/**
	 * Sets bounds.
	 * @public
	 * @param {number} x - X position
	 * @param {number} y - Y position
	 * @param {number} width - Width
	 * @param {number} height - Height
	 * @returns {void}
	 */
	public setBounds(x: number, y: number, width: number, height: number): void {
		this.position.set(x, y, this.position.z);
		this.size = new THREE.Vector2(width, height);
	}

	/**
	 * Updates geometry.
	 * @public
	 * @override
	 * @returns {void}
	 */
	public updateGeometry(): void {
		// Dispose old geometry
		if (this.plane) {
			this.plane.dispose();
		}
		
		// Create new geometry with current size
		this.plane = new THREE.PlaneGeometry(this._size.x, this._size.y);
		this._mesh.geometry = this.plane;
		
		// Apply origin offset
		const offsetX = -this._size.x * (this._origin.x - 0.5);
		const offsetY = -this._size.y * (this._origin.y - 0.5);
		this._mesh.position.set(offsetX, offsetY, 0);
	}

	/**
	 * Updates material.
	 * @public
	 * @override
	 * @returns {void}
	 */
	public updateMaterial(): void {
		if (this._material) {
			this._mesh.material = this._material.threeMaterial;
			this._material.update();
		}
	}

	/**
	 * Checks if point is contained.
	 * @public
	 * @param {THREE.Vector2} point - Point to check (in local space)
	 * @returns {boolean} True if contained
	 */
	public contains(point: THREE.Vector2): boolean {
		const halfWidth = this._size.x / 2;
		const halfHeight = this._size.y / 2;
		
		const minX = -halfWidth + this._size.x * (0.5 - this._origin.x);
		const maxX = halfWidth + this._size.x * (0.5 - this._origin.x);
		const minY = -halfHeight + this._size.y * (0.5 - this._origin.y);
		const maxY = halfHeight + this._size.y * (0.5 - this._origin.y);
		
		return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
	}

	/**
	 * Gets bounds.
	 * @public
	 * @returns {THREE.Box2} The bounds
	 */
	public getBounds(): THREE.Box2 {
		const worldPos = new THREE.Vector3();
		this.getWorldPosition(worldPos);
		
		const halfWidth = this._size.x / 2;
		const halfHeight = this._size.y / 2;
		
		const minX = worldPos.x - halfWidth + this._size.x * (0.5 - this._origin.x);
		const maxX = worldPos.x + halfWidth + this._size.x * (0.5 - this._origin.x);
		const minY = worldPos.y - halfHeight + this._size.y * (0.5 - this._origin.y);
		const maxY = worldPos.y + halfHeight + this._size.y * (0.5 - this._origin.y);
		
		return new THREE.Box2(
			new THREE.Vector2(minX, minY),
			new THREE.Vector2(maxX, maxY)
		);
	}
}