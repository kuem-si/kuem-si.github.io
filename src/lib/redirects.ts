/**
 * Legacy duplicate URL paths.
 *
 * These paths historically rendered the same content as a canonical page
 * (language duplicated under the root or under a locale prefix). They are now
 * emitted as `<Redirect />` stubs (meta refresh + canonical + noindex) and are
 * excluded from the sitemap so search engines and LLM crawlers only index the
 * canonical URL of each language pair.
 */
export const redirectFromPaths = new Set([
  // English content previously mirrored at the root.
  "/about",
  "/case-studies",
  "/contact",
  "/industrial-iot",
  "/nexavia-platform",
  "/partner-program",
  "/privacy",
  "/utilities",
  // English content previously mirrored under /en/.
  "/en/about",
  "/en/case-studies",
  // Slovenian content previously mirrored under /sl/ or at legacy slugs.
  "/sl",
  "/sl/resitve",
  "/sl/kontakt",
  "/sl/contact",
  "/sl/reference",
  "/sl/case-studies",
  "/sl/privacy",
  "/sl/o-nas",
  "/sl/about",
  "/o-podjetju",
]);

export function isRedirectPath(pathname: string): boolean {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return redirectFromPaths.has(clean);
}
