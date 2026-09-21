# English site fixes — September 21, 2026

Implemented locally. No commit, push, deployment, new dependency or GitHub issue-state change.

## Issues #2–#11

| Issue | Result |
| --- | --- |
| #2 Privacy | Removed internal endpoint/legal-review notes and the generic diagram from EN. Retained existing public legal wording. |
| #3 Industries | Removed mixed Slovenian/English copy, translated Mobility in both static and interactive UI, and localized displayed thousands separators across all six tabs. |
| #4 Homepage | Corrected Sombor Gas, How it works, English metrics and email subjects. Koprivnica and Tropic remain separate entries, as in the source. |
| #5 KAI | American English, six distinct descriptions based on existing capability titles, How KAI works heading. Fixed desktop pipeline overflow without changing SL. |
| #6 Nexavia | Corrected metrics, decision-making/integration wording and Audit trail. Contact CTAs say Book a presentation. Removed Read the story links without final stories. |
| #7 Success Stories | Minimal public interim page using existing layout and CTA; internal notes/placeholder diagram removed. No invented stories or results. Removed corresponding misleading story CTAs from Industries. |
| #8 Duplicates | Remote Meter Reading and Traffic & Mobility each render What the solution covers once, preserving all coverage items and the platform content. SL unchanged. |
| #9 Legacy URLs | Ten static redirects, target canonicals, noindex/follow and sitemap exclusion. See redirect limitations below. |
| #10 Company | Requested wording changes plus an English copy of the existing SVG map, with unchanged geometry and styling. |
| #11 Language/microcopy | Shared SL \| EN selector in headers/footers, corrected EN homepage footer destination, mobility wording and Near-real-time monitoring. |

Additional QA fixes: build-time injection of the public contact endpoint into the inline form script; public-facing EN fallback message; contact anchor targets; valid language-switch destination on the 404 page; spacing in the EN homepage diagram caption.

## Changed files

- Configuration and validation: `astro.config.mjs`, `package.json`, `scripts/check-en-site.mjs`.
- Shared components: `src/components/ContactPage.astro`, `Footer.astro`, `Header.astro`, `LanguageSelector.astro` (new), `ProductPage.astro`, `SolutionDetailPage.astro`, `StandardPage.astro`.
- EN integration component: `src/components/NexaviaIntegrationEn.astro`.
- Homepage components: `src/components/homepage/KuemHomepage.astro`, `KuemHomepageEn.astro`.
- Solutions chrome: `src/components/solutions/SiteChrome.astro`, `SiteChromeEn.astro`.
- Data: `src/data/industry-explorer.ts`, `references.ts`, `routes.ts`, `site.ts`, `solutionExplorer.ts`, `trustedCompanies.ts`, `legacyEnglishRedirects.ts` (new).
- Locale helper: `src/lib/i18n.ts`.
- EN pages: `src/pages/en/company.astro`, `industries.astro`, `nexavia.astro`, `[...legacy].astro` (new).
- Replaced by generated redirect pages: `src/pages/en/about.astro`, `case-studies.astro`, `nexavia-platform.astro`, `platform/nexavia.astro` (removed).
- New translated asset: `src/assets/maps/kuem-regional-map-en.svg`.
- This report: `docs/english-qa-report.md`.

SL changes are limited to the requested shared language selector, correction of the shared customer-name typo, and safe shared form/404 fixes. SL marketing copy and layouts remain unchanged.

## Redirects and hosting

`.github/workflows/deploy-pages.yml` builds static Astro output and deploys it through GitHub Pages. `public/CNAME` identifies www.kuem.si. No redirect-capable edge configuration is present in the repository.

Redirect pages use immediate HTML meta refresh, an absolute target canonical, noindex/follow and a fallback link. They expose no obsolete page content and are excluded from the sitemap. **These are not HTTP 301 redirects.** True HTTP 301 requires a redirect-capable hosting/CDN layer.

| Legacy EN path | Target |
| --- | --- |
| /en/about/ | /en/company/ |
| /en/services/ | /en/solutions/ |
| /en/services/software-development/ | /en/solutions/ |
| /en/services/software-architecture-and-consulting/ | /en/solutions/ |
| /en/services/devops-and-platform-engineering/ | /en/solutions/ |
| /en/solutions/nexavia/ | /en/nexavia/ |
| /en/solutions/nexavia/nexavia-enterprise/ | /en/nexavia/ |
| /en/nexavia-platform/ | /en/nexavia/ |
| /en/platform/nexavia/ | /en/nexavia/ |
| /en/case-studies/ | /en/references/ |

Additional service paths were checked against the repository's former route configuration in commit f9d33ae.

## Validation

- `npm run build`: passed; 87 static pages. Existing warning: /api/lead has no GET handler (POST only).
- `npm run check`: passed; 167 files, zero errors/warnings, one existing LeadForm inline-script hint.
- `npm run check:en`: passed; nine core EN pages, both coverage headings, ten redirects, 1,564 internal anchor links.
- `git diff --check`: passed.
- Chromium: 18 EN/SL routes at 1440px and 390px; no JavaScript page errors or horizontal document overflow; mobile menu open/Escape behavior works.
- Exercised all six Industries tabs, the Solutions dialog, contact validation/fallback and all ten redirect destinations. No real contact message was sent.
- Visually inspected desktop/mobile screenshots and the translated Company map.
- Known bad strings are absent from the affected EN pages. Remaining source matches for Mobilnost are intentional SL content.
- `npm run format:check` cannot run through local npx: npm is missing `signal-manager.js`. Direct installed Prettier works; its repository-wide scan reports existing formatting debt in legacy sources. New code/config files checked directly with the Astro plugin pass. Unrelated files were not reformatted.
- No separate lint command is configured. Browser checks used Chromium, not physical iOS/Android devices.

## Remaining limitations and intentional destinations

- Final Success Stories content and a complete KAI redesign remain outside this task. The only case-study content-collection entry is an unapproved draft; it remains unpublished.
- Existing general Success Stories links from Home, Solutions, Industries and Company still open the clean interim /en/references/ page. No EN Read the story CTA points there.
- Existing KAI links (homepage and shared product footer) still open /en/kai/, with corrected copy and its existing design.
- No further Slovenian remnants were found in reviewed editable EN UI text. Customer names, addresses, technical IDs and Slovenian anchor identifiers are intentionally preserved. The existing Nexavia raster screenshot is unchanged, including local place/street names on its map.
- A configured production contact endpoint is still required for actual form delivery. The local build correctly directs visitors to email when it is absent.
- Three pre-existing legacy SL links to /sl/contact#contact-form resolve to an older form whose ID differs. They were left outside this EN task; EN contact anchors were repaired.
- Legal text was not expanded or independently certified; only internal notes were removed.
