"use client";

import { Agentation } from "agentation";
import { useEffect, useState } from "react";

/** Dev-only toolbar - mount after hydration to avoid SSR attribute mismatches. */
export function AgentationToolbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Keep Agentation above app chrome and dialogs. */}
      <style>{`
        [data-agentation-toolbar],
        [data-feedback-toolbar],
        [data-agentation-settings-panel],
        [data-agentation-palette],
        [data-annotation-marker],
        [data-annotation-popup],
        [data-design-placement],
        [data-rearrange-section] {
          z-index: 2147483000 !important;
        }
      `}</style>
      <Agentation className="!z-[2147483000]" />
    </>
  );
}
