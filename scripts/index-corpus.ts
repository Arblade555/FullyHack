// One-shot Human Delta indexer for DeepDelta's deep-sea corpus.
//
// Usage:
//   1. Make sure HUMANDELTA_API_KEY is set in .env.local (or your shell).
//   2. Run:  npm run index:corpus
//
// Safe to re-run — already-indexed URLs are skipped.
//
// After indexing, the HD /source filesystem will hold a snapshot of each
// site's crawled pages. DeepDelta's /api/query will then route semantic
// search through hd.search() against this corpus.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import * as fs from "node:fs";
import * as path from "node:path";

// Minimal .env.local loader so we don't depend on dotenv. We only look for
// HUMANDELTA_API_KEY / HUMANDELTA_BASE_URL here; other vars are ignored.
function loadDotEnv() {
  const p = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

const SEED_URLS: Array<{ url: string; name: string; maxPages?: number }> = [
  // ——— Original seed set (records / vents / zones) ———
  { url: "https://en.wikipedia.org/wiki/Mariana_snailfish", name: "Wiki: Mariana snailfish", maxPages: 5 },
  { url: "https://en.wikipedia.org/wiki/Hadal_zone", name: "Wiki: Hadal zone", maxPages: 5 },
  { url: "https://en.wikipedia.org/wiki/Hydrothermal_vent", name: "Wiki: Hydrothermal vent", maxPages: 10 },
  { url: "https://en.wikipedia.org/wiki/Gakkel_Ridge", name: "Wiki: Gakkel Ridge", maxPages: 5 },
  { url: "https://en.wikipedia.org/wiki/Challenger_Deep", name: "Wiki: Challenger Deep", maxPages: 5 },
  { url: "https://en.wikipedia.org/wiki/Deep_sea", name: "Wiki: Deep sea", maxPages: 10 },
  { url: "https://en.wikipedia.org/wiki/Bioluminescence", name: "Wiki: Bioluminescence", maxPages: 5 },
  { url: "https://en.wikipedia.org/wiki/Abyssal_zone", name: "Wiki: Abyssal zone", maxPages: 5 },

  // ——— Organisms & biology ———
  // Sea cucumber: demo-relevant — gives the judge a real source to explain
  // what's retrievable for the "giant cucumber" gap query.
  { url: "https://en.wikipedia.org/wiki/Sea_cucumber", name: "Wiki: Sea cucumber", maxPages: 10 },
  { url: "https://en.wikipedia.org/wiki/Anglerfish", name: "Wiki: Anglerfish", maxPages: 10 },
  { url: "https://en.wikipedia.org/wiki/Giant_squid", name: "Wiki: Giant squid", maxPages: 10 },
  { url: "https://en.wikipedia.org/wiki/Tube_worm", name: "Wiki: Tube worm", maxPages: 5 },
  { url: "https://en.wikipedia.org/wiki/Vampire_squid", name: "Wiki: Vampire squid", maxPages: 5 },

  // ——— Geography & features ———
  { url: "https://en.wikipedia.org/wiki/Mariana_Trench", name: "Wiki: Mariana Trench", maxPages: 10 },
  // Izu-Ogasawara Trench: demo-relevant — supports the 2023 deepest-fish
  // record (8,336 m) cited in the "deepest fish" query. URL uses an en-dash
  // (%E2%80%93), which is the canonical Wikipedia page title.
  { url: "https://en.wikipedia.org/wiki/Izu%E2%80%93Ogasawara_Trench", name: "Wiki: Izu-Ogasawara Trench", maxPages: 5 },
  { url: "https://en.wikipedia.org/wiki/Mid-Atlantic_Ridge", name: "Wiki: Mid-Atlantic Ridge", maxPages: 10 },
  { url: "https://en.wikipedia.org/wiki/Cold_seep", name: "Wiki: Cold seep", maxPages: 5 },

  // ——— Exploration & tech ———
  { url: "https://en.wikipedia.org/wiki/DSV_Alvin", name: "Wiki: DSV Alvin", maxPages: 5 },
  { url: "https://en.wikipedia.org/wiki/Challenger_expedition", name: "Wiki: Challenger expedition", maxPages: 10 },

  // ——— Ecology & phenomena ———
  { url: "https://en.wikipedia.org/wiki/Whale_fall", name: "Wiki: Whale fall", maxPages: 5 },
  { url: "https://en.wikipedia.org/wiki/Chemosynthesis", name: "Wiki: Chemosynthesis", maxPages: 5 },
  { url: "https://en.wikipedia.org/wiki/Marine_snow", name: "Wiki: Marine snow", maxPages: 5 },

  // ——— Zones ———
  { url: "https://en.wikipedia.org/wiki/Mesopelagic_zone", name: "Wiki: Mesopelagic zone", maxPages: 5 },
];

async function main() {
  loadDotEnv();

  const apiKey = process.env.HUMANDELTA_API_KEY;
  if (!apiKey) {
    console.error("HUMANDELTA_API_KEY not set. Add it to .env.local or your shell env.");
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("humandelta");
  const HumanDelta = mod.HumanDelta ?? mod.default;
  const baseUrl = process.env.HUMANDELTA_BASE_URL;
  const hd = new HumanDelta(baseUrl ? { apiKey, baseUrl } : { apiKey });

  // Pull existing indexes so we can skip URLs we've already done.
  // The IndexJob shape exposes `id`, `status`, `name`, `source_type` — NOT
  // a source URL — so we dedupe by `name` (we set a unique name per seed).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let existing: any[] = [];
  try {
    existing = await hd.indexes.list({ limit: 200 });
  } catch (err) {
    console.warn("Could not list existing indexes:", (err as Error).message);
  }

  // Skip anything that's already completed, queued, or running (including
  // jobs that HD is still processing from a previous Ctrl+C'd run — killing
  // the local script doesn't stop the remote job). Only retry entries that
  // previously failed or were cancelled.
  const LIVE_STATUSES = new Set(["completed", "queued", "running"]);
  const skipNames = new Set<string>(
    existing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((j: any) => LIVE_STATUSES.has(String(j.status)))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((j: any) => String(j.name ?? ""))
      .filter(Boolean),
  );

  // Dump what HD thinks it has, so the user can sanity-check before we create
  // anything new.
  console.log(`Human Delta already has ${existing.length} index job(s):`);
  for (const j of existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = j as any;
    console.log(`  • [${e.status}] ${e.name ?? "(no name)"} — id=${e.id}`);
  }
  console.log(
    `\nSeeding ${SEED_URLS.length} URLs. ` +
      `${skipNames.size ? `${skipNames.size} will be skipped (already live).` : `Nothing to skip.`}\n`,
  );

  for (const { url, name, maxPages } of SEED_URLS) {
    if (skipNames.has(name)) {
      console.log(`✓ skip  — already indexed (or in progress): ${name}`);
      continue;
    }
    process.stdout.write(`→ index — ${name}  `);
    try {
      const job = await hd.indexes.create(url, { name, maxPages: maxPages ?? 10 });
      await job.wait();
      console.log(`[${job.status}]`);
    } catch (err) {
      console.log(`✗ failed: ${(err as Error).message}`);
    }
  }

  console.log("\n—— HD /source tree ——");
  try {
    const tree = await hd.fs.shell("tree /source -L 2");
    console.log(tree);
  } catch (err) {
    console.warn("Could not list /source tree:", (err as Error).message);
  }

  console.log("\nDone. DeepDelta will now retrieve from Human Delta on live queries.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
