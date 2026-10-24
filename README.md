# About Me

This is my profile site. Infrastructure is managed separately in
[about-me-infra](https://github.com/tttol/about-me-infra).

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
- The only application route remains `/`. The `meet` query string is read on the
  client within `Suspense` and does not require server rendering.
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
- Tailwind CSS 4 uses `@tailwindcss/postcss` and CSS-first configuration. Manual
  light/dark switching on `<main>`, gradient interpolation, the half-transparent
  modal backdrop, button cursors, and placeholder styling are preserved.
- Tailwind 4's supported browser baseline is Safari 16.4+, Chrome 111+, and Firefox
  128+. Older browsers are not supported by this upgrade.
- Zod 4's `error` API replaces `required_error`. Existing validation behavior,
  including whitespace-only input acceptance, is covered by tests; the form does
  not call this otherwise-unused validation helper.
- Direct dependencies are pinned and `package-lock.json` is committed. Keep using
  `npm ci` for reproducible builds. `@types/node` tracks the chosen Node 24 LTS
  runtime rather than the Node 26 Current line.

An audit result of zero means no known advisory in npm's database matched the
locked dependency graph at the time of the audit. It is not a guarantee against
unknown vulnerabilities and does not audit the separate infrastructure repository
or live AWS configuration.
