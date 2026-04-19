# DeepDelta

**Launch AI you can trust — for deep-sea knowledge.**

A 24-hour hackathon build that applies the Human Delta playbook (*surface* gaps, conflicts, and decay; *structure* messy human knowledge into AI-ready form; *learn* as the corpus grows) to one of the most fragmented knowledge domains on Earth: the deep sea.

Two columns. Same question. One column is a raw LLM. The other is DeepDelta: same answer, but with sources, gaps, conflicts, decay flags, and an auditable validation score.

## Quick start

```bash
# 1. Install deps
npm install

# 2. Add your Anthropic API key
cp .env.local.example .env.local
# then edit .env.local and paste your key

# 3. Run the dev server
npm run dev
# open http://localhost:3000
```

> Phase 1 of the build (current): the UI is wired to a stubbed `/api/query` route that returns pre-cached "golden" responses for known demo queries. The app is fully demo-able without any LLM key. Live retrieval + Claude pipeline lands in Phase 2.

## Project layout

```
app/
  layout.tsx            Root layout + metadata
  page.tsx              Main UI — Raw vs Verified two-column scan
  api/query/route.ts    POST endpoint the UI calls
  globals.css           Tailwind base + light depth gradient
lib/
  types.ts              Shared TS types (Source, VerifiedResponse, ScanResult...)
  mockResponses.ts      Golden/cached demo responses + query matcher
data/
  sources.json          The "clean-room" knowledge base (corpus)
CORPUS_BRIEF.md         Brief for the teammate filling in the corpus
```

## The verification pipeline (design)

Each scan runs this sequence:

1. **Retrieve** — pull the top-N snippets from `data/sources.json` that match the query. Phase 1 uses keyword match; Phase 2 adds Anthropic embeddings.
2. **Extract** — run Claude Haiku on each source snippet and extract structured claims (`{claim, year, source_id}`).
3. **Judge** — run Claude Sonnet with JSON-mode on the pooled claims and ask it to return the `VerifiedResponse` shape: synthesis, gaps, conflicts, decay, validation_score, score_breakdown.
4. **Render** — the two-column UI lays Raw (a plain Claude call) against Verified (the output of steps 1–3).

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
