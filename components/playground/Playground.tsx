"use client";

import { useEffect, useState } from "react";
import { IngestPanel } from "./IngestPanel";
import { McpConnectPanel } from "./McpConnectPanel";
import { ProfilePanel } from "./ProfilePanel";
import { SearchPanel } from "./SearchPanel";
import {
  loadContainerTag,
  loadLastDocumentId,
  saveContainerTag,
  saveLastDocumentId,
} from "@/lib/playground/storage";

export function Playground() {
  const [containerTag, setContainerTag] = useState("brand_trybloom");
  const [documentId, setDocumentId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setContainerTag(loadContainerTag());
    setDocumentId(loadLastDocumentId());
    setReady(true);
  }, []);

  function handleContainerTagChange(value: string) {
    setContainerTag(value);
    saveContainerTag(value);
  }

  function handleDocumentId(id: string) {
    setDocumentId(id);
    saveLastDocumentId(id);
  }

  if (!ready) {
    return (
      <div className="playground-shell">
        <div className="mx-auto max-w-3xl px-5 py-16 font-mono text-sm text-[var(--muted)]">
          Loading playground…
        </div>
      </div>
    );
  }

  return (
    <div className="playground-shell">
      <header className="border-b border-[var(--line)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 sm:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            brand-layer
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            Brand memory playground
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
            Ingest markdown, PDF, JSON tokens, web URLs, or SVG logos — then
            search, answer, or load the brand profile. Keep{" "}
            <code className="font-mono text-[var(--ink)]">bun run trigger:dev</code>{" "}
            running alongside the app.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-5 py-10 sm:px-8">
        <div className="panel">
          <label className="mb-6 block max-w-md space-y-1.5">
            <span className="text-sm text-[var(--muted)]">
              brandId / containerTag
            </span>
            <input
              type="text"
              value={containerTag}
              onChange={(e) => handleContainerTagChange(e.target.value)}
              placeholder="brand_trybloom"
              className="field font-mono text-sm"
            />
          </label>
          <IngestPanel
            containerTag={containerTag}
            documentId={documentId}
            onDocumentId={handleDocumentId}
          />
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="panel">
            <SearchPanel containerTag={containerTag} />
          </div>
          <div className="panel">
            <ProfilePanel containerTag={containerTag} />
          </div>
        </div>

        <McpConnectPanel containerTag={containerTag} />
      </main>
    </div>
  );
}
