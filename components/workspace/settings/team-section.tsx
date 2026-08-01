"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";

type TeamSectionProps = {
  user: {
    email: string;
    name: string;
  };
};

export function TeamSection({ user }: TeamSectionProps) {
  const displayName = user.name?.trim() || user.email;
  const [email, setEmail] = useState("");
  const canInvite = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!canInvite) return;
    setEmail("");
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        Team
      </h2>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Workspace</span>
          <div className="flex items-center justify-between gap-3 rounded bg-background-100 px-3 py-2.5">
            <span className="text-sm text-foreground">Personal</span>
            <span className="text-xs text-muted-foreground">BYOK</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">Members</span>
          <div className="flex items-center justify-between gap-3 rounded bg-background-100 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">Owner</span>
          </div>
        </div>

        <form className="flex flex-col gap-1.5" onSubmit={handleInvite}>
          <span className="text-xs text-muted-foreground">Invite</span>
          <div className="flex gap-2">
            <input
              className="h-9 min-w-0 flex-1 rounded bg-background-100 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:bg-background-200"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@company.com"
              type="email"
              value={email}
            />
            <Button disabled={!canInvite} type="submit" variant="secondary">
              Invite
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
