// Checks that the self-hosted brand fonts can draw the text of the built site.
// Every @font-face rule in dist is resolved to its WOFF2 file. A character is
// covered by a family when one of the family's faces lists it in its
// unicode-range and the font has a glyph for it. Required characters are
// printable ASCII, the Slovenian letters, and every Latin or punctuation
// character that appears in a built page.
// Usage: node scripts/check-fonts.mjs (after npm run build)
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliDecompressSync } from "node:zlib";
import { dist, htmlFiles, visibleText } from "./check-redirects.mjs";

// Code points of the font's cmap (formats 4 and 12) that map to a glyph.
function woff2Characters(file) {
  const font = readFileSync(file);
  if (font.toString("latin1", 0, 4) !== "wOF2")
    throw new Error(`${file} is not a WOFF2 font`);
  let offset = 48;
  const base128 = () => {
    let value = 0;
    for (let i = 0; i < 5; i++) {
      const byte = font[offset++];
      value = value * 128 + (byte & 0x7f);
      if (byte < 0x80) return value;
    }
    throw new Error(`${file}: invalid table directory`);
  };
  // Table directory: known tags are stored as an index (0 is cmap, 10 glyf,
  // 11 loca), others as four bytes. Transformed tables store a second length.
  const tables = [];
  for (let i = font.readUInt16BE(12); i > 0; i--) {
    const flags = font[offset++];
    const index = flags & 0x3f;
    const tag =
      index === 63 ? font.toString("latin1", offset, (offset += 4)) : index;
    const version = flags >> 6;
    const length = base128();
    const transformed =
      index === 10 || index === 11 ? version !== 3 : version !== 0;
    tables.push({ tag, length: transformed ? base128() : length });
  }
  const data = brotliDecompressSync(
    font.subarray(offset, offset + font.readUInt32BE(20)),
  );
  let start = 0;
  const table = tables.find((table) => {
    if (table.tag === 0 || table.tag === "cmap") return true;
    start += table.length;
    return false;
  });
  if (!table) throw new Error(`${file} has no cmap table`);
  const cmap = data.subarray(start, start + table.length);
  const characters = new Set();
  for (let i = 0; i < cmap.readUInt16BE(2); i++) {
    const subtable = cmap.readUInt32BE(8 + i * 8);
    const format = cmap.readUInt16BE(subtable);
    if (format === 4) {
      const segments = cmap.readUInt16BE(subtable + 6) / 2;
      const ends = subtable + 14;
      const starts = ends + segments * 2 + 2;
      const deltas = starts + segments * 2;
      const rangeOffsets = deltas + segments * 2;
      for (let s = 0; s < segments; s++) {
        const first = cmap.readUInt16BE(starts + s * 2);
        const last = cmap.readUInt16BE(ends + s * 2);
        const delta = cmap.readUInt16BE(deltas + s * 2);
        const rangeOffset = cmap.readUInt16BE(rangeOffsets + s * 2);
        for (let c = first; c <= last && c !== 0xffff; c++) {
          let glyph = c;
          if (rangeOffset) {
            glyph = cmap.readUInt16BE(
              rangeOffsets + s * 2 + rangeOffset + (c - first) * 2,
            );
            if (glyph === 0) continue;
          }
          if ((glyph + delta) & 0xffff) characters.add(c);
        }
      }
    } else if (format === 12) {
      for (let g = 0; g < cmap.readUInt32BE(subtable + 12); g++) {
        const group = subtable + 16 + g * 12;
        const first = cmap.readUInt32BE(group);
        const last = cmap.readUInt32BE(group + 4);
        const glyph = cmap.readUInt32BE(group + 8);
        for (let c = first; c <= last; c++)
          if (glyph + c - first) characters.add(c);
      }
    }
  }
  return characters;
}

// "U+0000-00FF,U+0131" -> [[0, 255], [305, 305]]; no range means everything.
const parseRange = (value) =>
  value
    ? value.split(",").map((part) => {
        const [first, last = first] = part
          .trim()
          .replace(/^U\+/i, "")
          .split("-")
          .map((hex) => parseInt(hex, 16));
        return [first, last];
      })
    : [[0, 0x10ffff]];

export function checkFonts() {
  const css = [
    ...htmlFiles().map(
      (file) =>
        readFileSync(file, "utf8").match(/<head>[\s\S]*?<\/head>/)?.[0] ?? "",
    ),
    ...readdirSync(join(dist, "_astro"))
      .filter((file) => file.endsWith(".css"))
      .map((file) => readFileSync(join(dist, "_astro", file), "utf8")),
  ].join("\n");
  const faces = new Map();
  for (const [rule, body] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    if (faces.has(rule)) continue;
    const family = body.match(/font-family:\s*["']?([^;"']+)/)?.[1];
    const url = body.match(/url\(\s*["']?([^"')]+)/)?.[1];
    faces.set(rule, {
      family,
      range: parseRange(body.match(/unicode-range:\s*([^;}]+)/)?.[1]),
      characters: woff2Characters(join(dist, url.replace(/^\//, ""))),
    });
  }

  const required = new Set();
  const add = (text) => {
    for (const character of text) required.add(character.codePointAt(0));
  };
  for (let c = 0x21; c < 0x7f; c++) required.add(c);
  add("\u010d\u0161\u017e\u010c\u0160\u017d"); // č š ž Č Š Ž
  for (const file of htmlFiles()) {
    const text = visibleText(readFileSync(file, "utf8"))
      .replace(/&#x([\da-f]+);/gi, (_, hex) =>
        String.fromCodePoint(parseInt(hex, 16)),
      )
      .replace(/&#(\d+);/g, (_, decimal) =>
        String.fromCodePoint(Number(decimal)),
      );
    // Latin-1, Latin Extended-A and -B, and general punctuation; spaces and
    // invisible format characters need no glyph.
    add(
      text.replace(
        /[^\u00a0-\u024f\u2010-\u205e]|\s|[\u200b-\u200f\u2028-\u202f]/gu,
        "",
      ),
    );
  }

  const problems = [];
  const families = [...new Set([...faces.values()].map((f) => f.family))];
  if (families.length === 0) problems.push("no @font-face rules found");
  for (const family of families) {
    const own = [...faces.values()].filter((face) => face.family === family);
    const missing = [...required].filter(
      (c) =>
        !own.some(
          ({ range, characters }) =>
            characters.has(c) &&
            range.some(([first, last]) => c >= first && c <= last),
        ),
    );
    if (missing.length)
      problems.push(
        `${family} cannot draw ${missing.length} characters: ${missing
          .sort(
            (a, b) =>
              /\p{L}/u.test(String.fromCodePoint(b)) -
                /\p{L}/u.test(String.fromCodePoint(a)) || a - b,
          )
          .slice(0, 24)
          .map((c) => String.fromCodePoint(c))
          .join(" ")}${missing.length > 24 ? " ..." : ""}`,
      );
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkFonts();
  for (const problem of problems) console.log(`FAIL ${problem}`);
  if (problems.length) process.exitCode = 1;
  else console.log("Brand fonts cover the text of every page.");
}
