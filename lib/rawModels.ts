// Fan-out raw (unverified) answer generator across multiple frontier LLMs.
//
// The DeepDelta pitch hinges on showing that *every* raw model exhibits the
// same failure mode — confident, unsourced, occasionally stale. So instead of
// one Raw card we fan a query out to Claude, GPT-4o, and Gemini 2.0 Flash in
// parallel and let the user see three polished paragraphs that all fail to
// flag the gap the verified column catches.
//
// npm registry is locked down in this environment, so we talk to OpenAI and
// Google via their REST APIs directly — no SDK. Anthropic already has its
// SDK wired up in lib/anthropic.ts; we reuse callRaw from there.

import * as fs from "node:fs";
import * as path from "node:path";
import { callRaw as callClaudeRaw } from "./anthropic";
import { normalizeQuery } from "./mockResponses";
import type { RawAnswer } from "./types";

const OPENAI_MODEL = process.env.OPENAI_RAW_MODEL || "gpt-4o";
// Note: gemini-2.0-flash was deprecated for new API keys — use the current
// generation Flash model. Override with GEMINI_RAW_MODEL if needed.
const GEMINI_MODEL = process.env.GEMINI_RAW_MODEL || "gemini-2.5-flash";

const RAW_PROMPT =
  "You are a knowledgeable but un-grounded AI assistant. Answer the user's deep-sea question in 2-3 sentences. Be confident and concise. Do not cite sources. Do not hedge.";

const REQUEST_TIMEOUT_MS = 25_000;

/** Small helper so a hung API doesn't block the whole scan. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

function elapsed(start: number): number {
  return Math.round(performance.now() - start);
}

/* ---------------------- Provider calls ---------------------- */

async function callAnthropic(query: string): Promise<RawAnswer> {
  const start = performance.now();
  try {
    const { answer, model } = await withTimeout(
      callClaudeRaw(query),
      REQUEST_TIMEOUT_MS,
      "Anthropic",
    );
    return {
      provider: "anthropic",
      model,
      answer,
      status: "ok",
      latency_ms: elapsed(start),
    };
  } catch (err) {
    return {
      provider: "anthropic",
      model: "claude (unavailable)",
      answer: "",
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      latency_ms: elapsed(start),
    };
  }
}

async function callOpenAI(query: string): Promise<RawAnswer> {
  const start = performance.now();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      provider: "openai",
      model: `${OPENAI_MODEL} (no key)`,
      answer: "",
      status: "error",
      error: "OPENAI_API_KEY not set",
      latency_ms: 0,
    };
  }
  try {
    const resp = await withTimeout(
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          max_tokens: 400,
          messages: [
            { role: "system", content: RAW_PROMPT },
            { role: "user", content: query },
          ],
        }),
      }),
      REQUEST_TIMEOUT_MS,
      "OpenAI",
    );
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text.slice(0, 800)}`);
    }
    const json = (await resp.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!answer) throw new Error("Empty response");
    return {
      provider: "openai",
      model: `${OPENAI_MODEL} (no retrieval)`,
      answer,
      status: "ok",
      latency_ms: elapsed(start),
    };
  } catch (err) {
    return {
      provider: "openai",
      model: `${OPENAI_MODEL} (unavailable)`,
      answer: "",
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      latency_ms: elapsed(start),
    };
  }
}

async function callGemini(query: string): Promise<RawAnswer> {
  const start = performance.now();
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return {
      provider: "google",
      model: `${GEMINI_MODEL} (no key)`,
      answer: "",
      status: "error",
      error: "GOOGLE_API_KEY not set",
      latency_ms: 0,
    };
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const resp = await withTimeout(
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Gemini treats system instructions through a dedicated field.
          systemInstruction: { parts: [{ text: RAW_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: query }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
        }),
      }),
      REQUEST_TIMEOUT_MS,
      "Gemini",
    );
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${text.slice(0, 800)}`);
    }
    const json = (await resp.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const answer =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? "";
    if (!answer) throw new Error("Empty response");
    return {
      provider: "google",
      model: `${GEMINI_MODEL} (no retrieval)`,
      answer,
      status: "ok",
      latency_ms: elapsed(start),
    };
  } catch (err) {
    return {
      provider: "google",
      model: `${GEMINI_MODEL} (unavailable)`,
      answer: "",
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      latency_ms: elapsed(start),
    };
  }
}

/* ---------------------- Cache ---------------------- */

// Loaded once at module import. The prewarm script (npm run prewarm) writes
// this file with raw answers for the demo queries; serving from cache makes
// demo time independent of OpenAI / Google availability.
//
// Set RAW_CACHE=off to bypass (e.g. when iterating on prompt wording).

const CACHE_PATH = path.resolve(process.cwd(), ".cache", "raw-answers.json");

let _cache: Record<string, RawAnswer[]> | null = null;
function loadCache(): Record<string, RawAnswer[]> {
  if (_cache) return _cache;
  if (process.env.RAW_CACHE === "off") {
    _cache = {};
    return _cache;
  }
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const raw = fs.readFileSync(CACHE_PATH, "utf-8");
      _cache = JSON.parse(raw) as Record<string, RawAnswer[]>;
      return _cache;
    }
  } catch (err) {
    console.warn("[rawModels] failed to load raw-answer cache:", err);
  }
  _cache = {};
  return _cache;
}

/* ---------------------- Public ---------------------- */

/**
 * Fan a raw query out to Claude, GPT-4o, and Gemini 2.0 Flash in parallel.
 * Each provider returns its own RawAnswer regardless of success/failure — a
 * crashed provider surfaces as a card with status="error" rather than taking
 * down the scan. Return order is stable: [Anthropic, OpenAI, Google].
 *
 * Pre-warmed answers from .cache/raw-answers.json are returned immediately
 * if the normalized query matches.
 */
export async function fanOutRaw(query: string): Promise<RawAnswer[]> {
  const cache = loadCache();
  const cached = cache[normalizeQuery(query)];
  if (cached && cached.length > 0) {
    return cached;
  }
  const [anthropic, openai, google] = await Promise.all([
    callAnthropic(query),
    callOpenAI(query),
    callGemini(query),
  ]);
  return [anthropic, openai, google];
}

export const RAW_PROVIDER_ORDER = ["anthropic", "openai", "google"] as const;
