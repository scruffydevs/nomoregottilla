"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { speak, startRecording, transcribe } from "@/lib/voice";

type Reply = {
  kn: string;
  rom: string;
  en: string;
  feedback?: string | null;
  newWords?: { kn: string; rom: string; en: string }[];
};
type Msg = { role: "you"; text: string } | { role: "ajji"; reply: Reply } | { role: "error"; text: string };

const OPENER: Reply = {
  kn: "ನಮಸ್ಕಾರ ಮೊಮ್ಮಗ! ಊಟ ಆಯ್ತಾ?",
  rom: "namaskaara mommaga! oota aaytaa?",
  en: "Hello, mommaga! Have you had your meal?",
};

const SUGGESTIONS = ["ನಮಸ್ಕಾರ ಅಜ್ಜಿ!", "ಹೌದು ಅಜ್ಜಿ", "ಸಾಕು ಅಜ್ಜಿ!", "What are you cooking, Ajji?"];

export default function ChatWithAjji({ known }: { known: string[] }) {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "ajji", reply: OPENER }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState<Awaited<ReturnType<typeof startRecording>> | null>(null);
  const [talking, setTalking] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, thinking]);

  async function send(text: string) {
    const t = text.trim();
    if (!t || thinking) return;
    const next: Msg[] = [...msgs, { role: "you", text: t }];
    setMsgs(next);
    setInput("");
    setThinking(true);
    try {
      const history = next
        .filter((m) => m.role !== "error")
        .map((m) =>
          m.role === "you"
            ? { role: "user" as const, content: m.text }
            : { role: "assistant" as const, content: m.role === "ajji" ? `${m.reply.kn} (${m.reply.en})` : "" },
        );
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, known }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI error");
      setMsgs((m) => [...m, { role: "ajji", reply: data }]);
      setThinking(false);
      setTalking(true);
      await speak(data.kn, "ajji");
      setTalking(false);
    } catch (e) {
      setThinking(false);
      setTalking(false);
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setMsgs((m) => [
        ...m,
        {
          role: "error",
          text: msg.includes("LLM_API_KEY")
            ? "Ajji's AI brain isn't connected yet. Add LLM_API_KEY to .env.local and restart the server."
            : `Ajji got confused: ${msg}`,
        },
      ]);
    }
  }

  async function toggleMic() {
    if (listening) {
      listening.stop();
      const rec = listening;
      setListening(null);
      try {
        const heard = await transcribe(await rec.done);
        if (heard) await send(heard);
      } catch {
        setMsgs((m) => [...m, { role: "error", text: "Ajji couldn't hear that. Try once more, speaking a little closer to the microphone." }]);
      }
      return;
    }
    try {
      setListening(await startRecording());
    } catch {
      setMsgs((m) => [...m, { role: "error", text: "Couldn't open the microphone. Allow mic access and try again." }]);
    }
  }

  return (
    <div className="mx-auto mt-8 grid max-w-6xl gap-8 xl:grid-cols-[1fr_320px]">
      <div className="flex min-h-[32rem] flex-col rounded-3xl border-2 border-gold bg-gradient-to-br from-navy2 to-ink p-5 sm:p-6">
        <div className="flex items-center gap-3 border-b-2 border-gold/20 pb-4">
          <Avatar emoji="👵" size="lg" active={thinking || talking} />
          <div>
            <h2 className="text-2xl font-black text-gold">Chat with Ajji</h2>
            <p className="text-xs font-extrabold uppercase tracking-wider text-cream/60">
              {thinking ? "Ajji is thinking…" : talking ? "Ajji is talking…" : listening ? "Ajji is listening…" : "AI-powered · speak or type"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1" style={{ maxHeight: "34rem" }}>
          {msgs.map((m, i) =>
            m.role === "you" ? (
              <div key={i} className="pop ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-gold px-4 py-3 text-lg font-bold text-ink">
                {m.text}
              </div>
            ) : m.role === "error" ? (
              <p key={i} className="pop rounded-2xl border-2 border-flagred/60 bg-flagred/10 px-4 py-3 font-bold text-cream">
                {m.text}
              </p>
            ) : (
              <div key={i} className="pop max-w-[88%]">
                <div className="rounded-2xl rounded-bl-sm border-2 border-navy3 bg-navy2/80 px-4 py-3">
                  <p className="font-kn text-2xl font-black text-gold">{m.reply.kn}</p>
                  <p className="mt-0.5 text-sm font-extrabold italic text-cream/90">{m.reply.rom}</p>
                  <p className="mt-1 text-base font-semibold text-cream/70">{m.reply.en}</p>
                  <button onClick={() => speak(m.reply.kn, "ajji")} className="mt-2 text-sm font-black text-gold hover:underline">
                    🔊 Hear again
                  </button>
                </div>
                {m.reply.feedback && (
                  <p className="mt-2 rounded-xl border-2 border-gold/40 bg-gold/10 px-3 py-2 text-sm font-bold text-cream">
                    💡 {m.reply.feedback}
                  </p>
                )}
                {!!m.reply.newWords?.length && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.reply.newWords.map((w, j) => (
                      <button
                        key={j}
                        onClick={() => speak(w.kn, "ajji")}
                        className="rounded-lg border-b-4 border-gold bg-gold/15 px-2.5 py-0.5 text-left text-gold"
                        title="Tap to hear"
                      >
                        <span className="font-kn block font-black">{w.kn}</span>
                        <span className="block text-xs font-extrabold italic text-cream/90">{w.rom}</span>
                        <span className="block text-xs font-bold text-cream/70">({w.en})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}
          {thinking && (
            <div className="pop flex items-center gap-2 text-gold">
              <span className="animate-pulse text-2xl">👵</span>
              <span className="font-extrabold">Ajji is thinking…</span>
            </div>
          )}
          <div ref={end} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={thinking}
              className="font-kn rounded-full border-2 border-gold/40 px-3 py-1 text-sm font-bold text-gold hover:bg-gold/10 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 flex gap-2"
        >
          <button
            type="button"
            onClick={toggleMic}
            disabled={thinking}
            className={`shrink-0 rounded-full px-5 py-3 text-base font-black disabled:opacity-40 ${
              listening ? "animate-pulse bg-flagred text-white" : "bg-gold text-ink"
            }`}
          >
            {listening ? "⏹ Done" : "🎤 Speak"}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type to Ajji in Kannada or English…"
            className="font-kn min-w-0 flex-1 rounded-full border-2 border-navy3 bg-ink/60 px-5 py-3 text-lg font-bold text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={thinking || !input.trim()}
            className="shrink-0 rounded-full bg-gold px-6 py-3 text-base font-black text-ink disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>

      <aside className="h-fit rounded-3xl border-2 border-navy3 bg-navy2/70 p-5">
        <h3 className="text-lg font-black text-gold">How Ajji's AI works</h3>
        <ol className="mt-3 space-y-3 text-sm font-semibold text-cream/80">
          <li>🎤 <b className="text-gold">You speak.</b> Sarvam turns your Kannada into text.</li>
          <li>🧠 <b className="text-gold">Ajji thinks.</b> A reasoning AI checks your Kannada and writes a short reply using the words you know.</li>
          <li>🔊 <b className="text-gold">Ajji talks.</b> Sarvam speaks her reply aloud.</li>
        </ol>
        <p className="mt-4 rounded-xl bg-ink/50 p-3 text-xs font-bold text-cream/60">
          AI-written Kannada can contain mistakes. Ajji sticks to simple words, but check anything new with a native speaker.
        </p>
      </aside>
    </div>
  );
}
