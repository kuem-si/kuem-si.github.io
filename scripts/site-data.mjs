// Load small TypeScript data modules in Node without adding a runtime dependency.
// TypeScript is already required by `astro check`.
import { readFileSync } from "node:fs";
import ts from "typescript";

function moduleUrl(file) {
  let { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  outputText = outputText.replace(/from\s+["'](\.[^"']+)["']/g, (_, path) => {
    const dependency = new URL(path.endsWith(".ts") ? path : `${path}.ts`, file);
    return `from "${moduleUrl(dependency)}"`;
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}

export const loadSiteData = (path) => import(moduleUrl(new URL(path, import.meta.url)));
