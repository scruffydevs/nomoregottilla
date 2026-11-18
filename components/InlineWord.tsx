"use client";

import { useState } from "react";
import { speak } from "@/lib/voice";
import type { Word } from "@/data/starter";

/** A tappable Kannada word: script, pronunciation, and an English gloss that fades once it's known. */
export function InlineWord({ word, isKnown }: { word: Word; isKnown: boolean }) {
  const [peek, setPeek] = useState(false);
  const showEnglish = !isKnown || peek;
  return (
    <button
      onClick={() => {
        speak(word.kn);
        setPeek((p) => !p);
      }}
      className="mx-0.5 inline-flex flex-col items-center rounded-lg border-b-4 border-gold bg-gold/15 px-2.5 py-0.5 align-middle font-bold leading-tight text-gold hover:bg-gold/25"
    >
      <span className="font-kn font-black">{word.kn}</span>
      <span className="text-xs font-extrabold italic tracking-wide text-cream/90">{word.rom}</span>
      {showEnglish && <span className="pop text-xs font-bold text-cream/70">({word.en})</span>}
    </button>
  );
}
