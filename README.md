# SvelteKit TypeScript Project

A modern web application built with SvelteKit and TypeScript.

## Features

- ⚡ SvelteKit with TypeScript support
- 🎨 Modern CSS styling with custom properties
- 📱 Responsive design
- 🔥 Hot module replacement in development
- 📦 Optimized production builds

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd sveltekit-app
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the application.

### Building for Production

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

### Type Checking

Run TypeScript type checking:

```bash
npm run check
```

Run type checking in watch mode:

```bash
npm run check:watch
```

## Project Structure

```
src/
├── routes/          # Application routes
│   ├── +layout.svelte   # Root layout
│   └── +page.svelte     # Home page
├── lib/             # Shared components and utilities
├── app.html         # HTML template
├── app.css          # Global styles
└── app.d.ts         # TypeScript declarations
```

## Technologies Used

- [SvelteKit](https://kit.svelte.dev/) - Full-stack web framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Svelte](https://svelte.dev/) - Component framework

## Learn More

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)