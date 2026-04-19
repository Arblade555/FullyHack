import { NextRequest, NextResponse } from "next/server";
import { matchGoldenQuery } from "@/lib/mockResponses";
import type { ScanResult } from "@/lib/types";

/**
 * POST /api/query
 * Body: { query: string }
 *
 * Phase 1 (current): always returns a pre-cached "golden" response when the
 * query matches a known demo question. Otherwise returns a placeholder
 * not-yet-implemented response. This makes the UI fully demo-able before any
 * Anthropic API key or live retrieval is wired up.
 *
 * Phase 2 (next): live retrieval over data/sources.json + Anthropic Claude
 * for claim extraction + JSON-mode judge to produce real ScanResults.
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

  // Demo-safe path: use cached golden responses whenever possible.
  const golden = matchGoldenQuery(query);
  if (golden) {
    return NextResponse.json(golden);
  }

  // Fallback placeholder until the live pipeline lands.
  const placeholder: ScanResult = {
    query,
    timestamp: new Date().toISOString(),
    cached: false,
    raw: {
      model: "stub",
      answer:
        "(Live LLM call not yet wired up. This response is a placeholder so the UI can render. Try one of the suggested golden queries to see the full Raw vs Verified contrast.)",
    },
    verified: {
      synthesis:
        "(Live verification pipeline not yet implemented. Once wired in, this column will show the synthesized answer drawn from the curated corpus.)",
      gaps: [
        {
          description:
            "Pipeline not yet connected — retrieval, claim extraction, and judge step still to be implemented.",
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
  return NextResponse.json(placeholder);
}
