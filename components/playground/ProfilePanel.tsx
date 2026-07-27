"use client";

import { useState, useTransition } from "react";
import {
  ApiError,
  getProfile,
  type BrandDynamicCard,
  type BrandStaticCard,
  type ProfileResponse,
} from "@/lib/playground/api-client";
import { JsonViewer } from "./JsonViewer";

export function ProfilePanel({ containerTag }: { containerTag: string }) {
  const [includeSearch, setIncludeSearch] = useState(false);
  const [q, setQ] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProfileResponse | null>(null);

  const disabled = !containerTag.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await getProfile({
          containerTag: containerTag.trim(),
          includeSearch,
          q: includeSearch && q.trim() ? q.trim() : undefined,
        });
        setData(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Profile failed");
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
        <h2 className="mt-1 text-lg font-semibold tracking-tight">
          Brand profile
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeSearch}
            onChange={(e) => setIncludeSearch(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          includeSearch
        </label>

        {includeSearch ? (
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">q</span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="field text-sm"
              placeholder="optional query with profile"
            />
          </label>
        ) : null}

        <button
          type="submit"
          disabled={disabled || pending}
          className="h-10 rounded bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Loading…" : "POST /v3/profile"}
        </button>
      </form>

      {error ? <p className="text-sm text-[var(--bad)]">{error}</p> : null}

      {data ? (
        <div className="space-y-6">
          <BrandCard title="Static card" card={data.profile.staticCard} />
          <BrandCard title="Dynamic card" card={data.profile.dynamicCard} />
        </div>
      ) : null}

      {data?.searchResults ? (
        <div className="border-t border-[var(--line)] pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Nested search ({data.searchResults.total})
          </p>
          <ul className="space-y-2">
            {data.searchResults.results.map((hit) => (
              <li
                key={`${hit.type}-${hit.id}`}
                className="text-sm text-[var(--muted)]"
              >
                <span className="font-mono text-[11px] text-[var(--accent)]">
                  {hit.type}
                </span>{" "}
                {hit.memory ?? hit.content}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <JsonViewer data={data} />
    </section>
  );
}

function BrandCard({
  title,
  card,
}: {
  title: string;
  card: BrandStaticCard | BrandDynamicCard;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-mono text-xs uppercase tracking-wide text-[var(--muted)]">
        {title}
      </h3>
      {Object.entries(card).map(([key, facts]) => (
        <FactList key={key} title={key} facts={facts as string[]} />
      ))}
    </div>
  );
}

function FactList({ title, facts }: { title: string; facts: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-[var(--ink)]">{title}</h4>
      {facts.length === 0 ? (
        <p className="mt-1 text-sm text-[var(--muted)]">None yet</p>
      ) : (
        <ul className="mt-1 space-y-2">
          {facts.map((fact) => (
            <li
              key={fact}
              className="border-l-2 border-[var(--line)] pl-3 text-sm leading-relaxed"
            >
              {fact}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
