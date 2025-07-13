# UI Library Performance Specifications

## Performance Targets

### Core Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Frame Rate | 60 FPS | With 10,000 visible elements |
| Initial Render | < 100ms | Time to first paint (1,000 elements) |
| Memory Usage | < 100MB | For typical application (5,000 elements) |
| Bundle Size (Core) | < 50KB | Gzipped, excluding Three.js |
| Bundle Size (Full) | < 150KB | Gzipped, including all features |
| Layout Calculation | < 16ms | For 1,000 elements |
| Event Latency | < 8ms | Input to visual response |

### Scaling Targets

| Element Count | Target FPS | Memory Budget | Notes |
|--------------|------------|---------------|-------|
| 100 | 60 | 10MB | Baseline performance |
| 1,000 | 60 | 25MB | Typical application |
| 10,000 | 60 | 100MB | Large application |
| 50,000 | 30 | 500MB | Extreme cases |
| 100,000 | 15 | 1GB | Stress test limit |

## Optimization Strategies

### 1. Rendering Optimizations

#### Draw Call Batching
```typescript
// Batch elements with identical materials
class RenderBatcher {
  private batches: Map<string, ElementBatch> = new Map();
  
  batch(elements: Element[]): RenderBatch[] {
    elements.forEach(element => {
      const key = this.getMaterialKey(element);
      const batch = this.batches.get(key) || new ElementBatch();
      batch.add(element);
      this.batches.set(key, batch);
    });
    
    return Array.from(this.batches.values());
  }
  
  private getMaterialKey(element: Element): string {
    // Generate unique key from appearance properties
    return `${element.appearance.backgroundColor}_${element.appearance.alpha}`;
  }
}
```

#### Instanced Rendering
```typescript
// Use instanced rendering for repeated elements
class InstancedRenderer {
  private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map();
  
  render(elements: Element[]): void {
    const instances = this.groupByGeometry(elements);
    
    instances.forEach((group, geometryKey) => {
      const mesh = this.getOrCreateInstancedMesh(geometryKey, group.length);
      
      group.forEach((element, index) => {
        mesh.setMatrixAt(index, element.matrix);
        mesh.setColorAt(index, element.color);
      });
      
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
    });
  }
}
```

### 2. Memory Optimizations

#### Object Pooling
```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;
  
  constructor(factory: () => T, reset: (obj: T) => void, maxSize = 1000) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }
  
  acquire(): T {
    return this.pool.pop() || this.factory();
  }
  
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.reset(obj);
      this.pool.push(obj);
    }
  }
  
  clear(): void {
    this.pool.length = 0;
  }
}

// Usage
const geometryPool = new ObjectPool(
  () => new THREE.PlaneGeometry(1, 1),
  (geo) => geo.dispose(),
  1000
);
```

#### Texture Atlas
```typescript
class TextureAtlas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private packer: BinPacker;
  private regions: Map<string, AtlasRegion> = new Map();
  
  constructor(size: number = 2048) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d')!;
    this.packer = new BinPacker(size, size);
  }
  
  addTexture(id: string, image: ImageData): AtlasRegion | null {
    const rect = this.packer.pack(image.width, image.height);
    if (!rect) return null;
    
    this.ctx.putImageData(image, rect.x, rect.y);
    
    const region = {
      u1: rect.x / this.canvas.width,
      v1: rect.y / this.canvas.height,
      u2: (rect.x + rect.width) / this.canvas.width,
      v2: (rect.y + rect.height) / this.canvas.height
    };
    
    this.regions.set(id, region);
    return region;
  }
  
  getTexture(): THREE.Texture {
    const texture = new THREE.CanvasTexture(this.canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }
}
```

### 3. Layout Optimizations

#### Layout Caching
```typescript
class LayoutCache {
  private cache: Map<string, LayoutResult> = new Map();
  
  getCacheKey(container: Container): string {
    // Generate key from container state
    return `${container.id}_${container.width}_${container.height}_${container.childrenHash}`;
  }
  
  get(container: Container): LayoutResult | null {
    return this.cache.get(this.getCacheKey(container)) || null;
  }
  
  set(container: Container, result: LayoutResult): void {
    this.cache.set(this.getCacheKey(container), result);
  }
  
  invalidate(container: Container): void {
    this.cache.delete(this.getCacheKey(container));
    // Invalidate parent caches
    if (container.parent) {
      this.invalidate(container.parent);
    }
  }
}
```

#### Incremental Layout
```typescript
class IncrementalLayout {
  private dirtyElements: Set<Element> = new Set();
  private rafId: number | null = null;
  
  markDirty(element: Element): void {
    this.dirtyElements.add(element);
    this.scheduleUpdate();
  }
  
  private scheduleUpdate(): void {
    if (this.rafId !== null) return;
    
    this.rafId = requestAnimationFrame(() => {
      this.performLayout();
      this.rafId = null;
    });
  }
  
  private performLayout(): void {
    // Sort by depth to layout parents first
    const sorted = Array.from(this.dirtyElements).sort((a, b) => 
      a.depth - b.depth
    );
    
    sorted.forEach(element => {
      if (element.parent && !this.dirtyElements.has(element.parent)) {
        element.parent.layoutManager.layoutElement(element);
      }
    });
    
    this.dirtyElements.clear();
  }
}
```

### 4. Culling Strategies

#### Frustum Culling
```typescript
class FrustumCuller {
  private frustum: THREE.Frustum = new THREE.Frustum();
  private matrix: THREE.Matrix4 = new THREE.Matrix4();
  
  cull(camera: THREE.Camera, elements: Element[]): Element[] {
    // Update frustum from camera
    this.matrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.matrix);
    
    return elements.filter(element => {
      const bounds = element.getWorldBounds();
      const box = new THREE.Box3(
        new THREE.Vector3(bounds.left, bounds.top, 0),
        new THREE.Vector3(bounds.right, bounds.bottom, 0)
      );
      return this.frustum.intersectsBox(box);
    });
  }
}
```

#### Occlusion Culling
```typescript
class OcclusionCuller {
  private zBuffer: Map<string, number> = new Map();
  
  cull(elements: Element[]): Element[] {
    // Sort by z-index
    const sorted = elements.sort((a, b) => a.zIndex - b.zIndex);
    const visible: Element[] = [];
    
    sorted.forEach(element => {
      if (this.isVisible(element)) {
        visible.push(element);
        this.updateZBuffer(element);
      }
    });
    
    return visible;
  }
  
  private isVisible(element: Element): boolean {
    const bounds = element.getBounds();
    
    // Check if any pixel is visible
    for (let x = bounds.left; x < bounds.right; x += 10) {
      for (let y = bounds.top; y < bounds.bottom; y += 10) {
        const key = `${x}_${y}`;
        const z = this.zBuffer.get(key) || -Infinity;
        if (element.zIndex > z) return true;
      }
    }
    
    return false;
  }
  
  private updateZBuffer(element: Element): void {
    const bounds = element.getBounds();
    
    for (let x = bounds.left; x < bounds.right; x++) {
      for (let y = bounds.top; y < bounds.bottom; y++) {
        const key = `${x}_${y}`;
        this.zBuffer.set(key, element.zIndex);
      }
    }
  }
}
```

## Performance Monitoring

### Runtime Metrics Collection
```typescript
class PerformanceMonitor {
  private metrics: Map<string, Metric> = new Map();
  
  startMeasure(name: string): void {
    this.metrics.set(name, {
      startTime: performance.now(),
      samples: []
    });
  }
  
  endMeasure(name: string): void {
    const metric = this.metrics.get(name);
    if (!metric) return;
    
    const duration = performance.now() - metric.startTime;
    metric.samples.push(duration);
    
    // Keep last 100 samples
    if (metric.samples.length > 100) {
      metric.samples.shift();
    }
  }
  
  getStats(name: string): Stats {
    const metric = this.metrics.get(name);
    if (!metric) return null;
    
    const samples = metric.samples;
    return {
      avg: samples.reduce((a, b) => a + b, 0) / samples.length,
      min: Math.min(...samples),
      max: Math.max(...samples),
      p95: this.percentile(samples, 0.95),
      p99: this.percentile(samples, 0.99)
    };
  }
  
  private percentile(samples: number[], p: number): number {
    const sorted = [...samples].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}
```

### Performance Debugging
```typescript
class PerformanceDebugger {
  private enabled: boolean = false;
  private overlay: HTMLDivElement;
  
  enable(): void {
    this.enabled = true;
    this.createOverlay();
  }
  
  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
    `;
    document.body.appendChild(this.overlay);
  }
  
  update(stats: RenderStats): void {
    if (!this.enabled) return;
    
    this.overlay.innerHTML = `
      FPS: ${stats.fps.toFixed(1)}<br>
      Draw Calls: ${stats.drawCalls}<br>
      Triangles: ${stats.triangles}<br>
      Elements: ${stats.elementCount}<br>
      Visible: ${stats.visibleCount}<br>
      Memory: ${(stats.memory / 1024 / 1024).toFixed(1)}MB<br>
      Frame Time: ${stats.frameTime.toFixed(2)}ms<br>
      Layout Time: ${stats.layoutTime.toFixed(2)}ms<br>
      Render Time: ${stats.renderTime.toFixed(2)}ms
    `;
  }
}
```

## Benchmarking Suite

### Performance Tests
```typescript
describe('Performance Benchmarks', () => {
  const monitor = new PerformanceMonitor();
  
  test('Render 10,000 elements at 60fps', async () => {
    const view = new View({ width: 1920, height: 1080 });
    const container = new Container();
    
    // Create 10,000 elements
    for (let i = 0; i < 10000; i++) {
      container.add(new Element({
        geometry: { 
          left: Math.random() * 1920,
          top: Math.random() * 1080,
          width: 50,
          height: 50
        }
      }));
    }
    
    view.setRoot(container);
    
    // Measure frame rate over 60 frames
    const frameRates: number[] = [];
    let lastTime = performance.now();
    
    for (let frame = 0; frame < 60; frame++) {
      view.render();
      const now = performance.now();
      const fps = 1000 / (now - lastTime);
      frameRates.push(fps);
      lastTime = now;
    }
    
    const avgFps = frameRates.reduce((a, b) => a + b) / frameRates.length;
    expect(avgFps).toBeGreaterThanOrEqual(60);
  });
  
  test('Layout 1,000 elements in under 16ms', () => {
    const container = new Container({
      layoutManager: new FlexLayout()
    });
    
    for (let i = 0; i < 1000; i++) {
      container.add(new Element());
    }
    
    monitor.startMeasure('layout');
    container.calcLayout();
    monitor.endMeasure('layout');
    
    const stats = monitor.getStats('layout');
    expect(stats.avg).toBeLessThan(16);
  });
  
  test('Memory usage under 100MB for 5,000 elements', () => {
    const initialMemory = performance.memory.usedJSHeapSize;
    const view = new View();
    const container = new Container();
    
    for (let i = 0; i < 5000; i++) {
      container.add(new Element());
    }
    
    view.setRoot(container);
    view.render();
    
    const usedMemory = performance.memory.usedJSHeapSize - initialMemory;
    expect(usedMemory).toBeLessThan(100 * 1024 * 1024);
  });
});
```

## Best Practices

### 1. Element Creation
```typescript
// DON'T: Create elements in render loop
render() {
  elements.forEach(data => {
    const element = new Element(); // Creates new object every frame
    container.add(element);
  });
}

// DO: Reuse elements with object pooling
const elementPool = new ObjectPool(() => new Element());

render() {
  elements.forEach(data => {
    const element = elementPool.acquire();
    element.update(data);
    container.add(element);
  });
}
```

### 2. Property Updates
```typescript
// DON'T: Update multiple properties separately
element.setPosition(x, y);
element.setSize(width, height);
element.setStyle({ backgroundColor: color });

// DO: Batch property updates
element.update({
  geometry: { left: x, top: y, width, height },
  appearance: { backgroundColor: color }
});
```

### 3. Layout Management
```typescript
// DON'T: Force layout on every change
element.setPosition(x, y);
container.calcLayout(); // Expensive!

// DO: Batch layout updates
element.setPosition(x, y);
element.invalidateLayout(); // Mark dirty
// Layout calculated once per frame automatically
```

### 4. Event Handling
```typescript
// DON'T: Add listeners to every element
elements.forEach(element => {
  element.on('click', handleClick);
});

// DO: Use event delegation
container.on('click', (event) => {
  const target = event.target;
  if (target.className === 'button') {
    handleClick(target);
  }
});
```

## Browser Optimization

### WebGL Context Settings
```typescript
const contextAttributes: WebGLContextAttributes = {
  alpha: false,              // Disable alpha for better performance
  antialias: false,         // Disable for better performance
  depth: false,             // Not needed for 2D
  stencil: false,           // Not needed for basic 2D
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false,
  desynchronized: true      // Reduce input latency
};
```

### GPU Memory Management
```typescript
class GPUResourceManager {
  private textureMemory: number = 0;
  private geometryMemory: number = 0;
  private maxTextureMemory: number = 256 * 1024 * 1024; // 256MB
  
  canAllocateTexture(size: number): boolean {
    return this.textureMemory + size <= this.maxTextureMemory;
  }
  
  allocateTexture(texture: THREE.Texture): void {
    const size = texture.image.width * texture.image.height * 4;
    this.textureMemory += size;
  }
  
  freeTexture(texture: THREE.Texture): void {
    const size = texture.image.width * texture.image.height * 4;
    this.textureMemory -= size;
    texture.dispose();
  }
}
```