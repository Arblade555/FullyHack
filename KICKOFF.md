# DeepDelta — Team Kickoff

**Hackathon theme:** Deep Sea
**Sponsor track we're gunning for:** Human Delta (https://www.humandelta.ai)
**Time remaining:** ~21 hours
**Status:** Scaffold complete. UI fully demo-able on three cached queries. Live pipeline + polish + demo prep still ahead.

Read this first. Then `git clone`, `npm install`, `npm run dev`, and click around. You'll understand the goal faster from the UI than from any doc.

---

## What we're building

DeepDelta is a web app that asks: *what does Human Delta's playbook look like if you apply it to deep-sea knowledge?*

Human Delta's public pitch is that enterprise systems of record weren't built for AI — their product exposes the **gaps, conflicts, and decay** invisible to existing systems. We're building a small, honest demonstration of that same idea on a topic where the knowledge really is fragmented, scientifically contested, and decaying fast: the deep sea.

Product shape: one page, two columns, one question.

- **Left column — Raw LLM.** A plain call to Claude with no retrieval. This is the baseline.
- **Right column — DeepDelta verified.** Same question, same model, but enriched with: a synthesized answer, flagged gaps, flagged conflicts, flagged decayed facts, cited sources from a curated corpus, and a validation score with an auditable breakdown.

When a judge sees the Raw column confidently claim *"the deepest fish is the Mariana snailfish at 8,178 m (2014)"* and the Verified column immediately catch that as **decayed knowledge** — citing the 2023 Izu-Ogasawara snailfish at 8,336 m, with the stale sources listed by name — the value proposition lands in about ten seconds. That's the demo.

---

## What's already built

A Next.js 14 + TypeScript + Tailwind app is in the repo. It:

- Renders the full two-column UI.
- Ships three hand-tuned "golden" demo queries that work end-to-end **without any LLM key**.
- Has a stubbed `/api/query` endpoint ready for the Phase 2 live pipeline.
- Seeds `data/sources.json` with six real-looking sources.
- Mirrors Human Delta's homepage vocabulary throughout: *gaps*, *conflicts*, *decay*, *validation*, *clean-room knowledge base*.

The UI is real and works today. What we're adding over the next ~18 hours is the live pipeline, more corpus, UI polish, and demo materials.

---

## Run it locally

```bash
git clone <repo-url>
cd FullyHack
npm install
npm run dev
# open http://localhost:3000
```

Click any of the three suggested query chips. You'll get the full experience.

You do **not** need an Anthropic API key for Phase 1. Cached golden queries work without one. When the live pipeline lands, whoever runs it gets their own key — we don't share keys.

---

## Roles

Every role is self-contained. If someone drops, the demo survives.

### Teammate A — Corpus curator (no code)

You own `data/sources.json`.

- Read `CORPUS_BRIEF.md` in the repo root. It has the full spec.
- Add ~14 more source snippets to `data/sources.json`, bringing the total to ~20. The brief calls out which kinds: specifically, two more **decay pairs** (old claim vs new claim on the same fact) and two more **conflict pairs** (two credible sources that disagree).
- Don't rewrite the entries already seeded.
- **Due: 6 hours after kickoff.** If you finish early, add more — diminishing returns after 30 entries.

Skills needed: Googling, careful copy-paste, filling in a JSON template. No LLMs, no code.

### Teammate B — Frontend polish

You own the look and feel of `app/page.tsx` (and `app/globals.css`, `tailwind.config.ts` if you need to).

Wait until Teammate A has ~10+ sources in before heavy styling — you want real variance to design against.

Things to improve (rough priority order):

1. Loading state — it's a basic spinner. Make it feel like the system is *scanning* (not waiting).
2. Source cards — add hover-expand so the snippet reveals cleanly.
3. Readability of the conflict/decay callouts — tighten spacing, typography, contrast.
4. Optional flair: a subtle depth-gradient animation on the page background or header.

**Do not change these:** the section names *Gaps, Conflicts, Decay*. The phrase *Validation Score*. Any copy that mirrors Human Delta's homepage. These are load-bearing for the demo.

**Due: first pass by hour 12, final polish by hour 16.**

Skills needed: React, Tailwind, eye for visual hierarchy.

### Teammate C — Demo + slides

You own the 90-second pitch.

- **3 slides, no more.** Slide 1: the problem (AI agents are only as good as their knowledge base; deep-sea knowledge is a mess). Slide 2: DeepDelta's pipeline visualized (Surface → Structure → Scale → Learn, mirroring Human Delta's own framework). Slide 3: "Live demo →" handoff.
- **90-second script.** Open with Human Delta's own phrase: *"expose the gaps, conflicts, and decay invisible to your current systems."* Close with *"that's what Human Delta does for Fortune 500 knowledge bases; we just did it on the sea floor."* Draft of the full script is in this doc, bottom section — edit from there.
- **Backup video.** A 60-second screen recording of the live demo running smoothly. If wifi dies at judging time, we play this.
- Create a `/demo/` folder in the repo for your slide export, script, and video.

**Due: first draft by hour 16, final by hour 20.**

Skills needed: Google Slides / Keynote / Figma, screen recording (QuickTime, OBS, Loom — anything).

### Lead (Mark)

Critical path:

- Phase 2 live pipeline: retrieval over `data/sources.json` → Claude Haiku claim extraction per source → Claude Sonnet JSON-mode judge → `VerifiedResponse`.
- Validation score formula (already specced in README).
- Harden the golden-query cache as demo-time fallback.
- Deploy to Vercel so we can share a live URL.

---

## Coordination rules

1. **Commit small, commit often.** Don't sit on four hours of unpushed code.
2. **Stay in your lane.** A → `data/`. B → `app/page.tsx`, `app/globals.css`, `tailwind.config.ts`. C → `/demo/`. Lead → everything else. If you need to touch something outside your lane, say so in chat first.
3. **Keep the app demo-able at all times.** If you break `npm run dev`, fix it or revert within 15 minutes. The app being runnable is more important than any in-progress work.
4. **Ask early.** If a task isn't clear, ping the lead in the first twenty minutes of working on it, not two hours in.
5. **The vocabulary is load-bearing.** Don't rename these in any user-visible copy:
    - *Gaps, Conflicts, Decay* — the three output categories
    - *Validation Score* (never "confidence")
    - *Clean-room knowledge base* (when referring to the corpus, externally)
    - *Human Delta* — exactly those two words, that spacing

---

## Demo narrative — 30-second version

> Human Delta's pitch is that systems of record weren't built for AI — and their product exposes the gaps, conflicts, and decay invisible to current systems. DeepDelta is a 24-hour demonstration of that same playbook, applied to one of the most fragmented knowledge domains on Earth: the deep sea.
>
> *[click "What is the deepest fish ever recorded?"]*
>
> Raw Claude confidently says Mariana snailfish at 8,178 meters, 2014. DeepDelta catches that as **decayed knowledge** — here's the 2023 Izu-Ogasawara record at 8,336 meters, here are the two stale sources still citing the old record, here's an 87% validation score with the full breakdown.
>
> This is what it looks like when AI is grounded in validated, auditable knowledge. That's what Human Delta does for Fortune 500 knowledge bases; we just did it on the sea floor.

Teammate C: use this as a starting point, cut it down to 90 seconds when paired with a live demo, and rehearse it at least three times.

---

## Risks + contingencies

- **Anthropic API is flaky at demo time.** The cached golden queries are the failover. If the live pipeline dies on stage, we demo the cached version and call it by design ("demo-safe cache layer, mandatory in any production grounding system").
- **Corpus quality stays thin.** If Teammate A runs short, Lead falls back on the seeded six and adds two more decay pairs. Demo still works because the three golden queries are hand-tuned.
- **Someone flakes.** Every role is self-contained. Lead owns the end-to-end demo as a solo path. We lose polish, not the demo.
- **Wifi dies at judging.** Backup video from Teammate C covers this.

---

## Questions

Ping Mark. If Mark is heads-down on the pipeline, check the README, then `CORPUS_BRIEF.md`, then ask.

Let's win this.
