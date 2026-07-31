"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, File as FileIcon, Microphone, Plus, X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ChatAttachment = {
  id: string;
  file: File;
  previewUrl: string | null;
};

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  attachments?: {
    id: string;
    name: string;
    type: string;
    previewUrl: string | null;
  }[];
};

const INTRO: ChatMessage = {
  id: "intro",
  role: "assistant",
  text: "What should we make? Try “LinkedIn post about our launch” or “hero image for the homepage.”",
};

const ACCEPT =
  "image/*,.pdf,.txt,.md,.doc,.docx,.csv,.json,.svg,.png,.jpg,.jpeg,.webp,.gif";

type WorkspaceChatProps = {
  brandName: string;
};

export function WorkspaceChat({ brandName }: WorkspaceChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);
  const attachmentsRef = useRef(attachments);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(
    () => () => {
      for (const id of timersRef.current) window.clearTimeout(id);
      for (const item of attachmentsRef.current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    },
    [],
  );

  function schedule(fn: () => void, ms: number) {
    const id = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    timersRef.current.push(id);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function onFilesSelected(fileList: FileList | null) {
    if (!fileList?.length) return;

    const next: ChatAttachment[] = Array.from(fileList).map((file) => ({
      id: `file-${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));

    setAttachments((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    inputRef.current?.focus();
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  function send(raw: string) {
    const text = raw.trim();
    if ((!text && attachments.length === 0) || pending) return;

    const messageAttachments = attachments.map((item) => ({
      id: item.id,
      name: item.file.name,
      type: item.file.type,
      previewUrl: item.previewUrl,
    }));

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      attachments: messageAttachments.length ? messageAttachments : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setPending(true);

    schedule(() => {
      const reply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: mockReply(text, brandName, messageAttachments),
      };
      setMessages((prev) => [...prev, reply]);
      setPending(false);
      inputRef.current?.focus();
    }, 650 + Math.random() * 450);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  }

  const hasText = input.trim().length > 0;
  const canSend = hasText || attachments.length > 0;

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      <div className="flex h-14 shrink-0 items-center px-5">
        <p className="text-sm font-medium text-foreground">Chat</p>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          className="h-full space-y-3 overflow-y-auto overscroll-contain px-3 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={listRef}
        >
          {messages.map((message) => (
            <div
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
              key={message.id}
            >
              <div
                className={cn(
                  "flex max-w-[90%] flex-col gap-2 rounded px-3 py-2 text-sm text-pretty leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-white"
                    : "bg-background-100 text-foreground",
                )}
              >
                {message.attachments?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {message.attachments.map((item) =>
                      item.previewUrl ? (
                        <img
                          alt={item.name}
                          className="h-16 w-16 rounded object-cover"
                          key={item.id}
                          src={item.previewUrl}
                        />
                      ) : (
                        <span
                          className={cn(
                            "inline-flex max-w-full items-center gap-1.5 rounded px-2 py-1 text-xs",
                            message.role === "user"
                              ? "bg-white/15"
                              : "bg-background-200",
                          )}
                          key={item.id}
                        >
                          <FileIcon size={12} weight="bold" />
                          <span className="truncate">{item.name}</span>
                        </span>
                      ),
                    )}
                  </div>
                ) : null}
                {message.text ? (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                ) : null}
              </div>
            </div>
          ))}
          {pending ? (
            <div className="flex justify-start">
              <p className="rounded bg-background-100 px-3 py-2 text-sm text-muted-foreground">
                Thinking…
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 px-3 pb-3">
        <form
          className="rounded bg-background-50"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          {attachments.length > 0 ? (
            <div className="flex gap-1.5 overflow-x-auto overscroll-contain px-2.5 pt-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {attachments.map((item) => (
                <div
                  className="relative flex shrink-0 items-center gap-1.5 rounded bg-background-100 px-1.5 py-1"
                  key={item.id}
                >
                  {item.previewUrl ? (
                    <img
                      alt=""
                      className="size-7 shrink-0 rounded object-cover"
                      src={item.previewUrl}
                    />
                  ) : (
                    <span className="flex size-7 shrink-0 items-center justify-center rounded bg-background-200 text-muted-foreground">
                      <FileIcon size={14} weight="bold" />
                    </span>
                  )}
                  <span className="max-w-28 truncate text-xs text-foreground">
                    {item.file.name}
                  </span>
                  <button
                    aria-label={`Remove ${item.file.name}`}
                    className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background-200 hover:text-foreground"
                    onClick={() => removeAttachment(item.id)}
                    type="button"
                  >
                    <X size={12} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <textarea
            className="max-h-32 min-h-10 w-full resize-none bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            disabled={pending}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message desin…"
            ref={inputRef}
            rows={2}
            value={input}
          />
          <div className="flex items-center justify-between gap-2.5 px-2.5 pb-2.5">
            <input
              accept={ACCEPT}
              className="sr-only"
              multiple
              onChange={(event) => onFilesSelected(event.target.files)}
              ref={fileInputRef}
              type="file"
            />
            <Button
              aria-label="Upload attachments"
              className="size-7 shrink-0 rounded"
              disabled={pending}
              onClick={openFilePicker}
              size="icon"
              type="button"
              variant="secondary"
            >
              <Plus size={14} weight="bold" />
            </Button>
            <div className="flex items-center gap-2.5">
              {canSend ? (
                <button
                  aria-label="Voice input"
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center text-foreground outline-none transition-opacity hover:opacity-70 focus-visible:opacity-70 disabled:pointer-events-none disabled:opacity-50"
                  disabled={pending}
                  type="button"
                >
                  <Microphone size={16} weight="fill" />
                </button>
              ) : null}
              <Button
                aria-label={canSend ? "Send message" : "Voice input"}
                className="size-7 shrink-0 rounded [&_svg]:text-white"
                disabled={pending}
                size="icon"
                type={canSend ? "submit" : "button"}
              >
                {canSend ? (
                  <ArrowUp size={14} weight="bold" />
                ) : (
                  <Microphone size={14} weight="fill" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function mockReply(
  text: string,
  brandName: string,
  attachments: { name: string; type: string }[],
): string {
  if (attachments.length > 0) {
    const names = attachments.map((item) => item.name).join(", ");
    const imageCount = attachments.filter((item) =>
      item.type.startsWith("image/"),
    ).length;
    if (imageCount > 0) {
      return `Got ${imageCount === 1 ? "your image" : `${imageCount} images`} (${names}). I’ll use ${imageCount === 1 ? "it" : "them"} as reference for ${brandName}${text ? ` — “${text.slice(0, 60)}${text.length > 60 ? "…" : ""}”` : ""}. Frontend-only for now.`;
    }
    return `Attached ${names}. I’ll keep ${attachments.length === 1 ? "that file" : "those files"} in context for ${brandName}${text ? `: “${text.slice(0, 60)}${text.length > 60 ? "…" : ""}”` : ""}. Upload is local-only until storage is wired.`;
  }

  const lower = text.toLowerCase();

  if (
    lower.includes("image") ||
    lower.includes("hero") ||
    lower.includes("visual") ||
    lower.includes("poster")
  ) {
    return `Drafting an on-brand visual for ${brandName}. Check the canvas — this is a frontend preview until generation is wired up.`;
  }

  if (
    lower.includes("post") ||
    lower.includes("linkedin") ||
    lower.includes("tweet") ||
    lower.includes("caption") ||
    lower.includes("copy")
  ) {
    return `Here’s a draft for ${brandName}:\n\n“We’re shipping something small but sharp. Same voice, cleaner output — built once, used everywhere.”\n\nWant a tighter or longer version?`;
  }

  if (lower.includes("color") || lower.includes("palette")) {
    return `I can lock colors in Brand kit. For now, describe the vibe (warm, minimal, bold) and I’ll keep drafts in that lane.`;
  }

  if (lower.includes("logo")) {
    return `Logo work lives in Brand kit → Logos. Tell me what to generate around the mark and I’ll stage it on the canvas.`;
  }

  return `Got it — “${text.slice(0, 80)}${text.length > 80 ? "…" : ""}”. I’ve staged a create card on the canvas. Frontend-only for now; say what to refine.`;
}
