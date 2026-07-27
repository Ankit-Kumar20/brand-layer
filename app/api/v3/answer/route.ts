import {
  requireApiAuth,
  resolveContainerTag,
} from "@/lib/auth-request";
import { answerBrandQuestion } from "@/lib/memory/answer";
import { memoryError, memoryLog } from "@/lib/memory/log";
import { AnswerSchema } from "@/lib/memory/schemas";

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth(request);
    const body = await request.json();
    const parsed = AnswerSchema.safeParse(body);
    if (!parsed.success) {
      memoryLog("api", "POST /v3/answer invalid", {
        issues: parsed.error.issues.length,
      });
      return Response.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const containerTag = resolveContainerTag(auth, parsed.data.containerTag);

    memoryLog("api", "POST /v3/answer", {
      containerTag,
      q: parsed.data.q.slice(0, 80),
    });

    const result = await answerBrandQuestion(auth.userId, {
      ...parsed.data,
      containerTag,
    });

    memoryLog("api", "POST /v3/answer ok", {
      memories: result.memories.length,
      citations: result.citations.length,
    });

    return Response.json(result);
  } catch (err) {
    if (err instanceof Response) return err;
    memoryError("api", "POST /v3/answer error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
