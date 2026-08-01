"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  HomepageToolIcon,
  homepageTools,
  type HomepageToolId,
} from "@/components/landing/integrations";
import { AddBrandPanel } from "@/components/workspace/add-brand-panel";
import { WorkspaceChat } from "@/components/workspace/workspace-chat";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type WorkspaceShellProps = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  };
};

type Team = {
  id: string;
  name: string;
  plan: string;
  brands: Brand[];
};

type Brand = {
  id: HomepageToolId;
  name: string;
};

const homepageBrands: Brand[] = homepageTools.map((tool) => ({
  id: tool.id,
  name: tool.name,
}));

const TEAMS: Team[] = [
  {
    id: "personal",
    name: "Personal",
    plan: "BYOK",
    brands: homepageBrands,
  },
  {
    id: "studio",
    name: "Studio",
    plan: "Pro",
    brands: homepageBrands,
  },
  {
    id: "agency",
    name: "Agency",
    plan: "Pro",
    brands: homepageBrands,
  },
  {
    id: "desin-hq",
    name: "desin HQ",
    plan: "Pro",
    brands: homepageBrands,
  },
];

const primaryNav = [
  { id: "create", label: "Create" },
  { id: "library", label: "Library" },
  { id: "kit", label: "Brand kit" },
  { id: "connect", label: "Connect" },
] as const;

type PrimaryNavId =
  | (typeof primaryNav)[number]["id"]
  | "settings"
  | "add-brand";

const PAGE_TITLES: Record<PrimaryNavId, string> = {
  create: "Create",
  library: "Library",
  kit: "Brand kit",
  connect: "Connect",
  settings: "Settings",
  "add-brand": "Add brand",
};

const CHAT_WIDTH_DEFAULT = 320;
const CHAT_WIDTH_MIN = 280;
const CHAT_WIDTH_MAX = 560;
const CHAT_WIDTH_STORAGE_KEY = "desin.workspace.chatWidth";

function clampChatWidth(width: number) {
  return Math.min(CHAT_WIDTH_MAX, Math.max(CHAT_WIDTH_MIN, Math.round(width)));
}

function readStoredChatWidth() {
  if (typeof window === "undefined") return CHAT_WIDTH_DEFAULT;
  const raw = window.localStorage.getItem(CHAT_WIDTH_STORAGE_KEY);
  if (!raw) return CHAT_WIDTH_DEFAULT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return CHAT_WIDTH_DEFAULT;
  return clampChatWidth(parsed);
}

export function WorkspaceShell({ user }: WorkspaceShellProps) {
  const [view, setView] = useState<PrimaryNavId>("create");
  const [teamId, setTeamId] = useState(TEAMS[0].id);
  const [brandId, setBrandId] = useState(TEAMS[0].brands[0].id);
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chatWidth, setChatWidth] = useState(CHAT_WIDTH_DEFAULT);
  const [resizingChat, setResizingChat] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const teamTriggerRef = useRef<HTMLButtonElement>(null);
  const brandTriggerRef = useRef<HTMLButtonElement>(null);
  const userTriggerRef = useRef<HTMLButtonElement>(null);
  const chatPanelRef = useRef<HTMLElement>(null);
  const chatWidthRef = useRef(chatWidth);

  const team = TEAMS.find((item) => item.id === teamId) ?? TEAMS[0];
  const brand =
    team.brands.find((item) => item.id === brandId) ?? team.brands[0];
  const brandName = brand.name;

  const filteredNav = primaryNav.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const chatOpen = view === "create";
  const addingBrand = view === "add-brand";
  const displayName = user.name?.trim().split(/\s+/)[0] || user.email;
  const initials = (displayName?.[0] ?? "U").toUpperCase();

  useEffect(() => {
    setChatWidth(readStoredChatWidth());
  }, []);

  useEffect(() => {
    chatWidthRef.current = chatWidth;
  }, [chatWidth]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() === "f" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!resizingChat) return;

    function onPointerMove(event: PointerEvent) {
      const panel = chatPanelRef.current;
      if (!panel) return;
      const next = clampChatWidth(
        panel.getBoundingClientRect().right - event.clientX,
      );
      setChatWidth(next);
      chatWidthRef.current = next;
    }

    function onPointerUp() {
      setResizingChat(false);
      window.localStorage.setItem(
        CHAT_WIDTH_STORAGE_KEY,
        String(chatWidthRef.current),
      );
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [resizingChat]);

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/";
  }

  function selectTeam(nextTeamId: string) {
    const next = TEAMS.find((item) => item.id === nextTeamId);
    if (!next) return;
    setTeamId(next.id);
    setBrandId(next.brands[0]?.id ?? "");
    setTeamMenuOpen(false);
  }

  function selectBrand(nextBrandId: HomepageToolId) {
    setBrandId(nextBrandId);
    setBrandMenuOpen(false);
  }

  const pageTitle = PAGE_TITLES[view];

  return (
    <div className="h-svh w-full overflow-hidden bg-primary p-2">
      <section className="relative flex h-full max-h-full overflow-clip rounded bg-sheet">
        <aside className="flex w-52 shrink-0 flex-col border-r border-border">
          <div className="relative flex h-full w-full flex-col gap-1 px-2 py-2">
            {/* Team switcher — Cossistant NavigationDropdown rhythm */}
            <div className="relative">
              <button
                aria-expanded={teamMenuOpen}
                className="group flex w-full cursor-pointer items-center gap-1 rounded px-3 py-2.5 text-left text-sm text-foreground/80 transition-colors hover:bg-background-200 hover:text-foreground"
                onClick={() => {
                  setTeamMenuOpen((open) => !open);
                  setBrandMenuOpen(false);
                  setUserMenuOpen(false);
                }}
                ref={teamTriggerRef}
                type="button"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-background-300 text-[10px] font-medium text-foreground">
                  {team.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate pl-2 leading-tight">
                  {team.name}
                </span>
                <span className="shrink-0 rounded bg-primary/15 px-1 text-xs font-medium text-primary">
                  {team.plan}
                </span>
                <ChevronDown />
              </button>

              {teamMenuOpen ? (
                <MenuPanel
                  anchorRef={teamTriggerRef}
                  matchAnchorWidth
                  onClose={() => setTeamMenuOpen(false)}
                >
                  {TEAMS.map((item) => (
                    <MenuRow
                      active={item.id === team.id}
                      icon={
                        <span className="flex size-5 shrink-0 items-center justify-center rounded bg-background-300 text-[10px] font-medium text-foreground">
                          {item.name.slice(0, 1).toUpperCase()}
                        </span>
                      }
                      key={item.id}
                      label={item.name}
                      meta={item.plan}
                      onClick={() => selectTeam(item.id)}
                    />
                  ))}
                </MenuPanel>
              ) : null}
            </div>

            {/* Search — homepage / Cossistant flat field */}
            <input
              className="h-10 w-full bg-background-50 px-3 text-sm text-foreground outline-none transition-colors duration-300 ease-[var(--ease-swift)] placeholder:text-muted-foreground focus:bg-background-100"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find…"
              ref={searchRef}
              value={query}
            />

            <div className="flex max-h-full flex-1 flex-col gap-1 overflow-y-auto">
              {filteredNav.map((item) => (
                <SidebarItem
                  active={view === item.id}
                  key={item.id}
                  onClick={() => setView(item.id)}
                >
                  {item.label}
                </SidebarItem>
              ))}
              {filteredNav.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  No matches
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <SidebarItem
                active={view === "add-brand"}
                onClick={() => setView("add-brand")}
              >
                Add brand
              </SidebarItem>
              <SidebarItem
                active={view === "settings"}
                onClick={() => setView("settings")}
              >
                Settings
              </SidebarItem>
              <div className="mx-2 h-px bg-border opacity-30" />
              <div className="relative">
                <button
                  aria-expanded={userMenuOpen}
                  className="group flex w-full cursor-pointer items-center gap-2.5 rounded px-3 py-2.5 text-left text-sm text-foreground/80 transition-colors hover:bg-background-200 hover:text-foreground"
                  onClick={() => {
                    setUserMenuOpen((open) => !open);
                    setTeamMenuOpen(false);
                    setBrandMenuOpen(false);
                  }}
                  ref={userTriggerRef}
                  type="button"
                >
                  {user.image ? (
                    <img
                      alt=""
                      className="size-5 shrink-0 rounded object-cover"
                      src={user.image}
                    />
                  ) : (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded bg-background-300 text-[10px] font-medium text-foreground">
                      {initials}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{displayName}</span>
                </button>

                {userMenuOpen ? (
                  <MenuPanel
                    anchorRef={userTriggerRef}
                    matchAnchorWidth
                    onClose={() => setUserMenuOpen(false)}
                    placement="above"
                  >
                    <MenuRow
                      label="Sign out"
                      onClick={() => {
                        setUserMenuOpen(false);
                        void handleSignOut();
                      }}
                    />
                  </MenuPanel>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="absolute inset-x-0 top-0 z-10 flex h-14 w-full items-center gap-4 bg-sheet px-5 pr-3">
            {/* Brand switcher — Cossistant topbar item rhythm */}
            <div className="relative">
              <button
                aria-expanded={brandMenuOpen}
                className="group/btn relative flex min-w-0 cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-sm text-foreground/80 transition-colors hover:bg-background-100 hover:text-foreground"
                onClick={() => {
                  setBrandMenuOpen((open) => !open);
                  setTeamMenuOpen(false);
                  setUserMenuOpen(false);
                }}
                ref={brandTriggerRef}
                type="button"
              >
                <HomepageToolIcon
                  className="size-5 shrink-0"
                  id={brand.id}
                />
                <span className="min-w-0 truncate">{brandName}</span>
                <ChevronDown />
              </button>

              {brandMenuOpen ? (
                <MenuPanel
                  anchorRef={brandTriggerRef}
                  onClose={() => setBrandMenuOpen(false)}
                >
                  {team.brands.map((item) => (
                    <MenuRow
                      active={item.id === brand.id}
                      icon={<HomepageToolIcon id={item.id} />}
                      key={item.id}
                      label={item.name}
                      onClick={() => selectBrand(item.id)}
                    />
                  ))}
                </MenuPanel>
              ) : null}
            </div>
          </div>

          <div className="relative flex h-full flex-1 flex-col overflow-auto p-4 pt-14">
            {view === "create" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm font-medium text-foreground">
                  Create for {brandName}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Use the chat to request posts, images, or campaigns.
                </p>
              </div>
            ) : addingBrand ? (
              <AddBrandPanel onDone={() => setView("create")} />
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {pageTitle} — coming next
                </p>
              </div>
            )}
          </div>
        </main>

        <aside
          className={cn(
            "relative flex shrink-0 flex-col border-l border-border",
            chatOpen
              ? "overflow-visible"
              : "w-0 overflow-hidden border-transparent",
            chatOpen &&
              !resizingChat &&
              "transition-[width] duration-200 ease-[var(--ease-swift)]",
          )}
          ref={chatPanelRef}
          style={chatOpen ? { width: chatWidth } : undefined}
        >
          {chatOpen ? (
            <>
              <div
                aria-orientation="vertical"
                aria-valuemax={CHAT_WIDTH_MAX}
                aria-valuemin={CHAT_WIDTH_MIN}
                aria-valuenow={chatWidth}
                className={cn(
                  "absolute top-0 bottom-0 left-0 z-20 w-1.5 -translate-x-1/2 cursor-col-resize touch-none",
                  "before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-transparent before:transition-colors before:duration-150 before:ease-[var(--ease-swift)]",
                  "hover:before:bg-border",
                  resizingChat && "before:bg-foreground/30",
                )}
                onDoubleClick={() => {
                  setChatWidth(CHAT_WIDTH_DEFAULT);
                  window.localStorage.setItem(
                    CHAT_WIDTH_STORAGE_KEY,
                    String(CHAT_WIDTH_DEFAULT),
                  );
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                  setResizingChat(true);
                }}
                role="separator"
                title="Drag to resize · double-click to reset"
              />
              <WorkspaceChat brandName={brandName} />
            </>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function MenuPanel({
  children,
  anchorRef,
  matchAnchorWidth = false,
  placement = "below",
  onClose,
}: {
  children: ReactNode;
  anchorRef: React.RefObject<HTMLElement | null>;
  matchAnchorWidth?: boolean;
  placement?: "above" | "below";
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    function update() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const width = matchAnchorWidth
        ? Math.max(rect.width, 224)
        : Math.max(rect.width, 240);
      const gap = 6;
      if (placement === "above") {
        setCoords({
          bottom: window.innerHeight - rect.top + gap,
          left: rect.left,
          width,
        });
        return;
      }
      setCoords({
        top: rect.bottom + gap,
        left: rect.left,
        width,
      });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef, matchAnchorWidth, placement]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, onClose]);

  if (!coords || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed z-50 flex max-h-[min(20rem,calc(100svh-2rem))] min-w-56 flex-col overflow-hidden rounded border border-border bg-sheet"
      ref={panelRef}
      style={{
        top: coords.top,
        bottom: coords.bottom,
        left: coords.left,
        width: coords.width,
      }}
    >
      <div className="flex flex-col gap-0.5 overflow-y-auto p-1.5">
        {children}
      </div>
    </div>,
    document.body,
  );
}

function MenuRow({
  label,
  meta,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  meta?: string;
  icon?: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "group/btn relative flex h-9 w-full cursor-pointer items-center gap-2.5 rounded px-2.5 text-left text-sm transition-colors",
        "hover:bg-background-100 hover:text-foreground",
        active
          ? "bg-background-100 text-foreground"
          : "text-foreground/80",
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      {meta ? (
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-medium text-primary">
          {meta}
        </span>
      ) : null}
    </button>
  );
}

function SidebarItem({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        "group/btn relative flex h-10 w-full cursor-pointer items-center gap-2.5 rounded px-3 py-1 text-left text-sm text-foreground/80 transition-colors",
        "hover:bg-background-100 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active && "bg-background-100 text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
}

function ChevronDown() {
  return (
    <svg
      aria-hidden
      className="size-3.5 shrink-0 text-muted-foreground opacity-60"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 16 16"
    >
      <path d="M4 6.5 8 10.5 12 6.5" />
    </svg>
  );
}
