"use client";

import { useEffect, useState } from "react";
import type { Scene } from "@/data/starter";

const LEVELS = [
  { id: "beginner", emoji: "🌱", name: "Beginner", cefr: "A1", desc: "Mostly English. A few Kannada words in every scene, with the narrator guiding you." },
  { id: "elementary", emoji: "🌿", name: "Elementary", cefr: "A2", desc: "Short Kannada sentences. More talking, with English help on every line." },
  { id: "confident", emoji: "🌳", name: "Confident", cefr: "B1", desc: "Longer Kannada chats between Ajji and you. The narrator only sets the scene." },
] as const;

const THEMES = [
  { emoji: "🎉", label: "Festival day" },
  { emoji: "🛍️", label: "Market day" },
  { emoji: "🏏", label: "Cricket match" },
  { emoji: "🌧️", label: "Monsoon rain" },
  { emoji: "🚌", label: "Bus ride" },
  { emoji: "🎂", label: "Birthday surprise" },
  { emoji: "🎲", label: "Surprise me" },
];

type Saved = { id: string; level: string; theme: string; at: number; scene: Scene };
const LEVEL_KEY = "nomoregottilla:level";
const STORIES_KEY = "nomoregottilla:stories";

export default function StoryStudio({ known, onPlay }: { known: string[]; onPlay: (s: Scene) => void }) {
  const [level, setLevel] = useState<(typeof LEVELS)[number]["id"]>("beginner");
  const [theme, setTheme] = useState(THEMES[0].label);
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Saved[]>([]);

  useEffect(() => {
    try {
      const l = localStorage.getItem(LEVEL_KEY);
      if (l && LEVELS.some((x) => x.id === l)) setLevel(l as typeof level);
      const s = localStorage.getItem(STORIES_KEY);
      if (s) setSaved(JSON.parse(s));
    } catch {}
  }, []);

  const persist = (next: Saved[]) => {
    setSaved(next);
    try {
      localStorage.setItem(STORIES_KEY, JSON.stringify(next));
    } catch {}
  };

  const pickLevel = (id: typeof level) => {
    setLevel(id);
    try {
      localStorage.setItem(LEVEL_KEY, id);
    } catch {}
  };

  async function make() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, theme, idea, known }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Story failed");
      const entry: Saved = { id: String(Date.now()), level, theme, at: Date.now(), scene: data };
      persist([entry, ...saved].slice(0, 6));
      onPlay(data);
    } catch (e) {
      const m = e instanceof Error ? e.message : "Something went wrong";
      setError(
        m.includes("LLM_API_KEY")
          ? "Ajji's AI brain isn't connected yet. Add LLM_API_KEY to .env.local and restart the server."
          : `Ajji couldn't finish the story: ${m}`,
      );
    }
    setLoading(false);
  }

  const chosen = LEVELS.find((l) => l.id === level)!;

  return (
    <div className="mt-6 grid items-start gap-8 xl:grid-cols-[1fr_340px]">
      <div className="rounded-3xl border-2 border-gold bg-gradient-to-br from-navy2 to-ink p-5 sm:p-8">
        <h2 className="text-2xl font-black text-gold">📚 Story Studio</h2>
        <p className="mt-1 font-semibold text-cream/80">
          Pick your level and a theme. Ajji&apos;s AI writes a brand-new story just for you, using the words you already know.
        </p>

        <h3 className="mt-6 text-sm font-black uppercase tracking-widest text-gold/70">1. Your level</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => pickLevel(l.id)}
              className={`rounded-2xl border-2 p-4 text-left transition ${
                level === l.id ? "border-gold bg-gold text-ink shadow-[0_4px_0_#b38f00]" : "border-navy3 bg-navy2/70 text-cream hover:border-gold/60"
              }`}
            >
              <p className="text-3xl">{l.emoji}</p>
              <p className="mt-1 text-xl font-black">
                {l.name} <span className={`text-sm ${level === l.id ? "text-ink/70" : "text-gold"}`}>· {l.cefr}</span>
              </p>
              <p className={`mt-1 text-sm font-semibold ${level === l.id ? "text-ink/80" : "text-cream/70"}`}>{l.desc}</p>
            </button>
          ))}
        </div>

        <h3 className="mt-6 text-sm font-black uppercase tracking-widest text-gold/70">2. What should it be about?</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t.label}
              onClick={() => setTheme(t.label)}
              className={`rounded-full border-2 px-4 py-1.5 text-sm font-black transition ${
                theme === t.label ? "border-gold bg-gold text-ink" : "border-gold/40 text-gold hover:bg-gold/10"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
        <input
          value={idea}
          onChange={(e) => setIdea(e.target.value.slice(0, 100))}
          placeholder="Optional: add your own twist (e.g. a naughty parrot, my cousin's wedding)"
          className="mt-3 w-full rounded-full border-2 border-navy3 bg-ink/60 px-5 py-3 font-bold text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none"
        />

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={make}
            disabled={loading}
            className="rounded-full bg-gold px-8 py-3 text-lg font-black text-ink shadow-[0_5px_0_#b38f00] transition active:translate-y-1 active:shadow-[0_1px_0_#b38f00] disabled:opacity-60"
          >
            {loading ? "✨ Writing your story…" : `✨ Make my ${chosen.name.toLowerCase()} story`}
          </button>
          {loading && (
            <p className="animate-pulse text-sm font-extrabold text-gold">Ajji is dreaming up a story. This takes 10 to 30 seconds.</p>
          )}
        </div>
        {error && <p className="mt-4 rounded-xl border-2 border-flagred/60 bg-flagred/10 px-4 py-3 font-bold text-cream">{error}</p>}

        <p className="mt-6 rounded-xl bg-ink/50 p-3 text-xs font-bold text-cream/60">
          Stories are written by AI to match your level. Kannada can contain mistakes, so treat new words as a guide and check with a native speaker.
        </p>
      </div>

      <aside className="h-fit rounded-3xl border-2 border-navy3 bg-navy2/70 p-5">
        <h3 className="text-lg font-black text-gold">My stories</h3>
        {saved.length === 0 ? (
          <p className="mt-3 text-sm font-semibold text-cream/60">Stories you make show up here so you can replay them.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {saved.map((s) => (
              <li key={s.id} className="rounded-2xl border-2 border-navy3 bg-ink/40 p-3">
                <p className="text-2xl" aria-hidden>
                  {s.scene.art}
                </p>
                <p className="font-black text-gold">{s.scene.title}</p>
                <p className="text-xs font-bold text-cream/60">
                  {s.scene.tag} · {s.theme}
                </p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => onPlay(s.scene)} className="rounded-full bg-gold px-4 py-1 text-sm font-black text-ink">
                    ▶ Play
                  </button>
                  <button
                    onClick={() => persist(saved.filter((x) => x.id !== s.id))}
                    className="rounded-full border-2 border-gold/40 px-3 py-1 text-sm font-black text-gold hover:bg-gold/10"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
