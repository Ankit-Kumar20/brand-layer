"use client";

import { useState, useTransition } from "react";
import {
  ApiError,
  SAMPLE_CONTENT,
  addDocument,
} from "@/lib/playground/api-client";
import { DocumentStatusPanel } from "./DocumentStatus";
import { JsonViewer } from "./JsonViewer";

export function IngestPanel({
  containerTag,
  documentId,
  onDocumentId,
}: {
  containerTag: string;
  documentId: string;
  onDocumentId: (id: string) => void;
}) {
  const [content, setContent] = useState(SAMPLE_CONTENT);
  const [url, setUrl] = useState("");
  const [customId, setCustomId] = useState("onboarding_1");
  const [taskType, setTaskType] = useState<"memory" | "superrag">("memory");
  const [dreaming, setDreaming] = useState<"dynamic" | "instant">("instant");
  const [metadataText, setMetadataText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<unknown>();

  const disabled = !containerTag.trim();

  function loadSample() {
    setContent(SAMPLE_CONTENT);
    setUrl("");
    setCustomId("onboarding_1");
    setTaskType("memory");
    setDreaming("instant");
    setMetadataText("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setError(null);

    let metadata: Record<string, string | number | boolean> | undefined;
    if (metadataText.trim()) {
      try {
        const parsed = JSON.parse(metadataText) as unknown;
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          setError("metadata must be a JSON object");
          return;
        }
        metadata = parsed as Record<string, string | number | boolean>;
      } catch {
        setError("metadata JSON is invalid");
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await addDocument({
          content: content.trim() || undefined,
          url: url.trim() || undefined,
          containerTag: containerTag.trim(),
          customId: customId.trim() || undefined,
          taskType,
          dreaming,
          metadata,
        });
        setResponse(res);
        onDocumentId(res.id);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Ingest failed");
        setResponse(err instanceof ApiError ? err.body : undefined);
      }
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Write · L1
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Ingest document
          </h2>
        </div>
        <button
          type="button"
          onClick={loadSample}
          className="h-9 rounded border border-[var(--line)] px-3 text-sm text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
        >
          Load sample
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm text-[var(--muted)]">content</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="field resize-y font-sans text-sm"
            placeholder="Plain text to remember…"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-[var(--muted)]">url (optional)</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="field font-mono text-sm"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">customId</span>
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="field font-mono text-sm"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">taskType</span>
            <select
              value={taskType}
              onChange={(e) =>
                setTaskType(e.target.value as "memory" | "superrag")
              }
              className="field text-sm"
            >
              <option value="memory">memory</option>
              <option value="superrag">superrag</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">dreaming</span>
            <select
              value={dreaming}
              onChange={(e) =>
                setDreaming(e.target.value as "dynamic" | "instant")
              }
              className="field text-sm"
            >
              <option value="instant">instant</option>
              <option value="dynamic">dynamic</option>
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm text-[var(--muted)]">
            metadata JSON (optional)
          </span>
          <textarea
            value={metadataText}
            onChange={(e) => setMetadataText(e.target.value)}
            rows={2}
            placeholder='{"source":"playground"}'
            className="field resize-y font-mono text-xs"
          />
        </label>

        <button
          type="submit"
          disabled={disabled || pending}
          className="h-10 rounded bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-fg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Queuing…" : "POST /v3/documents"}
        </button>
      </form>

      {error ? <p className="text-sm text-[var(--bad)]">{error}</p> : null}
      <JsonViewer data={response} />

      <DocumentStatusPanel documentId={documentId} />
    </section>
  );
}
