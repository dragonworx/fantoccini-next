# Graphics Rendering Library Specification

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Structure](#component-structure)
4. [Layout System Integration](#layout-system-integration)
5. [Text System](#text-system)
6. [Event System](#event-system)
7. [Rendering Pipeline](#rendering-pipeline)
8. [Performance Optimization](#performance-optimization)
9. [API Reference](#api-reference)
10. [Implementation Plan](#implementation-plan)
11. [Testing Strategy](#testing-strategy)
12. [Extension Points](#extension-points)

## Overview

The Graphics Rendering Library is a high-performance 2D graphics system built on HTML5 Canvas. It provides a hierarchical element system with DOM-like nesting, flexible layout powered by Yoga, and optimized rendering with layer compositing and efficient object picking.

### Key Features
- **Canvas-Based Rendering**: Hardware-accelerated 2D canvas rendering
- **Hierarchical Elements**: DOM-like element tree with parent-child relationships
- **Flexible Layout**: Yoga layout engine integration with reactive updates
- **Advanced Text System**: Rich text rendering with line breaking, justification, and bidirectional support
- **Layer System**: Multi-layer rendering with compositing and alpha blending
- **Event Handling**: Complete interactive event system with efficient object picking
- **Performance Optimized**: Dirty flag optimization, viewport culling, and batched rendering
- **Shadow DOM**: Synchronized Yoga node tree for layout calculations

### Technical Requirements
- **Framework**: Pure TypeScript with Canvas API
- **Layout**: Facebook Yoga layout engine
- **Events**: Type-safe event system using EventEmitter architecture
- **Performance**: 60fps rendering with thousands of elements
- **Memory**: Efficient object pooling and garbage collection optimization

## Architecture

### System Integration
```
┌─────────────────────────────────────────────────────────────────┐
│                 Graphics Rendering Library                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │     View        │    │     Layout      │    │   Event     │  │
│  │   Management    │◄──►│    System       │◄──►│   System    │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Element       │    │    Rendering    │    │   Object    │  │
│  │   Hierarchy     │◄──►│    Pipeline     │◄──►│   Picking   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │     Layer       │    │      Yoga       │    │  Viewport   │  │
│  │   Compositing   │◄──►│  Shadow DOM     │◄──►│   Culling   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Architecture
```typescript
interface GraphicsLibraryArchitecture {
  // Core Elements
  elements: {
    base: BaseElement;
    box: BoxElement;
    custom: CustomElement[];
  };
  
  // View Management
  views: {
    root: RootView;
    nested: NestedView[];
    layers: LayerView[];
  };
  
  // Layout System
  layout: {
    yoga: YogaLayoutEngine;
    shadowDOM: YogaShadowDOM;
    calculator: LayoutCalculator;
  };
  
  // Rendering Pipeline
  rendering: {
    pipeline: RenderPipeline;
    compositor: LayerCompositor;
    optimizer: RenderOptimizer;
  };
  
  // Event System
  events: {
    emitter: EventEmitter;
    picker: ObjectPicker;
    handlers: EventHandlerRegistry;
  };
}
```

## Component Structure

### File Organization
```
src/core/graphics/
├── elements/
│   ├── BaseElement.ts               # Core element base class
│   ├── BoxElement.ts                # Basic box element implementation
│   └── ElementRegistry.ts           # Element type registration
├── views/
│   ├── View.ts                      # Base view class
│   ├── RootView.ts                  # Root view with canvas mounting
│   ├── Layer.ts                     # Layer implementation
│   └── ViewportManager.ts           # Viewport and culling management
├── layout/
│   ├── YogaLayoutEngine.ts          # Yoga integration
│   ├── YogaShadowDOM.ts             # Shadow DOM synchronization
│   ├── LayoutCalculator.ts          # Layout computation
│   └── LayoutTypes.ts               # Layout property types
├── rendering/
│   ├── RenderPipeline.ts            # Main rendering pipeline
│   ├── LayerCompositor.ts           # Layer compositing
│   ├── RenderOptimizer.ts           # Performance optimizations
│   └── CanvasRenderer.ts            # Canvas drawing operations
├── events/
│   ├── ObjectPicker.ts              # Efficient hit testing
│   ├── EventDispatcher.ts           # Event routing and dispatch
│   ├── InteractionEvents.ts         # Mouse/keyboard event types
│   └── RectMap.ts                   # Spatial indexing for picking
├── types/
│   ├── GraphicsTypes.ts             # Core type definitions
│   ├── ElementTypes.ts              # Element-specific types
│   ├── RenderTypes.ts               # Rendering types
│   └── LayoutTypes.ts               # Layout types
└── utils/
    ├── MathUtils.ts                 # Mathematical utilities
    ├── ColorUtils.ts                # Color manipulation
    ├── TransformUtils.ts            # Transform calculations
    └── PerformanceUtils.ts          # Performance monitoring
```

### Core Element APIs

#### BaseElement
```typescript
abstract class BaseElement extends EventEmitter<ElementEventMap> {
  // Core Properties
  readonly id: string;
  readonly view: View;
  readonly yogaNode: YogaNode;
  
  // Hierarchy
  parent: BaseElement | null;
  children: BaseElement[];
  
  // Layout Properties (mirror Yoga)
  width: number | 'auto' | Percentage;
  height: number | 'auto' | Percentage;
  margin: EdgeValues;
  padding: EdgeValues;
  position: 'relative' | 'absolute';
  flexDirection: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent: JustifyContent;
  alignItems: AlignItems;
  flexWrap: FlexWrap;
  flexGrow: number;
  flexShrink: number;
  flexBasis: number | 'auto' | Percentage;
  
  // Visual Properties
  visible: boolean;
  opacity: number;
  backgroundColor: Color | null;
  borderColor: Color | null;
  borderWidth: EdgeValues;
  borderRadius: CornerValues;
  
  // Transform
  transform: Transform2D;
  
  // Computed Layout (read-only)
  readonly computedLayout: LayoutResult;
  readonly absoluteBounds: Rectangle;
  readonly localBounds: Rectangle;
  
  // Lifecycle
  constructor(view: View, options?: ElementOptions);
  
  // Hierarchy Management
  appendChild(child: BaseElement): void;
  removeChild(child: BaseElement): void;
  insertChild(child: BaseElement, index: number): void;
  removeFromParent(): void;
  
  // Layout
  invalidateLayout(): void;
  calculateLayout(): void;
  setLayoutProperty<K extends keyof LayoutProperties>(
    property: K, 
    value: LayoutProperties[K]
  ): void;
  
  // Rendering
  render(context: CanvasRenderingContext2D): void;
  protected renderBackground(context: CanvasRenderingContext2D): void;
  protected renderBorder(context: CanvasRenderingContext2D): void;
  protected renderContent(context: CanvasRenderingContext2D): void;
  
  // Events
  addEventListener<K extends keyof ElementEventMap>(
    type: K, 
    listener: EventListener<ElementEventMap[K]>
  ): EventUnsubscriber;
  
  // Utilities
  containsPoint(x: number, y: number): boolean;
  getElementAt(x: number, y: number): BaseElement | null;
  getBoundingClientRect(): Rectangle;
  dispose(): void;
}
```

#### BoxElement
```typescript
class BoxElement extends BaseElement {
  // Additional Properties
  content: string | HTMLImageElement | null;
  textAlign: 'left' | 'center' | 'right';
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | number;
  textColor: Color;
  
  constructor(view: View, options?: BoxElementOptions);
  
  // Content Management
  setContent(content: string | HTMLImageElement): void;
  clearContent(): void;
  
  // Text Properties
  setTextStyle(style: TextStyle): void;
  measureText(): TextMetrics;
  
  // Override rendering for content
  protected renderContent(context: CanvasRenderingContext2D): void;
}
```

#### View
```typescript
class View extends EventEmitter<ViewEventMap> {
  // Core Properties
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly rootElement: BaseElement;
  readonly layers: Layer[];
  
  // Layout Integration
  readonly yogaEngine: YogaLayoutEngine;
  readonly shadowDOM: YogaShadowDOM;
  
  // Rendering
  readonly renderPipeline: RenderPipeline;
  readonly objectPicker: ObjectPicker;
  
  // Viewport
  viewport: Viewport;
  pixelRatio: number;
  
  constructor(width: number, height: number, options?: ViewOptions);
  
  // DOM Integration
  mount(container: HTMLElement): void;
  unmount(): void;
  
  // Layer Management
  createLayer(options?: LayerOptions): Layer;
  removeLayer(layer: Layer): void;
  setLayerOrder(layer: Layer, order: number): void;
  
  // Element Management
  createElement<T extends BaseElement>(
    type: ElementConstructor<T>, 
    options?: ElementOptions
  ): T;
  
  // Layout
  calculateLayout(): void;
  invalidateLayout(): void;
  
  // Rendering
  render(): void;
  invalidate(): void;
  setViewport(viewport: Viewport): void;
  
  // Events
  dispatchEvent(event: InteractionEvent): void;
  
  // Utilities
  getElementAt(x: number, y: number): BaseElement | null;
  screenToLocal(screenX: number, screenY: number): Point;
  localToScreen(localX: number, localY: number): Point;
  
  dispose(): void;
}
```

## Layout System Integration

### Yoga Integration Architecture
```typescript
interface YogaLayoutEngine {
  // Core Yoga Integration
  readonly yogaConfig: YogaConfig;
  readonly rootNode: YogaNode;
  
  // Shadow DOM Management
  createNode(element: BaseElement): YogaNode;
  removeNode(element: BaseElement): void;
  syncNodeProperties(element: BaseElement): void;
  
  // Layout Calculation
  calculateLayout(width?: number, height?: number): void;
  getComputedLayout(node: YogaNode): LayoutResult;
  
  // Dirty Flag Optimization
  markDirty(node: YogaNode): void;
  isDirty(node: YogaNode): boolean;
  
  // Tree Operations
  appendChild(parent: YogaNode, child: YogaNode): void;
  removeChild(parent: YogaNode, child: YogaNode): void;
  insertChild(parent: YogaNode, child: YogaNode, index: number): void;
}

interface YogaShadowDOM {
  // Node Mapping
  readonly elementToNode: WeakMap<BaseElement, YogaNode>;
  readonly nodeToElement: WeakMap<YogaNode, BaseElement>;
  
  // Synchronization
  syncElement(element: BaseElement): void;
  syncSubtree(element: BaseElement): void;
  
  // Tree Maintenance
  onElementAdded(element: BaseElement): void;
  onElementRemoved(element: BaseElement): void;
  onElementReordered(parent: BaseElement): void;
  
  // Property Sync
  syncLayoutProperties(element: BaseElement): void;
  syncFlexProperties(element: BaseElement): void;
  syncPositionProperties(element: BaseElement): void;
}
```

### Layout Properties Interface
```typescript
interface LayoutProperties {
  // Size
  width: number | 'auto' | Percentage;
  height: number | 'auto' | Percentage;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  
  // Spacing
  margin: EdgeValues;
  padding: EdgeValues;
  
  // Position
  position: 'relative' | 'absolute';
  top: number | 'auto' | Percentage;
  right: number | 'auto' | Percentage;
  bottom: number | 'auto' | Percentage;
  left: number | 'auto' | Percentage;
  
  // Flexbox
  flexDirection: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignSelf: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignContent: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';
  
  // Flex Item
  flexGrow: number;
  flexShrink: number;
  flexBasis: number | 'auto' | Percentage;
  
  // Aspect Ratio
  aspectRatio: number | 'auto';
}

type EdgeValues = {
  top: number;
  right: number;
  bottom: number;
  left: number;
} | number;

type CornerValues = {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
} | number;

type Percentage = {
  value: number;
  unit: '%';
};
```

## Text System

The Text System provides comprehensive text rendering capabilities with advanced typography features, bidirectional text support, and intelligent line breaking. It integrates seamlessly with the Yoga layout system to provide flexible text flow and positioning.

### Text System Architecture

```typescript
interface TextSystemArchitecture {
  // Core Text Components
  elements: {
    text: TextElement;
    richText: RichTextElement;
    textBlock: TextBlockElement;
  };
  
  // Text Processing
  processing: {
    parser: TextParser;
    layoutEngine: TextLayoutEngine;
    lineBreaker: LineBreaker;
    bidiResolver: BidiResolver;
  };
  
  // Typography
  typography: {
    fontManager: FontManager;
    textMetrics: TextMetrics;
    glyphCache: GlyphCache;
  };
  
  // Rendering
  rendering: {
    textRenderer: TextRenderer;
    fontRenderer: FontRenderer;
    effectsRenderer: TextEffectsRenderer;
  };
}
```

### Core Text Components

#### TextElement
```typescript
class TextElement extends BaseElement {
  // Text Content
  text: string;
  
  // Typography Properties
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  fontVariant: FontVariant;
  
  // Text Layout
  textAlign: TextAlign;
  textDirection: TextDirection;
  lineHeight: number | 'normal';
  letterSpacing: number;
  wordSpacing: number;
  
  // Text Color and Effects
  color: Color;
  textShadow: TextShadow[];
  textStroke: TextStroke | null;
  
  // Text Flow
  whiteSpace: WhiteSpace;
  wordBreak: WordBreak;
  lineBreak: LineBreak;
  hyphens: Hyphens;
  
  // Overflow Handling
  textOverflow: TextOverflow;
  maxLines: number | null;
  
  // Computed Properties (read-only)
  readonly textMetrics: ComputedTextMetrics;
  readonly lineData: TextLine[];
  readonly textBounds: Rectangle;
  
  constructor(view: View, options?: TextElementOptions);
  
  // Content Management
  setText(text: string): void;
  appendText(text: string): void;
  insertText(text: string, position: number): void;
  deleteText(start: number, end: number): void;
  
  // Typography
  setFont(font: FontProperties): void;
  setTextStyle(style: TextStyleProperties): void;
  
  // Text Measurement
  measureText(): TextMeasurement;
  getCharacterAt(x: number, y: number): number;
  getPositionAt(characterIndex: number): Point;
  
  // Text Selection
  selectText(start: number, end: number): void;
  getSelectedText(): string;
  clearSelection(): void;
  
  // Line Information
  getLineCount(): number;
  getLineAt(y: number): number;
  getLineText(lineIndex: number): string;
  getLineBounds(lineIndex: number): Rectangle;
  
  // Override rendering for text
  protected renderContent(context: CanvasRenderingContext2D): void;
  
  // Text-specific layout integration
  protected calculateTextLayout(): void;
  protected invalidateTextLayout(): void;
}
```

#### RichTextElement
```typescript
interface TextSpan {
  text: string;
  style: TextStyleProperties;
  start: number;
  end: number;
}

class RichTextElement extends TextElement {
  // Rich Text Content
  spans: TextSpan[];
  defaultStyle: TextStyleProperties;
  
  constructor(view: View, options?: RichTextElementOptions);
  
  // Span Management
  addSpan(span: TextSpan): void;
  removeSpan(spanId: string): void;
  updateSpan(spanId: string, properties: Partial<TextSpan>): void;
  getSpanAt(characterIndex: number): TextSpan | null;
  
  // Style Management
  setStyleRange(start: number, end: number, style: Partial<TextStyleProperties>): void;
  clearStyleRange(start: number, end: number): void;
  getStyleAt(characterIndex: number): TextStyleProperties;
  
  // Rich Text Parsing
  parseHTML(html: string): void;
  parseMarkdown(markdown: string): void;
  toHTML(): string;
  toMarkdown(): string;
  
  // Override rendering for rich text
  protected renderContent(context: CanvasRenderingContext2D): void;
}
```

### Text Layout Engine

#### TextLayoutEngine
```typescript
class TextLayoutEngine {
  private fontManager: FontManager;
  private lineBreaker: LineBreaker;
  private bidiResolver: BidiResolver;
  
  constructor() {
    this.fontManager = new FontManager();
    this.lineBreaker = new LineBreaker();
    this.bidiResolver = new BidiResolver();
  }
  
  // Main Layout Method
  layoutText(element: TextElement): TextLayoutResult {
    const bounds = element.computedLayout;
    const textProperties = this.extractTextProperties(element);
    
    // Process text content
    const processedText = this.processText(element.text, textProperties);
    
    // Resolve bidirectional text
    const bidiText = this.bidiResolver.resolve(processedText, textProperties.direction);
    
    // Break into lines
    const lines = this.lineBreaker.breakLines(bidiText, bounds.width, textProperties);
    
    // Apply justification
    const justifiedLines = this.applyJustification(lines, textProperties.textAlign, bounds.width);
    
    // Calculate final positions
    const positionedLines = this.positionLines(justifiedLines, bounds, textProperties);
    
    return {
      lines: positionedLines,
      totalHeight: this.calculateTotalHeight(positionedLines),
      overflow: this.checkOverflow(positionedLines, bounds.height),
      metrics: this.calculateMetrics(positionedLines)
    };
  }
  
  // Text Processing
  private processText(text: string, properties: TextProperties): ProcessedText {
    return {
      characters: this.segmentCharacters(text),
      words: this.segmentWords(text, properties.wordBreak),
      whitespace: this.processWhitespace(text, properties.whiteSpace)
    };
  }
  
  // Character and Word Segmentation
  private segmentCharacters(text: string): Character[] {
    const characters: Character[] = [];
    const iterator = Intl.Segmenter ? 
      new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text) :
      this.fallbackCharacterSegmentation(text);
    
    for (const segment of iterator) {
      characters.push({
        text: segment.segment,
        index: segment.index,
        isWhitespace: /\s/.test(segment.segment),
        isLineBreak: /\n/.test(segment.segment)
      });
    }
    
    return characters;
  }
  
  private segmentWords(text: string, wordBreak: WordBreak): Word[] {
    const words: Word[] = [];
    const iterator = Intl.Segmenter ?
      new Intl.Segmenter('en', { granularity: 'word' }).segment(text) :
      this.fallbackWordSegmentation(text);
    
    for (const segment of iterator) {
      if (segment.isWordLike) {
        words.push({
          text: segment.segment,
          start: segment.index,
          end: segment.index + segment.segment.length,
          breakable: this.isBreakable(segment.segment, wordBreak)
        });
      }
    }
    
    return words;
  }
  
  // Line Breaking Logic
  private breakLines(
    processedText: ProcessedText, 
    maxWidth: number, 
    properties: TextProperties
  ): TextLine[] {
    return this.lineBreaker.breakLines(processedText, maxWidth, properties);
  }
}
```

#### LineBreaker
```typescript
class LineBreaker {
  // Main line breaking method
  breakLines(
    processedText: ProcessedText, 
    maxWidth: number, 
    properties: TextProperties
  ): TextLine[] {
    const lines: TextLine[] = [];
    const words = processedText.words;
    
    let currentLine = this.createEmptyLine();
    let currentWidth = 0;
    
    for (const word of words) {
      const wordWidth = this.measureWord(word, properties);
      
      // Check if word fits on current line
      if (currentWidth + wordWidth <= maxWidth || currentLine.words.length === 0) {
        // Add word to current line
        currentLine.words.push(word);
        currentWidth += wordWidth;
      } else {
        // Check if word can be hyphenated
        if (properties.hyphens !== 'none' && wordWidth > maxWidth) {
          const hyphenatedParts = this.hyphenateWord(word, maxWidth - currentWidth, properties);
          
          if (hyphenatedParts.first) {
            currentLine.words.push(hyphenatedParts.first);
            lines.push(this.finalizeLine(currentLine, currentWidth + hyphenatedParts.firstWidth));
          }
          
          // Start new line with remaining part
          currentLine = this.createEmptyLine();
          if (hyphenatedParts.remaining) {
            currentLine.words.push(hyphenatedParts.remaining);
            currentWidth = hyphenatedParts.remainingWidth;
          }
        } else {
          // Finalize current line and start new one
          lines.push(this.finalizeLine(currentLine, currentWidth));
          currentLine = this.createEmptyLine();
          currentLine.words.push(word);
          currentWidth = wordWidth;
        }
      }
    }
    
    // Add final line if it has content
    if (currentLine.words.length > 0) {
      lines.push(this.finalizeLine(currentLine, currentWidth));
    }
    
    return lines;
  }
  
  // Word hyphenation
  private hyphenateWord(
    word: Word, 
    availableWidth: number, 
    properties: TextProperties
  ): HyphenationResult {
    // Use Intl.Segmenter or fallback hyphenation algorithm
    const hyphenationPoints = this.findHyphenationPoints(word.text);
    
    for (let i = hyphenationPoints.length - 1; i >= 0; i--) {
      const point = hyphenationPoints[i];
      const firstPart = word.text.substring(0, point) + '-';
      const firstPartWidth = this.measureText(firstPart, properties);
      
      if (firstPartWidth <= availableWidth) {
        return {
          first: { ...word, text: firstPart },
          firstWidth: firstPartWidth,
          remaining: { ...word, text: word.text.substring(point) },
          remainingWidth: this.measureText(word.text.substring(point), properties)
        };
      }
    }
    
    return { first: null, remaining: word, remainingWidth: this.measureWord(word, properties) };
  }
  
  // Text measurement
  private measureWord(word: Word, properties: TextProperties): number {
    return this.measureText(word.text, properties);
  }
  
  private measureText(text: string, properties: TextProperties): number {
    // Use canvas measureText or cached measurements
    const font = `${properties.fontWeight} ${properties.fontSize}px ${properties.fontFamily}`;
    return this.getTextWidth(text, font);
  }
}
```

#### BidiResolver
```typescript
class BidiResolver {
  // Resolve bidirectional text according to Unicode Bidirectional Algorithm
  resolve(text: ProcessedText, baseDirection: TextDirection): BidiText {
    // Implement Unicode Bidirectional Algorithm (UBA)
    // This is a simplified implementation - full UBA is complex
    
    const runs = this.analyzeDirectionalRuns(text, baseDirection);
    const reorderedRuns = this.reorderRuns(runs);
    
    return {
      originalText: text,
      runs: reorderedRuns,
      baseDirection
    };
  }
  
  private analyzeDirectionalRuns(text: ProcessedText, baseDirection: TextDirection): DirectionalRun[] {
    const runs: DirectionalRun[] = [];
    let currentDirection = baseDirection;
    let runStart = 0;
    
    text.characters.forEach((char, index) => {
      const charDirection = this.getCharacterDirection(char.text);
      
      if (charDirection !== currentDirection && charDirection !== 'neutral') {
        // End current run
        if (index > runStart) {
          runs.push({
            text: text.characters.slice(runStart, index),
            direction: currentDirection,
            start: runStart,
            end: index
          });
        }
        
        // Start new run
        currentDirection = charDirection;
        runStart = index;
      }
    });
    
    // Add final run
    if (runStart < text.characters.length) {
      runs.push({
        text: text.characters.slice(runStart),
        direction: currentDirection,
        start: runStart,
        end: text.characters.length
      });
    }
    
    return runs;
  }
  
  private getCharacterDirection(char: string): TextDirection | 'neutral' {
    const code = char.codePointAt(0) || 0;
    
    // Hebrew, Arabic ranges (simplified)
    if ((code >= 0x0590 && code <= 0x05FF) || (code >= 0x0600 && code <= 0x06FF)) {
      return 'rtl';
    }
    
    // Latin ranges
    if ((code >= 0x0020 && code <= 0x007F) || (code >= 0x00A0 && code <= 0x00FF)) {
      return 'ltr';
    }
    
    return 'neutral';
  }
}
```

### Text Justification and Alignment

```typescript
class TextJustifier {
  // Apply text alignment and justification
  applyJustification(
    lines: TextLine[], 
    alignment: TextAlign, 
    containerWidth: number
  ): JustifiedLine[] {
    return lines.map((line, index) => {
      const isLastLine = index === lines.length - 1;
      
      switch (alignment) {
        case 'left':
          return this.justifyLeft(line);
        case 'right':
          return this.justifyRight(line, containerWidth);
        case 'center':
          return this.justifyCenter(line, containerWidth);
        case 'justify':
          return isLastLine ? 
            this.justifyLeft(line) : 
            this.justifyFull(line, containerWidth);
        default:
          return this.justifyLeft(line);
      }
    });
  }
  
  private justifyLeft(line: TextLine): JustifiedLine {
    let x = 0;
    const positionedWords = line.words.map(word => {
      const positioned = { ...word, x, y: line.y };
      x += word.width + word.spaceAfter;
      return positioned;
    });
    
    return {
      ...line,
      words: positionedWords,
      width: x - (line.words[line.words.length - 1]?.spaceAfter || 0)
    };
  }
  
  private justifyRight(line: TextLine, containerWidth: number): JustifiedLine {
    const leftJustified = this.justifyLeft(line);
    const offset = containerWidth - leftJustified.width;
    
    return {
      ...leftJustified,
      words: leftJustified.words.map(word => ({
        ...word,
        x: word.x + offset
      }))
    };
  }
  
  private justifyCenter(line: TextLine, containerWidth: number): JustifiedLine {
    const leftJustified = this.justifyLeft(line);
    const offset = (containerWidth - leftJustified.width) / 2;
    
    return {
      ...leftJustified,
      words: leftJustified.words.map(word => ({
        ...word,
        x: word.x + offset
      }))
    };
  }
  
  private justifyFull(line: TextLine, containerWidth: number): JustifiedLine {
    if (line.words.length <= 1) {
      return this.justifyLeft(line);
    }
    
    const totalWordWidth = line.words.reduce((sum, word) => sum + word.width, 0);
    const totalSpaceNeeded = containerWidth - totalWordWidth;
    const spacesBetweenWords = line.words.length - 1;
    const spaceWidth = totalSpaceNeeded / spacesBetweenWords;
    
    let x = 0;
    const positionedWords = line.words.map((word, index) => {
      const positioned = { ...word, x, y: line.y };
      x += word.width;
      if (index < line.words.length - 1) {
        x += spaceWidth;
      }
      return positioned;
    });
    
    return {
      ...line,
      words: positionedWords,
      width: containerWidth
    };
  }
}
```

### Font Management

```typescript
class FontManager {
  private fontCache = new Map<string, FontData>();
  private loadedFonts = new Set<string>();
  
  // Font Loading
  async loadFont(fontFamily: string, fontWeight: FontWeight = 'normal'): Promise<FontData> {
    const fontKey = `${fontFamily}-${fontWeight}`;
    
    if (this.fontCache.has(fontKey)) {
      return this.fontCache.get(fontKey)!;
    }
    
    const fontData = await this.fetchFontData(fontFamily, fontWeight);
    this.fontCache.set(fontKey, fontData);
    this.loadedFonts.add(fontKey);
    
    return fontData;
  }
  
  // Font Metrics
  getFontMetrics(fontFamily: string, fontSize: number, fontWeight: FontWeight = 'normal'): FontMetrics {
    const fontKey = `${fontFamily}-${fontWeight}`;
    const fontData = this.fontCache.get(fontKey);
    
    if (!fontData) {
      throw new Error(`Font not loaded: ${fontKey}`);
    }
    
    return {
      ascent: fontData.ascent * fontSize / fontData.unitsPerEm,
      descent: fontData.descent * fontSize / fontData.unitsPerEm,
      lineHeight: fontData.lineHeight * fontSize / fontData.unitsPerEm,
      capHeight: fontData.capHeight * fontSize / fontData.unitsPerEm,
      xHeight: fontData.xHeight * fontSize / fontData.unitsPerEm
    };
  }
  
  // Text Measurement
  measureText(text: string, font: FontProperties): TextMeasurement {
    const canvas = this.getOffscreenCanvas();
    const context = canvas.getContext('2d')!;
    
    context.font = this.buildFontString(font);
    const metrics = context.measureText(text);
    
    return {
      width: metrics.width,
      height: font.fontSize,
      ascent: metrics.actualBoundingBoxAscent,
      descent: metrics.actualBoundingBoxDescent,
      leftBearing: metrics.actualBoundingBoxLeft,
      rightBearing: metrics.actualBoundingBoxRight
    };
  }
  
  private buildFontString(font: FontProperties): string {
    return `${font.fontStyle} ${font.fontVariant} ${font.fontWeight} ${font.fontSize}px ${font.fontFamily}`;
  }
  
  private getOffscreenCanvas(): HTMLCanvasElement {
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 1;
      this.offscreenCanvas.height = 1;
    }
    return this.offscreenCanvas;
  }
  
  private offscreenCanvas?: HTMLCanvasElement;
}
```

### Text Type Definitions

```typescript
// Text Alignment
type TextAlign = 'left' | 'right' | 'center' | 'justify' | 'start' | 'end';
type TextDirection = 'ltr' | 'rtl' | 'auto';

// Text Layout
type WhiteSpace = 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces';
type WordBreak = 'normal' | 'break-all' | 'keep-all' | 'break-word';
type LineBreak = 'auto' | 'loose' | 'normal' | 'strict' | 'anywhere';
type Hyphens = 'none' | 'manual' | 'auto';
type TextOverflow = 'clip' | 'ellipsis' | 'fade';

// Typography
type FontWeight = 'normal' | 'bold' | 'lighter' | 'bolder' | number;
type FontStyle = 'normal' | 'italic' | 'oblique';
type FontVariant = 'normal' | 'small-caps';

// Text Effects
interface TextShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: Color;
}

interface TextStroke {
  width: number;
  color: Color;
}

// Text Layout Data Structures
interface TextLine {
  words: Word[];
  y: number;
  height: number;
  baseline: number;
  width: number;
  spaceWidth: number;
}

interface Word {
  text: string;
  start: number;
  end: number;
  width: number;
  height: number;
  spaceAfter: number;
  breakable: boolean;
}

interface Character {
  text: string;
  index: number;
  width: number;
  isWhitespace: boolean;
  isLineBreak: boolean;
}

interface JustifiedLine extends TextLine {
  justification: TextAlign;
  spaceAdjustment: number;
}

// Font Data
interface FontData {
  family: string;
  weight: FontWeight;
  unitsPerEm: number;
  ascent: number;
  descent: number;
  lineHeight: number;
  capHeight: number;
  xHeight: number;
  glyphs: Map<string, GlyphData>;
}

interface GlyphData {
  character: string;
  width: number;
  height: number;
  bearingX: number;
  bearingY: number;
  advance: number;
}

interface FontMetrics {
  ascent: number;
  descent: number;
  lineHeight: number;
  capHeight: number;
  xHeight: number;
}

interface TextMeasurement {
  width: number;
  height: number;
  ascent: number;
  descent: number;
  leftBearing: number;
  rightBearing: number;
}

// Text Properties
interface FontProperties {
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  fontVariant: FontVariant;
}

interface TextStyleProperties extends FontProperties {
  color: Color;
  textShadow?: TextShadow[];
  textStroke?: TextStroke;
  letterSpacing: number;
  wordSpacing: number;
  lineHeight: number | 'normal';
}

interface TextProperties extends TextStyleProperties {
  textAlign: TextAlign;
  textDirection: TextDirection;
  whiteSpace: WhiteSpace;
  wordBreak: WordBreak;
  lineBreak: LineBreak;
  hyphens: Hyphens;
  textOverflow: TextOverflow;
  maxLines: number | null;
}

// Layout Results
interface TextLayoutResult {
  lines: JustifiedLine[];
  totalHeight: number;
  overflow: boolean;
  metrics: ComputedTextMetrics;
}

interface ComputedTextMetrics {
  lineCount: number;
  characterCount: number;
  wordCount: number;
  averageLineWidth: number;
  maxLineWidth: number;
  actualHeight: number;
  boundingBox: Rectangle;
}
```

### Text Rendering

```typescript
class TextRenderer {
  private fontManager: FontManager;
  private glyphCache: GlyphCache;
  
  constructor() {
    this.fontManager = new FontManager();
    this.glyphCache = new GlyphCache();
  }
  
  // Main rendering method
  renderText(element: TextElement, context: CanvasRenderingContext2D): void {
    const layoutResult = element.textLayoutResult;
    
    if (!layoutResult || layoutResult.lines.length === 0) {
      return;
    }
    
    // Set up rendering context
    this.setupRenderingContext(context, element);
    
    // Apply text effects (shadows, strokes)
    if (element.textShadow && element.textShadow.length > 0) {
      this.renderTextShadows(context, layoutResult.lines, element.textShadow);
    }
    
    if (element.textStroke) {
      this.renderTextStroke(context, layoutResult.lines, element.textStroke);
    }
    
    // Render main text
    this.renderTextLines(context, layoutResult.lines, element);
    
    // Handle text overflow
    if (layoutResult.overflow && element.textOverflow === 'ellipsis') {
      this.renderEllipsis(context, layoutResult.lines, element);
    }
  }
  
  private setupRenderingContext(context: CanvasRenderingContext2D, element: TextElement): void {
    context.fillStyle = element.color;
    context.font = this.buildFontString(element);
    context.textBaseline = 'alphabetic';
    context.textAlign = 'left'; // We handle alignment manually
  }
  
  private renderTextLines(
    context: CanvasRenderingContext2D, 
    lines: JustifiedLine[], 
    element: TextElement
  ): void {
    const maxLines = element.maxLines;
    const linesToRender = maxLines ? lines.slice(0, maxLines) : lines;
    
    linesToRender.forEach(line => {
      this.renderLine(context, line, element);
    });
  }
  
  private renderLine(
    context: CanvasRenderingContext2D, 
    line: JustifiedLine, 
    element: TextElement
  ): void {
    line.words.forEach(word => {
      // Apply word-specific styling if rich text
      if (element instanceof RichTextElement) {
        const span = element.getSpanAt(word.start);
        if (span && span.style) {
          this.applySpanStyle(context, span.style);
        }
      }
      
      // Apply letter spacing
      if (element.letterSpacing !== 0) {
        this.renderWordWithLetterSpacing(context, word, element.letterSpacing);
      } else {
        context.fillText(word.text, word.x, line.baseline);
      }
    });
  }
  
  private renderWordWithLetterSpacing(
    context: CanvasRenderingContext2D, 
    word: Word, 
    letterSpacing: number
  ): void {
    let x = word.x;
    
    for (const char of word.text) {
      context.fillText(char, x, word.y);
      x += this.fontManager.measureText(char, this.getCurrentFont(context)).width + letterSpacing;
    }
  }
  
  private renderTextShadows(
    context: CanvasRenderingContext2D, 
    lines: JustifiedLine[], 
    shadows: TextShadow[]
  ): void {
    shadows.forEach(shadow => {
      context.save();
      context.fillStyle = shadow.color;
      context.filter = `blur(${shadow.blur}px)`;
      context.translate(shadow.offsetX, shadow.offsetY);
      
      lines.forEach(line => {
        line.words.forEach(word => {
          context.fillText(word.text, word.x, line.baseline);
        });
      });
      
      context.restore();
    });
  }
  
  private renderTextStroke(
    context: CanvasRenderingContext2D, 
    lines: JustifiedLine[], 
    stroke: TextStroke
  ): void {
    context.save();
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.width;
    context.lineJoin = 'round';
    
    lines.forEach(line => {
      line.words.forEach(word => {
        context.strokeText(word.text, word.x, line.baseline);
      });
    });
    
    context.restore();
  }
  
  private renderEllipsis(
    context: CanvasRenderingContext2D, 
    lines: JustifiedLine[], 
    element: TextElement
  ): void {
    const lastLine = lines[lines.length - 1];
    const ellipsisWidth = this.fontManager.measureText('...', element).width;
    const maxWidth = element.computedLayout.width;
    
    // Find where to place ellipsis
    let cutoffX = maxWidth - ellipsisWidth;
    let cutoffWord = lastLine.words.findIndex(word => word.x + word.width > cutoffX);
    
    if (cutoffWord !== -1) {
      // Clear text that would overlap with ellipsis
      const clearRect = {
        x: cutoffX,
        y: lastLine.y,
        width: ellipsisWidth,
        height: lastLine.height
      };
      
      context.clearRect(clearRect.x, clearRect.y, clearRect.width, clearRect.height);
      
      // Render ellipsis
      context.fillText('...', cutoffX, lastLine.baseline);
    }
  }
  
  private buildFontString(element: TextElement): string {
    return `${element.fontStyle} ${element.fontVariant} ${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`;
  }
}
```

### Integration with Layout System

The Text System integrates seamlessly with the Yoga layout system:

1. **Yoga Node Configuration**: Text elements configure their Yoga nodes with text-specific properties
2. **Measure Function**: Text elements provide a measure function to Yoga for automatic sizing
3. **Layout Invalidation**: Text changes trigger layout recalculation through the dirty flag system
4. **Baseline Alignment**: Text elements provide baseline information for proper alignment with other elements

```typescript
// Text element Yoga integration
class TextElement extends BaseElement {
  protected setupYogaNode(): void {
    super.setupYogaNode();
    
    // Set measure function for auto-sizing
    this.yogaNode.setMeasureFunc((width, widthMeasureMode, height, heightMeasureMode) => {
      return this.measureForYoga(width, widthMeasureMode, height, heightMeasureMode);
    });
  }
  
  private measureForYoga(
    width: number, 
    widthMeasureMode: YogaMeasureMode,
    height: number, 
    heightMeasureMode: YogaMeasureMode
  ): YogaSize {
    // Calculate text layout with given constraints
    const constraintWidth = widthMeasureMode === YogaMeasureMode.Undefined ? Infinity : width;
    const layoutResult = this.calculateTextLayout(constraintWidth);
    
    return {
      width: Math.min(layoutResult.actualWidth, constraintWidth),
      height: layoutResult.totalHeight
    };
  }
  
  // Override layout invalidation to include text
  invalidateLayout(): void {
    super.invalidateLayout();
    this.invalidateTextLayout();
  }
}
```

## Event System

### Event Map Definition
```typescript
interface ElementEventMap {
  // Mouse Events
  'mousedown': MouseEvent;
  'mouseup': MouseEvent;
  'mousemove': MouseEvent;
  'mouseenter': MouseEvent;
  'mouseleave': MouseEvent;
  'mouseover': MouseEvent;
  'mouseout': MouseEvent;
  'click': MouseEvent;
  'dblclick': MouseEvent;
  'contextmenu': MouseEvent;
  'wheel': WheelEvent;
  
  // Touch Events
  'touchstart': TouchEvent;
  'touchmove': TouchEvent;
  'touchend': TouchEvent;
  'touchcancel': TouchEvent;
  
  // Keyboard Events
  'keydown': KeyboardEvent;
  'keyup': KeyboardEvent;
  'keypress': KeyboardEvent;
  
  // Focus Events
  'focus': FocusEvent;
  'blur': FocusEvent;
  'focusin': FocusEvent;
  'focusout': FocusEvent;
  
  // Layout Events
  'layout:change': LayoutChangeEvent;
  'layout:complete': LayoutCompleteEvent;
  
  // Hierarchy Events
  'child:added': ChildEvent;
  'child:removed': ChildEvent;
  'parent:changed': ParentChangeEvent;
  
  // Visibility Events
  'visibility:change': VisibilityEvent;
  'viewport:enter': ViewportEvent;
  'viewport:exit': ViewportEvent;
}

interface ViewEventMap {
  // Render Events
  'render:start': RenderEvent;
  'render:complete': RenderEvent;
  'render:layer': LayerRenderEvent;
  
  // Layout Events
  'layout:start': LayoutEvent;
  'layout:complete': LayoutEvent;
  'layout:invalidate': LayoutInvalidateEvent;
  
  // Viewport Events
  'viewport:change': ViewportChangeEvent;
  'viewport:resize': ViewportResizeEvent;
  
  // Interaction Events
  'interaction:start': InteractionStartEvent;
  'interaction:end': InteractionEndEvent;
}
```

### Object Picker Implementation
```typescript
class ObjectPicker {
  private rectMap: RectMap;
  private lastPickResults: Map<number, BaseElement[]>;
  
  constructor(view: View) {
    this.rectMap = new RectMap();
  }
  
  // Build spatial index for fast picking
  buildRectMap(elements: BaseElement[]): void {
    this.rectMap.clear();
    elements.forEach(element => {
      if (element.visible && element.computedLayout) {
        this.rectMap.insert(element, element.absoluteBounds);
      }
    });
  }
  
  // Fast object picking using spatial index
  pick(x: number, y: number): BaseElement[] {
    const candidates = this.rectMap.query(x, y);
    const results: BaseElement[] = [];
    
    // Sort by z-order (depth) and check precise hit testing
    candidates
      .sort((a, b) => this.getZOrder(b) - this.getZOrder(a))
      .forEach(element => {
        if (element.containsPoint(x, y)) {
          results.push(element);
        }
      });
    
    return results;
  }
  
  // Pick top-most element
  pickTop(x: number, y: number): BaseElement | null {
    const results = this.pick(x, y);
    return results.length > 0 ? results[0] : null;
  }
  
  // Pick all elements under point
  pickAll(x: number, y: number): BaseElement[] {
    return this.pick(x, y);
  }
  
  private getZOrder(element: BaseElement): number {
    let order = 0;
    let current = element;
    while (current.parent) {
      order += current.parent.children.indexOf(current);
      current = current.parent;
    }
    return order;
  }
}

// Spatial indexing for efficient hit testing
class RectMap {
  private grid: Map<string, BaseElement[]>;
  private cellSize: number;
  
  constructor(cellSize: number = 50) {
    this.grid = new Map();
    this.cellSize = cellSize;
  }
  
  insert(element: BaseElement, bounds: Rectangle): void {
    const cells = this.getCells(bounds);
    cells.forEach(cellKey => {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, []);
      }
      this.grid.get(cellKey)!.push(element);
    });
  }
  
  query(x: number, y: number): BaseElement[] {
    const cellKey = this.getCellKey(x, y);
    return this.grid.get(cellKey) || [];
  }
  
  clear(): void {
    this.grid.clear();
  }
  
  private getCells(bounds: Rectangle): string[] {
    const cells: string[] = [];
    const startX = Math.floor(bounds.x / this.cellSize);
    const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const startY = Math.floor(bounds.y / this.cellSize);
    const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);
    
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        cells.push(`${x},${y}`);
      }
    }
    
    return cells;
  }
  
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
}
```

## Rendering Pipeline

### Layer System
```typescript
class Layer {
  readonly id: string;
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly elements: Set<BaseElement>;
  
  // Layer Properties
  visible: boolean;
  opacity: number;
  offset: Point;
  blendMode: GlobalCompositeOperation;
  
  // Optimization
  dirty: boolean;
  lastRenderTime: number;
  
  constructor(width: number, height: number, options?: LayerOptions) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.resize(width, height);
  }
  
  // Element Management
  addElement(element: BaseElement): void;
  removeElement(element: BaseElement): void;
  hasElement(element: BaseElement): boolean;
  
  // Rendering
  render(viewport: Viewport): void;
  clear(): void;
  invalidate(): void;
  
  // Utilities
  resize(width: number, height: number): void;
  dispose(): void;
}

class LayerCompositor {
  private outputCanvas: HTMLCanvasElement;
  private outputContext: CanvasRenderingContext2D;
  
  constructor(outputCanvas: HTMLCanvasElement) {
    this.outputCanvas = outputCanvas;
    this.outputContext = outputCanvas.getContext('2d')!;
  }
  
  composite(layers: Layer[]): void {
    // Clear output
    this.outputContext.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
    
    // Composite layers in order
    layers
      .filter(layer => layer.visible && layer.opacity > 0)
      .forEach(layer => {
        this.compositeLayer(layer);
      });
  }
  
  private compositeLayer(layer: Layer): void {
    if (layer.opacity < 1 || layer.offset.x !== 0 || layer.offset.y !== 0) {
      this.outputContext.save();
      this.outputContext.globalAlpha = layer.opacity;
      this.outputContext.translate(layer.offset.x, layer.offset.y);
    }
    
    this.outputContext.globalCompositeOperation = layer.blendMode;
    this.outputContext.drawImage(layer.canvas, 0, 0);
    
    if (layer.opacity < 1 || layer.offset.x !== 0 || layer.offset.y !== 0) {
      this.outputContext.restore();
    }
  }
}
```

### Render Pipeline
```typescript
class RenderPipeline {
  private view: View;
  private optimizer: RenderOptimizer;
  private frameId: number = 0;
  
  constructor(view: View) {
    this.view = view;
    this.optimizer = new RenderOptimizer();
  }
  
  render(): void {
    const startTime = performance.now();
    
    // Step 1: Layout calculation (if needed)
    if (this.view.yogaEngine.hasLayoutChanges()) {
      this.view.calculateLayout();
    }
    
    // Step 2: Viewport culling
    const visibleElements = this.optimizer.cullByViewport(
      this.view.rootElement, 
      this.view.viewport
    );
    
    // Step 3: Build render tree with dirty flags
    const renderTree = this.optimizer.buildRenderTree(visibleElements);
    
    // Step 4: Update object picker rect map
    this.view.objectPicker.buildRectMap(visibleElements);
    
    // Step 5: Render layers
    this.view.layers.forEach(layer => {
      if (layer.dirty || this.optimizer.layerNeedsRedraw(layer, renderTree)) {
        this.renderLayer(layer, renderTree);
        layer.dirty = false;
      }
    });
    
    // Step 6: Composite layers
    this.view.layerCompositor.composite(this.view.layers);
    
    // Step 7: Performance tracking
    const endTime = performance.now();
    this.optimizer.recordFrameTime(endTime - startTime);
    
    this.frameId++;
  }
  
  private renderLayer(layer: Layer, renderTree: RenderNode[]): void {
    layer.clear();
    
    renderTree
      .filter(node => layer.elements.has(node.element))
      .forEach(node => {
        this.renderElement(layer.context, node);
      });
  }
  
  private renderElement(context: CanvasRenderingContext2D, node: RenderNode): void {
    const element = node.element;
    
    if (!element.visible || element.opacity <= 0) {
      return;
    }
    
    context.save();
    
    // Apply transform
    if (element.transform) {
      this.applyTransform(context, element.transform);
    }
    
    // Apply opacity
    if (element.opacity < 1) {
      context.globalAlpha *= element.opacity;
    }
    
    // Render element
    element.render(context);
    
    // Render children
    node.children.forEach(child => {
      this.renderElement(context, child);
    });
    
    context.restore();
  }
  
  private applyTransform(context: CanvasRenderingContext2D, transform: Transform2D): void {
    context.transform(
      transform.scaleX,
      transform.skewY,
      transform.skewX,
      transform.scaleY,
      transform.translateX,
      transform.translateY
    );
  }
}
```

## Performance Optimization

### Render Optimizer
```typescript
class RenderOptimizer {
  private frameTimeHistory: number[] = [];
  private maxFrameHistory = 60;
  private cullingQuadTree: QuadTree;
  
  // Viewport Culling
  cullByViewport(root: BaseElement, viewport: Viewport): BaseElement[] {
    const visible: BaseElement[] = [];
    
    this.traverseVisible(root, viewport, visible);
    
    return visible;
  }
  
  private traverseVisible(
    element: BaseElement, 
    viewport: Viewport, 
    visible: BaseElement[]
  ): void {
    if (!element.visible) return;
    
    const bounds = element.absoluteBounds;
    if (this.intersectsViewport(bounds, viewport)) {
      visible.push(element);
      
      // Check children
      element.children.forEach(child => {
        this.traverseVisible(child, viewport, visible);
      });
    }
  }
  
  private intersectsViewport(bounds: Rectangle, viewport: Viewport): boolean {
    return !(
      bounds.x + bounds.width < viewport.x ||
      bounds.x > viewport.x + viewport.width ||
      bounds.y + bounds.height < viewport.y ||
      bounds.y > viewport.y + viewport.height
    );
  }
  
  // Dirty Flag Optimization
  buildRenderTree(elements: BaseElement[]): RenderNode[] {
    const renderNodes: RenderNode[] = [];
    
    elements.forEach(element => {
      if (this.needsRedraw(element)) {
        renderNodes.push(this.createRenderNode(element));
      }
    });
    
    return renderNodes;
  }
  
  private needsRedraw(element: BaseElement): boolean {
    // Check if element or any ancestor is dirty
    let current: BaseElement | null = element;
    while (current) {
      if (current.isDirty()) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
  
  // Performance Monitoring
  recordFrameTime(frameTime: number): void {
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.maxFrameHistory) {
      this.frameTimeHistory.shift();
    }
  }
  
  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 0;
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameTimeHistory.length;
  }
  
  getFPS(): number {
    const avgFrameTime = this.getAverageFrameTime();
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  }
  
  // Memory Optimization
  private objectPool = new Map<string, any[]>();
  
  getPooledObject<T>(type: string, factory: () => T): T {
    if (!this.objectPool.has(type)) {
      this.objectPool.set(type, []);
    }
    
    const pool = this.objectPool.get(type)!;
    return pool.length > 0 ? pool.pop() : factory();
  }
  
  returnToPool<T>(type: string, object: T): void {
    if (!this.objectPool.has(type)) {
      this.objectPool.set(type, []);
    }
    
    this.objectPool.get(type)!.push(object);
  }
}

// Spatial data structure for efficient culling
class QuadTree {
  private bounds: Rectangle;
  private maxObjects: number;
  private maxLevels: number;
  private level: number;
  private objects: BaseElement[];
  private nodes: QuadTree[];
  
  constructor(bounds: Rectangle, maxObjects = 10, maxLevels = 5, level = 0) {
    this.bounds = bounds;
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
    this.level = level;
    this.objects = [];
    this.nodes = [];
  }
  
  clear(): void {
    this.objects = [];
    this.nodes.forEach(node => node.clear());
    this.nodes = [];
  }
  
  insert(element: BaseElement): void {
    if (this.nodes.length > 0) {
      const index = this.getIndex(element.absoluteBounds);
      if (index !== -1) {
        this.nodes[index].insert(element);
        return;
      }
    }
    
    this.objects.push(element);
    
    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split();
      }
      
      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i].absoluteBounds);
        if (index !== -1) {
          this.nodes[index].insert(this.objects.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }
  
  retrieve(bounds: Rectangle): BaseElement[] {
    const index = this.getIndex(bounds);
    const returnObjects = [...this.objects];
    
    if (this.nodes.length > 0) {
      if (index !== -1) {
        returnObjects.push(...this.nodes[index].retrieve(bounds));
      } else {
        this.nodes.forEach(node => {
          returnObjects.push(...node.retrieve(bounds));
        });
      }
    }
    
    return returnObjects;
  }
  
  private split(): void {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;
    
    this.nodes[0] = new QuadTree(
      { x: x + subWidth, y, width: subWidth, height: subHeight },
      this.maxObjects, this.maxLevels, this.level + 1
    );
    this.nodes[1] = new QuadTree(
      { x, y, width: subWidth, height: subHeight },
      this.maxObjects, this.maxLevels, this.level + 1
    );
    this.nodes[2] = new QuadTree(
      { x, y: y + subHeight, width: subWidth, height: subHeight },
      this.maxObjects, this.maxLevels, this.level + 1
    );
    this.nodes[3] = new QuadTree(
      { x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight },
      this.maxObjects, this.maxLevels, this.level + 1
    );
  }
  
  private getIndex(bounds: Rectangle): number {
    let index = -1;
    const verticalMidpoint = this.bounds.x + this.bounds.width / 2;
    const horizontalMidpoint = this.bounds.y + this.bounds.height / 2;
    
    const topQuadrant = bounds.y < horizontalMidpoint && bounds.y + bounds.height < horizontalMidpoint;
    const bottomQuadrant = bounds.y > horizontalMidpoint;
    
    if (bounds.x < verticalMidpoint && bounds.x + bounds.width < verticalMidpoint) {
      if (topQuadrant) {
        index = 1;
      } else if (bottomQuadrant) {
        index = 2;
      }
    } else if (bounds.x > verticalMidpoint) {
      if (topQuadrant) {
        index = 0;
      } else if (bottomQuadrant) {
        index = 3;
      }
    }
    
    return index;
  }
}
```

## API Reference

### Core Types
```typescript
// Geometric Types
interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Rectangle extends Point, Size {}

interface Transform2D {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  skewX: number;
  skewY: number;
}

// Color Types
type Color = string | CanvasGradient | CanvasPattern;

interface RGBA {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

// Layout Types
interface LayoutResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Viewport extends Rectangle {
  scale: number;
}

// Event Types
interface InteractionEvent {
  type: string;
  target: BaseElement;
  currentTarget: BaseElement;
  x: number;
  y: number;
  button?: number;
  buttons?: number;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

// Options Types
interface ViewOptions {
  pixelRatio?: number;
  backgroundColor?: Color;
  enableEvents?: boolean;
  optimizations?: {
    viewportCulling?: boolean;
    dirtyFlagOptimization?: boolean;
    objectPooling?: boolean;
  };
}

interface ElementOptions {
  id?: string;
  layer?: Layer;
  layoutProperties?: Partial<LayoutProperties>;
  visualProperties?: Partial<VisualProperties>;
}

interface LayerOptions {
  visible?: boolean;
  opacity?: number;
  offset?: Point;
  blendMode?: GlobalCompositeOperation;
}
```

### Factory Functions
```typescript
// View Creation
export function createView(width: number, height: number, options?: ViewOptions): View {
  return new View(width, height, options);
}

// Element Creation
export function createBoxElement(view: View, options?: BoxElementOptions): BoxElement {
  return new BoxElement(view, options);
}

// Utility Functions
export function applyLayoutProperties(
  element: BaseElement, 
  properties: Partial<LayoutProperties>
): void {
  Object.entries(properties).forEach(([key, value]) => {
    element.setLayoutProperty(key as keyof LayoutProperties, value);
  });
}

export function measureText(
  text: string, 
  fontSize: number, 
  fontFamily: string
): TextMetrics {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  context.font = `${fontSize}px ${fontFamily}`;
  return context.measureText(text);
}

// Color Utilities
export function parseColor(color: string): RGBA {
  // Implementation for parsing CSS colors to RGBA
}

export function rgbaToString(rgba: RGBA): string {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

// Transform Utilities
export function createTransform(): Transform2D {
  return {
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    skewX: 0,
    skewY: 0
  };
}

export function combineTransforms(a: Transform2D, b: Transform2D): Transform2D {
  // Matrix multiplication for transform combination
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Set up project structure and build system
- [ ] Implement EventEmitter integration
- [ ] Create base geometric types and utilities
- [ ] Implement Canvas wrapper and context management
- [ ] Set up Yoga layout engine integration
- [ ] Create basic View class with canvas mounting

### Phase 2: Element System (Week 3-4)
- [ ] Implement BaseElement with hierarchy management
- [ ] Create BoxElement with basic rendering
- [ ] Implement element lifecycle and cleanup
- [ ] Add visual properties (background, border, opacity)
- [ ] Implement transform system
- [ ] Create element factory functions

### Phase 3: Layout System (Week 5-6)
- [ ] Integrate Yoga layout engine
- [ ] Implement YogaShadowDOM synchronization
- [ ] Create layout property mapping and validation
- [ ] Implement reactive layout calculation
- [ ] Add dirty flag optimization for layout
- [ ] Create layout debugging tools

### Phase 4: Rendering Pipeline (Week 7-8)
- [ ] Implement Layer system with compositing
- [ ] Create RenderPipeline with optimization
- [ ] Implement viewport culling
- [ ] Add dirty flag optimization for rendering
- [ ] Create performance monitoring
- [ ] Implement object pooling

### Phase 5: Event System (Week 9-10)
- [ ] Implement ObjectPicker with spatial indexing
- [ ] Create event dispatcher and routing
- [ ] Add mouse and keyboard event handling
- [ ] Implement focus management
- [ ] Create touch event support
- [ ] Add event delegation

### Phase 6: Performance Optimization (Week 11-12)
- [ ] Implement QuadTree for spatial optimization
- [ ] Add render batching and caching
- [ ] Create memory usage monitoring
- [ ] Implement frame rate limiting
- [ ] Add WebGL acceleration hooks
- [ ] Create performance profiling tools

### Phase 7: Advanced Features (Week 13-14)
- [ ] Add animation support integration
- [ ] Implement clipping and masking
- [ ] Create gradient and pattern support
- [ ] Add image rendering and caching
- [ ] Implement text measurement and rendering
- [ ] Create custom element extension system

### Phase 8: Testing and Documentation (Week 15-16)
- [ ] Comprehensive unit test suite
- [ ] Performance benchmarking
- [ ] Memory leak testing
- [ ] Cross-browser compatibility testing
- [ ] API documentation generation
- [ ] Usage examples and tutorials

## Testing Strategy

### Unit Tests
```typescript
describe('BaseElement', () => {
  let view: View;
  let element: BaseElement;
  
  beforeEach(() => {
    view = createView(800, 600);
    element = new BoxElement(view);
  });
  
  afterEach(() => {
    view.dispose();
  });
  
  describe('hierarchy management', () => {
    it('should add and remove children correctly', () => {
      const child = new BoxElement(view);
      element.appendChild(child);
      
      expect(element.children).toContain(child);
      expect(child.parent).toBe(element);
      
      element.removeChild(child);
      expect(element.children).not.toContain(child);
      expect(child.parent).toBeNull();
    });
  });
  
  describe('layout properties', () => {
    it('should sync layout properties with Yoga node', () => {
      element.width = 100;
      element.height = 200;
      
      expect(element.yogaNode.getWidth().value).toBe(100);
      expect(element.yogaNode.getHeight().value).toBe(200);
    });
  });
});

describe('View', () => {
  it('should mount and unmount from DOM correctly', () => {
    const view = createView(400, 300);
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    view.mount(container);
    expect(container.children).toContain(view.canvas);
    
    view.unmount();
    expect(container.children).not.toContain(view.canvas);
    
    document.body.removeChild(container);
    view.dispose();
  });
});
```

### Performance Tests
```typescript
describe('Performance', () => {
  it('should handle 1000 elements at 60fps', async () => {
    const view = createView(1920, 1080);
    
    // Create 1000 elements in a grid
    for (let i = 0; i < 1000; i++) {
      const element = createBoxElement(view, {
        layoutProperties: {
          width: 10,
          height: 10,
          position: 'absolute',
          left: (i % 100) * 12,
          top: Math.floor(i / 100) * 12
        }
      });
      view.rootElement.appendChild(element);
    }
    
    // Measure render performance
    const frameCount = 60;
    const startTime = performance.now();
    
    for (let frame = 0; frame < frameCount; frame++) {
      view.render();
    }
    
    const endTime = performance.now();
    const avgFrameTime = (endTime - startTime) / frameCount;
    
    expect(avgFrameTime).toBeLessThan(16.67); // 60fps = 16.67ms per frame
    
    view.dispose();
  });
  
  it('should efficiently pick objects from large element count', () => {
    const view = createView(800, 600);
    const elements: BaseElement[] = [];
    
    // Create 10000 elements
    for (let i = 0; i < 10000; i++) {
      const element = createBoxElement(view, {
        layoutProperties: {
          width: 5,
          height: 5,
          position: 'absolute',
          left: Math.random() * 800,
          top: Math.random() * 600
        }
      });
      view.rootElement.appendChild(element);
      elements.push(element);
    }
    
    view.calculateLayout();
    
    // Measure picking performance
    const startTime = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      view.getElementAt(x, y);
    }
    
    const endTime = performance.now();
    const avgPickTime = (endTime - startTime) / 1000;
    
    expect(avgPickTime).toBeLessThan(1); // Less than 1ms per pick
    
    view.dispose();
  });
});
```

### Integration Tests
```typescript
describe('Integration', () => {
  it('should synchronize layout changes with Yoga', () => {
    const view = createView(400, 300);
    const parent = createBoxElement(view, {
      layoutProperties: {
        width: 200,
        height: 150,
        flexDirection: 'row'
      }
    });
    
    const child1 = createBoxElement(view, {
      layoutProperties: { flexGrow: 1 }
    });
    
    const child2 = createBoxElement(view, {
      layoutProperties: { flexGrow: 2 }
    });
    
    parent.appendChild(child1);
    parent.appendChild(child2);
    view.rootElement.appendChild(parent);
    
    view.calculateLayout();
    
    expect(child1.computedLayout.width).toBe(200 / 3);
    expect(child2.computedLayout.width).toBe(400 / 3);
    
    view.dispose();
  });
});
```

## Extension Points

### Custom Elements
```typescript
// Custom element example: CircleElement
class CircleElement extends BaseElement {
  radius: number;
  
  constructor(view: View, options?: CircleElementOptions) {
    super(view, options);
    this.radius = options?.radius || 10;
  }
  
  protected renderContent(context: CanvasRenderingContext2D): void {
    const centerX = this.computedLayout.width / 2;
    const centerY = this.computedLayout.height / 2;
    
    context.beginPath();
    context.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
    context.fill();
  }
  
  containsPoint(x: number, y: number): boolean {
    const bounds = this.absoluteBounds;
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    return distance <= this.radius;
  }
}

// Register custom element
registerElement('circle', CircleElement);
```

### Custom Renderers
```typescript
interface ElementRenderer {
  canRender(element: BaseElement): boolean;
  render(element: BaseElement, context: CanvasRenderingContext2D): void;
  getBounds(element: BaseElement): Rectangle;
}

class TextRenderer implements ElementRenderer {
  canRender(element: BaseElement): boolean {
    return element instanceof TextElement;
  }
  
  render(element: TextElement, context: CanvasRenderingContext2D): void {
    context.font = `${element.fontSize}px ${element.fontFamily}`;
    context.fillStyle = element.textColor;
    context.textAlign = element.textAlign;
    context.fillText(element.text, 0, element.fontSize);
  }
  
  getBounds(element: TextElement): Rectangle {
    const metrics = measureText(element.text, element.fontSize, element.fontFamily);
    return {
      x: 0,
      y: 0,
      width: metrics.width,
      height: element.fontSize
    };
  }
}
```

This specification provides a comprehensive foundation for implementing a high-performance graphics rendering library with all the requested features: Canvas-based rendering, hierarchical elements, Yoga layout integration, layer compositing, efficient event handling, and performance optimization.