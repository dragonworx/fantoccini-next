# Timeline Component Specification

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Structure](#component-structure)
4. [Event System](#event-system)
5. [Visual Design](#visual-design)
6. [API Reference](#api-reference)
7. [Implementation Plan](#implementation-plan)
8. [Testing Strategy](#testing-strategy)
9. [Performance Considerations](#performance-considerations)
10. [Extension Points](#extension-points)

## Overview

The Timeline Component is a visual interface for the Fantoccini timeline animation system. It provides a comprehensive editing environment for creating, editing, and managing keyframe-based animations with precise timing control.

### Key Features
- **Visual Keyframe Editing**: Click-to-add, drag-to-move, right-click-to-delete keyframes
- **Multi-Track Support**: Support for multiple animated properties (position, rotation, scale, color, etc.)
- **Metronome Integration**: Precise timing driven by the metronome system
- **Playback Controls**: Play, pause, stop, seek, and speed control
- **Frame Rate Management**: Dynamic frame rate adjustment with time-based preservation
- **Extensible Architecture**: Plugin system for custom track types and renderers

### Technical Requirements
- **Framework**: SvelteKit components with TypeScript
- **Rendering**: Hybrid SVG/Canvas for timeline tracks, HTML for controls
- **Events**: Type-safe event system using the new EventEmitter architecture
- **Performance**: Efficient rendering for timelines with hundreds of keyframes
- **Accessibility**: Full keyboard navigation and screen reader support

## Architecture

### System Integration
```
┌─────────────────────────────────────────────────────────────────┐
│                    Timeline Component                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │  Timeline UI    │    │  Core Timeline  │    │  Metronome  │  │
│  │  Components     │◄──►│     Engine      │◄──►│   System    │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Sprite        │    │   EventEmitter  │    │  Renderer   │  │
│  │   System        │◄──►│    System       │◄──►│   Plugins   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Component Layer Architecture
```typescript
interface TimelineArchitecture {
  // Data Layer - Core timeline logic
  data: {
    timeline: ITimeline;
    sprites: Sprite[];
    keyframes: Map<string, IKeyframe[]>;
  };
  
  // Service Layer - Business logic & state management
  services: {
    playback: PlaybackService;
    keyframes: KeyframeService;
    selection: SelectionService;
    undo: UndoService;
    metronome: MetronomeService;
  };
  
  // View Layer - UI components
  components: {
    container: TimelineContainer;
    controls: TimelineControls;
    tracks: TimelineTrack[];
    ruler: TimelineRuler;
    canvas: TimelineCanvas;
  };
  
  // Extension Layer - Plugin system
  extensions: {
    renderers: Map<string, TrackRenderer>;
    tools: Map<string, TimelineTool>;
    exporters: Map<string, TimelineExporter>;
  };
}
```

## Component Structure

### File Organization
```
src/lib/components/timeline/
├── TimelineContainer.svelte          # Main container component
├── TimelineControls.svelte           # Playback controls
├── TimelineRuler.svelte              # Time ruler with frame markers
├── TimelineTrack.svelte              # Individual property track
├── TimelineCanvas.svelte             # Canvas for keyframe rendering
├── TimelineSettings.svelte           # Settings panel
├── services/
│   ├── PlaybackService.ts            # Playback control logic
│   ├── KeyframeService.ts            # Keyframe management
│   ├── SelectionService.ts           # Selection state management
│   ├── UndoService.ts                # Undo/redo functionality
│   └── MetronomeService.ts           # Metronome integration
├── renderers/
│   ├── DiamondRenderer.ts            # Diamond keyframe renderer
│   ├── ColorBarRenderer.ts           # Color gradient renderer
│   ├── CurveRenderer.ts              # Bezier curve renderer
│   └── WaveformRenderer.ts           # Audio waveform renderer
├── tools/
│   ├── SelectTool.ts                 # Selection tool
│   ├── PanTool.ts                    # Pan/zoom tool
│   ├── PencilTool.ts                 # Keyframe creation tool
│   └── EraserTool.ts                 # Keyframe deletion tool
├── types/
│   ├── TimelineTypes.ts              # Type definitions
│   ├── RendererTypes.ts              # Renderer interfaces
│   └── ToolTypes.ts                  # Tool interfaces
└── utils/
    ├── TimelineUtils.ts              # Utility functions
    ├── RenderUtils.ts                # Rendering helpers
    └── InteractionUtils.ts           # Mouse/keyboard handling
```

### Core Component APIs

#### TimelineContainer.svelte
```typescript
interface TimelineContainerProps {
  timeline: ITimeline;
  sprites: Sprite[];
  metronome: Metronome;
  width?: number;
  height?: number;
  framerate?: number;
  autoPlay?: boolean;
  loop?: boolean;
  showRuler?: boolean;
  showControls?: boolean;
  theme?: TimelineTheme;
}

interface TimelineContainerEvents {
  'timeline:ready': { component: TimelineContainer };
  'timeline:destroy': { component: TimelineContainer };
  'sprite:select': { sprite: Sprite; event: MouseEvent };
  'sprite:deselect': { sprite: Sprite };
  'viewport:change': { viewport: Viewport };
  'theme:change': { theme: TimelineTheme };
}
```

#### TimelineTrack.svelte
```typescript
interface TimelineTrackProps {
  sprite: Sprite;
  property: string;
  trackType: string;
  height?: number;
  color?: string;
  visible?: boolean;
  muted?: boolean;
  solo?: boolean;
  renderer?: string;
  keyframes?: IKeyframe[];
}

interface TimelineTrackEvents {
  'keyframe:add': { property: string; time: number; value: any };
  'keyframe:remove': { property: string; keyframeId: string };
  'keyframe:move': { property: string; keyframeId: string; newTime: number };
  'keyframe:edit': { property: string; keyframeId: string; newValue: any };
  'keyframe:select': { property: string; keyframeId: string };
  'track:toggle': { property: string; visible: boolean };
  'track:mute': { property: string; muted: boolean };
  'track:solo': { property: string; solo: boolean };
}
```

#### TimelineControls.svelte
```typescript
interface TimelineControlsProps {
  timeline: ITimeline;
  metronome: Metronome;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  framerate: number;
  loop: boolean;
  speed?: number;
  showFrameInput?: boolean;
  showSpeedControl?: boolean;
}

interface TimelineControlsEvents {
  'playback:play': { currentTime: number };
  'playback:pause': { currentTime: number };
  'playback:stop': { currentTime: number };
  'playback:seek': { time: number };
  'playback:speed': { speed: number };
  'timeline:loop': { loop: boolean };
  'timeline:framerate': { framerate: number };
}
```

## Event System

### Timeline Event Map
```typescript
interface TimelineComponentEventMap {
  // Playback Events
  'playback:play': { currentTime: number; speed: number };
  'playback:pause': { currentTime: number };
  'playback:stop': { currentTime: number };
  'playback:seek': { time: number; frame: number };
  'playback:tick': { currentTime: number; deltaTime: number };
  'playback:complete': { duration: number };
  
  // Keyframe Events
  'keyframe:add': { trackId: string; keyframeId: string; time: number; value: any };
  'keyframe:remove': { trackId: string; keyframeId: string };
  'keyframe:move': { trackId: string; keyframeId: string; oldTime: number; newTime: number };
  'keyframe:edit': { trackId: string; keyframeId: string; oldValue: any; newValue: any };
  'keyframe:select': { trackId: string; keyframeIds: string[]; multiSelect: boolean };
  'keyframe:deselect': { trackId: string; keyframeIds: string[] };
  'keyframe:copy': { trackId: string; keyframeIds: string[] };
  'keyframe:paste': { trackId: string; time: number; keyframes: IKeyframe[] };
  
  // Track Events
  'track:add': { trackId: string; property: string; sprite: Sprite };
  'track:remove': { trackId: string };
  'track:reorder': { trackId: string; oldIndex: number; newIndex: number };
  'track:toggle': { trackId: string; visible: boolean };
  'track:mute': { trackId: string; muted: boolean };
  'track:solo': { trackId: string; solo: boolean };
  'track:resize': { trackId: string; height: number };
  
  // Selection Events
  'selection:change': { selectedItems: TimelineItem[]; previousSelection: TimelineItem[] };
  'selection:clear': { previousSelection: TimelineItem[] };
  'selection:rect': { rect: Rectangle; selectedItems: TimelineItem[] };
  'selection:move': { items: TimelineItem[]; deltaTime: number };
  
  // Viewport Events
  'viewport:pan': { offset: number; deltaX: number };
  'viewport:zoom': { scale: number; centerTime: number };
  'viewport:fit': { startTime: number; endTime: number };
  'viewport:resize': { width: number; height: number };
  
  // Tool Events
  'tool:select': { toolId: string; previousTool: string };
  'tool:action': { toolId: string; action: string; data: any };
  'tool:complete': { toolId: string; result: any };
  
  // Undo/Redo Events
  'history:undo': { action: UndoAction };
  'history:redo': { action: UndoAction };
  'history:clear': { actionCount: number };
  
  // Export Events
  'export:start': { format: string; options: ExportOptions };
  'export:progress': { progress: number; currentFrame: number };
  'export:complete': { format: string; result: ExportResult };
  'export:error': { error: Error };
}
```

### Event Flow Example
```typescript
// Component usage with event handling
const timeline = new TimelineComponent({
  target: document.getElementById('timeline'),
  props: {
    timeline: myTimeline,
    sprites: [mySprite],
    metronome: myMetronome
  }
});

// Listen to timeline events
timeline.on('keyframe:add', (data) => {
  console.log(`Keyframe added at ${data.time}s for ${data.trackId}`);
});

timeline.on('playback:seek', (data) => {
  console.log(`Seeked to ${data.time}s (frame ${data.frame})`);
});

// Programmatic control
timeline.play();
timeline.seek(5.0);
timeline.addKeyframe('position.x', 3.0, 150);
```

## Visual Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ Timeline Controls                                              │
│ [▶] [⏸] [⏹] [⏮] [⏭] │ Time: 00:02.45 │ Frame: 147/360 │ 60fps │
├─────────────────────────────────────────────────────────────────┤
│ Timeline Ruler                                                  │
│ 0s    1s    2s    3s    4s    5s    6s    7s    8s    9s   10s  │
│ │     │     │     │     │     │     │     │     │     │     │   │
├─────────────────────────────────────────────────────────────────┤
│ Sprite Tracks                                                   │
│ ┌─ Sprite 1 ──────────────────────────────────────────────────┐ │
│ │ [👁] X Position    │ ◆     ◆     ◆     ◆                    │ │
│ │ [👁] Y Position    │   ◆     ◆       ◆                      │ │
│ │ [👁] Rotation      │       ◆           ◆                    │ │
│ │ [👁] Scale         │ ◆       ◆           ◆                  │ │
│ │ [👁] Color         │ ████████████████████████████████████   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─ Sprite 2 ──────────────────────────────────────────────────┐ │
│ │ [👁] X Position    │     ◆     ◆     ◆                      │ │
│ │ [👁] Y Position    │ ◆     ◆       ◆                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ Timeline Footer                                                 │
│ Scale: [─────●─────] │ Snap: [Grid] │ Tool: [Select] │ [Settings]│
└─────────────────────────────────────────────────────────────────┘
```

### Visual Elements

#### Keyframe Styles
```css
.keyframe {
  --keyframe-size: 8px;
  --keyframe-color: #4f8cff;
  --keyframe-selected: #ff6b6b;
  --keyframe-hover: #64a3ff;
}

.keyframe-diamond {
  width: var(--keyframe-size);
  height: var(--keyframe-size);
  background: var(--keyframe-color);
  transform: rotate(45deg);
  cursor: pointer;
}

.keyframe-diamond:hover {
  background: var(--keyframe-hover);
  transform: rotate(45deg) scale(1.2);
}

.keyframe-diamond.selected {
  background: var(--keyframe-selected);
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.3);
}
```

#### Track Styles
```css
.timeline-track {
  --track-height: 32px;
  --track-background: #2a2a2a;
  --track-border: #3a3a3a;
  --track-text: #ffffff;
  --track-muted: #666666;
}

.timeline-track {
  height: var(--track-height);
  background: var(--track-background);
  border-bottom: 1px solid var(--track-border);
  color: var(--track-text);
  display: flex;
  align-items: center;
}

.timeline-track.muted {
  opacity: 0.5;
  background: var(--track-muted);
}

.timeline-track.solo {
  background: linear-gradient(90deg, #ff6b6b 0%, var(--track-background) 10%);
}
```

#### Theme System
```typescript
interface TimelineTheme {
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    text: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
  };
  
  keyframes: {
    default: KeyframeStyle;
    selected: KeyframeStyle;
    hover: KeyframeStyle;
    types: Record<string, KeyframeStyle>;
  };
  
  tracks: {
    height: number;
    spacing: number;
    background: string;
    border: string;
    text: string;
  };
  
  ruler: {
    height: number;
    majorTick: string;
    minorTick: string;
    text: string;
    background: string;
  };
}

interface KeyframeStyle {
  size: number;
  color: string;
  borderColor?: string;
  borderWidth?: number;
  shape: 'diamond' | 'circle' | 'square';
}
```

## API Reference

### TimelineComponent Class
```typescript
class TimelineComponent extends EventEmitter<TimelineComponentEventMap> {
  // Core properties
  readonly timeline: ITimeline;
  readonly metronome: Metronome;
  readonly sprites: Sprite[];
  
  // Configuration
  framerate: number;
  theme: TimelineTheme;
  viewport: Viewport;
  
  // Services
  readonly playback: PlaybackService;
  readonly keyframes: KeyframeService;
  readonly selection: SelectionService;
  readonly undo: UndoService;
  
  // Lifecycle
  constructor(options: TimelineComponentOptions);
  mount(target: HTMLElement): void;
  unmount(): void;
  dispose(): void;
  
  // Playback Control
  play(): void;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  setSpeed(speed: number): void;
  setLoop(loop: boolean): void;
  
  // Keyframe Management
  addKeyframe(trackId: string, time: number, value: any): IKeyframe;
  removeKeyframe(trackId: string, keyframeId: string): void;
  moveKeyframe(trackId: string, keyframeId: string, newTime: number): void;
  editKeyframe(trackId: string, keyframeId: string, newValue: any): void;
  getKeyframes(trackId: string): IKeyframe[];
  
  // Track Management
  addTrack(sprite: Sprite, property: string): TimelineTrack;
  removeTrack(trackId: string): void;
  getTrack(trackId: string): TimelineTrack | null;
  getTracks(): TimelineTrack[];
  
  // Selection
  selectItems(items: TimelineItem[]): void;
  selectKeyframes(trackId: string, keyframeIds: string[]): void;
  clearSelection(): void;
  getSelection(): TimelineItem[];
  
  // Viewport
  pan(deltaX: number): void;
  zoom(scale: number, centerTime?: number): void;
  fit(startTime?: number, endTime?: number): void;
  timeToPixel(time: number): number;
  pixelToTime(pixel: number): number;
  
  // Tools
  setTool(toolId: string): void;
  getTool(): string;
  registerTool(toolId: string, tool: TimelineTool): void;
  
  // Rendering
  registerRenderer(type: string, renderer: TrackRenderer): void;
  getRenderer(type: string): TrackRenderer | null;
  invalidate(): void;
  render(): void;
  
  // Export
  exportAnimation(format: string, options?: ExportOptions): Promise<ExportResult>;
  exportKeyframes(format: string, tracks?: string[]): Promise<ExportResult>;
  
  // Utility
  getState(): TimelineState;
  setState(state: Partial<TimelineState>): void;
  toJSON(): TimelineJSON;
  fromJSON(json: TimelineJSON): void;
}
```

### Service Interfaces
```typescript
interface PlaybackService {
  play(): void;
  pause(): void;
  stop(): void;
  seek(time: number): void;
  setSpeed(speed: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  isPlaying(): boolean;
  getSpeed(): number;
}

interface KeyframeService {
  add(trackId: string, time: number, value: any): IKeyframe;
  remove(trackId: string, keyframeId: string): void;
  move(trackId: string, keyframeId: string, newTime: number): void;
  edit(trackId: string, keyframeId: string, newValue: any): void;
  get(trackId: string, keyframeId: string): IKeyframe | null;
  getAll(trackId: string): IKeyframe[];
  interpolate(trackId: string, time: number): any;
  copy(trackId: string, keyframeIds: string[]): IKeyframe[];
  paste(trackId: string, time: number, keyframes: IKeyframe[]): void;
}

interface SelectionService {
  select(items: TimelineItem[]): void;
  deselect(items: TimelineItem[]): void;
  clear(): void;
  getSelected(): TimelineItem[];
  isSelected(item: TimelineItem): boolean;
  selectRect(rect: Rectangle): void;
  moveSelected(deltaTime: number): void;
}

interface UndoService {
  execute(action: UndoAction): void;
  undo(): void;
  redo(): void;
  clear(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  getUndoStack(): UndoAction[];
  getRedoStack(): UndoAction[];
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Create basic component structure
- [ ] Implement EventEmitter integration
- [ ] Set up service layer architecture
- [ ] Create base TimelineContainer.svelte
- [ ] Implement basic viewport management
- [ ] Add timeline ruler with time markers

### Phase 2: Playback System (Week 3)
- [ ] Integrate metronome for timing
- [ ] Implement PlaybackService
- [ ] Create TimelineControls.svelte
- [ ] Add play/pause/stop functionality
- [ ] Implement seek and scrubbing
- [ ] Add frame rate controls

### Phase 3: Track System (Week 4)
- [ ] Create TimelineTrack.svelte
- [ ] Implement track management
- [ ] Add track visibility controls
- [ ] Implement track grouping by sprite
- [ ] Add track reordering

### Phase 4: Keyframe System (Week 5-6)
- [ ] Implement KeyframeService
- [ ] Create keyframe rendering system
- [ ] Add keyframe interaction (click, drag, delete)
- [ ] Implement keyframe selection
- [ ] Add interpolation curve editing
- [ ] Create keyframe context menus

### Phase 5: Tools and Interaction (Week 7)
- [ ] Implement tool system
- [ ] Create selection tool
- [ ] Add pan/zoom tool
- [ ] Implement pencil tool for keyframe creation
- [ ] Add eraser tool
- [ ] Create box selection

### Phase 6: Advanced Features (Week 8)
- [ ] Implement undo/redo system
- [ ] Add copy/paste functionality
- [ ] Create snap-to-grid
- [ ] Add timeline markers
- [ ] Implement track grouping
- [ ] Add timeline export

### Phase 7: Polish and Optimization (Week 9-10)
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Theme system implementation
- [ ] Documentation
- [ ] Testing and bug fixes

## Testing Strategy

### Unit Tests
```typescript
// Service tests
describe('PlaybackService', () => {
  it('should play and pause timeline', () => {
    const service = new PlaybackService(timeline, metronome);
    service.play();
    expect(service.isPlaying()).toBe(true);
    service.pause();
    expect(service.isPlaying()).toBe(false);
  });
});

// Component tests
describe('TimelineControls', () => {
  it('should emit play event when play button clicked', () => {
    const { component } = render(TimelineControls, { timeline, metronome });
    const playButton = screen.getByRole('button', { name: /play/i });
    const playHandler = vi.fn();
    
    component.$on('playback:play', playHandler);
    fireEvent.click(playButton);
    
    expect(playHandler).toHaveBeenCalled();
  });
});
```

### Integration Tests
```typescript
describe('Timeline Component Integration', () => {
  it('should synchronize keyframes with sprite properties', () => {
    const timeline = new TimelineComponent({
      timeline: createTimeline(),
      sprites: [createSprite()],
      metronome: createMetronome()
    });
    
    timeline.addKeyframe('position.x', 1.0, 100);
    timeline.seek(1.0);
    
    expect(timeline.sprites[0].x).toBe(100);
  });
});
```

### Performance Tests
```typescript
describe('Timeline Performance', () => {
  it('should handle 1000 keyframes efficiently', () => {
    const timeline = new TimelineComponent(options);
    
    // Add 1000 keyframes
    for (let i = 0; i < 1000; i++) {
      timeline.addKeyframe('position.x', i * 0.1, i);
    }
    
    const startTime = performance.now();
    timeline.render();
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(16); // 60fps budget
  });
});
```

## Performance Considerations

### Rendering Optimization
- **Virtualization**: Only render visible tracks and keyframes
- **Batching**: Group DOM updates to minimize reflows
- **Caching**: Cache rendered elements for unchanged tracks
- **RAF**: Use requestAnimationFrame for smooth animations
- **Web Workers**: Offload heavy computations to workers

### Memory Management
- **Event Cleanup**: Properly dispose of event listeners
- **Object Pooling**: Reuse objects for frequent operations
- **Weak References**: Use WeakMap for temporary associations
- **Garbage Collection**: Minimize object creation in hot paths

### Interaction Optimization
- **Throttling**: Throttle mouse move events during dragging
- **Debouncing**: Debounce resize and scroll events
- **Hit Testing**: Optimize keyframe hit detection
- **Spatial Indexing**: Use spatial data structures for large timelines

## Extension Points

### Custom Renderers
```typescript
interface TrackRenderer {
  readonly type: string;
  readonly priority: number;
  
  canRender(track: TimelineTrack): boolean;
  render(context: RenderContext): void;
  getInteractionBounds(keyframe: IKeyframe): Rectangle;
  cleanup(): void;
}

// Example: Audio waveform renderer
class AudioWaveformRenderer implements TrackRenderer {
  readonly type = 'audio-waveform';
  readonly priority = 10;
  
  canRender(track: TimelineTrack): boolean {
    return track.dataType === 'audio';
  }
  
  render(context: RenderContext): void {
    const { canvas, track, viewport } = context;
    // Render waveform visualization
  }
  
  getInteractionBounds(keyframe: IKeyframe): Rectangle {
    // Return interaction bounds for audio keyframes
  }
}
```

### Custom Tools
```typescript
interface TimelineTool {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly cursor: string;
  
  activate(timeline: TimelineComponent): void;
  deactivate(): void;
  
  onMouseDown(event: MouseEvent): void;
  onMouseMove(event: MouseEvent): void;
  onMouseUp(event: MouseEvent): void;
  onKeyDown(event: KeyboardEvent): void;
  onKeyUp(event: KeyboardEvent): void;
}

// Example: Brush tool for painting keyframes
class BrushTool implements TimelineTool {
  readonly id = 'brush';
  readonly name = 'Brush';
  readonly icon = '🖌️';
  readonly cursor = 'crosshair';
  
  private isDrawing = false;
  
  onMouseDown(event: MouseEvent): void {
    this.isDrawing = true;
    this.addKeyframeAt(event.clientX, event.clientY);
  }
  
  onMouseMove(event: MouseEvent): void {
    if (this.isDrawing) {
      this.addKeyframeAt(event.clientX, event.clientY);
    }
  }
  
  onMouseUp(): void {
    this.isDrawing = false;
  }
}
```

### Custom Exporters
```typescript
interface TimelineExporter {
  readonly format: string;
  readonly name: string;
  readonly extension: string;
  
  export(timeline: TimelineComponent, options?: ExportOptions): Promise<ExportResult>;
  validateOptions(options: ExportOptions): ValidationResult;
  getDefaultOptions(): ExportOptions;
}

// Example: After Effects exporter
class AfterEffectsExporter implements TimelineExporter {
  readonly format = 'aep';
  readonly name = 'After Effects';
  readonly extension = '.aep';
  
  async export(timeline: TimelineComponent): Promise<ExportResult> {
    // Convert timeline to After Effects project format
    const aepData = this.convertToAEP(timeline);
    return {
      format: this.format,
      data: aepData,
      filename: `timeline.${this.extension}`
    };
  }
}
```

## Demo Implementation

### Target: `/src/routes/test/timeline-demo/+page.svelte`

The demo page will showcase:
- A simple animated sprite (square with position, rotation, scale keyframes)
- Timeline component with all features
- Metronome-driven playback
- Interactive keyframe editing
- Real-time sprite updates

This specification provides a comprehensive foundation for implementing the Timeline Component with extensibility, performance, and maintainability in mind.