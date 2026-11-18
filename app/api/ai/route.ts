import { NextResponse } from "next/server";
import { WORDS } from "@/data/starter";

// "Ajji's brain": a reasoning LLM (DeepSeek or Gemma) behind an OpenAI-compatible chat endpoint.
// Defaults to DeepSeek. For Gemma, set in .env.local:
//   LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
//   LLM_MODEL=<a Gemma model id from Google AI Studio>
//   LLM_API_KEY=<your Google AI Studio key>

type Turn = { role: "user" | "assistant"; content: string };

function instructions(knownIds: string[]) {
  const known = WORDS.filter((w) => knownIds.includes(w.id));
  const learning = WORDS.filter((w) => !knownIds.includes(w.id));
  const fmt = (ws: typeof WORDS) => ws.map((w) => `${w.kn} (${w.rom} = ${w.en})`).join(", ") || "none yet";
  return `You are Ajji, a warm, funny, loving Kannada grandmother in Mysuru. You are talking to your grandson, an English speaker who is just starting to learn Kannada. The scene is your kitchen: dosas, chutney, water, hugs.

Words the learner already KNOWS: ${fmt(known)}.
Words the learner is still LEARNING: ${fmt(learning)}.

Rules:
1. Reply with ONE or TWO very short Kannada sentences (max 8 words each), written in Kannada script. Use mainly the words above plus very common simple words (like ಬಾ, ತಗೋ, ಬೇಕಾ, ಮೊಮ್ಮಗ). Never use long or literary Kannada.
2. Always give a romanization ("rom") that an English speaker can read aloud, and an English translation ("en").
3. If the learner's message contains Kannada (script or romanized), check it carefully. If it is correct, praise it warmly. If it is wrong or unclear, put a kind one-sentence correction in "feedback" (in English) and the correct Kannada. If they wrote only English, just answer and keep the conversation going, then encourage them to try a Kannada word.
4. Stay in character. Be playful. Never be harsh. Ask a simple follow-up question so the chat continues.
5. If you are not sure a Kannada word is correct, choose a simpler word you are sure about.
6. React to what the learner actually said before moving on. Example: if they say ಸಾಕು (enough), Ajji pretends to give in, or teases them and offers one more bite. If they say ಹೌದು (yes), respond to the question you asked. Never ignore their message.

Reply with ONLY one JSON object, no markdown, in exactly this shape:
{"kn": "...", "rom": "...", "en": "...", "feedback": "..." or null, "newWords": [{"kn": "...", "rom": "...", "en": "..."}]}
"newWords" lists any Kannada words in your reply that are NOT in the learner's known words (empty array if none).`;
}

function extractJson(text: string) {
  const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "");
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no json");
  return JSON.parse(match[0]);
}

export async function POST(req: Request) {
  const key = process.env.LLM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "LLM_API_KEY is not set in .env.local" }, { status: 503 });
  }

  let messages: Turn[] = [];
  let known: string[] = [];
  try {
    const body = await req.json();
    messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m: Turn) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-8)
      .map((m: Turn) => ({ role: m.role, content: m.content.slice(0, 400) }));
    known = Array.isArray(body.known) ? body.known.filter((k: unknown) => typeof k === "string") : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "Last message must be from the user" }, { status: 400 });
  }

  // Some models (e.g. Gemma) reject a system role, so the instructions ride inside the first user turn.
  const first = messages[0];
  const turns: Turn[] = [
    { role: "user", content: `${instructions(known)}\n\n---\n${first.role === "user" ? first.content : "Hello"}` },
    ...(first.role === "user" ? messages.slice(1) : messages),
  ];

  const base = (process.env.LLM_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.LLM_MODEL ?? "deepseek-reasoner";

  let res: Response;
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: turns, max_tokens: 4000 }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (err) {
    const why = err instanceof Error ? `${err.name}: ${err.message}${err.cause ? ` (${String(err.cause)})` : ""}` : "unknown";
    console.error("AI fetch failed:", why, "base:", base, "model:", model);
    return NextResponse.json({ error: "The AI took too long or could not be reached", why, base, model }, { status: 504 });
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    return NextResponse.json({ error: "AI request failed", status: res.status, detail }, { status: 502 });
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  try {
    const parsed = extractJson(content);
    return NextResponse.json({
      kn: String(parsed.kn ?? ""),
      rom: String(parsed.rom ?? ""),
      en: String(parsed.en ?? ""),
      feedback: parsed.feedback ? String(parsed.feedback) : null,
      newWords: Array.isArray(parsed.newWords) ? parsed.newWords.slice(0, 5) : [],
    });
  } catch {
    return NextResponse.json({ error: "AI reply was not in the expected format", raw: content.slice(0, 300) }, { status: 502 });
  }
}
