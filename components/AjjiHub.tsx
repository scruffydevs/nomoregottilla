"use client";

import { useState } from "react";
import ChatWithAjji from "./ChatWithAjji";
import PronunciationCoach from "./PronunciationCoach";

/** One place to talk to Ajji: drill pronunciation with her, or just chat. */
export default function AjjiHub({ known }: { known: string[] }) {
  const [mode, setMode] = useState<"coach" | "chat">("coach");
  return (
    <div>
      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["coach", "🎙️ Pronunciation coach"],
            ["chat", "💬 Chat with Ajji"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`rounded-full border-2 px-5 py-2 text-base font-black transition ${
              mode === id ? "border-gold bg-gold text-ink" : "border-gold/40 text-gold hover:bg-gold/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "coach" ? <PronunciationCoach /> : <ChatWithAjji known={known} />}
    </div>
  );
}
