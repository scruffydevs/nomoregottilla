"use client";

import { useEffect, useRef, useState } from "react";
import { SCENES, WORD_BY_ID, type Beat, type Scene } from "@/data/starter";
import { speak, stopSpeaking } from "@/lib/voice";
import { InlineWord } from "./InlineWord";
import { Avatar } from "./Avatar";

function speakBeat(b: Beat) {
  return b.kind === "narration" ? speak(b.text, "narrator") : speak(b.say, b.voice);
}

export default function ScenePlayer({
  index,
  known,
  onToggle,
  onClose,
  onOpenScene,
  custom,
}: {
  index: number;
  known: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
  onOpenScene: (i: number) => void;
  custom?: Scene; // an AI-written story to play instead of a built-in scene
}) {
  const scene = custom ?? SCENES[index];
  const [step, setStep] = useState(0); // step === beats.length means the end card
  const [talking, setTalking] = useState(false);
  const end = step >= scene.beats.length;
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => setStep(0), [index]);

  // Auto-play each beat as it appears; `talking` drives the speaker's pulsing avatar.
  useEffect(() => {
    let stale = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (step < scene.beats.length) {
      const beat = scene.beats[step];
      setTalking(true);
      speakBeat(beat).then((result) => {
        if (stale) return;
        setTalking(false);
        // The narrator flows straight on to the next beat once she finishes speaking.
        // Dialogue beats wait for the learner, so there's time to study the words.
        if (beat.kind === "narration" && result === "ended" && step + 1 < scene.beats.length) {
          timer = setTimeout(() => setStep(step + 1), 700);
        }
      });
    } else {
      setTalking(false);
    }
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [index, step, scene.beats]);

  // Stop audio on close; Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stopSpeaking();
    };
  }, [onClose]);

  const shown = scene.beats.slice(0, Math.min(step + 1, scene.beats.length));
  const last = !!custom || index === SCENES.length - 1;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-b from-ink via-navy to-ink">
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 pb-10 pt-4 lg:px-10">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={onClose} className="rounded-full border-2 border-gold/50 px-4 py-1.5 text-sm font-black text-gold hover:bg-gold/10">
            ← Dashboard
          </button>
          <p className="text-sm font-black uppercase tracking-widest text-gold/70">
            {custom ? (scene.tag ?? "AI story") : `Scene ${scene.n} of ${SCENES.length}`}
          </p>
        </div>

        {/* Scenery */}
        <div className="mt-6 rounded-3xl border-2 border-gold/30 bg-navy2/60 py-8 text-center">
          <div className="text-6xl sm:text-7xl" aria-hidden>
            {scene.art}
          </div>
          <h2 className="mt-3 text-3xl font-black text-gold sm:text-4xl">{scene.title}</h2>
          <div className="mt-4 flex justify-center gap-2">
            {scene.beats.map((_, i) => (
              <span key={i} className={`h-2.5 w-8 rounded-full ${i <= step ? "bg-gold" : "bg-navy3"}`} />
            ))}
          </div>
        </div>

        {/* Story so far */}
        <div className="mt-6 flex-1 space-y-4 pb-20">
          {shown.map((b, i) => {
            const current = i === step;
            return (
              <div key={i} className={`pop rounded-2xl p-5 transition ${current ? "" : "opacity-60"} ${
                b.kind === "narration" ? "border-2 border-navy3 bg-navy2/60" : "border-2 border-gold bg-gold/10"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar
                      emoji={b.kind === "narration" ? "🎙️" : b.voice === "ajji" ? "👵" : "🧒"}
                      active={current && talking}
                    />
                    <span className={`rounded-full px-3 py-0.5 text-sm font-black ${b.kind === "narration" ? "bg-navy3 text-gold" : "bg-gold text-ink"}`}>
                      {b.kind === "narration" ? "Narrator" : b.speaker}
                    </span>
                  </div>
                  {current && (
                    <button onClick={() => speakBeat(b)} className="text-sm font-black text-gold hover:underline">
                      🔁 Hear again
                    </button>
                  )}
                </div>
                {b.kind === "narration" ? (
                  <p className="mt-3 text-lg font-semibold leading-8 text-cream sm:text-xl sm:leading-9">{b.text}</p>
                ) : b.kind === "ai" ? (
                  <div className="mt-3">
                    <p className="font-kn text-2xl font-black text-gold sm:text-3xl">{b.say}</p>
                    <p className="mt-1 text-base font-extrabold italic text-cream/90">{b.rom}</p>
                    <p className="mt-1 text-lg font-semibold text-cream/75">{b.en}</p>
                    {b.vocab.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {b.vocab.map((v, j) => (
                          <button
                            key={j}
                            onClick={() => speak(v.kn, "ajji")}
                            className="rounded-lg border-b-4 border-gold bg-gold/15 px-2.5 py-0.5 text-left text-gold hover:bg-gold/25"
                            title="Tap to hear"
                          >
                            <span className="font-kn block font-black">{v.kn}</span>
                            <span className="block text-xs font-extrabold italic text-cream/90">{v.rom}</span>
                            <span className="block text-xs font-bold text-cream/70">({v.en})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xl font-bold leading-[2.6rem] text-cream sm:text-2xl">
                    {b.segs.map((s, j) =>
                      "t" in s ? <span key={j}>{s.t}</span> : <InlineWord key={j} word={WORD_BY_ID[s.w]} isKnown={known.includes(s.w)} />,
                    )}
                  </p>
                )}
              </div>
            );
          })}

          {end && (
            <div className="pop rounded-3xl border-2 border-gold bg-gold/15 p-6 text-center">
              <p className="text-2xl font-black text-gold">Scene complete! 🎉</p>
              {!!scene.vocab?.length && (
                <>
                  <p className="mt-1 text-sm font-semibold text-cream/80">New words from this story. Tap to hear them.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    {scene.vocab.map((v, j) => (
                      <button
                        key={j}
                        onClick={() => speak(v.kn, "ajji")}
                        className="rounded-2xl border-2 border-gold/50 px-4 py-2 text-left text-gold hover:bg-gold/10"
                      >
                        <span className="font-kn block text-xl font-black">{v.kn}</span>
                        <span className="block text-xs font-extrabold">{v.rom} · {v.en}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {scene.words.length > 0 && (
                <p className="mt-1 text-sm font-semibold text-cream/80">Which of these words are gottu now? Tap to mark them.</p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {scene.words.map((id) => {
                  const w = WORD_BY_ID[id];
                  const k = known.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => onToggle(id)}
                      className={`rounded-2xl border-2 px-4 py-2 text-left transition ${k ? "border-gold bg-gold text-ink" : "border-gold/50 text-gold hover:bg-gold/10"}`}
                    >
                      <span className="font-kn block text-xl font-black">{w.kn}</span>
                      <span className="block text-xs font-extrabold">{w.rom} · {w.en}</span>
                      <span className="block text-xs font-black">{k ? "✓ Gottu!" : "Gottilla…"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div ref={bottom} />
        </div>

        {/* Controls */}
        <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-3 bg-gradient-to-t from-ink to-transparent pb-2 pt-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full border-2 border-gold/50 px-5 py-2.5 font-black text-gold disabled:opacity-30"
          >
            ← Back
          </button>
          {!end ? (
            <button onClick={() => setStep((s) => s + 1)} className="rounded-full bg-gold px-8 py-3 text-lg font-black text-ink shadow-[0_5px_0_#b38f00] active:translate-y-1 active:shadow-[0_1px_0_#b38f00]">
              {step === scene.beats.length - 1 ? "Finish scene ✓" : "Next →"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="rounded-full border-2 border-gold/50 px-5 py-2.5 font-black text-gold">
                Replay
              </button>
              {last ? (
                <button onClick={onClose} className="rounded-full bg-gold px-6 py-2.5 font-black text-ink">
                  Back to dashboard
                </button>
              ) : (
                <button onClick={() => onOpenScene(index + 1)} className="rounded-full bg-gold px-6 py-2.5 font-black text-ink">
                  Next scene →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
