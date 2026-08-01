"use client";

import { useEffect, type ReactNode } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useQueryState } from "nuqs";

import { AccountSection } from "@/components/workspace/settings/account-section";
import { ApiKeysSection } from "@/components/workspace/settings/api-keys-section";
import { BillingSection } from "@/components/workspace/settings/billing-section";
import { BrandsSection } from "@/components/workspace/settings/brands-section";
import { ByokSection } from "@/components/workspace/settings/byok-section";
import { ConnectSection } from "@/components/workspace/settings/connect-section";
import { TeamSection } from "@/components/workspace/settings/team-section";
import { cn } from "@/lib/utils";
import {
  settingsSections,
  workspaceSearchParams,
  type SettingsSectionId,
} from "@/lib/workspace/search-params";

const SETTINGS_NAV = [
  { id: "account", label: "Account" },
  { id: "brands", label: "Brands" },
  { id: "api-keys", label: "API keys" },
  { id: "connect", label: "Connect" },
  { id: "team", label: "Team" },
  { id: "byok", label: "BYOK" },
  { id: "billing", label: "Plan & billing" },
] as const satisfies ReadonlyArray<{ id: SettingsSectionId; label: string }>;

type SettingsPanelProps = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  };
  onSignOut: () => void;
  onAddBrand?: () => void;
};

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

export function SettingsPanel({
  user,
  onSignOut,
  onAddBrand,
}: SettingsPanelProps) {
  const [section, setSection] = useQueryState(
    "settings",
    workspaceSearchParams.settings.withOptions({ history: "push" }),
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      event.preventDefault();
      const currentIndex = settingsSections.indexOf(section);
      if (currentIndex < 0) return;

      let next: SettingsSectionId | null = null;
      if (event.key === "ArrowLeft" && currentIndex > 0) {
        next = settingsSections[currentIndex - 1];
      } else if (
        event.key === "ArrowRight" &&
        currentIndex < settingsSections.length - 1
      ) {
        next = settingsSections[currentIndex + 1];
      }
      if (!next) return;

      void setSection(next);
      // Drop focus from the last clicked nav item so :focus-visible
      // doesn't leave an orange ring on a non-active section.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [section, setSection]);

  const sections: Record<SettingsSectionId, ReactNode> = {
    account: <AccountSection onSignOut={onSignOut} user={user} />,
    brands: <BrandsSection onAddBrand={onAddBrand} />,
    "api-keys": <ApiKeysSection />,
    connect: <ConnectSection />,
    team: <TeamSection user={user} />,
    byok: <ByokSection />,
    billing: <BillingSection />,
  };

  return (
    <div className="relative flex h-full min-h-0 w-full gap-8">
      <nav
        aria-label="Settings"
        className="flex w-44 shrink-0 flex-col gap-0.5"
      >
        {SETTINGS_NAV.map((item) => (
          <button
            className={cn(
              "flex h-9 w-full cursor-pointer items-center rounded px-3 text-left text-sm text-foreground/80 transition-colors",
              "hover:bg-background-100 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              section === item.id && "bg-background-100 text-foreground",
            )}
            key={item.id}
            onClick={() => void setSection(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto pb-14">
        <div className="max-w-lg">{sections[section]}</div>
      </div>

      <div className="pointer-events-none absolute right-0 bottom-0 flex items-center gap-2">
        <span className="flex items-center gap-1 text-muted-foreground">
          <kbd className="flex size-6 items-center justify-center rounded bg-background-100">
            <CaretLeft className="size-3.5" weight="bold" />
          </kbd>
          <kbd className="flex size-6 items-center justify-center rounded bg-background-100">
            <CaretRight className="size-3.5" weight="bold" />
          </kbd>
        </span>
        <span className="text-xs text-muted-foreground">to navigate</span>
      </div>
    </div>
  );
}
