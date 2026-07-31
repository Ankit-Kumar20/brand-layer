"use client";

import {
  useEffect,
  useId,
  type ReactNode,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  descriptionClassName?: string;
  children: ReactNode;
  className?: string;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  descriptionClassName,
  children,
  className,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  function handleClose() {
    onOpenChange(false);
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  return createPortal(
    <div
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
    >
      <div
        className={cn(
          "flex w-full max-w-md flex-col gap-6 border border-dashed border-primary bg-background p-6 text-foreground sm:p-8",
          "rounded-[2px]",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h2 className="font-display text-xl leading-snug" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p
                className={cn(
                  "text-pretty text-muted-foreground text-sm",
                  descriptionClassName,
                )}
                id={descriptionId}
              >
                {description}
              </p>
            ) : null}
          </div>
          <Button
            aria-label="Close"
            className="shrink-0 border-transparent hover:border-transparent hover:bg-transparent"
            onClick={handleClose}
            size="icon-small"
            type="button"
            variant="ghost"
          >
            <X />
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
