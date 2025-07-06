export type FillStyle =
  | { type: "color"; value: string }
  | { type: "gradient"; value: string }
  | { type: "image"; value: string };

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
}

export class Sprite {
  readonly el: HTMLDivElement;

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

    el.style.left = `${_x}px`;
    el.style.top = `${_y}px`;
    el.style.width = `${_width}px`;
    el.style.height = `${_height}px`;
    el.style.transformOrigin = `${_originX} ${_originY}`;
    el.style.transform =
      `perspective(800px) ` +
      `translate3d(0,0,${_z}px) ` +
      `scale(${1 + _z * 0.01}) ` +
      `scaleX(${_scaleX}) ` +
      `scaleY(${_scaleY}) ` +
      `rotate(${_rotation}deg) ` +
      `rotateX(${_rotationX}deg) ` +
      `rotateY(${_rotationY}deg) ` +
      `rotateZ(${_rotationZ}deg) ` +
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
   */
  appendTo(parent: HTMLElement) {
    parent.appendChild(this.el);
  }

  /**
   * Removes this sprite's element from its parent DOM node.
   */
  remove() {
    if (this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  }
}
