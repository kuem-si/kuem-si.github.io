# KUEM corporate website

Production-oriented bilingual Astro website. Slovenian is the default language; English routes use `/en/`.

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

## Contact form

Copy `.env.example` to `.env` and set `PUBLIC_CONTACT_ENDPOINT` to an approved HTTPS endpoint that accepts JSON POST requests. If it is absent, the form gives an honest configuration message and directs the visitor to `info@kuem.si`; it never displays fake success. The form uses browser validation and a honeypot. The receiving service must implement server-side validation, rate limiting, spam controls, retention and consent logging.

## Content and brand assets

Web-safe official assets are imported from `src/assets/brand`. Source archives remain in `brand-assets` and are never served. Draft references and insights live in Astro content collections and are intentionally not published until facts and publication approval are recorded. See `CONTENT_TODO.md`.

## Deployment

The build is static and canonical URLs currently use `https://www.kuem.si`. Confirm the production host and form endpoint before deployment. No deployment is performed by this repository task.
