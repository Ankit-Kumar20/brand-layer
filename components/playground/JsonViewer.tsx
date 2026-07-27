"use client";

import { useState } from "react";

export function JsonViewer({
  label = "Raw response",
  data,
}: {
  label?: string;
  data: unknown;
}) {
  const [open, setOpen] = useState(false);
  if (data === undefined) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="font-mono text-xs text-[var(--muted)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
      >
        {open ? "Hide" : "Show"} {label}
      </button>
      {open ? (
        <pre className="mt-2 max-h-64 overflow-auto rounded border border-[var(--line)] bg-[var(--panel-2)] p-3 font-mono text-[11px] leading-relaxed text-[var(--ink)]">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
