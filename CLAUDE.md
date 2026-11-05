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
- **Styling**: Tailwind CSS v4 with a black-and-white profile theme and green navigation vertices
- **Validation**: Zod for form validation
- **TypeScript**: Strict mode enabled

### Key Configuration

- `next.config.ts`: Static export enabled, images unoptimized for SSG compatibility
- `app/globals.css`: CSS-first Tailwind config, profile layout, vertex buttons, and section transitions
- `app/components/Connections.tsx`: Exploration, collapse, reading, and expansion states
- `app/components/MolecularScene.tsx`: Canvas animation, dragging, and vertex navigation
- `app/lib/molecular-geometry.ts`: Seeded volumetric wireframe with 425 nodes, 2,060 unique connections, a folded shell, dense interior, projection, crumpling, and local deformation
- `app/lib/label-layout.ts`: Collision-aware placement for the five transparent navigation labels
- `app/lib/navigation.ts`: Navigation labels and destinations for the molecular menu
- `app/work-experience/page.tsx`, `app/speakings/page.tsx`, `app/awards/page.tsx`, and `app/certifications/page.tsx`: Independent routes with content defined directly in each page
- Path alias `@/*` maps to project root

### Profile Interaction

Preserve the identity order: About Me, the original portrait, then Toru Takahashi.
The wireframe has 220 shell points, 140 interior points, 60 core points, and
five green navigation anchors. Eight nearest-neighbor connections per white
point form overlapping triangles; shortest bridges ensure a connected mesh.
Each navigation anchor links to a nearby three-point neighborhood. Depth-aware
ice-blue edges, fine white vertices, and cyan satellite particles create density
without enlarging the interactive hit areas. Decorative particles follow the
mesh and disappear during collapse.
The irregular 3D graph rotates continuously unless explicitly paused, dragged, or disabled
by a reduced-motion preference. Hover and keyboard focus highlight connections
without pausing rotation. Selecting an internal-section vertex gathers the graph before revealing
its section; Back or Escape expands it and restores focus. Keep vertex-button
backgrounds transparent so they do not obscure the wireframe.

The five green navigation vertices are labeled Work Experience, Speakings,
Articles, Awards, and Certifications. Articles opens https://tttol.github.io/t-search/
directly in a new tab; the other four labels navigate to `/work-experience`,
`/speakings`, `/awards`, and `/certifications`. These pages share the persistent
scene layout and support direct visits and browser history. Work Experience entries
in `app/work-experience/page.tsx` contain only `company` and `description`.
Clicking a white node
pulls that point and the surrounding graph inward. Keep section content grounded in verified profile details; Awards and
Certifications use a "Details coming soon" empty state until details are provided.

The optional `meet` query form remains a local-only interaction with no data writes.
