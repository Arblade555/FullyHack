// Deterministic validation-score computation.
// Takes the judge's self-reported fractions + the source recency signal
// computed from years, and combines them into a 0-100 score.

import type { ScoreBreakdown, Source } from "./types";

/**
 * Years beyond which a source counts as fully decayed. Deep-sea science still
 * cites 1990s–early-2000s foundational work routinely, so 30 is more defensible
 * than a tight 10–20 year window. Tune as the corpus evolves.
 */
const DECAY_HORIZON_YEARS = 30;

export function computeRecency(
  sources: Source[],
  currentYear: number = new Date().getFullYear(),
): number {
  if (sources.length === 0) return 0;
  // year=0 means "unknown" (e.g. a Human Delta hit where we couldn't regex
  // a year out of the chunk text). Exclude those from the weighted mean
  // rather than treating them as 1970. If every source is unknown, return
  // 0.5 — an honest "we don't know, so don't penalize or reward."
  const dated = sources.filter((s) => s.year > 0);
  if (dated.length === 0) return 0.5;
  const weights = dated.map((s) => {
    const age = Math.max(0, currentYear - s.year);
    return 1 - Math.min(age / DECAY_HORIZON_YEARS, 1);
  });
  return weights.reduce((a, b) => a + b, 0) / weights.length;
}

export interface JudgeScoreSignals {
  agreement_fraction: number;
  direct_evidence_fraction: number;
  self_confidence: number;
}

export function buildScoreBreakdown(
  judgeSignals: JudgeScoreSignals,
  sources: Source[],
): ScoreBreakdown {
  return {
    source_agreement: clamp01(judgeSignals.agreement_fraction),
    direct_evidence: clamp01(judgeSignals.direct_evidence_fraction),
    recency: clamp01(computeRecency(sources)),
    self_confidence: clamp01(judgeSignals.self_confidence),
  };
}

/**
 * 0–100 integer score. Weights mirror what's documented in README.md —
 * keep the two in sync.
 *   40% source agreement, 20% direct evidence, 20% recency, 20% self-confidence.
 */
export function computeValidationScore(b: ScoreBreakdown): number {
  const raw =
    0.4 * b.source_agreement +
    0.2 * b.direct_evidence +
    0.2 * b.recency +
    0.2 * b.self_confidence;
  return Math.round(clamp01(raw) * 100);
}

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
