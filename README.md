# DeepDelta

**Launch AI you can trust for deep-sea knowledge.**

**Live demo:** [deepdelta.vercel.app](https://deepdelta.vercel.app/)

A FullyHacks build that applies the Human Delta playbook (*surface* gaps, conflicts, and decay; *structure* messy human knowledge into AI-ready form; *learn* as the corpus grows) to one of the most fragmented knowledge domains on Earth: the deep sea.

Two columns. Same question. The left column is three frontier LLMs answering in parallel (Claude, GPT-4o, Gemini). The right column is DeepDelta: an answer grounded in a Human-Delta-indexed corpus, scored by a separate Claude judge, with gaps, conflicts, decay flags, and an auditable validation score.

## Quick start

```bash
# 1. Install deps
npm install

# 2. Add your API keys
cp .env.local.example .env.local
# then edit .env.local and fill in the four keys

# 3. Seed the Human Delta corpus (one-time, ~1–2 min)
npm run index:corpus

# 4. (Optional) Prewarm the raw-answer cache for the three demo queries
npm run prewarm

# 5. Run the dev server
npm run dev
# open http://localhost:3000
```

Required env vars (see `.env.local.example`):

- `ANTHROPIC_API_KEY` — Claude, for the judge + the verified-column answer
- `HUMANDELTA_API_KEY` — Human Delta, for retrieval against the deep-sea corpus
- `OPENAI_API_KEY` — GPT-4o, for one of the three raw-column fan-out cards
- `GOOGLE_API_KEY` — Gemini 2.5 Flash, for the third raw-column card

## The verification pipeline

Each scan runs this sequence:

1. **Fan-out (raw column)** — `lib/rawModels.ts` calls Claude, GPT-4o, and Gemini 2.5 Flash in parallel with no retrieval. Each card shows a bare-model answer, its latency, and any provider errors gracefully. This is the "what would you have gotten without verification" baseline.

2. **Retrieve (verified column)** — `lib/humandelta.ts` reads directly from Human Delta's filesystem via `hd.fs.read()` on `/source/website/en.wikipedia.org/<slug>.md`. An allowlist of 23 deep-sea slugs (trenches, zones, organisms, exploration history, ecology) gates which files flow into the pipeline, so the corpus can be audited by `ls`.

3. **Judge (Claude + forced tool-use)** — the retrieved sources go to Claude Sonnet, which must return a strict-schema `VerifiedResponse`: synthesis, gaps, conflicts, decay, and three self-reported fractions (agreement, direct evidence, self-confidence). No free-form output is accepted.

4. **Score** — `lib/score.ts` combines the judge's fractions with a deterministic recency signal (4-digit-year regex, 8-year decay curve) into a 0–100 validation score with a visible breakdown.

5. **Render** — the two-column UI lays the three raw cards against the verified response, the score breakdown, cited sources, surfaced gaps, and any decayed claims.

## Validation score

```
validation_score  =  40 * source_agreement
                   + 20 * direct_evidence
                   + 20 * recency
                   + 20 * self_confidence
```

Every component is shown in the breakdown panel under the verified column so a judge can poke at it.

## Demo queries

Three pre-validated queries demonstrate the three failure modes DeepDelta is designed to catch:

- **"What's the deepest fish ever recorded?"** → 87%, decay flagged (2014 snailfish record superseded by 2023 Izu-Ogasawara update at 8,336 m).
- **"When were hydrothermal vents first observed on the Gakkel Ridge?"** → 78%, honest grounding (100% source agreement, only 17% direct evidence).
- **"What's the deepest octopus ever filmed?"** → 19%, gap surfaced (no octopus pages in the corpus; the judge refuses to fabricate even when the raw LLMs confidently answer).

## Project layout

```
app/
  layout.tsx            Root layout + metadata
  page.tsx              Main UI — Raw fan-out vs Verified two-column scan
  api/query/route.ts    POST endpoint — raw fan-out + retrieval + judge + score
  globals.css           Tailwind base + abyss/kelp/coral color ramps
lib/
  types.ts              Shared TS types (Source, VerifiedResponse, RawAnswer, ScanResult)
  rawModels.ts          Fan-out to Claude, OpenAI, and Gemini with graceful errors
  humandelta.ts         HD filesystem retrieval (allowlisted slug set)
  anthropic.ts          Claude client + judge tool-use + verified prompt
  score.ts              Validation score: agreement + evidence + recency + self-conf
  mockResponses.ts      Golden demo responses + query matcher (fallback path)
scripts/
  index-corpus.ts       One-shot seeder for the Human Delta corpus (23 Wikipedia slugs)
  check-corpus.ts       Sanity check: tree /source, probe retrieval, dump file sizes
  prewarm-raw.ts        Hit all three providers for DEMO_QUERIES, write .cache/raw-answers.json
  test-gemini.ts        Diagnostic script for the Gemini REST endpoint
DEMO_SCRIPT.md          2-minute live-demo talk track
deepdelta-demo.pptx     3-slide pitch deck (Hook · Architecture · Results)
```

## Sponsor framing

Built for the **Human Delta** sponsor track of FullyHacks. Language and structure intentionally mirror the Human Delta framework: *Surface → Structure → Scale → Learn*. Gaps, conflicts, and decay are Human Delta's own three categories — we adopt them verbatim because they're exactly the right categories.

## License

Hackathon project. Not for production use.
