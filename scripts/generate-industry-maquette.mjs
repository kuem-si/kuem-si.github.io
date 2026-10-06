// Renders the industry maquette (scripts/industry/scene.js); see
// scripts/render-maquette.mjs for what it writes.
//
// Usage: node scripts/generate-industry-maquette.mjs [--preview]

import { renderMaquette } from "./render-maquette.mjs";
import { ACTORS, ROUTES } from "./industry/routes.mjs";

await renderMaquette({ name: "industry", routes: ROUTES, actors: ACTORS });
