# Remaining website issues — 2026-09-21

Scope: #7, #9, #12, #13, #14, #17, #18, #19, #20 and #21. Reviewed the descriptions of all ten open GitHub issues before editing. Baseline: `0953a71` on `main`, with a clean working tree. During implementation, a separate user commit, `c7668d7`, captured the first set of changes; it was preserved. No commit or push was performed by the agent.

## Implementation and acceptance

| Issue | Implementation result | Evidence |
| --- | --- | --- |
| #7 | RESOLVED | `/en/references/` has six factual, informational project cards, backed by shared bilingual data and an explicit publication flag. No placeholder, generic diagram or unavailable individual-story CTA. |
| #9 | RESOLVED — repository scope | All 13 English legacy URLs have immediate static redirects, canonical targets, `noindex,follow`, fallback links, sitemap exclusion, and no internal navigation to them. Closed under the later clarified acceptance criteria; true HTTP 301 remains unavailable with GitHub Pages. |
| #12 | RESOLVED | Removed both internal SL privacy notes and the generic diagram; preserved existing public privacy wording. |
| #13 | RESOLVED | `/reference/` is titled “Uspešne zgodbe” and uses the same six published projects as English. |
| #14 | RESOLVED | SL KAI uses “Deluje z Nexavio”, six capability-specific descriptions translated from existing EN descriptions, and “Kako KAI deluje”. Its desktop process uses the existing EN width accommodation. Nexavia headings unchanged. |
| #17 | RESOLVED | Contact CTA says “Dogovorite se za predstavitev”; removed individual-story links, retained project cards and their descriptions. |
| #18 | RESOLVED | Removed individual-story links; retained cards and the general CTA to `/reference/`. |
| #19 | RESOLVED | Customer names are plain text, with one explicitly general overview CTA below. Applied consistently in SL and EN. |
| #20 | RESOLVED | Retained the general Company CTA, pointing to canonical `/reference/` (and `/en/references/`). |
| #21 | RESOLVED | Replaced obsolete root templates and restored previously removed aliases as static redirects. The final explicit historical mapping has 44 SL redirects targeting current pages and excluded from sitemap. Current use-case routes remain intact. |

“RESOLVED” describes the implemented, locally validated repository changes; it does not claim that unpushed changes are already deployed.

## Published overview content and exact provenance

Only the following previously public facts are exposed by the overview. `src/data/successStories.ts` records provenance per entry and filters `published === true`. The customer/industry labels classify these same existing facts; they do not add outcomes, certifications or performance claims. Stable slugs provide an extension point for future individual pages; none is fabricated now.

| Card | Entire factual description used (EN; SL is the existing equivalent) | Exact pre-existing source |
| --- | --- | --- |
| Domplan — gas metering | Approximately 1,000 gas meters connected via NB-IoT. | `src/data/references.ts`, entry `DOMPLAN, d.d.`, `detail.sl/en`, already rendered by `src/components/homepage/KuemHomepage.astro` under `stories` on `/` and `/en/`. |
| JKP Brezovica — utility infrastructure | Overview of water meters and utility infrastructure. | `src/components/pages/NexaviaPage.astro`, `copy.sl.stories` / `copy.en.stories`, entry `Brezovica`, already on `/nexavia/` and `/en/nexavia/`. The full customer name comes from `src/data/references.ts`, entry `JKP Brezovica d.o.o.`. No meter counts or unpublished detailed reference data were imported. |
| Sombor Gas — gas metering | Ongoing deployment of 4,000 LoRaWAN adapters for remote gas meter reading. | `src/data/references.ts`, entry `Sombor-gas d.o.o.`, `detail.sl/en`, already rendered on both homepages. The ongoing-deployment qualifier is preserved; this is not described as a completed rollout. |
| Adria Mobil — industry | Energy data from the production environment. | `src/components/pages/NexaviaPage.astro`, bilingual `stories`, entry `Adria Mobil`, already on both Nexavia pages; also present in `IndustriesPage.astro`. |
| Gradiška — environment | Air quality, noise, traffic and environmental conditions. | `src/components/pages/IndustriesPage.astro`, bilingual `stories`, entry `Gradiška`, already on `/panoge/` and `/en/industries/`. No metrics or expanded claims imported. |
| Tropic — temperature monitoring | Temperature monitoring in refrigerators, freezers, salad bars and heated food areas. | `src/data/references.ts`, entry `Tropic Maloprodaja d.o.o.`, `detail.sl/en`, already rendered on both homepages. |

These sources were present before this task at [baseline 0953a71](https://github.com/kuem-si/kuem-si.github.io/tree/0953a71/src). No unpublished draft stories or additional customer metrics were exposed.

## Route audit

Reviewed the entire current `src/pages` tree and historical deleted routes. Current canonical pages, both sets of solution detail pages, `404.astro`, `llms.txt.ts`, and the modern paired `/vpogledi/` / `/en/insights/` pages remain. The latter retain their existing modern layout; the shared SL internal placeholder was replaced with the equivalent existing EN public invitation to explore solutions, so the all-SL production-content check passes.

Obsolete full templates removed: root `industrial-iot.astro`, `utilities.astro`, `partner-program.astro`, `nexavia-platform.astro`, plus the remaining EN industrial-IoT, utilities and partner-program templates. Their URLs continue through shared redirect routes. Utilities maps to remote meter reading; industrial IoT to Industries; partner inquiries to Contact. Old company/contact/privacy/reference/platform aliases map directly to their current equivalents, without chains.

`legacySlovenianRedirects` explicitly lists the historically evidenced `/sl/` aliases, including solution details. `/sl/` itself maps to `/`. The final redirect-only pass also restored the old `/storitve/...` and `/resitve/nexavia/...` paths from historical route configuration. These URLs are redirects, not duplicate pages. Removed old route pairs from hreflang configuration so canonical pages never advertise a legacy alternate. Corrected Solutions canonical URLs to match the existing trailing-slash policy.

Static redirect mechanism: immediate meta refresh, canonical URL, `noindex,follow` and a localized fallback link, rendered by `LegacyRedirect.astro`. Sitemap filtering reads both mapping objects. All targets are indexable canonical pages. There is no CDN/edge change.

> True HTTP 301 redirects are not available with the current GitHub Pages deployment. The implemented static redirects are the strongest supported repository-only solution.

## Validation

- `npm run build`: PASS, 108 generated pages, static GitHub Pages output.
- `npm run check`: PASS, 0 errors, 0 warnings; four existing informational hints (SeoHead, homepage, IndustriesPage, SolutionExplorerPanel).
- `npm run check:en`: PASS, 9 core pages, 2 coverage sections, 13 EN redirects, 1,091 internal links.
- `npm run check:sl`: PASS, 70 non-EN HTML pages, 25 SL/EN route pairs, 6 bilingual stories, truthful CTAs, 57 redirects, SVG scoping regression check.
- `npm run verify`: PASS, internal links/assets/fragments, metadata, structured data, hreflang, sitemap and redirects.
- Desktop/mobile browser results: PASS — 18 pages at two widths, mobile menus and language switches, zero JavaScript errors or horizontal overflow. Recorded in `.codex-artifacts/remaining-issues-qa/results.json`. The later mapping-only confirmation followed all 57 final redirects; unknown root/EN/detail URLs returned actual HTTP 404. Evidence in `.codex-artifacts/redirect-confirm-results.json` (local, ignored artifacts).
- Source phrase audit: no internal privacy/references wording, `Preberite zgodbo`, `Read the story`, `Poglejte primer uporabe` or `View a use case` remains in `src`. Remaining `Works with Nexavia` occurrences are EN-only branches in ProductPage and site data. General story CTAs point to the completed localized overview.
- No dependencies added; `npm install` was unnecessary.

Browser inspection exposed an existing post-build SVG optimization bug: SVGO removed empty Astro scope attributes and JavaScript hooks. Disabling `removeEmptyAttrs` preserves those attributes, restoring diagram styling without changing the design. The production-content check now asserts that the diagram's scoped attributes survive the build. SL KAI process overflow was fixed by sharing the already-existing EN responsive rule.

## Remaining limits

- HTTP 301 requires infrastructure beyond the current GitHub Pages setup; #9 was closed as repository-side cleanup under the later clarified acceptance criteria.
- Individual detailed customer-story pages do not exist and are not advertised. The overview is a complete informational destination using existing public summaries.
- No new deployment was initiated. Remaining working-tree changes must be committed/pushed through the existing workflow before they are live.

## GitHub actions

The eight content issues (#7, #12, #13, #14, #17, #18, #19, #20) were confirmed closed on GitHub by the time of the redirect-only follow-up. The agent posted a validation/provenance comment to #7; those closures were not performed by the agent. The agent subsequently commented on and closed #9 and #21 after final validation. See the final legacy redirect audit for their comment links and hosting limitation.

## Changed files

- `.tools/minify-inline-svg.mjs`
- `.tools/verify.mjs`
- `astro.config.mjs`
- `docs/remaining-website-issues.md`
- `package.json`
- `scripts/check-en-site.mjs`
- `scripts/check-redirects.mjs`
- `scripts/check-sl-site.mjs`
- `scripts/site-data.mjs`
- `src/components/LegacyRedirect.astro`
- `src/components/ProductPage.astro`
- `src/components/StandardPage.astro`
- `src/components/homepage/KuemHomepage.astro`
- `src/components/pages/CompanyPage.astro`
- `src/components/pages/IndustriesPage.astro`
- `src/components/pages/NexaviaPage.astro`
- `src/components/pages/SuccessStoriesPage.astro`
- `src/components/solutions/SolutionsOverview.astro`
- `src/data/legacyEnglishRedirects.ts`
- `src/data/legacySlovenianRedirects.ts`
- `src/data/site.ts`
- `src/data/successStories.ts`
- `src/lib/i18n.ts`
- `src/pages/[...legacy].astro`
- `src/pages/en/[...legacy].astro`
- `src/pages/en/industrial-iot.astro`
- `src/pages/en/partner-program.astro`
- `src/pages/en/references.astro`
- `src/pages/en/utilities.astro`
- `src/pages/industrial-iot.astro`
- `src/pages/nexavia-platform.astro`
- `src/pages/partner-program.astro`
- `src/pages/reference.astro`
- `src/pages/utilities.astro`
- `src/styles/solution-explorer.css`

## Exact redirect mapping

The final historical mapping (44 SL + 13 EN redirects) is documented in [legacy-redirect-audit.md](legacy-redirect-audit.md).
