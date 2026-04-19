# DeepDelta — demo video outline

Target: **60–90 seconds** for the Devpost submission. Faster than the 2-minute live talk (`DEMO_SCRIPT.md`); every second earns its keep.

## Before you record

1. Open https://deepdelta.vercel.app in a clean Chrome window (no dev tools, no bookmark bar). Full-screen at 1920×1080 if possible.
2. Have `deepdelta-demo.pptx` slide 3 open on a second screen or ready to cut to.
3. Test your mic — aim for clean speech under a quiet room tone. Re-record if a dog barks.
4. Have the three demo queries in a scratch doc so you can paste instead of type if needed.
5. Test the octopus query *once* in an incognito window before recording to make sure the live Vercel deploy responds within ~15s. If it 504s, add `export const maxDuration = 60;` to `app/api/query/route.ts`, push, retry.

## Recording tools (pick one)

- **QuickTime (Mac)** — File → New Screen Recording → select "Record Selected Portion" → tight crop to the browser window. Voiceover mic via the arrow next to the record button.
- **OBS Studio** — Window Capture source on Chrome + mic input. Set canvas to 1920×1080. Record to MP4.
- **Loom** — fastest path, uploads in-place. Use Loom Starter (free) — caps at 5 min, more than enough.

## Shot list (target 75 seconds)

Each beat has a rough clock range and a scripted voiceover line. The line is the floor, not the ceiling — say it naturally, not robotically.

### 0:00 — 0:10 · Hook (hero shot of landing page)

**Screen:** DeepDelta homepage, empty state. Cursor hovering near the query bar.

> "Every RAG demo cherry-picks. DeepDelta tells you when the answer *isn't* grounded — even when the words sound right."

### 0:10 — 0:25 · Test 1: decay (deepest fish)

**Screen:** Click the "What's the deepest fish ever recorded?" chip. Result renders.

> "Deepest fish ever recorded. The raw LLMs all cite the 2014 Mariana snailfish. DeepDelta scores it 87 — and flags the decay: the record was superseded in 2023."

Pause for half a beat on the decay card so the viewer reads the new depth.

### 0:25 — 0:40 · Test 2: live pipeline (Gakkel Ridge)

**Screen:** Click "When were hydrothermal vents first observed on the Gakkel Ridge?" Let the live pipeline run.

> "Gakkel Ridge vents — live retrieval through Human Delta's filesystem. Seven sources, 78 percent. Notice: 100 percent source agreement, only 17 percent direct evidence. The judge is honest that most sources are cross-references, not primary evidence."

### 0:40 — 0:58 · Test 3: the gap (octopus)

**Screen:** Click "What's the deepest octopus ever filmed?" As the result renders, pan cursor across the three raw cards first.

> "Now watch. Claude, GPT-4o, and Gemini all confidently answer — because that's what frontier LLMs do. DeepDelta? 19 percent. Zero source agreement. Zero direct evidence. The judge refused to validate and surfaced the gap: no source in our corpus describes octopus depth records."

### 0:58 — 1:10 · Why it matters (slide 3)

**Screen:** Cut to `deepdelta-demo.pptx` slide 3 — the 87 / 78 / 19 grid.

> "Three queries. Three honest answers. Grounded when it can, calibrated when it's unsure, refuses when it must."

### 1:10 — 1:15 · Outro

**Screen:** Back to DeepDelta homepage or slide 3 with the URL overlaid.

> "DeepDelta. Built for FullyHacks on the Human Delta track. Link in the description."

## Post-production

- Trim dead air at the start and end.
- Keep background music at –30 dB if you add any (Mixkit or Uppbeat have free tracks). Most Devpost videos skip music — it lets the voice carry.
- Add one lower-third text overlay at 0:00 with the URL (`deepdelta.vercel.app`) so a judge can pause and type it.
- Export MP4, H.264, 1080p, ~8–12 Mbps bitrate. Devpost accepts YouTube or direct upload; YouTube is fewer steps.

## Common pitfalls

- **Octopus query fails live.** The verified column hits real APIs. If it 504s mid-recording, kill and restart — don't try to salvage. Check the `maxDuration` export.
- **Raw cards don't populate.** Check env vars on Vercel. All four keys need to be on Production scope.
- **Cursor jitters during scroll.** Use arrow keys or Home/End to move the viewport; trackpad scrolls look frantic on video.
- **Narration feels rushed.** If you're over 90 seconds, cut the outro. Don't cut the octopus beat — that's the point of the project.
