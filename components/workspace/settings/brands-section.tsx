"use client";

import {
  HomepageToolIcon,
  homepageTools,
} from "@/components/landing/integrations";
import { Button } from "@/components/ui/button";

type BrandsSectionProps = {
  onAddBrand?: () => void;
};

export function BrandsSection({ onAddBrand }: BrandsSectionProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
          Brands
        </h2>
        {onAddBrand ? (
          <Button
            onClick={onAddBrand}
            size="sm"
            type="button"
            variant="secondary"
          >
            Add brand
          </Button>
        ) : null}
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-2">
        {homepageTools.map((brand) => (
          <li key={brand.id}>
            <div className="group flex items-center gap-3 rounded px-2 py-2 transition-colors duration-300 ease-[var(--ease-swift)] hover:bg-background-100">
              <span className="flex size-10 shrink-0 items-center justify-center rounded bg-background-100 transition-colors duration-300 ease-[var(--ease-swift)] group-hover:bg-background-200">
                <HomepageToolIcon className="size-5" id={brand.id} />
              </span>
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {brand.name}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
