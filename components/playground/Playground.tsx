"use client";

import { useEffect, useState } from "react";
import { IngestPanel } from "./IngestPanel";
import { ProfilePanel } from "./ProfilePanel";
import { SearchPanel } from "./SearchPanel";
import {
  loadContainerTag,
  loadLastDocumentId,
  saveContainerTag,
  saveLastDocumentId,
} from "@/lib/playground/storage";

export function Playground() {
  const [containerTag, setContainerTag] = useState("user_alex");
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
            Memory playground
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
            Queue a document, wait for{" "}
            <code className="font-mono text-[var(--ink)]">done</code>, then
            search or load the profile.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-5 py-10 sm:px-8">
        <div className="panel">
          <label className="mb-6 block max-w-md space-y-1.5">
            <span className="text-sm text-[var(--muted)]">containerTag</span>
            <input
              type="text"
              value={containerTag}
              onChange={(e) => handleContainerTagChange(e.target.value)}
              placeholder="user_alex"
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
      </main>
    </div>
  );
}
