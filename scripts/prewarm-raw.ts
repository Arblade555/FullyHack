// Prewarm the raw-answer cache for the three demo queries, across all three
// frontier models.
//
// Usage:
//   npm run prewarm
//
// What it does:
//   For each of DEMO_QUERIES it calls fanOutRaw(), which hits Claude,
//   GPT-4o, and Gemini 2.0 Flash in parallel and gracefully records any
//   provider failures as { status: "error" } instead of throwing.
//
// Output:
//   .cache/raw-answers.json — keyed by normalized query. Loaded by
//   lib/rawModels.ts at request time so the demo is zero-risk on live APIs.
//
// Re-run any time you change DEMO_QUERIES or the RAW_PROMPT wording.

import * as fs from "node:fs";
import * as path from "node:path";
import { fanOutRaw } from "../lib/rawModels";
import { normalizeQuery } from "../lib/mockResponses";
import type { RawAnswer } from "../lib/types";

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

const DEMO_QUERIES = [
  "What is the deepest fish ever recorded?",
  "When were hydrothermal vents first observed on the Gakkel Ridge?",
  "Where do giant cucumbers live?",
];

const CACHE_PATH = path.resolve(process.cwd(), ".cache", "raw-answers.json");

function providerBadge(a: RawAnswer): string {
  if (a.status === "error") return `❌ ${a.provider}`;
  return `✅ ${a.provider} (${(a.latency_ms / 1000).toFixed(1)}s)`;
}

async function main() {
  loadDotEnv();

  // Prewarm's job is to *populate* the cache, so we must bypass any existing
  // cache lookup — otherwise fanOutRaw would just echo back stale entries
  // (including old errors) and we'd never hit the real providers.
  process.env.RAW_CACHE = "off";

  const keys = {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    google: Boolean(process.env.GOOGLE_API_KEY),
  };
  console.log("Prewarm · provider keys:");
  for (const [k, v] of Object.entries(keys)) {
    console.log(`  ${v ? "✓" : "✗"} ${k.toUpperCase()}_API_KEY`);
  }
  if (!keys.anthropic || !keys.openai || !keys.google) {
    console.log(
      "\nNote: missing keys will produce `status: \"error\"` entries. The cache will still be written so the UI renders unavailable cards for those providers.\n",
    );
  } else {
    console.log("");
  }

  const cache: Record<string, RawAnswer[]> = {};

  for (const query of DEMO_QUERIES) {
    process.stdout.write(`→ "${query}"\n`);
    const t0 = Date.now();
    const answers = await fanOutRaw(query);
    const ms = Date.now() - t0;
    for (const a of answers) {
      console.log(`    ${providerBadge(a)}  ${a.model}`);
      if (a.status === "error") {
        console.log(`        error: ${a.error}`);
      }
    }
    console.log(`    wall: ${(ms / 1000).toFixed(1)}s\n`);
    cache[normalizeQuery(query)] = answers;
  }

  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  const bytes = fs.statSync(CACHE_PATH).size;
  console.log(`Wrote ${CACHE_PATH} (${(bytes / 1024).toFixed(1)} KB)`);

  const okCount = Object.values(cache)
    .flat()
    .filter((a) => a.status === "ok").length;
  const errCount = Object.values(cache)
    .flat()
    .filter((a) => a.status === "error").length;
  console.log(`Summary: ${okCount} ok · ${errCount} error (of ${okCount + errCount} total answers)`);

  if (errCount > 0) {
    console.log(
      "\n⚠  Some providers errored during prewarm. Check keys / rate limits and re-run. The demo will still work — those cards render as 'Unavailable'.",
    );
  }
}

main().catch((err) => {
  console.error("prewarm-raw failed:", err);
  process.exit(1);
});
