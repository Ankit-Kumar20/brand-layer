import { siClaude, siCursor, type SimpleIcon } from "simple-icons";

/**
 * Icons only - names stay in page copy / aria-labels.
 * Claude & Cursor: simple-icons · ChatGPT: public/icons/openai.svg
 * Codex, OpenClaw, Hermes: public/icons/*.svg (lobehub/icons-static-svg)
 * See public/icons/SOURCES.md
 */

const iconClassName =
  "mr-[0.3em] inline-block size-[0.85em] shrink-0 align-[-0.12em]";

function BrandMark({
  icon,
  className,
}: {
  icon: SimpleIcon;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      className={className}
      fill={`#${icon.hex}`}
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{icon.title}</title>
      <path d={icon.path} />
    </svg>
  );
}

type ToolId = "claude" | "cursor" | "chatgpt";

export type HomepageToolId = ToolId | "codex" | "openclaw" | "hermes";

type IntegrationId = HomepageToolId;

type ToolDef =
  | { name: string; href: string; kind: "simple"; icon: SimpleIcon }
  | { name: string; href: string; kind: "file"; src: string };

const tools: Record<ToolId, ToolDef> = {
  claude: {
    name: "Claude",
    href: "https://claude.ai",
    kind: "simple",
    icon: siClaude,
  },
  cursor: {
    name: "Cursor",
    href: "https://cursor.com",
    kind: "simple",
    icon: siCursor,
  },
  chatgpt: {
    name: "ChatGPT",
    href: "https://chatgpt.com",
    kind: "file",
    src: "/icons/openai.svg",
  },
};

const integrations: Record<IntegrationId, ToolDef> = {
  ...tools,
  codex: {
    name: "Codex",
    href: "https://openai.com/codex",
    kind: "file",
    src: "/icons/codex.svg",
  },
  openclaw: {
    name: "OpenClaw",
    href: "https://openclaw.ai",
    kind: "file",
    src: "/icons/openclaw.svg",
  },
  hermes: {
    name: "Hermes Agent",
    href: "https://hermes-agent.nousresearch.com",
    kind: "file",
    src: "/icons/hermes.svg",
  },
};

export const homepageToolIds: HomepageToolId[] = [
  "claude",
  "cursor",
  "chatgpt",
  "codex",
  "openclaw",
  "hermes",
];

export const homepageTools = homepageToolIds.map((id) => ({
  id,
  name: integrations[id].name,
  href: integrations[id].href,
}));

const integrationOrder: IntegrationId[] = homepageToolIds;

/** Icon only - put the label in surrounding copy. */
export function ToolIcon({ id }: { id: ToolId }) {
  const tool = tools[id];

  if (tool.kind === "simple") {
    return <BrandMark className={iconClassName} icon={tool.icon} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- inline prose mark
    <img
      alt=""
      aria-hidden
      className={iconClassName}
      height={16}
      src={tool.src}
      width={16}
    />
  );
}

/** @deprecated Prefer ToolIcon + plain text for names */
export function ToolName({ id }: { id: ToolId }) {
  const tool = tools[id];
  return (
    <span className="whitespace-nowrap">
      <ToolIcon id={id} />
      {tool.name}
    </span>
  );
}

export function HomepageToolIcon({
  id,
  className = "size-5 shrink-0",
}: {
  id: HomepageToolId;
  className?: string;
}) {
  const tool = integrations[id];

  if (tool.kind === "simple") {
    return <BrandMark className={className} icon={tool.icon} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      aria-hidden
      className={className}
      height={20}
      src={tool.src}
      width={20}
    />
  );
}

function IntegrationMark({ id }: { id: IntegrationId }) {
  return <HomepageToolIcon id={id} />;
}

export function Integrations() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <p className="text-label text-muted-foreground">Works with</p>
      <ul className="flex flex-wrap items-center gap-4 sm:gap-5">
        {integrationOrder.map((id) => {
          const tool = integrations[id];
          return (
            <li key={id}>
              <a
                aria-label={tool.name}
                className="cursor-pointer"
                href={tool.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <IntegrationMark id={id} />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
