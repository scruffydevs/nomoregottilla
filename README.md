# NomoreGottilla

Learn Kannada through Ajji's stories. Every *gottilla* (ಗೊತ್ತಿಲ್ಲ, "I don't know") becomes *gottu* (ಗೊತ್ತು, "I know").

Built for the Modalapada multimodal AI hackathon with Next.js, Tailwind and Sarvam AI (Bulbul text-to-speech, Saaras speech-to-text).

## Run it

```bash
npm install
```

Create `.env.local` (never commit it):

```
SARVAM_API_KEY=your_key_from_dashboard.sarvam.ai
```

Optional voice overrides: `SARVAM_AJJI_SPEAKER`, `SARVAM_AJJI_PACE`, `SARVAM_GRANDSON_SPEAKER`, `SARVAM_NARRATOR_SPEAKER`.

```bash
npm run dev
```

## Where things are

- `data/starter.ts`: words, story scenes and dialogue. The Kannada lines need a native-speaker review.
- `components/ScenePlayer.tsx`: the scene player (English narrator, Kannada dialogue).
- `app/api/tts`, `app/api/stt`: server routes that call Sarvam so the key stays off the browser.
- `lib/voice.ts`: playback, recording and the browser-voice fallback.
