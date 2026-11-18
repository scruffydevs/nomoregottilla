"use client";

import { WORD_BY_ID, WORDS } from "@/data/starter";
import { speak } from "@/lib/voice";

const dayKey = (t: number) => new Date(t).toDateString();
const dayLabel = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeLabel = (t: number) => new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/** A log of every word the learner has marked gottu, grouped by the day they learned it. */
export default function Diary({ learnedAt }: { learnedAt: Record<string, number> }) {
  const entries = Object.entries(learnedAt)
    .filter(([id]) => WORD_BY_ID[id])
    .map(([id, at]) => ({ word: WORD_BY_ID[id], at }))
    .sort((a, b) => b.at - a.at);

  const days: { key: string; at: number; items: typeof entries }[] = [];
  for (const e of entries) {
    const k = dayKey(e.at);
    const last = days[days.length - 1];
    if (last && last.key === k) last.items.push(e);
    else days.push({ key: k, at: e.at, items: [e] });
  }

  return (
    <div className="mx-auto mt-8 grid max-w-6xl gap-8 xl:grid-cols-[1fr_320px]">
      <div className="rounded-3xl border-2 border-gold bg-gradient-to-br from-navy2 to-ink p-5 sm:p-8">
        <div className="flex items-center gap-3 border-b-2 border-gold/20 pb-4">
          <span className="text-4xl" aria-hidden>
            📔
          </span>
          <div>
            <h2 className="text-2xl font-black text-gold">Your diary</h2>
            <p className="text-sm font-semibold text-cream/70">Every word you&apos;ve turned from gottilla into gottu.</p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-navy3 p-8 text-center">
            <p className="text-5xl">✍️</p>
            <p className="mt-3 text-xl font-black text-gold">Nothing written yet</p>
            <p className="mt-1 font-semibold text-cream/70">
              Mark a word as <b className="text-gold">gottu</b> on the Starter tab and Ajji will write it down here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {days.map((d) => (
              <section key={d.key}>
                <h3 className="text-sm font-black uppercase tracking-widest text-gold/70">{dayLabel(d.at)}</h3>
                <ul className="mt-3 space-y-3">
                  {d.items.map(({ word, at }) => (
                    <li
                      key={word.id}
                      className="pop flex items-center gap-4 rounded-2xl border-2 border-gold/40 bg-gold/10 p-4"
                    >
                      <span className="text-3xl" aria-hidden>
                        {word.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-kn text-2xl font-black text-gold">{word.kn}</p>
                        <p className="text-sm font-extrabold italic text-cream/90">
                          {word.rom} <span className="not-italic font-bold text-cream/60">· {word.en}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-cream/60">{timeLabel(at)}</p>
                        <button
                          onClick={() => speak(word.kn)}
                          className="mt-1 rounded-full border-2 border-gold/50 px-3 py-1 text-xs font-black text-gold hover:bg-gold/10"
                        >
                          🔊 Hear
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <aside className="h-fit space-y-4 rounded-3xl border-2 border-navy3 bg-navy2/70 p-5">
        <h3 className="text-lg font-black text-gold">At a glance</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gold p-3 text-ink">
            <p className="text-3xl font-black">{entries.length}</p>
            <p className="text-xs font-extrabold uppercase tracking-wider text-ink/70">Words gottu</p>
          </div>
          <div className="rounded-2xl border-2 border-navy3 p-3">
            <p className="text-3xl font-black text-gold">{days.length}</p>
            <p className="text-xs font-extrabold uppercase tracking-wider text-cream/70">Days learning</p>
          </div>
        </div>
        <p className="text-sm font-semibold text-cream/70">
          {entries.length === WORDS.length
            ? "You've learned every starter word. Ajji is so proud! 🎉"
            : `${WORDS.length - entries.length} starter ${WORDS.length - entries.length === 1 ? "word" : "words"} still to go.`}
        </p>
      </aside>
    </div>
  );
}
