// ─────────────────────────────────────────────────────────────
// Letter + Nikud variant data for the Alphabet module
// Each variant pairs a Hebrew letter (with a nikud mark attached)
// with its name/sound so learners recognise letters as they
// appear in real vocalised text.
// ─────────────────────────────────────────────────────────────
export interface LetterNikudVariant {
  id: string;           // unique variant id e.g. "א-kamatz"
  baseLetter: string;   // Hebrew base char e.g. "א"
  letterName: string;   // Russian name e.g. "Алеф"
  transliteration: string; // Russian transliteration of the base letter
  nikudChar: string;    // Letter WITH the nikud mark e.g. "אָ"
  markName: string;     // Nikud mark name e.g. "Камац"
  sound: string;        // Sound of the combination e.g. "а"
}

// ── Nikud mark catalogue for combinations ───────────────────
const MARKS = {
  kamatz: { char: '\u05B8', name: 'Камац', sound: 'а' },
  patach: { char: '\u05B7', name: 'Патах', sound: 'а' },
  segol:  { char: '\u05B6', name: 'Сегол', sound: 'э' },
  tsere:  { char: '\u05B5', name: 'Цере', sound: 'э' },
  chirik: { char: '\u05B4', name: 'Хирик', sound: 'и' },
  cholam: { char: '\u05B9', name: 'Холам', sound: 'о' },
  shva:   { char: '\u05B0', name: 'Шва', sound: 'пауза' },
  kubutz: { char: '\u05BB', name: 'Кубуц', sound: 'у' },
  dagesh: { char: '\u05BC', name: 'Дагеш', sound: 'удвоение' },
} as const;

type MarkKey = keyof typeof MARKS;

interface LetterMarkDef {
  letter: string;
  name: string;
  translit: string;
  marks: MarkKey[];
}

// ── Base letters with their common nikud marks ──────────────
const LETTER_MARKS: LetterMarkDef[] = [
  { letter: 'א', name: 'Алеф',    translit: 'А / молчит', marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam', 'shva', 'kubutz'] },
  { letter: 'ב', name: 'Бет',     translit: 'Б / В',      marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam', 'shva', 'kubutz'] },
  { letter: 'ג', name: 'Гимел',   translit: 'Г',          marks: ['kamatz', 'segol', 'chirik', 'cholam', 'shva'] },
  { letter: 'ד', name: 'Далет',   translit: 'Д',          marks: ['kamatz', 'patach', 'segol', 'chirik', 'cholam'] },
  { letter: 'ה', name: 'Хе',      translit: 'Х',          marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam'] },
  { letter: 'ו', name: 'Вав',     translit: 'В / У / О',  marks: ['kamatz', 'segol', 'tsere', 'chirik', 'cholam', 'shva'] },
  { letter: 'ז', name: 'Заин',    translit: 'З',          marks: ['kamatz', 'segol', 'chirik', 'cholam'] },
  { letter: 'ח', name: 'Хет',     translit: 'Х (горл.)',  marks: ['kamatz', 'patach', 'segol', 'chirik', 'cholam', 'shva'] },
  { letter: 'ט', name: 'Тет',     translit: 'Т',          marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam'] },
  { letter: 'י', name: 'Йод',     translit: 'Й',          marks: ['kamatz', 'segol', 'tsere', 'chirik', 'cholam', 'shva'] },
  { letter: 'כ', name: 'Каф',     translit: 'К / Х',      marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam', 'shva'] },
  { letter: 'ל', name: 'Ламед',   translit: 'Л',          marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam', 'shva'] },
  { letter: 'מ', name: 'Мем',     translit: 'М',          marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam', 'shva'] },
  { letter: 'נ', name: 'Нун',     translit: 'Н',          marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam', 'shva'] },
  { letter: 'ס', name: 'Самех',   translit: 'С',          marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam'] },
  { letter: 'ע', name: 'Аин',     translit: 'А (горл.)',  marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam', 'shva'] },
  { letter: 'פ', name: 'Пе',      translit: 'П / Ф',      marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam', 'shva'] },
  { letter: 'צ', name: 'Цади',    translit: 'Ц',          marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam'] },
  { letter: 'ק', name: 'Куф',     translit: 'К (сил.)',   marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam'] },
  { letter: 'ר', name: 'Реш',     translit: 'Р',          marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam'] },
  { letter: 'ת', name: 'Тав',     translit: 'Т',          marks: ['kamatz', 'patach', 'segol', 'tsere', 'chirik', 'cholam', 'shva'] },
];

// Generate regular letter + mark combinations
const generated: LetterNikudVariant[] = LETTER_MARKS.flatMap((l) =>
  l.marks.map((mk) => {
    const mark = MARKS[mk];
    return {
      id: `${l.letter}-${mk}`,
      baseLetter: l.letter,
      letterName: l.name,
      transliteration: l.translit,
      nikudChar: l.letter + mark.char,
      markName: mark.name,
      sound: mark.sound === 'пауза' ? `${l.translit} (пауза)` : `${l.translit} → ${mark.sound}`,
    };
  }),
);

// ── Special combinations ─────────────────────────────────────
const SPECIAL_VARIANTS: LetterNikudVariant[] = [
  // Vav with shuruk (vowel "u" inside vav)
  { id: 'ו-shuruk', baseLetter: 'ו', letterName: 'Вав', transliteration: 'В / У / О', nikudChar: 'וּ', markName: 'Шурук', sound: 'Вав → у' },
  // Dagesh forms for ב כ פ ת
  { id: 'ב-dagesh', baseLetter: 'ב', letterName: 'Бет', transliteration: 'Б / В', nikudChar: 'בּ', markName: 'Дагеш', sound: 'Бет → б (твёрдо)' },
  { id: 'כ-dagesh', baseLetter: 'כ', letterName: 'Каф', transliteration: 'К / Х', nikudChar: 'כּ', markName: 'Дагеш', sound: 'Каф → к (твёрдо)' },
  { id: 'פ-dagesh', baseLetter: 'פ', letterName: 'Пе', transliteration: 'П / Ф', nikudChar: 'פּ', markName: 'Дагеш', sound: 'Пе → п (твёрдо)' },
  { id: 'ת-dagesh', baseLetter: 'ת', letterName: 'Тав', transliteration: 'Т', nikudChar: 'תּ', markName: 'Дагеш', sound: 'Тав → т (твёрдо)' },
  // Shin (right dot = Ш) and Sin (left dot = С) with vowels
  { id: 'ש-shin-kamatz', baseLetter: 'ש', letterName: 'Шин', transliteration: 'Ш / С', nikudChar: 'שָׁ', markName: 'Шин + Камац', sound: 'Шин → ша' },
  { id: 'ש-shin-patach', baseLetter: 'ש', letterName: 'Шин', transliteration: 'Ш / С', nikudChar: 'שַׁ', markName: 'Шин + Патах', sound: 'Шин → ша' },
  { id: 'ש-shin-segol',  baseLetter: 'ש', letterName: 'Шин', transliteration: 'Ш / С', nikudChar: 'שֶׁ', markName: 'Шин + Сегол', sound: 'Шин → шэ' },
  { id: 'ש-shin-tsere',  baseLetter: 'ש', letterName: 'Шин', transliteration: 'Ш / С', nikudChar: 'שֵׁ', markName: 'Шин + Цере', sound: 'Шин → шэ' },
  { id: 'ש-shin-chirik', baseLetter: 'ש', letterName: 'Шин', transliteration: 'Ш / С', nikudChar: 'שִׁ', markName: 'Шин + Хирик', sound: 'Шин → ши' },
  { id: 'ש-shin-cholam', baseLetter: 'ש', letterName: 'Шин', transliteration: 'Ш / С', nikudChar: 'שֹׁ', markName: 'Шин + Холам', sound: 'Шин → шо' },
  { id: 'ש-shin-shva',   baseLetter: 'ש', letterName: 'Шин', transliteration: 'Ш / С', nikudChar: 'שְׁ', markName: 'Шин + Шва', sound: 'Шин → ш(э)' },
  { id: 'ש-sin-kamatz',  baseLetter: 'ש', letterName: 'Син', transliteration: 'Ш / С', nikudChar: 'שָׂ', markName: 'Син + Камац', sound: 'Син → са' },
  { id: 'ש-sin-patach',  baseLetter: 'ש', letterName: 'Син', transliteration: 'Ш / С', nikudChar: 'שַׂ', markName: 'Син + Патах', sound: 'Син → са' },
  { id: 'ש-sin-segol',   baseLetter: 'ש', letterName: 'Син', transliteration: 'Ш / С', nikudChar: 'שֶׂ', markName: 'Син + Сегол', sound: 'Син → сэ' },
  { id: 'ש-sin-tsere',   baseLetter: 'ש', letterName: 'Син', transliteration: 'Ш / С', nikudChar: 'שֵׂ', markName: 'Син + Цере', sound: 'Син → сэ' },
  { id: 'ש-sin-chirik',  baseLetter: 'ש', letterName: 'Син', transliteration: 'Ш / С', nikudChar: 'שִׂ', markName: 'Син + Хирик', sound: 'Син → си' },
  { id: 'ש-sin-cholam',  baseLetter: 'ש', letterName: 'Син', transliteration: 'Ш / С', nikudChar: 'שֹׂ', markName: 'Син + Холам', sound: 'Син → со' },
];

export const LETTER_NIKUD_VARIANTS: LetterNikudVariant[] = [...generated, ...SPECIAL_VARIANTS];

// Helper: unique base letters present in the variant pool
export const NIKUD_BASE_LETTERS: { letter: string; name: string; transliteration: string }[] =
  Array.from(new Map(LETTER_NIKUD_VARIANTS.map((v) => [v.baseLetter, { letter: v.baseLetter, name: v.letterName, transliteration: v.transliteration }])).values());

// Helper: get all variants for a set of base letters (used by the quiz)
export function getVariantsForLetters(baseLetters: string[]): LetterNikudVariant[] {
  const set = new Set(baseLetters);
  return LETTER_NIKUD_VARIANTS.filter((v) => set.has(v.baseLetter));
}