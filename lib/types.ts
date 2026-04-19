// Shared TypeScript types for DeepDelta.
// The verified pipeline is modeled on Human Delta's language:
// surface (gaps, conflicts, decay) → structure (validated, AI-ready) → learn.

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url?: string;
  year: number;
  snippet: string;
  tags: string[];
}

export interface Gap {
  description: string;
  impact: "low" | "medium" | "high";
}

export interface Conflict {
  claim: string;
  /** Source IDs that support the claim. */
  supporting: string[];
  /** Source IDs that contradict the claim. */
  opposing: string[];
  explanation: string;
}

export interface DecayFlag {
  /** The stale/older fact still showing up in some sources. */
  outdated_claim: string;
  /** Source IDs that still cite the outdated fact. */
  outdated_sources: string[];
  /** The newer, superseding fact. */
  current_claim: string;
  /** Source IDs supporting the current fact. */
  current_sources: string[];
  /** Year the newer fact was established. */
  as_of_year: number;
}

/** Breakdown of the 0–100 validation score so users can audit how it was computed. */
export interface ScoreBreakdown {
  /** Fraction of retrieved sources that agree on the main claim (0–1). */
  source_agreement: number;
  /** Fraction with direct quote / primary-source evidence (0–1). */
  direct_evidence: number;
  /** Recency-weighted score; 1.0 = all sources are current. */
  recency: number;
  /** LLM-reported confidence in its own synthesis (0–1). */
  self_confidence: number;
}

export interface VerifiedResponse {
  synthesis: string;
  gaps: Gap[];
  conflicts: Conflict[];
  decay: DecayFlag[];
  /** 0–100 integer, rendered as a percentage in the UI. */
  validation_score: number;
  score_breakdown: ScoreBreakdown;
  sources: Source[];
  stats: {
    sources_scanned: number;
    conflicts_surfaced: number;
    decayed_claims_flagged: number;
  };
}

/** Which provider a given raw answer came from. */
export type RawProvider = "anthropic" | "openai" | "google";

/**
 * One raw (unsourced, unverified) answer from a single frontier model.
 * The demo shows three of these side-by-side to make the point that the
 * verification failure mode is shared across providers, not a Claude-specific
 * quirk.
 */
export interface RawAnswer {
  provider: RawProvider;
  /** Human-readable model label shown in the UI (e.g. "gpt-4o (no retrieval)"). */
  model: string;
  answer: string;
  /** "ok" means answer is usable; "error" means render a dimmed unavailable card. */
  status: "ok" | "error";
  /** Present when status === "error"; truncated for display. */
  error?: string;
  /** Wall-clock time in ms, for the demo-time latency badge. */
  latency_ms: number;
}

/** @deprecated use RawAnswer[]. Kept as a type alias for any leftover call sites. */
export type RawResponse = RawAnswer;

export interface ScanResult {
  query: string;
  /** Ordered [Anthropic, OpenAI, Google]. Render in this order for consistency. */
  raw: RawAnswer[];
  verified: VerifiedResponse;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** True when the response came from a pre-cached golden query (demo-safe fallback). */
  cached: boolean;
}
