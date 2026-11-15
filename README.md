# KUEM corporate website

Production-oriented trilingual Astro website. Slovenian is the default language; English routes use `/en/` and German routes use `/de/`. Each locale has its own slugs, paired in `src/lib/i18n.ts`.

## Local development

```bash
npm install
npm run dev
```

Production validation:

```bash
npm run check
npm run format:check
npm run build
npm run preview
```

## Rendered conformance

`npm run build && npm run conformance` renders every built page in Chromium (1440, 1024 and 390 px wide) and writes `conformance/evidence.json`: axe-core contrast, links in text and target size, a keyboard walk through every focus stop, and a check that every status shown in colour also says so in text. The governance checker (`kuem-design-governance`, `policies/conformance-evidence.md`) accepts the file only for the exact commit it was measured on, so regenerate and commit it in any pull request that changes the UI. Commit the code first: the script refuses a working tree with uncommitted changes. CI runs the same measurement with `--check` and fails on any failure. Never edit the file by hand.

## Contact form

Copy `.env.example` to `.env` and set `PUBLIC_CONTACT_ENDPOINT` to an approved HTTPS endpoint that accepts JSON POST requests. If it is absent, the form gives an honest configuration message and directs the visitor to `info@kuem.si`; it never displays fake success. The form uses browser validation and a honeypot. The receiving service must implement server-side validation, rate limiting, spam controls, retention and consent logging.

## Content and brand assets

Web-safe official assets are imported from `src/assets/brand`. Source archives remain in `brand-assets` and are never served. Draft references and insights live in Astro content collections and are intentionally not published until facts and publication approval are recorded. See `CONTENT_TODO.md`.

## Deployment

The build is static and canonical URLs currently use `https://www.kuem.si`. Confirm the production host and form endpoint before deployment. No deployment is performed by this repository task.
