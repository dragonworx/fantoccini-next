# Declarative Layout Syntax Specification

This document specifies the declarative layout syntax for Fantoccini's UI system. The syntax uses JavaScript Object Literal notation that can be evaluated at runtime to create layout structures.

## Overview

The layout syntax provides a declarative way to define UI layouts using JavaScript object literals. This approach allows for:
- Runtime evaluation and dynamic layout creation
- Type-safe definitions when using TypeScript
- Easy serialization and deserialization
- Intuitive hierarchical structure

## Core Types

### LayoutNode

The base type for all layout nodes. Each node represents a container in the layout hierarchy.

```typescript
interface LayoutNode {
  // Optional arbitrary string tag for identification
  tag?: string;
  
  // Array of child layout nodes
  children: Array<LayoutNode>;
  
  // Geometry properties (from IGeometry)
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  
  // Layout properties (from ILayout)
  padding?: Insets | number;
  margin?: Insets | number;
  alignment?: Alignment;
  layout?: string; // "absolute" | "flex" | "grid" | "stack"
  
  // Additional layout-specific properties
  [key: string]: any;
}
```

### LayoutNodeRoot

A special subclass of LayoutNode that serves as the root of a layout hierarchy.

```typescript
interface LayoutNodeRoot extends LayoutNode {
  // The Container instance created or associated with this layout node
  instance?: Container;
}
```

## Property Access Pattern

With the new getter/setter design, properties are accessed through their respective interfaces:

```javascript
// Accessing geometry properties
const left = element.geometry.left;
const width = element.geometry.width;
element.geometry.left = 100;
element.geometry.top = 50;

// Accessing layout properties
const paddingLeft = element.layout.paddingLeft;
element.layout.marginTop = 20;
element.layout.hAlign = 'center';

// Accessing appearance properties
const bgColor = element.appearance.backgroundColor;
element.appearance.alpha = 0.8;
element.appearance.borderRadius = 10;
```

## Layout Syntax Examples

### Basic Layout

```javascript
const layout = {
  tag: "root",
  width: 800,
  height: 600,
  layout: "absolute",
  children: [
    {
      tag: "header",
      left: 0,
      top: 0,
      width: 800,
      height: 60,
      padding: 10,
      children: []
    },
    {
      tag: "content",
      left: 0,
      top: 60,
      width: 800,
      height: 540,
      children: []
    }
  ]
};
```

### Flex Layout

```javascript
const flexLayout = {
  tag: "flex-container",
  width: 800,
  height: 600,
  layout: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  padding: 20,
  children: [
    {
      tag: "item1",
      width: 200,
      height: 100,
      flexGrow: 1,
      children: []
    },
    {
      tag: "item2",
      width: 200,
      height: 100,
      flexGrow: 2,
      children: []
    }
  ]
};
```

### Grid Layout

```javascript
const gridLayout = {
  tag: "grid-container",
  width: 800,
  height: 600,
  layout: "grid",
  gridTemplateColumns: "1fr 2fr 1fr",
  gridTemplateRows: "auto 1fr auto",
  gap: 10,
  padding: 20,
  children: [
    {
      tag: "header",
      gridColumn: "1 / -1",
      gridRow: "1",
      height: 60,
      children: []
    },
    {
      tag: "sidebar",
      gridColumn: "1",
      gridRow: "2",
      children: []
    },
    {
      tag: "main",
      gridColumn: "2",
      gridRow: "2",
      children: []
    },
    {
      tag: "aside",
      gridColumn: "3",
      gridRow: "2",
      children: []
    },
    {
      tag: "footer",
      gridColumn: "1 / -1",
      gridRow: "3",
      height: 40,
      children: []
    }
  ]
};
```

### Nested Layouts

```javascript
const nestedLayout = {
  tag: "app",
  width: 1024,
  height: 768,
  layout: "flex",
  flexDirection: "column",
  children: [
    {
      tag: "navbar",
      height: 50,
      layout: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: { left: 20, right: 20, top: 0, bottom: 0 },
      children: [
        {
          tag: "logo",
          width: 100,
          height: 30,
          children: []
        },
        {
          tag: "nav-items",
          layout: "flex",
          flexDirection: "row",
          gap: 20,
          children: [
            { tag: "nav-item", width: 80, height: 30, children: [] },
            { tag: "nav-item", width: 80, height: 30, children: [] },
            { tag: "nav-item", width: 80, height: 30, children: [] }
          ]
        }
      ]
    },
    {
      tag: "main-content",
      flexGrow: 1,
      layout: "grid",
      gridTemplateColumns: "200px 1fr",
      children: [
        {
          tag: "sidebar",
          padding: 10,
          children: []
        },
        {
          tag: "content",
          padding: 20,
          children: []
        }
      ]
    }
  ]
};
```

## Layout Application Function

The `applyLayout` function processes the layout object literal and creates the corresponding Container hierarchy.

```javascript
/**
 * Applies a declarative layout to create a Container hierarchy
 * @param {LayoutNodeRoot} layout - The root layout node
 * @param {Container} [container] - Optional existing container to apply layout to
 * @returns {Container} The root container with applied layout
 */
function applyLayout(layout, container) {
  // Implementation details:
  // 1. If container is not provided, create one from the layout node
  // 2. Traverse the layout tree bottom-up (post-order traversal)
  // 3. For each node:
  //    a. Process all children first
  //    b. Create Container instance if needed
  //    c. Apply geometry properties (left, top, width, height)
  //    d. Apply layout properties (padding, margin, alignment)
  //    e. Set up layout manager based on layout property
  //    f. Add processed children to the container
  // 4. Return the root container
}
```

## Property Inheritance

Layout properties follow these inheritance rules:

1. **Geometry properties** (left, top, width, height) are not inherited
2. **Layout manager** is not inherited - each container must specify its own
3. **Padding and margin** are not inherited
4. **Custom properties** specific to layout managers are not inherited

## Layout Manager Configuration

Each layout manager type accepts specific configuration properties:

### Absolute Layout
- No additional properties required
- Children must specify their own positions

### Flex Layout
- `flexDirection`: "row" | "column" | "row-reverse" | "column-reverse"
- `justifyContent`: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly"
- `alignItems`: "flex-start" | "flex-end" | "center" | "stretch" | "baseline"
- `flexWrap`: "nowrap" | "wrap" | "wrap-reverse"
- `gap`: number | { row: number, column: number }

### Grid Layout
- `gridTemplateColumns`: string (CSS grid syntax)
- `gridTemplateRows`: string (CSS grid syntax)
- `gap`: number | { row: number, column: number }
- `justifyItems`: "start" | "end" | "center" | "stretch"
- `alignItems`: "start" | "end" | "center" | "stretch"

### Stack Layout
- `orientation`: "vertical" | "horizontal"
- `spacing`: number
- `alignment`: Alignment

## Type Definitions

### Insets
```typescript
type Insets = {
  left: number;
  top: number;
  right: number;
  bottom: number;
} | number; // number applies to all sides
```

### Alignment
```typescript
type Alignment = {
  horizontal: "left" | "center" | "right" | "stretch";
  vertical: "top" | "center" | "bottom" | "stretch";
};
```

## Usage Example

```javascript
// Define layout
const appLayout = {
  tag: "app-root",
  width: 1024,
  height: 768,
  layout: "flex",
  flexDirection: "column",
  children: [
    // ... layout definition
  ]
};

// Apply layout
const rootContainer = applyLayout(appLayout);

// Or apply to existing container
const existingContainer = new Container();
applyLayout(appLayout, existingContainer);
```

## Validation

The layout system should validate:
1. Required properties are present
2. Property values are of correct types
3. Layout manager specific properties are valid
4. Children array contains valid LayoutNode objects
5. Circular references are not present

## Error Handling

The `applyLayout` function should handle:
1. Invalid layout manager types
2. Missing required properties
3. Invalid property values
4. Circular references in the layout tree
5. Memory constraints for deeply nested layouts

## Performance Considerations

1. **Bottom-up processing** ensures children are sized before parents
2. **Lazy evaluation** of layout properties when possible
3. **Caching** of computed layouts to avoid recalculation
4. **Batch updates** when multiple properties change