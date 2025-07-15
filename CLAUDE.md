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

## Code Style Guidelines

### TypeScript/JavaScript
- Use tabs for indentation
- Single quotes for strings
- Semicolons required
- Explicit function return types required
- Explicit member accessibility required
- Prefer arrow functions for callbacks
- Do not use any, prefer strong explicit types

## Documentation Standards

This project uses comprehensive JSDoc documentation with a three-part namespace architecture:

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
