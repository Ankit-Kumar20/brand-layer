"use client";

import dynamic from "next/dynamic";

const BrandBrain3D = dynamic(
  () =>
    import("@/components/logo/brand-brain-3d").then((m) => m.BrandBrain3D),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="aspect-square max-h-[min(70svh,28rem)] w-full animate-pulse bg-chrome sm:aspect-[4/3] sm:max-h-none"
      />
    ),
  },
);

export function BrandBrain3DLazy() {
  return <BrandBrain3D />;
}
