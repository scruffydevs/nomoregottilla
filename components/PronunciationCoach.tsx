"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { DRILLS, judge, type Drill, type Verdict } from "@/data/pronunciation";
import { analyzeAudio, speak, startRecording, stopSpeaking, transcribe } from "@/lib/voice";

const KEY = "nomoregottilla:pron";

type Stats = { seconds: number; peak: number } | null;
type Result = { heard: string; verdict: Verdict; note?: string; noteLoading?: boolean; stats?: Stats };

function feedback(v: Verdict, d: Drill, heard: string, stats?: Stats) {
  switch (v) {
    case "good":
      return `Lovely! That came out clearly as ${d.kn} (${d.rom}).`;
    case "swapped":
      return d.partner?.contrast ?? `I heard ${heard} instead of ${d.kn}.`;
    case "close":
      return `Very close! I heard ${heard}. ${d.tip}`;
    case "off":
      return `I heard ${heard}. Listen to Ajji once more, then try again. ${d.tip}`;
    case "silent":
      if (stats && stats.seconds < 0.5)
        return `That recording was very short (${stats.seconds.toFixed(1)} s). Press the mic, say the word, then press Done.`;
      if (stats && stats.peak < 0.02)
        return "The recording is almost silent. Check that your microphone isn't muted and that the right one is selected in your browser.";
      if (stats)
        return `I heard sound for ${stats.seconds.toFixed(1)} s but couldn't make out a word. Say just the word, a little louder and closer to the mic.`;
      return "I couldn't hear anything. Press the mic, say the word, then press Done.";
  }
}

export default function PronunciationCoach() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "listening" | "thinking">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [nailed, setNailed] = useState<string[]>([]);
  const [talking, setTalking] = useState(false);
  const [mineUrl, setMineUrl] = useState<string | null>(null);
  const rec = useRef<Awaited<ReturnType<typeof startRecording>> | null>(null);
  const run = useRef(0); // guards against late AI notes landing on a different drill

  const d = DRILLS[idx];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setNailed(JSON.parse(raw));
    } catch {}
    return () => stopSpeaking();
  }, []);

  const saveNailed = (next: string[]) => {
    setNailed(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  async function say(text: string, voice: "ajji" | "ajjislow" = "ajji") {
    setTalking(true);
    await speak(text, voice);
    setTalking(false);
  }

  function pick(i: number) {
    run.current++;
    stopSpeaking();
    setIdx(i);
    setResult(null);
    setError("");
    setMineUrl(null);
  }

  async function begin() {
    setError("");
    setResult(null);
    stopSpeaking();
    try {
      rec.current = await startRecording();
      setPhase("listening");
    } catch {
      setError("Couldn't open the microphone. Allow mic access in your browser and try again.");
    }
  }

  async function finish() {
    if (!rec.current) return;
    const mine = ++run.current;
    setPhase("thinking");
    rec.current.stop();
    try {
      const blob = await rec.current.done;
      setMineUrl(URL.createObjectURL(blob));
      const stats = await analyzeAudio(blob);
      if (blob.size < 1500 || (stats && (stats.peak < 0.005 || stats.seconds < 0.4))) {
        // Nothing usable was recorded (a dead or muted mic gives a tiny file): say so instead of
        // sending silence to the recogniser.
        setResult({ heard: "", verdict: "silent", stats });
        setPhase("idle");
        rec.current = null;
        return;
      }
      const heard = await transcribe(blob);
      const verdict = judge(heard, d);
      setResult({ heard, verdict, stats, noteLoading: verdict === "swapped" || verdict === "close" || verdict === "off" });
      setPhase("idle");

      if (verdict === "good") {
        if (!nailed.includes(d.id)) saveNailed([...nailed, d.id]);
        void say("ಚೆನ್ನಾಗಿದೆ!");
      } else {
        if (verdict !== "silent") {
          // Ajji's personal note from the reasoning model (the local tip is already on screen).
          fetch("/api/coach", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ target: d, heard, verdict, tip: d.tip, partner: d.partner }),
          })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((j) => run.current === mine && setResult((r) => (r ? { ...r, note: j.note, noteLoading: false } : r)))
            .catch(() => run.current === mine && setResult((r) => (r ? { ...r, noteLoading: false } : r)));
        }
        // "One more time", then the word again, slowly.
        void (async () => {
          await say("ಇನ್ನೊಂದು ಸಾರಿ");
          if (run.current === mine) await say(d.kn, "ajjislow");
        })();
      }
    } catch {
      setPhase("idle");
      setError("Ajji couldn't hear that. Try once more, speaking a little closer to the microphone.");
    }
    rec.current = null;
  }

  function playMine() {
    if (mineUrl) void new Audio(mineUrl).play();
  }

  const v = result?.verdict;
  const tone = v === "good" ? "border-gold bg-gold/15" : v ? "border-flagred/60 bg-flagred/10" : "";

  return (
    <div className="mt-8 grid items-start gap-8 xl:grid-cols-[1fr_340px]">
      <div className="rounded-3xl border-2 border-gold bg-gradient-to-br from-navy2 to-ink p-5 sm:p-8">
        <div className="flex items-center gap-3 border-b-2 border-gold/20 pb-4">
          <Avatar emoji="👵" size="lg" active={talking || phase !== "idle"} />
          <div className="flex-1">
            <h2 className="text-2xl font-black text-gold">Pronunciation coach</h2>
            <p className="text-xs font-extrabold uppercase tracking-wider text-cream/60">
              {phase === "listening" ? "Ajji is listening…" : phase === "thinking" ? "Ajji is thinking…" : talking ? "Ajji is talking…" : "Say it to Ajji and she'll correct you"}
            </p>
          </div>
          <p className="rounded-full border-2 border-gold/40 px-4 py-1 text-sm font-black text-gold">
            {nailed.length}/{DRILLS.length} nailed
          </p>
        </div>

        {/* Drill picker */}
        <div className="mt-5 flex flex-wrap gap-2">
          {DRILLS.map((x, i) => (
            <button
              key={x.id}
              onClick={() => pick(i)}
              className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-black transition ${
                i === idx ? "border-gold bg-gold text-ink" : "border-gold/40 text-gold hover:bg-gold/10"
              }`}
              title={`${x.kn} · ${x.en}`}
            >
              {nailed.includes(x.id) ? "✓" : x.emoji} {x.rom}
            </button>
          ))}
        </div>

        {/* Current word */}
        <div className="mt-6 rounded-2xl bg-ink/50 p-6 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-gold/70">{d.group}</p>
          <p className="font-kn mt-2 text-7xl font-black text-gold">{d.kn}</p>
          <p className="mt-1 text-2xl font-extrabold italic text-cream">{d.rom}</p>
          <p className="mt-1 text-lg font-bold text-cream/70">
            {d.emoji} {d.en}
          </p>
          <p className="mx-auto mt-4 max-w-xl rounded-xl border-2 border-gold/30 bg-gold/10 px-4 py-3 text-base font-bold text-cream">
            👅 {d.tip}
          </p>
        </div>

        {/* Controls */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => say(d.kn)}
            className="rounded-full border-2 border-gold/50 px-5 py-2.5 font-black text-gold hover:bg-gold/10"
          >
            🔊 Hear Ajji
          </button>
          <button
            onClick={() => say(d.kn, "ajjislow")}
            className="rounded-full border-2 border-gold/50 px-5 py-2.5 font-black text-gold hover:bg-gold/10"
          >
            🐢 Slowly
          </button>
          {phase === "idle" && (
            <button
              onClick={begin}
              className="rounded-full bg-gold px-8 py-3 text-lg font-black text-ink shadow-[0_5px_0_#b38f00] active:translate-y-1 active:shadow-[0_1px_0_#b38f00]"
            >
              🎤 Say it
            </button>
          )}
          {phase === "listening" && (
            <button onClick={finish} className="animate-pulse rounded-full bg-flagred px-8 py-3 text-lg font-black text-white">
              ⏹ Done
            </button>
          )}
          {phase === "thinking" && <span className="font-extrabold text-gold">Ajji is listening carefully…</span>}
        </div>

        {error && <p className="mt-4 rounded-xl border-2 border-flagred/60 bg-flagred/10 px-4 py-3 text-center font-bold text-cream">{error}</p>}

        {/* Ajji's correction */}
        {result && (
          <div className={`pop mt-6 rounded-2xl border-2 p-5 ${tone}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-ink/60 px-3 py-1 text-sm font-black text-gold">
                Ajji heard: <span className="font-kn text-base text-cream">{result.heard || "…nothing"}</span>
              </span>
              <span className={`rounded-full px-3 py-1 text-sm font-black ${v === "good" ? "bg-gold text-ink" : "bg-flagred text-white"}`}>
                {v === "good" ? "✓ Gottu!" : v === "swapped" ? "Different word" : v === "close" ? "Almost there" : v === "silent" ? "No sound" : "Try again"}
              </span>
            </div>
            <p className="mt-3 text-lg font-bold text-cream">{feedback(result.verdict, d, result.heard, result.stats)}</p>
            {result.stats && result.verdict !== "good" && (
              <p className="mt-1 text-xs font-bold text-cream/50">
                Recorded {result.stats.seconds.toFixed(1)} s · mic level {Math.round(result.stats.peak * 100)}%
              </p>
            )}
            {result.noteLoading && <p className="mt-2 animate-pulse text-sm font-extrabold text-gold">Ajji is thinking of a tip…</p>}
            {result.note && (
              <p className="mt-3 rounded-xl border-2 border-gold/40 bg-gold/10 px-3 py-2 text-sm font-bold text-cream">💡 {result.note}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => say(d.kn)} className="rounded-full border-2 border-gold/50 px-4 py-1.5 text-sm font-black text-gold hover:bg-gold/10">
                ▶ Ajji
              </button>
              {mineUrl && (
                <button onClick={playMine} className="rounded-full border-2 border-gold/50 px-4 py-1.5 text-sm font-black text-gold hover:bg-gold/10">
                  ▶ You
                </button>
              )}
              {v === "good" ? (
                <button onClick={() => pick((idx + 1) % DRILLS.length)} className="rounded-full bg-gold px-5 py-1.5 text-sm font-black text-ink">
                  Next word →
                </button>
              ) : (
                <button onClick={begin} className="rounded-full bg-gold px-5 py-1.5 text-sm font-black text-ink">
                  🎤 Try again
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <aside className="h-fit space-y-4 rounded-3xl border-2 border-navy3 bg-navy2/70 p-5">
        <h3 className="text-lg font-black text-gold">How Ajji coaches you</h3>
        <ol className="space-y-3 text-sm font-semibold text-cream/80">
          <li>🔊 <b className="text-gold">Listen.</b> Ajji says the word, normally or slowly.</li>
          <li>🎤 <b className="text-gold">Say it.</b> Sarvam turns your voice into Kannada text.</li>
          <li>🧠 <b className="text-gold">Ajji corrects.</b> If she heard a different word, she names the sound that changed. A reasoning AI then adds a tip on what to do with your tongue, lips or breath.</li>
          <li>👂 <b className="text-gold">Compare.</b> Play Ajji and yourself back to back.</li>
        </ol>
        <p className="rounded-xl bg-ink/50 p-3 text-xs font-bold text-cream/70">
          Ajji only flags differences that change the word. Regional accents are not mistakes.
        </p>
        <p className="rounded-xl bg-ink/50 p-3 text-xs font-bold text-cream/60">
          Ajji works from what the speech recogniser heard, not from measuring your sounds. Treat her as a friendly guide, and check tricky sounds with a native speaker.
        </p>
      </aside>
    </div>
  );
}
