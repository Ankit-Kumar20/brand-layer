import { siClaude, siCursor, type SimpleIcon } from "simple-icons";

/**
 * Icons only - names stay in page copy / aria-labels.
 * Claude & Cursor: simple-icons · ChatGPT: public/icons/openai.svg
 * Codex & OpenClaw: public/icons/*.svg (lobehub/icons-static-svg)
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

type IntegrationId = ToolId | "codex" | "openclaw";

type ToolDef =
  | { name: string; kind: "simple"; icon: SimpleIcon }
  | { name: string; kind: "file"; src: string };

const tools: Record<ToolId, ToolDef> = {
  claude: { name: "Claude", kind: "simple", icon: siClaude },
  cursor: { name: "Cursor", kind: "simple", icon: siCursor },
  chatgpt: { name: "ChatGPT", kind: "file", src: "/icons/openai.svg" },
};

const integrations: Record<IntegrationId, ToolDef> = {
  ...tools,
  codex: { name: "Codex", kind: "file", src: "/icons/codex.svg" },
  openclaw: { name: "OpenClaw", kind: "file", src: "/icons/openclaw.svg" },
};

const integrationOrder: IntegrationId[] = [
  "claude",
  "cursor",
  "chatgpt",
  "codex",
  "openclaw",
];

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

function IntegrationMark({ id }: { id: IntegrationId }) {
  const tool = integrations[id];

  if (tool.kind === "simple") {
    return <BrandMark className="size-5 shrink-0" icon={tool.icon} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      aria-hidden
      className="size-5 shrink-0"
      height={20}
      src={tool.src}
      width={20}
    />
  );
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
              <span className="sr-only">{tool.name}</span>
              <IntegrationMark id={id} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
