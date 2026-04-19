// Anthropic client + prompt construction for the DeepDelta pipeline.
//
// Two calls happen per scan, in parallel:
//   1. Raw:   plain Claude call, no retrieval. Goes in the left column.
//   2. Judge: Claude with tool-use forcing a structured VerifiedResponse.
//
// We deliberately avoid importing the SDK's fine-grained content-block types
// (e.g. Anthropic.TextBlock) because their paths shift between minor SDK
// versions. Narrowing by `.type === "..."` is safer across the board.

import Anthropic from "@anthropic-ai/sdk";
import type { Conflict, DecayFlag, Gap, Source } from "./types";
import { formatSourcesForPrompt } from "./retrieval";

const RAW_MODEL =
  process.env.ANTHROPIC_RAW_MODEL || "claude-sonnet-4-6";
const JUDGE_MODEL =
  process.env.ANTHROPIC_JUDGE_MODEL || "claude-sonnet-4-6";

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY not set. Copy .env.local.example to .env.local and add your key.",
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Narrow a content block. We only care about text + tool_use.
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: string; [k: string]: unknown };

function extractText(blocks: unknown): string {
  if (!Array.isArray(blocks)) return "";
  return (blocks as ContentBlock[])
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function extractToolInput(blocks: unknown, toolName: string): unknown | null {
  if (!Array.isArray(blocks)) return null;
  const found = (blocks as ContentBlock[]).find(
    (b) => b.type === "tool_use" && (b as { name?: string }).name === toolName,
  );
  if (!found) return null;
  return (found as { input: unknown }).input;
}

/* ------------------------------------------------------------------ */
/* Raw column                                                          */
/* ------------------------------------------------------------------ */

const RAW_SYSTEM = `You are a knowledgeable but un-grounded AI assistant. Answer the user's deep-sea question in 2-3 sentences. Be confident and concise. Do not cite sources. Do not hedge.`;

export async function callRaw(
  query: string,
): Promise<{ answer: string; model: string }> {
  const resp = await client().messages.create({
    model: RAW_MODEL,
    max_tokens: 400,
    system: RAW_SYSTEM,
    messages: [{ role: "user", content: query }],
  });
  const text = extractText(resp.content);
  return {
    answer: text || "(empty response)",
    model: `${RAW_MODEL} (no retrieval)`,
  };
}

/* ------------------------------------------------------------------ */
/* Verified column — the judge                                         */
/* ------------------------------------------------------------------ */

export interface JudgeOutput {
  synthesis: string;
  gaps: Gap[];
  conflicts: Conflict[];
  decay: DecayFlag[];
  agreement_fraction: number;
  direct_evidence_fraction: number;
  self_confidence: number;
}

// Typed loosely on purpose; the SDK shape for Tool has changed in past minor
// versions and we don't want a hard dependency on a specific surface.
const JUDGE_TOOL = {
  name: "return_verified_response",
  description:
    "Return the structured verification result for a deep-sea knowledge question. Must be called exactly once.",
  input_schema: {
    type: "object",
    properties: {
      synthesis: {
        type: "string",
        description:
          "A 2–4 sentence grounded answer to the question, drawing ONLY from the provided corpus snippets. If the corpus is insufficient, say so explicitly.",
      },
      gaps: {
        type: "array",
        description:
          "Aspects of the question the corpus cannot answer confidently. Empty array if none.",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            impact: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["description", "impact"],
        },
      },
      conflicts: {
        type: "array",
        description:
          "Disagreements between sources on a factual claim, where neither is clearly newer/authoritative. Empty array if none. Regional or topical differences (e.g. 'Pacific vs Atlantic fauna') count as conflicts.",
        items: {
          type: "object",
          properties: {
            claim: { type: "string", description: "The contested claim." },
            supporting: {
              type: "array",
              items: { type: "string" },
              description: "Source IDs that support the claim.",
            },
            opposing: {
              type: "array",
              items: { type: "string" },
              description: "Source IDs that contradict the claim.",
            },
            explanation: {
              type: "string",
              description: "1–2 sentences explaining the disagreement.",
            },
          },
          required: ["claim", "supporting", "opposing", "explanation"],
        },
      },
      decay: {
        type: "array",
        description:
          "Facts where an older source has been superseded by a newer source. Use this ONLY when the newer claim is unambiguously more credible (e.g. a newer measurement or record). Empty array if none.",
        items: {
          type: "object",
          properties: {
            outdated_claim: { type: "string" },
            outdated_sources: { type: "array", items: { type: "string" } },
            current_claim: { type: "string" },
            current_sources: { type: "array", items: { type: "string" } },
            as_of_year: {
              type: "number",
              description: "Year the newer, superseding fact was established.",
            },
          },
          required: [
            "outdated_claim",
            "outdated_sources",
            "current_claim",
            "current_sources",
            "as_of_year",
          ],
        },
      },
      agreement_fraction: {
        type: "number",
        description:
          "Fraction (0–1) of sources that agree with the main claim in your synthesis. IMPORTANT: exclude any sources you flagged under `decay` (outdated_sources) from BOTH numerator and denominator — decayed sources are already penalized via the decay flag, so don't double-count them here. Also exclude sources that are clearly off-topic.",
      },
      direct_evidence_fraction: {
        type: "number",
        description:
          "Fraction (0–1) of sources (excluding decayed/off-topic ones — same filter as agreement_fraction) that contain a direct quantitative measurement or primary-source observation supporting the main claim.",
      },
      self_confidence: {
        type: "number",
        description:
          "Your own calibrated confidence (0–1) in the synthesis given ONLY the provided sources. Be honest — if the corpus is thin, lower this.",
      },
    },
    required: [
      "synthesis",
      "gaps",
      "conflicts",
      "decay",
      "agreement_fraction",
      "direct_evidence_fraction",
      "self_confidence",
    ],
  },
} as const;

const JUDGE_SYSTEM = `You are the knowledge judge in a verification pipeline called DeepDelta, built on Human Delta's framework for AI-ready knowledge infrastructure.

Your job: given a user's deep-sea question and a set of snippets from a curated clean-room knowledge base, produce a structured response that exposes GAPS, CONFLICTS, and DECAY — the three failure modes Human Delta's product catches in enterprise knowledge bases.

Definitions:
- GAP: the corpus does not contain sufficient evidence to answer the question completely.
- CONFLICT: two or more sources disagree on a factual claim, and neither is clearly newer / more authoritative. Regional or topical differences (e.g. "Pacific vents favor tube worms, Atlantic favors shrimp") count as conflicts.
- DECAY: an older source states something that has been superseded by a newer, more credible source. Always cite BOTH the outdated claim and the current claim.

Rules:
- Use ONLY the provided snippets. Do NOT rely on outside knowledge.
- Cite sources by their exact id (e.g. "src-wiki-marianas-snailfish"). Never invent ids.
- If the corpus is thin, say so in a gap and lower your self_confidence accordingly.
- Your synthesis must be 2–4 sentences, direct, and fully grounded in the cited sources.
- Always call the \`return_verified_response\` tool. Never respond in plain text.`;

export async function callJudge(
  query: string,
  sources: Source[],
): Promise<JudgeOutput> {
  const userMessage = `Question: ${query}

Clean-room knowledge base — ${sources.length} source${sources.length === 1 ? "" : "s"}:

${formatSourcesForPrompt(sources)}

Call \`return_verified_response\` with the full structured verdict.`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = await client().messages.create({
    model: JUDGE_MODEL,
    max_tokens: 2048,
    system: JUDGE_SYSTEM,
    // Cast: SDK Tool typing has shifted across minor versions; wire shape is stable.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [JUDGE_TOOL] as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tool_choice: { type: "tool", name: "return_verified_response" } as any,
    messages: [{ role: "user", content: userMessage }],
  });

  const input = extractToolInput(resp.content, "return_verified_response");
  if (!input || typeof input !== "object") {
    throw new Error(
      "Judge model did not return a structured tool_use block.",
    );
  }
  return input as JudgeOutput;
}

export function judgeModelName(): string {
  return JUDGE_MODEL;
}
