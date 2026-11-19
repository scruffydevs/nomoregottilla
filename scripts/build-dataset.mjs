// Builds the NomoreGottilla Kannada learner dataset from the app's own data files.
//
//   node --env-file=.env.local scripts/build-dataset.mjs
//
// Needs SARVAM_API_KEY. Writes ./dataset (text metadata + 16 kHz mono WAV audio) and checks every
// clip by transcribing it again with Sarvam speech-to-text. The Kannada is NOT yet native-reviewed.

import { mkdir, writeFile, rm } from "node:fs/promises";
import { WORDS, SCENES, DIALOGUE } from "../data/starter.ts";
import { DRILLS, norm } from "../data/pronunciation.ts";

const KEY = process.env.SARVAM_API_KEY;
if (!KEY) throw new Error("SARVAM_API_KEY is not set (run with --env-file=.env.local)");

const OUT = new URL("../dataset/", import.meta.url);
const MODEL = "bulbul:v4-flash";
const VOICES = {
  ajji: { speaker: "chaitra_kn_narration", pace: 0.8 },
  ajji_slow: { speaker: "chaitra_kn_narration", pace: 0.6 },
  grandson: { speaker: "chetan_kn_conversation", pace: 1.0 },
};

// Romanization and English for every spoken dialogue line in the app. The build stops if the app
// has a line that is missing here, so the dataset always covers everything the learner hears.
const LINES = [
  { scene: "scene1", role: "ajji", kn: "ನಮಸ್ಕಾರ ಮೊಮ್ಮಗ! ಒಳಗೆ ಬಾ.", rom: "namaskaara mommaga! olage baa.", en: "Hello, grandson! Come inside." },
  { scene: "scene1", role: "grandson", kn: "ನಮಸ್ಕಾರ ಅಜ್ಜಿ!", rom: "namaskaara ajji!", en: "Hello, grandmother!" },
  { scene: "scene2", role: "ajji", kn: "ಊಟ ಆಯ್ತಾ? ತಗೋ, ತಿನ್ನು. ನೀರು ಬೇಕಾ?", rom: "oota aaytaa? tago, tinnu. neeru bekaa?", en: "Have you had your meal? Here, eat. Do you want water?" },
  { scene: "scene3", role: "ajji", kn: "ಇನ್ನೂ ಸ್ವಲ್ಪ ತಗೋ!", rom: "innu swalpa tago!", en: "Take a little more!" },
  { scene: "scene3", role: "grandson", kn: "ಇಲ್ಲ ಅಜ್ಜಿ, ಸಾಕು!", rom: "illa ajji, saaku!", en: "No, grandmother, enough!" },
  { scene: "scene4", role: "ajji", kn: "ಚೆನ್ನಾಗಿದೆಯಾ?", rom: "chennaagideyaa?", en: "Is it nice?" },
  { scene: "scene4", role: "grandson", kn: "ಹೌದು ಅಜ್ಜಿ, ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ!", rom: "haudu ajji, tumbaa chennaagide!", en: "Yes, grandmother, it is very nice!" },
  { scene: "scene5", role: "ajji", kn: "ಮತ್ತೆ ಬಾ ಮೊಮ್ಮಗ!", rom: "matte baa mommaga!", en: "Come again, grandson!" },
  { scene: "scene5", role: "grandson", kn: "ಧನ್ಯವಾದ ಅಜ್ಜಿ!", rom: "dhanyavaada ajji!", en: "Thank you, grandmother!" },
  { scene: "preview", role: "ajji", kn: "ಬಾ ಮೊಮ್ಮಗ! ಕೂತ್ಕೋ. ಊಟ ಆಯ್ತಾ? ತಗೋ, ತಿನ್ನು!", rom: "baa mommaga! kootko. oota aaytaa? tago, tinnu!", en: "Come, grandson! Sit down. Have you had your meal? Here, eat!" },
  { scene: "preview", role: "grandson", kn: "ಚೆನ್ನಾಗಿದೆ ಅಜ್ಜಿ! ಸಾಕು ಅಜ್ಜಿ!", rom: "chennaagide ajji! saaku ajji!", en: "It's nice, grandmother! Enough, grandmother!" },
];

// Every line the app speaks must be in LINES.
const appLines = new Set([
  ...DIALOGUE.map((d) => d.say),
  ...SCENES.flatMap((s) => s.beats.filter((b) => b.kind === "dialogue").map((b) => b.say)),
]);
for (const say of appLines) {
  if (!LINES.some((l) => l.kn === say)) throw new Error(`Dialogue line missing from LINES: ${say}`);
}

// ---- Build the item list -------------------------------------------------------------------
const items = [];
const tipFor = new Map(DRILLS.map((d) => [d.kn, d]));

for (const w of WORDS) {
  const drill = tipFor.get(w.kn);
  items.push({
    id: `word-${w.id}`, type: "starter_word", kn: w.kn, rom: w.rom, en: w.en, voice: "ajji", slow: true,
    tip: drill?.tip ?? "", group: drill?.group ?? "", source: "app starter vocabulary",
  });
}
const starterKn = new Set(WORDS.map((w) => w.kn));
for (const d of DRILLS) {
  if (starterKn.has(d.kn)) continue; // already included as a starter word
  items.push({
    // Named by meaning, not spelling: maLe/male and kaaLu/kaalu differ only by letter case, and Windows
    // file names are case-insensitive, so those clips would overwrite each other.
    id: `pair-${d.en.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, type: "sound_pair_word", kn: d.kn, rom: d.rom, en: d.en, voice: "ajji", slow: true,
    tip: d.tip, group: d.group,
    pairId: [d.rom, d.partner.rom].sort().join("_vs_"),
    partner: d.partner, source: "app pronunciation drills",
  });
}
LINES.forEach((l, i) => {
  items.push({
    id: `line-${l.scene}-${l.role}-${String(i + 1).padStart(2, "0")}`, type: "dialogue_line", kn: l.kn, rom: l.rom, en: l.en,
    voice: l.role, slow: false, scene: l.scene, role: l.role, source: "app story dialogue",
  });
});

// Ids become file names, so they must be unique even when case is ignored (Windows, macOS).
const seenIds = new Set();
for (const it of items) {
  const k = it.id.toLowerCase();
  if (seenIds.has(k)) throw new Error(`Duplicate id (case-insensitive): ${it.id}`);
  seenIds.add(k);
}

// ---- Sarvam helpers ------------------------------------------------------------------------
async function tts(text, v) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: { "api-subscription-key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text, language_code: "kn-IN", model: MODEL, speaker: v.speaker, pace: v.pace,
        speech_sample_rate: 16000, output_audio_codec: "wav",
      }),
    });
    if (res.ok) return Buffer.from((await res.json()).audios[0], "base64");
    if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 1500 * attempt)); continue; }
    throw new Error(`TTS failed ${res.status}: ${await res.text()}`);
  }
  throw new Error("TTS kept failing for: " + text);
}

async function asr(wav) {
  const form = new FormData();
  form.append("file", new Blob([wav], { type: "audio/wav" }), "clip.wav");
  form.append("model", "saaras:v4");
  form.append("mode", "transcribe");
  form.append("language_code", "kn-IN");
  const res = await fetch("https://api.sarvam.ai/speech-to-text", { method: "POST", headers: { "api-subscription-key": KEY }, body: form });
  if (!res.ok) return null;
  return (await res.json()).transcript ?? "";
}

/** Read the WAV header; the dataset guidelines ask for 16 kHz mono. */
function wavInfo(buf) {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") throw new Error("not a WAV file");
  let pos = 12, fmt = null, dataBytes = 0;
  while (pos + 8 <= buf.length) {
    const id = buf.toString("ascii", pos, pos + 4);
    let size = buf.readUInt32LE(pos + 4);
    if (id === "fmt ") fmt = { channels: buf.readUInt16LE(pos + 10), rate: buf.readUInt32LE(pos + 12), bits: buf.readUInt16LE(pos + 22) };
    if (id === "data") { dataBytes = Math.min(size, buf.length - pos - 8); break; }
    pos += 8 + size + (size % 2);
  }
  if (!fmt) throw new Error("no fmt chunk");
  return { ...fmt, seconds: dataBytes / (fmt.rate * fmt.channels * (fmt.bits / 8)) };
}

// ---- Generate ------------------------------------------------------------------------------
await rm(OUT, { recursive: true, force: true });
for (const d of ["audio/words", "audio/words_slow", "audio/lines"]) await mkdir(new URL(d + "/", OUT), { recursive: true });

async function pool(list, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < list.length) { const item = list[i++]; await fn(item); } }));
}

await pool(items, 3, async (it) => {
  const dir = it.type === "dialogue_line" ? "lines" : "words";
  it.audioFile = `audio/${dir}/${it.id}.wav`;
  const normal = await tts(it.kn, VOICES[it.voice]);
  const info = wavInfo(normal);
  if (info.rate !== 16000 || info.channels !== 1 || info.bits !== 16) throw new Error(`${it.id}: expected 16 kHz mono 16-bit, got ${JSON.stringify(info)}`);
  await writeFile(new URL(it.audioFile, OUT), normal);
  it.seconds = Math.round(info.seconds * 100) / 100;

  if (it.slow) {
    it.audioSlowFile = `audio/words_slow/${it.id}.wav`;
    const slow = await tts(it.kn, VOICES.ajji_slow);
    const si = wavInfo(slow);
    if (si.rate !== 16000 || si.channels !== 1 || si.bits !== 16) throw new Error(`${it.id} slow: bad format ${JSON.stringify(si)}`);
    await writeFile(new URL(it.audioSlowFile, OUT), slow);
  }

  // Automatic label check: does speech recognition hear the text we think we recorded?
  const heard = await asr(normal);
  it.asr = heard ?? "";
  const h = norm(it.asr), t = norm(it.kn);
  it.asrMatch = heard === null ? "asr_error" : h === t || h.includes(t) ? "match" : "mismatch";
  console.log(`${it.asrMatch.padEnd(8)} ${it.id}  ${it.kn}  ->  ${it.asr}`);
});

// ---- Write metadata ------------------------------------------------------------------------
const order = { starter_word: 0, sound_pair_word: 1, dialogue_line: 2 };
items.sort((a, b) => order[a.type] - order[b.type] || a.id.localeCompare(b.id));

const cols = [
  "id", "type", "text_kn", "romanization", "english", "speaker_voice", "scene", "speaker_role",
  "pair_id", "pair_partner_kn", "pair_partner_romanization", "pair_partner_english", "pronunciation_tip", "practice_group",
  "audio_file", "audio_slow_file", "sample_rate_hz", "channels", "bit_depth", "duration_s",
  "asr_transcript", "asr_check", "review_status", "synthetic_audio", "source",
];
const rows = items.map((it) => ({
  id: it.id, type: it.type, text_kn: it.kn, romanization: it.rom, english: it.en,
  speaker_voice: `${VOICES[it.voice].speaker} (${it.voice === "grandson" ? "grandson" : "Ajji"})`,
  scene: it.scene ?? "", speaker_role: it.role ?? "",
  pair_id: it.pairId ?? "", pair_partner_kn: it.partner?.kn ?? "", pair_partner_romanization: it.partner?.rom ?? "", pair_partner_english: it.partner?.en ?? "",
  pronunciation_tip: it.tip ?? "", practice_group: it.group ?? "",
  audio_file: it.audioFile, audio_slow_file: it.audioSlowFile ?? "", sample_rate_hz: 16000, channels: 1, bit_depth: 16, duration_s: it.seconds,
  asr_transcript: it.asr, asr_check: it.asrMatch, review_status: "pending_native_review", synthetic_audio: "true (Sarvam Bulbul TTS)", source: it.source,
}));

const esc = (v) => `"${String(v).replaceAll('"', '""')}"`;
await writeFile(new URL("metadata.csv", OUT), [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n", "utf8");
await writeFile(new URL("metadata.jsonl", OUT), rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");

const count = (t) => rows.filter((r) => r.type === t).length;
const summary = {
  items: rows.length, starter_words: count("starter_word"), sound_pair_words: count("sound_pair_word"), dialogue_lines: count("dialogue_line"),
  audio_clips: rows.length + rows.filter((r) => r.audio_slow_file).length,
  total_audio_seconds: Math.round(items.reduce((s, i) => s + i.seconds, 0) * 10) / 10,
  asr_match: rows.filter((r) => r.asr_check === "match").length,
  asr_mismatch: rows.filter((r) => r.asr_check === "mismatch").length,
  asr_error: rows.filter((r) => r.asr_check === "asr_error").length,
};
await writeFile(new URL("summary.json", OUT), JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log("\n" + JSON.stringify(summary, null, 2));
await import("./dataset-readme.mjs"); // write dataset/README.md from the fresh metadata
