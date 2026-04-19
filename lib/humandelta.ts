// Human Delta integration.
//
// Retrieval model: we use Human Delta as the *knowledge filesystem*. The
// corpus of deep-sea Wikipedia pages is indexed and stored in HD's `/source/`
// virtual filesystem; on the first call we read those files via hd.fs.read()
// and cache them in memory. Each subsequent query runs keyword-scored
// retrieval + a passage extractor over the cached content.
//
// We initially tried hd.search() (semantic retrieval), but during the
// workshop the search backend returned 0 hits for every probe even though
// fs.read() returned real content — so we route around it. If/when HD
// search comes back, swap `humandeltaSearch` to call hd.search again.
//
// Audit logs still write to HD's writable /agent/ memory.

import type { Source } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: any = null;

async function client(): Promise<unknown> {
  if (_client) return _client;
  const apiKey = process.env.HUMANDELTA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "HUMANDELTA_API_KEY not set. Copy .env.local.example to .env.local and add your Human Delta key.",
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("humandelta");
  const HumanDelta = mod.HumanDelta ?? mod.default;
  const baseUrl = process.env.HUMANDELTA_BASE_URL;
  _client = new HumanDelta(baseUrl ? { apiKey, baseUrl } : { apiKey });
  return _client;
}

export function hasHumanDeltaKey(): boolean {
  return Boolean(process.env.HUMANDELTA_API_KEY);
}

/* -------------------------------------------------------------------------- */
/* Corpus loading                                                              */
/* -------------------------------------------------------------------------- */

// Page slugs we care about. Wikipedia crawling followed the link graph and
// pulled in noise (Ricky Williams, Prince William, etc.); we filter those out
// at the retrieval layer rather than trying to delete them from HD's /source.
const ALLOWED_SLUGS = new Set<string>([
  "abyssal_zone",
  "bioluminescence",
  "challenger_deep",
  "deep_sea",
  "gakkel_ridge",
  "hadal_zone",
  "hydrothermal_vent",
  "pseudoliparis_swirei", // Mariana snailfish redirects here
]);

const CORPUS_DIR = "/source/website/en.wikipedia.org";

interface CorpusDoc {
  slug: string;
  title: string;
  url: string;
  year: number;
  fullContent: string;
}

let _corpusCache: CorpusDoc[] | null = null;

/**
 * Load (and cache) the allowlisted corpus docs from HD's filesystem.
 * First call fires N parallel fs.read() API calls; subsequent calls are
 * in-memory.
 *
 * We deliberately skip hd.fs.list() — the real HD API returns 400 for `list`
 * (valid ops are shell/read/stat/write/delete). Since our corpus is a
 * fixed allowlist, iterating ALLOWED_SLUGS and read-or-skip is simpler
 * and one fewer round trip.
 */
async function loadCorpus(): Promise<CorpusDoc[]> {
  if (_corpusCache) return _corpusCache;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hd: any = await client();

  const slugs = Array.from(ALLOWED_SLUGS);
  const results = await Promise.all(
    slugs.map(async (slug): Promise<CorpusDoc | null> => {
      const path = `${CORPUS_DIR}/${slug}.md`;
      try {
        const raw = await hd.fs.read(path);
        const content = typeof raw === "string" ? raw : String(raw);
        // Title extraction reads the raw markdown's first H1.
        const title = extractTitle(content) ?? prettifySlug(slug);
        // Strip Wikipedia/Markdown noise once, at load time. Everything
        // downstream (scoring, passage extraction, year derivation) reads
        // the cleaned version — dramatically improves snippet readability
        // and keyword-density accuracy.
        const cleaned = stripMarkdown(content);
        return {
          slug,
          title,
          url: `https://en.wikipedia.org/wiki/${slug[0].toUpperCase()}${slug.slice(1)}`,
          year: deriveLatestYear(cleaned),
          fullContent: cleaned,
        };
      } catch (err) {
        console.warn(
          `[humandelta] fs.read failed for ${slug}:`,
          err instanceof Error ? err.message : err,
        );
        return null;
      }
    }),
  );
  _corpusCache = results.filter((d): d is CorpusDoc => d !== null);
  return _corpusCache;
}

/**
 * Strip Wikipedia + Markdown noise so the judge (and our keyword scorer)
 * reads clean prose. We intentionally keep link anchor text (the part
 * inside `[...]`) since that's often the semantic content.
 */
function stripMarkdown(md: string): string {
  return (
    md
      // Image refs: ![alt](url)  →  (drop entirely)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      // Escaped-bracket citation LINKS: [\[10\]](url) → (drop entirely)
      // (This variant wraps a Wikipedia cite number in an escaped bracket
      // pair inside a link — must run BEFORE the generic link regex or the
      // escape chars survive as visible noise.)
      .replace(/\[\\\[\d+\\\]\]\([^)]*\)/g, "")
      // Links: [text](url)  →  text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      // Empty / orphan link patterns left behind by citation stripping
      .replace(/\[\]\([^)]*\)/g, "")
      // Escaped citation markers like \[10\] or [10]
      .replace(/\\?\[\d+\\?\]/g, "")
      // Any stray escaped brackets leftover from Wikipedia citation syntax
      .replace(/\\[[\]]/g, "")
      // Bare URLs
      .replace(/https?:\/\/\S+/g, "")
      // DOI / Bibcode / PMID / ISSN noise common in Wikipedia references
      .replace(/\b(?:doi|bibcode|pmid|pmc|issn|isbn|oclc|s2cid|arxiv)\s*:\s*\S+/gi, "")
      // Wikipedia chrome lines (Jump to content / From Wikipedia, the free encyclopedia)
      .replace(/^\s*Jump to content.*$/gmi, "")
      .replace(/^\s*From Wikipedia, the free encyclopedia.*$/gmi, "")
      // Markdown headers / emphasis / horizontal rules
      .replace(/^#+\s*/gm, "")
      .replace(/^[-*_]{3,}\s*$/gm, "")
      .replace(/[*_`]+/g, "")
      // Simple table rows (lines that are mostly pipes)
      .replace(/^\s*\|.*\|\s*$/gm, "")
      // Blockquote markers at line start
      .replace(/^\s*>\s?/gm, "")
      // Orphan punctuation artifacts: `")`  `"(` `[]` from partial matches
      .replace(/"\s*\)/g, "")
      .replace(/\[\s*\]/g, "")
      // Collapse whitespace
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim()
  );
}

function extractTitle(md: string): string | null {
  const m = md.match(/^# (.+?)$/m);
  if (!m) return null;
  // Strip Wikipedia's "<topic> - Wikipedia" suffix.
  return m[1].trim().replace(/\s*-\s*Wikipedia$/i, "");
}

function prettifySlug(slug: string): string {
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Scan for 4-digit years (1950–present) and return the most recent one. Used
 * to estimate a "year of claim" per source so the recency-score has a signal.
 * Future dates (e.g. Wikipedia refs to "scheduled for 2027") are filtered
 * because they muddy the recency signal. Returns 0 if none found — score.ts
 * treats 0 as "unknown" and neutralizes it.
 */
function deriveLatestYear(text: string): number {
  const currentYear = new Date().getFullYear();
  const matches = text.match(/\b(19[5-9]\d|20[0-2]\d)\b/g);
  if (!matches) return 0;
  const valid = matches.map(Number).filter((y) => y <= currentYear);
  if (valid.length === 0) return 0;
  return Math.max(...valid);
}

/* -------------------------------------------------------------------------- */
/* Keyword scoring + passage extraction                                        */
/* -------------------------------------------------------------------------- */

const STOPWORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being",
  "of","to","in","on","at","by","for","from","with","about",
  "and","or","but","if","then","so","as","than",
  "what","who","whom","whose","which","that","this","these","those",
  "how","why","where","when","there","here",
  "do","does","did","done","doing",
  "have","has","had","having",
  "can","could","should","would","may","might","must",
  "it","its","they","them","their","we","our","you","your","i","me","my",
  // Domain stopwords — these always appear in deep-sea queries.
  "deep","sea","ocean","underwater",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Score a doc against the tokenized query. Slug and title matches are
 * strongest; body matches contribute but are capped per-token. We intentionally
 * do NOT require every token to appear — word-boundary regex is brittle
 * (e.g. "ever" misses "however"/"whenever"), which kills valid retrieval on
 * real demo queries like "deepest fish ever recorded". The LLM judge
 * downgrades confidence on off-topic tangential hits.
 */
function scoreDoc(doc: CorpusDoc, qTokens: string[]): number {
  const titleLower = doc.title.toLowerCase();
  const contentLower = doc.fullContent.toLowerCase();
  let score = 0;
  for (const t of qTokens) {
    if (doc.slug.includes(t)) score += 10;
    if (titleLower.includes(t)) score += 5;
    const re = new RegExp(`\\b${escapeRegex(t)}\\b`, "g");
    const matches = contentLower.match(re);
    // Cap per-token body contribution so a long file can't dominate on sheer length.
    if (matches) score += Math.min(matches.length, 5);
  }
  return score;
}

/**
 * Extract a query-relevant passage from a long document.
 * Finds the span with the highest density of query tokens within a ±400 char
 * window, then returns a `windowChars`-wide slice centered there.
 */
function extractBestPassage(
  content: string,
  qTokens: string[],
  windowChars = 1500,
): string {
  if (qTokens.length === 0) return content.slice(0, windowChars);
  const lower = content.toLowerCase();

  // Gather candidate positions (first N occurrences across all tokens).
  const positions: number[] = [];
  for (const t of qTokens) {
    let idx = lower.indexOf(t);
    while (idx !== -1 && positions.length < 400) {
      positions.push(idx);
      idx = lower.indexOf(t, idx + 1);
    }
  }
  if (positions.length === 0) return content.slice(0, windowChars);

  // Score each candidate position by how many tokens appear in a ±400 window.
  let bestIdx = positions[0];
  let bestScore = 0;
  for (const pos of positions) {
    const start = Math.max(0, pos - 400);
    const end = Math.min(lower.length, pos + 400);
    const window = lower.slice(start, end);
    let score = 0;
    for (const t of qTokens) if (window.includes(t)) score++;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = pos;
    }
  }

  const half = Math.floor(windowChars / 2);
  const start = Math.max(0, bestIdx - half);
  const end = Math.min(content.length, bestIdx + half);
  const slice = content.slice(start, end).replace(/\s+/g, " ").trim();
  return (start > 0 ? "… " : "") + slice + (end < content.length ? " …" : "");
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Retrieve top-K deep-sea sources from the Human Delta corpus for a query.
 * Returned shape is our `Source` type — a drop-in for the old static retriever.
 */
export async function humandeltaSearch(
  query: string,
  topK = 8,
): Promise<Source[]> {
  const corpus = await loadCorpus();
  if (corpus.length === 0) return [];

  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  // MIN_SCORE = 5 rejects "tangential mention" docs (e.g. "sea cucumber" as
  // a linked phrase inside a bioluminescence article). Real on-topic hits
  // score 10+ via slug, 5+ via title, or 5+ via multiple body occurrences —
  // so this threshold cleanly separates signal from noise without killing
  // recall on queries that happen to miss the slug.
  const MIN_SCORE = 5;
  const ranked = corpus
    .map((doc) => ({ doc, score: scoreDoc(doc, qTokens) }))
    .filter((x) => x.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return ranked.map(({ doc }) => ({
    id: doc.slug,
    title: doc.title,
    publisher: "en.wikipedia.org",
    url: doc.url,
    year: doc.year,
    snippet: extractBestPassage(doc.fullContent, qTokens),
    tags: [doc.slug],
  }));
}

/**
 * Fetch the HD source tree for a UI grounding panel.
 * Best-effort — we never fail the page render if HD's fs is unreachable.
 */
export async function humandeltaTree(depth = 3): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hd: any = await client();
    const out = await hd.fs.shell(`tree /source -L ${depth}`);
    return typeof out === "string" ? out.trim() : String(out);
  } catch (err) {
    console.error("[humandelta] tree failed:", err);
    return "(corpus tree unavailable)";
  }
}

/**
 * Append a verification verdict to HD's writable /agent/ memory. Best-effort.
 * Requires the API key to have fs:write scope; read-only keys silently skip.
 */
export async function humandeltaLogAudit(
  query: string,
  payload: unknown,
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hd: any = await client();
    const slug = query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const path = `/agent/audit/${Date.now()}-${slug}.json`;
    await hd.fs.write(
      path,
      JSON.stringify({ query, payload, ts: new Date().toISOString() }, null, 2),
    );
  } catch (err) {
    console.warn(
      "[humandelta] audit write skipped:",
      err instanceof Error ? err.message : err,
    );
  }
}
