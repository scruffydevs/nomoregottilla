// Pronunciation drills: sound pairs where one small change makes a different word, plus a few app words.
// NOTE: have a native Kannada speaker review these words and tips before the demo.

export type Drill = {
  id: string;
  kn: string;
  rom: string;
  en: string;
  emoji: string;
  group: string; // shown as a label, e.g. "Breathy h vs plain vowel"
  tip: string; // how to make the sound
  partner?: { kn: string; rom: string; en: string; contrast: string }; // the look-alike word and what to adjust if it was heard
};

type W = { kn: string; rom: string; en: string; emoji: string };

function pair(group: string, a: W, b: W, tipA: string, tipB: string, aGotB: string, bGotA: string): Drill[] {
  return [
    { id: `${a.rom}-${a.en}`, ...a, group, tip: tipA, partner: { kn: b.kn, rom: b.rom, en: b.en, contrast: aGotB } },
    { id: `${b.rom}-${b.en}`, ...b, group, tip: tipB, partner: { kn: a.kn, rom: a.rom, en: a.en, contrast: bGotA } },
  ];
}

export const DRILLS: Drill[] = [
  ...pair(
    "Breathy ಹ vs plain vowel ಅ",
    { kn: "ಹಕ್ಕಿ", rom: "hakki", en: "bird", emoji: "🐦" },
    { kn: "ಅಕ್ಕಿ", rom: "akki", en: "rice", emoji: "🍚" },
    "Begin with a breathy 'h'. Hold your palm in front of your mouth: you should feel a puff of air.",
    "Begin straight with the vowel 'a'. No puff of air at the start.",
    "I heard ಅಕ್ಕಿ (rice), which starts with a plain vowel. For ಹಕ್ಕಿ (bird), start with a breathy 'h'.",
    "I heard ಹಕ್ಕಿ (bird), which starts with a breathy 'h'. For ಅಕ್ಕಿ (rice), start straight on the vowel.",
  ),
  ...pair(
    "Short vs long vowel",
    { kn: "ಅಡಿ", rom: "adi", en: "foot", emoji: "🦶" },
    { kn: "ಆಡಿ", rom: "aadi", en: "play", emoji: "⚽" },
    "Keep the vowel short, like the 'a' in 'about'.",
    "Stretch the vowel to 'aa' as in 'father', about twice as long.",
    "I heard the long vowel of ಆಡಿ (play). For ಅಡಿ (foot), keep the vowel short.",
    "I heard the short vowel of ಅಡಿ (foot). For ಆಡಿ (play), hold the vowel longer.",
  ),
  ...pair(
    "Curled ಳ vs plain ಲ",
    { kn: "ಮಳೆ", rom: "maLe", en: "rain", emoji: "🌧️" },
    { kn: "ಮಲೆ", rom: "male", en: "hill", emoji: "⛰️" },
    "ಳ is the curled-tongue 'L': curl the tip of your tongue back and touch the roof of your mouth.",
    "ಲ is the plain 'l': tongue tip forward, touching just behind your upper teeth.",
    "I heard the plain ಲ of ಮಲೆ (hill). For ಮಳೆ (rain), curl your tongue back for ಳ.",
    "I heard the curled ಳ of ಮಳೆ (rain). For ಮಲೆ (hill), keep your tongue tip forward for a plain ಲ.",
  ),
  ...pair(
    "Curled ಳ vs plain ಲ",
    { kn: "ಕಾಲು", rom: "kaalu", en: "leg", emoji: "🦵" },
    { kn: "ಕಾಳು", rom: "kaaLu", en: "grain", emoji: "🌾" },
    "Plain 'l' in the middle: tongue tip forward, just behind your upper teeth.",
    "Curl the tip of your tongue back for the ಳ, touching the roof of your mouth.",
    "I heard the curled ಳ of ಕಾಳು (grain). For ಕಾಲು (leg), use a plain front 'l'.",
    "I heard the plain ಲ of ಕಾಲು (leg). For ಕಾಳು (grain), curl your tongue back for ಳ.",
  ),
  {
    id: "saaku", kn: "ಸಾಕು", rom: "saaku", en: "enough", emoji: "✋", group: "Long vowel",
    tip: "Hold the first vowel a little longer: saa-ku, not sa-ku.",
  },
  {
    id: "dhanyavaada", kn: "ಧನ್ಯವಾದ", rom: "dhanyavaada", en: "thank you", emoji: "💛", group: "Aspirated ಧ",
    tip: "The first sound ಧ is aspirated: say 'd' followed by a soft puff of air.",
  },
  {
    id: "chennaagide", kn: "ಚೆನ್ನಾಗಿದೆ", rom: "chennaagide", en: "it's nice", emoji: "✨", group: "Double consonant",
    tip: "The ನ್ನ is a double 'n': say chen-naa-gi-de, resting a little longer on the 'nn'.",
  },
  {
    id: "namaskaara", kn: "ನಮಸ್ಕಾರ", rom: "namaskaara", en: "hello", emoji: "🙏", group: "Long vowel",
    tip: "Say nam-as-kaa-ra and stretch the long 'kaa' near the end.",
  },
];

/** Strip spaces, punctuation and joiners so the comparison looks only at the letters. */
export const norm = (s: string) => s.normalize("NFC").replace(/[‌‍\s.,!?।'"“”‘’\-–—]/g, "");

function distance(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export type Verdict = "good" | "swapped" | "close" | "off" | "silent";

/** Compare what the speech recogniser heard with the target word. */
export function judge(heard: string, d: Drill): Verdict {
  const h = norm(heard);
  const t = norm(d.kn);
  if (!h) return "silent";
  if (h === t || h.includes(t)) return "good";
  if (d.partner) {
    const p = norm(d.partner.kn);
    if (h === p || h.includes(p)) return "swapped";
  }
  return distance(h, t) <= Math.max(1, Math.floor(t.length / 3)) ? "close" : "off";
}
