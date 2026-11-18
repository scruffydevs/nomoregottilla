// Browser-side voice helpers. All Sarvam calls go through our own /api routes.

const cache = new Map<string, string>(); // text -> object URL, so each phrase costs one API call
let current: HTMLAudioElement | null = null;

function browserFallback(text: string, voice: Voice) {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice === "narrator" ? "en-IN" : "kn-IN";
    u.rate = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

export type Voice = "ajji" | "grandson" | "narrator";

/** Stop whatever is playing. */
export function stopSpeaking() {
  seq++; // cancels any line still being fetched
  current?.pause();
  try {
    window.speechSynthesis?.cancel();
  } catch {}
}

/**
 * Speak Kannada text in a character's voice. Resolves when the audio finishes (or is stopped),
 * so lines can be chained. Falls back to the browser voice if Sarvam is unavailable.
 */
let seq = 0; // latest call wins; older in-flight calls go quiet instead of falling back

export async function speak(text: string, voice: Voice = "ajji"): Promise<"sarvam" | "fallback"> {
  const mine = ++seq;
  try {
    window.speechSynthesis?.cancel(); // never let the robotic browser voice linger
  } catch {}
  try {
    const key = `${voice}|${text}`;
    let url = cache.get(key);
    if (!url) {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });
      if (!res.ok) throw new Error(`tts ${res.status}`);
      url = URL.createObjectURL(await res.blob());
      cache.set(key, url);
    }
    if (mine !== seq) return "sarvam"; // a newer line started while we were fetching
    current?.pause();
    const audio = new Audio(url);
    current = audio;
    await audio.play();
    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onpause = () => resolve();
    });
    return "sarvam";
  } catch (err) {
    // Only use the browser voice when Sarvam really failed, not when we were interrupted.
    const interrupted = mine !== seq || (err instanceof DOMException && err.name === "AbortError");
    if (interrupted) return "sarvam";
    browserFallback(text, voice);
    return "fallback";
  }
}

/** Record from the mic until stop() is called, then resolve with the audio blob. */
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
    };
  });
  rec.start();
  return { stop: () => rec.stop(), done };
}

export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", audio, "speech.webm");
  const res = await fetch("/api/stt", { method: "POST", body: form });
  if (!res.ok) throw new Error(`stt ${res.status}`);
  const data = (await res.json()) as { transcript: string };
  return data.transcript;
}
