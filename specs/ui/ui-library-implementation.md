# UI Library Implementation Guide

## Getting Started

### Installation

```bash
npm install @fantoccini/ui-library three
# or
yarn add @fantoccini/ui-library three
# or
bun add @fantoccini/ui-library three
```

### Basic Setup

```typescript
import { View, Container, Element, FlexLayout } from '@fantoccini/ui-library';

// Create a view
const view = new View({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0xF5F5F5
});

// Append canvas to DOM
document.body.appendChild(view.canvas);

// Create root container
const root = new Container({
  geometry: { left: 0, top: 0, width: view.width, height: view.height },
  layoutManager: new FlexLayout({ direction: 'column', gap: 20 })
});

// Set root and start rendering
view.setRoot(root);
view.startRenderLoop();

// Handle window resize
window.addEventListener('resize', () => {
  view.resize(window.innerWidth, window.innerHeight);
});
```

## Common UI Patterns

### 1. Button Component

```typescript
import { Container, Text, Element } from '@fantoccini/ui-library';

class Button extends Container {
  private background: Element;
  private label: Text;
  private onClick?: () => void;
  
  constructor(text: string, onClick?: () => void) {
    super({
      geometry: { width: 120, height: 40 },
      interactive: true
    });
    
    this.onClick = onClick;
    
    // Background
    this.background = new Element({
      geometry: { left: 0, top: 0, width: 120, height: 40 },
      appearance: {
        backgroundColor: 0x2196F3,
        borderRadius: 4
      }
    });
    
    // Label
    this.label = new Text(text, {
      fontSize: 16,
      color: 0xFFFFFF,
      fontFamily: 'Arial',
      textAlign: 'center'
    });
    
    this.add(this.background);
    this.add(this.label);
    
    // Setup events
    this.setupEvents();
  }
  
  private setupEvents(): void {
    this.on('mouseenter', () => {
      this.background.setStyle({ backgroundColor: 0x1976D2 });
    });
    
    this.on('mouseleave', () => {
      this.background.setStyle({ backgroundColor: 0x2196F3 });
    });
    
    this.on('mousedown', () => {
      this.background.setStyle({ backgroundColor: 0x0D47A1 });
    });
    
    this.on('mouseup', () => {
      this.background.setStyle({ backgroundColor: 0x1976D2 });
    });
    
    this.on('click', () => {
      if (this.onClick) this.onClick();
    });
  }
  
  setText(text: string): void {
    this.label.setText(text);
  }
  
  setEnabled(enabled: boolean): void {
    this.interactive = enabled;
    this.background.setStyle({
      backgroundColor: enabled ? 0x2196F3 : 0x9E9E9E
    });
  }
}

// Usage
const button = new Button('Click Me', () => {
  console.log('Button clicked!');
});
root.add(button);
```

### 2. Input Field Component

```typescript
class InputField extends Container {
  private background: Element;
  private text: Text;
  private cursor: Element;
  private value: string = '';
  private focused: boolean = false;
  
  constructor(placeholder: string = '') {
    super({
      geometry: { width: 200, height: 40 },
      interactive: true
    });
    
    // Background with border
    this.background = new Element({
      geometry: { left: 0, top: 0, width: 200, height: 40 },
      appearance: {
        backgroundColor: 0xFFFFFF,
        borderColor: 0xE0E0E0,
        borderWidth: 1,
        borderRadius: 4
      }
    });
    
    // Text display
    this.text = new Text(placeholder, {
      fontSize: 14,
      color: 0x9E9E9E,
      fontFamily: 'Arial'
    });
    
    // Cursor
    this.cursor = new Element({
      geometry: { left: 10, top: 10, width: 2, height: 20 },
      appearance: { backgroundColor: 0x2196F3 },
      visible: false
    });
    
    this.add(this.background);
    this.add(this.text);
    this.add(this.cursor);
    
    this.setupEvents();
  }
  
  private setupEvents(): void {
    this.on('click', () => this.focus());
    
    // Handle keyboard input when focused
    window.addEventListener('keydown', (e) => {
      if (!this.focused) return;
      
      if (e.key === 'Backspace') {
        this.value = this.value.slice(0, -1);
        this.updateDisplay();
      } else if (e.key.length === 1) {
        this.value += e.key;
        this.updateDisplay();
      }
    });
  }
  
  focus(): void {
    this.focused = true;
    this.cursor.visible = true;
    this.background.setStyle({ borderColor: 0x2196F3 });
    
    // Animate cursor
    this.animateCursor();
  }
  
  blur(): void {
    this.focused = false;
    this.cursor.visible = false;
    this.background.setStyle({ borderColor: 0xE0E0E0 });
  }
  
  private updateDisplay(): void {
    this.text.setText(this.value || this.placeholder);
    this.text.setStyle({
      color: this.value ? 0x424242 : 0x9E9E9E
    });
    
    // Update cursor position
    const textWidth = this.text.getTextBounds().width;
    this.cursor.setPosition(10 + textWidth + 2, 10);
  }
  
  private animateCursor(): void {
    if (!this.focused) return;
    
    this.cursor.visible = !this.cursor.visible;
    setTimeout(() => this.animateCursor(), 500);
  }
  
  getValue(): string {
    return this.value;
  }
  
  setValue(value: string): void {
    this.value = value;
    this.updateDisplay();
  }
}
```

### 3. List Component

```typescript
class List<T> extends Container {
  private items: T[] = [];
  private itemRenderer: (item: T, index: number) => Element;
  private itemHeight: number;
  private virtualScroll: boolean;
  
  constructor(config: {
    itemRenderer: (item: T, index: number) => Element;
    itemHeight: number;
    virtualScroll?: boolean;
  }) {
    super({
      layoutManager: new FlexLayout({ direction: 'column', gap: 0 })
    });
    
    this.itemRenderer = config.itemRenderer;
    this.itemHeight = config.itemHeight;
    this.virtualScroll = config.virtualScroll || false;
  }
  
  setItems(items: T[]): void {
    this.items = items;
    this.updateDisplay();
  }
  
  private updateDisplay(): void {
    this.removeAll();
    
    if (this.virtualScroll) {
      this.renderVirtual();
    } else {
      this.renderAll();
    }
  }
  
  private renderAll(): void {
    this.items.forEach((item, index) => {
      const element = this.itemRenderer(item, index);
      this.add(element);
    });
  }
  
  private renderVirtual(): void {
    const viewportHeight = this.geometry.height;
    const scrollTop = this.getScrollTop();
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.ceil((scrollTop + viewportHeight) / this.itemHeight);
    
    // Add spacer for items above viewport
    if (startIndex > 0) {
      const spacer = new Element({
        geometry: { height: startIndex * this.itemHeight }
      });
      this.add(spacer);
    }
    
    // Render visible items
    for (let i = startIndex; i < Math.min(endIndex, this.items.length); i++) {
      const element = this.itemRenderer(this.items[i], i);
      this.add(element);
    }
    
    // Add spacer for items below viewport
    if (endIndex < this.items.length) {
      const spacer = new Element({
        geometry: { height: (this.items.length - endIndex) * this.itemHeight }
      });
      this.add(spacer);
    }
  }
  
  private getScrollTop(): number {
    // Implement scroll position tracking
    return 0;
  }
}

// Usage
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

const todoList = new List<TodoItem>({
  itemHeight: 50,
  virtualScroll: true,
  itemRenderer: (item, index) => {
    const container = new Container({
      geometry: { height: 50 },
      layoutManager: new FlexLayout({ direction: 'row', gap: 10 })
    });
    
    const checkbox = new Element({
      geometry: { width: 20, height: 20 },
      appearance: {
        backgroundColor: item.completed ? 0x4CAF50 : 0xFFFFFF,
        borderColor: 0xE0E0E0,
        borderWidth: 1,
        borderRadius: 4
      }
    });
    
    const text = new Text(item.text, {
      fontSize: 16,
      color: item.completed ? 0x9E9E9E : 0x424242,
      textDecoration: item.completed ? 'line-through' : 'none'
    });
    
    container.add(checkbox);
    container.add(text);
    
    return container;
  }
});

todoList.setItems([
  { id: '1', text: 'Complete UI Library', completed: false },
  { id: '2', text: 'Write documentation', completed: true },
  { id: '3', text: 'Add examples', completed: false }
]);
```

### 4. Modal Dialog

```typescript
class Modal extends Container {
  private overlay: Element;
  private dialog: Container;
  private titleText: Text;
  private content: Container;
  
  constructor(title: string) {
    super({
      geometry: { left: 0, top: 0, width: '100%', height: '100%' },
      visible: false
    });
    
    // Semi-transparent overlay
    this.overlay = new Element({
      geometry: { left: 0, top: 0, width: '100%', height: '100%' },
      appearance: {
        backgroundColor: 0x000000,
        alpha: 0.5
      }
    });
    
    // Dialog container
    this.dialog = new Container({
      geometry: { width: 400, height: 300 },
      appearance: {
        backgroundColor: 0xFFFFFF,
        borderRadius: 8,
        shadowColor: 0x000000,
        shadowBlur: 20,
        shadowOffsetY: 10
      },
      layoutManager: new FlexLayout({ direction: 'column', gap: 20 })
    });
    
    // Title
    this.titleText = new Text(title, {
      fontSize: 20,
      fontWeight: 'bold',
      color: 0x212121
    });
    
    // Content container
    this.content = new Container({
      layoutManager: new FlexLayout({ direction: 'column', gap: 10 })
    });
    
    // Close button
    const closeButton = new Button('×', () => this.hide());
    closeButton.setPosition(360, 10);
    
    this.dialog.add(this.titleText);
    this.dialog.add(this.content);
    this.dialog.add(closeButton);
    
    this.add(this.overlay);
    this.add(this.dialog);
    
    // Center dialog
    this.centerDialog();
    
    // Close on overlay click
    this.overlay.on('click', () => this.hide());
  }
  
  private centerDialog(): void {
    const viewWidth = this.geometry.width;
    const viewHeight = this.geometry.height;
    const dialogWidth = this.dialog.geometry.width;
    const dialogHeight = this.dialog.geometry.height;
    
    this.dialog.setPosition(
      (viewWidth - dialogWidth) / 2,
      (viewHeight - dialogHeight) / 2
    );
  }
  
  show(): void {
    this.visible = true;
    
    // Animate in
    this.overlay.setStyle({ alpha: 0 });
    this.dialog.setPosition(
      this.dialog.geometry.left,
      this.dialog.geometry.top + 50
    );
    
    // Animate
    this.animateIn();
  }
  
  hide(): void {
    this.animateOut(() => {
      this.visible = false;
    });
  }
  
  setContent(content: Element[]): void {
    this.content.removeAll();
    content.forEach(element => this.content.add(element));
  }
  
  private animateIn(): void {
    // Simple animation implementation
    const duration = 300;
    const start = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);
      
      this.overlay.setStyle({ alpha: 0.5 * eased });
      this.dialog.setPosition(
        this.dialog.geometry.left,
        this.dialog.geometry.top - 50 * eased
      );
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  private animateOut(callback: () => void): void {
    const duration = 200;
    const start = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInCubic(progress);
      
      this.overlay.setStyle({ alpha: 0.5 * (1 - eased) });
      this.dialog.setStyle({ alpha: 1 - eased });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        callback();
      }
    };
    
    animate();
  }
  
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
  
  private easeInCubic(t: number): number {
    return t * t * t;
  }
}

// Usage
const modal = new Modal('Confirm Action');
modal.setContent([
  new Text('Are you sure you want to proceed?', {
    fontSize: 16,
    color: 0x616161
  }),
  new Container({
    layoutManager: new FlexLayout({ 
      direction: 'row', 
      gap: 10,
      justifyContent: 'end'
    }),
    children: [
      new Button('Cancel', () => modal.hide()),
      new Button('Confirm', () => {
        console.log('Confirmed!');
        modal.hide();
      })
    ]
  })
]);

root.add(modal);
```

## Advanced Topics

### Custom Themes

```typescript
interface Theme {
  colors: {
    primary: number;
    secondary: number;
    background: number;
    surface: number;
    text: number;
    textSecondary: number;
    error: number;
    success: number;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: number;
      medium: number;
      large: number;
      xlarge: number;
    };
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
  borderRadius: number;
}

const lightTheme: Theme = {
  colors: {
    primary: 0x2196F3,
    secondary: 0xFF4081,
    background: 0xF5F5F5,
    surface: 0xFFFFFF,
    text: 0x212121,
    textSecondary: 0x757575,
    error: 0xF44336,
    success: 0x4CAF50
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    fontSize: {
      small: 12,
      medium: 16,
      large: 20,
      xlarge: 24
    }
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24
  },
  borderRadius: 4
};

// Theme provider
class ThemeProvider {
  private static current: Theme = lightTheme;
  
  static getTheme(): Theme {
    return this.current;
  }
  
  static setTheme(theme: Theme): void {
    this.current = theme;
    // Trigger re-render of all themed components
  }
}

// Themed button
class ThemedButton extends Button {
  constructor(text: string, onClick?: () => void) {
    const theme = ThemeProvider.getTheme();
    
    super(text, onClick);
    
    this.background.setStyle({
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius
    });
    
    this.label.setStyle({
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSize.medium
    });
  }
}
```

### Animation System

```typescript
class Animation {
  private target: Element;
  private properties: any;
  private duration: number;
  private easing: (t: number) => number;
  private onComplete?: () => void;
  private startTime: number;
  private startValues: any = {};
  private running: boolean = false;
  
  constructor(
    target: Element,
    properties: any,
    duration: number,
    easing: (t: number) => number = (t) => t,
    onComplete?: () => void
  ) {
    this.target = target;
    this.properties = properties;
    this.duration = duration;
    this.easing = easing;
    this.onComplete = onComplete;
  }
  
  start(): void {
    this.startTime = performance.now();
    this.running = true;
    
    // Capture start values
    Object.keys(this.properties).forEach(key => {
      if (key === 'geometry') {
        this.startValues.geometry = { ...this.target.geometry };
      } else if (key === 'appearance') {
        this.startValues.appearance = { ...this.target.appearance };
      }
    });
    
    this.update();
  }
  
  private update(): void {
    if (!this.running) return;
    
    const elapsed = performance.now() - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const eased = this.easing(progress);
    
    // Update properties
    if (this.properties.geometry) {
      const start = this.startValues.geometry;
      const end = this.properties.geometry;
      
      this.target.setPosition(
        start.left + (end.left - start.left) * eased,
        start.top + (end.top - start.top) * eased
      );
      
      if (end.width !== undefined || end.height !== undefined) {
        this.target.setSize(
          start.width + (end.width - start.width) * eased,
          start.height + (end.height - start.height) * eased
        );
      }
    }
    
    if (this.properties.appearance) {
      const start = this.startValues.appearance;
      const end = this.properties.appearance;
      const interpolated: any = {};
      
      Object.keys(end).forEach(key => {
        if (typeof end[key] === 'number') {
          interpolated[key] = start[key] + (end[key] - start[key]) * eased;
        }
      });
      
      this.target.setStyle(interpolated);
    }
    
    if (progress < 1) {
      requestAnimationFrame(() => this.update());
    } else {
      this.running = false;
      if (this.onComplete) this.onComplete();
    }
  }
  
  stop(): void {
    this.running = false;
  }
}

// Easing functions
const Easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    const p = 0.3;
    const s = p / 4;
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1 - s) * (2 * Math.PI) / p);
  },
  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }
};

// Usage
const box = new Element({
  geometry: { left: 0, top: 0, width: 100, height: 100 },
  appearance: { backgroundColor: 0xFF0000 }
});

const animation = new Animation(
  box,
  {
    geometry: { left: 300, top: 200 },
    appearance: { backgroundColor: 0x00FF00 }
  },
  1000,
  Easings.easeOutBounce,
  () => console.log('Animation complete!')
);

animation.start();
```

### Accessibility Implementation

```typescript
class AccessibilityManager {
  private focusedElement: Element | null = null;
  private tabOrder: Element[] = [];
  private announcer: HTMLDivElement;
  
  constructor() {
    this.setupAnnouncer();
    this.setupKeyboardNavigation();
  }
  
  private setupAnnouncer(): void {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('role', 'status');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(this.announcer);
  }
  
  announce(message: string): void {
    this.announcer.textContent = message;
  }
  
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.moveFocus(e.shiftKey ? -1 : 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (this.focusedElement) {
          this.focusedElement.emit('click');
        }
      }
    });
  }
  
  registerElement(element: Element, tabIndex: number = 0): void {
    if (tabIndex >= 0) {
      this.tabOrder.push(element);
      this.tabOrder.sort((a, b) => a.tabIndex - b.tabIndex);
    }
    
    // Create corresponding DOM element for screen readers
    const domElement = document.createElement('div');
    domElement.setAttribute('role', this.getRole(element));
    domElement.setAttribute('tabindex', tabIndex.toString());
    
    if (element instanceof Text) {
      domElement.textContent = element.text;
    }
    
    // Position off-screen but focusable
    domElement.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
    `;
    
    document.body.appendChild(domElement);
    
    // Sync focus state
    domElement.addEventListener('focus', () => {
      this.setFocus(element);
    });
  }
  
  private getRole(element: Element): string {
    if (element instanceof Button) return 'button';
    if (element instanceof InputField) return 'textbox';
    if (element instanceof List) return 'list';
    return 'region';
  }
  
  setFocus(element: Element): void {
    if (this.focusedElement) {
      this.focusedElement.emit('blur');
    }
    
    this.focusedElement = element;
    element.emit('focus');
    
    // Visual focus indicator
    element.setStyle({
      borderColor: 0x2196F3,
      borderWidth: 2
    });
  }
  
  private moveFocus(direction: number): void {
    if (this.tabOrder.length === 0) return;
    
    let index = this.focusedElement 
      ? this.tabOrder.indexOf(this.focusedElement)
      : -1;
    
    index += direction;
    
    if (index < 0) index = this.tabOrder.length - 1;
    if (index >= this.tabOrder.length) index = 0;
    
    this.setFocus(this.tabOrder[index]);
  }
}
```

## Testing Strategies

### Unit Testing

```typescript
import { describe, test, expect } from 'vitest';
import { Element, Container, FlexLayout } from '@fantoccini/ui-library';

describe('Element', () => {
  test('should initialize with default values', () => {
    const element = new Element();
    
    expect(element.geometry.left).toBe(0);
    expect(element.geometry.top).toBe(0);
    expect(element.geometry.width).toBe(100);
    expect(element.geometry.height).toBe(100);
    expect(element.visible).toBe(true);
  });
  
  test('should update position', () => {
    const element = new Element();
    element.setPosition(50, 100);
    
    expect(element.geometry.left).toBe(50);
    expect(element.geometry.top).toBe(100);
  });
  
  test('should emit events', () => {
    const element = new Element();
    let clicked = false;
    
    element.on('click', () => {
      clicked = true;
    });
    
    element.emit('click');
    expect(clicked).toBe(true);
  });
});

describe('Container', () => {
  test('should manage children', () => {
    const container = new Container();
    const child1 = new Element();
    const child2 = new Element();
    
    container.add(child1);
    container.add(child2);
    
    expect(container.children.length).toBe(2);
    expect(container.contains(child1)).toBe(true);
    expect(container.contains(child2)).toBe(true);
  });
  
  test('should apply layout', () => {
    const container = new Container({
      geometry: { width: 300, height: 100 },
      layoutManager: new FlexLayout({ direction: 'row', gap: 10 })
    });
    
    const child1 = new Element({ geometry: { width: 100, height: 50 } });
    const child2 = new Element({ geometry: { width: 100, height: 50 } });
    
    container.add(child1);
    container.add(child2);
    container.calcLayout();
    
    expect(child1.geometry.left).toBe(0);
    expect(child2.geometry.left).toBe(110); // 100 + 10 gap
  });
});
```

### Integration Testing

```typescript
import { test, expect } from '@playwright/test';

test('UI Library renders correctly', async ({ page }) => {
  await page.goto('/test-app');
  
  // Wait for canvas to be ready
  await page.waitForSelector('canvas');
  
  // Take screenshot for visual regression
  await expect(page).toHaveScreenshot('ui-library-initial.png');
  
  // Test interaction
  await page.click('canvas', { position: { x: 100, y: 50 } });
  
  // Verify state change
  await expect(page).toHaveScreenshot('ui-library-clicked.png');
});
```

## Migration Guide

### From DOM to UI Library

```typescript
// Before: DOM-based UI
const button = document.createElement('button');
button.textContent = 'Click Me';
button.style.backgroundColor = '#2196F3';
button.addEventListener('click', handleClick);
document.body.appendChild(button);

// After: UI Library
const button = new Button('Click Me', handleClick);
root.add(button);
```

### From React to UI Library

```typescript
// Before: React component
function MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

// After: UI Library component
class MyComponent extends Container {
  private count: number = 0;
  private countText: Text;
  
  constructor() {
    super({
      layoutManager: new FlexLayout({ direction: 'row', gap: 10 })
    });
    
    this.countText = new Text(this.count.toString());
    const button = new Button('Increment', () => {
      this.count++;
      this.countText.setText(this.count.toString());
    });
    
    this.add(this.countText);
    this.add(button);
  }
}
```

## Troubleshooting

### Common Issues

**1. Black Screen / Nothing Renders**
- Check WebGL support: `console.log(WebGLRenderingContext)`
- Verify view dimensions are non-zero
- Ensure root container is added to view
- Check browser console for WebGL errors

**2. Poor Performance**
- Enable performance monitor to identify bottlenecks
- Reduce element count or enable virtualization
- Check for memory leaks in custom components
- Use object pooling for dynamic elements

**3. Text Not Rendering**
- Ensure fonts are loaded before rendering
- Check text color contrast against background
- Verify text bounds are within parent container

**4. Events Not Working**
- Ensure elements have `interactive: true`
- Check z-index ordering for overlapping elements
- Verify event coordinates match element bounds

### Debug Mode

```typescript
// Enable debug mode
UI.debug = true;

// Show performance overlay
view.showStats = true;

// Log all events
view.on('*', (event) => {
  console.log('Event:', event.type, event.target);
});

// Visualize element bounds
view.showBounds = true;

// Enable WebGL error checking
view.renderer.debug.checkShaderErrors = true;
```

## Resources

- [API Reference](./ui-library-api.md)
- [Architecture Overview](./ui-library-architecture.md)
- [Performance Guide](./ui-library-performance.md)
- [Examples Repository](https://github.com/fantoccini/ui-library-examples)
- [Community Forum](https://forum.fantoccini.dev)