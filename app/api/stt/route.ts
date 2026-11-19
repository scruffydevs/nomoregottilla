import { NextResponse } from "next/server";

// Learner's voice: recorded audio -> Kannada text via Sarvam Saaras.
export async function POST(req: Request) {
  const key = process.env.SARVAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "SARVAM_API_KEY is not set in .env.local" }, { status: 503 });
  }

  const incoming = await req.formData();
  const file = incoming.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "No audio received" }, { status: 400 });
  }
  if (file.size > 5_000_000) {
    return NextResponse.json({ error: "Recording too long" }, { status: 413 });
  }

  // Browsers label recordings like "audio/webm;codecs=opus"; Sarvam only accepts the bare type ("audio/webm").
  const bareType = (file.type || "audio/webm").split(";")[0].trim() || "audio/webm";
  const ext = bareType.includes("ogg") ? "ogg" : bareType.includes("wav") ? "wav" : bareType.includes("mp4") ? "m4a" : "webm";
  const clean = new Blob([await file.arrayBuffer()], { type: bareType });

  const form = new FormData();
  form.append("file", clean, `speech.${ext}`);
  form.append("model", process.env.SARVAM_STT_MODEL ?? "saaras:v4");
  form.append("mode", "transcribe");
  form.append("language_code", "kn-IN");

  const res = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: { "api-subscription-key": key },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ error: "Sarvam STT failed", status: res.status, detail }, { status: 502 });
  }

  const data = (await res.json()) as { transcript?: string };
  return NextResponse.json({ transcript: data.transcript ?? "" });
}
