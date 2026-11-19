"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark, Wordmark } from "./Logo";
import { InlineWord } from "./InlineWord";
import { Avatar } from "./Avatar";
import ScenePlayer from "./ScenePlayer";
import AjjiHub from "./AjjiHub";
import StoryStudio from "./StoryStudio";
import Diary from "./Diary";
import { speak, startRecording, stopSpeaking, transcribe } from "@/lib/voice";
import { DIALOGUE, SCENES, WORDS, WORD_BY_ID, type Scene, type Word } from "@/data/starter";

const KEY = "nomoregottilla:gottu";

const DIARY_KEY = "nomoregottilla:diary";

type Tab = "starter" | "path" | "chat" | "diary";

export default function Dashboard() {
  const [known, setKnown] = useState<string[]>([]);
  const [learnedAt, setLearnedAt] = useState<Record<string, number>>({}); // word id -> when it became gottu
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setKnown(JSON.parse(raw));
      const diary = localStorage.getItem(DIARY_KEY);
      if (diary) setLearnedAt(JSON.parse(diary));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(known));
    } catch {}
  }, [known, ready]);

  // Keep the diary in step with the word list: stamp new words, drop ones that were un-marked.
  useEffect(() => {
    if (!ready) return;
    setLearnedAt((prev) => {
      const next: Record<string, number> = {};
      for (const id of known) next[id] = prev[id] ?? Date.now();
      const same = Object.keys(next).length === Object.keys(prev).length && Object.keys(next).every((id) => prev[id] === next[id]);
      return same ? prev : next;
    });
  }, [known, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DIARY_KEY, JSON.stringify(learnedAt));
    } catch {}
  }, [learnedAt, ready]);

  const [tab, setTab] = useState<Tab>("starter");
  const [openScene, setOpenScene] = useState<number | null>(null);
  const [customScene, setCustomScene] = useState<Scene | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const cancelled = useRef(false);

  async function playLines(indexes: number[]) {
    cancelled.current = false;
    for (const i of indexes) {
      if (cancelled.current) break;
      setPlaying(i);
      await speak(DIALOGUE[i].say, DIALOGUE[i].voice);
      if (cancelled.current) break;
      await new Promise((r) => setTimeout(r, 350));
    }
    setPlaying(null);
  }

  function stopAll() {
    cancelled.current = true;
    stopSpeaking();
    setPlaying(null);
  }

  const toggle = (id: string) =>
    setKnown((k) => (k.includes(id) ? k.filter((x) => x !== id) : [...k, id]));

  const gottu = known.length;
  const left = WORDS.length - gottu;
  const pct = Math.round((gottu / WORDS.length) * 100);
  const next = WORDS.find((w) => !known.includes(w.id));
  const scenesDone = SCENES.filter((s) => s.words.every((id) => known.includes(id))).length;
  const tabs: { id: Tab; label: string; badge?: string }[] = [
    { id: "starter", label: "📖 Starter", badge: `${gottu}/${WORDS.length}` },
    { id: "path", label: "🗺️ Story path", badge: `${scenesDone}/${SCENES.length}` },
    { id: "chat", label: "🗣️ Speak with Ajji", badge: "AI" },
    { id: "diary", label: "📔 Your diary", badge: String(gottu) },
  ];

  return (
    <div className="w-full px-6 pb-20 lg:px-10 2xl:px-16">
      {/* Header */}
      <header className="sticky top-0 z-30 -mx-6 mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-b-2 border-gold/20 bg-navy/90 px-6 py-3 backdrop-blur lg:-mx-10 lg:px-10 2xl:-mx-16 2xl:px-16">
        <div className="flex shrink-0 items-center gap-3">
          <LogoMark size={48} />
          <div className="leading-none">
            <Wordmark className="text-2xl sm:text-3xl" />
            <p className="mt-1 hidden text-xs font-bold uppercase tracking-widest text-gold/70 sm:block">
              Learn Kannada through Ajji&apos;s stories
            </p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Sections"
          className="order-last flex w-full gap-2 overflow-x-auto rounded-2xl border-2 border-navy3 bg-ink/40 p-1.5 lg:order-none lg:w-auto lg:flex-1"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                document.getElementById("starter")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition sm:flex-1 sm:justify-center sm:text-base ${
                tab === t.id ? "bg-gold text-ink shadow-[0_3px_0_#b38f00]" : "text-gold hover:bg-gold/10"
              }`}
            >
              {t.label}
              {t.badge && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-black ${
                    tab === t.id ? "bg-ink/20 text-ink" : "bg-navy3 text-cream"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-2 rounded-full border-2 border-gold/40 bg-ink/40 px-4 py-2 text-sm font-extrabold text-gold sm:flex">
          🔥 Day 1
        </div>
      </header>

      {tab === "starter" && (
      <>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-gold/30 bg-gradient-to-br from-navy2 to-ink p-6 sm:p-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
        <p className="font-kn text-lg font-black text-gold/80">ನಮಸ್ಕಾರ!</p>
        <h1 className="mt-1 max-w-2xl text-4xl font-black leading-tight text-gold sm:text-6xl">
          Turn every <span className="line-through decoration-flagred decoration-4">gottilla</span> into gottu.
        </h1>
        <p className="mt-4 max-w-xl text-lg font-semibold text-cream/90">
          Ajji is waiting in the kitchen. Listen to her story, tap the Kannada words, and talk back.
        </p>
        <a
          href="#starter"
          onClick={() => setTab("starter")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-lg font-black text-ink shadow-[0_6px_0_#b38f00] transition active:translate-y-1 active:shadow-[0_2px_0_#b38f00]"
        >
          Start with Ajji →
        </a>
        </div>

        {next ? (
          <aside className="rounded-3xl border-2 border-gold/40 bg-ink/50 p-6 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-gold/70">Next word to learn</p>
            <p className="font-kn mt-3 text-6xl font-black text-gold xl:text-7xl">{next.kn}</p>
            <p className="mt-1 text-xl font-extrabold italic text-cream">{next.rom}</p>
            <p className="mt-1 text-lg font-bold text-cream/70">{next.emoji} {next.en}</p>
            <div className="mt-5 flex justify-center gap-3">
              <button
                onClick={() => speak(next.kn)}
                className="rounded-full border-2 border-gold/50 px-4 py-2 text-sm font-black text-gold hover:bg-gold/10"
              >
                🔊 Hear it
              </button>
              <button onClick={() => toggle(next.id)} className="rounded-full bg-gold px-4 py-2 text-sm font-black text-ink">
                Gottu! ✓
              </button>
            </div>
          </aside>
        ) : (
          <aside className="rounded-3xl border-2 border-gold bg-gold/15 p-6 text-center">
            <p className="text-3xl font-black text-gold">All 12 words gottu! 🎉</p>
            <p className="mt-2 font-semibold text-cream/80">Ajji is very proud. Replay a scene to hear them all again.</p>
          </aside>
        )}
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Gottu (I know)" value={gottu} accent />
        <Stat label="Gottilla (still learning)" value={left} />
        <Stat label="Chapter" value="1 / 4" />
        <Stat label="Progress" value={`${pct}%`} />
      </section>
      </>
      )}

      {/* Starter */}
      <section id="starter" className="mt-10 scroll-mt-32 lg:scroll-mt-24">
        {tab === "chat" && <AjjiHub known={known} />}
        {tab === "diary" && <Diary learnedAt={learnedAt} />}

        {(tab === "starter" || tab === "path") && (
        <>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-gold/70">Starter · Chapter 1</p>
            <h2 className="text-3xl font-black text-gold sm:text-4xl">
              Ajji&apos;s Kitchen <span className="font-kn">· ಅಜ್ಜಿಯ ಅಡುಗೆಮನೆ</span>
            </h2>
          </div>
          <p className="text-base font-extrabold text-gold">
            {gottu}/{WORDS.length} words gottu
          </p>
        </div>

        <div className="mt-3 h-4 overflow-hidden rounded-full border-2 border-gold/40 bg-ink/60">
          <div className="h-full bg-gold transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        </>
        )}

        {tab === "starter" && (
        <>
        {/* Story preview */}
        <div className="mt-8 grid items-start gap-8 xl:grid-cols-2">
        <div>
        <div className="rounded-3xl border-2 border-navy3 bg-navy2/70 p-5 sm:p-8">
          <h3 className="text-xl font-black text-gold">📖 Read the scene</h3>
          <p className="mt-1 text-sm font-semibold text-cream/70">
            Tap any Kannada word to hear it. Words you mark <b className="text-gold">gottu</b> lose their English
            help, just like in the real story.
          </p>
          <button
            onClick={() => (playing === null ? playLines(DIALOGUE.map((_, i) => i)) : stopAll())}
            className="mt-4 rounded-full bg-gold px-5 py-2 text-sm font-black text-ink shadow-[0_4px_0_#b38f00] active:translate-y-0.5 active:shadow-[0_2px_0_#b38f00]"
          >
            {playing === null ? "▶ Play the whole scene" : "⏹ Stop"}
          </button>
          <div className="mt-5 space-y-4">
            {DIALOGUE.map((line, i) => (
              <div
                key={i}
                className={`rounded-2xl p-4 text-lg leading-9 transition sm:text-xl sm:leading-10 ${
                  playing === i ? "bg-gold/20 ring-2 ring-gold" : "bg-ink/50"
                }`}
              >
                <span className="mr-2 inline-block">
                  <Avatar emoji={line.voice === "ajji" ? "👵" : "🧒"} active={playing === i} size="sm" />
                </span>
                <button
                  onClick={() => (playing === i ? stopAll() : playLines([i]))}
                  className="mr-2 rounded-full bg-gold px-3 py-0.5 text-sm font-black text-ink"
                  title={`Hear ${line.speaker} say this`}
                >
                  {playing === i ? "⏹" : "🔊"} {line.speaker}
                  {line.voice === "grandson" ? " (grandson)" : ""}
                </button>
                {line.segs.map((s, j) =>
                  "t" in s ? (
                    <span key={j}>{s.t}</span>
                  ) : (
                    <InlineWord key={j} word={WORD_BY_ID[s.w]} isKnown={known.includes(s.w)} />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>

        <TalkToAjji onGottu={(id) => setKnown((k) => (k.includes(id) ? k : [...k, id]))} />

        </div>
        <div>
        {/* Word cards */}
        <h3 className="text-xl font-black text-gold">🃏 Your starter words</h3>
        <p className="mt-1 text-sm font-semibold text-cream/70">
          Tap a card to hear it. Press the button when you really know it.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 2xl:grid-cols-4">
          {WORDS.map((w) => (
            <WordCard key={w.id} word={w} isKnown={known.includes(w.id)} onToggle={() => toggle(w.id)} />
          ))}
        </div>
        </div>
        </div>

        </>
        )}

        {/* Scene path */}
        {tab === "path" && (
        <>
        <h3 className="mt-8 text-xl font-black text-gold">🗺️ The story path</h3>
        <p className="mt-1 text-sm font-semibold text-cream/70">
          Each scene unlocks when you&apos;ve marked the previous scene&apos;s words as gottu.
        </p>
        <ol className="mt-4 grid gap-3 xl:grid-cols-2">
          {SCENES.map((s, i) => {
            const done = s.words.every((id) => known.includes(id));
            const open = i === 0 || SCENES[i - 1].words.every((id) => known.includes(id));
            return (
              <li
                key={s.n}
                className={`flex items-center gap-4 rounded-2xl border-2 p-4 ${
                  done ? "border-gold bg-gold/15" : open ? "border-navy3 bg-navy2/70" : "border-navy3/50 bg-ink/40 opacity-60"
                }`}
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl font-black ${
                    done ? "bg-gold text-ink" : open ? "bg-navy3 text-gold" : "bg-ink text-cream/50"
                  }`}
                >
                  {done ? "✓" : open ? s.n : "🔒"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-gold">{s.title}</p>
                  <p className="text-sm font-semibold text-cream/70">
                    {s.blurb} · {s.words.map((id) => WORD_BY_ID[id].kn).join(" · ")}
                  </p>
                </div>
                <button
                  disabled={!open}
                  onClick={() => setOpenScene(i)}
                  className="rounded-full bg-gold px-5 py-2 text-sm font-black text-ink disabled:cursor-not-allowed disabled:bg-navy3 disabled:text-cream/40"
                >
                  {done ? "Replay" : "Play"}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Story Studio: AI stories at the learner's level */}
        <div className="mt-14 border-t-2 border-gold/20 pt-2">
          <StoryStudio known={known} onPlay={setCustomScene} />
        </div>
        </>
        )}
      </section>

      {customScene && (
        <ScenePlayer
          index={0}
          custom={customScene}
          known={known}
          onToggle={toggle}
          onClose={() => setCustomScene(null)}
          onOpenScene={() => setCustomScene(null)}
        />
      )}

      {openScene !== null && (
        <ScenePlayer
          index={openScene}
          known={known}
          onToggle={toggle}
          onClose={() => setOpenScene(null)}
          onOpenScene={(i) => setOpenScene(i)}
        />
      )}
    </div>
  );
}

const CHALLENGES = [
  { prompt: "Ajji keeps piling on food. Tell her you've had enough!", id: "saaku" },
  { prompt: "Ajji asks if you liked it. Say yes!", id: "haudu" },
  { prompt: "Ajji hands you water. Thank her!", id: "dhanyavaada" },
];

function TalkToAjji({ onGottu }: { onGottu: (id: string) => void }) {
  const [i, setI] = useState(0);
  const [state, setState] = useState<"idle" | "listening" | "thinking">("idle");
  const [result, setResult] = useState<{ heard: string; ok: boolean } | null>(null);
  const [error, setError] = useState("");
  const [rec, setRec] = useState<Awaited<ReturnType<typeof startRecording>> | null>(null);

  const c = CHALLENGES[i];
  const target = WORD_BY_ID[c.id];

  async function begin() {
    setError("");
    setResult(null);
    try {
      const r = await startRecording();
      setRec(r);
      setState("listening");
    } catch {
      setError("Couldn't open the microphone. Allow mic access and try again.");
    }
  }

  async function finish() {
    if (!rec) return;
    setState("thinking");
    rec.stop();
    try {
      const heard = await transcribe(await rec.done);
      const norm = (s: string) => s.replace(/[\s.,!?।]/g, "");
      const ok = norm(heard).includes(norm(target.kn));
      setResult({ heard, ok });
      if (ok) {
        onGottu(target.id);
        speak("ಸರಿ ಸರಿ!");
      }
    } catch {
      setError("Ajji couldn't hear that. Try once more, speaking a little closer to the microphone.");
    }
    setRec(null);
    setState("idle");
  }

  return (
    <div className="mt-8 rounded-3xl border-2 border-gold bg-gradient-to-br from-navy2 to-ink p-5 sm:p-8">
      <div className="flex items-center gap-3">
        <Avatar emoji="👵" size="lg" active={state !== "idle"} />
        <div>
          <h3 className="text-xl font-black text-gold">🎤 Talk to Ajji</h3>
          <p className="text-xs font-extrabold uppercase tracking-wider text-cream/60">
            {state === "listening" ? "Ajji is listening…" : state === "thinking" ? "Ajji is thinking…" : "Ajji is ready"}
          </p>
        </div>
      </div>
      <p className="mt-2 text-lg font-bold text-cream">{c.prompt}</p>
      <p className="mt-1 text-sm font-semibold text-cream/70">
        Hint: <span className="font-kn font-black text-gold">{target.kn}</span> ({target.rom})
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => speak(target.kn)}
          className="rounded-full border-2 border-gold/50 px-4 py-2 text-sm font-black text-gold hover:bg-gold/10"
        >
          🔊 Hear Ajji say it
        </button>
        {state === "idle" && (
          <button onClick={begin} className="rounded-full bg-gold px-6 py-2 text-base font-black text-ink">
            🎤 Tap and speak
          </button>
        )}
        {state === "listening" && (
          <button onClick={finish} className="animate-pulse rounded-full bg-flagred px-6 py-2 text-base font-black text-white">
            ⏹ Done speaking
          </button>
        )}
        {state === "thinking" && <span className="font-extrabold text-gold">Ajji is listening…</span>}
      </div>

      {error && <p className="mt-3 text-sm font-bold text-flagred">{error}</p>}
      {result && (
        <div className="pop mt-4 rounded-2xl bg-ink/60 p-4">
          <p className="text-sm font-bold text-cream/70">
            Ajji heard: <span className="font-kn text-lg font-black text-cream">{result.heard || "…nothing"}</span>
          </p>
          <p className={`mt-1 text-lg font-black ${result.ok ? "text-gold" : "text-cream"}`}>
            {result.ok ? "✓ Gottu! Ajji is proud 💛" : "Not quite. Hear Ajji and try again."}
          </p>
          {result.ok && i < CHALLENGES.length - 1 && (
            <button
              onClick={() => {
                setI(i + 1);
                setResult(null);
              }}
              className="mt-3 rounded-full bg-gold px-5 py-2 text-sm font-black text-ink"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border-2 p-4 ${accent ? "border-gold bg-gold text-ink" : "border-navy3 bg-navy2/70"}`}
    >
      <p className={`text-3xl font-black sm:text-4xl ${accent ? "text-ink" : "text-gold"}`}>{value}</p>
      <p className={`mt-1 text-xs font-extrabold uppercase tracking-wider ${accent ? "text-ink/70" : "text-cream/70"}`}>
        {label}
      </p>
    </div>
  );
}

function WordCard({ word, isKnown, onToggle }: { word: Word; isKnown: boolean; onToggle: () => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className={`flex flex-col rounded-2xl border-2 p-4 text-center transition ${
        isKnown ? "border-gold bg-gold/15" : "border-navy3 bg-navy2/70"
      }`}
    >
      <button
        onClick={() => {
          speak(word.kn);
          setFlipped((f) => !f);
        }}
        className="flex flex-1 flex-col items-center py-2"
        aria-label={`Hear ${word.rom}`}
      >
        <span className="text-3xl">{word.emoji}</span>
        <span className="font-kn mt-2 text-3xl font-black text-gold">{word.kn}</span>
        <span className="mt-1 text-base font-extrabold text-cream/90">{word.rom}</span>
        <span key={String(flipped)} className="flip mt-2 min-h-6 text-sm font-bold text-cream/70">
          {flipped || isKnown ? word.en : "tap to reveal 🔊"}
        </span>
      </button>
      <button
        onClick={onToggle}
        className={`mt-3 rounded-full px-3 py-2 text-sm font-black transition ${
          isKnown ? "bg-gold text-ink" : "border-2 border-gold/50 text-gold hover:bg-gold/10"
        }`}
      >
        {isKnown ? "✓ Gottu! (ಗೊತ್ತು)" : "Gottilla… (ಗೊತ್ತಿಲ್ಲ)"}
      </button>
    </div>
  );
}
