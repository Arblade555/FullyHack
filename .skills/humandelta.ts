// npm install humandelta
import { HumanDelta } from "humandelta";

const hd = new HumanDelta({ apiKey: "hd_live_..." });
// optional: { apiKey, baseUrl } — baseUrl defaults to https://api.humandelta.ai

// ── Index a website ─────────────────────────────────────
const job = await hd.indexes.create("https://docs.example.com", {
  name: "Help Center",   // optional label
  maxPages: 100,         // optional; default 100, max 500
});
// job.id, job.status, job.name, job.source_type

// Poll until done — throws if status==="failed", times out after 10 min
await job.wait();
// job.wait(intervalMs?, timeoutMs?)  — defaults: 3000ms, 600000ms

// Refresh status manually
await job.refresh();
console.log(job.status); // "queued"|"running"|"completed"|"failed"|"cancelled"

// Cancel a running job
await job.cancel();

// ── List & fetch indexes ────────────────────────────────
const jobs = await hd.indexes.list({ limit: 20, offset: 0 }); // returns IndexJob[]
const existing = await hd.indexes.get("idx_abc123");           // returns IndexJob

// ── Search ──────────────────────────────────────────────
const results = await hd.search("How do I reset my password?", 5);
// hd.search(query, topK?)  — topK default 10, max 20
for (const hit of results) {
  // hit: { chunk_id, score (0-1), text, source_url, page_title,
  //        source_type ("web"|"document"), match_type ("semantic") }
  console.log(hit.score.toFixed(2), hit.source_url);
  console.log(hit.text.slice(0, 300));
}

// ── Virtual filesystem ──────────────────────────────────
// VFS tree:  /source/website/<domain>/<page-slug>
//            /uploads/   — uploaded documents (PDF→text, images, CSV, …)
//            /agent/     — writable org memory (needs fs:write scope on key)
//            /skills/    — read-only skill definitions

// Run a shell command (tree, ls, cat, find, grep, head, wc)
const treeOutput = await hd.fs.shell("tree /source -L 3");  // returns stdout string

// Read a file's full content
const content = await hd.fs.read("/source/website/docs.example.com/getting-started");

// List a directory → [{ name, type: "dir"|"file", size? }]
const entries = await hd.fs.list("/uploads");

// Write to /agent/ (requires fs:write scope)
await hd.fs.write("/agent/notes/summary.md", "# Summary\n...");

// Delete from /agent/ (requires fs:write scope)
await hd.fs.delete("/agent/notes/summary.md");

// ── Upload a document (raw fetch — SDK doesn't wrap multipart yet) ──
// Allowed: PDF, PNG, JPEG, WEBP, TXT, MD, CSV  (max 10 MB)
const form = new FormData();
form.append("file", fileBlob, "report.pdf");
const doc = await fetch("https://api.humandelta.ai/v1/documents", {
  method: "POST",
  headers: { Authorization: "Bearer hd_live_..." }, // no Content-Type — browser sets multipart boundary
  body: form,
}).then(r => r.json());
// doc: { doc_id, doc_name, status: "processing"|"ready"|"failed" }

// ── Errors ──────────────────────────────────────────────
// All API errors → { detail: string }
// 400 bad body | 401 bad key | 403 missing scope (e.g. fs:write)
// 404 not found | 429 rate limit — back off & retry | 500 server error