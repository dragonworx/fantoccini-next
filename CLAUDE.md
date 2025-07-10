# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `bun run dev` - Start development server (SvelteKit with Vite)
- `bun run build` - Build production bundle
- `bun run preview` - Preview production build
- `bun run test` - Run tests with Vitest
- `bun run check` - Run Svelte type checking
- `bun run check:watch` - Run type checking in watch mode

### Code Quality
- `bun run lint` - Run ESLint on TypeScript and Svelte files
- `bun run lint:fix` - Auto-fix ESLint issues

### Documentation
- `bun run docs` - Generate JSDoc documentation using better-docs theme
- `bun run docs:better` - Generate docs with better-docs theme
- `bun run docs:docdash` - Generate docs with docdash theme
- `bun run docs:watch` - Watch for changes and regenerate docs
- `bun run docs:serve` - Serve documentation locally on port 8080

### Testing
- `vitest` - Run tests (supports watch mode, filtering, etc.)
- Tests are located in `/tests/` directory
- Use `vitest run` for CI/single run execution

## Project Architecture

**Fantoccini** is conceptually divided into three main parts:

### 1. Core (`src/core/`)
The foundation animation and timing engine - pure TypeScript with no UI dependencies:

**Timeline System** (`src/core/timeline/`)
- Observer pattern-based animation framework
- Supports nested timelines with independent time contexts
- Keyframe-based property animation
- Frame-rate independent timing
- Main classes: `Timeline`, `TimelineObject`, `Keyframe`

**Sprite System** (`src/core/`)
- 2D/3D visual elements for creating compositions
- Hierarchical sprite trees with parent-child relationships
- Transform properties: position, rotation, scale, skew
- Fill styles: color, gradient, image
- Dirty flag system for efficient updates
- Main classes: `Sprite`, `Scene`

**Metronome System** (`src/core/metronome/`)
- Musical timing and rhythm generation
- **Metronome** - Main class for tempo control and beat generation
- **Rhythm** - Defines BPM, time signatures, and subdivisions
- **TimeSignature** - Musical time signature representation
- **Pulse** - Individual beat events with measure/beat information
- **MetronomeScheduler** - Precise timing scheduler for audio applications

### 2. Editor (`src/editor/`)
The authoring environment built with SvelteKit - provides UI for creating and editing animations:
- SvelteKit application for the editor interface
- Svelte components for UI elements
- Editor runtime for managing the authoring experience
- Tools for creating and editing animations
- Currently located in `src/lib/` and `src/routes/` but will be moved to `src/editor/`

### 3. Player (`src/player/`)
The runtime for playing back content created in the editor:
- Uses the Core engine to run animations
- Provides a way to run content without the editor UI
- Lightweight runtime that depends only on Core
- Will be a separate module for embedding animations
- Not yet implemented - currently editor and player are combined

## Current File Structure (Transitional)

**Note**: The current file structure uses `src/lib/` for core components but will be reorganized to:
- `src/core/` - Core animation engine (currently `src/lib/core/` and `src/lib/metronome/`)
- `src/editor/` - Editor UI and runtime (currently `src/lib/components/` and `src/routes/`)
- `src/player/` - Player runtime (to be created)

## Code Style Guidelines

### TypeScript/JavaScript
- Use tabs for indentation
- Single quotes for strings
- Semicolons required
- Explicit function return types required
- Explicit member accessibility required
- Prefer arrow functions for callbacks

### File Organization
- Core engine code in `src/core/`
- Editor UI and runtime in `src/editor/`
- Player runtime in `src/player/`
- Test files in `tests/`
- Documentation generated in `doc-gen/`

## Documentation Standards

This project uses comprehensive JSDoc documentation with namespaces:
- `@namespace core` for animation engine
- `@namespace core.timeline` for timeline system
- `@namespace metronome` for timing system
- Include detailed `@example` blocks for public APIs
- Use `@memberof` to organize classes within namespaces

## Testing Strategy

- Unit tests with Vitest
- Focus on core timing accuracy in metronome tests
- Test both synchronous and asynchronous behaviors
- Mock timing functions for deterministic tests