// Renders the smart-marina maquette (scripts/marina/scene.js); see
// scripts/render-maquette.mjs for what it writes.
//
// Usage: node scripts/generate-marina-maquette.mjs [--preview]

import { renderMaquette } from "./render-maquette.mjs";
import { ROUTES } from "./marina/routes.mjs";

await renderMaquette({ name: "marina", routes: ROUTES });
