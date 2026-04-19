# DeepDelta — Devpost submission

Copy-paste-ready text for the Devpost form fields. Each headline below maps to a Devpost text box. The six fields with a 255-character limit are the short ones (inspiration, what it does, how we built it, challenges, accomplishments, what's next); the others have no cap.

---

## Elevator pitch

DeepDelta is a RAG verification layer that runs every question through three frontier LLMs and a retrieval-grounded judge, so every answer comes with a score, sources, gaps, and decay flags.

---

## Inspiration (≤255)

Every RAG demo cherry-picks three clean questions and claps at three polished answers. We wanted a system that tells you when the answer isn't actually grounded, even when the words sound right.

## What it does (≤255)

A two-column comparison: the left shows three frontier LLMs answering raw, and the right is DeepDelta grounding the same question in a Human-Delta-indexed corpus, scoring it 0 to 100, and flagging gaps, conflicts, and stale claims.

## How we built it (≤255)

Next.js on Vercel with a parallel fan-out to Claude, GPT-4o, and Gemini 2.5 Flash. Retrieval reads raw Markdown from Human Delta's filesystem, then a second Claude call scores the answer through a forced tool-use JSON schema.

## Challenges we ran into (≤255)

Gemini 2.0 Flash had been silently deprecated for new API keys, and the real 404 stayed hidden behind spurious 429 rate-limit errors. The gap-detection demo also broke once our corpus expanded, forcing a last-minute rewrite of one demo query.

## Accomplishments we're proud of (≤255)

Every layer runs live (retrieval, fan-out, judge, score). The octopus query is where it justifies itself: three frontier LLMs confidently agree on a fabricated depth record while our verification layer lands at 19 percent.

## What we learned

**Differential scoring beats absolute refusal.** A system that refuses everything is useless; a system that validates everything is dangerous. The product is the *variance*: 87 percent when the corpus supports the answer with some staleness, 78 percent when sources are consistent but indirect, 19 percent when retrieval is empty. Getting all three scores to land at reasonable levels required tuning the judge prompt more carefully than we expected.

**Retrieval transparency is the underrated property.** Vector DBs hide the corpus behind embeddings. Filesystem retrieval shows you exactly what went in. For a verification system that has to convince a skeptic, the second architecture is much easier to defend.

**Error truncation hides real problems.** Our "catch the error, print the first 200 characters" pattern was masking the actual cause of a deprecation error. Raising it to 800 characters saved us hours. Build your diagnostic tools early.

## What's next for your project? (≤255)

Source provenance per document, learned score weights instead of hand-tuned ones, streaming judge output, and vertical expansion into regulated domains where auditable verification matters more than a clever chatbot.

---

## Built with

`anthropic-sdk` · `human-delta` · `next.js` · `openai` · `gemini` · `typescript` · `tailwindcss` · `vercel`

## Try it out

- **Live demo:** https://deepdelta.vercel.app/
- **GitHub:** [paste repo URL]
- **Demo video:** [paste YouTube or Devpost upload URL]
