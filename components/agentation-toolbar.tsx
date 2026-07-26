"use client";

import { Agentation } from "agentation";
import { useEffect, useState } from "react";

/** Dev-only toolbar - mount after hydration to avoid SSR attribute mismatches. */
export function AgentationToolbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Agentation />;
}
