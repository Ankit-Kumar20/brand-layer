"use client";

import { useState, useTransition } from "react";
import {
  ApiError,
  SAMPLE_COLORS_JSON,
  SAMPLE_MARKDOWN,
  SAMPLE_SVG,
  addDocument,
  type IngestKind,
} from "@/lib/playground/api-client";
import { DocumentStatusPanel } from "./DocumentStatus";
import { JsonViewer } from "./JsonViewer";

const KIND_META: Record<
  IngestKind,
  { label: string; customId: string; metadata: string }
> = {
  markdown: {
    label: "Markdown / text",
    customId: "voice",
    metadata: '{"source":"brand_guidelines","category":"identity"}',
  },
  pdf: {
    label: "PDF",
    customId: "brand-guide",
    metadata: '{"source":"brand_guidelines","category":"identity"}',
  },
  json: {
    label: "JSON tokens",
    customId: "colors",
    metadata:
      '{"source":"brand_tokens","category":"assets","assetType":"color"}',
  },
  url: {
    label: "Web URL",
    customId: "web:trybloom.ai",
    metadata: '{"source":"web","category":"products"}',
  },
  svg_asset: {
    label: "SVG logo",
    customId: "logo_primary_svg",
    metadata:
      '{"source":"asset","category":"assets","assetType":"logo","variant":"primary","market":"global","rights":"public","usage":"Use on light backgrounds; clear space = 1x mark height"}',
  },
};

const TEXT_FILE_ACCEPT: Partial<Record<IngestKind, string>> = {
  markdown: ".md,.markdown,.txt,text/markdown,text/plain",
  json: ".json,application/json",
  svg_asset: ".svg,image/svg+xml",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const b64 = result.includes("base64,")
        ? result.split("base64,")[1]!
        : result;
      resolve(b64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsText(file);
  });
}

function customIdFromFilename(name: string, fallback: string) {
  const base = name.replace(/\.[^.]+$/, "").trim();
  return base || fallback;
}

export function IngestPanel({
  containerTag,
  documentId,
  onDocumentId,
}: {
  containerTag: string;
  documentId: string;
  onDocumentId: (id: string) => void;
}) {
  const [kind, setKind] = useState<IngestKind>("markdown");
  const [content, setContent] = useState(SAMPLE_MARKDOWN);
  const [url, setUrl] = useState("https://trybloom.ai");
  const [pdfBase64, setPdfBase64] = useState("");
  const [fileName, setFileName] = useState("");
  const [customId, setCustomId] = useState(KIND_META.markdown.customId);
  const [taskType, setTaskType] = useState<"memory" | "superrag">("memory");
  const [dreaming, setDreaming] = useState<"dynamic" | "instant">("instant");
  const [metadataText, setMetadataText] = useState(KIND_META.markdown.metadata);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<unknown>();

  const disabled = !containerTag.trim();
  const textFileAccept = TEXT_FILE_ACCEPT[kind];

  function applyKind(next: IngestKind) {
    setKind(next);
    setCustomId(KIND_META[next].customId);
    setMetadataText(KIND_META[next].metadata);
    setError(null);
    setFileName("");
    setPdfBase64("");
    if (next === "markdown") setContent(SAMPLE_MARKDOWN);
    if (next === "json") setContent(SAMPLE_COLORS_JSON);
    if (next === "svg_asset") setContent(SAMPLE_SVG);
    if (next === "url") setUrl("https://trybloom.ai");
    if (next === "pdf") setContent("");
  }

  function loadSample() {
    applyKind(kind);
    setTaskType("memory");
    setDreaming("instant");
  }

  async function handlePdfFile(file: File | null) {
    if (!file) {
      setPdfBase64("");
      setFileName("");
      return;
    }
    setFileName(file.name);
    const b64 = await fileToBase64(file);
    setPdfBase64(b64);
    setCustomId(customIdFromFilename(file.name, "brand-guide"));
  }

  async function handleTextFile(file: File | null) {
    if (!file) {
      setFileName("");
      return;
    }
    const text = await fileToText(file);
    setContent(text);
    setFileName(file.name);
    setCustomId(
      customIdFromFilename(file.name, KIND_META[kind].customId),
    );
    setError(null);
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
        const body = {
          kind,
          containerTag: containerTag.trim(),
          customId: customId.trim() || undefined,
          taskType,
          dreaming,
          metadata,
          content:
            kind === "url" || kind === "pdf"
              ? undefined
              : content.trim() || undefined,
          url: kind === "url" ? url.trim() || undefined : undefined,
          pdfBase64: kind === "pdf" ? pdfBase64 || undefined : undefined,
        };

        if (kind === "pdf" && !pdfBase64) {
          setError("Choose a PDF file");
          return;
        }
        if (kind === "url" && !url.trim()) {
          setError("URL is required");
          return;
        }
        if (
          (kind === "markdown" || kind === "json" || kind === "svg_asset") &&
          !content.trim()
        ) {
          setError("Upload a file or paste content");
          return;
        }

        const res = await addDocument(body);
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
            Brand ingest
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
          <span className="text-sm text-[var(--muted)]">kind</span>
          <select
            value={kind}
            onChange={(e) => applyKind(e.target.value as IngestKind)}
            className="field text-sm"
          >
            {(Object.keys(KIND_META) as IngestKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_META[k].label}
              </option>
            ))}
          </select>
        </label>

        {kind === "pdf" ? (
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">PDF file</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => void handlePdfFile(e.target.files?.[0] ?? null)}
              className="field text-sm"
            />
            {fileName ? (
              <p className="font-mono text-xs text-[var(--muted)]">{fileName}</p>
            ) : null}
          </label>
        ) : null}

        {kind === "url" ? (
          <label className="block space-y-1.5">
            <span className="text-sm text-[var(--muted)]">url</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="field font-mono text-sm"
            />
          </label>
        ) : null}

        {kind === "markdown" || kind === "json" || kind === "svg_asset" ? (
          <>
            <label className="block space-y-1.5">
              <span className="text-sm text-[var(--muted)]">
                {kind === "markdown"
                  ? "Markdown / text file"
                  : kind === "json"
                    ? "JSON file"
                    : "SVG file"}
              </span>
              <input
                type="file"
                accept={textFileAccept}
                onChange={(e) =>
                  void handleTextFile(e.target.files?.[0] ?? null)
                }
                className="field text-sm"
              />
              {fileName ? (
                <p className="font-mono text-xs text-[var(--muted)]">
                  {fileName}
                </p>
              ) : null}
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm text-[var(--muted)]">
                {kind === "svg_asset"
                  ? "SVG markup (or paste)"
                  : "content (or paste)"}
              </span>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setFileName("");
                }}
                rows={kind === "svg_asset" ? 6 : 5}
                className="field resize-y font-mono text-sm"
                placeholder={
                  kind === "json" ? '{"colors":{…}}' : "Brand guidelines…"
                }
              />
            </label>
          </>
        ) : null}

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
          <span className="text-sm text-[var(--muted)]">metadata JSON</span>
          <textarea
            value={metadataText}
            onChange={(e) => setMetadataText(e.target.value)}
            rows={2}
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
