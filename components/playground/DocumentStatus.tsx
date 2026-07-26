"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  getDocument,
  type DocumentStatus,
} from "@/lib/playground/api-client";
import { JsonViewer } from "./JsonViewer";

const TERMINAL = new Set(["done", "failed", "error"]);

export function DocumentStatusPanel({ documentId }: { documentId: string }) {
  const [doc, setDoc] = useState<DocumentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [stuckQueued, setStuckQueued] = useState(false);
  const alive = useRef(true);
  const queuedStarted = useRef<number | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!documentId) {
      setDoc(null);
      setError(null);
      setPolling(false);
      setStuckQueued(false);
      queuedStarted.current = null;
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stuckTimer: ReturnType<typeof setTimeout> | undefined;
    queuedStarted.current = null;
    setStuckQueued(false);

    async function tick() {
      setPolling(true);
      try {
        const next = await getDocument(documentId);
        if (cancelled || !alive.current) return;
        setDoc(next);
        setError(null);

        if (next.status === "queued") {
          if (queuedStarted.current === null) {
            queuedStarted.current = Date.now();
            stuckTimer = setTimeout(() => {
              if (!cancelled && alive.current && queuedStarted.current) {
                setStuckQueued(true);
              }
            }, 8000);
          }
        } else {
          queuedStarted.current = null;
          setStuckQueued(false);
          if (stuckTimer) clearTimeout(stuckTimer);
        }

        if (!TERMINAL.has(next.status)) {
          timer = setTimeout(tick, 2000);
        } else {
          setPolling(false);
        }
      } catch (err) {
        if (cancelled || !alive.current) return;
        setError(err instanceof ApiError ? err.message : "Poll failed");
        setPolling(false);
        timer = setTimeout(tick, 4000);
      }
    }

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (stuckTimer) clearTimeout(stuckTimer);
    };
  }, [documentId]);

  if (!documentId) return null;

  return (
    <div className="mt-5 space-y-3 border-t border-[var(--line)] pt-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold">Document status</h3>
        {doc ? (
          <StatusChip status={doc.status} pulsing={polling && !TERMINAL.has(doc.status)} />
        ) : (
          <span className="font-mono text-xs text-[var(--muted)]">
            {polling ? "polling…" : "—"}
          </span>
        )}
        <span className="font-mono text-xs text-[var(--muted)]">{documentId}</span>
      </div>

      {stuckQueued ? (
        <p className="rounded border border-[var(--warn-line)] bg-[var(--warn-bg)] px-3 py-2 text-sm text-[var(--warn)]">
          Still queued — is <code className="font-mono">bun run worker</code>{" "}
          running?
        </p>
      ) : null}

      {doc ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <Stat label="chunks" value={doc.chunkCount ?? "—"} />
          <Stat label="type" value={doc.type} />
          <Stat label="task" value={doc.taskType} />
          <Stat label="dreaming" value={doc.dreaming} />
        </dl>
      ) : null}

      {doc?.error ? (
        <p className="text-sm text-[var(--bad)]">{doc.error}</p>
      ) : null}
      {error ? <p className="text-sm text-[var(--bad)]">{error}</p> : null}

      <JsonViewer data={doc} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="font-mono text-sm">{value}</dd>
    </div>
  );
}

function StatusChip({
  status,
  pulsing,
}: {
  status: string;
  pulsing: boolean;
}) {
  const tone =
    status === "done"
      ? "text-[var(--ok)]"
      : status === "failed" || status === "error"
        ? "text-[var(--bad)]"
        : "text-[var(--accent)]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs ${tone} ${pulsing ? "animate-pulse" : ""}`}
    >
      <span className="inline-block size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
