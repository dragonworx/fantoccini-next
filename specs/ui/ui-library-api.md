# UI Library API Reference

## Core Classes

### Element

The base building block of the UI system. All visual components extend from Element.

```typescript
class Element {
  // Core properties
  id: string;
  parent: Container | null;

  // State
  visible: boolean;
  interactive: boolean;

  // Property accessors
  get geometry(): IGeometry;
  get layout(): ILayout;
  get appearance(): IAppearance;

  // Methods
  constructor(config?: IElementConfig);

  // Lifecycle
  mount(): void;
  unmount(): void;
  destroy(): void;

  // Events
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, data?: any): void;
}
```

### Container

A specialized Element that can contain child elements and manage their layout.

```typescript
class Container extends Element {
  // Properties
  children: Element[];
  layoutManager: ILayoutManager;

  // Methods
  constructor(config?: IContainerConfig);

  // Child management
  add(child: Element): void;
  addAt(child: Element, index: number): void;
  remove(child: Element): void;
  removeAt(index: number): Element;
  removeAll(): void;
  getChildAt(index: number): Element | null;
  getChildByTag(tag: string, deep: boolean): Element | null;
  contains(child: Element, deep: boolean): boolean;

  // Layout
  setLayout(layout: ILayoutManager): void;
  calcLayout(): void;
  invalidateLayout(): void;
}
```

### View

The top-level container that manages rendering and scene management.

```typescript
class View {
  // Properties
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  root: Container;

  // Performance metrics
  fps: number;
  renderTime: number;

  // Methods
  constructor(config: IViewConfig);

  // Root management
  setRoot(root: Container): void;
  getRoot(): Container;

  // Rendering
  render(): void;
  startRenderLoop(): void;
  stopRenderLoop(): void;
  
  // Dirty tracking integration
  needsUpdate(): boolean;
  update(deltaTime?: number): void;
  markDirty(element: Element, flags: DirtyFlags): void;

  // Viewport
  resize(width: number, height: number): void;
  setPixelRatio(ratio: number): void;

  // Scene queries
  pick(x: number, y: number): Element | null;
  pickAll(x: number, y: number): Element[];

  // Lifecycle
  dispose(): void;
}
```

### Text

A specialized Element for rendering text content.

```typescript
class Text extends Element {
  // Properties
  text: string;
  style: ITextStyle;

  // Methods
  constructor(text: string, style?: ITextStyle);

  // Text management
  setText(text: string): void;
  setStyle(style: Partial<ITextStyle>): void;

  // Metrics
  getTextBounds(): ITextBounds;
  getLineHeight(): number;
  getCharacterBounds(index: number): IBounds;
}
```

## Interfaces

### DirtyFlags

Bitwise flags for tracking element state changes.

```typescript
enum DirtyFlags {
  None = 0,
  Geometry = 1 << 0,    // Position or size changed
  Appearance = 1 << 1,  // Visual properties changed
  Layout = 1 << 2,      // Children or layout properties changed
  Content = 1 << 3,     // Text or other content changed
  Transform = 1 << 4,   // Three.js transform needs update
  All = Geometry | Appearance | Layout | Content | Transform
}
```

### Geometry

```typescript
interface IGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface IBounds extends IGeometry {
  right: number;
  bottom: number;
}
```

### Appearance

```typescript
interface IAppearance {
  alpha: number;              // 0-1
  backgroundColor: number;    // hex color
  borderColor: number;        // hex color
  borderWidth: number;        // pixels
  borderRadius: number;       // pixels
  shadowColor?: number;       // hex color
  shadowBlur?: number;        // pixels
  shadowOffsetX?: number;     // pixels
  shadowOffsetY?: number;     // pixels
}
```

### Layout Properties

```typescript
interface ILayout {
  // Padding
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;

  // Margin
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;

  // Alignment
  hAlign: 'left' | 'center' | 'right' | 'stretch';
  vAlign: 'top' | 'middle' | 'bottom' | 'stretch';

  // Flex properties (for FlexLayout)
  flex?: number;
  flexDirection?: 'row' | 'column';
  flexWrap?: 'nowrap' | 'wrap';
  justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
}
```

### Text Style

```typescript
interface ITextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | number;
  fontStyle: 'normal' | 'italic';
  color: number;              // hex color
  lineHeight: number;         // multiplier
  letterSpacing: number;      // pixels
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textDecoration: 'none' | 'underline' | 'line-through';
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  wordWrap: boolean;
  maxLines?: number;
  ellipsis?: boolean;
}
```

### Configuration

```typescript
interface IElementConfig {
  id?: string;
  geometry?: Partial<IGeometry>;
  appearance?: Partial<IAppearance>;
  layout?: Partial<ILayout>;
  visible?: boolean;
  interactive?: boolean;
}

interface IContainerConfig extends IElementConfig {
  layoutManager?: ILayoutManager;
  children?: Element[];
}

interface IViewConfig {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  pixelRatio?: number;
  antialias?: boolean;
  backgroundColor?: number;
}
```

## Layout Managers

### ILayoutManager Interface

```typescript
interface ILayoutManager {
  name: string;

  // Calculate layout for container's children
  calcLayout(container: Container): void;

  // Get minimum size requirements
  getMinSize(container: Container): { width: number; height: number };

  // Invalidate cached layout data
  invalidate(): void;
}
```

### AbsoluteLayout

Positions elements using absolute coordinates.

```typescript
class AbsoluteLayout implements ILayoutManager {
  name = 'absolute';

  calcLayout(container: Container): void {
    // Position children based on their geometry properties
  }
}
```

### FlexLayout

Implements flexbox-style layout algorithm.

```typescript
class FlexLayout implements ILayoutManager {
  name = 'flex';

  constructor(options?: IFlexLayoutOptions);

  calcLayout(container: Container): void {
    // Apply flexbox algorithm
  }
}

interface IFlexLayoutOptions {
  direction?: 'row' | 'column';
  wrap?: boolean;
  justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  gap?: number;
}
```

### GridLayout

Arranges elements in a grid pattern.

```typescript
class GridLayout implements ILayoutManager {
  name = 'grid';

  constructor(options: IGridLayoutOptions);

  calcLayout(container: Container): void {
    // Apply grid algorithm
  }
}

interface IGridLayoutOptions {
  columns: number;
  rows?: number;
  columnGap?: number;
  rowGap?: number;
  cellWidth?: number | 'auto';
  cellHeight?: number | 'auto';
}
```

## Events

### Element Events

```typescript
// Mouse events
'mouseenter': (event: IMouseEvent) => void;
'mouseleave': (event: IMouseEvent) => void;
'mousemove': (event: IMouseEvent) => void;
'mousedown': (event: IMouseEvent) => void;
'mouseup': (event: IMouseEvent) => void;
'click': (event: IMouseEvent) => void;
'dblclick': (event: IMouseEvent) => void;

// Touch events
'touchstart': (event: ITouchEvent) => void;
'touchmove': (event: ITouchEvent) => void;
'touchend': (event: ITouchEvent) => void;

// Keyboard events
'keydown': (event: IKeyboardEvent) => void;
'keyup': (event: IKeyboardEvent) => void;
'keypress': (event: IKeyboardEvent) => void;

// Focus events
'focus': (event: IFocusEvent) => void;
'blur': (event: IFocusEvent) => void;

// State events
'mount': () => void;
'unmount': () => void;
'resize': (event: IResizeEvent) => void;
'visibilitychange': (visible: boolean) => void;
```

### Event Interfaces

```typescript
interface IMouseEvent {
  x: number;              // Local coordinates
  y: number;
  globalX: number;        // Global coordinates
  globalY: number;
  button: number;
  buttons: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  target: Element;
  currentTarget: Element;
  preventDefault(): void;
  stopPropagation(): void;
}

interface ITouchEvent {
  touches: ITouch[];
  changedTouches: ITouch[];
  targetTouches: ITouch[];
  target: Element;
  currentTarget: Element;
  preventDefault(): void;
  stopPropagation(): void;
}

interface ITouch {
  identifier: number;
  x: number;
  y: number;
  globalX: number;
  globalY: number;
}
```

## Property Accessors

The Element class provides getter accessors for geometry, layout, and appearance properties. These getters return mutable objects that allow direct property manipulation:

```typescript
// Element property accessors implementation detail
class Element {
  private _geometry: IGeometry;
  private _layout: ILayout;
  private _appearance: IAppearance;

  get geometry(): IGeometry {
    return this._geometry;  // Returns mutable reference
  }

  get layout(): ILayout {
    return this._layout;    // Returns mutable reference
  }

  get appearance(): IAppearance {
    return this._appearance; // Returns mutable reference
  }
}

// Usage examples
element.geometry.left = 100;         // Direct property assignment
element.geometry.width = 200;
element.layout.paddingLeft = 10;
element.layout.marginTop = 20;
element.appearance.backgroundColor = 0xFF0000;
element.appearance.alpha = 0.5;
```

## Usage Examples

### Basic Element Creation

```typescript
// Create a button
const button = new Element({
  geometry: { left: 10, top: 10, width: 120, height: 40 },
  appearance: {
    backgroundColor: 0x2196F3,
    borderRadius: 4,
    borderWidth: 0
  }
});

// Add text
const label = new Text('Click Me', {
  fontSize: 16,
  color: 0xFFFFFF,
  fontFamily: 'Arial'
});

// Create container and add children
const container = new Container({
  layoutManager: new FlexLayout({ direction: 'row', gap: 10 })
});
container.add(button);
container.add(label);
```

### Creating a View

```typescript
// Create view with custom canvas
const view = new View({
  width: 800,
  height: 600,
  backgroundColor: 0xF5F5F5,
  antialias: true
});

// Set root container
const root = new Container({
  geometry: { left: 0, top: 0, width: 800, height: 600 },
  layoutManager: new FlexLayout({ direction: 'column' })
});
view.setRoot(root);

// Start render loop
view.startRenderLoop();

// Handle resize
window.addEventListener('resize', () => {
  view.resize(window.innerWidth, window.innerHeight);
});
```

### Event Handling

```typescript
// Add click handler
button.on('click', (event: IMouseEvent) => {
  console.log('Button clicked at:', event.x, event.y);
  button.appearance.backgroundColor = 0x4CAF50;
});

// Add hover effects
button.on('mouseenter', () => {
  button.appearance.alpha = 0.8;
});

button.on('mouseleave', () => {
  button.appearance.alpha = 1.0;
});

// Keyboard navigation
container.on('keydown', (event: IKeyboardEvent) => {
  if (event.key === 'Tab') {
    // Handle tab navigation
  }
});
```

### Custom Layout Manager

```typescript
class CircularLayout implements ILayoutManager {
  name = 'circular';

  constructor(private radius: number) {}

  calcLayout(container: Container): void {
    const children = container.children;
    const count = children.length;
    const angleStep = (Math.PI * 2) / count;
    const centerX = container.geometry.width / 2;
    const centerY = container.geometry.height / 2;

    children.forEach((child, index) => {
      const angle = index * angleStep;
      const x = centerX + Math.cos(angle) * this.radius - child.geometry.width / 2;
      const y = centerY + Math.sin(angle) * this.radius - child.geometry.height / 2;
      child.geometry.left = x;
      child.geometry.top = y;
    });
  }

  getMinSize(container: Container): { width: number; height: number } {
    return {
      width: this.radius * 2 + 100,
      height: this.radius * 2 + 100
    };
  }

  invalidate(): void {
    // Clear any cached data
  }
}
```
