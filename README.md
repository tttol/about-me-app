# About Me

Toru Takahashi's personal profile site, built with Next.js, React, and Tailwind CSS.
An interactive 3D graph links to work experience, speakings, awards,
certifications, and articles.

## Development

Use the Node.js version in `.nvmrc` and npm.

```sh
nvm use
npm ci
npm run dev
```

## Checks

```sh
npm run check               # Lint, type checks, unit tests, and static build
npx playwright install chromium
npm run test:e2e            # Desktop and mobile browser tests; requires a build
```

## Build and preview

```sh
npm run build               # Export the site to out/
npm start                   # Preview at http://127.0.0.1:3000
```

Deploy `out/` to static hosting. Clean routes such as `/work-experience` must
resolve to their exported `.html` files. Infrastructure is managed in
[about-me-infra](https://github.com/tttol/about-me-infra); this repository's CI
does not deploy.

The meeting form does not send or save data.
