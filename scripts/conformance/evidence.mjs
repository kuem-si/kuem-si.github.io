#!/usr/bin/env node
// Rendered conformance evidence for the governance checker
// (kuem-design-governance policies/conformance-evidence.md, schema
// application-evidence-v1). Renders the built site (dist/) in Chromium and
// measures what static checks cannot: contrast, keyboard focus, non-colour
// status cues and target size.
//
//   npm run build && npm run conformance            # writes conformance/evidence.json
//   npm run conformance -- --check                  # CI: measure, fail on any failure, write nothing
//
// The evidence names the git tree it was measured on (git-tree-sha256-v1), so
// it is refused for any other commit. Never edit evidence.json by hand.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, relative } from "node:path";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const CHECK_ONLY = process.argv.includes("--check");
const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const OUT_DIR = "conformance";
const OUT = join(OUT_DIR, "evidence.json");
const APPEARANCE = "light"; // The corporate website is light-only (governance ADR 0001).
const VIEWPORTS = [1440, 1024, 390];
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const versions = {
  "axe-core": require("axe-core/package.json").version,
  playwright: require("playwright/package.json").version,
};

// WCAG 2.5.8 equivalent-control exception: on the showroom model, a sensor pin
// that sits too close to another one, or under the floating Nexavia dashboard,
// is also offered as a full-size entry in the sensor list under the model.
const EXCEPTIONS = [
  {
    match: (el) => el.matches("[data-sensor-pin]"),
    equivalent: (el) => `[data-sensor-list="${el.dataset.sensorPin}"]`,
    reason:
      "WCAG 2.5.8 equivalent control: the sensor list entry opens the same card",
  },
];

// Elements that show a status in colour (alarm, offline). Each must also carry
// text or an accessible name that says so.
const STATUS_SELECTOR =
  '[data-state="alert"], [data-state="offline"], .is-offline, [aria-invalid="true"]';

// ---------- source digest (git-tree-sha256-v1) ----------
const git = (...a) =>
  execFileSync("git", a, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
function treeDigest(exclude) {
  const hash = createHash("sha256");
  for (const line of git("ls-tree", "-r", "--full-tree", "HEAD").split("\n")) {
    if (!line) continue;
    const path = line.slice(line.indexOf("\t") + 1);
    if (exclude.some((p) => path === p || path.startsWith(`${p}/`))) continue;
    hash.update(`${line}\n`);
  }
  return hash.digest("hex");
}
const dirty = git("status", "--porcelain", "--untracked-files=no")
  .split("\n")
  .filter((l) => l && !l.slice(3).startsWith(`${OUT_DIR}/`));
if (dirty.length && !CHECK_ONLY) {
  console.error(
    `Commit your changes first; evidence is measured on the committed tree:\n${dirty.join("\n")}`,
  );
  process.exit(2);
}
if (!existsSync(join(DIST, "index.html"))) {
  console.error("dist/ is missing: run npm run build first.");
  process.exit(2);
}

// ---------- static server for dist/ ----------
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
const server = createServer((req, res) => {
  let file = join(DIST, decodeURIComponent(req.url.split("?")[0]));
  if (existsSync(file) && statSync(file).isDirectory())
    file = join(file, "index.html");
  if (!file.startsWith(DIST) || !existsSync(file)) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name !== "_astro" && e.name !== "images") walk(join(dir, e.name));
    } else if (e.name === "index.html")
      pages.push(
        `/${relative(DIST, dir)}${dir === DIST ? "" : "/"}`.replace("//", "/"),
      );
  }
})(DIST);
pages.sort();

const results = {
  "rendered-contrast": {
    method:
      "axe-core color-contrast (WCAG 2.2 AA) on every page at every viewport",
    tested: 0,
    failures: [],
  },
  "rendered-focus-visible": {
    method:
      "keyboard walk (Tab) through every focus stop; each stop shows an outline or box-shadow of at least 2 CSS px, on the element or its focus-within container",
    tested: 0,
    failures: [],
  },
  "rendered-status-not-colour-alone": {
    method: `every visible status element (${STATUS_SELECTOR}) carries text or an accessible name, after driving each showroom sensor past its alarm threshold; axe-core link-in-text-block`,
    tested: 0,
    failures: [],
  },
  "rendered-target-size": {
    method:
      "axe-core target-size (WCAG 2.5.8) at every viewport; a target reported as obscured is measured again after scrolling it into view",
    tested: 0,
    failures: [],
    exceptions: [],
  },
};
const fail = (id, page, viewport, target, message) =>
  results[id].failures.push({
    page,
    viewport,
    appearance: APPEARANCE,
    target,
    message,
  });

// Pixels of the control and a 6 px margin (document coordinates, fullPage
// capture clipped), focused against blurred, with animations disabled. At
// least 96 pixels must change clearly: a 2 px ring around a 12 px thumb.
let decoder;
async function ringInPixels(page, b) {
  const pad = 6;
  const clip = {
    x: Math.max(0, b.x - pad),
    y: Math.max(0, b.y - pad),
    width: b.w + 2 * pad,
    height: b.h + 2 * pad,
  };
  const shot = () =>
    page
      .screenshot({
        clip,
        fullPage: true,
        animations: "disabled",
        caret: "hide",
      })
      .then((x) => x.toString("base64"));
  const on = await shot();
  await page.evaluate(() => document.activeElement?.blur());
  const off = await shot();
  // Back to keyboard focus on the same element: Shift+Tab then Tab.
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  // Decoded on a blank page: the site's content security policy blocks data: fetches.
  decoder ??= await browser.newPage();
  return decoder.evaluate(
    async ({ on, off }) => {
      const load = async (s) => {
        const img = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${s}`)).blob(),
        );
        const c = new OffscreenCanvas(img.width, img.height);
        const g = c.getContext("2d");
        g.drawImage(img, 0, 0);
        return g.getImageData(0, 0, img.width, img.height);
      };
      const [a, z] = await Promise.all([load(on), load(off)]);
      let changed = 0;
      for (let y = 0; y < a.height; y++)
        for (let x = 0; x < a.width; x++) {
          const i = (y * a.width + x) * 4;
          if (
            Math.abs(a.data[i] - z.data[i]) +
              Math.abs(a.data[i + 1] - z.data[i + 1]) +
              Math.abs(a.data[i + 2] - z.data[i + 2]) >
            60
          )
            changed++;
        }
      return changed >= 96;
    },
    { on, off },
  );
}

const browser = await chromium.launch();
for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport, height: 900 },
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  const page = await context.newPage();
  for (const path of pages) {
    await page.goto(BASE + path, { waitUntil: "load" });
    await page.waitForTimeout(150);
    await page.addScriptTag({ content: AXE });

    // Contrast, links in text, target size.
    const axe = await page.evaluate(async () => {
      const r = await window.axe.run(document, {
        runOnly: ["color-contrast", "link-in-text-block", "target-size"],
        resultTypes: ["violations", "passes"],
      });
      const nodes = (id, kind) => r[kind].find((v) => v.id === id)?.nodes ?? [];
      const pick = (id) =>
        nodes(id, "violations").map((n) => ({
          target: n.target.join(" "),
          message: (n.any[0] ?? n.all[0] ?? n.none[0])?.message ?? "",
        }));
      return {
        contrast: pick("color-contrast"),
        contrastN:
          nodes("color-contrast", "violations").length +
          nodes("color-contrast", "passes").length,
        link: pick("link-in-text-block"),
        linkN:
          nodes("link-in-text-block", "violations").length +
          nodes("link-in-text-block", "passes").length,
        target: pick("target-size"),
        targetN:
          nodes("target-size", "violations").length +
          nodes("target-size", "passes").length,
      };
    });
    results["rendered-contrast"].tested += axe.contrastN;
    for (const v of axe.contrast)
      fail("rendered-contrast", path, viewport, v.target, v.message);
    results["rendered-status-not-colour-alone"].tested += axe.linkN;
    for (const v of axe.link)
      fail(
        "rendered-status-not-colour-alone",
        path,
        viewport,
        v.target,
        v.message,
      );
    results["rendered-target-size"].tested += axe.targetN;
    for (const v of axe.target) {
      // Measured again where the user reaches it: scrolled into view.
      const again = await page.evaluate(async (sel) => {
        const el = document.querySelector(sel);
        if (!el) return { gone: true };
        // Pointer criterion: scrolled into view (scroll-padding respected), not focused.
        el.scrollIntoView({ block: "center", inline: "nearest" });
        await new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        );
        // Whole document, so neighbours and overlapping layers still count.
        const r = await window.axe.run(document, {
          runOnly: ["target-size"],
          elementRef: true,
        });
        const bad = r.violations[0]?.nodes.find((n) => n.element === el);
        return {
          ok: !bad,
          message: bad ? (bad.any[0] ?? bad.all[0])?.message : "",
        };
      }, v.target);
      if (again.ok) continue;
      const exception = await page.evaluate(
        ({ sel, rules }) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          for (const rule of rules) {
            if (!new Function("el", `return (${rule.match})(el)`)(el)) continue;
            const eqSel = new Function("el", `return (${rule.equivalent})(el)`)(
              el,
            );
            const eq = document.querySelector(eqSel);
            const r = eq?.getBoundingClientRect();
            if (
              eq &&
              r.width >= 24 &&
              r.height >= 24 &&
              getComputedStyle(eq).visibility !== "hidden" &&
              !eq.hidden
            )
              return { equivalent: eqSel, reason: rule.reason };
          }
          return null;
        },
        {
          sel: v.target,
          rules: EXCEPTIONS.map((x) => ({
            match: x.match.toString(),
            equivalent: x.equivalent.toString(),
            reason: x.reason,
          })),
        },
      );
      if (exception)
        results["rendered-target-size"].exceptions.push({
          page: path,
          viewport,
          target: v.target,
          ...exception,
        });
      else
        fail(
          "rendered-target-size",
          path,
          viewport,
          v.target,
          again.message || v.message,
        );
    }

    // Keyboard walk.
    await page.evaluate(() => {
      document.activeElement?.blur();
      window.scrollTo(0, 0);
    });
    const seen = new Set();
    for (let i = 0; i < 600; i++) {
      await page.keyboard.press("Tab");
      const stop = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return { end: true };
        const path = (n) => {
          const parts = [];
          for (
            let e = n;
            e && e.nodeType === 1 && parts.length < 6;
            e = e.parentElement
          ) {
            let s = e.tagName.toLowerCase();
            if (e.id) {
              parts.unshift(`${s}#${e.id}`);
              break;
            }
            const cls = [...e.classList].slice(0, 2).join(".");
            if (cls) s += `.${cls}`;
            const sib = e.parentElement
              ? [...e.parentElement.children].filter(
                  (c) => c.tagName === e.tagName,
                )
              : [];
            if (sib.length > 1) s += `:nth-of-type(${sib.indexOf(e) + 1})`;
            parts.unshift(s);
          }
          return parts.join(" > ");
        };
        const r = el.getBoundingClientRect();
        const visibleBox = r.width > 0 && r.height > 0;
        const ring = (e) => {
          const cs = getComputedStyle(e);
          const outline =
            cs.outlineStyle !== "none" &&
            parseFloat(cs.outlineWidth) >= 2 &&
            !/rgba\(.*,\s*0\)$|transparent/.test(cs.outlineColor);
          const shadow =
            cs.boxShadow !== "none" &&
            /\d+px/.test(cs.boxShadow) &&
            !/rgba\([^)]*,\s*0\)/.test(cs.boxShadow);
          return {
            outline,
            shadow,
            sig: `${cs.outlineStyle}|${cs.outlineWidth}|${cs.outlineColor}|${cs.boxShadow}|${cs.borderColor}`,
          };
        };
        // SVG controls draw their ring as a stroke on a child shape.
        const strokes = () =>
          [...el.querySelectorAll("*")].slice(0, 40).map((d) => {
            const cs = getComputedStyle(d);
            return {
              on: cs.stroke !== "none" && parseFloat(cs.strokeWidth) >= 2,
              sig: `${cs.stroke}|${cs.strokeWidth}`,
            };
          });
        const chain = [
          el,
          el.parentElement,
          el.parentElement?.parentElement,
        ].filter(Boolean);
        const focused = chain.map(ring);
        const focusedStrokes = strokes();
        el.blur();
        const resting = chain.map(ring);
        const restingStrokes = strokes();
        el.focus({ preventScroll: true });
        const visible =
          focused.some(
            (f, k) => (f.outline || f.shadow) && f.sig !== resting[k].sig,
          ) ||
          focusedStrokes.some(
            (f, k) => f.on && f.sig !== restingStrokes[k].sig,
          );
        return {
          key: path(el),
          visible,
          visibleBox,
          box: visibleBox
            ? {
                x: r.left + scrollX,
                y: r.top + scrollY,
                w: r.width,
                h: r.height,
              }
            : null,
        };
      });
      if (stop.end || seen.has(stop.key)) break;
      seen.add(stop.key);
      if (!stop.visibleBox) continue; // e.g. a focus trap sentinel with no box
      results["rendered-focus-visible"].tested += 1;
      // Rings drawn on pseudo-elements (range thumbs) have no computed style to
      // read: compare pixels in a band around the control, focused and not.
      if (!stop.visible && stop.box && (await ringInPixels(page, stop.box)))
        continue;
      if (!stop.visible)
        fail(
          "rendered-focus-visible",
          path,
          viewport,
          stop.key,
          "no focus indicator of at least 2 px appears on focus",
        );
    }

    // Status cues: drive every sensor past its alarm threshold, then check every status element.
    await page.evaluate(() => {
      for (const card of document.querySelectorAll(
        "[data-sensor-popover][data-alert]",
      )) {
        const value = card.querySelector("[data-sensor-value]");
        if (value) value.textContent = String(Number(card.dataset.alert) + 1);
      }
    });
    await page.waitForTimeout(50);
    const status = await page.evaluate((selector) => {
      const out = [];
      for (const el of document.querySelectorAll(selector)) {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const shown =
          (r.width > 0 && r.height > 0 && cs.visibility !== "hidden") ||
          el.matches("[data-sensor-pin]");
        if (!shown) continue;
        const described = ["aria-describedby", "aria-errormessage"]
          .flatMap((a) => (el.getAttribute(a) ?? "").split(/\s+/))
          .map((id) => id && document.getElementById(id))
          .filter((d) => d && !d.hidden)
          .map((d) => d.innerText);
        const name = [
          el.getAttribute("aria-label"),
          el.getAttribute("aria-description"),
          el.title,
          el.innerText,
          ...described,
        ]
          .filter(Boolean)
          .join(" ")
          .trim();
        const labelled = el.matches("[data-state='alert']")
          ? /alarm/i.test(name)
          : name.length > 0;
        out.push({
          target: el.id
            ? `#${el.id}`
            : `${el.tagName.toLowerCase()}[data-state="${el.dataset.state ?? ""}"]${el.dataset.sensorPin ? `[data-sensor-pin="${el.dataset.sensorPin}"]` : el.dataset.sensorPopover ? `[data-sensor-popover="${el.dataset.sensorPopover}"]` : ""}`,
          labelled,
          name: name.slice(0, 60),
        });
      }
      return out;
    }, STATUS_SELECTOR);
    results["rendered-status-not-colour-alone"].tested += status.length;
    for (const s of status)
      if (!s.labelled)
        fail(
          "rendered-status-not-colour-alone",
          path,
          viewport,
          s.target,
          `status shown in colour without a text cue (accessible name: "${s.name}")`,
        );
  }
  await context.close();
}
await browser.close();
server.close();

const checks = {};
for (const [id, r] of Object.entries(results)) {
  checks[id] = {
    result: r.failures.length ? "fail" : "pass",
    method: r.method,
    tested: r.tested,
    failures: r.failures,
    ...(r.exceptions ? { exceptions: r.exceptions } : {}),
  };
  console.log(
    `${r.failures.length ? "FAIL" : "PASS"} ${id}: ${r.tested} tested, ${r.failures.length} failure(s)${r.exceptions?.length ? `, ${r.exceptions.length} exception(s)` : ""}`,
  );
  for (const f of r.failures.slice(0, 15))
    console.log(`  ${f.page} @${f.viewport}: ${f.target}: ${f.message}`);
}
const failed = Object.values(checks).some((c) => c.result === "fail");
if (!CHECK_ONLY) {
  const evidence = {
    schemaVersion: 1,
    application: "kuem-website",
    generator: {
      script:
        "npm run build && npm run conformance (scripts/conformance/evidence.mjs)",
      tools: versions,
    },
    source: {
      algorithm: "git-tree-sha256-v1",
      digest: treeDigest([OUT_DIR]),
      exclude: [OUT_DIR],
    },
    appearances: [APPEARANCE],
    viewports: VIEWPORTS,
    pages: pages.length,
    checks,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    `wrote ${OUT} (${pages.length} pages, source ${evidence.source.digest.slice(0, 12)})`,
  );
}
process.exit(failed ? 1 : 0);
