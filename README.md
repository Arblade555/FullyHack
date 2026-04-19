# DeepDelta

**Launch AI you can trust — for deep-sea knowledge.**

A 24-hour hackathon build that applies the Human Delta playbook (*surface* gaps, conflicts, and decay; *structure* messy human knowledge into AI-ready form; *learn* as the corpus grows) to one of the most fragmented knowledge domains on Earth: the deep sea.

Two columns. Same question. One column is a raw LLM. The other is DeepDelta: same answer, but with sources, gaps, conflicts, decay flags, and an auditable validation score.

## Quick start

```bash
# 1. Install deps
npm install

# 2. Add your API keys (Anthropic + Human Delta)
cp .env.local.example .env.local
# then edit .env.local and paste both keys

# 3. Seed the Human Delta corpus (one-time, ~1–2 min)
npm run index:corpus

# 4. Run the dev server
npm run dev
# open http://localhost:3000
```

> **Status:** Phase 1 (cached golden queries), Phase 2 (Anthropic judge), and Phase 3 (Human Delta retrieval) are all wired up. Without keys, cached demo queries still work. With both keys configured, live queries go retrieval (Human Delta `hd.search`) → judge (Claude Sonnet with tool-use) → validation score, and each verdict is appended to Human Delta's writable `/agent/audit/` memory for an auditable log. Add `?live=1` to `/api/query` calls to force the live path even for cached queries.

## Project layout

```
app/
  layout.tsx            Root layout + metadata
  page.tsx              Main UI — Raw vs Verified two-column scan
  api/query/route.ts    POST endpoint — orchestrates cache → retrieval → raw+judge
  globals.css           Tailwind base + light depth gradient
lib/
  types.ts              Shared TS types (Source, VerifiedResponse, ScanResult...)
  mockResponses.ts      Golden/cached demo responses + query matcher (demo fallback)
  humandelta.ts         Human Delta SDK wrapper — hd.search reshaped into Source[]
  retrieval.ts          Static-corpus keyword retrieval (fallback when HD key absent)
  anthropic.ts          Anthropic client + Raw prompt + Judge tool-use
  score.ts              Validation score: agreement + evidence + recency + self-conf
scripts/
  index-corpus.ts       One-shot seeder for the Human Delta corpus
data/
  sources.json          Legacy static corpus (used only if HD key missing)
CORPUS_BRIEF.md         Brief for the teammate filling in the corpus
KICKOFF.md              Team onboarding doc
```

## The verification pipeline (design)

Each scan runs this sequence:

1. **Retrieve (Human Delta)** — `lib/humandelta.ts` calls `hd.search(query, 8)` against the indexed Human Delta corpus. Results are reshaped into our `Source` type (publisher derived from URL hostname, year regex-extracted from the chunk text, snippet = chunk body).
2. **Judge (Claude Sonnet + tool-use)** — `callJudge` passes the retrieved sources to Claude Sonnet with a forced `return_verified_response` tool call. The model emits a `VerifiedResponse`: synthesis, gaps, conflicts, decay, and the three self-reported fractions (agreement, direct_evidence, self_confidence).
3. **Score** — `lib/score.ts` combines the judge's fractions with a deterministic recency signal derived from source years to produce a 0–100 validation score and its breakdown.
4. **Log (Human Delta Learn pillar)** — the verdict is appended to HD's writable `/agent/audit/` memory, so every scan adds to an auditable knowledge log inside the same surface that produced it.
5. **Render** — the two-column UI lays Raw (a plain Claude call) against Verified (the output of steps 1–3).

## Validation score

```
validation_score  =  40 * source_agreement
                   + 20 * direct_evidence
                   + 20 * recency
                   + 20 * self_confidence
```

Every component is shown in the breakdown panel under the verified column so a judge can poke at it.

## Sponsor framing

This project is built for the **Human Delta** track of the Deep Sea hackathon. Language and output structure intentionally mirror the Human Delta homepage framework: *Surface → Structure → Scale → Learn*. Gaps, conflicts, and decay are Human Delta's own three categories — we adopt them verbatim because they are exactly the right categories.

## Team split

- **Lead** — API routes, retrieval, Claude pipeline, validation score
- **Frontend** — Tailwind polish on the two-column UI, loading states, hover/expand micro-interactions
- **Corpus** — `data/sources.json` (see `CORPUS_BRIEF.md`)
- **Demo** — 3-slide pitch, 90-second script, backup video of the demo running

Core pipeline is solo-buildable; every other role is self-contained and droppable.

## License

Hackathon project. Not for production use.
