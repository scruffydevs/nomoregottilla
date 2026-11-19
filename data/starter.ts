// Starter chapter content. NOTE: have a native Kannada speaker review these before the demo.

export type Word = { id: string; kn: string; rom: string; en: string; emoji: string };

export const WORDS: Word[] = [
  { id: "namaskaara", kn: "ನಮಸ್ಕಾರ", rom: "namaskaara", en: "hello", emoji: "🙏" },
  { id: "ajji", kn: "ಅಜ್ಜಿ", rom: "ajji", en: "grandmother", emoji: "👵" },
  { id: "mommaga", kn: "ಮೊಮ್ಮಗ", rom: "mommaga", en: "grandson", emoji: "🧒" },
  { id: "oota", kn: "ಊಟ", rom: "oota", en: "meal / food", emoji: "🍛" },
  { id: "tinnu", kn: "ತಿನ್ನು", rom: "tinnu", en: "eat!", emoji: "😋" },
  { id: "neeru", kn: "ನೀರು", rom: "neeru", en: "water", emoji: "💧" },
  { id: "saaku", kn: "ಸಾಕು", rom: "saaku", en: "enough", emoji: "✋" },
  { id: "swalpa", kn: "ಸ್ವಲ್ಪ", rom: "swalpa", en: "a little", emoji: "🤏" },
  { id: "haudu", kn: "ಹೌದು", rom: "haudu", en: "yes", emoji: "👍" },
  { id: "illa", kn: "ಇಲ್ಲ", rom: "illa", en: "no / none", emoji: "🙅" },
  { id: "chennaagide", kn: "ಚೆನ್ನಾಗಿದೆ", rom: "chennaagide", en: "it's nice / good", emoji: "✨" },
  { id: "dhanyavaada", kn: "ಧನ್ಯವಾದ", rom: "dhanyavaada", en: "thank you", emoji: "💛" },
];

export const WORD_BY_ID = Object.fromEntries(WORDS.map((w) => [w.id, w]));

// A story line is a mix of English text pieces and Kannada word slots.
export type Seg = { t: string } | { w: string };

export type Voice = "ajji" | "grandson";

// `say` is the full line as it is actually spoken, in Kannada. Review with a native speaker.
export const DIALOGUE: { speaker: string; voice: Voice; say: string; segs: Seg[] }[] = [
  {
    speaker: "Ajji",
    voice: "ajji",
    say: "ಬಾ ಮೊಮ್ಮಗ! ಕೂತ್ಕೋ. ಊಟ ಆಯ್ತಾ? ತಗೋ, ತಿನ್ನು!",
    segs: [
      { t: "“Come here, " },
      { w: "mommaga" },
      { t: "! Sit down. Have you eaten your " },
      { w: "oota" },
      { t: "? Here — " },
      { w: "tinnu" },
      { t: "!”" },
    ],
  },
  {
    speaker: "You",
    voice: "grandson",
    say: "ಚೆನ್ನಾಗಿದೆ ಅಜ್ಜಿ! ಸಾಕು ಅಜ್ಜಿ!",
    segs: [
      { t: "“Mmm, " },
      { w: "chennaagide" },
      { t: ", " },
      { w: "ajji" },
      { t: "!” She giggles and piles on more. You wave your hands: “" },
      { w: "saaku" },
      { t: ", " },
      { w: "ajji" },
      { t: "!”" },
    ],
  },
];

// A scene is a mix of narrator beats (English, sets the scene) and a few dialogue beats
// (spoken Kannada, English-woven on screen). Review all Kannada with a native speaker.
export type Vocab = { kn: string; rom: string; en: string };

export type Beat =
  | { kind: "narration"; text: string }
  | { kind: "dialogue"; speaker: string; voice: Voice; say: string; segs: Seg[] }
  // AI-written dialogue: a full Kannada line with its own romanization, translation and new words.
  | { kind: "ai"; speaker: string; voice: Voice; say: string; rom: string; en: string; vocab: Vocab[] };

const N = (text: string): Beat => ({ kind: "narration", text });
const AJJI = (say: string, segs: Seg[]): Beat => ({ kind: "dialogue", speaker: "Ajji", voice: "ajji", say, segs });
const YOU = (say: string, segs: Seg[]): Beat => ({
  kind: "dialogue",
  speaker: "You (grandson)",
  voice: "grandson",
  say,
  segs,
});

export type Scene = {
  n: number;
  title: string;
  blurb: string;
  art: string;
  words: string[];
  beats: Beat[];
  vocab?: Vocab[]; // AI stories list their new words here instead of in the word bank
  tag?: string; // e.g. "AI story · Beginner"
};

export const SCENES: Scene[] = [
  {
    n: 1,
    title: "At the door",
    blurb: "Greet Ajji",
    art: "🚪🌴🏡",
    words: ["namaskaara", "ajji", "mommaga"],
    beats: [
      N("It's a hot afternoon in Mysuru. You hop off the auto with your school bag and walk up to Ajji's little blue gate. The smell of ghee drifts out of the house."),
      AJJI("ನಮಸ್ಕಾರ ಮೊಮ್ಮಗ! ಒಳಗೆ ಬಾ.", [{ t: "“" }, { w: "namaskaara" }, { t: ", " }, { w: "mommaga" }, { t: "! Come inside.”" }]),
      N("Ajji wipes her hands on her saree and pulls you into a tight hug. Now it's your turn to greet her."),
      YOU("ನಮಸ್ಕಾರ ಅಜ್ಜಿ!", [{ t: "“" }, { w: "namaskaara" }, { t: ", " }, { w: "ajji" }, { t: "!”" }]),
      N("Her whole face lights up. You are already smiling too."),
    ],
  },
  {
    n: 2,
    title: "The kitchen",
    blurb: "Smell something delicious",
    art: "🍳🥞🍽️",
    words: ["oota", "tinnu", "neeru"],
    beats: [
      N("The kitchen is warm and loud with the sizzle of dosas. Ajji points at a steel plate and a shiny tumbler on the table."),
      AJJI("ಊಟ ಆಯ್ತಾ? ತಗೋ, ತಿನ್ನು. ನೀರು ಬೇಕಾ?", [
        { t: "“Have you had your " }, { w: "oota" }, { t: "? Here, " }, { w: "tinnu" }, { t: "! Do you want " }, { w: "neeru" }, { t: "?”" },
      ]),
      N("You nod with your mouth already full. Ajji laughs and fills your tumbler to the brim."),
    ],
  },
  {
    n: 3,
    title: "Second helpings",
    blurb: "Ajji will not take no",
    art: "🥞🥞🥞",
    words: ["saaku", "swalpa", "illa"],
    beats: [
      N("You finish your first dosa. Ajji is already flipping a second one onto your plate. And then a third."),
      AJJI("ಇನ್ನೂ ಸ್ವಲ್ಪ ತಗೋ!", [{ t: "“Take a little more, " }, { w: "swalpa" }, { t: "!”" }]),
      N("Your tummy says it is full. You need to tell her, politely but firmly."),
      YOU("ಇಲ್ಲ ಅಜ್ಜಿ, ಸಾಕು!", [{ t: "“" }, { w: "illa" }, { t: ", " }, { w: "ajji" }, { t: ", " }, { w: "saaku" }, { t: "!”" }]),
      N("Ajji pretends not to hear you. Another dosa lands on your plate."),
    ],
  },
  {
    n: 4,
    title: "Tasting time",
    blurb: "Say what you think",
    art: "🌶️😋✨",
    words: ["haudu", "chennaagide"],
    beats: [
      N("You take a bite. The coconut chutney is a little spicy and the dosa is perfectly crisp. Ajji watches your face very closely."),
      AJJI("ಚೆನ್ನಾಗಿದೆಯಾ?", [{ t: "“Is it " }, { w: "chennaagide" }, { t: "?”" }]),
      YOU("ಹೌದು ಅಜ್ಜಿ, ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ!", [
        { t: "“" }, { w: "haudu" }, { t: ", " }, { w: "ajji" }, { t: "! It is so " }, { w: "chennaagide" }, { t: "!”" },
      ]),
      N("Ajji is happy. She goes back to the stove and starts a fourth dosa."),
    ],
  },
  {
    n: 5,
    title: "Thank Ajji",
    blurb: "End with a hug",
    art: "🌇🍬💛",
    words: ["dhanyavaada"],
    beats: [
      N("The sun is low and golden. It is time to go home. Ajji packs a little box of sweets for you and tucks it into your bag."),
      AJJI("ಮತ್ತೆ ಬಾ ಮೊಮ್ಮಗ!", [{ t: "“Come again, " }, { w: "mommaga" }, { t: "!”" }]),
      YOU("ಧನ್ಯವಾದ ಅಜ್ಜಿ!", [{ t: "“" }, { w: "dhanyavaada" }, { t: ", " }, { w: "ajji" }, { t: "!”" }]),
      N("You hug her goodbye. Next time, you promise yourself, you will say even more in Kannada."),
    ],
  },
];
