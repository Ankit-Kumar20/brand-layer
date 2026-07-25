/**
 * L3 — Paragraph/token-ish chunking (~600 tokens, 80 overlap).
 * Uses whitespace word count as a token proxy.
 */

export type TextChunk = {
  position: number;
  content: string;
  tokenCount: number;
};

const TARGET_TOKENS = 600;
const OVERLAP_TOKENS = 80;

function estimateTokens(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function chunkText(rawText: string): TextChunk[] {
  const text = rawText.trim();
  if (!text) return [];

  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const units = paragraphs.length > 0 ? paragraphs : [text];

  const chunks: TextChunk[] = [];
  let buffer: string[] = [];
  let bufferTokens = 0;

  const flush = () => {
    const content = buffer.join("\n\n").trim();
    if (!content) return;
    chunks.push({
      position: chunks.length,
      content,
      tokenCount: estimateTokens(content),
    });
  };

  for (const unit of units) {
    const unitTokens = estimateTokens(unit);
    if (bufferTokens + unitTokens > TARGET_TOKENS && buffer.length > 0) {
      flush();
      // overlap: keep trailing words from previous buffer
      const prev = buffer.join("\n\n");
      const words = prev.split(/\s+/);
      const overlapWords = words.slice(-OVERLAP_TOKENS);
      buffer = overlapWords.length ? [overlapWords.join(" ")] : [];
      bufferTokens = estimateTokens(buffer.join(" "));
    }
    buffer.push(unit);
    bufferTokens += unitTokens;
  }

  flush();
  return chunks;
}
