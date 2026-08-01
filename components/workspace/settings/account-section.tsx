"use client";

import { Button } from "@/components/ui/button";

type AccountSectionProps = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  };
  onSignOut: () => void;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="rounded bg-background-100 px-3 py-2.5 text-sm text-foreground">
        {value}
      </div>
    </div>
  );
}

export function AccountSection({ user, onSignOut }: AccountSectionProps) {
  const displayName = user.name?.trim() || user.email;
  const initials = (displayName?.[0] ?? "U").toUpperCase();

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl">
        Account
      </h2>

      <div className="mt-6 flex flex-col gap-4">
        {user.image ? (
          <img
            alt=""
            className="size-12 shrink-0 rounded object-cover"
            src={user.image}
          />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded bg-background-300 text-sm font-medium text-foreground">
            {initials}
          </span>
        )}

        <Field label="Name" value={displayName} />
        <Field label="Email" value={user.email} />

        <div>
          <Button onClick={onSignOut} type="button" variant="secondary">
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
