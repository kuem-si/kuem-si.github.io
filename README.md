# KUEM Website (Astro 6.1)

Multilingual Astro site scaffold with route-localized slugs:

- Slovenian default locale on root paths (`/`, `/o-nas`, `/storitve/...`)
- English under `/en` (`/en`, `/en/about`, `/en/services/...`)

## Requirements

- Node.js 24+
- npm 10+

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Development Container

Open this repository in VS Code and select **Reopen in Container**.
The `.devcontainer/devcontainer.json` config provisions Node 22 and installs dependencies.

### Accessing the dev server from your host

- The dev container is configured to forward port `5173` (see `.devcontainer/devcontainer.json`). Rebuild or reopen the container to apply this change.
- Start the Astro dev server so it listens on all interfaces:

```bash
npm run dev -- --host
```

- Open `http://localhost:5173` in your host browser (or the forwarded port shown in VS Code's Ports view).
- To use a different port, run:

```bash
npm run dev -- --host --port 4321
```

- Optional: persist `--host` by updating the `dev` script in `package.json` to:

```json
"dev": "astro dev --host"
```

If the port doesn't appear in the Ports view, stop/start the container or manually forward the port in the Remote - Containers UI.

## i18n Routing and Future Languages

Routes and localized slugs are centralized in `src/config/routes.ts`.
To add a new language:

1. Add locale code in `src/config/site.ts` (`SUPPORTED_LOCALES`).
2. Add locale in `astro.config.mjs` under `i18n.locales`.
3. Add localized `paths`, `labels`, and content fields for each route in `src/config/routes.ts`.

The catch-all page (`src/pages/[...slug].astro`) auto-generates static pages for all locales from this config.
