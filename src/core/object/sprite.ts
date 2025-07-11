/**
 * @namespace core
 */

/**
 * Represents different fill styles that can be applied to a Sprite.
 * @memberof core
 * @property {"color"|"gradient"|"image"} type - The type of fill style
 * @property {string} value - The value for the fill style (color string, gradient definition, or image URL)
 *
 * @example
 * // Color fill
 * const colorFill: FillStyle = { type: "color", value: "#ff0000" };
 *
 * @example
 * // Gradient fill
 * const gradientFill: FillStyle = { type: "gradient", value: "linear-gradient(to right, #ff0000, #0000ff)" };
 *
 * @example
 * // Image fill
 * const imageFill: FillStyle = { type: "image", value: "path/to/image.png" };
 *
 * @see Sprite#fill
 */
export type FillStyle =
  | { type: 'color'; value: string }
  | { type: 'gradient'; value: string }
  | { type: 'image'; value: string };

/**
 * Configuration options for creating a Sprite.
 * @interface SpriteOptions
 * @memberof core
 *
 * @property {number} [x=0] - X position in pixels
 * @property {number} [y=0] - Y position in pixels
 * @property {number} [z=0] - Z position for 3D transforms and stacking order
 * @property {number} [width=100] - Width in pixels
 * @property {number} [height=100] - Height in pixels
 * @property {number|string} [originX="50%"] - X origin for transformations (number or percentage string)
 * @property {number|string} [originY="50%"] - Y origin for transformations (number or percentage string)
 * @property {number} [rotation=0] - 2D rotation in degrees
 * @property {number} [rotationX=0] - 3D rotation around X-axis in degrees
 * @property {number} [rotationY=0] - 3D rotation around Y-axis in degrees
 * @property {number} [rotationZ=0] - 3D rotation around Z-axis in degrees
 * @property {number} [scaleX=1] - Scale factor along the X-axis
 * @property {number} [scaleY=1] - Scale factor along the Y-axis
 * @property {number} [skewX=0] - Skew along the X-axis in degrees
 * @property {number} [skewY=0] - Skew along the Y-axis in degrees
 * @property {string} [border=""] - CSS border property value
 * @property {FillStyle} [fill={ type: "color", value: "#fff" }] - Fill style for the sprite
 *
 * @example
 * const options: SpriteOptions = {
 *   x: 100,
 *   y: 200,
 *   width: 300,
 *   height: 200,
 *   fill: { type: "color", value: "#ff0000" }
 * };
 * const sprite = new Sprite(options);
 */
export interface SpriteOptions {
  x?: number;
  y?: number;
  z?: number;
  width?: number;
  height?: number;
  originX?: number | string;
  originY?: number | string;
  rotation?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  scaleX?: number;
  scaleY?: number;
  skewX?: number;
  skewY?: number;
  border?: string;
  fill?: FillStyle;
  id?: number;
  parent?: Sprite | null;
  children?: Sprite[];
  selected?: boolean;
  element?: HTMLElement;
  preserveElementStyles?: boolean;
}

/**
 * A 2D/3D visual element that can be positioned, scaled, rotated and styled.
 * Sprites are the fundamental building blocks for creating visual compositions.
 *
 * @class Sprite
 * @memberof core
 *
 * @example
 * // Create a simple red rectangle
 * const redBox = new Sprite({
 *   x: 100,
 *   y: 100,
 *   width: 200,
 *   height: 150,
 *   fill: { type: "color", value: "#ff0000" }
 * });
 *
 * // Add it to the DOM
 * redBox.appendTo(document.body);
 *
 * // Animate it
 * redBox.rotation = 45;
 * redBox.updateStyle();
 *
 * @see SpriteOptions
 */
export class Sprite {
	/**
   * The DOM element representing this sprite.
   * This is created during construction and can be appended to any container.
   * @readonly
   * @type {HTMLElement}
   */
	public readonly el: HTMLElement;

	/**
   * Unique identifier for this sprite
   * @type {number}
   */
	public id: number;

	/**
   * Parent sprite that contains this sprite
   * @type {Sprite | null}
   */
	public parent: Sprite | null = null;

	/**
   * Child sprites contained by this sprite
   * @type {Sprite[]}
   */
	public children: Sprite[] = [];

	/**
   * Whether this sprite is currently selected in the editor
   * @type {boolean}
   */
	public selected: boolean = false;

	private _x = 0;
	private _y = 0;
	private _z = 0;
	private _width = 100;
	private _height = 100;
	private _originX: number | string = '50%';
	private _originY: number | string = '50%';
	private _rotation = 0;
	private _rotationX = 0;
	private _rotationY = 0;
	private _rotationZ = 0;
	private _scaleX = 1;
	private _scaleY = 1;
	private _skewX = 0;
	private _skewY = 0;
	private _border = '';
	private _fill: FillStyle = { type: 'color', value: '#fff' };
	private _dirty = true;
	private _isFromDOMElement = false;
	private _preserveElementStyles = false;

	public constructor(options: SpriteOptions = {}) {
		if (options.element) {
			this.el = options.element;
			this._isFromDOMElement = true;
			this._preserveElementStyles = options.preserveElementStyles ?? true;
		} else {
			this.el = document.createElement('div');
			this._isFromDOMElement = false;
			this._preserveElementStyles = false;
		}
		
		if (!this._isFromDOMElement) {
			this.el.style.position = 'absolute';
			this.el.style.willChange = 'transform, background, border';
			this.el.style.pointerEvents = 'auto';
		} else {
			if (window.getComputedStyle(this.el).position === 'static') {
				this.el.style.position = 'relative';
			}
			this.el.style.willChange = 'transform';
			if (!this.el.style.pointerEvents) {
				this.el.style.pointerEvents = 'auto';
			}
		}

		// Generate a random ID if not provided
		this.id =
      options.id !== undefined ? options.id : Math.floor(Math.random() * 10000);

		// Set parent if provided
		this.parent = options.parent || null;

		// Set children if provided
		this.children = options.children || [];

		// Set selected state if provided
		this.selected = options.selected || false;

		// Set other properties
		if (options.x !== undefined) {
			this.x = options.x;
		}
		if (options.y !== undefined) {
			this.y = options.y;
		}
		if (options.z !== undefined) {
			this.z = options.z;
		}
		if (options.width !== undefined) {
			this.width = options.width;
		}
		if (options.height !== undefined) {
			this.height = options.height;
		}
		if (options.originX !== undefined) {
			this.originX = options.originX;
		}
		if (options.originY !== undefined) {
			this.originY = options.originY;
		}
		if (options.rotation !== undefined) {
			this.rotation = options.rotation;
		}
		if (options.rotationX !== undefined) {
			this.rotationX = options.rotationX;
		}
		if (options.rotationY !== undefined) {
			this.rotationY = options.rotationY;
		}
		if (options.rotationZ !== undefined) {
			this.rotationZ = options.rotationZ;
		}
		if (options.scaleX !== undefined) {
			this.scaleX = options.scaleX;
		}
		if (options.scaleY !== undefined) {
			this.scaleY = options.scaleY;
		}
		if (options.skewX !== undefined) {
			this.skewX = options.skewX;
		}
		if (options.skewY !== undefined) {
			this.skewY = options.skewY;
		}
		if (options.border !== undefined) {
			this.border = options.border;
		}
		if (options.fill !== undefined) {
			this.fill = options.fill;
		}
		
		// If created from DOM element, extract initial dimensions and position
		if (this._isFromDOMElement) {
			const rect = this.el.getBoundingClientRect();
			const computedStyle = window.getComputedStyle(this.el);
			
			// Set dimensions from actual element size if not provided
			if (options.width === undefined) {
				this._width = rect.width || 100;
			}
			if (options.height === undefined) {
				this._height = rect.height || 100;
			}
			
			// Extract position if element has positioning
			if (options.x === undefined && computedStyle.position !== 'static') {
				this._x = rect.left;
			}
			if (options.y === undefined && computedStyle.position !== 'static') {
				this._y = rect.top;
			}
		}
		
		this._dirty = true;
	}

	public set x(v: number) {
		this._x = v;
		this._dirty = true;
	}
	public get x(): number {
		return this._x;
	}

	public set y(v: number) {
		this._y = v;
		this._dirty = true;
	}
	public get y(): number {
		return this._y;
	}

	public set z(v: number) {
		this._z = v;
		this._dirty = true;
	}
	public get z(): number {
		return this._z;
	}

	public set width(v: number) {
		this._width = v;
		this._dirty = true;
	}
	public get width(): number {
		return this._width;
	}

	public set height(v: number) {
		this._height = v;
		this._dirty = true;
	}
	public get height(): number {
		return this._height;
	}

	public set originX(v: number | string) {
		this._originX = v;
		this._dirty = true;
	}
	public get originX(): number | string {
		return this._originX;
	}

	public set originY(v: number | string) {
		this._originY = v;
		this._dirty = true;
	}
	public get originY(): number | string {
		return this._originY;
	}

	public set rotation(v: number) {
		this._rotation = v;
		this._dirty = true;
	}
	public get rotation(): number {
		return this._rotation;
	}

	public set rotationX(v: number) {
		this._rotationX = v;
		this._dirty = true;
	}
	public get rotationX(): number {
		return this._rotationX;
	}

	public set rotationY(v: number) {
		this._rotationY = v;
		this._dirty = true;
	}
	public get rotationY(): number {
		return this._rotationY;
	}

	public set rotationZ(v: number) {
		this._rotationZ = v;
		this._dirty = true;
	}
	public get rotationZ(): number {
		return this._rotationZ;
	}

	public set scaleX(v: number) {
		this._scaleX = v;
		this._dirty = true;
	}
	public get scaleX(): number {
		return this._scaleX;
	}

	public set scaleY(v: number) {
		this._scaleY = v;
		this._dirty = true;
	}
	public get scaleY(): number {
		return this._scaleY;
	}

	public set skewX(v: number) {
		this._skewX = v;
		this._dirty = true;
	}
	public get skewX(): number {
		return this._skewX;
	}

	public set skewY(v: number) {
		this._skewY = v;
		this._dirty = true;
	}
	public get skewY(): number {
		return this._skewY;
	}

	public set border(v: string) {
		this._border = v;
		this._dirty = true;
	}
	public get border(): string {
		return this._border;
	}

	public set fill(v: FillStyle) {
		this._fill = v;
		this._dirty = true;
	}
	public get fill(): FillStyle {
		return this._fill;
	}

	public get dirty(): boolean {
		return this._dirty;
	}
  
	/**
   * Updates the DOM element's style properties based on the current sprite properties.
   * Call this method after changing any properties to see the visual changes.
   *
   * @example
   * sprite.x = 200;
   * sprite.rotation = 45;
   * sprite.updateStyle(); // Apply the changes to the DOM
   *
   * @returns {void}
   */
	public updateStyle(): void {
		if (!this._dirty) {
			return;
		}
		const {
			el,
			_x,
			_y,
			_z,
			_width,
			_height,
			_originX,
			_originY,
			_rotation,
			_rotationX,
			_rotationY,
			_rotationZ,
			_scaleX,
			_scaleY,
			_skewX,
			_skewY,
			_border,
			_fill,
		} = this;

		if (this._isFromDOMElement) {
			// For DOM elements, apply transforms without changing original size
			el.style.transformOrigin = `${_originX} ${_originY}`;
			el.style.transform =
				'perspective(800px) ' +
				`translate3d(${_x}px, ${_y}px, ${_z}px) ` +
				`scale(${1 + _z * 0.01}) ` +
				`rotate(${_rotation}deg) ` +
				`rotateX(${_rotationX}deg) ` +
				`rotateY(${_rotationY}deg) ` +
				`rotateZ(${_rotationZ}deg) ` +
				`scaleX(${_scaleX}) ` +
				`scaleY(${_scaleY}) ` +
				`skewX(${_skewX}deg) ` +
				`skewY(${_skewY}deg)`;

			// Apply size changes if not preserving styles
			if (!this._preserveElementStyles) {
				el.style.width = `${_width}px`;
				el.style.height = `${_height}px`;
			}
			
			el.style.zIndex = String(Math.round(_z));
			
			// Apply border and fill only if not preserving styles
			if (!this._preserveElementStyles) {
				el.style.border = _border;
				
				// Fill style
				if (_fill.type === 'color') {
					el.style.background = _fill.value;
				} else if (_fill.type === 'gradient') {
					el.style.background = _fill.value;
				} else if (_fill.type === 'image') {
					el.style.background = `url('${_fill.value}') center/cover no-repeat`;
				}
			}
		} else {
			// Original behavior for created sprites
			// Use a fixed base size and scale via transform to maintain consistent transform origin
			const baseWidth = 100;
			const baseHeight = 100;
			const widthScale = _width / baseWidth;
			const heightScale = _height / baseHeight;

			el.style.left = `${_x}px`;
			el.style.top = `${_y}px`;
			el.style.width = `${baseWidth}px`;
			el.style.height = `${baseHeight}px`;
			el.style.transformOrigin = `${_originX} ${_originY}`;
			el.style.transform =
				'perspective(800px) ' +
				`translate3d(0,0,${_z}px) ` +
				`scale(${1 + _z * 0.01}) ` +
				`rotate(${_rotation}deg) ` +
				`rotateX(${_rotationX}deg) ` +
				`rotateY(${_rotationY}deg) ` +
				`rotateZ(${_rotationZ}deg) ` +
				`scaleX(${widthScale * _scaleX}) ` +
				`scaleY(${heightScale * _scaleY}) ` +
				`skewX(${_skewX}deg) ` +
				`skewY(${_skewY}deg)`;

			el.style.zIndex = String(Math.round(_z));
			el.style.border = _border;

			// Fill style
			if (_fill.type === 'color') {
				el.style.background = _fill.value;
			} else if (_fill.type === 'gradient') {
				el.style.background = _fill.value;
			} else if (_fill.type === 'image') {
				el.style.background = `url('${_fill.value}') center/cover no-repeat`;
			}
		}
		this._dirty = false;
	}

	/**
   * Appends this sprite's element to a parent DOM node.
   *
   * @param {HTMLElement} parent - The parent DOM element to append this sprite to
   * @returns {void}
   *
   * @example
   * const sprite = new Sprite();
   * sprite.appendTo(document.getElementById('container'));
   */
	public appendTo(parent: HTMLElement): void {
		parent.appendChild(this.el);
	}

	/**
   * Removes this sprite's element from its parent DOM node.
   * Use this method to remove the sprite from the DOM.
   *
   * @returns {void}
   *
   * @example
   * const sprite = new Sprite();
   * sprite.appendTo(document.body);
   * // Later, when no longer needed:
   * sprite.remove();
   */
	public remove(): void {
		if (this.el.parentNode) {
			this.el.parentNode.removeChild(this.el);
		}
	}

	/**
	 * Creates a Sprite from an existing DOM element, preserving its structure and styling.
	 * This method can handle complex DOM hierarchies and convert them to sprite hierarchies.
	 * 
	 * @param element - The DOM element to convert to a sprite
	 * @param options - Additional options for sprite creation
	 * @param options.preserveElementStyles - Whether to preserve original element styles (default: true)
	 * @param options.recursive - Whether to convert child elements to child sprites (default: true)
	 * @returns The root sprite representing the DOM element hierarchy
	 * 
	 * @example
	 * // Convert a simple element
	 * const element = document.getElementById('myElement');
	 * const sprite = Sprite.fromDOMElement(element);
	 * 
	 * @example
	 * // Convert with custom options
	 * const sprite = Sprite.fromDOMElement(element, {
	 *   preserveElementStyles: false,
	 *   recursive: true
	 * });
	 * 
	 * @example
	 * // Convert complex hierarchy
	 * const cardElement = document.querySelector('.card');
	 * const cardSprite = Sprite.fromDOMElement(cardElement);
	 * // All child elements become child sprites
	 */
	public static fromDOMElement(
		element: HTMLElement,
		options: {
			preserveElementStyles?: boolean;
			recursive?: boolean;
			parentSprite?: Sprite;
		} = {}
	): Sprite {
		const { preserveElementStyles = true, recursive = true, parentSprite } = options;
		
		// Create sprite from element
		const sprite = new Sprite({
			element,
			preserveElementStyles,
			parent: parentSprite || null
		});
		
		// Add to parent's children if parent exists
		if (parentSprite) {
			parentSprite.children.push(sprite);
		}
		
		// Recursively convert child elements if requested
		if (recursive) {
			const childElements = Array.from(element.children) as HTMLElement[];
			for (const childElement of childElements) {
				Sprite.fromDOMElement(childElement, {
					preserveElementStyles,
					recursive: true,
					parentSprite: sprite
				});
			}
		}
		
		return sprite;
	}

	/**
	 * Finds the root sprite in a hierarchy that was created from a DOM element.
	 * This is useful for selection logic where clicking on a child should select the root.
	 * 
	 * @param sprite - The sprite to find the root for
	 * @returns The root sprite of the DOM element hierarchy
	 * 
	 * @example
	 * // Find root sprite for selection
	 * const rootSprite = Sprite.findDOMElementRoot(clickedSprite);
	 * selectSprite(rootSprite);
	 */
	public static findDOMElementRoot(sprite: Sprite): Sprite {
		let current = sprite;
		while (current.parent && current.parent._isFromDOMElement) {
			current = current.parent;
		}
		return current;
	}

	/**
	 * Checks if this sprite was created from a DOM element.
	 * 
	 * @returns True if this sprite was created from a DOM element
	 */
	public get isFromDOMElement(): boolean {
		return this._isFromDOMElement;
	}

	/**
	 * Gets whether this sprite preserves the original element's styles.
	 * 
	 * @returns True if original styles are preserved
	 */
	public get preserveElementStyles(): boolean {
		return this._preserveElementStyles;
	}
}
