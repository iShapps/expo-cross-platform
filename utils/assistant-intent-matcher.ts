import { ASSISTANT_KNOWLEDGE_BASE } from "@/data/assistant-knowledge-base";
import { AssistantKnowledgeEntry } from "@/data-types/assistant";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Deterministic keyword-overlap matcher — no LLM call. Picks the entry whose
// matched keyword is the longest (most specific) substring of the input.
export function matchLocalKnowledge(
  input: string,
): AssistantKnowledgeEntry | null {
  const normalizedInput = normalize(input);
  if (!normalizedInput) return null;

  let best: { entry: AssistantKnowledgeEntry; score: number } | null = null;

  for (const entry of ASSISTANT_KNOWLEDGE_BASE) {
    for (const keyword of entry.keywords) {
      const normalizedKeyword = normalize(keyword);
      if (!normalizedKeyword) continue;

      if (normalizedInput.includes(normalizedKeyword)) {
        const score = normalizedKeyword.length;
        if (!best || score > best.score) {
          best = { entry, score };
        }
      }
    }
  }

  return best?.entry ?? null;
}
