"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function BillingSection() {
  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        Plan & billing
      </h2>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Current plan</span>
          <div className="flex items-baseline justify-between gap-3 rounded bg-background-100 px-3 py-2.5">
            <span className="text-sm font-medium text-foreground">BYOK</span>
            <span className="text-sm text-muted-foreground">$19/mo</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Payment method</span>
          <div className="rounded bg-background-100 px-3 py-2.5 text-sm text-muted-foreground">
            None on file
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Invoices</span>
          <div className="rounded bg-background-100 px-3 py-2.5 text-sm text-muted-foreground">
            No invoices yet
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled type="button">
            Upgrade to Pro
          </Button>
          <Button asChild type="button" variant="secondary">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
