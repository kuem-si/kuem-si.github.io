// Minimal Lighthouse score gate used by .github/workflows/verify.yml.
// Reads one or more Lighthouse JSON reports and fails if any category is
// below its threshold. GitHub runners are noisy, so performance is gated
// conservatively at 80 while quality categories stay high.
import { readFileSync } from "node:fs";

const thresholds = {
  performance: 80,
  accessibility: 90,
  "best-practices": 90,
  seo: 90,
};

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node .tools/lighthouse-assert.mjs <report.json> [...]");
  process.exit(2);
}

let failed = false;
for (const file of files) {
  const report = JSON.parse(readFileSync(file, "utf8"));
  console.log(`\n${file}`);
  for (const [category, minimum] of Object.entries(thresholds)) {
    const score = report.categories[category]?.score;
    const percent = score == null ? 0 : Math.round(score * 100);
    const ok = percent >= minimum;
    if (!ok) failed = true;
    console.log(
      `${ok ? "PASS" : "FAIL"} ${category.padEnd(14)} ${percent} (min ${minimum})`,
    );
  }
}

if (failed) {
  console.error("\nLighthouse thresholds not met");
  process.exit(1);
}
console.log("\nALL LIGHTHOUSE THRESHOLDS MET");
