"use client";

import {
  lazy,
  Suspense,
  useState,
  type ComponentType,
  type LazyExoticComponent,
} from "react";

import { heroIllustrationLoaders } from "@/components/landing/hero-illustration/loaders";
import {
  HERO_ILLUSTRATION,
  HERO_ILLUSTRATION_ORDER,
  heroIllustrationMeta,
  type HeroIllustrationId,
} from "@/components/landing/hero-illustration/variants";

function shiftVariant(current: HeroIllustrationId, delta: number) {
  const order = HERO_ILLUSTRATION_ORDER;
  const index = order.indexOf(current);
  const next = (index + delta + order.length) % order.length;
  return order[next]!;
}

const lazyHeroIllustrations = Object.fromEntries(
  HERO_ILLUSTRATION_ORDER.map((id) => [
    id,
    lazy(async () => {
      const Component = await heroIllustrationLoaders[id]();
      return { default: Component };
    }),
  ]),
) as Record<HeroIllustrationId, LazyExoticComponent<ComponentType>>;

/** Renders a gallery switcher for testing other variants. */
export function HeroIllustrationGallery() {
  const [active, setActive] = useState<HeroIllustrationId>(HERO_ILLUSTRATION);
  const Component = lazyHeroIllustrations[active];
  const { label } = heroIllustrationMeta[active];
  const index = HERO_ILLUSTRATION_ORDER.indexOf(active) + 1;
  const total = HERO_ILLUSTRATION_ORDER.length;

  return (
    <div className="relative mx-auto w-full max-w-md pb-12 pt-20">
      <div className="mb-6 text-center">
        <h2 className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Illustration Gallery
        </h2>
      </div>

      <div className="rounded-xl border border-border bg-background-50 p-6 shadow-sm">
        <Suspense
          fallback={
            <div className="flex min-h-[240px] items-center justify-center font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
              Loading
            </div>
          }
        >
          <Component />
        </Suspense>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          aria-label="Previous illustration"
          className="inline-flex size-10 items-center justify-center rounded border border-border bg-sheet text-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:bg-background-100"
          onClick={() => setActive((id) => shiftVariant(id, -1))}
          type="button"
        >
          <Chevron direction="left" />
        </button>

        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          {label}
          <span className="mx-2 text-background-500">·</span>
          {index}/{total}
        </p>

        <button
          aria-label="Next illustration"
          className="inline-flex size-10 items-center justify-center rounded border border-border bg-sheet text-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:bg-background-100"
          onClick={() => setActive((id) => shiftVariant(id, 1))}
          type="button"
        >
          <Chevron direction="right" />
        </button>
      </div>
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 16 16"
    >
      {direction === "left" ? (
        <path d="M10 3.5 5.5 8 10 12.5" />
      ) : (
        <path d="M6 3.5 10.5 8 6 12.5" />
      )}
    </svg>
  );
}
