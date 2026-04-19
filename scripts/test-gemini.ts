// Minimal direct Gemini diagnostic — bypasses lib/rawModels.ts entirely and
// prints the full, unfiltered response so we can see the complete error
// message (including the ai.google.dev help URL and any status/details
// fields that normally get truncated).
//
// Usage:
//   npm run test:gemini
//
// Reads GOOGLE_API_KEY and optional GEMINI_RAW_MODEL from .env.local.

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

  const key = process.env.GOOGLE_API_KEY;
  if (!key) {
    console.error("GOOGLE_API_KEY not set in .env.local");
    process.exit(1);
  }
  const model = process.env.GEMINI_RAW_MODEL || "gemini-2.0-flash";

  console.log(`Model:     ${model}`);
  console.log(`Key ends:  …${key.slice(-6)}  (length ${key.length})`);
  console.log("");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const t0 = Date.now();
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: "hello" }] }],
    }),
  });
  const wall = Date.now() - t0;

  console.log(`HTTP ${resp.status}  (wall ${wall}ms)`);
  console.log("");
  console.log("Response headers:");
  for (const [k, v] of resp.headers.entries()) {
    console.log(`  ${k}: ${v}`);
  }
  console.log("");
  console.log("Response body:");
  const text = await resp.text();
  console.log(text);
}

main().catch((err) => {
  console.error("test-gemini failed:", err);
  process.exit(1);
});
