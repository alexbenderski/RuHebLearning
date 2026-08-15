import type { VocabWord } from '../types';

export interface Map2LevelData {
  level: number;
  title: string;
  subtitle: string;
  phrase: string;
  words: VocabWord[];
}

// Placeholder — the user will provide the 80-word payload.
// Structure: 4 levels × 20 words = 80 total.
export const MAP2_LEVELS: Map2LevelData[] = [
  {
    level: 1,
    title: 'Уровень 1 — Начало',
    subtitle: 'Старт',
    phrase: 'Первые слова: приветствия и базовые фразы.',
    words: [],
  },
  {
    level: 2,
    title: 'Уровень 2 — Амфитеатр',
    subtitle: 'Амфитеатр',
    phrase: 'Ежедневные слова: семья и дом.',
    words: [],
  },
  {
    level: 3,
    title: 'Уровень 3 — Порт',
    subtitle: 'Порт',
    phrase: 'Слова о еде и покупках.',
    words: [],
  },
  {
    level: 4,
    title: 'Уровень 4 — Ипподром',
    subtitle: 'Ипподром',
    phrase: 'Глаголы и действия.',
    words: [],
  },
];

/** All 80 words from levels 1–4 (flat array). */
export function getAllMap2Words(): VocabWord[] {
  return MAP2_LEVELS.flatMap((l) => l.words);
}