import type { BrandStaticCard, BrandDynamicCard } from "@/lib/brand/types";

export type SearchHit = {
  id: string;
  type: "memory" | "chunk";
  memory?: string;
  content?: string;
  documentId?: string;
  similarity: number;
  isStatic?: boolean;
  metadata?: Record<string, string | number | boolean> | null;
};

export type SearchResponse = {
  results: SearchHit[];
  total: number;
};

export type ProfileResponse = {
  profile: {
    static: string[];
    dynamic: string[];
    staticCard: BrandStaticCard;
    dynamicCard: BrandDynamicCard;
  };
  searchResults?: SearchResponse;
};

export type AnswerResponse = {
  answer: string;
  memories: SearchHit[];
  citations: Array<{ id: string; content: string; documentId?: string }>;
};

const MAX_FACT_CHARS = 500;
const MAX_ANSWER_CHARS = 12_000;

function truncate(text: string, max = MAX_FACT_CHARS): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max)} … [truncated]`;
}

function hitText(hit: SearchHit): string {
  return hit.memory?.trim() || hit.content?.trim() || "";
}

export function formatAnswer(response: AnswerResponse): string {
  const parts: string[] = [];

  const answer = response.answer?.trim();
  if (answer) {
    parts.push(
      answer.length > MAX_ANSWER_CHARS
        ? `${answer.slice(0, MAX_ANSWER_CHARS)} … [truncated]`
        : answer,
    );
  } else {
    parts.push("No answer generated from brand memory.");
  }

  if (response.citations?.length) {
    parts.push("", "## Citations");
    for (const c of response.citations.slice(0, 8)) {
      parts.push(`- [${c.id}] ${truncate(c.content)}`);
    }
  } else if (response.memories?.length) {
    parts.push("", "## Supporting facts");
    for (const m of response.memories.slice(0, 8)) {
      const text = hitText(m);
      if (!text) continue;
      const score = Number.isFinite(m.similarity)
        ? ` (${m.similarity.toFixed(2)})`
        : "";
      parts.push(`- ${truncate(text)}${score}`);
    }
  }

  return parts.join("\n");
}

export function formatProfile(response: ProfileResponse): string {
  const { profile } = response;
  const parts: string[] = ["# Brand Profile", ""];

  const card = profile.staticCard;
  const sections: Array<[string, string[]]> = [
    ["Identity", card.identity],
    ["Assets", card.assets],
    ["Claims", card.claims],
    ["Restrictions", card.restrictions],
    ["Products", profile.dynamicCard.products],
    ["Campaigns", profile.dynamicCard.campaigns],
  ];

  let wrote = false;
  for (const [title, facts] of sections) {
    if (!facts?.length) continue;
    wrote = true;
    parts.push(`## ${title}`);
    for (const fact of facts) {
      parts.push(`- ${truncate(fact)}`);
    }
    parts.push("");
  }

  if (!wrote) {
    if (profile.static.length || profile.dynamic.length) {
      if (profile.static.length) {
        parts.push("## Static");
        for (const fact of profile.static) parts.push(`- ${truncate(fact)}`);
        parts.push("");
      }
      if (profile.dynamic.length) {
        parts.push("## Dynamic");
        for (const fact of profile.dynamic) parts.push(`- ${truncate(fact)}`);
        parts.push("");
      }
    } else {
      parts.push("No brand profile yet. Ingest guidelines to build one.");
    }
  }

  return parts.join("\n").trimEnd();
}

export function formatSearch(response: SearchResponse): string {
  if (!response.results?.length) {
    return "No matching brand facts.";
  }

  const parts: string[] = [
    `${response.total} hit${response.total === 1 ? "" : "s"} (showing ${response.results.length}):`,
    "",
  ];

  for (const [i, hit] of response.results.entries()) {
    const text = hitText(hit);
    if (!text) continue;
    const kind =
      hit.type === "chunk" ? "chunk" : hit.isStatic ? "static" : "memory";
    const score = Number.isFinite(hit.similarity)
      ? hit.similarity.toFixed(2)
      : "?";
    parts.push(`${i + 1}. [${kind} ${score}] ${truncate(text)}`);
  }

  return parts.join("\n");
}
