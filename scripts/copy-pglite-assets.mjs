import { copyFileSync } from "node:fs";
import { join } from "node:path";

// Nitro inlines @electric-sql/pglite but does not emit the wasm/data files
// the bundle loads via import.meta.url. Preview (no DATABASE_URL) needs them
// beside the server chunk. Deployed apps use Neon and never open these files.
const src = "node_modules/@electric-sql/pglite/dist";
const dest = ".vercel/output/functions/__server.func/_libs";
for (const file of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
  copyFileSync(join(src, file), join(dest, file));
}
console.log("[pglite] copied wasm assets next to the server bundle");
