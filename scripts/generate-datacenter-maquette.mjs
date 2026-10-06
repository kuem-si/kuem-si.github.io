// Renders the datacenter maquette (scripts/datacenter/scene.js); see
// scripts/render-maquette.mjs for what it writes.
//
// Usage: node scripts/generate-datacenter-maquette.mjs [--preview]

import { renderMaquette } from "./render-maquette.mjs";
import { ACTORS, ROUTES } from "./datacenter/routes.mjs";

await renderMaquette({ name: "datacenter", routes: ROUTES, actors: ACTORS });
