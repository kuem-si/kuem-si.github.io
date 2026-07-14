# KUEM Website (Astro 7)

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

### Host prerequisites

On your host machine (outside the container) ensure the following are installed and configured:

- Docker Desktop or Docker Engine (latest stable) and Docker CLI; Docker must be running. On Linux, add your user to the `docker` group or use `sudo` for Docker commands.
- Visual Studio Code (stable release).
- The VS Code "Dev Containers" / "Remote - Containers" support is provided by the `Dev Containers` extension (recommended workflow uses this to reopen the repository in the container).
- Optionally: Docker Compose if you use multi-container setups, and Git for repository workflows.

System resources: allocate at least 2 CPU cores, 4GB RAM to the dev container for a smooth experience.

### Recommended VS Code extensions

Install these extensions in VS Code for the best developer experience working on this Astro site:

- Dev Containers: `ms-vscode-remote.remote-containers` (reopen in container support)
- Docker: `ms-azuretools.vscode-docker` (Dockerfile and container helpers)
- Astro: `astro-build.astro-vscode` (Astro language support)
- ESLint: `dbaeumer.vscode-eslint` (linting)
- Prettier: `esbenp.prettier-vscode` (code formatting)
- GitLens: `eamodio.gitlens` (Git insights)
- Optional: GitHub Copilot or Copilot Chat if you use AI-assisted coding

Installing these extensions before (or after) reopening in the dev container helps keep editor features and formatting consistent between host and container environments.

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

## Contact form setup (Cloudflare Turnstile + Worker)

This project includes a ready-made contact page and a Cloudflare Worker example to verify Cloudflare Turnstile tokens and forward messages to an Exchange Online mailbox via Microsoft Graph.

Files added:

- `src/pages/contact.astro` — client contact form (placeholders for `TURNSTILE_SITEKEY` and `WORKER_URL`).
- `worker/turnstile-graph-worker.js` — Cloudflare Worker that verifies Turnstile and calls Microsoft Graph `sendMail` using app-only credentials.

Quick TODOs you must complete before the contact form will work:

1. Create a Cloudflare Turnstile site and secret: https://developers.cloudflare.com/turnstile/get-started
   - Copy the **Site Key** and paste it in `src/pages/contact.astro` replacing `YOUR_TURNSTILE_SITEKEY`.
   - Keep the **Secret Key** for the Worker.

2. Register an Azure AD application for app-only Graph access:
   - In Azure Portal → App registrations → New registration.
   - Grant **Application** permission `Mail.Send` and click **Grant admin consent** for your tenant.
   - Create a client secret and note the `CLIENT_ID`, `TENANT_ID` and `CLIENT_SECRET`.

3. Deploy the Worker (recommended using `wrangler`):
   - Install Wrangler: `npm install -g wrangler`.
   - Create or update `wrangler.toml` for your worker (project name, account id, etc.).
   - Add the following secrets to the Worker (example):

```bash
wrangler secret put TURNSTILE_SECRET
wrangler secret put AZ_CLIENT_SECRET
wrangler secret put FROM_EMAIL
wrangler secret put TO_EMAIL
```

4. Bind the remaining env vars in `wrangler.toml` (or as plain env vars):

- `AZ_TENANT_ID` — your Azure AD tenant id
- `AZ_CLIENT_ID` — app (client) id
- `FROM_EMAIL` — the mailbox/user the app will send as (must be allowed with Mail.Send app permission)
- `TO_EMAIL` — destination address that receives contact messages

5. Deploy and get the Worker URL. Set `WORKER_URL` in `src/pages/contact.astro` (replace `https://YOUR_WORKER_URL_HERE/submit`).

6. Test the form in the browser. The Worker will verify Turnstile and forward the message to `TO_EMAIL` using Microsoft Graph.

Security notes:

- Keep `AZ_CLIENT_SECRET` and `TURNSTILE_SECRET` as secrets (do not commit them).
- Ensure your Azure AD app has **Application** permission `Mail.Send` and admin consent — app-only send requires that permission.
- You can restrict which `FROM_EMAIL` addresses the app may use by scoping in Exchange or by using a dedicated sending account.

Optional: If you prefer I can deploy the Worker and wire the values for you — I will need the secrets and permission to deploy, or I can provide step-by-step commands for you to run locally.
