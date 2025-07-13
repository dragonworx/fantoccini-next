# UI Library Specification

## Executive Summary

This specification defines a high-performance WebGL-based UI library optimized for flat 2D interfaces. Built on Three.js, it provides a component-based architecture for creating responsive, accessible user interfaces with superior rendering performance.

### Key Objectives
- **Performance**: Maintain 60fps with 10,000+ UI elements
- **Bundle Size**: Core library under 50KB gzipped
- **Developer Experience**: Intuitive API with TypeScript support
- **Accessibility**: WCAG 2.1 AA compliance built-in

### Problem Statement

Traditional DOM-based UI libraries face performance limitations when rendering thousands of elements. Canvas-based solutions often lack accessibility and standard UI patterns.

This library bridges the gap by providing:

1. WebGL-accelerated rendering for massive element counts
2. Familiar component-based architecture
3. Built-in accessibility through parallel DOM structure
4. Optimized event handling and state management
5. High precision rendering for crisp text and graphics
6. High precision event handling for accurate mouse and touch interactions
7. High precision layout for precise positioning and sizing
8. Integration with Three.js render loop using dirty tracking to minimize processing 

## Documentation Structure

This specification is organized into multiple documents:

1. **[Architecture Overview](./ui-library-architecture.md)** - System design and module relationships
2. **[API Reference](./ui-library-api.md)** - Detailed class and method documentation
3. **[Performance Guide](./ui-library-performance.md)** - Optimization strategies and benchmarks
4. **[Implementation Guide](./ui-library-implementation.md)** - Getting started and best practices

## Core Concepts

### Overview

The library uses a hierarchical component system built on Three.js for rendering. Key concepts include:

- **Elements**: Base building blocks with geometry and appearance
- **Containers**: Elements that can hold and layout children
- **Views**: Top-level render targets managing scenes and cameras
- **Layout Managers**: Flexible positioning systems for responsive design

## Core Features

### Rendering Performance
- **WebGL Acceleration**: Hardware-accelerated rendering via Three.js
- **Instanced Rendering**: Batch similar elements for optimal GPU usage
- **Culling**: Automatic frustum and occlusion culling
- **Object Pooling**: Reuse geometries and materials to minimize GC

### Developer Experience
- **TypeScript First**: Full type definitions and IntelliSense support
- **Declarative API**: Component-based architecture
- **Hot Module Replacement**: Development mode with live updates
- **DevTools Integration**: Custom inspector for debugging

### UI Capabilities
- **Layout System**: Flexbox-inspired responsive layouts
- **Theming**: CSS-in-JS style theming with runtime switching
- **Animation**: Built-in transition and animation support
- **Text Rendering**: SDF-based text with full Unicode support

### Accessibility & Interaction
- **Screen Reader Support**: Parallel DOM structure for assistive technologies
- **Keyboard Navigation**: Full keyboard support with focus management
- **Touch Support**: Multi-touch gestures and mobile optimization
- **WCAG Compliance**: Built-in color contrast and sizing validators

### Performance Targets
- **Initial Render**: < 100ms for 1000 elements
- **Frame Rate**: 60fps with 10,000 visible elements
- **Memory Usage**: < 100MB for typical applications
- **Bundle Size**: Core < 50KB, full featured < 150KB gzipped

## Architecture Overview

The library follows a modular, layered architecture designed for performance and extensibility. See [Architecture Document](./ui-library-architecture.md) for detailed diagrams and relationships.

### Core Layers

1. **Rendering Layer**
   - WebGL context management
   - Three.js scene optimization
   - Batch rendering pipeline
   - Shader management

2. **Component Layer**
   - Element lifecycle management
   - Property validation and diffing
   - Hierarchy management
   - Update scheduling

3. **Layout Layer**
   - Constraint solving
   - Responsive calculations
   - Caching and invalidation
   - Custom layout managers

4. **Interaction Layer**
   - Event dispatching
   - Gesture recognition
   - Focus management
   - State machines

### Module Dependencies

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   View      │────▶│  Container   │────▶│   Element   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Renderer   │     │LayoutManager │     │  Geometry   │
└─────────────┘     └──────────────┘     └─────────────┘
```

### Elements

The `Element` is the composable building block of the user interface. It is responsible for managing the state, appearance, and behavior of the user interface. The element has geometry, appearance, and layout properties. Elements cannot contain children by default - use `Container` for hierarchical structures. See [API Reference](./ui-library-api.md#element) for detailed documentation.

### Core Geometry

Each element has core geometry properties which define its bounding box, relative to its parent. The system is optimized for performance and simplicity. Rotation and scale are not provided as native properties but can be achieved through custom rendering. The element defines these core geometric properties:

- `left` - X position relative to parent
- `top` - Y position relative to parent
- `width` - Element width in pixels
- `height` - Element height in pixels

See [API Reference](./ui-library-api.md#geometry) for the complete `IGeometry` interface.

### Appearance

Each element has an appearance property which controls its visual styling. The appearance system supports:

- `alpha` - Opacity value between 0 and 1
- `backgroundColor` - Hex color value (e.g., 0xFFFFFF)
- `borderColor` - Hex color value for borders
- `borderWidth` - Border width in pixels
- `borderRadius` - Corner radius in pixels
- `shadowColor` - Drop shadow color (optional)
- `shadowBlur` - Shadow blur radius (optional)
- `shadowOffsetX/Y` - Shadow offset (optional)

See [API Reference](./ui-library-api.md#appearance) for the complete `IAppearance` interface.

### Containers

`Container` is a specialized `Element` that can contain and manage child elements. Unlike base Elements, Containers provide:

- **Child Management**: Add, remove, and organize child elements
- **Layout Management**: Automatic positioning via pluggable layout managers
- **Update Propagation**: Cascading updates through the element tree
- **Event Bubbling**: Event propagation from children to parents

Containers use `LayoutManager` instances to calculate child positions. When `calcLayout()` is called, the layout manager determines the position and size of each child based on the container's constraints and the layout algorithm.

See [API Reference](./ui-library-api.md#container) for methods and [Architecture](./ui-library-architecture.md#layout-engine) for layout system details.

### Layout System

The layout system provides flexible, performant positioning of elements. Layout calculation follows a top-down constraint propagation model:

#### Layout Algorithm

1. **Constraint Propagation** (Top-Down)
   - Parent provides available space to children
   - Children calculate their preferred sizes
   - Layout manager applies positioning rules

2. **Size Calculation** (Bottom-Up)
   - Leaf elements report intrinsic sizes
   - Containers aggregate child sizes
   - Constraints are resolved at each level

3. **Position Assignment** (Top-Down)
   - Final positions calculated from root
   - Transforms applied to Three.js objects
   - Dirty flags cleared

4. **Optimization**
   - Layout caching for unchanged subtrees
   - Batch position updates
   - Async layout for large trees

Each element has a `layout` property which holds the layout system options. Layout managers can use these values to position elements correctly, and can interpret them as needed. The layout system options are:

- `paddingLeft` - A value representing the left padding of the element.
- `paddingRight` - A value representing the right padding of the element.
- `paddingTop` - A value representing the top padding of the element.
- `paddingBottom` - A value representing the bottom padding of the element.
- `marginLeft` - A value representing the left margin of the element.
- `marginRight` - A value representing the right margin of the element.
- `marginTop` - A value representing the top margin of the element.
- `marginBottom` - A value representing the bottom margin of the element.
- `hAlign` - A value representing the horizontal alignment of the element.
- `vAlign` - A value representing the vertical alignment of the element.

The same layout settings are available to different layout managers.

Layout needs to be calculated before a view could be seen, this should be done when the view first shows a new root, and any time the root or any children call `calcLayout()`.

#### Layout Managers

Layout managers implement positioning algorithms for container children. They follow the `ILayoutManager` interface and are responsible for:

- **Position Calculation**: Determining child element positions
- **Size Constraints**: Respecting min/max sizes and flex properties
- **Space Distribution**: Managing gaps, padding, and alignment
- **Performance**: Caching calculations to avoid redundant work

**Available Layout Managers:**

- **AbsoluteLayout**: Positions elements using absolute coordinates
- **FlexLayout**: Implements flexbox-style layout algorithm
- **GridLayout**: Arranges elements in a grid pattern
- **StackLayout**: Stacks elements vertically or horizontally

Layout is calculated on-demand (push-based), not continuously polled. This ensures optimal performance by only recalculating when necessary.

See [API Reference](./ui-library-api.md#layout-managers) for implementation details and [Performance Guide](./ui-library-performance.md#layout-optimizations) for optimization strategies.

## Text

`Text` is a specialized `Element` for high-quality text rendering using SDF (Signed Distance Field) techniques via the Troika-three-text library.

**Key Features:**

- **Typography**: Full font family, size, weight, and style support
- **Layout**: Text wrapping, alignment, and line height control
- **Styling**: Colors, decorations (underline, strikethrough)
- **Performance**: Glyph caching and texture atlasing
- **Unicode**: Full international character support
- **Accessibility**: Screen reader compatible

**Text-Specific Properties:**

- Font properties (family, size, weight, style)
- Text alignment (left, center, right, justify)
- Line height and letter spacing
- Max lines with ellipsis support
- Word wrap and break modes

Text automatically wraps within its bounding box. Changing text content may require layout recalculation if size changes.

See [API Reference](./ui-library-api.md#text) for the complete API and [Implementation Guide](./ui-library-implementation.md#input-field-component) for text input examples.

## Render Loop Integration and Dirty Tracking

The library implements an efficient update strategy that integrates with Three.js's render loop to minimize unnecessary processing. This system ensures optimal performance even when called on every frame.

### Dirty Tracking Strategy

The dirty tracking system uses a multi-level approach to track changes and minimize processing:

1. **Element-Level Dirty Flags**
   - Each element maintains dirty flags for different properties:
     - `geometryDirty`: Position or size changed
     - `appearanceDirty`: Visual properties changed
     - `layoutDirty`: Children or layout properties changed
     - `contentDirty`: Text or other content changed
   - Flags are set when properties change and cleared after processing

2. **Hierarchical Propagation**
   - Changes propagate up the element tree to mark parent containers
   - Layout changes propagate down to invalidate child positions
   - Batch multiple changes within a single frame

3. **Update Queues**
   - Separate queues for different update types:
     - Geometry updates (position/size)
     - Appearance updates (colors/styles)
     - Layout recalculations
     - Content updates (text/images)
   - Process queues in optimal order to minimize redundant work

### Three.js Timer Integration

The library can be integrated with Three.js render loop in two modes:

1. **Automatic Mode** (Recommended)
   ```typescript
   // View manages its own render loop
   view.startRenderLoop();
   ```
   - View creates internal `requestAnimationFrame` loop
   - Checks dirty flags before rendering
   - Skips frames when no updates needed
   - Monitors performance and adjusts accordingly

2. **Manual Mode** (For existing Three.js apps)
   ```typescript
   // Call from your existing render loop
   function animate() {
     requestAnimationFrame(animate);
     
     // Update UI if needed (checks dirty flags internally)
     if (view.needsUpdate()) {
       view.update(deltaTime);
     }
     
     // Your other Three.js rendering
     renderer.render(scene, camera);
   }
   ```

### Update Processing Pipeline

When called on each frame, the system processes updates efficiently:

1. **Check Phase** (< 0.1ms)
   - Quick scan of dirty flag tree
   - Early exit if no updates needed
   - Build update queues if changes detected

2. **Layout Phase** (if needed)
   - Process only dirty subtrees
   - Cache unchanged calculations
   - Batch position updates

3. **Render Phase** (if needed)
   - Update only changed Three.js objects
   - Batch GPU uploads
   - Reuse unchanged materials/geometries

### Performance Optimizations

1. **Early Exit Conditions**
   - No dirty flags set → skip entire update
   - Element not visible → skip processing
   - Element outside viewport → skip rendering

2. **Batching Strategies**
   - Collect all property changes before processing
   - Combine multiple layout invalidations
   - Batch Three.js object updates

3. **Caching Mechanisms**
   - Layout calculation results
   - Computed styles
   - Text metrics
   - GPU resources

4. **Frame Budget Management**
   - Monitor time spent per frame
   - Defer non-critical updates if approaching 16ms
   - Process updates incrementally over multiple frames

### Implementation Example

```typescript
class View {
  private dirtyElements = new Set<Element>();
  private updateQueued = false;
  private lastUpdateTime = 0;
  
  // Called by elements when properties change
  markDirty(element: Element, flags: DirtyFlags): void {
    element.dirtyFlags |= flags;
    this.dirtyElements.add(element);
    
    // In automatic mode, schedule update
    if (this.autoRender && !this.updateQueued) {
      this.updateQueued = true;
      requestAnimationFrame(() => this.processUpdates());
    }
  }
  
  // For manual integration - check if update needed
  needsUpdate(): boolean {
    return this.dirtyElements.size > 0;
  }
  
  // Process all pending updates
  private processUpdates(): void {
    const startTime = performance.now();
    
    // Quick exit if nothing to update
    if (this.dirtyElements.size === 0) {
      this.updateQueued = false;
      return;
    }
    
    // Process updates with frame budget
    this.updateLayout();
    this.updateAppearance();
    this.updateThreeObjects();
    
    // Clear processed elements
    this.dirtyElements.clear();
    this.updateQueued = false;
    
    // Track performance
    this.lastUpdateTime = performance.now() - startTime;
  }
}
```

This approach ensures the library can be safely called every frame while maintaining optimal performance through intelligent dirty tracking and update batching.

## Views

`View` is the top-level rendering context that manages the WebGL canvas, Three.js scene, and root container. It serves as the bridge between your UI components and the browser's rendering pipeline.

**Core Responsibilities:**

- **WebGL Management**: Canvas creation and context configuration
- **Scene Graph**: Three.js scene and camera setup
- **Render Loop**: Optimized frame rendering with dirty checking (see [Render Loop Integration](#render-loop-integration-and-dirty-tracking))
- **Event System**: Mouse/touch event capture and dispatch
- **Performance**: Frame rate monitoring and optimization
- **Dirty Tracking**: Efficient update detection and processing

**Key Properties:**

- `canvas`: HTMLCanvasElement (provided or auto-created)
- `renderer`: THREE.WebGLRenderer instance
- `scene`: THREE.Scene for the UI elements
- `camera`: THREE.OrthographicCamera (2D projection)
- `root`: Root Container element

**Lifecycle Methods:**

- `setRoot()`: Attach root container
- `startRenderLoop()`: Begin automatic rendering
- `stopRenderLoop()`: Pause rendering
- `resize()`: Handle viewport changes
- `dispose()`: Clean up resources

See [API Reference](./ui-library-api.md#view) for complete method signatures and [Architecture](./ui-library-architecture.md#render-pipeline) for rendering pipeline details.

## Events

The event system provides unified handling for mouse, touch, and keyboard interactions. Events follow standard web event patterns with bubbling and capturing phases.

**Supported Event Types:**

- **Mouse Events**: click, mousedown, mouseup, mousemove, mouseenter, mouseleave
- **Touch Events**: touchstart, touchmove, touchend
- **Keyboard Events**: keydown, keyup, keypress
- **Focus Events**: focus, blur
- **State Events**: mount, unmount, resize, visibilitychange

**Event Flow:**

1. **Capture Phase**: Events travel down from root to target
2. **Target Phase**: Event reaches the target element
3. **Bubble Phase**: Events bubble up from target to root

**Performance Optimizations:**

- Event delegation for large element counts
- Synthetic event pooling
- Efficient hit testing with spatial indexing

See [API Reference](./ui-library-api.md#events) for event interfaces and [Implementation Guide](./ui-library-implementation.md#event-handling) for usage examples.

## Related Documentation

- **[API Reference](./ui-library-api.md)** - Complete class and method documentation
- **[Architecture Document](./ui-library-architecture.md)** - System design and module relationships
- **[Performance Guide](./ui-library-performance.md)** - Optimization strategies and benchmarks
- **[Implementation Guide](./ui-library-implementation.md)** - Getting started and best practices
