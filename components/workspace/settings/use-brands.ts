"use client";

import { useCallback, useEffect, useState } from "react";

import type { WorkspaceBrand } from "@/components/workspace/settings/types";

export function useBrands() {
  const [brands, setBrands] = useState<WorkspaceBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/brands", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as {
        brands?: WorkspaceBrand[];
        error?: string;
        detail?: string;
      };
      if (!res.ok) {
        setError(data.detail || data.error || `HTTP ${res.status}`);
        setBrands([]);
        return;
      }
      setBrands(data.brands ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brands");
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { brands, loading, error, reload };
}
