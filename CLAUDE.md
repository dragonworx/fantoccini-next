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

**Note**: The file structure is currently organized as:
- `src/core/` - Core animation engine (timeline, sprite, metronome systems)
- `src/lib/components/` - Editor UI components (will move to `src/editor/`)
- `src/routes/` - Editor runtime and pages (will move to `src/editor/`)
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

This project uses comprehensive JSDoc documentation with a three-part namespace architecture:

### Namespace Structure
All source files MUST use the correct namespace based on their location:

**Core Namespace (`@namespace core`)**
- Files in `src/core/` (except timeline and metronome subdirectories)
- Scene and Sprite system: `@namespace core` and `@memberof core`

**Core Timeline Namespace (`@namespace core.timeline`)**
- Files in `src/core/timeline/`
- Use `@namespace core.timeline` for the main export file
- Use `@memberof core.timeline` for classes and interfaces

**Core Metronome Namespace (`@namespace core.metronome`)**
- Files in `src/core/metronome/`
- Use `@namespace core.metronome` for the main export file
- Use `@memberof core.metronome` for classes and interfaces

**Editor Namespace (`@namespace editor`)**
- Files in `src/lib/components/` and `src/routes/`
- Use `@namespace editor` and `@memberof editor`

**Player Namespace (`@namespace player`)**
- Future files in `src/player/` (when created)
- Use `@namespace player` and `@memberof player`

### Documentation Requirements
- Include detailed `@example` blocks for public APIs
- Use `@memberof` to organize classes within namespaces
- Always specify the correct namespace based on file location
- Maintain consistency with the three-part architecture

## Testing Strategy

- Unit tests with Vitest
- Focus on core timing accuracy in metronome tests
- Test both synchronous and asynchronous behaviors
- Mock timing functions for deterministic tests
