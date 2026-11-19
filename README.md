# NomoreGottilla

**Learn Kannada by hearing Ajji's stories.**

*Gottilla* (ಗೊತ್ತಿಲ್ಲ) means "I don't know" in Kannada. NomoreGottilla turns every *gottilla* into *gottu* (ಗೊತ್ತು), "I know", with spoken stories, a pronunciation coach and an AI grandmother who talks back.

Built for the **Modalapada Multimodal AI Hackathon** (online, two days, teams of 2 to 4), where the challenges centre on Kannada speech, text and images.

> **Status:** a working hackathon prototype. The Kannada has **not yet been reviewed by a native speaker**. See [Limits and honesty notes](#limits-and-honesty-notes).

---

## Contents

- [The idea](#the-idea)
- [Quick tour for reviewers](#quick-tour-for-reviewers)
- [Features](#features)
- [How the AI is used](#how-the-ai-is-used)
- [Run it](#run-it)
- [Configuration](#configuration)
- [Project layout](#project-layout)
- [The dataset](#the-dataset)
- [Limits and honesty notes](#limits-and-honesty-notes)
- [Roadmap](#roadmap)

---

## The idea

Many children of Kannada families understand a little of the language but can't really talk to their grandparents. Word lists and flashcards don't stick, and textbooks feel far from the kitchen table.

NomoreGottilla uses the **diglot weave**: you **hear a story** in a language you already know (English), with the new language (Kannada) woven in a few words at a time. As you learn each word, its English help fades away, until you can follow the Kannada without noticing.

The story is always the same warm setting: Ajji (grandmother) and her grandson in a Karnataka kitchen. A narrator explains each scene in English, and Ajji and the grandson speak real Kannada in natural voices.

## Quick tour for reviewers

If you have two minutes, try these in order:

1. **Starter tab:** in the story box, find a Kannada word with its English hint (for example ಮೊಮ್ಮಗ, *grandson*). Press **Gottilla…** on its word card so it flips to **Gottu!**. The English hint disappears from the story.
2. **Story path tab:** press **Play** on *At the door*. The narrator speaks and then moves on by herself; Ajji and the grandson wait for you to press **Next**.
3. **Story path tab, Story Studio:** pick a level and a theme, and press **Make my story**. An AI writes a new story from the words you know. (Beginner takes about 20 seconds; Confident can take close to a minute.)
4. **Speak with Ajji tab:** in the pronunciation coach, pick **maLe** (rain), press **Say it**, and say **male** (hill) on purpose. Ajji tells you she heard a different word, names the sound that changed and plays her voice next to yours.
5. **Your diary tab:** every word you marked gottu is logged with its date and time.

You need the keys in [Configuration](#configuration) for voices, listening and AI. Without them the app still loads; see [What works without keys](#what-works-without-keys).

## Features

The header has four tabs.

### 📖 Starter

- **Next word to learn:** a hero card with the next word you haven't marked gottu, with pronunciation and meaning.
- **Read the scene:** a short story where each Kannada word is tappable and shows its pronunciation in English letters. Words you mark gottu **lose their English hint** (the diglot weave in action). Each line has its own voice, and **Play the whole scene** reads it all aloud.
- **Talk to Ajji:** short speaking challenges ("Ajji keeps piling on food. Tell her you've had enough!"). Say the word, and if your Kannada contains it, it flips to gottu.
- **12 starter words** as cards: flip to see the meaning, tap to hear Ajji say it.
- Progress is shown as gottu and gottilla counts.

### 🗺️ Story path

- **Five built-in scenes:** *At the door*, *The kitchen*, *Second helpings*, *Tasting time*, *Thank Ajji*. Each unlocks when you've learned the previous scene's words.
- **Scene player:** a narrator sets the scene in English and **moves on automatically** when she finishes speaking. Ajji and the grandson speak in Kannada only at a few key moments, and **wait for you**, so you have time to study the words. Speaking avatars pulse while someone talks.
- **Story Studio:** choose a level and a theme, and an AI writes a new story that plays in the same scene player.
  - **Levels** use CEFR-style bands: 🌱 Beginner (A1), 🌿 Elementary (A2), 🌳 Confident (B1). They change sentence length, how much is Kannada, and how many new words appear.
  - **Themes:** festival, market, cricket, monsoon, bus ride, birthday, or your own twist.
  - The story reuses the words you already know and lists its new words at the end. Your stories are saved in the browser under **My stories**.

### 🗣️ Speak with Ajji

- **Pronunciation coach:** 12 drills, built around *sound pairs* where one small change makes a different word.
  - ಹಕ್ಕಿ / ಅಕ್ಕಿ (*hakki* bird / *akki* rice): breathy ಹ vs a plain vowel
  - ಅಡಿ / ಆಡಿ (*adi* foot / *aadi* play): short vs long vowel
  - ಮಳೆ / ಮಲೆ (*maLe* rain / *male* hill) and ಕಾಲು / ಕಾಳು (*kaalu* leg / *kaaLu* grain): curled-tongue ಳ vs plain ಲ
  - four everyday words with a tricky sound: ಸಾಕು, ಧನ್ಯವಾದ, ಚೆನ್ನಾಗಿದೆ, ನಮಸ್ಕಾರ
- **How a drill goes:** hear Ajji (normal or slow), press **Say it**, press **Done**. Ajji shows what she heard and a verdict. If you said the look-alike word, she names the sound that changed. A reasoning AI adds a short, kind tip about your tongue, lips or breath. Then she says "ಇನ್ನೊಂದು ಸಾರಿ" (*one more time*) and repeats the word slowly. **▶ Ajji** and **▶ You** play both recordings back to back.
- **Chat with Ajji:** type or speak to Ajji in Kannada or English. She replies in one or two short Kannada sentences using mostly words you know, with pronunciation and an English translation, corrects mistakes kindly, and speaks the reply aloud.

### 📔 Your diary

Every word you mark gottu is written into a diary, grouped by day, with the time and a button to hear it again. A side panel shows how many words and days you have.

## How the AI is used

| Where | What the AI does | Model |
|---|---|---|
| Voices (Ajji, grandson, narrator) | Turns Kannada and English text into natural speech | Sarvam **Bulbul** (text-to-speech) |
| Listening (pronunciation coach, chat, Talk to Ajji) | Turns your recorded voice into Kannada text | Sarvam **Saaras** (speech-to-text) |
| Story Studio | Writes a level-appropriate, kid-safe story as structured JSON | Reasoning LLM |
| Chat with Ajji | Replies in simple Kannada and checks your Kannada | Reasoning LLM |
| Pronunciation coach | Explains what to adjust after a miss (the verdict itself is computed in code) | Reasoning LLM |

**The reasoning model** is called through any OpenAI-compatible chat endpoint (`LLM_BASE_URL`, `LLM_MODEL`). It was developed and tested with DeepSeek through OpenRouter. DeepSeek's own API and Google's Gemma models (through an OpenAI-compatible URL) are supported by configuration, but only the DeepSeek route has been tested.

**Design choices worth knowing**
- **The pronunciation verdict is deterministic.** `data/pronunciation.ts` compares what the recogniser heard with the target word (`good`, `swapped` for the look-alike, `close`, `off` or `silent`). The AI only writes the tip, and is told it sees the recogniser's text, never the audio.
- **Regional accents are not mistakes.** Only differences that change the word are flagged, and the AI is told the same.
- **Ajji's spoken reactions use fixed, hand-chosen Kannada phrases** ("ಚೆನ್ನಾಗಿದೆ!", "ಇನ್ನೊಂದು ಸಾರಿ"), so a wrong AI guess can't put a bad Kannada phrase in her mouth in the coach.
- **The microphone path is hardened.** Recordings are converted in the browser to 16 kHz mono WAV, quiet audio is boosted, and silent or very short recordings get a plain message with the recording length and mic level instead of a failed request.
- **Keys never reach the browser.** All Sarvam and LLM calls go through server routes.

## Run it

Requirements: Node.js 20.9 or newer, a [Sarvam AI](https://dashboard.sarvam.ai) API key, and (for the AI features) a key for an OpenAI-compatible chat model.

```bash
npm install
```

Create `.env.local` in the project root (it is gitignored, never commit it):

```bash
SARVAM_API_KEY=your_sarvam_key
LLM_API_KEY=your_llm_key
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=deepseek/deepseek-v4-flash
```

Then start it:

```bash
npm run dev
```

Open http://localhost:3000. The layout is designed for **desktop screens**; it is not mobile friendly yet. Allow the microphone when the browser asks.

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

### What works without keys

| Missing | What still works | What doesn't |
|---|---|---|
| Both keys | Word cards, story text, diary, progress, the scene player (with the browser's built-in voice as a fallback, which may not have Kannada) | Natural voices, listening, AI features |
| `LLM_API_KEY` only | Everything except the AI features, including the pronunciation coach's verdict and built-in tips | Story Studio and Chat with Ajji show a clear "not connected" message; the coach's extra AI tip is simply left out |

## Configuration

All settings are environment variables in `.env.local`.

| Variable | Default | Purpose |
|---|---|---|
| `SARVAM_API_KEY` | none (required) | Voices and listening |
| `SARVAM_TTS_MODEL` | `bulbul:v4-flash` | Kannada text-to-speech model |
| `SARVAM_STT_MODEL` | `saaras:v4` | Speech-to-text model |
| `SARVAM_AJJI_SPEAKER` | `chaitra_kn_narration` | Ajji's voice (the slow voice uses it too) |
| `SARVAM_AJJI_PACE` | `0.8` | Ajji's speaking speed |
| `SARVAM_GRANDSON_SPEAKER` | `chetan_kn_conversation` | The grandson's voice |
| `SARVAM_GRANDSON_PACE` | `1.0` | The grandson's speed |
| `SARVAM_NARRATOR_SPEAKER` | `ritu` | The English narrator's voice |
| `SARVAM_NARRATOR_PACE` | `0.95` | The narrator's speed |
| `SARVAM_NARRATOR_MODEL` | `bulbul:v3` | The narrator's model (English, `en-IN`) |
| `LLM_API_KEY` | none | Key for the reasoning model |
| `LLM_BASE_URL` | `https://api.deepseek.com` | Any OpenAI-compatible chat endpoint |
| `LLM_MODEL` | `deepseek-reasoner` | Model name at that endpoint |

Sarvam does not label its Kannada voices by age or gender, so Ajji's voice is a calm narrator voice at a slower pace, not a confirmed "older" voice. Try other speakers by changing `SARVAM_AJJI_SPEAKER`.

## Project layout

```
app/
  page.tsx, layout.tsx, globals.css   the page shell and the blue and yellow theme
  api/tts/      text to speech (Sarvam Bulbul): Ajji, slow Ajji, grandson, narrator
  api/stt/      speech to text (Sarvam Saaras)
  api/ai/       Chat with Ajji (reasoning model)
  api/story/    Story Studio: writes and validates a story
  api/coach/    the pronunciation coach's AI tip
components/
  Dashboard.tsx          header tabs, Starter tab, Story path tab, diary state
  ScenePlayer.tsx        narrator + dialogue player, built-in and AI stories
  StoryStudio.tsx        levels, themes, saved stories
  AjjiHub.tsx            "Speak with Ajji": switch between coach and chat
  PronunciationCoach.tsx drills, recording, verdicts, playback
  ChatWithAjji.tsx       the chat
  Diary.tsx              the word diary
  InlineWord.tsx         a tappable word whose English hint fades
  Avatar.tsx, Logo.tsx   speaking avatars and the logo
data/
  starter.ts             words, scenes and dialogue (needs native review)
  pronunciation.ts       the 12 drills and the verdict logic
lib/
  voice.ts               playback, recording, 16 kHz WAV conversion
  llm.ts                 shared call to the reasoning model
dataset/                 the released dataset (see below)
scripts/
  build-dataset.mjs      builds the dataset from data/
  dataset-readme.mjs     writes the dataset datasheet
```

Progress (known words, saved stories, diary dates, pronunciation progress, your level) is stored in the browser's `localStorage`. Nothing is saved on a server.

## The dataset

A small, openly documented Kannada dataset built from the app's own content:

- **31 items:** 12 starter words, 8 sound-pair words and 11 dialogue lines
- Kannada text (UTF-8), romanization and English for every item
- **51 audio clips** (about 35 seconds of normal-speed audio), all **16 kHz mono 16-bit WAV**, with a slow clip for every word
- A datasheet covering provenance, columns, consent, limits and quality

The audio is **synthetic** (Sarvam Bulbul), so there are no human voices or personal data. Every clip was transcribed again by speech recognition as an automatic label check: **28 of 31 matched exactly**, and the 3 that did not are listed in the datasheet. **A native-speaker review is still pending.**

Read the full datasheet: [`dataset/README.md`](dataset/README.md). Data files: [`dataset/metadata.csv`](dataset/metadata.csv) and [`dataset/metadata.jsonl`](dataset/metadata.jsonl).

Rebuild it (needs `SARVAM_API_KEY` and a Node.js version that can run TypeScript files directly; it was built with Node 24):

```bash
node --env-file=.env.local scripts/build-dataset.mjs
```

## Limits and honesty notes

- **The Kannada is a draft.** The words, dialogue lines, romanization and pronunciation tips were written by the project team with AI help and have **not been checked by a native speaker**. Treat them as a draft until they have been.
- **AI-written Kannada can contain mistakes.** Story Studio and the chat tell the AI to prefer simple words it is sure about, and the app says so on screen, but nothing guarantees accuracy. The AI's feedback in the chat can also be too lenient.
- **The coach does not measure sounds.** It works from the text the speech recogniser heard, not from analysing your audio. It catches wrong-word and sound-swap mistakes (for example ಮಲೆ for ಮಳೆ), but it does not score individual sounds. Short real-world recordings can also be misheard.
- **Voices are synthetic**, and have only been checked by machine (speech recognition re-listening to them), not by a human ear.
- **Images are not part of the app yet.** Scenes use emoji art. The app uses speech and text; see the roadmap.
- **Desktop only.** The layout is not designed for phones.
- **Story Studio is slow at higher levels** (about 20 seconds for Beginner, up to a minute for Confident).
- **Browser-based progress.** Clearing site data in the browser clears your progress.
- **Privacy.** Your recordings are sent to Sarvam for transcription and are not stored by the app. API keys stay on the server.
- **No licence has been chosen yet,** so by default all rights are reserved. Before reuse, ask the authors, and check Sarvam AI's terms for generated audio.

## Roadmap

- Get the Kannada reviewed by native speakers and fix what they find
- **Images:** real scene illustrations with tappable objects, and a camera mode where Ajji names what you point at
- Phoneme-level pronunciation feedback
- More chapters (the market, festival day, folk tales) and more sound pairs
- Add the AI story words to the word bank so they can flip to gottu
- Sync progress across devices and make the layout mobile friendly
- Choose a licence and publish the dataset to a data hub
