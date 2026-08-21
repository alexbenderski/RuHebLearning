import homePictureGame from '../assets/homePictureGame.png';

// Picture Game Level Data
export interface PictureGameItem {
  id: number;
  wordHebrew: string;
  wordVowels: string;
  transcription: string;
  translation: string;
  x: number;
  y: number;
}

export interface PictureGameLevel {
  levelId: number;
  imageSrc: string;
  items: PictureGameItem[];
  grammarExplanation: string;
}

export const PICTURE_GAME_LEVELS: PictureGameLevel[] = [
  {
    levelId: 1,
    imageSrc: homePictureGame,
    items: [
        { id: 1, wordHebrew: "דלת", wordVowels: "דֶּלֶת", transcription: "делет", translation: "Дверь", x: 147, y: 630 },
        { id: 2, wordHebrew: "שמש", wordVowels: "שֶׁמֶשׁ", transcription: "шемеш", translation: "Солнце", x: 480, y: 232 },
        { id: 3, wordHebrew: "חלון", wordVowels: "חַלּוֹן", transcription: "халон", translation: "Окно", x: 416, y: 353 },
        { id: 4, wordHebrew: "כדור", wordVowels: "כַּדּוּר", transcription: "кадур", translation: "Мяч", x: 471, y: 825 },
        { id: 5, wordHebrew: "עפרון", wordVowels: "עִיפָּרוֹן", transcription: "ипарон", translation: "Карандаш", x: 999, y: 693 },
        { id: 6, wordHebrew: "מחשב", wordVowels: "מַחְשֵׁב", transcription: "махшев", translation: "Компьютер", x: 751, y: 342 },
        { id: 7, wordHebrew: "ספר", wordVowels: "סֵפֶר", transcription: "сефер", translation: "Книга", x: 911, y: 627 },
        { id: 8, wordHebrew: "כסא", wordVowels: "כִּיסֵּא", transcription: "кисэ", translation: "Стул", x: 831, y: 790 },
        { id: 9, wordHebrew: "שולחן", wordVowels: "שׁוּלְחָן", transcription: "шульхан", translation: "Стол", x: 1047, y: 735 },
        { id: 10, wordHebrew: "תיק", wordVowels: "תִּיק", transcription: "тик", translation: "Рюкзак / Сумка", x: 1139, y: 889 },
        { id: 11, wordHebrew: "שמיכה", wordVowels: "שְׂמִיכָה", transcription: "смиха", translation: "Одеяло", x: 1656, y: 832 },
        { id: 12, wordHebrew: "מפה", wordVowels: "מַפָּה", transcription: "мапа", translation: "Карта / Скатерть", x: 1716, y: 497 },
        { id: 13, wordHebrew: "ספה", wordVowels: "סַפָּה", transcription: "сапа", translation: "Диван", x: 1544, y: 754 },
        { id: 14, wordHebrew: "מחברת", wordVowels: "מַחְבֶּרֶת", transcription: "махберет", translation: "Тетрадь", x: 1121, y: 676 },
        { id: 15, wordHebrew: "לוח", wordVowels: "לוּחַ", transcription: "луах", translation: "Доска", x: 1207, y: 343 },
        { id: 16, wordHebrew: "שעון", wordVowels: "שָׁעוֹן", transcription: "шаон", translation: "Часы", x: 692, y: 181 },
        { id: 17, wordHebrew: "שטיח", wordVowels: "שָׁטִיחַ", transcription: "шатиах", translation: "Ковер", x: 493, y: 974 },
        { id: 18, wordHebrew: "עט", wordVowels: "עֵט", transcription: "эт", translation: "Ручка", x: 1043, y: 631 }
    ],
    grammarExplanation: `
## Грамматические пояснения к словам уровня 1

### Существительные в иврите

Все слова в этом уровне — существительные, обозначающие предметы домашнего обихода.

**Род существительных:**
- Мужской род: שולחן (стол), כסא (стул), קיר (стена)
- Женский род: מיטה (кровать), תמונה (картина), כרית (подушка)

**Множественное число:**
- ספרים (книги) — форма множественного числа от ספר (книга)
- Окончание ים- (-им) указывает на множественное число мужского рода

**Определённый артикль:**
В иврите определённый артикль ה- (ха-) присоединяется к началу слова:
- קיר (стена) → הקיר (эта стена)
- שולחן (стол) → השולחן (этот стол)

**Особенности произношения:**
- Буква ח (хет) произносится как украинское "х" или немецкое "ch"
- Буква כ в начале слова читается как "к", в середине как "х"
- Буква ש может читаться как "ш" (שׁ) или "с" (שׂ)

**Практический совет:**
Запоминайте слова вместе с их родом — это поможет правильно согласовывать прилагательные и глаголы в будущем.
    `.trim()
  }
];
