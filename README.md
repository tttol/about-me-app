# About Me

This is my profile site. Infrastructure is managed separately in
[about-me-infra](https://github.com/tttol/about-me-infra).

## Profile experience

The page keeps the identity stack in order: **About Me**, the original portrait,
then **Toru Takahashi**. Below it, a slowly rotating volumetric wireframe combines
425 nodes and 2,060 unique straight connections. An irregular folded shell,
triangular neighborhoods, and a dense interior give the structure layered depth.
Fine ice-blue lines, white points, and cyan satellite particles sit on black;
five green category nodes connect navigation to the surrounding mesh.
The large home graph sits below Toru Takahashi, with navigation labels around
the mesh and controls below it.

- Select **Work Experience**, **Speakings**, **Awards**, or **Certifications**
  at a labeled vertex. The structure crumples into the center
  over 1.05 seconds before opening `/work-experience`, `/speakings`, `/awards`,
  or `/certifications`. Each page supports direct visits, reloads, and browser history.
- **Articles** opens [article search](https://tttol.github.io/t-search/) directly
  in a new tab, from either its label or its green vertex.
- **←Back** or **Escape** returns to the structure, which expands
  over 0.85 seconds.
- Section pages keep the same rotating 3D graph as a fixed background at 25%
  opacity, behind their content. Background vertices do not receive input.
- Select a white node to pull the graph inward around that point, or use
  **Reshape** for keyboard access. Nearby points follow the deformation.
- Drag to rotate the structure, or use **Pause** and **Resume**. Section controls
  also support keyboard navigation. Reduced-motion preferences disable automatic
  rotation and skip the folding transitions.

Each section owns its content in `app/<section>/page.tsx`. Navigation labels and
destinations live in `app/lib/navigation.ts`.
Awards and Certifications show **Details coming soon** until details are added.
Company entries in `app/work-experience/page.tsx` contain only `company` and
`description`; selecting a green timeline point or **Explore chapter** expands
that company's description.

## Development and verification

Use Node.js **24.22.1 LTS** (`.nvmrc`) and npm. The machine that builds the AWS upload must meet the `engines.node` requirement before building this branch.

```sh
nvm use
npm ci
npm run dev                 # Next.js development server
npm run check               # lint, route types + type check, unit tests, static build
npx playwright install chromium
npm run test:e2e            # desktop/mobile Chromium against exported out/
npm audit --audit-level=low # production + development dependency audit
npm audit --omit=dev --audit-level=low
npm start                   # local-only static preview at http://127.0.0.1:3000
```

To use an existing Chromium installation for local browser tests:
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`.
`npm start` requires a completed `npm run build`; it previews `out/` with Vite,
which is already used by Vitest. It is not a production server.

CI runs the same checks and both dependency audits on pull requests and pushes to
`main`. It has read-only repository permissions and no deployment steps or AWS credentials.

## Static deployment contract

- Next.js App Router remains configured with `output: "export"` and
  `images: { unoptimized: true }` in `next.config.ts`.
- `npm run build` produces `out/`; upload that directory using the existing AWS
  process. No Next.js/Node server is required on S3/CloudFront.
- Application routes are `/`, `/work-experience`, `/speakings`, `/awards`, and
  `/certifications`. The exported section pages are `.html` files; static hosting
  must resolve the clean paths to their corresponding files (for example,
  `/work-experience` to `/work-experience.html`). The `meet` query string is read
  on the client within `Suspense` and does not require server rendering.
- The meeting form still **does not send or persist data**. This upgrade does not
  add an API or enable the previously disabled persistence behavior.
- The CI added here does not deploy. Merging and production upload remain
  separate owner-controlled actions.

## Upgrade notes

- Next.js 16 and React 19.3 use the stable releases; `next lint` was replaced by
  explicit ESLint. ESLint 10 uses the official Next.js plugin, TypeScript ESLint,
  and React Hooks recommended rules directly. This avoids the currently stale
  ESLint 9-only peer ranges of the extra plugins in `eslint-config-next` without
  `--force`, `--legacy-peer-deps`, or unsupported ESLint versions.
- TypeScript 7 is the `tsc` CLI. `typescript` aliases the official
  `@typescript/typescript6` compatibility API for Next.js/TypeScript ESLint, as
  [recommended by Microsoft](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6-0).
  This is necessary because TypeScript 7.0 does not ship a compiler API.
- Tailwind CSS 4 uses `@tailwindcss/postcss` and CSS-first configuration. The
  profile uses a fixed black background with white geometry and green navigation
  vertices. The half-transparent meeting modal backdrop, button cursors, and
  placeholder styling are preserved.
- Tailwind 4's supported browser baseline is Safari 16.4+, Chrome 111+, and Firefox
  128+. Older browsers are not supported by this upgrade.
- Zod 4's `error` API replaces `required_error`. Existing validation behavior,
  including whitespace-only input acceptance, is covered by tests; the form does
  not call this otherwise-unused validation helper.
- Direct dependencies are pinned and `package-lock.json` is committed. Keep using
  `npm ci` for reproducible builds. `@types/node` tracks the chosen Node 24 LTS
  runtime rather than the Node 26 Current line.
- Version-scoped overrides pin the lint toolchain's transitive `minimatch` to
  `11.0.4` to address [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
  The affected upstream packages still request version 10. Remove these overrides
  when their supported dependency ranges include a patched version.

An audit result of zero means no known advisory in npm's database matched the
locked dependency graph at the time of the audit. It is not a guarantee against
unknown vulnerabilities and does not audit the separate infrastructure repository
or live AWS configuration.
