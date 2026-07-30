"use client";

import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/logo/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const INTRO: Message = {
  id: "intro",
  role: "assistant",
  text: "Do you own a brand? I can help you set it up in desin.",
};

const OWN_BRAND_YES = "Yes, I own a brand";
const LAUNCHED_KEY = "desin.brand-owner-chip.launched";

function readLaunched(): boolean {
  try {
    return window.localStorage.getItem(LAUNCHED_KEY) === "1";
  } catch {
    return false;
  }
}

export function BrandOwnerChip() {
  const [open, setOpen] = useState(false);
  const [launched, setLaunched] = useState<boolean | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([INTRO]);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    setLaunched(readLaunched());
  }, []);

  function markLaunched() {
    setLaunched(true);
    try {
      window.localStorage.setItem(LAUNCHED_KEY, "1");
    } catch {
      // ignore unavailable storage
    }
  }

  function clearTimers() {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }

  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  }

  function updateScrollEdges() {
    const el = listRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 4);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 4);
  }

  useEffect(() => {
    if (!open) {
      setShowChat(false);
      return;
    }

    const timer = window.setTimeout(() => setShowChat(true), 220);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!showChat) return;
    inputRef.current?.focus();
  }, [showChat]);

  useEffect(() => {
    if (!showChat) return;
    const el = listRef.current;
    if (!el) return;

    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    const timer = window.setTimeout(updateScrollEdges, 320);
    updateScrollEdges();
    return () => window.clearTimeout(timer);
  }, [messages, showChat]);

  useEffect(() => () => clearTimers(), []);

  function close() {
    clearTimers();
    setOpen(false);
    setInput("");
    markLaunched();
    setCanScrollUp(false);
    setCanScrollDown(false);
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    schedule(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: replyTo(trimmed),
        },
      ]);
    }, 450);
  }

  function openChat() {
    clearTimers();
    setOpen(true);

    if (!launched) {
      setMessages([INTRO]);
      schedule(() => send(OWN_BRAND_YES), 350);
      markLaunched();
    }
  }

  if (launched === null) return null;

  return (
    <div
      className={cn(
        "fixed right-4 bottom-4 z-50 flex flex-col overflow-hidden border transition-[width,height,background-color,border-color,color] duration-500 ease-[var(--ease-swift)] md:right-6 md:bottom-6",
        open
          ? "h-[min(32rem,calc(100svh-2rem))] w-[min(22rem,calc(100vw-2rem))] border-border bg-sheet text-foreground"
          : launched
            ? "size-10 border-transparent bg-primary text-white"
            : "h-10 w-[11.5rem] border-transparent bg-primary text-white",
      )}
      style={{ transformOrigin: "bottom right" }}
    >
      {!open ? (
        <button
          aria-expanded={false}
          aria-label={launched ? "Open chat" : "Do you own a brand?"}
          className={cn(
            "flex size-full cursor-pointer items-center justify-center font-medium transition-colors duration-300 ease-[var(--ease-swift)] hover:bg-primary/85",
            launched ? "px-0" : "px-3 text-[15px]",
          )}
          onClick={openChat}
          type="button"
        >
          {launched ? <ChatIcon /> : "Do you own a brand?"}
        </button>
      ) : (
        <>
          <header className="flex h-11 shrink-0 items-center justify-between px-3">
            <BrandLogo href={false} size="md" />
            <button
              aria-label="Close chat"
              className="inline-flex size-8 cursor-pointer items-center justify-center text-muted-foreground transition-colors duration-300 ease-[var(--ease-swift)] hover:text-foreground"
              onClick={close}
              type="button"
            >
              <CloseIcon />
            </button>
          </header>

          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col transition-opacity duration-300 ease-[var(--ease-swift)]",
              showChat ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="relative min-h-0 flex-1">
              <div
                className="h-full space-y-3 overflow-y-auto overscroll-contain px-3 pt-1 pb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onScroll={updateScrollEdges}
                ref={listRef}
              >
                {messages.map((message) => (
                  <div
                    className={cn(
                      "flex",
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start",
                    )}
                    key={message.id}
                  >
                    <p
                      className={cn(
                        "max-w-[85%] px-3 py-2 text-body text-pretty",
                        message.role === "user"
                          ? "bg-primary text-white"
                          : "bg-background-50 text-foreground",
                      )}
                    >
                      {message.text}
                    </p>
                  </div>
                ))}
              </div>

              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-sheet to-transparent transition-opacity duration-300 ease-[var(--ease-swift)]",
                  canScrollUp ? "opacity-100" : "opacity-0",
                )}
              />
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-sheet to-transparent transition-opacity duration-300 ease-[var(--ease-swift)]",
                  canScrollDown ? "opacity-100" : "opacity-0",
                )}
              />
            </div>

            <div className="relative z-10 shrink-0 bg-sheet px-3 pt-1 pb-3">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  send(input);
                }}
              >
                <input
                  className="h-10 min-w-0 flex-1 bg-background-50 px-3 text-body text-foreground outline-none transition-colors duration-300 ease-[var(--ease-swift)] placeholder:text-muted-foreground focus:bg-background-100"
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type a message…"
                  ref={inputRef}
                  value={input}
                />
                <Button className="h-10 shrink-0 px-4" type="submit">
                  Send
                </Button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function replyTo(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("yes") || lower.includes("own")) {
    return "Great. Paste your website URL and I’ll start setting up your brand kit.";
  }

  if (lower.includes("not") || lower.includes("no")) {
    return "No problem. Explore the page, or come back when you have a brand to load in.";
  }

  if (/https?:\/\//.test(lower) || lower.includes(".com") || lower.includes(".ai")) {
    return "Got it. Head to Setup to finish onboarding that brand — or keep chatting here.";
  }

  return "Tell me your brand’s website and I’ll help you set it up.";
}

function CloseIcon() {
  return (
    <svg
      aria-hidden
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.75"
      viewBox="0 0 16 16"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function ChatIcon() {
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
      <path d="M3.5 3.5h9a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7l-2.5 2.5V10.5h-1a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
