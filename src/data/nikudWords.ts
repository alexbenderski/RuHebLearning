// ─────────────────────────────────────────────────────────────
// Nikud (vowel) marks reference data
// ─────────────────────────────────────────────────────────────
import { VOCALIZED_VOCAB } from './vocalizedVocabulary';

export interface NikudMarkDef {
  id: string;
  char: string;       // The actual Unicode nikud character
  name: string;       // Russian name
  sound: string;      // Sound it represents
  position: 'under' | 'inside' | 'above'; // Where it appears relative to the letter
  explanation: string; // Friendly grammar rule explanation
  sameSoundGroup: string; // Group ID for marks that sound the same (e.g. "a", "e", "o", "u")
}

// Regex for stripping Hebrew nikud (vowel) marks
export const NIKUD_STRIP_RE = /[\u0591-\u05C7]/g;

export const NIKUD_MARKS: NikudMarkDef[] = [
  {
    id: 'kamatz', char: 'ָ', name: 'Камац', sound: 'а', position: 'under',
    sameSoundGroup: 'a',
    explanation: 'Камац — это маленькая буква "Т" под буквой. Даёт звук "а". Самый частый знак для звука "а" в иврите.',
  },
  {
    id: 'patach', char: 'ַ', name: 'Патах', sound: 'а', position: 'under',
    sameSoundGroup: 'a',
    explanation: 'Патах — это горизонтальная чёрточка под буквой. Тоже даёт звук "а", но встречается реже, чем Камац. Часто используется в коротких словах и в конце слова.',
  },
  {
    id: 'segol', char: 'ֶ', name: 'Сегол', sound: 'э', position: 'under',
    sameSoundGroup: 'e',
    explanation: 'Сегол — три точки треугольником под буквой. Даёт звук "э". Самый распространённый знак для звука "э".',
  },
  {
    id: 'tsere', char: 'ֵ', name: 'Цере', sound: 'э', position: 'under',
    sameSoundGroup: 'e',
    explanation: 'Цере — две горизонтальные точки под буквой. Тоже даёт звук "э", но чаще используется в ударных слогах и в середине слова.',
  },
  {
    id: 'chirik', char: 'ִ', name: 'Хирик', sound: 'и', position: 'under',
    sameSoundGroup: 'i',
    explanation: 'Хирик — одна точка под буквой. Даёт звук "и". Единственный основной знак для звука "и".',
  },
  {
    id: 'cholam', char: 'ֹ', name: 'Холам', sound: 'о', position: 'inside',
    sameSoundGroup: 'o',
    explanation: 'Холам — точка слева-сверху от буквы (над буквой "ו" или слева от неё). Даёт звук "о". Самый частый знак для звука "о".',
  },
  {
    id: 'shuruk', char: 'ּ', name: 'Шурук', sound: 'у', position: 'inside',
    sameSoundGroup: 'u',
    explanation: 'Шурук — точка в середине буквы "ו" (вав). Даёт звук "у". Используется, когда "ו" работает как гласная "у".',
  },
  {
    id: 'kubutz', char: 'ֻ', name: 'Кубуц', sound: 'у', position: 'under',
    sameSoundGroup: 'u',
    explanation: 'Кубуц — три точки под буквой, расположенные наискосок. Тоже даёт звук "у", но встречается реже, чем Шурук.',
  },
  {
    id: 'shva', char: 'ְ', name: 'Шва', sound: '(пауза)', position: 'under',
    sameSoundGroup: 'pause',
    explanation: 'Шва — двоеточие под буквой. Может означать короткую паузу (шва нах — "тихий шва") или краткий звук "э" (шва на — "подвижный шва"). Обычно ставится в начале слова или между согласными.',
  },
  {
    id: 'chatafPatach', char: 'ֲ', name: 'Хатаф-Патах', sound: 'а', position: 'under',
    sameSoundGroup: 'a',
    explanation: 'Хатаф-Патах — Патах + Шва вместе. Даёт очень краткий звук "а". Используется в основном с гортанными буквами (א, ה, ח, ע).',
  },
  {
    id: 'chatafSegol', char: 'ֱ', name: 'Хатаф-Сегол', sound: 'э', position: 'under',
    sameSoundGroup: 'e',
    explanation: 'Хатаф-Сегол — Сегол + Шва вместе. Даёт очень краткий звук "э". Используется с гортанными буквами.',
  },
  {
    id: 'chatafKamatz', char: 'ֳ', name: 'Хатаф-Камац', sound: 'о', position: 'under',
    sameSoundGroup: 'o',
    explanation: 'Хатаф-Камац — Камац + Шва вместе. Даёт очень краткий звук "о". Используется с гортанными буквами.',
  },
  {
    id: 'shinDot', char: 'ׁ', name: 'Шин (прав.)', sound: 'ш', position: 'above',
    sameSoundGroup: 'sh',
    explanation: 'Точка над правой частью буквы "ש" (шин). Делает звук "ш". Если точка справа — это "Ш", если слева — "С". Запомни: שִׁ — точка справа = Ш, שֵׂ — точка слева = С.',
  },
  {
    id: 'sinDot', char: 'ׂ', name: 'Син (лев.)', sound: 'с', position: 'above',
    sameSoundGroup: 's',
    explanation: 'Точка над левой частью буквы "ש" (син). Делает звук "с". Та же буква "ש", но точка слева меняет звук с "ш" на "с".',
  },
  {
    id: 'dagesh', char: 'ּ', name: 'Дагеш', sound: '(удвоение)', position: 'inside',
    sameSoundGroup: 'dagesh',
    explanation: 'Дагеш — точка внутри буквы. Может означать удвоение согласной (дагеш хазак — "сильный дагеш") или что буква читается твёрдо, а не как гласная (дагеш каль — "лёгкий дагеш").',
  },
];

// ─────────────────────────────────────────────────────────────
// Nikud slot — a position where a nikud mark should be placed
// ─────────────────────────────────────────────────────────────
export interface NikudSlot {
  id: string;              // unique slot id e.g. "shalom-slot-0"
  letterIndex: number;     // which letter (0-based) this slot belongs to
  position: 'under' | 'inside' | 'above';
  correctMarkId: string;   // which NIKUD_MARKS id is correct
}

// ─────────────────────────────────────────────────────────────
// A word with nikud data for the game
// ─────────────────────────────────────────────────────────────
export interface NikudWordData {
  id: string;
  letters: string[];           // Individual Hebrew letters (without nikud)
  wordWithNikud: string;       // Full word with nikud (for display after solving)
  transliteration: string;     // Russian transliteration
  translation: string;         // Russian meaning
  slots: NikudSlot[];          // All nikud slots for this word
  difficulty: 'easy' | 'medium' | 'hard';
}

// ─────────────────────────────────────────────────────────────
// Word definitions
// ─────────────────────────────────────────────────────────────
export const NIKUD_WORDS: NikudWordData[] = [
  // ── EASY ──────────────────────────────────────────────────
  {
    id: 'nikud-1',
    letters: ['ש', 'ל', 'ו', 'ם'],
    wordWithNikud: 'שָׁלוֹם',
    transliteration: 'шалом',
    translation: 'Привет / Мир',
    difficulty: 'easy',
    slots: [
      { id: 'nikud-1-slot-0', letterIndex: 0, position: 'above', correctMarkId: 'shinDot' },
      { id: 'nikud-1-slot-1', letterIndex: 0, position: 'under', correctMarkId: 'kamatz' },
      { id: 'nikud-1-slot-2', letterIndex: 2, position: 'inside', correctMarkId: 'cholam' },
    ],
  },
  {
    id: 'nikud-2',
    letters: ['ת', 'ו', 'ד', 'ה'],
    wordWithNikud: 'תּוֹדָה',
    transliteration: 'тода',
    translation: 'Спасибо',
    difficulty: 'easy',
    slots: [
      { id: 'nikud-2-slot-0', letterIndex: 0, position: 'inside', correctMarkId: 'dagesh' },
      { id: 'nikud-2-slot-1', letterIndex: 1, position: 'inside', correctMarkId: 'cholam' },
      { id: 'nikud-2-slot-2', letterIndex: 2, position: 'under', correctMarkId: 'kamatz' },
    ],
  },
  {
    id: 'nikud-3',
    letters: ['א', 'נ', 'י'],
    wordWithNikud: 'אֲנִי',
    transliteration: 'ани',
    translation: 'Я',
    difficulty: 'easy',
    slots: [
      { id: 'nikud-3-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'chatafPatach' },
      { id: 'nikud-3-slot-1', letterIndex: 1, position: 'under', correctMarkId: 'chirik' },
    ],
  },
  {
    id: 'nikud-4',
    letters: ['ב', 'י', 'ת'],
    wordWithNikud: 'בַּיִת',
    transliteration: 'байт',
    translation: 'Дом',
    difficulty: 'easy',
    slots: [
      { id: 'nikud-4-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'patach' },
      { id: 'nikud-4-slot-1', letterIndex: 1, position: 'under', correctMarkId: 'chirik' },
    ],
  },
  {
    id: 'nikud-5',
    letters: ['ל', 'ח', 'ם'],
    wordWithNikud: 'לֶחֶם',
    transliteration: 'лехем',
    translation: 'Хлеб',
    difficulty: 'easy',
    slots: [
      { id: 'nikud-5-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'segol' },
      { id: 'nikud-5-slot-1', letterIndex: 1, position: 'under', correctMarkId: 'segol' },
    ],
  },
  // ── MEDIUM ────────────────────────────────────────────────
  {
    id: 'nikud-6',
    letters: ['מ', 'ל', 'ך'],
    wordWithNikud: 'מֶלֶךְ',
    transliteration: 'мелех',
    translation: 'Король',
    difficulty: 'medium',
    slots: [
      { id: 'nikud-6-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'segol' },
      { id: 'nikud-6-slot-1', letterIndex: 1, position: 'under', correctMarkId: 'segol' },
      { id: 'nikud-6-slot-2', letterIndex: 2, position: 'under', correctMarkId: 'shva' },
    ],
  },
  {
    id: 'nikud-7',
    letters: ['ס', 'פ', 'ר'],
    wordWithNikud: 'סֵפֶר',
    transliteration: 'сефер',
    translation: 'Книга',
    difficulty: 'medium',
    slots: [
      { id: 'nikud-7-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'tsere' },
      { id: 'nikud-7-slot-1', letterIndex: 1, position: 'under', correctMarkId: 'segol' },
    ],
  },
  {
    id: 'nikud-8',
    letters: ['י', 'ל', 'ד'],
    wordWithNikud: 'יֶלֶד',
    transliteration: 'йелед',
    translation: 'Мальчик',
    difficulty: 'medium',
    slots: [
      { id: 'nikud-8-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'segol' },
      { id: 'nikud-8-slot-1', letterIndex: 1, position: 'under', correctMarkId: 'segol' },
    ],
  },
  {
    id: 'nikud-9',
    letters: ['א', 'ד', 'ו', 'ם'],
    wordWithNikud: 'אָדוֹם',
    transliteration: 'адом',
    translation: 'Красный',
    difficulty: 'medium',
    slots: [
      { id: 'nikud-9-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'kamatz' },
      { id: 'nikud-9-slot-1', letterIndex: 2, position: 'inside', correctMarkId: 'cholam' },
    ],
  },
  {
    id: 'nikud-10',
    letters: ['כ', 'ח', 'ו', 'ל'],
    wordWithNikud: 'כָּחוֹל',
    transliteration: 'кахоль',
    translation: 'Синий',
    difficulty: 'medium',
    slots: [
      { id: 'nikud-10-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'kamatz' },
      { id: 'nikud-10-slot-1', letterIndex: 2, position: 'inside', correctMarkId: 'cholam' },
    ],
  },
  // ── HARD ──────────────────────────────────────────────────
  {
    id: 'nikud-11',
    letters: ['י', 'ש', 'ר', 'א', 'ל'],
    wordWithNikud: 'יִשְׂרָאֵל',
    transliteration: 'исраэль',
    translation: 'Израиль',
    difficulty: 'hard',
    slots: [
      { id: 'nikud-11-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'chirik' },
      { id: 'nikud-11-slot-1', letterIndex: 1, position: 'above', correctMarkId: 'sinDot' },
      { id: 'nikud-11-slot-2', letterIndex: 1, position: 'under', correctMarkId: 'shva' },
      { id: 'nikud-11-slot-3', letterIndex: 2, position: 'under', correctMarkId: 'kamatz' },
      { id: 'nikud-11-slot-4', letterIndex: 3, position: 'under', correctMarkId: 'tsere' },
    ],
  },
  {
    id: 'nikud-12',
    letters: ['מ', 'ש', 'פ', 'ח', 'ה'],
    wordWithNikud: 'מִשְׁפָּחָה',
    transliteration: 'мишпаха',
    translation: 'Семья',
    difficulty: 'hard',
    slots: [
      { id: 'nikud-12-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'chirik' },
      { id: 'nikud-12-slot-1', letterIndex: 1, position: 'above', correctMarkId: 'shinDot' },
      { id: 'nikud-12-slot-2', letterIndex: 1, position: 'under', correctMarkId: 'shva' },
      { id: 'nikud-12-slot-3', letterIndex: 2, position: 'under', correctMarkId: 'kamatz' },
      { id: 'nikud-12-slot-4', letterIndex: 3, position: 'under', correctMarkId: 'kamatz' },
    ],
  },
  {
    id: 'nikud-13',
    letters: ['ש', 'מ', 'י', 'ם'],
    wordWithNikud: 'שָׁמַיִם',
    transliteration: 'шамаим',
    translation: 'Небо',
    difficulty: 'hard',
    slots: [
      { id: 'nikud-13-slot-0', letterIndex: 0, position: 'above', correctMarkId: 'shinDot' },
      { id: 'nikud-13-slot-1', letterIndex: 0, position: 'under', correctMarkId: 'kamatz' },
      { id: 'nikud-13-slot-2', letterIndex: 1, position: 'under', correctMarkId: 'patach' },
      { id: 'nikud-13-slot-3', letterIndex: 2, position: 'under', correctMarkId: 'chirik' },
    ],
  },
  {
    id: 'nikud-14',
    letters: ['א', 'ח', 'ו', 'ת'],
    wordWithNikud: 'אָחוֹת',
    transliteration: 'ахот',
    translation: 'Сестра',
    difficulty: 'hard',
    slots: [
      { id: 'nikud-14-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'kamatz' },
      { id: 'nikud-14-slot-1', letterIndex: 2, position: 'inside', correctMarkId: 'cholam' },
    ],
  },
  {
    id: 'nikud-15',
    letters: ['ל', 'ה', 'ת', 'ר', 'א', 'ו', 'ת'],
    wordWithNikud: 'לְהִתְרָאוֹת',
    transliteration: 'леитраот',
    translation: 'До свидания',
    difficulty: 'hard',
    slots: [
      { id: 'nikud-15-slot-0', letterIndex: 0, position: 'under', correctMarkId: 'shva' },
      { id: 'nikud-15-slot-1', letterIndex: 1, position: 'under', correctMarkId: 'chirik' },
      { id: 'nikud-15-slot-2', letterIndex: 2, position: 'under', correctMarkId: 'shva' },
      { id: 'nikud-15-slot-3', letterIndex: 3, position: 'under', correctMarkId: 'kamatz' },
      { id: 'nikud-15-slot-4', letterIndex: 5, position: 'inside', correctMarkId: 'cholam' },
    ],
  },
];

// Helper: get marks needed for a word's slots WITH CORRECT MULTIPLICITY
// (e.g. if a word needs 2 segols, the result will contain 2 segol entries)
export function getMarksForWord(word: NikudWordData): NikudMarkDef[] {
  return word.slots
    .map((s) => NIKUD_MARKS.find((m) => m.id === s.correctMarkId))
    .filter((m): m is NikudMarkDef => m !== undefined);
}

// Helper: get all unique mark IDs needed for a word (for decoy generation)
export function getUniqueMarkIdsForWord(word: NikudWordData): Set<string> {
  return new Set(word.slots.map((s) => s.correctMarkId));
}

/** Strip nikud marks from a vocalised Hebrew string. */
export function stripNikud(text: string): string {
  return text.replace(NIKUD_STRIP_RE, '');
}

/**
 * Find NikudWordData entries whose unvocalised form matches one of the
 * provided saved Hebrew words. Used by "My words" page to run the nikud
 * game against only the words the user saved.
 */
export function getNikudWordsForSavedWords(savedWords: { hebrew: string; transliteration?: string; translation?: string; difficulty?: 'easy' | 'medium' | 'hard' }[]): NikudWordData[] {
  const wanted = new Map<string, typeof savedWords[0]>();
  for (const w of savedWords) {
    const key = stripNikud(w.hebrew);
    wanted.set(key, w);
  }
  // First, match static NIKUD_WORDS
  const matched = NIKUD_WORDS.filter((nw) => wanted.has(stripNikud(nw.wordWithNikud)));
  const matchedKeys = new Set(matched.map((nw) => stripNikud(nw.wordWithNikud)));
  // Then generate dynamic ones for remaining saved words
  for (const [key, sw] of wanted) {
    if (matchedKeys.has(key)) continue;
    const generated = generateNikudWordData(
      sw.hebrew,
      sw.transliteration ?? '',
      sw.translation ?? '',
      sw.difficulty ?? 'medium',
    );
    if (generated) matched.push(generated);
  }
  return matched;
}

/**
 * Return the vocalised (nicud) form of a Hebrew word if one exists in the
 * NIKUD_WORDS catalogue; otherwise return the input unchanged. Matching is
 * done after stripping nikud from both sides, so already-vocalised inputs
 * also resolve to the canonical form.
 */
export function getVocalizedForm(plainOrMixed: string): string {
  const key = stripNikud(plainOrMixed);
  const found = NIKUD_WORDS.find((nw) => stripNikud(nw.wordWithNikud) === key);
  if (found) return found.wordWithNikud;
  return VOCALIZED_VOCAB[key] ?? plainOrMixed;
}

/**
 * Split a (possibly vocalised) Hebrew string into per-letter chunks, keeping
 * each base letter together with the combining marks that belong to it.
 * Example: "שָׁלוֹם" → ["שָׁ", "ל", "וֹ", "ם"]
 */
export function getVocalizedCharGroups(text: string): string[] {
  const groups: string[] = [];
  let current = '';
  for (const ch of text) {
    if (/[\u05D0-\u05EA]/.test(ch)) {
      if (current) groups.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current) groups.push(current);
  return groups;
}

// ── Mark-to-ID mapping for auto-detecting nikud marks ──────
const MARK_CHAR_TO_ID: Record<string, string> = {
  '\u05B8': 'kamatz',
  '\u05B7': 'patach',
  '\u05B6': 'segol',
  '\u05B5': 'tsere',
  '\u05B4': 'chirik',
  '\u05B9': 'cholam',
  '\u05BB': 'kubutz',
  '\u05B0': 'shva',
  '\u05B2': 'chatafPatach',
  '\u05B1': 'chatafSegol',
  '\u05B3': 'chatafKamatz',
  '\u05C1': 'shinDot',
  '\u05C2': 'sinDot',
  '\u05BC': 'dagesh',
};

const MARK_ID_TO_POSITION: Record<string, 'under' | 'inside' | 'above'> = {
  kamatz: 'under', patach: 'under', segol: 'under', tsere: 'under',
  chirik: 'under', cholam: 'inside', kubutz: 'under', shva: 'under',
  chatafPatach: 'under', chatafSegol: 'under', chatafKamatz: 'under',
  shinDot: 'above', sinDot: 'above', dagesh: 'inside',
};

/**
 * Dynamically generate a NikudWordData entry from a plain Hebrew word
 * that has a vocalised form in the VOCALIZED_VOCAB dictionary.
 * Returns null if the word has no vocalised form or cannot be parsed.
 */
export function generateNikudWordData(
  plainOrMixed: string,
  transliteration: string,
  translation: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
): NikudWordData | null {
  const vocalized = getVocalizedForm(plainOrMixed);
  if (vocalized === plainOrMixed) return null; // no vocalised form available

  const groups = getVocalizedCharGroups(vocalized);
  const letters: string[] = [];
  const slots: NikudSlot[] = [];
  let slotCounter = 0;

  for (let li = 0; li < groups.length; li++) {
    const g = groups[li];
    // Extract base letter (first Hebrew char)
    const base = [...g].find((ch) => /[\u05D0-\u05EA]/.test(ch)) ?? '';
    letters.push(base);

    // Find all combining marks (nikud chars) in this group
    const marks = [...g].filter((ch) => /[\u0591-\u05C7]/.test(ch));

    for (const markChar of marks) {
      const markId = MARK_CHAR_TO_ID[markChar];
      if (!markId) continue;
      const position = MARK_ID_TO_POSITION[markId] ?? 'under';
      slots.push({
        id: `auto-slot-${slotCounter++}`,
        letterIndex: li,
        position,
        correctMarkId: markId,
      });
    }
  }

  if (slots.length === 0) return null;

  return {
    id: `auto-${stripNikud(plainOrMixed)}`,
    letters,
    wordWithNikud: vocalized,
    transliteration,
    translation,
    slots,
    difficulty,
  };
}

/**
 * Return all NikudWordData entries: the static NIKUD_WORDS plus any
 * vocabulary words that have a vocalised form in VOCALIZED_VOCAB.
 * This lets the Никуд game use the full vocabulary.
 */
export function getNikudWordDataForWords(
  words: { hebrew: string; transliteration: string; translation: string; difficulty?: 'easy' | 'medium' | 'hard' }[],
): NikudWordData[] {
  const result: NikudWordData[] = [...NIKUD_WORDS];
  const existingKeys = new Set(NIKUD_WORDS.map((nw) => stripNikud(nw.wordWithNikud)));

  for (const w of words) {
    const key = stripNikud(w.hebrew);
    if (existingKeys.has(key)) continue;
    const generated = generateNikudWordData(w.hebrew, w.transliteration, w.translation, w.difficulty ?? 'medium');
    if (generated) {
      result.push(generated);
      existingKeys.add(key);
    }
  }
  return result;
}
