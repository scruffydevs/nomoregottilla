import { NextResponse } from "next/server";

// Sarvam doesn't label any Kannada voice by age, so "older" is approximated with a calmer narrator
// voice at a slower pace. Swap speakers in .env.local to audition others.
const KN_MODEL = process.env.SARVAM_TTS_MODEL ?? "bulbul:v4-flash";
const VOICES = {
  ajji: {
    speaker: process.env.SARVAM_AJJI_SPEAKER ?? "chaitra_kn_narration",
    pace: Number(process.env.SARVAM_AJJI_PACE ?? 0.8),
    language: "kn-IN",
    model: KN_MODEL,
  },
  grandson: {
    speaker: process.env.SARVAM_GRANDSON_SPEAKER ?? "chetan_kn_conversation",
    pace: Number(process.env.SARVAM_GRANDSON_PACE ?? 1.0),
    language: "kn-IN",
    model: KN_MODEL,
  },
  // The narrator explains each scene in English.
  narrator: {
    speaker: process.env.SARVAM_NARRATOR_SPEAKER ?? "ritu",
    pace: Number(process.env.SARVAM_NARRATOR_PACE ?? 0.95),
    language: "en-IN",
    model: process.env.SARVAM_NARRATOR_MODEL ?? "bulbul:v3",
  },
};

// Text -> Kannada speech via Sarvam Bulbul. The key stays on the server.
export async function POST(req: Request) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "SARVAM_API_KEY is not set in .env.local" }, { status: 503 });
  }

  let text = "";
  let voice: keyof typeof VOICES = "ajji";
  try {
    const body = await req.json();
    text = body.text;
    if (body.voice === "grandson" || body.voice === "narrator") voice = body.voice;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  text = String(text ?? "").trim();
  if (!text || text.length > 500) {
    return NextResponse.json({ error: "Text must be 1-500 characters" }, { status: 400 });
  }

  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "api-subscription-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      language_code: VOICES[voice].language,
      model: VOICES[voice].model,
      speaker: VOICES[voice].speaker,
      pace: VOICES[voice].pace,
      output_audio_codec: "wav",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Sarvam TTS failed", status: res.status, detail }, { status: 502 });
  }

  const data = (await res.json()) as { audios?: string[] };
  const b64 = data.audios?.[0];
  if (!b64) return NextResponse.json({ error: "No audio returned" }, { status: 502 });

  return new Response(Buffer.from(b64, "base64"), {
    headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=86400" },
  });
}
