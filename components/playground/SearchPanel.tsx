"use client";

import { useState, useTransition } from "react";
import {
  ApiError,
  search,
  type SearchHit,
  type SearchResponse,
} from "@/lib/playground/api-client";
import { JsonViewer } from "./JsonViewer";

export function SearchPanel({ containerTag }: { containerTag: string }) {
  const [q, setQ] = useState("where does Alex work?");
  const [searchMode, setSearchMode] = useState<
    "memories" | "documents" | "hybrid"
  >("hybrid");
  const [limit, setLimit] = useState(10);
  const [threshold, setThreshold] = useState(0.3);
  const [includeRelated, setIncludeRelated] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);

  const disabled = !containerTag.trim() || !q.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await search({
          q: q.trim(),
          containerTag: containerTag.trim(),
          searchMode,
          limit,
          threshold,
          includeRelated,
        });
        setData(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Search failed");
        setData(null);
      }
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          Read · L8
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Search</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm text-[var(--muted)]">q</span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="field text-sm"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">searchMode</span>
            <select
              value={searchMode}
              onChange={(e) =>
                setSearchMode(
                  e.target.value as "memories" | "documents" | "hybrid",
                )
              }
              className="field text-sm"
            >
              <option value="hybrid">hybrid</option>
              <option value="memories">memories</option>
              <option value="documents">documents</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">limit</span>
            <input
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="field font-mono text-sm"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">threshold</span>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="field font-mono text-sm"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeRelated}
            onChange={(e) => setIncludeRelated(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          includeRelated
        </label>

        <button
          type="submit"
          disabled={disabled || pending}
          className="h-10 rounded bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Searching…" : "POST /v3/search"}
        </button>
      </form>

      {error ? <p className="text-sm text-[var(--bad)]">{error}</p> : null}

      {data ? (
        <div className="space-y-3">
          <p className="font-mono text-xs text-[var(--muted)]">
            {data.total} result{data.total === 1 ? "" : "s"}
          </p>
          <ul className="space-y-3">
            {data.results.map((hit) => (
              <HitRow key={`${hit.type}-${hit.id}`} hit={hit} />
            ))}
          </ul>
        </div>
      ) : null}

      <JsonViewer data={data} />
    </section>
  );
}

function HitRow({ hit }: { hit: SearchHit }) {
  const text = hit.memory ?? hit.content ?? "";
  return (
    <li className="border-l-2 border-[var(--line)] pl-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--muted)]">
          {hit.type}
        </span>
        <span className="font-mono text-[11px] text-[var(--accent)]">
          {(hit.similarity * 100).toFixed(1)}%
        </span>
        {hit.isStatic ? (
          <span className="font-mono text-[11px] text-[var(--ok)]">static</span>
        ) : null}
      </div>
      <p className="mt-1 text-sm leading-relaxed">{text}</p>
      {hit.relatedMemories?.length ? (
        <ul className="mt-2 space-y-1 border-t border-[var(--line)] pt-2">
          {hit.relatedMemories.map((rel) => (
            <li key={rel.id} className="text-xs text-[var(--muted)]">
              <span className="font-mono">{rel.relation}</span> — {rel.memory}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
