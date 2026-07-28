"use client";

import { AuthModal } from "@/components/auth/auth-modal";
import { SectionRule } from "@/components/landing/section-rule";
import { Button } from "@/components/ui/button";

export function GetStarted() {
  return (
    <section className="relative py-12 sm:py-16 md:py-20" id="get-started">
      <div className="sheet-pad">
        <div className="grid gap-10 md:grid-cols-2 md:items-end md:gap-12">
          <div className="space-y-4">
            <p className="text-label text-primary">Get started</p>
            <h2 className="text-title text-pretty">
              Turn your brand into a system
            </h2>
            <p className="text-body max-w-md text-pretty text-muted-foreground">
              Drop in what defines you. desin makes it callable — for every
              agent, app, and teammate.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <AuthModal>
              <Button className="h-11 w-full px-8 font-medium md:min-w-[180px] md:w-auto">
                Start free trial
              </Button>
            </AuthModal>
          </div>
        </div>
      </div>
      <SectionRule className="bottom-0" />
    </section>
  );
}
