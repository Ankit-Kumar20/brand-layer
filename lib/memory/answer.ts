import { DREAM_MODEL, getOpenAI } from "@/lib/openai";
import { memoryLog } from "./log";
import type { AnswerInput } from "./schemas";
import { searchMemoriesAndDocuments } from "./search";

export async function answerBrandQuestion(
  userId: string,
  input: AnswerInput & { brandTag: string },
) {
  const started = Date.now();
  memoryLog("L8", "answer start", {
    brandTag: input.brandTag,
    q: input.q.slice(0, 80),
  });

  const memorySearch = await searchMemoriesAndDocuments(userId, {
    q: input.q,
    brandTag: input.brandTag,
    searchMode: "memories",
    limit: input.limit,
    threshold: input.threshold,
    includeRelated: false,
    filters: input.filters,
  });

  let chunkCitations: Array<{ id: string; content: string; documentId?: string }> =
    [];
  if (input.includeChunks) {
    const docSearch = await searchMemoriesAndDocuments(userId, {
      q: input.q,
      brandTag: input.brandTag,
      searchMode: "documents",
      limit: Math.min(3, input.limit),
      threshold: input.threshold,
      includeRelated: false,
      filters: input.filters,
    });
    chunkCitations = docSearch.results
      .filter((r) => r.type === "chunk")
      .map((r) => ({
        id: r.id,
        content: r.content ?? "",
        documentId: r.documentId,
      }));
  }

  const memoryLines = memorySearch.results
    .filter((r) => r.type === "memory")
    .map(
      (r, i) =>
        `[m${i + 1}]${r.isStatic ? " (static)" : ""} ${r.memory ?? ""}`,
    );

  const chunkLines = chunkCitations.map(
    (c, i) => `[c${i + 1}] ${c.content.slice(0, 500)}`,
  );

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: DREAM_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: `You answer brand questions using only the provided brand memories (current truth) and optional source chunks (citations).
Rules:
- Prefer memories over chunks when they conflict (memories are current truth).
- Be concise and usable for designers/writers/agents.
- Cite memory ids like [m1] inline when making claims.
- If evidence is missing, say what is unknown — do not invent brand facts.
- Return plain text, not JSON.`,
      },
      {
        role: "user",
        content: `Question: ${input.q}

Brand memories (latest):
${memoryLines.join("\n") || "(none)"}

Source chunks (optional citations):
${chunkLines.join("\n") || "(none)"}

Write a short answer.`,
      },
    ],
  });

  const answer =
    completion.choices[0]?.message?.content?.trim() ||
    "No answer could be generated from current brand memories.";

  memoryLog("L8", "answer done", {
    memories: memorySearch.results.length,
    chunks: chunkCitations.length,
    ms: Date.now() - started,
  });

  return {
    answer,
    memories: memorySearch.results.filter((r) => r.type === "memory"),
    citations: chunkCitations,
  };
}
