import { NextRequest, NextResponse } from "next/server";
import { matchGoldenQuery } from "@/lib/mockResponses";
import { retrieveSources } from "@/lib/retrieval";
import {
  hasHumanDeltaKey,
  humandeltaLogAudit,
  humandeltaSearch,
} from "@/lib/humandelta";
import { callRaw, callJudge, hasApiKey } from "@/lib/anthropic";
import {
  buildScoreBreakdown,
  computeValidationScore,
} from "@/lib/score";
import type { ScanResult, Source } from "@/lib/types";

/**
 * Retrieval dispatch. Default path hits Human Delta. If the HD key is not
 * configured we fall through to the static keyword-scored corpus so the
 * project still runs locally during development — but the sponsor-track
 * story (and the UI "corpus" chip) expects Human Delta to be live.
 */
async function retrieveForQuery(
  query: string,
  topN: number,
): Promise<{ sources: Source[]; backend: "humandelta" | "static" }> {
  if (hasHumanDeltaKey()) {
    try {
      const sources = await humandeltaSearch(query, topN);
      return { sources, backend: "humandelta" };
    } catch (err) {
      console.error("[/api/query] Human Delta retrieval failed, falling back to static corpus:", err);
      // Fall through to static on error rather than 500ing the whole request.
    }
  }
  return { sources: retrieveSources(query, topN), backend: "static" };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/query
 * Body: { query: string }
 * Query params:
 *   ?live=1  — force the live pipeline even if a cached golden response exists.
 *              Useful during development; don't use in demo.
 *
 * Flow:
 *   1. Try cached "golden" response (demo safety).
 *   2. If no key, return cached or a placeholder.
 *   3. Otherwise run raw + judge in parallel, assemble the ScanResult.
 *   4. On pipeline error, fall back to cached if available.
 */
export async function POST(req: NextRequest) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }
  const query = (body.query ?? "").trim();
  if (!query) {
    return new NextResponse("query is required", { status: 400 });
  }

  const forceLive = req.nextUrl.searchParams.get("live") === "1";
  const golden = matchGoldenQuery(query);

  // Demo-safe path: use cached golden responses whenever possible.
  if (golden && !forceLive) {
    return NextResponse.json(golden);
  }

  // No key → fall back to cached or a clear placeholder.
  if (!hasApiKey()) {
    if (golden) return NextResponse.json(golden);
    return NextResponse.json(makePlaceholder(query, "missing-api-key"));
  }

  // Live pipeline.
  try {
    const { sources, backend } = await retrieveForQuery(query, 8);

    // Short-circuit: if nothing in the corpus matches, skip the judge entirely
    // and return a pipeline-level "no relevant sources" verdict. This is more
    // honest than asking the judge to hallucinate reasoning over empty context.
    if (sources.length === 0) {
      console.log(`[/api/query] ${backend} retrieval returned 0 sources for query: "${query}"`);
      const raw = await callRaw(query);
      return NextResponse.json(makeEmptyCorpusResult(query, raw));
    }
    console.log(`[/api/query] ${backend} retrieval returned ${sources.length} sources for query: "${query}"`);

    const [raw, judge] = await Promise.all([
      callRaw(query),
      callJudge(query, sources),
    ]);

    const breakdown = buildScoreBreakdown(
      {
        agreement_fraction: judge.agreement_fraction,
        direct_evidence_fraction: judge.direct_evidence_fraction,
        self_confidence: judge.self_confidence,
      },
      sources,
    );
    const validationScore = computeValidationScore(breakdown);

    // Filter source-id references in the judge output to only IDs the judge
    // was actually given. Guards against the model hallucinating ids.
    const knownIds = new Set(sources.map((s) => s.id));
    const sanitizeIds = (ids: string[]) => ids.filter((id) => knownIds.has(id));
    const safeConflicts = judge.conflicts.map((c) => ({
      ...c,
      supporting: sanitizeIds(c.supporting),
      opposing: sanitizeIds(c.opposing),
    }));
    const safeDecay = judge.decay.map((d) => ({
      ...d,
      outdated_sources: sanitizeIds(d.outdated_sources),
      current_sources: sanitizeIds(d.current_sources),
    }));

    const scan: ScanResult = {
      query,
      timestamp: new Date().toISOString(),
      cached: false,
      raw,
      verified: {
        synthesis: judge.synthesis,
        gaps: judge.gaps,
        conflicts: safeConflicts,
        decay: safeDecay,
        validation_score: validationScore,
        score_breakdown: breakdown,
        sources,
        stats: {
          sources_scanned: sources.length,
          conflicts_surfaced: safeConflicts.length,
          decayed_claims_flagged: safeDecay.length,
        },
      },
    };

    // "Learn" pillar: append the verdict to HD's writable /agent/ memory so
    // the audit log lives inside the same knowledge surface that produced it.
    // Best-effort, non-blocking — failures are logged inside the helper.
    if (backend === "humandelta") {
      void humandeltaLogAudit(query, {
        validation_score: validationScore,
        score_breakdown: breakdown,
        synthesis: judge.synthesis,
        source_ids: sources.map((s) => s.id),
        gap_count: judge.gaps.length,
        conflict_count: safeConflicts.length,
        decay_count: safeDecay.length,
      });
    }

    return NextResponse.json(scan);
  } catch (err) {
    console.error("[/api/query] pipeline failed:", err);
    // Last-resort fallback: cached golden if it matched.
    if (golden) return NextResponse.json({ ...golden, cached: true });
    return new NextResponse(
      `Pipeline error: ${err instanceof Error ? err.message : "unknown"}`,
      { status: 500 },
    );
  }
}

/* ---------------------------------------------------------------- */

function makeEmptyCorpusResult(
  query: string,
  raw: { answer: string; model: string },
): ScanResult {
  return {
    query,
    timestamp: new Date().toISOString(),
    cached: false,
    raw,
    verified: {
      synthesis:
        "The clean-room knowledge base contains no sources relevant to this question. Without grounded evidence, DeepDelta declines to synthesize an answer.",
      gaps: [
        {
          description:
            "No corpus entries matched any keywords or tags in the question. Expand the knowledge base before trusting an answer on this topic.",
          impact: "high",
        },
      ],
      conflicts: [],
      decay: [],
      validation_score: 0,
      score_breakdown: {
        source_agreement: 0,
        direct_evidence: 0,
        recency: 0,
        self_confidence: 0,
      },
      sources: [],
      stats: {
        sources_scanned: 0,
        conflicts_surfaced: 0,
        decayed_claims_flagged: 0,
      },
    },
  };
}

function makePlaceholder(query: string, reason: "missing-api-key"): ScanResult {
  const message =
    reason === "missing-api-key"
      ? "ANTHROPIC_API_KEY is not configured. Copy .env.local.example to .env.local and paste your key, then restart the dev server. Cached demo queries still work without a key."
      : "The live pipeline is unavailable.";

  return {
    query,
    timestamp: new Date().toISOString(),
    cached: false,
    raw: {
      model: "unavailable",
      answer: message,
    },
    verified: {
      synthesis: message,
      gaps: [
        {
          description: "Pipeline unavailable — no live verification was run.",
          impact: "high",
        },
      ],
      conflicts: [],
      decay: [],
      validation_score: 0,
      score_breakdown: {
        source_agreement: 0,
        direct_evidence: 0,
        recency: 0,
        self_confidence: 0,
      },
      sources: [],
      stats: {
        sources_scanned: 0,
        conflicts_surfaced: 0,
        decayed_claims_flagged: 0,
      },
    },
  };
}

