/**
 * @namespace core
 */

/**
 * Represents different fill styles that can be applied to a Sprite.
 * @typedef {Object} FillStyle
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
 * @see core.Sprite#fill
 */
export type FillStyle =
  | { type: "color"; value: string }
  | { type: "gradient"; value: string }
  | { type: "image"; value: string };

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
 * @see core.SpriteOptions
 */
export class Sprite {
  /**
   * The DOM element representing this sprite.
   * This is created during construction and can be appended to any container.
   * @readonly
   * @type {HTMLDivElement}
   */
  readonly el: HTMLDivElement;

  /**
   * Unique identifier for this sprite
   * @type {number}
   */
  id: number;

  /**
   * Parent sprite that contains this sprite
   * @type {Sprite | null}
   */
  parent: Sprite | null = null;

  /**
   * Child sprites contained by this sprite
   * @type {Sprite[]}
   */
  children: Sprite[] = [];

  /**
   * Whether this sprite is currently selected in the editor
   * @type {boolean}
   */
  selected: boolean = false;

  private _x = 0;
  private _y = 0;
  private _z = 0;
  private _width = 100;
  private _height = 100;
  private _originX: number | string = "50%";
  private _originY: number | string = "50%";
  private _rotation = 0;
  private _rotationX = 0;
  private _rotationY = 0;
  private _rotationZ = 0;
  private _scaleX = 1;
  private _scaleY = 1;
  private _skewX = 0;
  private _skewY = 0;
  private _border = "";
  private _fill: FillStyle = { type: "color", value: "#fff" };
  private _dirty = true;

  constructor(options: SpriteOptions = {}) {
    this.el = document.createElement("div");
    this.el.style.position = "absolute";
    this.el.style.willChange = "transform, background, border";
    this.el.style.pointerEvents = "auto";

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
    Object.assign(this, options);
    this._dirty = true;
  }

  set x(v: number) {
    this._x = v;
    this._dirty = true;
  }
  get x() {
    return this._x;
  }

  set y(v: number) {
    this._y = v;
    this._dirty = true;
  }
  get y() {
    return this._y;
  }

  set z(v: number) {
    this._z = v;
    this._dirty = true;
  }
  get z() {
    return this._z;
  }

  set width(v: number) {
    this._width = v;
    this._dirty = true;
  }
  get width() {
    return this._width;
  }

  set height(v: number) {
    this._height = v;
    this._dirty = true;
  }
  get height() {
    return this._height;
  }

  set originX(v: number | string) {
    this._originX = v;
    this._dirty = true;
  }
  get originX() {
    return this._originX;
  }

  set originY(v: number | string) {
    this._originY = v;
    this._dirty = true;
  }
  get originY() {
    return this._originY;
  }

  set rotation(v: number) {
    this._rotation = v;
    this._dirty = true;
  }
  get rotation() {
    return this._rotation;
  }

  set rotationX(v: number) {
    this._rotationX = v;
    this._dirty = true;
  }
  get rotationX() {
    return this._rotationX;
  }

  set rotationY(v: number) {
    this._rotationY = v;
    this._dirty = true;
  }
  get rotationY() {
    return this._rotationY;
  }

  set rotationZ(v: number) {
    this._rotationZ = v;
    this._dirty = true;
  }
  get rotationZ() {
    return this._rotationZ;
  }

  set scaleX(v: number) {
    this._scaleX = v;
    this._dirty = true;
  }
  get scaleX() {
    return this._scaleX;
  }

  set scaleY(v: number) {
    this._scaleY = v;
    this._dirty = true;
  }
  get scaleY() {
    return this._scaleY;
  }

  set skewX(v: number) {
    this._skewX = v;
    this._dirty = true;
  }
  get skewX() {
    return this._skewX;
  }

  set skewY(v: number) {
    this._skewY = v;
    this._dirty = true;
  }
  get skewY() {
    return this._skewY;
  }

  set border(v: string) {
    this._border = v;
    this._dirty = true;
  }
  get border() {
    return this._border;
  }

  set fill(v: FillStyle) {
    this._fill = v;
    this._dirty = true;
  }
  get fill() {
    return this._fill;
  }

  get dirty() {
    return this._dirty;
  }

  set dirty(v: boolean) {
    this._dirty = v;
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
  updateStyle() {
    if (!this._dirty) return;
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
      `perspective(800px) ` +
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
    if (_fill.type === "color") {
      el.style.background = _fill.value;
    } else if (_fill.type === "gradient") {
      el.style.background = _fill.value;
    } else if (_fill.type === "image") {
      el.style.background = `url('${_fill.value}') center/cover no-repeat`;
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
  appendTo(parent: HTMLElement) {
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
  remove() {
    if (this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}
