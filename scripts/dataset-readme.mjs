// Writes dataset/README.md (the datasheet) from dataset/metadata.jsonl and dataset/summary.json.
//   node scripts/dataset-readme.mjs
import { readFile, writeFile } from "node:fs/promises";

const dir = new URL("../dataset/", import.meta.url);
const rows = (await readFile(new URL("metadata.jsonl", dir), "utf8")).trim().split("\n").map((l) => JSON.parse(l));
const s = JSON.parse(await readFile(new URL("summary.json", dir), "utf8"));

const mismatches = rows.filter((r) => r.asr_check === "mismatch");
const mismatchList = mismatches.length
  ? mismatches.map((r) => `- \`${r.id}\`: text \`${r.text_kn}\`, recogniser heard \`${r.asr_transcript}\``).join("\n")
  : "- none";

const md = `# NomoreGottilla Kannada Learner Dataset (v0.1)

A small, clean Kannada dataset built for **NomoreGottilla**, an app that teaches Kannada through spoken stories
(the "diglot weave": hear a story in English with Kannada woven in) and a pronunciation coach. Every item pairs
**Kannada text (Unicode UTF-8)**, a **romanization**, an **English translation** and a **spoken audio clip**.

## What is inside

| Part | Count | What it is |
|---|---|---|
| Starter words | ${s.starter_words} | Everyday words a beginner meets first (ಅಜ್ಜಿ, ನೀರು, ಸಾಕು, ಧನ್ಯವಾದ…) |
| Sound-pair words | ${s.sound_pair_words} | Look-alike words that differ by one sound, for pronunciation practice: ಹಕ್ಕಿ / ಅಕ್ಕಿ (breathy ಹ vs plain vowel), ಅಡಿ / ಆಡಿ (short vs long vowel), ಮಳೆ / ಮಲೆ and ಕಾಲು / ಕಾಳು (curled ಳ vs plain ಲ) |
| Dialogue lines | ${s.dialogue_lines} | Short spoken lines between a grandmother (Ajji) and her grandson, from the app's stories |
| **Total items** | **${s.items}** | |
| Audio clips | ${s.audio_clips} | One normal-speed clip per item, plus a slow clip for every word (${s.total_audio_seconds} s of normal-speed audio) |

## Files

\`\`\`
metadata.csv        one row per item (UTF-8, comma separated, text fields quoted)
metadata.jsonl      the same rows as JSON lines
summary.json        counts and the automatic label-check totals
audio/words/        normal-speed word clips
audio/words_slow/   slow word clips (for pronunciation practice)
audio/lines/        dialogue line clips
\`\`\`

### Columns

| Column | Meaning |
|---|---|
| \`id\` | Stable id; also the audio file name |
| \`type\` | \`starter_word\`, \`sound_pair_word\` or \`dialogue_line\` |
| \`text_kn\` | The Kannada text, Unicode UTF-8 (no legacy font encodings) |
| \`romanization\` | Readable English-letter spelling. Capital \`L\` marks the curled-tongue ಳ (\`maLe\` = ಮಳೆ, rain; \`male\` = ಮಲೆ, hill) |
| \`english\` | English meaning or translation |
| \`speaker_voice\` | The synthetic voice used (see Provenance) |
| \`scene\`, \`speaker_role\` | For dialogue lines: the story scene and who speaks (\`ajji\` or \`grandson\`) |
| \`pair_id\`, \`pair_partner_*\` | For sound-pair words: the look-alike word it is paired with |
| \`pronunciation_tip\`, \`practice_group\` | A plain-English tip for making the sound, and the sound being practised |
| \`audio_file\`, \`audio_slow_file\` | Paths to the clips, relative to this folder |
| \`sample_rate_hz\`, \`channels\`, \`bit_depth\`, \`duration_s\` | Audio format: **16 kHz, mono, 16-bit WAV**; length of the normal-speed clip |
| \`asr_transcript\`, \`asr_check\` | What speech recognition heard when it re-listened to the clip, and \`match\` / \`mismatch\` against the text |
| \`review_status\` | \`pending_native_review\` for every row (see Quality) |
| \`synthetic_audio\` | Always true: the audio is generated speech, not a human recording |
| \`source\` | Where in the app the item comes from |

## Provenance and consent

- **Text** was written by the project team with AI assistance, for the app's lessons. Nothing was scraped or copied from other datasets.
- **Audio** is **synthetic speech** generated with Sarvam AI's Bulbul text-to-speech (\`bulbul:v4-flash\`, voices \`chaitra_kn_narration\` for Ajji and \`chetan_kn_conversation\` for the grandson).
- **No human voices, no photos, no handwriting and no personal data** are included, so there was no one to ask for consent and nothing to blur or remove.

## Quality, and what is still missing

- **Automatic check:** every normal-speed clip was transcribed again with Sarvam speech-to-text. **${s.asr_match} of ${s.items}** came back as the same text (ignoring punctuation). **${s.asr_mismatch}** did not:

${mismatchList}

  These are worth a human look. A mismatch is usually a recognition slip on a very short word, or a spoken-style spelling variant, rather than a wrong clip, but only a native speaker can say. The synthetic voices can differ slightly between builds, so this list can change when the dataset is rebuilt.
- **Native-speaker review has not happened yet.** Every row is marked \`pending_native_review\`. The words are everyday Kannada, but treat the labels, tips and romanization as a **draft until a native speaker has checked them**.
- The automatic check only shows that the audio and text agree. It does not prove the Kannada is natural or the pronunciation tips are ideal.

## Limits

- Small by design: ${s.items} items, about ${s.total_audio_seconds} seconds of audio.
- Two synthetic voices only, no regional or age variety. Not suitable for training a speech recogniser on its own.
- Regional accents are not errors; the sound-pair items teach contrasts that change the *word*, not accent differences.

## Intended use

Kannada learning apps, pronunciation drills with minimal pairs, and checking speech tools on clean everyday Kannada.

## Licence

Not yet chosen by the authors. Before any public release, pick a licence and check Sarvam AI's terms for sharing audio generated with their text-to-speech.

## Rebuild it

\`\`\`bash
node --env-file=.env.local scripts/build-dataset.mjs   # needs SARVAM_API_KEY
node scripts/dataset-readme.mjs
\`\`\`

The build reads the words, sound pairs and dialogue straight from the app's own data files (\`data/\`), so the dataset and the app stay in step.
`;

await writeFile(new URL("README.md", dir), md, "utf8");
console.log("wrote dataset/README.md");
