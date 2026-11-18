// Shared helper for the reasoning LLM (OpenRouter/DeepSeek by default, or Gemma via an OpenAI-compatible URL).

export type Turn = { role: "user" | "assistant"; content: string };

export type LlmResult = { ok: true; content: string } | { ok: false; status: number; error: string; detail?: string };

export async function callLlm(turns: Turn[], maxTokens = 4000): Promise<LlmResult> {
  const key = process.env.LLM_API_KEY;
  if (!key) return { ok: false, status: 503, error: "LLM_API_KEY is not set in .env.local" };

  const base = (process.env.LLM_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.LLM_MODEL ?? "deepseek-reasoner";

  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: turns, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    const why = err instanceof Error ? err.message : "unknown";
    return { ok: false, status: 504, error: "The AI took too long or could not be reached", detail: why };
  }
  if (!res.ok) {
    return { ok: false, status: 502, error: "AI request failed", detail: (await res.text()).slice(0, 300) };
  }
  const data = await res.json();
  return { ok: true, content: data?.choices?.[0]?.message?.content ?? "" };
}

/** Pull the first JSON object out of a model reply (ignores <think> blocks and code fences). */
export function extractJson(text: string) {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no json");
  return JSON.parse(match[0]);
}
