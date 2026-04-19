"use client";

import { useState } from "react";
import {
  Waves,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Clock3,
  CircleHelp,
  ExternalLink,
  Loader2,
  BookOpen,
} from "lucide-react";
import clsx from "clsx";
import { SUGGESTED_QUERIES } from "@/lib/mockResponses";
import type {
  ScanResult,
  VerifiedResponse,
  Source,
  Gap,
  Conflict,
  DecayFlag,
} from "@/lib/types";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScan(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as ScanResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Header />

      <section className="mt-8">
        <QueryBox
          query={query}
          setQuery={setQuery}
          loading={loading}
          onSubmit={() => runScan(query)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => {
                setQuery(q);
                runScan(q);
              }}
              className="rounded-full border border-abyss-200 bg-white/60 px-3 py-1 text-xs text-abyss-700 transition hover:border-abyss-400 hover:bg-white"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <div className="mt-8 rounded-lg border border-coral-500/30 bg-coral-400/10 p-4 text-sm text-coral-600">
          Scan failed: {error}
        </div>
      ) : null}

      {loading ? <LoadingState /> : null}

      {result ? (
        <>
          <StatsBar verified={result.verified} cached={result.cached} />
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RawColumn answer={result.raw.answer} model={result.raw.model} />
            <VerifiedColumn verified={result.verified} />
          </div>
        </>
      ) : (
        !loading && !error && <EmptyState />
      )}

      <Footer />
    </main>
  );
}

/* ---------- Header + hero ---------- */

function Header() {
  return (
    <header>
      <div className="flex items-center gap-2 text-abyss-700">
        <Waves className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-wide">DEEPDELTA</span>
        <span className="ml-2 rounded-full bg-abyss-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-abyss-600">
          Hackathon build
        </span>
      </div>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-abyss-900 sm:text-4xl">
        Launch AI you can trust — for deep-sea knowledge.
      </h1>
      <p className="mt-3 max-w-2xl text-abyss-700">
        A verification layer that exposes the{" "}
        <span className="font-medium text-abyss-900">gaps</span>,{" "}
        <span className="font-medium text-abyss-900">conflicts</span>, and{" "}
        <span className="font-medium text-abyss-900">decay</span> invisible to
        a raw LLM. Built on the Human Delta playbook, applied to one of the most
        fragmented knowledge domains on Earth.
      </p>
    </header>
  );
}

/* ---------- Query box ---------- */

function QueryBox({
  query,
  setQuery,
  loading,
  onSubmit,
}: {
  query: string;
  setQuery: (v: string) => void;
  loading: boolean;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex items-center gap-3 rounded-xl border border-abyss-200 bg-white p-2 shadow-sm focus-within:border-abyss-500"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask a deep-sea question — e.g. 'What is the deepest fish ever recorded?'"
        className="w-full bg-transparent px-3 py-2 text-abyss-900 outline-none placeholder:text-abyss-400"
      />
      <button
        type="submit"
        disabled={loading || !query.trim()}
        className="flex items-center gap-2 rounded-lg bg-abyss-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-abyss-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Scan knowledge
      </button>
    </form>
  );
}

/* ---------- Stats bar (mirrors Human Delta's stats strip) ---------- */

function StatsBar({
  verified,
  cached,
}: {
  verified: VerifiedResponse;
  cached: boolean;
}) {
  const { stats, validation_score } = verified;
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-abyss-200 bg-white px-5 py-4 shadow-sm">
      <Stat label="Sources scanned" value={stats.sources_scanned.toString()} />
      <Divider />
      <Stat
        label="Conflicts surfaced"
        value={stats.conflicts_surfaced.toString()}
      />
      <Divider />
      <Stat
        label="Decayed claims flagged"
        value={stats.decayed_claims_flagged.toString()}
      />
      <Divider />
      <Stat label="Validation score" value={`${validation_score}%`} highlight />
      {cached ? (
        <span className="ml-auto rounded-full bg-abyss-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-abyss-600">
          Cached demo query
        </span>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span
        className={clsx(
          "text-2xl font-semibold tracking-tight",
          highlight ? "text-abyss-700" : "text-abyss-900"
        )}
      >
        {value}
      </span>
      <span className="text-xs uppercase tracking-wider text-abyss-500">
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <span className="hidden h-8 w-px bg-abyss-100 sm:inline-block" />;
}

/* ---------- Raw column ---------- */

function RawColumn({ answer, model }: { answer: string; model: string }) {
  return (
    <div className="rounded-xl border border-abyss-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-abyss-600">
          <Sparkles className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Raw LLM
          </h2>
        </div>
        <span className="text-[10px] text-abyss-400">{model}</span>
      </div>
      <p className="mt-4 text-abyss-800 leading-relaxed">{answer}</p>
      <div className="mt-6 border-t border-dashed border-abyss-200 pt-3 text-xs text-abyss-500">
        No sources. No conflict detection. No recency check.
      </div>
    </div>
  );
}

/* ---------- Verified column ---------- */

function VerifiedColumn({ verified }: { verified: VerifiedResponse }) {
  return (
    <div className="rounded-xl border border-abyss-500/40 bg-white p-6 shadow-md ring-1 ring-abyss-500/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-abyss-700">
          <ShieldCheck className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            DeepDelta verified
          </h2>
        </div>
        <ScoreChip score={verified.validation_score} />
      </div>

      <p className="mt-4 text-abyss-900 leading-relaxed">
        {verified.synthesis}
      </p>

      {verified.gaps.length > 0 && <GapsSection gaps={verified.gaps} />}
      {verified.conflicts.length > 0 && (
        <ConflictsSection
          conflicts={verified.conflicts}
          sources={verified.sources}
        />
      )}
      {verified.decay.length > 0 && (
        <DecaySection decay={verified.decay} sources={verified.sources} />
      )}

      <ScoreBreakdownSection verified={verified} />
      <SourcesSection sources={verified.sources} />
    </div>
  );
}

function ScoreChip({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 60
        ? "bg-kelp-400/10 text-kelp-600 border-kelp-400/40"
        : "bg-coral-400/10 text-coral-600 border-coral-400/40";
  return (
    <span
      className={clsx(
        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tone
      )}
    >
      {score}% validated
    </span>
  );
}

function SectionHeader({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-abyss-600">
      {icon}
      <span>{label}</span>
      <span className="rounded-full bg-abyss-100 px-1.5 py-0.5 text-[10px] text-abyss-600">
        {count}
      </span>
    </div>
  );
}

function GapsSection({ gaps }: { gaps: Gap[] }) {
  return (
    <div>
      <SectionHeader
        icon={<CircleHelp className="h-4 w-4" />}
        label="Gaps"
        count={gaps.length}
      />
      <ul className="mt-2 space-y-2">
        {gaps.map((g, i) => (
          <li
            key={i}
            className="rounded-lg border border-abyss-100 bg-abyss-50/40 p-3 text-sm text-abyss-800"
          >
            <span
              className={clsx(
                "mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                g.impact === "high"
                  ? "bg-coral-400/20 text-coral-600"
                  : g.impact === "medium"
                    ? "bg-kelp-400/20 text-kelp-600"
                    : "bg-abyss-100 text-abyss-600"
              )}
            >
              {g.impact} impact
            </span>
            {g.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConflictsSection({
  conflicts,
  sources,
}: {
  conflicts: Conflict[];
  sources: Source[];
}) {
  return (
    <div>
      <SectionHeader
        icon={<AlertTriangle className="h-4 w-4" />}
        label="Conflicts"
        count={conflicts.length}
      />
      <ul className="mt-2 space-y-3">
        {conflicts.map((c, i) => (
          <li
            key={i}
            className="rounded-lg border border-kelp-400/30 bg-kelp-400/5 p-3 text-sm text-abyss-800"
          >
            <p className="font-medium text-abyss-900">{c.claim}</p>
            <p className="mt-1 text-abyss-700">{c.explanation}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <SourceRefs
                label="Supports"
                ids={c.supporting}
                sources={sources}
                tone="emerald"
              />
              <SourceRefs
                label="Opposes"
                ids={c.opposing}
                sources={sources}
                tone="coral"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DecaySection({
  decay,
  sources,
}: {
  decay: DecayFlag[];
  sources: Source[];
}) {
  return (
    <div>
      <SectionHeader
        icon={<Clock3 className="h-4 w-4" />}
        label="Decay"
        count={decay.length}
      />
      <ul className="mt-2 space-y-3">
        {decay.map((d, i) => (
          <li
            key={i}
            className="rounded-lg border border-coral-400/30 bg-coral-400/5 p-3 text-sm text-abyss-800"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-coral-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-coral-600">
                Stale
              </span>
              <span className="text-abyss-700 line-through decoration-coral-500/60">
                {d.outdated_claim}
              </span>
            </div>
            <div className="mt-1 flex items-start gap-2">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                Current
              </span>
              <span className="text-abyss-900">
                {d.current_claim}{" "}
                <span className="text-xs text-abyss-500">
                  (as of {d.as_of_year})
                </span>
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <SourceRefs
                label="Outdated"
                ids={d.outdated_sources}
                sources={sources}
                tone="coral"
              />
              <SourceRefs
                label="Current"
                ids={d.current_sources}
                sources={sources}
                tone="emerald"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SourceRefs({
  label,
  ids,
  sources,
  tone,
}: {
  label: string;
  ids: string[];
  sources: Source[];
  tone: "emerald" | "coral";
}) {
  if (!ids.length) return null;
  const palette =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-coral-400/10 text-coral-600 border-coral-400/30";
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-abyss-500">{label}:</span>
      {ids.map((id) => {
        const s = sources.find((src) => src.id === id);
        const tag = s
          ? `${s.publisher.split(" ")[0]} ${s.year}`
          : id;
        return (
          <span
            key={id}
            className={clsx(
              "rounded-full border px-2 py-0.5 text-[10px]",
              palette
            )}
            title={s?.title}
          >
            {tag}
          </span>
        );
      })}
    </span>
  );
}

function ScoreBreakdownSection({ verified }: { verified: VerifiedResponse }) {
  const { score_breakdown: b, validation_score } = verified;
  const bars: { label: string; value: number }[] = [
    { label: "Source agreement", value: b.source_agreement },
    { label: "Direct evidence", value: b.direct_evidence },
    { label: "Recency", value: b.recency },
    { label: "Self-confidence", value: b.self_confidence },
  ];
  return (
    <div className="mt-6 rounded-lg border border-abyss-100 bg-abyss-50/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-abyss-600">
          Validation score breakdown
        </span>
        <span className="text-xs font-medium text-abyss-700">
          {validation_score}/100
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="w-36 text-xs text-abyss-600">{bar.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-abyss-100">
              <div
                className="h-full bg-abyss-500"
                style={{ width: `${Math.round(bar.value * 100)}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs tabular-nums text-abyss-700">
              {Math.round(bar.value * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourcesSection({ sources }: { sources: Source[] }) {
  return (
    <div>
      <SectionHeader
        icon={<BookOpen className="h-4 w-4" />}
        label="Sources"
        count={sources.length}
      />
      <ul className="mt-2 space-y-2">
        {sources.map((s) => (
          <li
            key={s.id}
            className="rounded-lg border border-abyss-100 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-abyss-900">
                  {s.title}
                </p>
                <p className="mt-0.5 text-xs text-abyss-600">
                  {s.publisher} · {s.year}
                </p>
              </div>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center gap-1 text-xs text-abyss-500 hover:text-abyss-700"
                >
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-abyss-700 leading-relaxed">
              &ldquo;{s.snippet}&rdquo;
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Empty / loading ---------- */

function EmptyState() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PreviewCard
        title="Raw LLM"
        subtitle="What you'd get from a bare call to Claude"
        body="A fluent paragraph. No sources. No way to tell what's stale or contested."
        muted
      />
      <PreviewCard
        title="DeepDelta verified"
        subtitle="Same question, run through the verification pipeline"
        body="Synthesized answer + gaps, conflicts, decay flags, cited sources, and a validation score you can audit."
      />
    </div>
  );
}

function PreviewCard({
  title,
  subtitle,
  body,
  muted,
}: {
  title: string;
  subtitle: string;
  body: string;
  muted?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-6 shadow-sm",
        muted
          ? "border-abyss-200 bg-white/60"
          : "border-abyss-500/30 bg-white ring-1 ring-abyss-500/10"
      )}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wider text-abyss-600">
        {title}
      </h3>
      <p className="mt-1 text-xs text-abyss-500">{subtitle}</p>
      <p className="mt-4 text-sm text-abyss-700">{body}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-10 flex items-center justify-center gap-3 rounded-xl border border-abyss-200 bg-white/60 p-8 text-abyss-600">
      <Loader2 className="h-5 w-5 animate-spin" />
      Scanning knowledge base…
    </div>
  );
}

/* ---------- Footer ---------- */

function Footer() {
  return (
    <footer className="mt-16 border-t border-abyss-200 pt-6 text-xs text-abyss-500">
      <p>
        DeepDelta is a 24-hour hackathon build inspired by the Human Delta
        playbook: <em>surface</em> gaps, conflicts, and decay ·{" "}
        <em>structure</em> messy human knowledge into AI-ready form ·{" "}
        <em>learn</em> as the corpus grows. Corpus and outputs are illustrative.
      </p>
    </footer>
  );
}
