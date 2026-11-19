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

export type Voice = "ajji" | "ajjislow" | "grandson" | "narrator";

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

export async function speak(text: string, voice: Voice = "ajji"): Promise<"ended" | "interrupted" | "fallback"> {
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
    if (mine !== seq) return "interrupted"; // a newer line started while we were fetching
    current?.pause();
    const audio = new Audio(url);
    current = audio;
    await audio.play();
    // 'pause' also fires just before 'ended' on natural completion, so check audio.ended.
    return await new Promise<"ended" | "interrupted">((resolve) => {
      audio.onended = () => resolve("ended");
      audio.onpause = () => resolve(audio.ended ? "ended" : "interrupted");
    });
  } catch (err) {
    // Only use the browser voice when Sarvam really failed, not when we were interrupted.
    const interrupted = mine !== seq || (err instanceof DOMException && err.name === "AbortError");
    if (interrupted) return "interrupted";
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

async function decode(blob: Blob) {
  const ctx = new AudioContext();
  try {
    return await ctx.decodeAudioData(await blob.arrayBuffer());
  } finally {
    void ctx.close();
  }
}

/** How long and how loud a recording is (peak is 0 to 1), so we can tell silence from a missed word. */
export async function analyzeAudio(blob: Blob): Promise<{ seconds: number; peak: number } | null> {
  try {
    const buf = await decode(blob);
    const ch = buf.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < ch.length; i++) peak = Math.max(peak, Math.abs(ch[i]));
    return { seconds: buf.duration, peak };
  } catch {
    return null;
  }
}

/** Convert a recording to 16 kHz mono 16-bit WAV (Sarvam's preferred input) and lift quiet audio. */
async function toWav16k(blob: Blob): Promise<Blob> {
  const buf = await decode(blob);
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(buf.duration * 16000)), 16000);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start();
  const pcm = (await off.startRendering()).getChannelData(0);

  let peak = 0;
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const gain = peak > 0.005 && peak < 0.5 ? Math.min(0.8 / peak, 30) : 1; // quiet mic: bring it up

  const wav = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(wav);
  const text = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  text(0, "RIFF");
  v.setUint32(4, 36 + pcm.length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, 16000, true);
  v.setUint32(28, 32000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  text(36, "data");
  v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i] * gain));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([wav], { type: "audio/wav" });
}

export async function transcribe(rawAudio: Blob): Promise<string> {
  let audio = rawAudio;
  try {
    audio = await toWav16k(rawAudio);
  } catch {
    /* if the browser can't decode it, send the original recording */
  }
  const form = new FormData();
  form.append("file", audio, audio.type === "audio/wav" ? "speech.wav" : "speech.webm");
  const res = await fetch("/api/stt", { method: "POST", body: form });
  if (!res.ok) throw new Error(`stt ${res.status}`);
  const data = (await res.json()) as { transcript: string };
  return data.transcript;
}
