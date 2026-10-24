# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal profile website built with Next.js 16. The infrastructure code is maintained separately at https://github.com/tttol/about-me-infra.

## Development Commands

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production (static export)
npm run start    # Preview exported out/ locally (not a production server)
npm run lint     # Run ESLint
npm run check    # Lint, types, unit tests, static build
npm run test:e2e # Desktop/mobile browser regression tests
```

## Architecture

- **Framework**: Next.js 16 with App Router, configured for static site generation (SSG) via `output: "export"`
- **Styling**: Tailwind CSS v4 with dark mode support (selector-based)
- **Validation**: Zod for form validation
- **TypeScript**: Strict mode enabled

### Key Configuration

- `next.config.ts`: Static export enabled, images unoptimized for SSG compatibility
- `app/globals.css`: CSS-first Tailwind config and custom `dark` variant (class-based toggling on `<main>` element)
- Path alias `@/*` maps to project root

### Dark Mode Implementation

Dark mode is toggled by adding/removing the `dark` class on the `<main>` element. The Header component (`app/components/Header.tsx`) contains the toggle logic using direct DOM manipulation.
