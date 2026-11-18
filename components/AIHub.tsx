"use client";

import { useState } from "react";
import ChatWithAjji from "./ChatWithAjji";
import StoryStudio from "./StoryStudio";
import type { Scene } from "@/data/starter";

/** The AI tab: personalized stories and free chat with Ajji. */
export default function AIHub({ known, onPlay }: { known: string[]; onPlay: (s: Scene) => void }) {
  const [mode, setMode] = useState<"stories" | "chat">("stories");
  return (
    <div>
      <div className="mx-auto mt-8 flex max-w-6xl gap-2">
        {(
          [
            ["stories", "📚 Story Studio"],
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
      {mode === "stories" ? <StoryStudio known={known} onPlay={onPlay} /> : <ChatWithAjji known={known} />}
    </div>
  );
}
