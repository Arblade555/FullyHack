# DeepDelta — 2-minute demo script

Target: Human Delta sponsor track · 24-hour hackathon
Deck: `deepdelta-demo.pptx` (3 slides, 16:9)

---

## Pre-demo checklist

1. `npm run dev` running on `localhost:3000`
2. Deck open on a second screen (or have slides 1/2/3 ready to flip)
3. Browser window sized so the score + sources + gaps panel are all visible
4. Pre-validated "deepest fish" query already cached (instant render)
5. HUMANDELTA_API_KEY in `.env.local`; `/source/` confirmed via `npm run check:corpus`
6. OPENAI_API_KEY + GOOGLE_API_KEY in `.env.local`; raw answers prewarmed via `npm run prewarm` (writes `.cache/raw-answers.json` — zero live-API dependency on the left column). All three providers (Claude, GPT-4o, Gemini 2.5 Flash) should show `✅` in the prewarm output

---

## Script

### 0:00 — 0:15 · Hook (slide 1 up)

> Most RAG demos cherry-pick. Three clean questions, three polished answers, everyone claps.
>
> We built a scorer that tells you when the answer isn't actually grounded — even when the words sound right. And we run every question through three frontier models in parallel — Claude, GPT-4o, and Gemini — so you can see the blind spots are *shared*, not Claude-specific.
>
> Let me show you three queries we just ran.

Pause. Click to slide 3 briefly to flash the 87/78/55 grid. Flip back.

### 0:15 — 0:38 · Test 3 first (cucumber — the gap) · LIVE in browser

Type into DeepDelta: **"Where do giant cucumbers live?"**

> This one is a trap. There are no giant cucumbers in our corpus. The tangential hits are just "sea cucumber" mentions inside unrelated deep-sea articles.

Let the answer render. Gesture at the left column first.

> Look at the left side. Claude, GPT-4o, and Gemini all confidently answer. None of them flag that the question is unanswerable. That's the failure mode every frontier LLM shares.

Now point at the score.

> **55%.** Down from the 80s on the other queries. Agreement dropped to 50, self-confidence to 30, and the system raised a high-impact gap: "no source defines giant cucumbers as a species." It didn't fabricate. That's the whole point.

### 0:35 — 0:58 · Test 2 (Gakkel Ridge — live HD) · LIVE in browser

Type: **"When were hydrothermal vents first observed on the Gakkel Ridge?"**

> This is a live pipeline run. Seven sources retrieved through Human Delta's filesystem — `hd.fs.read` on `/source/website/en.wikipedia.org/gakkel_ridge.md`, plus cross-references.

Pause. Let it render.

> **78%.** Got the right answer — the Polarstern/Healy expedition in 2001. But notice: 100% source agreement, only 17% direct evidence. The judge is saying "the sources agree with each other, but most of them aren't *directly* on topic." That's honest. Most RAG pipelines would report this at 95 and call it done.

Expand the top source to show the Gakkel Ridge Wikipedia snippet.

### 0:58 — 1:20 · Test 1 (deepest fish — decay) · LIVE in browser

Type: **"What's the deepest fish ever recorded?"**

> Cached answer — pre-validated. Watch the decay panel.

> **87%.** The corpus says the 2014 Mariana snailfish record is stale. DeepDelta cross-checked against a 2023 update and surfaced both: the outdated answer at 8,178 m, and the current one at 8,336 m in the Izu-Ogasawara Trench. Four sources cited across Wikipedia, NOAA, a UWA press release, and Nature News.

### 1:20 — 1:45 · Architecture (slide 2)

Flip to slide 2.

> Three pieces.
>
> **Retrieve.** Human Delta as a knowledge filesystem. The corpus is crawled into `/source/` — real files, auditable, no vector DB. Every retrieval is `hd.fs.read` on a specific slug.
>
> **Judge.** Claude with forced tool-use. The answer model drafts. A second Claude call scores it through a rigid JSON schema — agreement, direct evidence, recency, self-confidence.
>
> **Surface.** Weighted score out of 100. Gaps flag corpus holes. Decay flags stale claims. Every scan gets written back to HD's `/agent/` memory as an audit log, so the next run can replay it.

### 1:45 — 2:00 · Close (slide 3)

Flip to slide 3.

> Anyone can build RAG on a vector DB. We built it on a filesystem you can actually inspect. And we built a judge that's willing to say *I don't know* at 55% — which is the part everyone skips.
>
> DeepDelta. Thanks.

---

## Anticipated questions

**"Why not use HD's semantic search?"**
> We tried. During the workshop, `hd.search()` returned zero hits on every probe even though the files had real content. Rather than wait for the backend, we pivoted to reading `/source/` directly — which is arguably the better architecture anyway because it's fully auditable.

**"What's the judge prompt look like?"**
> Forced tool-use. Claude must return JSON with agreement, direct-evidence, recency, self-confidence as numbers in 0–1, plus a list of gaps and decayed claims. No free-form answer accepted.

**"How is recency computed?"**
> Per source, we scan for 4-digit years (1950–current) and take the most recent one as the "year of claim." Then we compute a weighted mean across retrieved sources; sources older than 8 years get progressively down-weighted. Unknowns neutralize to 0.5.

**"What if the corpus changes between runs?"**
> HD's index jobs are tracked by name and status. Re-seeding is idempotent — existing completed/running jobs are skipped. A refreshed crawl would produce new files under `/source/`, and the next retrieval picks them up because we don't cache beyond the current Node process.

**"How do you handle adversarial queries?"**
> Same pipeline. The cucumber query is the proof — no special branch, no hard-coded refusal. The judge just returns a low score because the sources don't directly support the answer.

**"What happens if one of the raw models is down?"**
> Each provider call is independent and errors are caught per-provider. A failed provider renders as a dimmed "Unavailable" card with a calm reason — rate-limited, auth, timeout, etc. — and the rest of the pipeline continues. The verified column is unaffected because it runs through Claude with retrieval, which is a separate call path. So the demo degrades gracefully instead of crashing.
