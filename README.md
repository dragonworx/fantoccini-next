# 🎭 Fantoccini Animation Engine

A hierarchical animation engine with musical timing capabilities, built with TypeScript and SvelteKit.

## Features

- 🎬 **Timeline System** - Observer pattern-based animation framework with nested timelines
- 🎨 **Sprite System** - 2D/3D visual elements with transform properties and hierarchical composition
- 🎵 **Metronome System** - Precise musical timing and rhythm generation
- ⚡ **Performance Optimized** - Frame-rate independent timing with dirty flag system
- 🔧 **Developer Tools** - Built-in editor for creating and testing animations
- 📖 **Comprehensive Documentation** - Full JSDoc documentation with examples

## Quick Start

### Prerequisites

- **Bun** (recommended) or Node.js 18+
- Modern browser with Web Audio API support

### Installation

```bash
git clone <repository-url>
cd fantoccini-next
bun install
```

### Development

```bash
# Start development server
bun run dev

# Run tests
bun run test

# Generate documentation
bun run docs
```

Open [http://localhost:5173](http://localhost:5173) to access the development environment.

## Architecture

Fantoccini is designed as three distinct modules:

### 🔧 Core (`src/core/`)
Pure TypeScript animation engine with no UI dependencies:

- **Timeline System** - Keyframe-based property animation with nested timelines
- **Sprite System** - Hierarchical visual elements with transforms and styling
- **Metronome System** - Musical timing, tempo control, and rhythm generation

### 🎨 Editor (`src/editor/`)
SvelteKit-based authoring environment:

- Visual timeline editor
- Property animation tools
- Real-time preview and testing
- Export capabilities

### ▶️ Player (`src/player/`)
Lightweight runtime for playback:

- Embeddable animation player
- Minimal dependencies
- Framework-agnostic integration

> **Note**: Currently in development - Editor and Player are combined during the transition phase.

## Core Concepts

### Timeline Animation

```typescript
import { Timeline, AnimatableProperty } from '@fantoccini/core';

// Create a timeline
const timeline = new Timeline({ framerate: 60 });

// Create an animatable property
const position = new AnimatableProperty(0);
position.addKeyframe({ time: 0, value: 0, interpolation: 'Linear' });
position.addKeyframe({ time: 2, value: 100, interpolation: 'Bezier' });

// Get interpolated value at any time
const currentValue = position.resolveValue(1.0); // Returns ~50
```

### Musical Timing

```typescript
import { Metronome, Rhythm, TimeSignature } from '@fantoccini/core';

// Create a rhythm in 4/4 time at 120 BPM
const rhythm = new Rhythm({
  bpm: 120,
  timeSignature: TimeSignature.four_four,
  subDivisions: 1
});

// Start the metronome
const metronome = new Metronome(rhythm);
metronome.onPulse(pulse => {
  console.log(`Beat ${pulse.beat} of measure ${pulse.measure}`);
});
metronome.start();
```

### Sprite Composition

```typescript
import { Scene, Sprite } from '@fantoccini/core';

// Create a scene
const scene = new Scene({ frameRate: 60 });

// Create and configure sprites
const sprite = new Sprite({
  x: 100, y: 100,
  width: 200, height: 150,
  fill: { type: 'color', value: '#ff0000' }
});

// Start the animation loop
scene.root.addChild(sprite);
scene.start();
```

## Development Commands

### Core Development
```bash
bun run dev      # Start development server
bun run build    # Build production bundle
bun run preview  # Preview production build
bun run test     # Run tests with Vitest
```

### Code Quality
```bash
bun run lint       # Run ESLint
bun run lint:fix   # Auto-fix ESLint issues
bun run check      # TypeScript type checking
```

### Documentation
```bash
bun run docs        # Generate JSDoc documentation
bun run docs:watch  # Watch and regenerate docs
bun run docs:serve  # Serve docs locally (port 8080)
```

## Testing

```bash
# Run all tests
bun run test

# Run tests in watch mode
vitest

# Run specific test file
vitest timeline.test.ts
```

Tests focus on:
- Core timing accuracy for animation and metronome systems
- Keyframe interpolation algorithms
- Timeline hierarchy and synchronization
- Cross-browser compatibility

## Code Style

- **Indentation**: Tabs
- **Quotes**: Single quotes
- **TypeScript**: Explicit return types and accessibility modifiers required
- **Documentation**: Comprehensive JSDoc with examples
- **Testing**: Vitest with deterministic timing mocks

## Project Structure

```
src/
├── lib/                    # Current structure (transitional)
│   ├── core/              # → Will move to src/core/
│   │   ├── scene/         # Scene management
│   │   ├── sprite.ts      # Visual elements
│   │   └── timeline/      # Animation system
│   ├── metronome/         # → Will move to src/core/metronome/
│   └── components/        # → Will move to src/editor/
├── routes/                # → Will move to src/editor/
└── tests/                 # Test files
```

## Documentation

Full API documentation is available:

```bash
bun run docs
bun run docs:serve
```

Navigate to [http://localhost:8080](http://localhost:8080) to browse the complete API reference.

## Contributing

1. Follow the established code style and TypeScript conventions
2. Add comprehensive tests for new features
3. Update JSDoc documentation with examples
4. Run `bun run lint` and `bun run test` before committing

## License

[Add your license information here]

---

**Fantoccini** - *From Italian "puppet", reflecting the engine's ability to animate and control visual elements with precision timing.*
