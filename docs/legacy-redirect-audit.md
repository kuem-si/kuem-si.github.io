# Legacy redirect audit — 2026-09-21

Final scope: GitHub #9 and #21. Existing page design, branding, content and valid detail routes were preserved during this final redirect-only pass. Earlier local changes from the preceding website task were retained. No dependencies, hosting services, commit or push were introduced by the agent.

## Route classification

Every file currently under `src/pages` is covered below. Both catch-all pages have finite `getStaticPaths()` results in a static build; they are not runtime handlers for arbitrary URLs.

| Source under `src/pages/` | Class | Public route / decision |
| --- | --- | --- |
| `index.astro` | A — current | `/` |
| `resitve.astro` | A — current | `/resitve/` |
| `nexavia.astro` | A — current | `/nexavia/` |
| `kai.astro` | A — current | `/kai/` |
| `panoge.astro` | A — current | `/panoge/` |
| `o-nas.astro` | A — current | `/o-nas/` |
| `kontakt.astro` | A — current | `/kontakt/` |
| `zasebnost.astro` | A — current | `/zasebnost/` |
| `reference.astro` | A — current | `/reference/` |
| `en/index.astro` | A — current | `/en/` |
| `en/solutions.astro` | A — current | `/en/solutions/` |
| `en/nexavia.astro` | A — current | `/en/nexavia/` |
| `en/kai.astro` | A — current | `/en/kai/` |
| `en/industries.astro` | A — current | `/en/industries/` |
| `en/company.astro` | A — current | `/en/company/` |
| `en/contact.astro` | A — current | `/en/contact/` |
| `en/privacy.astro` | A — current | `/en/privacy/` |
| `en/references.astro` | A — current | `/en/references/` |
| `vpogledi.astro` | A — current secondary | `/vpogledi/`; modern shared page, retained |
| `en/insights.astro` | A — current secondary | `/en/insights/`; modern shared page, retained |
| `resitve/[slug].astro` | B — current details | 15 current SL service/use-case pages; all retained and in sitemap |
| `en/solutions/[slug].astro` | B — current details | 15 corresponding EN pages; all retained and in sitemap |
| `[...legacy].astro` | C — legacy compatibility | 44 explicitly evidenced SL aliases, listed below |
| `en/[...legacy].astro` | C — legacy compatibility | 13 known EN aliases, listed below |
| `404.astro` | A — current system page | Custom 404, `noindex`, no redirect |
| `llms.txt.ts` | A — current system endpoint | `/llms.txt`, retained |

D — uncertain historical URLs: no root `/services/...` mapping was assumed. The historical route configuration uses `/storitve/...` for SL and `/en/services/...` for EN. No automatic `/sl/` alias was invented for newly introduced canonical pages. Removed historical demo/blog/legal URLs without a verified current equivalent were not repurposed or redirected to unrelated content. No uncertain current page was changed.

## Evidence for legacy status

- Existing standalone industrial-IoT, utilities and partner-program pages used the earlier site content and duplicated topics now covered by Industries, remote meter reading, and Contact. They were outside the current navigation. Both locales now map to those current destinations. Industrial IoT uses `/panoge/` or `/en/industries/`; no unsupported fragment or new route is invented.
- `git ls-tree -r 1222fc4^ src/pages/sl` proves the former `/sl/` files, including `/sl/platforma/nexavia/` and ten use-case detail aliases.
- `git show 9c0639a^:src/config/routes.ts` and its `src/config/site.ts` / `[...slug].astro` prove `/storitve/`, the three service subpaths, `/resitve/nexavia/`, `/resitve/nexavia/nexavia-enterprise/`, and the EN service/Nexavia variants. SL was the unprefixed default locale.
- `git log --all --diff-filter=D -- src/pages` confirms previously removed company, contact, privacy, reference and platform aliases.
- `70432d2^` contains the old root `references.astro`, `software-design-development.astro`, `software-architecture-consulting.astro` and `devops-platform-engineering.astro` files. They map to the current overview or Solutions page, respectively.

The earlier generated `/sl/` aliases were replaced with an explicit historical list; new canonical pages will not silently produce invented legacy routes.

## Implementation and removed templates

Both redirect route files use `LegacyRedirect.astro` and `Astro.site` for the absolute canonical URL. `partial = true` suppresses Astro's automatic prefetch/page scripts; the shared component explicitly emits a complete standards-mode document. Output contains only document metadata, immediate refresh, `noindex,follow`, title and localized fallback text/link. No obsolete page content, navigation, styles or scripts remain.

Removed full templates (their public URLs remain as redirects):

- `src/pages/industrial-iot.astro`
- `src/pages/nexavia-platform.astro`
- `src/pages/utilities.astro`
- `src/pages/partner-program.astro`
- `src/pages/en/industrial-iot.astro`
- `src/pages/en/utilities.astro`
- `src/pages/en/partner-program.astro`

New/shared implementation: `src/components/LegacyRedirect.astro`, `src/data/legacySlovenianRedirects.ts`, `src/pages/[...legacy].astro`. Extended `src/data/legacyEnglishRedirects.ts`, replaced the body of `src/pages/en/[...legacy].astro`, and updated `astro.config.mjs` to exclude both mapping sets from sitemap.

Internal-link cleanup: removed the four obsolete locale pairs (`industrial-iot`, `utilities`, `partner-program`, `nexavia-platform`) from `src/lib/i18n.ts`. The full source and generated HTML audit found no remaining navigation link to a known legacy URL. Historical URLs remain only in mappings, tests and audit documents. The prior Solutions canonical correction matches the existing trailing-slash policy; no current route was renamed.

QA additions/updates: `scripts/check-redirects.mjs`, `scripts/check-sl-site.mjs`, `scripts/site-data.mjs`, `scripts/check-en-site.mjs`, `.tools/verify.mjs`, and the `check:sl` package script. No dependency installation was required.

## Validation results

- `npm run build`: PASS — 108 generated pages.
- `npm run check`: PASS — 0 errors, 0 warnings, four pre-existing hints.
- `npm run check:en`: PASS — 9 core EN pages, 13 EN redirects, 1,091 internal links.
- `npm run check:sl`: PASS — 70 non-EN HTML pages, all 25 language pairs / 50 current content pages retained in sitemap, 57 redirects.
- `npm run verify`: PASS — internal links, assets, fragments, metadata, structured data and sitemap.
- `git diff --check`: PASS.
- `node scripts/check-redirects.mjs http://127.0.0.1:4321`: PASS — all redirect outputs and canonical targets plus actual HTTP 404 responses on unknown root, EN and solution-detail URLs.
- Browser follow-through: PASS — all 57 redirects reached the exact mapped destination. Final confirmation recorded in `.codex-artifacts/redirect-confirm-results.json` (local ignored evidence).

Sitemap: all 57 redirect URLs are excluded, including alternate entries; all 50 current content routes remain. Every redirect target exists, has the matching canonical URL, is indexable, is present in sitemap, and is not another redirect.

404: `/this-page-does-not-exist-12345/`, `/en/this-page-does-not-exist-12345/`, and `/resitve/this-page-does-not-exist-12345/` each return HTTP 404 with the project's existing bilingual error page. None becomes a successful catch-all redirect. Known `/resitve/nexavia/` redirects coexist with all valid `[slug]` detail pages.

## GitHub status

Issue #9: **CLOSED / completed**, with [repository-scope completion and hosting-limit comment](https://github.com/kuem-si/kuem-si.github.io/issues/9#issuecomment-5765143927). The agent closed it after validation under the latest user-approved repository-side acceptance criteria, without claiming HTTP 301 support.

Issue #21: **CLOSED / completed**, with [mapping and validation comment](https://github.com/kuem-si/kuem-si.github.io/issues/21#issuecomment-5765144436). Both closures were confirmed by the GitHub connector. The comments explicitly distinguish local validation from deployment; no push was performed.

True HTTP 301 redirects are not available in the current GitHub Pages-only deployment; repository-side static redirects are used instead.

## Confirmed SL mappings

| Legacy URL | Canonical destination |
| --- | --- |
| `/about/` | `/o-nas/` |
| `/o-podjetju/` | `/o-nas/` |
| `/contact/` | `/kontakt/` |
| `/privacy/` | `/zasebnost/` |
| `/references/` | `/reference/` |
| `/case-studies/` | `/reference/` |
| `/industrial-iot/` | `/panoge/` |
| `/utilities/` | `/resitve/daljinsko-odcitavanje-stevcev/` |
| `/partner-program/` | `/kontakt/` |
| `/nexavia-platform/` | `/nexavia/` |
| `/platforma/nexavia/` | `/nexavia/` |
| `/software-design-development/` | `/resitve/` |
| `/software-architecture-consulting/` | `/resitve/` |
| `/devops-platform-engineering/` | `/resitve/` |
| `/storitve/` | `/resitve/` |
| `/storitve/razvoj-programske-opreme/` | `/resitve/` |
| `/storitve/arhitektura-programske-opreme-in-svetovanje/` | `/resitve/` |
| `/storitve/devops-in-platform-engineering/` | `/resitve/` |
| `/resitve/nexavia/` | `/nexavia/` |
| `/resitve/nexavia/nexavia-enterprise/` | `/nexavia/` |
| `/sl/` | `/` |
| `/sl/about/` | `/o-nas/` |
| `/sl/contact/` | `/kontakt/` |
| `/sl/privacy/` | `/zasebnost/` |
| `/sl/case-studies/` | `/reference/` |
| `/sl/industrial-iot/` | `/panoge/` |
| `/sl/utilities/` | `/resitve/daljinsko-odcitavanje-stevcev/` |
| `/sl/partner-program/` | `/kontakt/` |
| `/sl/nexavia-platform/` | `/nexavia/` |
| `/sl/platforma/nexavia/` | `/nexavia/` |
| `/sl/o-nas/` | `/o-nas/` |
| `/sl/kontakt/` | `/kontakt/` |
| `/sl/reference/` | `/reference/` |
| `/sl/resitve/` | `/resitve/` |
| `/sl/resitve/daljinsko-odcitavanje-stevcev/` | `/resitve/daljinsko-odcitavanje-stevcev/` |
| `/sl/resitve/data-centri/` | `/resitve/data-centri/` |
| `/sl/resitve/digitalizacija-obcinske-infrastrukture/` | `/resitve/digitalizacija-obcinske-infrastrukture/` |
| `/sl/resitve/haccp-temperaturni-monitoring/` | `/resitve/haccp-temperaturni-monitoring/` |
| `/sl/resitve/javna-razsvetljava/` | `/resitve/javna-razsvetljava/` |
| `/sl/resitve/odpadki/` | `/resitve/odpadki/` |
| `/sl/resitve/okoljski-monitoring/` | `/resitve/okoljski-monitoring/` |
| `/sl/resitve/promet-in-mobilnost/` | `/resitve/promet-in-mobilnost/` |
| `/sl/resitve/sole-in-vrtci/` | `/resitve/sole-in-vrtci/` |
| `/sl/resitve/turizem-kampi-marine/` | `/resitve/turizem-kampi-marine/` |

## Confirmed EN mappings

| Legacy URL | Canonical destination |
| --- | --- |
| `/en/about/` | `/en/company/` |
| `/en/services/` | `/en/solutions/` |
| `/en/services/software-development/` | `/en/solutions/` |
| `/en/services/software-architecture-and-consulting/` | `/en/solutions/` |
| `/en/services/devops-and-platform-engineering/` | `/en/solutions/` |
| `/en/solutions/nexavia/` | `/en/nexavia/` |
| `/en/solutions/nexavia/nexavia-enterprise/` | `/en/nexavia/` |
| `/en/nexavia-platform/` | `/en/nexavia/` |
| `/en/platform/nexavia/` | `/en/nexavia/` |
| `/en/case-studies/` | `/en/references/` |
| `/en/industrial-iot/` | `/en/industries/` |
| `/en/utilities/` | `/en/solutions/remote-meter-reading/` |
| `/en/partner-program/` | `/en/contact/` |
