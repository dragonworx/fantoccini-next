# Three.js UI System - Core Architecture Specification

## Overview

This specification defines a GPU-accelerated UI system built on Three.js that supports both 2D interface elements and 3D
content. The system is designed to provide efficient rendering while maintaining direct access to Three.js primitives.

### Core Principles

- **Extend, Don't Wrap**: Core classes extend Three.js objects rather than wrapping them
- **Raw Three.js Access**: Cameras, renderers, and materials remain accessible as native Three.js objects
- **Multi-View Support**: Single scenes can be rendered by multiple views simultaneously
- **Efficient Updates**: Mark-and-sweep update system to minimize unnecessary computations
- **Performance First**: Support for instanced rendering and optimized material systems

## Core Architecture

### Scene

The Scene class extends THREE.Scene and manages multiple views that can render the same scene content.

```typescript
class Scene extends THREE.Scene {
  private views: Set<View> = new Set();
  private updateQueue: Set<Sprite> = new Set();
  
  // View management
  addView(view: View): void
  removeView(view: View): void
  getViews(): Set<View>
  
  // Efficient update system
  markForUpdate(sprite: Sprite): void
  flushUpdates(): void
  
  // Render all registered views
  renderAllViews(): void
}
```

**Key Features:**

- Multiple views can render the same scene with different cameras/viewports
- Centralized update queue for efficient batch processing
- Automatic view registration when views are created

**Usage Example:**

```typescript
const scene = new Scene();
const topView = new View2D(scene, new THREE.OrthographicCamera());
const perspView = new View3D(scene, new THREE.PerspectiveCamera());
// Both views now render the same scene content
```

### View (Base Class)

Abstract base class for all view types. Manages rendering pipeline and viewport control.

```typescript
abstract class View {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: Scene;
  readonly camera: THREE.Camera; // Raw Three.js camera - no wrapping
  
  protected viewport: { x: number, y: number, width: number, height: number };
  protected needsResize: boolean = false;
  
  constructor(scene: Scene, camera: THREE.Camera, canvas?: HTMLCanvasElement)
  
  // Abstract methods for subclasses
  abstract render(): void;
  abstract resize(width: number, height: number): void;
  abstract handleInput(event: InputEvent): boolean; // Returns true if event consumed
  
  // Direct Three.js access
  getCamera(): THREE.Camera
  getRenderer(): THREE.WebGLRenderer
  getScene(): Scene
  
  // Viewport management
  setViewport(x: number, y: number, width: number, height: number): void
  getViewport(): { x: number, y: number, width: number, height: number }
}
```

**Key Features:**

- Direct access to Three.js camera (no abstraction layer)
- Flexible viewport system for multi-view layouts
- Event handling with consumption semantics
- Automatic scene registration

### View2D

Specialized view for 2D content with orthographic camera and 2D navigation controls.

```typescript
class View2D extends View {
  readonly camera: THREE.OrthographicCamera;
  private panController: PanController;
  private zoomController: ZoomController;
  
  constructor(scene: Scene, camera?: THREE.OrthographicCamera, canvas?: HTMLCanvasElement)
  
  // 2D-specific navigation
  pan(deltaX: number, deltaY: number): void
  zoom(factor: number, centerX?: number, centerY?: number): void
  fitToContent(padding?: number): void
  setZoomLimits(min: number, max: number): void
  
  // Screen/world coordinate conversion
  screenToWorld(screenX: number, screenY: number): THREE.Vector2
  worldToScreen(worldX: number, worldY: number): THREE.Vector2
  
  render(): void
  resize(width: number, height: number): void
  handleInput(event: InputEvent): boolean
}
```

**Key Features:**

- Orthographic camera setup optimized for 2D content
- Pan and zoom controls with configurable limits
- Coordinate conversion utilities
- Content fitting algorithms

### View3D

Specialized view for 3D content with perspective camera and 3D navigation controls.

```typescript
class View3D extends View {
  readonly camera: THREE.PerspectiveCamera;
  private orbitController: OrbitController;
  
  constructor(scene: Scene, camera?: THREE.PerspectiveCamera, canvas?: HTMLCanvasElement)
  
  // 3D-specific navigation
  orbit(deltaX: number, deltaY: number): void
  dolly(delta: number): void
  pan(deltaX: number, deltaY: number): void
  lookAt(target: THREE.Vector3): void
  fitToContent(boundingBox: THREE.Box3, padding?: number): void
  
  // Camera configuration
  setFieldOfView(fov: number): void
  setClippingPlanes(near: number, far: number): void
  
  render(): void
  resize(width: number, height: number): void
  handleInput(event: InputEvent): boolean
}
```

**Key Features:**

- Perspective camera with standard 3D controls
- Orbit, pan, dolly navigation
- Content fitting with bounding box calculation
- Configurable camera parameters

## Sprite System

### Sprite (Base Class)

Abstract base class for all renderable objects. Extends THREE.Object3D while adding size, origin, and update management.

```typescript
abstract class Sprite extends THREE.Object3D {
  protected _size: THREE.Vector2 = new THREE.Vector2(100, 100);
  protected _origin: THREE.Vector2 = new THREE.Vector2(0.5, 0.5); // 0-1 normalized
  protected _needsUpdate: boolean = true;
  protected _material: Material;
  
  constructor(material?: Material)
  
  // Core sprite properties
  get size(): THREE.Vector2
  set size(value: THREE.Vector2)
  
  get origin(): THREE.Vector2 // Transform origin point (0-1 normalized)
  set origin(value: THREE.Vector2)
  
  get material(): Material
  set material(value: Material)
  
  // Update system
  markNeedsUpdate(): void
  abstract updateGeometry(): void
  abstract updateMaterial(): void
  update(): void // Called by scene update system
  
  // Hierarchy management
  addChild(child: Sprite): void
  removeChild(child: Sprite): void
  getChildren(): Sprite[]
  
  // Three.js integration
  abstract get mesh(): THREE.Mesh
  get geometry(): THREE.BufferGeometry
  
  // Input handling (managed by InputManager)
  handlePointerEvent(event: PointerEvent, camera: THREE.Camera): boolean
}
```

**Key Features:**

- Size-based positioning with configurable origin point
- Efficient update queue system
- Event handling through raycasting
- Direct access to underlying Three.js mesh and geometry

**Origin System:**

- `(0, 0)` = bottom-left corner
- `(0.5, 0.5)` = center (default)
- `(1, 1)` = top-right corner

### Sprite2D

Flat rectangular sprite optimized for 2D UI elements.

```typescript
class Sprite2D extends Sprite {
  private plane: THREE.PlaneGeometry;
  private _mesh: THREE.Mesh;
  
  constructor(width: number = 100, height: number = 100, material?: Material)
  
  // Geometry access
  get mesh(): THREE.Mesh
  
  // 2D-specific properties
  get texture(): THREE.Texture | null
  set texture(value: THREE.Texture | null)
  
  // Styling
  setStyle(style: StyleSheet): void
  getStyle(): StyleSheet
  
  // Layout helpers
  setAnchor(anchor: AnchorPoint): void // For parent-relative positioning
  setBounds(x: number, y: number, width: number, height: number): void
  
  updateGeometry(): void
  updateMaterial(): void
  
  // Utility methods
  contains(point: THREE.Vector2): boolean
  getBounds(): THREE.Box2
}
```

**Key Features:**

- Plane geometry optimized for UI elements
- Texture support for images and text
- Style system integration
- Bounds checking and layout utilities

### Sprite3D

General-purpose 3D object wrapper that maintains sprite interface while supporting any Three.js geometry.

```typescript
class Sprite3D extends Sprite {
  private _mesh: THREE.Mesh;
  
  constructor(geometry: THREE.BufferGeometry, material?: Material)
  
  // Geometry access and modification
  get mesh(): THREE.Mesh
  get geometry(): THREE.BufferGeometry
  set geometry(value: THREE.BufferGeometry)
  
  // 3D-specific features
  castShadow(cast: boolean): void
  receiveShadow(receive: boolean): void
  setLOD(levels: LODLevel[]): void
  
  // Bounding box for size calculations
  computeBoundingBox(): THREE.Box3
  
  updateGeometry(): void
  updateMaterial(): void
  
  // Animation support
  addAnimation(name: string, animation: THREE.AnimationClip): void
  playAnimation(name: string): void
  stopAnimation(name: string): void
}
```

**Key Features:**

- Support for any Three.js geometry
- Shadow casting and receiving
- LOD (Level of Detail) support
- Animation system integration

## Material System

### Material (Base Class)

Abstract base class that wraps Three.js materials while providing a consistent API and advanced features.

```typescript
abstract class Material {
  protected _threeMaterial: THREE.Material;
  protected _needsUpdate: boolean = false;
  protected _uniforms: { [uniform: string]: THREE.IUniform } = {};
  
  constructor(options: MaterialOptions = {})
  
  // Direct Three.js access
  get threeMaterial(): THREE.Material
  
  // Common properties
  abstract setColor(color: string | number | THREE.Color): void
  abstract setOpacity(opacity: number): void
  abstract setTexture(texture: THREE.Texture | null): void
  
  // Advanced features
  setUniform(name: string, value: any): void
  getUniform(name: string): any
  
  // Shader upgrade system
  protected upgradeToShaderMaterial(): void
  
  // Update system
  markNeedsUpdate(): void
  update(): void
  
  // Material state
  isTransparent(): boolean
  needsUpdate(): boolean
}
```

### BasicMaterial

Standard material for most UI elements with support for fills and borders.

```typescript
class BasicMaterial extends Material {
  constructor(options: BasicMaterialOptions = {})
  
  // Basic properties
  setColor(color: string | number | THREE.Color): void
  setOpacity(opacity: number): void
  setTexture(texture: THREE.Texture | null): void
  
  // Fill properties
  setFillColor(color: string | number | THREE.Color): void
  setFillOpacity(opacity: number): void
  setFillTexture(texture: THREE.Texture | null): void
  
  // Border properties
  setBorderWidth(width: number): void
  setBorderColor(color: string | number | THREE.Color): void
  setBorderOpacity(opacity: number): void
  setBorderStyle(style: 'solid' | 'dashed' | 'dotted'): void
  
  // Advanced styling
  setBorderRadius(radius: number): void
  setGradient(gradient: GradientConfig): void
  
  // State management
  clone(): BasicMaterial
  dispose(): void
}
```

**Border System:**

- Borders are rendered using custom shaders
- Support for solid, dashed, and dotted styles
- Per-corner border radius support
- Anti-aliased rendering

### PhysicalMaterial

PBR material for 3D objects with realistic lighting.

```typescript
class PhysicalMaterial extends Material {
  constructor(options: PhysicalMaterialOptions = {})
  
  // PBR properties
  setMetalness(metalness: number): void
  setRoughness(roughness: number): void
  setNormalMap(texture: THREE.Texture): void
  setMetalnessMap(texture: THREE.Texture): void
  setRoughnessMap(texture: THREE.Texture): void
  
  // Environmental properties
  setEnvironmentMap(texture: THREE.CubeTexture): void
  setEnvironmentIntensity(intensity: number): void
  
  // Advanced features
  setTransmission(transmission: number): void
  setThickness(thickness: number): void
  setClearcoat(clearcoat: number): void
  
  setColor(color: string | number | THREE.Color): void
  setOpacity(opacity: number): void
  setTexture(texture: THREE.Texture | null): void
}
```

## Styling System

### StyleSheet Interface

CSS-like styling interface for 2D sprites.

```typescript
interface StyleSheet {
  // Fill properties
  backgroundColor?: string | THREE.Color;
  backgroundOpacity?: number;
  backgroundTexture?: THREE.Texture;
  
  // Border properties
  borderWidth?: number;
  borderColor?: string | THREE.Color;
  borderOpacity?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  
  // Layout properties
  opacity?: number;
  visible?: boolean;
  
  // Transform properties
  transform?: string; // CSS transform syntax support
}

interface GradientConfig {
  type: 'linear' | 'radial';
  stops: Array<{ offset: number; color: string | THREE.Color }>;
  angle?: number; // For linear gradients (degrees)
  center?: THREE.Vector2; // For radial gradients
}
```

### StyleManager

Centralized style compilation and management.

```typescript
class StyleManager {
  private static instance: StyleManager;
  private shaderCache: Map<string, THREE.ShaderMaterial> = new Map();
  
  static getInstance(): StyleManager
  
  // Style compilation
  compileStyle(style: StyleSheet): Material
  
  // Cache management
  clearCache(): void
  getCacheSize(): number
  
  // Theme support (future extension)
  setTheme(theme: ThemeConfig): void
  getTheme(): ThemeConfig
  
  private hashStyle(style: StyleSheet): string
  private createShaderFromStyle(style: StyleSheet): THREE.ShaderMaterial
  private generateFragmentShader(style: StyleSheet): string
  private generateUniforms(style: StyleSheet): { [uniform: string]: THREE.IUniform }
}
```

## Performance Features

### Instanced Rendering

For rendering many similar objects efficiently.

```typescript
class InstancedSprite2D extends Sprite2D {
  private static instancedMesh: THREE.InstancedMesh;
  private static instances: InstancedSprite2D[] = [];
  private static maxInstances: number = 1000;
  
  private instanceIndex: number;
  
  constructor(width: number, height: number, material?: Material)
  
  // Instance management
  static createInstancedMesh(geometry: THREE.BufferGeometry, material: Material, count: number): void
  static addInstance(sprite: InstancedSprite2D): number
  static removeInstance(sprite: InstancedSprite2D): void
  
  // Instance updates
  updateInstanceMatrix(): void
  updateInstanceColor(color: THREE.Color): void
  
  // Batch operations
  static updateAllInstances(): void
  static render(renderer: THREE.WebGLRenderer, scene: Scene, camera: THREE.Camera): void
  
  // Override parent methods
  updateGeometry(): void // Updates instance matrix instead of geometry
}
```

**Performance Benefits:**

- Single draw call for hundreds/thousands of similar objects
- GPU-side positioning and scaling
- Ideal for UI grids, particle systems, repeated 3D objects

### Update System

Efficient update queue to minimize unnecessary computations.

```typescript
interface UpdateManager {
  // Registration
  register(sprite: Sprite): void
  unregister(sprite: Sprite): void
  
  // Update queue
  markForUpdate(sprite: Sprite): void
  flushUpdates(): void
  
  // Performance monitoring
  getUpdateCount(): number
  getUpdateTime(): number
  
  // Configuration
  setBatchSize(size: number): void
  setUpdateFrequency(fps: number): void
}
```

## Event System Integration

### Event Types

Event maps define the available events and their payloads for each component:

```typescript
interface SceneEventMap {
  'sprite:added': { sprite: Sprite };
  'sprite:removed': { sprite: Sprite };
  'render:start': { timestamp: number };
  'render:end': { timestamp: number; duration: number };
  'update:start': { updateCount: number };
  'update:end': { updateCount: number; duration: number };
}

interface ViewEventMap {
  'resize': { width: number; height: number };
  'camera:change': { camera: THREE.Camera };
  'viewport:change': { x: number; y: number; width: number; height: number };
  'render': { timestamp: number };
  'focus': { view: View };
  'blur': { view: View };
}

interface SpriteEventMap {
  'click': { sprite: Sprite; event: MouseEvent; intersection: THREE.Intersection };
  'hover:enter': { sprite: Sprite; event: MouseEvent; intersection: THREE.Intersection };
  'hover:exit': { sprite: Sprite; event: MouseEvent };
  'drag:start': { sprite: Sprite; event: MouseEvent; startPosition: THREE.Vector2 };
  'drag': { sprite: Sprite; delta: THREE.Vector2; event: MouseEvent };
  'drag:end': { sprite: Sprite; event: MouseEvent; endPosition: THREE.Vector2 };
  'transform': { sprite: Sprite; transform: THREE.Matrix4 };
  'resize': { sprite: Sprite; oldSize: THREE.Vector2; newSize: THREE.Vector2 };
  'focus': { sprite: Sprite };
  'blur': { sprite: Sprite };
  'destroy': { sprite: Sprite };
}

interface MaterialEventMap {
  'update': { material: Material };
  'shader:upgrade': { material: Material; fromType: string; toType: string };
  'texture:load': { material: Material; texture: THREE.Texture };
  'texture:error': { material: Material; error: Error };
}
```

### EventEmitter Integration Pattern

Each component that needs events maintains an `events` property of the EventEmitter class:

```typescript
import { EventEmitter } from './EventEmitter';

// Components extend or compose with EventEmitter
class Scene extends THREE.Scene {
  public readonly events = new EventEmitter<SceneEventMap>();
  private views: Set<View> = new Set();
  private updateQueue: Set<Sprite> = new Set();
  
  addView(view: View): void {
    this.views.add(view);
    this.events.emitEvent('sprite:added', { sprite: view as any }); // Will be refined
  }
  
  removeView(view: View): void {
    this.views.delete(view);
    this.events.emitEvent('sprite:removed', { sprite: view as any });
  }
  
  renderAllViews(): void {
    this.events.emitEvent('render:start', { timestamp: performance.now() });
    const startTime = performance.now();
    
    this.flushUpdates();
    this.views.forEach(view => view.render());
    
    const duration = performance.now() - startTime;
    this.events.emitEvent('render:end', { timestamp: performance.now(), duration });
  }
}

class View {
  public readonly events = new EventEmitter<ViewEventMap>();
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: Scene;
  readonly camera: THREE.Camera;
  
  resize(width: number, height: number): void {
    // Resize logic...
    this.events.emitEvent('resize', { width, height });
  }
  
  render(): void {
    this.renderer.render(this.scene, this.camera);
    this.events.emitEvent('render', { timestamp: performance.now() });
  }
}

class Sprite extends THREE.Object3D {
  public readonly events = new EventEmitter<SpriteEventMap>();
  protected _size: THREE.Vector2 = new THREE.Vector2(100, 100);
  protected _origin: THREE.Vector2 = new THREE.Vector2(0.5, 0.5);
  
  set size(value: THREE.Vector2) {
    const oldSize = this._size.clone();
    this._size.copy(value);
    this.markNeedsUpdate();
    this.events.emitEvent('resize', { sprite: this, oldSize, newSize: this._size });
  }
  
  destroy(): void {
    this.events.emitEvent('destroy', { sprite: this });
    this.events.dispose(); // Clean up event listeners
    // Additional cleanup...
  }
}

class Material {
  public readonly events = new EventEmitter<MaterialEventMap>();
  protected _threeMaterial: THREE.Material;
  
  setTexture(texture: THREE.Texture | null): void {
    // Set texture logic...
    if (texture) {
      this.events.emitEvent('texture:load', { material: this, texture });
    }
    this.events.emitEvent('update', { material: this });
  }
  
  protected upgradeToShaderMaterial(): void {
    const fromType = this._threeMaterial.type;
    // Upgrade logic...
    this.events.emitEvent('shader:upgrade', { 
      material: this, 
      fromType, 
      toType: 'ShaderMaterial' 
    });
  }
}
```

## Usage Examples

### Basic 2D UI Setup

```typescript
import { EventEmitter } from './EventEmitter';

// Create scene and views
const scene = new Scene();
const canvas = document.createElement('canvas');
const view2D = new View2D(scene, new THREE.OrthographicCamera(), canvas);

// Create UI elements
const button = new Sprite2D(100, 40);
button.setStyle({
  backgroundColor: '#4A90E2',
  borderWidth: 2,
  borderColor: '#357ABD',
  borderRadius: 4
});

// Event handling with the events property
button.events.on('click', (data) => {
  console.log('Button clicked!', data.sprite);
});

button.events.on('hover:enter', (data) => {
  button.setStyle({ backgroundColor: '#5BA0F2' }); // Hover effect
});

button.events.on('hover:exit', (data) => {
  button.setStyle({ backgroundColor: '#4A90E2' }); // Reset
});

scene.add(button);
view2D.render();
```

### Multi-View Setup (Quad View)

```typescript
const scene = new Scene();

// Listen to scene events
scene.events.on('render:start', (data) => {
  console.log('Starting render at', data.timestamp);
});

scene.events.on('render:end', (data) => {
  console.log(`Render completed in ${data.duration}ms`);
});

// Create different camera perspectives
const topCamera = new THREE.OrthographicCamera();
topCamera.position.set(0, 100, 0);
topCamera.lookAt(0, 0, 0);

const frontCamera = new THREE.OrthographicCamera();
frontCamera.position.set(0, 0, 100);
frontCamera.lookAt(0, 0, 0);

const perspCamera = new THREE.PerspectiveCamera(75);
perspCamera.position.set(50, 50, 50);
perspCamera.lookAt(0, 0, 0);

// Create views with event handling
const topView = new View2D(scene, topCamera);
const frontView = new View2D(scene, frontCamera);
const perspView = new View3D(scene, perspCamera);

// Listen to view events
topView.events.on('resize', (data) => {
  console.log(`Top view resized to ${data.width}x${data.height}`);
});

perspView.events.on('camera:change', (data) => {
  console.log('3D camera moved', data.camera.position);
});

// All views automatically render the same scene content
scene.renderAllViews();
```

### 3D Object with UI Overlay

```typescript
const scene = new Scene();

// Add 3D content
const geometry = new THREE.BoxGeometry(10, 10, 10);
const material3D = new PhysicalMaterial({
  color: 0x00ff00,
  metalness: 0.3,
  roughness: 0.4
});
const cube = new Sprite3D(geometry, material3D);

// Listen to 3D object events
cube.events.on('click', (data) => {
  console.log('3D cube clicked!');
});

cube.events.on('transform', (data) => {
  console.log('Cube transformed:', data.transform);
});

scene.add(cube);

// Add 2D UI overlay
const label = new Sprite2D(80, 20);
label.setStyle({
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderRadius: 4
});
label.position.set(0, 15, 0); // Position above cube

// Connect label to cube events
cube.events.on('click', () => {
  label.setStyle({ backgroundColor: 'rgba(255, 0, 0, 0.8)' });
});

scene.add(label);

// Both 3D and 2D content render together
```

### Event System Cross-Component Communication

```typescript
// Example: Synchronized multi-view navigation
class QuadViewController {
  private views: View[] = [];
  
  constructor(scene: Scene) {
    this.setupViews(scene);
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    // When one view changes, update others
    this.views.forEach(view => {
      view.events.on('camera:change', (data) => {
        this.synchronizeOtherViews(view, data.camera);
      });
    });
  }
  
  private synchronizeOtherViews(changedView: View, camera: THREE.Camera): void {
    this.views.forEach(view => {
      if (view !== changedView) {
        // Update other views based on the camera change
        // Implementation depends on view type and synchronization needs
      }
    });
  }
}

// Example: Material system responding to sprite events
class SmartMaterial extends BasicMaterial {
  constructor(sprite: Sprite) {
    super();
    this.setupSpriteEventHandlers(sprite);
  }
  
  private setupSpriteEventHandlers(sprite: Sprite): void {
    sprite.events.on('hover:enter', () => {
      this.setFillColor('#FF6B6B'); // Red on hover
    });
    
    sprite.events.on('hover:exit', () => {
      this.setFillColor('#4ECDC4'); // Teal normally
    });
    
    sprite.events.on('click', () => {
      this.setBorderWidth(4); // Thicker border when clicked
    });
  }
}
```

## Implementation Notes

### File Structure

```
src/
  core/
    Scene.ts
    View.ts
    View2D.ts
    View3D.ts
  sprites/
    Sprite.ts
    Sprite2D.ts
    Sprite3D.ts
    InstancedSprite2D.ts
  materials/
    Material.ts
    BasicMaterial.ts
    PhysicalMaterial.ts
  styling/
    StyleSheet.ts
    StyleManager.ts
  events/
    InputManager.ts
    EventTypes.ts
  utils/
    UpdateManager.ts
    MathUtils.ts
```

### Dependencies

- Three.js (r128+)
- TypeScript 4.5+
- Custom EventEmitter implementation (provided)

### Performance Considerations

- Use instanced rendering for >50 similar objects
- Implement frustum culling for large scenes
- Batch style updates to minimize shader recompilation
- Use object pooling for frequently created/destroyed sprites
- Implement LOD for complex 3D objects

### Future Extensions

- Animation system integration
- Layout system (flexbox-style)
- Text rendering system
- Asset loading and management
- Drag-and-drop framework
- Accessibility features