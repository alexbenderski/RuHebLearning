import { HEBREW_LETTERS, FINAL_LETTERS, ALL_LETTERS } from './alphabet';
import type { HebrewLetter } from '../types';

// ─────────────────────────────────────────────────────────────
// The 22 main Hebrew letters are divided across 4 teaching levels.
// The 5 final (suffix) letters are grouped into Level 4.
// Level 5 is the "final boss" exam covering ALL letters.
//
//   Level 1: א ב ג ד ה ו                  (Алеф — Вав)
//   Level 2: ז ח ט י כ ל                  (Заин — Ламед)
//   Level 3: מ נ ס ע פ צ                  (Мем  — Цади)
//   Level 4: ק ר ש ת + final letters      (Куф  — Тав + конечные)
//   Level 5: ALL letters                 (финальный экзамен)
// ─────────────────────────────────────────────────────────────
export interface AlphabetLevel {
  level: number;
  title: string;
  subtitle: string;
  isFinalExam: boolean;
  letters: HebrewLetter[];
}

export const ALPHABET_LEVELS: AlphabetLevel[] = [
  {
    level: 1,
    title: 'Уровень 1',
    subtitle: 'Алеф · Бет · Гимел · Далет · Хе · Вав',
    isFinalExam: false,
    letters: HEBREW_LETTERS.slice(0, 6),
  },
  {
    level: 2,
    title: 'Уровень 2',
    subtitle: 'Заин · Хет · Тет · Йод · Каф · Ламед',
    isFinalExam: false,
    letters: HEBREW_LETTERS.slice(6, 12),
  },
  {
    level: 3,
    title: 'Уровень 3',
    subtitle: 'Мем · Нун · Самех · Аин · Пе · Цади',
    isFinalExam: false,
    letters: HEBREW_LETTERS.slice(12, 18),
  },
  {
    level: 4,
    title: 'Уровень 4',
    subtitle: 'Куф · Реш · Шин/Син · Тав + конечные буквы',
    isFinalExam: false,
    letters: [...HEBREW_LETTERS.slice(18), ...FINAL_LETTERS],
  },
  {
    level: 5,
    title: 'Финальный экзамен',
    subtitle: 'Все 22 буквы + 5 конечных форм',
    isFinalExam: true,
    letters: ALL_LETTERS,
  },
];