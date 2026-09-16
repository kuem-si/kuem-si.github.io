#!/usr/bin/env node
// Post-build pass: minify inline <svg> blocks inside dist HTML with SVGO.
// Keeps viewBox, ids (fragment/aria refs), titles and fills so the rendering,
// accessibility tree and internal anchors stay intact.
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { optimize } from "svgo";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

if (!existsSync("dist")) {
  console.log("dist not found, skipping");
  process.exit(0);
}

const svgoOptions = {
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,
          removeDesc: false,
          removeEmptyContainers: false,
          removeHiddenElems: false,
          removeUselessStrokeAndFill: false,
        },
      },
    },
  ],
};

const htmlFiles = walk("dist").filter((p) => p.endsWith(".html"));
let filesChanged = 0;
let svgsMinified = 0;
let bytesSaved = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  let changed = false;
  const minified = html.replace(/<svg[\s\S]*?<\/svg>/g, (svg) => {
    if (/<script|<foreignObject/i.test(svg)) return svg;
    // SVGO's parser rejects valueless attributes (e.g. <path data-api-path>);
    // normalize data-* attributes to empty strings before optimizing.
    const normalized = svg.replace(/(\s)(data-[\w.-]*)(?=\s|\/?>)/g, '$1$2=""');
    const result = optimize(normalized, { ...svgoOptions, path: file });
    if (result.data.length < svg.length) {
      changed = true;
      svgsMinified += 1;
      bytesSaved += svg.length - result.data.length;
      return result.data;
    }
    return svg;
  });
  if (changed) {
    writeFileSync(file, minified);
    filesChanged += 1;
  }
}
console.log(
  `SVG minify: ${filesChanged} files, ${svgsMinified} svgs, -${(bytesSaved / 1024).toFixed(1)} KB`,
);
