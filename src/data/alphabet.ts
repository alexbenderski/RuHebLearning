import type { HebrewLetter } from '../types';

export const HEBREW_LETTERS: HebrewLetter[] = [
  { letter: 'א', name: 'Алеф',     transliteration: 'А / молчит',  isFinal: false },
  { letter: 'ב', name: 'Бет',      transliteration: 'Б / В',       isFinal: false },
  { letter: 'ג', name: 'Гимел',    transliteration: 'Г',           isFinal: false },
  { letter: 'ד', name: 'Далет',    transliteration: 'Д',           isFinal: false },
  { letter: 'ה', name: 'Хе',       transliteration: 'Х',           isFinal: false },
  { letter: 'ו', name: 'Вав',      transliteration: 'В / У / О',   isFinal: false },
  { letter: 'ז', name: 'Заин',     transliteration: 'З',           isFinal: false },
  { letter: 'ח', name: 'Хет',      transliteration: 'Х (горл.)',   isFinal: false },
  { letter: 'ט', name: 'Тет',      transliteration: 'Т',           isFinal: false },
  { letter: 'י', name: 'Йод',      transliteration: 'Й',           isFinal: false },
  { letter: 'כ', name: 'Каф',      transliteration: 'К / Х',       isFinal: false },
  { letter: 'ל', name: 'Ламед',    transliteration: 'Л',           isFinal: false },
  { letter: 'מ', name: 'Мем',      transliteration: 'М',           isFinal: false },
  { letter: 'נ', name: 'Нун',      transliteration: 'Н',           isFinal: false },
  { letter: 'ס', name: 'Самех',    transliteration: 'С',           isFinal: false },
  { letter: 'ע', name: 'Аин',      transliteration: 'А (горл.)',   isFinal: false },
  { letter: 'פ', name: 'Пе',       transliteration: 'П / Ф',       isFinal: false },
  { letter: 'צ', name: 'Цади',     transliteration: 'Ц',           isFinal: false },
  { letter: 'ק', name: 'Куф',      transliteration: 'К (сил.)',    isFinal: false },
  { letter: 'ר', name: 'Реш',      transliteration: 'Р',           isFinal: false },
  { letter: 'ש', name: 'Шин/Син',  transliteration: 'Ш / С',       isFinal: false },
  { letter: 'ת', name: 'Тав',      transliteration: 'Т',           isFinal: false },
];

// Appear only at end of a word
export const FINAL_LETTERS: HebrewLetter[] = [
  { letter: 'ך', name: 'Каф Софит',   transliteration: 'К / Х',  isFinal: true, finalOf: 'כ' },
  { letter: 'ם', name: 'Мем Софит',   transliteration: 'М',      isFinal: true, finalOf: 'מ' },
  { letter: 'ן', name: 'Нун Софит',   transliteration: 'Н',      isFinal: true, finalOf: 'נ' },
  { letter: 'ף', name: 'Пе Софит',    transliteration: 'П / Ф',  isFinal: true, finalOf: 'פ' },
  { letter: 'ץ', name: 'Цади Софит',  transliteration: 'Ц',      isFinal: true, finalOf: 'צ' },
];

export const ALL_LETTERS = [...HEBREW_LETTERS, ...FINAL_LETTERS];
