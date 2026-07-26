import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import { MarkBrain } from "@/components/logo/marks";
import { cn } from "@/lib/utils";

const sizes = {
  sm: {
    mark: "size-4",
    gap: "gap-1.5",
    text: "text-[13px] font-medium tracking-tight",
  },
  md: {
    mark: "size-7",
    gap: "gap-1.5",
    text: "text-body font-medium tracking-tight",
  },
  lg: {
    mark: "size-8",
    gap: "gap-2.5",
    text: "text-title font-medium",
  },
} as const;

type BrandLogoProps = {
  size?: keyof typeof sizes;
  className?: string;
  /** Icon only - no wordmark. */
  markOnly?: boolean;
  /** Wrap in a link to `/` by default when `href` is set. Pass `false` to disable. */
  href?: string | false;
} & Omit<ComponentPropsWithoutRef<"span">, "children">;

export function BrandLogo({
  size = "md",
  className,
  markOnly = false,
  href = "/",
  ...props
}: BrandLogoProps) {
  const s = sizes[size];

  const content = (
    <span
      className={cn(
        "inline-flex items-center text-foreground",
        s.gap,
        className,
      )}
      {...props}
    >
      <MarkBrain className={cn("shrink-0", s.mark)} />
      {markOnly ? (
        <span className="sr-only">Desin</span>
      ) : (
        <span className={s.text}>Desin</span>
      )}
    </span>
  );

  if (href === false) {
    return content;
  }

  return (
    <Link
      className="inline-flex transition-opacity duration-300 ease-[var(--ease-swift)] hover:opacity-70"
      href={href}
    >
      {content}
    </Link>
  );
}
