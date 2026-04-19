# Corpus Brief — what we need from you

Thanks for taking this. You own the single most valuable non-coding task in the project. Every demo we give is only as credible as the corpus you build.

## Goal

Fill out `data/sources.json` so DeepDelta has **~20 total source snippets** drawn from **6–8 real publications**, spread across **3–5 deep-sea topics**. I've seeded 6 entries already; you add **~14 more**.

## What makes a good snippet

- A single, factual, quotable sentence or two (max ~3 sentences).
- Comes from a real, nameable source — a NOAA page, a Wikipedia paragraph, a university press release, a Nature / Science news piece, a textbook chapter, a documentary transcript. Don't fabricate publishers or quotes.
- Paste the snippet roughly verbatim. Lightly trim filler words; don't rewrite meaning.
- Include the year the source was written/published. This is how DeepDelta detects *decay*.

## What we especially need

Mix the corpus so the demo produces visible **gaps, conflicts, and decay**:

1. **Decay pairs** (OLD claim + NEW claim on the same topic). We already have:
   - Deepest fish: 8,178 m (pre-2023) vs 8,336 m (2023+)
   - Arctic vents: "not observed" (2005) vs confirmed (2008+)

   Please add **2 more decay pairs**. Candidates:
   - Number of known deep-sea species (older estimates are lower than newer)
   - Status of deep-sea mining regulation (ISA rules shift yearly)
   - Extent / mapping of the seafloor (Seabed 2030 updates)
   - "Largest ever" / "oldest ever" records of deep-sea organisms

2. **Conflict pairs** (two credible sources that disagree on the same topic, no clear decay). Candidates:
   - Which vent fauna is "dominant" (depends on ocean — Pacific vs Atlantic vs Indian)
   - Whether deep-sea mining is net beneficial or net harmful
   - Estimated biomass below 1,000 m

   Please add **2 more conflict pairs**.

3. **Single authoritative snippets** on topics without controversy, to pad the corpus so retrieval has enough material. Good topics:
   - Chemosynthesis at vents
   - Bioluminescence in the mesopelagic
   - Hadal-zone pressure physiology
   - Cold seeps vs hydrothermal vents

## How to add an entry

Open `data/sources.json` and add an object to the `sources` array. Each entry follows this shape:

```json
{
  "id": "src-<short-slug>-<year>",
  "title": "Human-readable title",
  "publisher": "Organization or outlet",
  "url": "https://... (optional)",
  "year": 2021,
  "tags": ["topic", "region"],
  "snippet": "One or two verbatim sentences that contain the factual claim."
}
```

Rules for the `id`:
- lowercase, hyphenated, starts with `src-`
- include publisher and year so it's human-readable
- **must be unique** across the whole file

## Deliverable & deadline

Drop the updated `data/sources.json` back to the lead once you have 20 entries. Aim to finish within **6 hours of kickoff**. If you finish early, add 5 more — more is better, up to ~30.

## What you do *not* need to do

- No code.
- No LLM prompting.
- No API calls.
- Don't rewrite the entries I already seeded.

Message the lead if you're stuck on a topic — there's usually a way to reframe.
