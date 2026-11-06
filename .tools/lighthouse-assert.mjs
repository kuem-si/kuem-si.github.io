// Minimal Lighthouse score gate used by .github/workflows/verify.yml.
// Reads one or more Lighthouse JSON reports and fails if any category is
// below its threshold. GitHub runners are noisy, so performance is gated
// conservatively at 80 while quality categories stay high.
// Each argument is one report or a comma-separated list of runs of the same
// page; for a list, the run with the median performance score is gated.
import { readFileSync } from "node:fs";

const thresholds = {
  performance: 80,
  accessibility: 90,
  "best-practices": 90,
  seo: 90,
};

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error(
    "Usage: node .tools/lighthouse-assert.mjs <report.json[,run2.json,...]> [...]",
  );
  process.exit(2);
}

let failed = false;
for (const arg of files) {
  const runs = arg
    .split(",")
    .map((file) => ({ file, report: JSON.parse(readFileSync(file, "utf8")) }))
    .sort(
      (a, b) =>
        (a.report.categories.performance?.score ?? 0) -
        (b.report.categories.performance?.score ?? 0),
    );
  const { file, report } = runs[Math.floor((runs.length - 1) / 2)];
  console.log(`\n${file}`);
  if (runs.length > 1)
    console.log(
      `  performance per run: ${runs.map((r) => Math.round((r.report.categories.performance?.score ?? 0) * 100)).join(", ")} (median gated)`,
    );
  for (const [category, minimum] of Object.entries(thresholds)) {
    const score = report.categories[category]?.score;
    const percent = score == null ? 0 : Math.round(score * 100);
    const ok = percent >= minimum;
    if (!ok) failed = true;
    console.log(
      `${ok ? "PASS" : "FAIL"} ${category.padEnd(14)} ${percent} (min ${minimum})`,
    );
  }
  // The metrics behind the performance score, so a failing run shows why.
  const metrics = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "speed-index",
  ];
  console.log(
    metrics
      .map((id) => {
        const audit = report.audits[id];
        return audit ? `  ${id}: ${audit.displayValue}` : `  ${id}: n/a`;
      })
      .join("\n"),
  );
  // Audits that cost points outside performance, so a 96 shows its reasons.
  for (const category of ["accessibility", "best-practices", "seo"]) {
    for (const ref of report.categories[category]?.auditRefs ?? []) {
      const audit = report.audits[ref.id];
      if (ref.weight > 0 && audit?.score !== null && audit?.score < 1)
        console.log(`  ${category} miss: ${ref.id} (${audit.title})`);
    }
  }
  const lcpNode =
    report.audits["largest-contentful-paint-element"]?.details?.items?.[0]
      ?.items?.[0]?.node;
  if (lcpNode) console.log(`  LCP element: ${lcpNode.snippet}`);
}

if (failed) {
  console.error("\nLighthouse thresholds not met");
  process.exit(1);
}
console.log("\nALL LIGHTHOUSE THRESHOLDS MET");
