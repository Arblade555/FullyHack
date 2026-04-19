// Sanity check: prove the Human Delta corpus is alive and searchable.
//
// Usage:
//   npm run check:corpus
//
// Prints:
//   1. The full /source tree (depth 4) so you can see actual page slugs.
//   2. A sample search for "deepest fish ever recorded" — top 3 hits with
//      their score, URL, and a snippet preview.
//
// If (1) shows page directories under en.wikipedia.org and (2) returns
// real text snippets, the HD-backed pipeline is ready.

import * as fs from "node:fs";
import * as path from "node:path";

function loadDotEnv() {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadDotEnv();
  const apiKey = process.env.HUMANDELTA_API_KEY;
  if (!apiKey) {
    console.error("HUMANDELTA_API_KEY not set. Add it to .env.local first.");
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("humandelta");
  const HumanDelta = mod.HumanDelta ?? mod.default;
  const baseUrl = process.env.HUMANDELTA_BASE_URL;
  const hd = new HumanDelta(baseUrl ? { apiKey, baseUrl } : { apiKey });

  console.log("—— index jobs (status) ——");
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobs: any[] = await hd.indexes.list({ limit: 200 });
    for (const j of jobs) {
      console.log(`  • [${j.status}] ${j.name ?? "(no name)"} — id=${j.id}`);
    }
  } catch (err) {
    console.warn("indexes.list failed:", (err as Error).message);
  }

  console.log("\n—— /source tree (depth 4) ——");
  try {
    const tree = await hd.fs.shell("tree /source -L 4");
    console.log(tree);
  } catch (err) {
    console.warn("tree failed:", (err as Error).message);
  }

  // Read one of the deep-sea .md files directly to confirm crawler actually
  // extracted text. If these files are empty / 1 line, embeddings will be
  // empty too and search will return nothing — search isn't broken, the
  // crawler just didn't capture content.
  const probeFiles = [
    "/source/website/en.wikipedia.org/pseudoliparis_swirei.md",
    "/source/website/en.wikipedia.org/hydrothermal_vent.md",
    "/source/website/en.wikipedia.org/challenger_deep.md",
  ];
  for (const path of probeFiles) {
    console.log(`\n—— file content: ${path} ——`);
    try {
      const content = await hd.fs.read(path);
      const text = typeof content === "string" ? content : String(content);
      console.log(`(length: ${text.length} chars)`);
      console.log(text.slice(0, 600).replace(/\n{3,}/g, "\n\n"));
      if (text.length > 600) console.log("…[truncated]");
    } catch (err) {
      console.warn("read failed:", (err as Error).message);
    }
  }

  // Quick wc-style file size check across the whole tree.
  console.log("\n—— file sizes ——");
  try {
    const out = await hd.fs.shell("ls -la /source/website/en.wikipedia.org");
    console.log(out);
  } catch (err) {
    console.warn("ls failed:", (err as Error).message);
  }

  // Run the same three probes DeepDelta's live pipeline would see, but through
  // our fs-based retrieval (humandeltaSearch). This replaces the hd.search()
  // probe loop because hd.search was returning 0 hits at workshop-time.
  const { humandeltaSearch } = await import("../lib/humandelta");
  const demoProbes = [
    "What's the deepest fish ever recorded?",
    "When were hydrothermal vents first observed on the Gakkel Ridge?",
    "What's the deepest octopus ever filmed?",
  ];
  for (const probe of demoProbes) {
    console.log(`\n—— fs-retrieval probe: "${probe}" ——`);
    try {
      const sources = await humandeltaSearch(probe, 5);
      if (sources.length === 0) {
        console.log("  (0 sources — expected for an off-topic probe)");
        continue;
      }
      for (const s of sources) {
        console.log(`  • ${s.title} (${s.publisher}, year≈${s.year || "?"})`);
        console.log(`    ${s.snippet.slice(0, 220)}…`);
      }
    } catch (err) {
      console.error("  fs-retrieval failed:", (err as Error).message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
