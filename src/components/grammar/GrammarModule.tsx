import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VOCAB_CATEGORIES } from '../../data/vocabulary';
import { NIKUD_MARKS } from '../../data/nikudWords';
import type { GrammarItem } from '../../types';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useProgressTracker } from '../../hooks/useProgressTracker';
import styles from './GrammarModule.module.css';

// ──────────────────────────────────────────────
// SECTION 1: Nikud Letter Selector Data
// ──────────────────────────────────────────────
interface LetterNikudInfo {
  letter: string;
  letterName: string;
  entries: { markId: string; hebrew: string; transliteration: string; explanation: string }[];
}

const LETTER_NIKUD_INFO: LetterNikudInfo[] = [
  {
    letter: 'א', letterName: 'Алеф (אלף)',
    entries: [
      { markId: 'kamatz', hebrew: 'אָ', transliteration: 'а', explanation: 'Камац (ָ) — чёрточка под буквой. Даёт звук "а". Алеф молчит, поэтому слышится только гласная.' },
      { markId: 'patach', hebrew: 'אַ', transliteration: 'а', explanation: 'Патах (ַ) — горизонтальная чёрточка под буквой. Тоже "а".' },
      { markId: 'segol', hebrew: 'אֶ', transliteration: 'э', explanation: 'Сегол (ֶ) — три точки треугольником. Даёт звук "э".' },
      { markId: 'tsere', hebrew: 'אֵ', transliteration: 'э', explanation: 'Цере (ֵ) — две точки под буквой. Даёт звук "э".' },
      { markId: 'chirik', hebrew: 'אִ', transliteration: 'и', explanation: 'Хирик (ִ) — одна точка под буквой. Даёт звук "и".' },
      { markId: 'cholam', hebrew: 'אֹ', transliteration: 'о', explanation: 'Холам (ֹ) — точка над/слева от буквы. Даёт звук "о".' },
      { markId: 'kubutz', hebrew: 'אֻ', transliteration: 'у', explanation: 'Кубуц (ֻ) — три точки под буквой. Даёт звук "у".' },
      { markId: 'shva', hebrew: 'אְ', transliteration: 'пауза', explanation: 'Шва (ְ) — двоеточие под буквой. Пауза или очень краткое "э".' },
    ],
  },
  {
    letter: 'ב', letterName: 'Бет (בית)',
    entries: [
      { markId: 'kamatz', hebrew: 'בָּ', transliteration: 'ба', explanation: 'Камац (ָ) — чёрточка под буквой. Даёт звук "а". Самый частый знак для звука "а".' },
      { markId: 'patach', hebrew: 'בַּ', transliteration: 'ба', explanation: 'Патах (ַ) — горизонтальная чёрточка под буквой. Тоже "а", но встречается реже.' },
      { markId: 'segol', hebrew: 'בֶּ', transliteration: 'бэ', explanation: 'Сегол (ֶ) — три точки треугольником. Даёт звук "э".' },
      { markId: 'tsere', hebrew: 'בֵּ', transliteration: 'бэ', explanation: 'Цере (ֵ) — две точки под буквой. Даёт звук "э", чаще в ударных слогах.' },
      { markId: 'chirik', hebrew: 'בִּ', transliteration: 'би', explanation: 'Хирик (ִ) — одна точка под буквой. Даёт звук "и".' },
      { markId: 'cholam', hebrew: 'בֹּ', transliteration: 'бо', explanation: 'Холам (ֹ) — точка над/слева от буквы. Даёт звук "о".' },
      { markId: 'shuruk', hebrew: 'בּוּ', transliteration: 'бу', explanation: 'Шурук (ּ) — точка в середине вав. Даёт звук "у".' },
      { markId: 'kubutz', hebrew: 'בֻּ', transliteration: 'бу', explanation: 'Кубуц (ֻ) — три точки под буквой. Тоже "у", но реже.' },
      { markId: 'shva', hebrew: 'בְּ', transliteration: 'б(э)', explanation: 'Шва (ְ) — двоеточие под буквой. Пауза или короткое "э".' },
    ],
  },
  {
    letter: 'ג', letterName: 'Гимель (גימל)',
    entries: [
      { markId: 'kamatz', hebrew: 'גָּ', transliteration: 'га', explanation: 'Камац — чёрточка под буквой. Звук "а".' },
      { markId: 'segol', hebrew: 'גֶּ', transliteration: 'гэ', explanation: 'Сегол — три точки треугольником. Звук "э".' },
      { markId: 'chirik', hebrew: 'גִּ', transliteration: 'ги', explanation: 'Хирик — одна точка под буквой. Звук "и".' },
      { markId: 'cholam', hebrew: 'גֹּ', transliteration: 'го', explanation: 'Холам — точка над буквой. Звук "о".' },
      { markId: 'shva', hebrew: 'גְּ', transliteration: 'г(э)', explanation: 'Шва — двоеточие. Пауза.' },
    ],
  },
  {
    letter: 'ד', letterName: 'Далет (דלת)',
    entries: [
      { markId: 'kamatz', hebrew: 'דָּ', transliteration: 'да', explanation: 'Камац — чёрточка под буквой. Звук "а".' },
      { markId: 'patach', hebrew: 'דַּ', transliteration: 'да', explanation: 'Патах — чёрточка под буквой. Звук "а".' },
      { markId: 'segol', hebrew: 'דֶּ', transliteration: 'дэ', explanation: 'Сегол — три точки. Звук "э".' },
      { markId: 'chirik', hebrew: 'דִּ', transliteration: 'ди', explanation: 'Хирик — одна точка. Звук "и".' },
      { markId: 'cholam', hebrew: 'דֹּ', transliteration: 'до', explanation: 'Холам — точка над. Звук "о".' },
    ],
  },
  {
    letter: 'ה', letterName: 'Хе (הא)',
    entries: [
      { markId: 'kamatz', hebrew: 'הָ', transliteration: 'ха', explanation: 'Камац — чёрточка. Звук "ха".' },
      { markId: 'patach', hebrew: 'הַ', transliteration: 'ха', explanation: 'Патах — чёрточка. Звук "ха".' },
      { markId: 'segol', hebrew: 'הֶ', transliteration: 'хэ', explanation: 'Сегол — три точки. Звук "хэ".' },
      { markId: 'tsere', hebrew: 'הֵ', transliteration: 'хэ', explanation: 'Цере — две точки. Звук "хэ".' },
      { markId: 'chirik', hebrew: 'הִ', transliteration: 'хи', explanation: 'Хирик — одна точка. Звук "хи".' },
      { markId: 'cholam', hebrew: 'הֹ', transliteration: 'хо', explanation: 'Холам — точка над. Звук "хо".' },
    ],
  },
  {
    letter: 'ו', letterName: 'Вав (ואו)',
    entries: [
      { markId: 'cholam', hebrew: 'וֹ', transliteration: 'во / о', explanation: 'Холам на вав — читается "о" (вав-холам).' },
      { markId: 'shuruk', hebrew: 'וּ', transliteration: 'у', explanation: 'Шурук (точка внутри вав) — чистый звук "у".' },
      { markId: 'shva', hebrew: 'וְ', transliteration: 'в(э)', explanation: 'Шва — пауза или краткое "э".' },
    ],
  },
  {
    letter: 'ז', letterName: 'Заин (זין)',
    entries: [
      { markId: 'kamatz', hebrew: 'זָ', transliteration: 'за', explanation: 'Камац — чёрточка. Звук "за".' },
      { markId: 'segol', hebrew: 'זֶ', transliteration: 'зэ', explanation: 'Сегол — три точки. Звук "зэ".' },
      { markId: 'chirik', hebrew: 'זִ', transliteration: 'зи', explanation: 'Хирик — одна точка. Звук "зи".' },
      { markId: 'cholam', hebrew: 'זֹ', transliteration: 'зо', explanation: 'Холам — точка над. Звук "зо".' },
    ],
  },
  {
    letter: 'ח', letterName: 'Хет (חת)',
    entries: [
      { markId: 'kamatz', hebrew: 'חָ', transliteration: 'ха', explanation: 'Камац — чёрточка. Звук "ха" (горловой).' },
      { markId: 'patach', hebrew: 'חַ', transliteration: 'ха', explanation: 'Патах — чёрточка. Звук "ха".' },
      { markId: 'segol', hebrew: 'חֶ', transliteration: 'хэ', explanation: 'Сегол — три точки. Звук "хэ".' },
      { markId: 'chirik', hebrew: 'חִ', transliteration: 'хи', explanation: 'Хирик — одна точка. Звук "хи".' },
      { markId: 'cholam', hebrew: 'חֹ', transliteration: 'хо', explanation: 'Холам — точка над. Звук "хо".' },
      { markId: 'shva', hebrew: 'חְ', transliteration: 'х(э)', explanation: 'Шва — пауза.' },
    ],
  },
  {
    letter: 'ט', letterName: 'Тет (טית)',
    entries: [
      { markId: 'kamatz', hebrew: 'טָ', transliteration: 'та', explanation: 'Камац — чёрточка. Звук "та".' },
      { markId: 'patach', hebrew: 'טַ', transliteration: 'та', explanation: 'Патах — чёрточка. Звук "та".' },
      { markId: 'segol', hebrew: 'טֶ', transliteration: 'тэ', explanation: 'Сегол — три точки. Звук "тэ".' },
      { markId: 'tsere', hebrew: 'טֵ', transliteration: 'тэ', explanation: 'Цере — две точки. Звук "тэ".' },
      { markId: 'chirik', hebrew: 'טִ', transliteration: 'ти', explanation: 'Хирик — одна точка. Звук "ти".' },
      { markId: 'cholam', hebrew: 'טֹ', transliteration: 'то', explanation: 'Холам — точка над. Звук "то".' },
    ],
  },
  {
    letter: 'י', letterName: 'Йод (יוד)',
    entries: [
      { markId: 'kamatz', hebrew: 'יָ', transliteration: 'я', explanation: 'Камац — чёрточка. Йод + "а" даёт "я".' },
      { markId: 'segol', hebrew: 'יֶ', transliteration: 'йэ', explanation: 'Сегол — три точки. Звук "йэ".' },
      { markId: 'tsere', hebrew: 'יֵ', transliteration: 'йэ', explanation: 'Цере — две точки. Звук "йэ".' },
      { markId: 'chirik', hebrew: 'יִ', transliteration: 'йи', explanation: 'Хирик — одна точка. Звук "йи".' },
      { markId: 'cholam', hebrew: 'יֹ', transliteration: 'йо', explanation: 'Холам — точка над. Звук "йо".' },
      { markId: 'shva', hebrew: 'יְ', transliteration: 'й(э)', explanation: 'Шва — пауза.' },
    ],
  },
  {
    letter: 'כ', letterName: 'Каф (כף)',
    entries: [
      { markId: 'kamatz', hebrew: 'כָּ', transliteration: 'ка', explanation: 'Камац — чёрточка. Звук "а".' },
      { markId: 'patach', hebrew: 'כַּ', transliteration: 'ка', explanation: 'Патах — чёрточка. Звук "а".' },
      { markId: 'tsere', hebrew: 'כֵּ', transliteration: 'кэ', explanation: 'Цере — две точки. Звук "э".' },
      { markId: 'chirik', hebrew: 'כִּ', transliteration: 'ки', explanation: 'Хирик — одна точка. Звук "и".' },
      { markId: 'cholam', hebrew: 'כֹּ', transliteration: 'ко', explanation: 'Холам — точка над. Звук "о".' },
      { markId: 'shva', hebrew: 'כְּ', transliteration: 'к(э)', explanation: 'Шва — двоеточие. Пауза.' },
    ],
  },
  {
    letter: 'ל', letterName: 'Ламед (למד)',
    entries: [
      { markId: 'kamatz', hebrew: 'לָ', transliteration: 'ла', explanation: 'Камац — чёрточка. Звук "ла".' },
      { markId: 'patach', hebrew: 'לַ', transliteration: 'ла', explanation: 'Патах — чёрточка. Звук "ла".' },
      { markId: 'segol', hebrew: 'לֶ', transliteration: 'лэ', explanation: 'Сегол — три точки. Звук "лэ".' },
      { markId: 'tsere', hebrew: 'לֵ', transliteration: 'лэ', explanation: 'Цере — две точки. Звук "лэ".' },
      { markId: 'chirik', hebrew: 'לִ', transliteration: 'ли', explanation: 'Хирик — одна точка. Звук "ли".' },
      { markId: 'cholam', hebrew: 'לֹ', transliteration: 'ло', explanation: 'Холам — точка над. Звук "ло".' },
      { markId: 'shva', hebrew: 'לְ', transliteration: 'л(э)', explanation: 'Шва — пауза.' },
    ],
  },
  {
    letter: 'מ', letterName: 'Мем (מם)',
    entries: [
      { markId: 'kamatz', hebrew: 'מָ', transliteration: 'ма', explanation: 'Камац — чёрточка. Звук "а".' },
      { markId: 'patach', hebrew: 'מַ', transliteration: 'ма', explanation: 'Патах — чёрточка. Звук "а".' },
      { markId: 'segol', hebrew: 'מֶ', transliteration: 'мэ', explanation: 'Сегол — три точки. Звук "э".' },
      { markId: 'tsere', hebrew: 'מֵ', transliteration: 'мэ', explanation: 'Цере — две точки. Звук "э".' },
      { markId: 'chirik', hebrew: 'מִ', transliteration: 'ми', explanation: 'Хирик — одна точка. Звук "и".' },
      { markId: 'cholam', hebrew: 'מֹ', transliteration: 'мо', explanation: 'Холам — точка над. Звук "о".' },
      { markId: 'shva', hebrew: 'מְ', transliteration: 'м(э)', explanation: 'Шва — пауза.' },
    ],
  },
  {
    letter: 'נ', letterName: 'Нун (נון)',
    entries: [
      { markId: 'kamatz', hebrew: 'נָ', transliteration: 'на', explanation: 'Камац — чёрточка. Звук "на".' },
      { markId: 'patach', hebrew: 'נַ', transliteration: 'на', explanation: 'Патах — чёрточка. Звук "на".' },
      { markId: 'segol', hebrew: 'נֶ', transliteration: 'нэ', explanation: 'Сегол — три точки. Звук "нэ".' },
      { markId: 'tsere', hebrew: 'נֵ', transliteration: 'нэ', explanation: 'Цере — две точки. Звук "нэ".' },
      { markId: 'chirik', hebrew: 'נִ', transliteration: 'ни', explanation: 'Хирик — одна точка. Звук "ни".' },
      { markId: 'cholam', hebrew: 'נֹ', transliteration: 'но', explanation: 'Холам — точка над. Звук "но".' },
      { markId: 'shva', hebrew: 'נְ', transliteration: 'н(э)', explanation: 'Шва — пауза.' },
    ],
  },
  {
    letter: 'ס', letterName: 'Самех (סמך)',
    entries: [
      { markId: 'kamatz', hebrew: 'סָ', transliteration: 'са', explanation: 'Камац — чёрточка. Звук "са".' },
      { markId: 'patach', hebrew: 'סַ', transliteration: 'са', explanation: 'Патах — чёрточка. Звук "са".' },
      { markId: 'segol', hebrew: 'סֶ', transliteration: 'сэ', explanation: 'Сегол — три точки. Звук "сэ".' },
      { markId: 'tsere', hebrew: 'סֵ', transliteration: 'сэ', explanation: 'Цере — две точки. Звук "сэ".' },
      { markId: 'chirik', hebrew: 'סִ', transliteration: 'си', explanation: 'Хирик — одна точка. Звук "си".' },
      { markId: 'cholam', hebrew: 'סֹ', transliteration: 'со', explanation: 'Холам — точка над. Звук "со".' },
    ],
  },
  {
    letter: 'ע', letterName: 'Аин (עין)',
    entries: [
      { markId: 'kamatz', hebrew: 'עָ', transliteration: 'а', explanation: 'Камац — чёрточка. Аин почти не читается, слышна гласная "а".' },
      { markId: 'patach', hebrew: 'עַ', transliteration: 'а', explanation: 'Патах — чёрточка. Звук "а".' },
      { markId: 'segol', hebrew: 'עֶ', transliteration: 'э', explanation: 'Сегол — три точки. Звук "э".' },
      { markId: 'tsere', hebrew: 'עֵ', transliteration: 'э', explanation: 'Цере — две точки. Звук "э".' },
      { markId: 'chirik', hebrew: 'עִ', transliteration: 'и', explanation: 'Хирик — одна точка. Звук "и".' },
      { markId: 'cholam', hebrew: 'עֹ', transliteration: 'о', explanation: 'Холам — точка над. Звук "о".' },
      { markId: 'shva', hebrew: 'עְ', transliteration: 'пауза', explanation: 'Шва — пауза.' },
    ],
  },
  {
    letter: 'פ', letterName: 'Пэ (פה)',
    entries: [
      { markId: 'kamatz', hebrew: 'פָּ', transliteration: 'па', explanation: 'Камац — чёрточка. Звук "а".' },
      { markId: 'patach', hebrew: 'פַּ', transliteration: 'па', explanation: 'Патах — чёрточка. Звук "а".' },
      { markId: 'segol', hebrew: 'פֶּ', transliteration: 'пэ', explanation: 'Сегол — три точки. Звук "э".' },
      { markId: 'chirik', hebrew: 'פִּ', transliteration: 'пи', explanation: 'Хирик — одна точка. Звук "и".' },
      { markId: 'cholam', hebrew: 'פֹּ', transliteration: 'по', explanation: 'Холам — точка над. Звук "о".' },
      { markId: 'shva', hebrew: 'פְּ', transliteration: 'п(э)', explanation: 'Шва — двоеточие. Пауза.' },
    ],
  },
  {
    letter: 'צ', letterName: 'Цади (צדי)',
    entries: [
      { markId: 'kamatz', hebrew: 'צָ', transliteration: 'ца', explanation: 'Камац — чёрточка. Звук "ца".' },
      { markId: 'patach', hebrew: 'צַ', transliteration: 'ца', explanation: 'Патах — чёрточка. Звук "ца".' },
      { markId: 'segol', hebrew: 'צֶ', transliteration: 'цэ', explanation: 'Сегол — три точки. Звук "цэ".' },
      { markId: 'tsere', hebrew: 'צֵ', transliteration: 'цэ', explanation: 'Цере — две точки. Звук "цэ".' },
      { markId: 'chirik', hebrew: 'צִ', transliteration: 'ци', explanation: 'Хирик — одна точка. Звук "ци".' },
      { markId: 'cholam', hebrew: 'צֹ', transliteration: 'цо', explanation: 'Холам — точка над. Звук "цо".' },
    ],
  },
  {
    letter: 'ק', letterName: 'Куф (קוף)',
    entries: [
      { markId: 'kamatz', hebrew: 'קָ', transliteration: 'ка', explanation: 'Камац — чёрточка. Звук "ка".' },
      { markId: 'patach', hebrew: 'קַ', transliteration: 'ка', explanation: 'Патах — чёрточка. Звук "ка".' },
      { markId: 'segol', hebrew: 'קֶ', transliteration: 'кэ', explanation: 'Сегол — три точки. Звук "кэ".' },
      { markId: 'tsere', hebrew: 'קֵ', transliteration: 'кэ', explanation: 'Цере — две точки. Звук "кэ".' },
      { markId: 'chirik', hebrew: 'קִ', transliteration: 'ки', explanation: 'Хирик — одна точка. Звук "ки".' },
      { markId: 'cholam', hebrew: 'קֹ', transliteration: 'ко', explanation: 'Холам — точка над. Звук "ко".' },
    ],
  },
  {
    letter: 'ר', letterName: 'Реш (ריש)',
    entries: [
      { markId: 'kamatz', hebrew: 'רָ', transliteration: 'ра', explanation: 'Камац — чёрточка. Звук "ра".' },
      { markId: 'patach', hebrew: 'רַ', transliteration: 'ра', explanation: 'Патах — чёрточка. Звук "ра".' },
      { markId: 'segol', hebrew: 'רֶ', transliteration: 'рэ', explanation: 'Сегол — три точки. Звук "рэ".' },
      { markId: 'tsere', hebrew: 'רֵ', transliteration: 'рэ', explanation: 'Цере — две точки. Звук "рэ".' },
      { markId: 'chirik', hebrew: 'רִ', transliteration: 'ри', explanation: 'Хирик — одна точка. Звук "ри".' },
      { markId: 'cholam', hebrew: 'רֹ', transliteration: 'ро', explanation: 'Холам — точка над. Звук "ро".' },
    ],
  },
  {
    letter: 'ש', letterName: 'Шин / Син (שין)',
    entries: [
      { markId: 'shinDot', hebrew: 'שָׁ', transliteration: 'ша', explanation: 'Шин (точка справа) — звук "ш". Если точка справа — это Ш.' },
      { markId: 'sinDot', hebrew: 'שָׂ', transliteration: 'са', explanation: 'Син (точка слева) — звук "с". Та же буква, точка слева = "с".' },
      { markId: 'kamatz', hebrew: 'שָׁ', transliteration: 'ша', explanation: 'Камац под шин — "ша".' },
      { markId: 'chirik', hebrew: 'שִׁ', transliteration: 'ши', explanation: 'Хирик под шин — "ши".' },
      { markId: 'shva', hebrew: 'שְׁ', transliteration: 'ш(э)', explanation: 'Шва под шин — пауза.' },
    ],
  },
  {
    letter: 'ת', letterName: 'Тав (תו)',
    entries: [
      { markId: 'kamatz', hebrew: 'תָּ', transliteration: 'та', explanation: 'Камац — чёрточка. Звук "а".' },
      { markId: 'patach', hebrew: 'תַּ', transliteration: 'та', explanation: 'Патах — чёрточка. Звук "а".' },
      { markId: 'segol', hebrew: 'תֶּ', transliteration: 'тэ', explanation: 'Сегол — три точки. Звук "э".' },
      { markId: 'tsere', hebrew: 'תֵּ', transliteration: 'тэ', explanation: 'Цере — две точки. Звук "э".' },
      { markId: 'chirik', hebrew: 'תִּ', transliteration: 'ти', explanation: 'Хирик — одна точка. Звук "и".' },
      { markId: 'cholam', hebrew: 'תֹּ', transliteration: 'то', explanation: 'Холам — точка над. Звук "о".' },
      { markId: 'shva', hebrew: 'תְּ', transliteration: 'т(э)', explanation: 'Шва — двоеточие. Пауза.' },
    ],
  },
];

// ──────────────────────────────────────────────
// SECTION 2: Gender & Number - expanded with all words from DB
// ──────────────────────────────────────────────
interface GenderWord {
  id: string;
  item: GrammarItem;
  gender: 'masc' | 'fem';
  explanation?: string;
}

// Build gender words from vocabulary data
function buildGenderWords(): GenderWord[] {
  const allWords = VOCAB_CATEGORIES.flatMap((c) => c.words);
  const result: GenderWord[] = [];
  let idx = 0;
  for (const w of allWords) {
    // Heuristic: words ending with ה (he) or ת (tav) are likely feminine
    const lastChar = w.hebrew.slice(-1);
    const isFem = lastChar === 'ה' || lastChar === 'ת';
    result.push({
      id: `gen-vocab-${idx}`,
      item: { hebrew: w.hebrew, transliteration: w.transliteration, translation: w.translation },
      gender: isFem ? 'fem' : 'masc',
      explanation: isFem
        ? `Слово оканчивается на "${lastChar}" — типичное окончание женского рода в иврите.`
        : `Слово оканчивается на согласную — типично для мужского рода.`,
    });
    idx++;
  }
  // Add known exceptions
  result.push(
    { id: 'gen-exc1', item: { hebrew: 'לַיְלָה', transliteration: 'лайла', translation: 'ночь (исключение!)' }, gender: 'masc', explanation: 'Исключение! Оканчивается на "-а" (ה), но это мужской род!' },
    { id: 'gen-exc2', item: { hebrew: 'שֻׁלְחָן', transliteration: 'шулхан', translation: 'стол (исключение!)' }, gender: 'masc', explanation: 'Исключение! Слово мужского рода, но во множественном числе получает женское окончание "-от".' },
    { id: 'gen-exc3', item: { hebrew: 'שֻׁלְחָנוֹת', transliteration: 'шулханот', translation: 'столы (исключение!)' }, gender: 'masc', explanation: 'Хотя окончание "-от" женское, само слово "стол" остаётся мужского рода!' },
    { id: 'gen-exc4', item: { hebrew: 'אִמָּא', transliteration: 'има', translation: 'мама (исключение!)' }, gender: 'fem', explanation: 'Хотя "мама" оканчивается на "א", это женский род — логически очевидно.' },
    { id: 'gen-exc5', item: { hebrew: 'אַבָּא', transliteration: 'аба', translation: 'папа (исключение!)' }, gender: 'masc', explanation: 'Хотя "папа" оканчивается на "א" как женское, это мужской род — логически понятно.' },
  );
  return result;
}

const GENDER_WORDS = buildGenderWords();

// ──────────────────────────────────────────────
// Grammar explanation pages for gender section
// ──────────────────────────────────────────────
const GENDER_GRAMMAR_PAGES = [
  {
    title: '📖 Основное правило',
    content: 'В иврите есть два рода: мужской (זָכָר — захар) и женский (נְקֵבָה — некева).\n\n' +
      'Обычно слова женского рода оканчиваются на букву "ה" (хей) с огласовкой "камац" (получается звук "а") или на букву "ת" (тав).\n\n' +
      'Слова мужского рода обычно оканчиваются на любую другую согласную букву.\n\n' +
      'Примеры:\n• יֶלֶד (йелед) — мальчик 👦 (мужской)\n• יַלְדָּה (яльда) — девочка 👧 (женский)',
  },
  {
    title: '📖 Прилагательные',
    content: 'Прилагательные в иврите согласуются с существительным в роде и числе.\n\n' +
      'Мужской род: обычно без окончания. Пример: טוֹב (тов) — хороший.\n' +
      'Женский род: добавляется окончание "ה" (а). Пример: טוֹבָה (това) — хорошая.\n\n' +
      'Запомни: прилагательное стоит ПОСЛЕ существительного!\n' +
      '• יֶלֶד טוֹב (йелед тов) — хороший мальчик\n' +
      '• יַלְדָּה טוֹבָה (яльда това) — хорошая девочка',
  },
  {
    title: '📖 Множественное число',
    content: 'Множественное число в иврите тоже зависит от рода!\n\n' +
      'Мужской род → окончание "ים" (им):\n' +
      '• יֶלֶד (йелед, мальчик) → יְלָדִים (йеладим, мальчики)\n' +
      '• סֵפֶר (сефер, книга) → סְפָרִים (сфарим, книги)\n\n' +
      'Женский род → окончание "ות" (от):\n' +
      '• יַלְדָּה (яльда, девочка) → יְלָדוֹת (йеладот, девочки)\n' +
      '• מִשְׁפָּחָה (мишпаха, семья) → מִשְׁפָּחוֹת (мишпахот, семьи)',
  },
  {
    title: '📖 Исключения и ловушки',
    content: 'В иврите есть много исключений! Вот самые важные:\n\n' +
      '⚠️ Слова женского рода, выглядящие как мужские:\n' +
      '• עִיר (ир, город) — мужской? Нет, женский! Оканчивается на согласную, но это женский род.\n\n' +
      '⚠️ Слова мужского рода, выглядящие как женские:\n' +
      '• לַיְלָה (лайла, ночь) — оканчивается на "а" (ה), но мужской род!\n\n' +
      '⚠️ Исключения во множественном числе:\n' +
      '• שֻׁלְחָן (шулхан, стол) — мужской, но множественное: שֻׁלְחָנוֹת (шулханот) — с женским окончанием!\n\n' +
      '💡 Совет: при изучении новых слов всегда запоминай их род вместе с артиклем!',
  },
  {
    title: '📖 Как определить род?',
    content: 'Если сомневаешься, попробуй эти шаги:\n\n' +
      '1️⃣ Посмотри на последнюю букву:\n' +
      '   • ה (хей) в конце → скорее всего женский\n' +
      '   • ת (тав) в конце → скорее всего женский\n' +
      '   • Другая согласная → скорее всего мужской\n\n' +
      '2️⃣ Проверь значение: слова, обозначающие людей/животных, обычно соответствуют полу.\n\n' +
      '3️⃣ Запомни исключения (их не так много, но они важны!).\n\n' +
      '4️⃣ Используй множественное число для проверки:\n' +
      '   • ים (им) = мужской род\n' +
      '   • ות (от) = женский род',
  },
];

// ──────────────────────────────────────────────
// SECTION 3: Definite Article "Ha" & Prefixes Data
// ──────────────────────────────────────────────
interface PrefixCombo {
  label: string;
  prefix: string;
  hebrewResult: string;
  translitResult: string;
  translationResult: string;
  description: string;
}

// ── Verb/infinitive detection ──
// Hebrew infinitives start with לִ or לְ (lamed + hirik/shva).
// Russian verbs end with -ть, -чь, -ти, -ся, -сь.
function isVerbOrInfinitive(hebrew: string, translation: string): boolean {
  const clean = hebrew.replace(/[\u0591-\u05C7]/g, '');
  // Hebrew infinitives: start with ל
  if (clean.startsWith('ל')) return true;
  // Russian verb endings
  const lower = translation.toLowerCase();
  if (lower.endsWith('ть') || lower.endsWith('чь') || lower.endsWith('ти') ||
      lower.endsWith('тся') || lower.endsWith('ться') || lower.endsWith('сь')) return true;
  return false;
}

// Build prefix combos dynamically for a given base word
function buildPrefixCombos(hebrew: string, translit: string, translation: string): PrefixCombo[] {
  // Remove any existing nikud from the base word for clean prefix application
  const cleanWord = hebrew.replace(/[\u0591-\u05C7]/g, '');
  const lower = translation.toLowerCase();

  // If the word is a verb/infinitive, only show the base form (no prefixes)
  if (isVerbOrInfinitive(hebrew, translation)) {
    return [
      { label: 'Без приставки', prefix: '', hebrewResult: hebrew, translitResult: translit, translationResult: `${translation} (глагол)`, description: 'Это глагол или инфинитив. Приставки ה, ב, ל, מ присоединяются только к существительным и прилагательным, не к глаголам.' },
    ];
  }

  return [
    { label: 'Без приставки', prefix: '', hebrewResult: hebrew, translitResult: translit, translationResult: `${translation} (неопределённый)`, description: 'Исходное слово без изменений.' },
    { label: 'Артикль «הַ» (Определённость)', prefix: 'הַ', hebrewResult: `הַ${cleanWord}`, translitResult: `ха-${translit}`, translationResult: `этот / эта / это — ${translation}`, description: 'Артикль «הַ» (ха-) прикрепляется к началу слова. Слово становится определённым — "этот конкретный предмет".' },
    { label: 'Предлог «בְּ» (В/Внутри)', prefix: 'בְּ', hebrewResult: `בְּ${cleanWord}`, translitResult: `бэ-${translit}`, translationResult: `в ${lower}`, description: 'Предлог «בְּ» (бэ-) = "в". Прикрепляется к началу слова. Указывает на местонахождение.' },
    { label: 'Слияние «בַּ» (В + определённость)', prefix: 'בַּ', hebrewResult: `בַּ${cleanWord}`, translitResult: `ба-${translit}`, translationResult: `в этом / в этой — ${lower}`, description: 'בְּ + הַ = בַּ (ба-). Предлог "в" сливается с артиклем, получается "в этом конкретном предмете".' },
    { label: 'Предлог «לְ» (К/Направление)', prefix: 'לְ', hebrewResult: `לְ${cleanWord}`, translitResult: `лэ-${translit}`, translationResult: `к ${lower} / в направлении ${lower}`, description: 'Предлог «לְ» (лэ-) = "к, в направлении". Прикрепляется к началу слова.' },
    { label: 'Слияние «לַ» (К + определённость)', prefix: 'לַ', hebrewResult: `לַ${cleanWord}`, translitResult: `ла-${translit}`, translationResult: `к этому / к этой — ${lower}`, description: 'לְ + הַ = לַ (ла-). Предлог "к" сливается с артиклем, получается "к этому конкретному предмету".' },
  ];
}

// ──────────────────────────────────────────────
// SECTION 4: Roots (Shoresh) Data
// ──────────────────────────────────────────────
interface RootChallenge {
  id: string;
  rootLetters: string[];
  correctIndices: number[];
  wordPool: { word: GrammarItem; isRootNode: boolean }[];
  hint: string;
}

const ROOT_CHALLENGES: RootChallenge[] = [
  {
    id: 'root1',
    rootLetters: ['כ', 'ת', 'ב'],
    correctIndices: [0, 1, 2],
    hint: 'Корень, связанный с письмом и текстом.',
    wordPool: [
      { word: { hebrew: 'לִכְתֹּב', transliteration: 'лихтов', translation: 'писать (глагол)' }, isRootNode: true },
      { word: { hebrew: 'מִכְתָּב', transliteration: 'михтав', translation: 'письмо (существительное)' }, isRootNode: true },
      { word: { hebrew: 'כְּתֹבֶת', transliteration: 'ктовет', translation: 'адрес (существительное)' }, isRootNode: true },
      { word: { hebrew: 'כָּתַב', transliteration: 'катав', translation: 'написал (прошедшее время)' }, isRootNode: true },
    ]
  },
  {
    id: 'root2',
    rootLetters: ['ל', 'מ', 'ד'],
    correctIndices: [0, 1, 2],
    hint: 'Корень, связанный с учёбой и получением знаний.',
    wordPool: [
      { word: { hebrew: 'לִלְמֹד', transliteration: 'лильмод', translation: 'учиться' }, isRootNode: true },
      { word: { hebrew: 'תַּלְמִיד', transliteration: 'талмид', translation: 'ученик' }, isRootNode: true },
      { word: { hebrew: 'לִמּוּד', transliteration: 'лимуд', translation: 'обучение' }, isRootNode: true },
      { word: { hebrew: 'מְלַמֵּד', transliteration: 'меламед', translation: 'преподаёт / учитель' }, isRootNode: true },
    ]
  },
  {
    id: 'root3',
    rootLetters: ['א', 'כ', 'ל'],
    correctIndices: [0, 1, 2],
    hint: 'Корень, связанный с приёмом пищи.',
    wordPool: [
      { word: { hebrew: 'לֶאֱכֹל', transliteration: 'леэхоль', translation: 'кушать' }, isRootNode: true },
      { word: { hebrew: 'אוֹכֶל', transliteration: 'охель', translation: 'еда' }, isRootNode: true },
      { word: { hebrew: 'מַאֲכָל', transliteration: 'маахаль', translation: 'блюдо' }, isRootNode: true },
      { word: { hebrew: 'אָכַל', transliteration: 'ахаль', translation: 'съел' }, isRootNode: true },
    ]
  }
];

// ──────────────────────────────────────────────
// SECTION 5: Comprehensive grammar reference
// ──────────────────────────────────────────────
const GRAMMAR_RULES: { section: string; icon: string; rules: string[] }[] = [
  {
    section: 'Никуд — гласные точки и чёрточки',
    icon: '🔤',
    rules: [
      'В иврите пишутся только согласные, а гласные обозначаются знаками «никуд» (точки и чёрточки вокруг букв).',
      'Камац ( ָ ) и Патах ( ַ ) звучат одинаково — «а». Камац похож на маленькую Т, Патах — на горизонтальную чёрточку.',
      'Сегол ( ֶ ) и Цере ( ֵ ) звучат как «э». Цере (две точки) чаще встречается в ударных слогах.',
      'Хирик ( ִ ) — одна точка под буквой = «и». Холам ( ֹ ) — точка слева-сверху = «о».',
      'Кубуц ( ֻ ) и Шурук ( точка внутри ו ) дают звук «у».',
      'Шва ( ְ ) — двоеточие под буквой: либо пауза (тихий шва), либо краткий «э» (подвижный шва).',
    ],
  },
  {
    section: 'Матери чтения — буквы ו и י',
    icon: '🔑',
    rules: [
      'Буквы ו (вав) и י (йод) часто пишутся в слове, но обозначают при этом гласные, а не согласные.',
      'וֹ = «о» (полный холам), וּ = «у» (шурук). Поэтому «шалом» пишется שָׁלוֹם — с ו для звука «о».',
      'Йод + хирик/цере обозначает «и»/«э» (например, יִ = «и»).',
      'Совет: если слово звучит как «о» или «у», обычно в нём есть ו. Если «и» или «э» — часто есть י.',
    ],
  },
  {
    section: 'Гортанные буквы и хатафы',
    icon: '🌬️',
    rules: [
      'Гортанные буквы א, ה, ח, ע любят огласовки «хатаф»: אֲ (краткий «а»), אֱ (краткий «э»), אֳ (краткий «о»).',
      'א и ע почти не произносятся — они просто «носят» гласный звук.',
      'ה в конце слова часто молчит или читается как «-а» (например, יַלְדָּה — «яльда»).',
      'ח — гортанный звук, похожий на украинское «г» или немецкое «ch».',
    ],
  },
  {
    section: 'Дагеш и буквы ב, כ, פ',
    icon: '⚫',
    rules: [
      'Точка (дагеш) внутри ב, כ, פ делает звук твёрдым: בּ = «б», כּ = «к», פּ = «п».',
      'Без точки они могут звучать как «в», «х», «ф».',
      'Дагеш в других буквах чаще всего означает удвоение согласной.',
    ],
  },
  {
    section: 'Шин и Син',
    icon: '🔀',
    rules: [
      'Одна буква ש читается как «ш» (шин) или «с» (син).',
      'Точка справа ( שׁ ) = «ш», точка слева ( שׂ ) = «с».',
    ],
  },
  {
    section: 'Конечные буквы (Софит)',
    icon: '🔚',
    rules: [
      'У 5 букв есть особая форма, которая используется только в конце слова: כ→ך, מ→ם, נ→ן, פ→ף, צ→ץ.',
      'Звук при этом не меняется — меняется только написание.',
    ],
  },
  {
    section: 'Важная связка: לִ + י = «ли»',
    icon: '💡',
    rules: [
      'Если ты видишь Ламед с одной точкой Хирик под ним (לִ), то почти всегда следом идёт буква Йод (י).',
      'Вместе לִי читается «ли» и часто значит «мне».',
      'Пример: שֶׁלִּי (шели) — «мой». Это שֶׁ («который») + לִּי («у меня»).',
    ],
  },
  {
    section: 'Род: мужской и женский',
    icon: '👫',
    rules: [
      'Женский род обычно оканчивается на ה (-а) или ת (-т): יַלְדָּה (девочка), בַּת (дочь).',
      'Мужской род обычно оканчивается на согласную: יֶלֶד (мальчик).',
      'Прилагательное согласуется с существительным и стоит ПОСЛЕ него: יֶלֶד טוֹב (хороший мальчик), יַלְדָּה טוֹבָה (хорошая девочка).',
      'Бывают исключения: לַיְלָה (ночь) — мужского рода, хотя оканчивается на «-а».',
    ],
  },
  {
    section: 'Множественное число',
    icon: '➕',
    rules: [
      'Мужской род → окончание ים (-им): סֵפֶר → סְפָרִים (книги).',
      'Женский род → окончание וֹת (-от): יַלְדָּה → יְלָדוֹת (девочки).',
      'Исключения: שֻׁלְחָן (стол, мужской) → שֻׁלְחָנוֹת (с женским окончанием).',
    ],
  },
  {
    section: 'Артикль и приставки',
    icon: '🛡️',
    rules: [
      'Определённый артикль — ה (ха-): בַּיִת (дом) → הַבַּיִת (этот дом).',
      'Предлоги בְּ (в) и לְ (к) прикрепляются к началу слова, как и артикль.',
      'Слияние: בְּ + הַ = בַּ (в этом), לְ + הַ = לַ (к этому).',
    ],
  },
  {
    section: 'Шореш — корни слов',
    icon: '🌳',
    rules: [
      'Почти все слова строятся на трёхбуквенном корне (шореш).',
      'Зная один корень, можно угадать целую семью родственных слов (писать → письмо, адрес, написал).',
    ],
  },
];

type ActiveTab = 'nikud' | 'gender' | 'prefixes' | 'roots' | 'rules';

interface GrammarModuleProps {
  userId?: string;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const GrammarModule: React.FC<GrammarModuleProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('nikud');
  const { playAudio } = useCloudTTS();
  const { playClick, playMatch, playWrong } = useSoundEffects();
  const { trackStep } = useProgressTracker(userId);

  // ── Section 1: Nikud letter selector ──
  const [selectedLetter, setSelectedLetter] = useState<string>('ב');

  // ── Section 2: Gender states ──
  const [genderGameWords, setGenderGameWords] = useState<GenderWord[]>(() => shuffle(GENDER_WORDS).slice(0, 10));
  const [genderWordCount, setGenderWordCount] = useState(10);
  const [genderIndex, setGenderIndex] = useState(0);
  const [genderFeedback, setGenderFeedback] = useState<string | null>(null);
  const [genderScore, setGenderScore] = useState(0);
  const [genderGameDone, setGenderGameDone] = useState(false);
  const [showGenderTranslation, setShowGenderTranslation] = useState(false);
  const [grammarPage, setGrammarPage] = useState(0);

  // ── Section 3: Prefix Simulator ──
  const [prefixIdx, setPrefixIdx] = useState(0);
  const [prefixSearch, setPrefixSearch] = useState('');
  const [selectedPrefixWord, setSelectedPrefixWord] = useState<string>('בַּיִת');
  const [selectedPrefixWordTranslit, setSelectedPrefixWordTranslit] = useState<string>('байт');
  const [selectedPrefixWordTranslation, setSelectedPrefixWordTranslation] = useState<string>('дом');
  const prefixCombos = buildPrefixCombos(selectedPrefixWord, selectedPrefixWordTranslit, selectedPrefixWordTranslation);

  // ── Section 4: Roots Game ──
  const [rootIdx, setRootIdx] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [rootSolved, setRootSolved] = useState(false);

  const currentLetterInfo = LETTER_NIKUD_INFO.find((l) => l.letter === selectedLetter);

  const handleTabChange = (tab: ActiveTab) => {
    playClick();
    setActiveTab(tab);
  };

  const handleTTS = (hebrew: string) => {
    playAudio(hebrew);
  };

  // ── Section 2: Gender Handlers ──
  const startGenderGame = () => {
    const selected = shuffle(GENDER_WORDS).slice(0, genderWordCount);
    setGenderGameWords(selected);
    setGenderIndex(0);
    setGenderScore(0);
    setGenderGameDone(false);
    setGenderFeedback(null);
  };

  const handleGenderChoice = (choice: 'masc' | 'fem') => {
    const currentWord = genderGameWords[genderIndex];
    const isCorrect = currentWord.gender === choice;

    if (isCorrect) {
      playMatch();
      setGenderScore((s) => s + 1);
      setGenderFeedback('✅ Правильно!');
    } else {
      playWrong();
      const hint = currentWord.explanation ? ` ${currentWord.explanation}` : '';
      setGenderFeedback(`❌ Неверно! «${currentWord.item.translation}» (${currentWord.item.hebrew}) — это ${currentWord.gender === 'masc' ? 'мужской' : 'женский'} род.${hint}`);
    }

    trackStep({
      moduleId: 'grammar',
      stepId: `gender_choice:${currentWord.item.hebrew}`,
      isCorrect: isCorrect,
    }).catch((e) => console.error(e));

    setTimeout(() => {
      setGenderFeedback(null);
      if (genderIndex + 1 < genderGameWords.length) {
        setGenderIndex((idx) => idx + 1);
      } else {
        setGenderGameDone(true);
      }
    }, 2800);
  };

  // ── Section 4: Roots ──
  const handleLetterClick = (letter: string) => {
    playClick();
    const challenge = ROOT_CHALLENGES[rootIdx];
    let nextSelected = [...selectedLetters];
    if (nextSelected.includes(letter)) {
      nextSelected = nextSelected.filter((l) => l !== letter);
    } else {
      if (nextSelected.length < 3) nextSelected.push(letter);
    }
    setSelectedLetters(nextSelected);
    const solved = challenge.rootLetters.every((l) => nextSelected.includes(l));
    if (solved && nextSelected.length === 3) {
      playMatch();
      setRootSolved(true);
      trackStep({
        moduleId: 'grammar',
        stepId: `root_solved:${challenge.rootLetters.join('-')}`,
        isCorrect: true,
      }).catch((e) => console.error(e));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📝 Интерактивная Грамматика</h1>
          <p className={styles.subtitle}>Осваивай структуру иврита без зубрёжки в игровой форме!</p>
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/')}>← Назад</button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        <button className={`${styles.tabBtn} ${activeTab === 'nikud' ? styles.tabBtnActive : ''}`} onClick={() => handleTabChange('nikud')}>
          🔤 Никуд & Огласовки
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'gender' ? styles.tabBtnActive : ''}`} onClick={() => handleTabChange('gender')}>
          👫 Род и число
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'prefixes' ? styles.tabBtnActive : ''}`} onClick={() => handleTabChange('prefixes')}>
          🛡️ Артикль & Приставки
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'roots' ? styles.tabBtnActive : ''}`} onClick={() => handleTabChange('roots')}>
          🌳 Шореш (Секрет корней)
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'rules' ? styles.tabBtnActive : ''}`} onClick={() => handleTabChange('rules')}>
          📖 Все правила
        </button>
      </div>

      {/* ── SECTION 1: Nikud with letter selector ── */}
      {activeTab === 'nikud' && (
        <div className={styles.sectionWrap}>
          <div className={styles.explainCard}>
            <h3>🎯 Что такое Никуд (Огласовки)?</h3>
            <p>
              В иврите пишутся только согласные буквы! Гласные звуки (а, е, и, о, у) обозначаются точками и чёрточками вокруг букв.
              Выбери букву слева, чтобы увидеть все её огласовки с примерами и объяснениями.
            </p>
          </div>

          <div className={styles.nikudLayout}>
            {/* Letter selector */}
            <div className={styles.syllableColumn}>
              <h4>Выбери букву:</h4>
              <div className={styles.syllableGrid}>
                {LETTER_NIKUD_INFO.map((info) => (
                  <button
                    key={info.letter}
                    className={`${styles.syllableTile} ${selectedLetter === info.letter ? styles.syllableTileActive : ''}`}
                    onClick={() => {
                      playClick();
                      setSelectedLetter(info.letter);
                    }}
                  >
                    <span className={styles.hebrewText}>{info.letter}</span>
                    <span className={styles.letterNameSmall}>{info.letterName.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Letter info */}
            <div className={styles.soundColumn}>
              {currentLetterInfo && (
                <>
                  <h4>Буква {currentLetterInfo.letter} — {currentLetterInfo.letterName}</h4>
                  <div className={styles.nikudRefGrid}>
                    {currentLetterInfo.entries.map((entry) => {
                      const mark = NIKUD_MARKS.find((m) => m.id === entry.markId);
                      return (
                        <div key={entry.markId} className={styles.nikudRefItem}>
                          <div className={styles.nikudRefHeader}>
                            <button className={styles.miniTtsBtn} onClick={() => handleTTS(entry.hebrew)}>🔊</button>
                            <span className={styles.nikudRefHeb}>{entry.hebrew}</span>
                            <span className={styles.nikudRefTranslit}>[{entry.transliteration}]</span>
                          </div>
                          <div className={styles.nikudRefExp}>
                            {mark && <span className={styles.nikudRefMark}>{mark.char} = {mark.name}. </span>}
                            {entry.explanation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 2: Gender with all words, word count, toggle, grammar pages ── */}
      {activeTab === 'gender' && (
        <div className={styles.sectionWrap}>
          <div className={styles.explainCard}>
            <h3>👫 Род в Иврите: Мужской vs Женский</h3>
            <p>
              В иврите существительные и прилагательные делятся на мужской и женский род.
              Обычно слова женского рода оканчиваются на <strong>"а" (ה)</strong> или на <strong>"т" (ת)</strong>.
              Но берегись ловушек и исключений!
            </p>
          </div>

          {/* Grammar rules paginated */}
          <div className={styles.grammarRulesCard}>
            <div className={styles.grammarPagesNav}>
              <button
                className={styles.grammarNavBtn}
                onClick={() => setGrammarPage((p) => Math.max(0, p - 1))}
                disabled={grammarPage === 0}
              >
                ← Назад
              </button>
              <span className={styles.grammarPageIndicator}>
                {GENDER_GRAMMAR_PAGES[grammarPage].title}
              </span>
              <button
                className={styles.grammarNavBtn}
                onClick={() => setGrammarPage((p) => Math.min(GENDER_GRAMMAR_PAGES.length - 1, p + 1))}
                disabled={grammarPage === GENDER_GRAMMAR_PAGES.length - 1}
              >
                Далее →
              </button>
            </div>
            <div className={styles.grammarPageContent}>
              {GENDER_GRAMMAR_PAGES[grammarPage].content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className={styles.grammarDots}>
              {GENDER_GRAMMAR_PAGES.map((_, i) => (
                <span key={i} className={`${styles.grammarDot} ${i === grammarPage ? styles.grammarDotActive : ''}`} />
              ))}
            </div>
          </div>

          <div className={styles.gameArea}>
            {!genderGameDone ? (
              <div className={styles.genderContainer}>
                {/* Word count + toggle + start */}
                <div className={styles.genderControls}>
                  <div className={styles.genderCountRow}>
                    <span className={styles.countLabel}>
                      Слов: <strong>{genderWordCount}</strong> (из {GENDER_WORDS.length})
                    </span>
                    <input
                      type="range"
                      min={5}
                      max={Math.min(30, GENDER_WORDS.length)}
                      step={1}
                      value={genderWordCount}
                      onChange={(e) => {
                        setGenderWordCount(Number(e.target.value));
                        setGenderIndex(0);
                        setGenderScore(0);
                        setGenderGameDone(false);
                        setGenderFeedback(null);
                      }}
                      className={styles.countSlider}
                    />
                  </div>
                  <div className={styles.genderToggleRow}>
                    <button
                      className={`${styles.toggleBtn} ${showGenderTranslation ? styles.toggleBtnOn : ''}`}
                      onClick={() => setShowGenderTranslation((v) => !v)}
                    >
                      {showGenderTranslation ? '🔤 Значение: ON' : '🔤 Значение: OFF'}
                    </button>
                  </div>
                </div>

                {/* Active card */}
                {(() => {
                  const current = genderGameWords[genderIndex];
                  if (!current) return null;
                  return (
                    <div className={styles.genderCard}>
                      <div className={styles.cardHeader}>
                        <button className={styles.speakBtn} onClick={() => handleTTS(current.item.hebrew)}>🔊 Прослушать</button>
                        <span>Слово {genderIndex + 1} из {genderGameWords.length}</span>
                      </div>
                      <div className={styles.genderHebValue}>{current.item.hebrew}</div>
                      <div className={styles.genderTranslit}>[{current.item.transliteration}]</div>
                      {showGenderTranslation && (
                        <div className={styles.genderTranslation}>Значение: {current.item.translation}</div>
                      )}
                    </div>
                  );
                })()}

                {/* Feedback */}
                {genderFeedback && <div className={styles.genderFeedback}>{genderFeedback}</div>}

                {/* Buckets */}
                <div className={styles.bucketRow}>
                  <button className={`${styles.bucketBtn} ${styles.bucketMasc}`} onClick={() => handleGenderChoice('masc')}>
                    👨 Мужской род (זָכָר)
                  </button>
                  <button className={`${styles.bucketBtn} ${styles.bucketFem}`} onClick={() => handleGenderChoice('fem')}>
                    👩 Женский род (נְקֵבָה)
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.resultsPanel}>
                <h3>🎉 Игра пройдена!</h3>
                <p>Твой результат: <strong>{genderScore} из {genderGameWords.length}</strong> угаданных слов!</p>
                <button className={styles.startBtn} onClick={startGenderGame}>
                  Играть заново ↩
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SECTION 3: Prefixes with dynamic word selector ── */}
      {activeTab === 'prefixes' && (
        <div className={styles.sectionWrap}>
          <div className={styles.explainCard}>
            <h3>🛡️ Волшебный артикль «ה» [ха] и приставки слияния</h3>
            <p>
              В русском языке нет артиклей, но в иврите артикль <strong>ה [ха]</strong> делает слово определённым.
              А если перед ним поставить предлоги <strong>בּ [в]</strong> или <strong>ל [к]</strong>, они поглощают артикль, превращаясь в <strong>ба-</strong> и <strong>ла-</strong>!
              Выбери слово из списка и посмотри, как меняется его форма!
            </p>
          </div>

          {/* Word selector with search */}
          <div className={styles.prefixWordSelector}>
            <div className={styles.prefixSearchRow}>
              <input
                type="text"
                className={styles.prefixSearchInput}
                placeholder="🔍 Поиск слова..."
                value={prefixSearch}
                onChange={(e) => setPrefixSearch(e.target.value)}
              />
            </div>
            <select
              className={styles.prefixSelect}
              size={8}
              value={selectedPrefixWord}
              onChange={(e) => {
                const selected = e.target.value;
                const allWords = VOCAB_CATEGORIES.flatMap((c) => c.words);
                const word = allWords.find((w) => w.hebrew === selected);
                if (word) {
                  playClick();
                  setSelectedPrefixWord(word.hebrew);
                  setSelectedPrefixWordTranslit(word.transliteration);
                  setSelectedPrefixWordTranslation(word.translation);
                  setPrefixIdx(0);
                }
              }}
            >
              {VOCAB_CATEGORIES.flatMap((c) => c.words)
                .filter((w) => {
                  if (!prefixSearch.trim()) return true;
                  const q = prefixSearch.toLowerCase();
                  return w.translation.toLowerCase().includes(q) || w.hebrew.includes(q) || w.transliteration.toLowerCase().includes(q);
                })
                .map((w) => (
                  <option key={w.id} value={w.hebrew}>
                    {w.hebrew} — {w.translation} [{w.transliteration}]
                  </option>
                ))}
            </select>
            {VOCAB_CATEGORIES.flatMap((c) => c.words).filter((w) => {
              if (!prefixSearch.trim()) return true;
              const q = prefixSearch.toLowerCase();
              return w.translation.toLowerCase().includes(q) || w.hebrew.includes(q) || w.transliteration.toLowerCase().includes(q);
            }).length === 0 && (
              <div className={styles.prefixNoWords}>Ничего не найдено</div>
            )}
          </div>

          <div className={styles.gameArea}>
            <div className={styles.prefixesSimulator}>
              <div className={styles.simulatorPreview}>
                <div className={styles.simPreviewWord}>{selectedPrefixWord}</div>
                <div className={styles.simPreviewTranslit}>[{selectedPrefixWordTranslit}]</div>
                <div className={styles.simPreviewTranslation}>{selectedPrefixWordTranslation}</div>

                <div className={styles.simDivider} />

                <div className={styles.simText}>{prefixCombos[prefixIdx]?.hebrewResult}</div>
                <div className={styles.simSub}>
                  транслитерация: <strong>{prefixCombos[prefixIdx]?.translitResult}</strong>
                </div>
                <div className={styles.simMeaning}>
                  перевод: <strong>{prefixCombos[prefixIdx]?.translationResult}</strong>
                </div>
                <div className={styles.simDescription}>
                  {prefixCombos[prefixIdx]?.description}
                </div>
                <button className={styles.simSpeakBtn} onClick={() => handleTTS(prefixCombos[prefixIdx]?.hebrewResult ?? selectedPrefixWord)}>
                  🔊 Прослушать произношение
                </button>
              </div>

              <div className={styles.prefixesMenu}>
                <h4>Выбери приставку:</h4>
                <div className={styles.simButtonsCol}>
                  {prefixCombos.map((combo, idx) => (
                    <button
                      key={combo.label}
                      className={`${styles.simToggle} ${prefixIdx === idx ? styles.simToggleActive : ''}`}
                      onClick={() => { playClick(); setPrefixIdx(idx); handleTTS(combo.hebrewResult); }}
                    >
                      <span className={styles.simPrefixMark}>{combo.prefix || '—'}</span>
                      <span className={styles.simPrefixLabel}>{combo.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 4: Roots ── */}
      {activeTab === 'roots' && (
        <div className={styles.sectionWrap}>
          <div className={styles.explainCard}>
            <h3>🌳 Секрет корней (Шореш)</h3>
            <p>
              Почти все слова в иврите строятся на трёхбуквенных корнях (Шореш).
              Зная один корень, ты можешь угадать значение десятков родственных существительных, глаголов и прилагательных!
              Найди буквы корня в выданном тебе слове!
            </p>
          </div>

          <div className={styles.gameArea}>
            <div className={styles.rootFinderWrap}>
              <div className={styles.rootFinderHeader}>
                <h4>Испытание {rootIdx + 1} из {ROOT_CHALLENGES.length}</h4>
                <p>Подсказка: {ROOT_CHALLENGES[rootIdx].hint}</p>
              </div>

              <div className={styles.lettersDisplay}>
                <h5>Выбери 3 корневые буквы:</h5>
                <div className={styles.lettersGrid}>
                  {['כ', 'ת', 'ב', 'ל', 'מ', 'ד', 'א', 'כ', 'ל', 'ר', 'ש', 'ה'].map((char, index) => {
                    const isSelected = selectedLetters.includes(char);
                    return (
                      <button
                        key={`${char}-${index}`}
                        className={`${styles.letterTile} ${isSelected ? styles.letterTileActive : ''}`}
                        onClick={() => handleLetterClick(char)}
                        disabled={rootSolved}
                      >
                        {char}
                      </button>
                    );
                  })}
                </div>
              </div>

              {rootSolved ? (
                <div className={styles.rootFamilyMap}>
                  <h4 className={styles.familyTitle}>🎉 Корень найден! Корень: {ROOT_CHALLENGES[rootIdx].rootLetters.join(' - ')}</h4>
                  <p>Смотри, какое дерево слов вырастает из этого корня:</p>
                  <div className={styles.familyGrid}>
                    {ROOT_CHALLENGES[rootIdx].wordPool.map((node, i) => (
                      <div key={i} className={styles.familyNode}>
                        <div className={styles.nodeHeb}>{node.word.hebrew}</div>
                        <div className={styles.nodeTranslit}>[{node.word.transliteration}]</div>
                        <div className={styles.nodeTranslation}>{node.word.translation}</div>
                        <button className={styles.nodeSpeak} onClick={() => handleTTS(node.word.hebrew)}>🔊 Слушать</button>
                      </div>
                    ))}
                  </div>
                  {rootIdx + 1 < ROOT_CHALLENGES.length ? (
                    <button className={styles.nextChallengeBtn} onClick={() => { playClick(); setRootIdx((i) => i + 1); setSelectedLetters([]); setRootSolved(false); }}>
                      Следующий корень →
                    </button>
                  ) : (
                    <div className={styles.completeRootsBox}>
                      <span className={styles.winBanner}>🌳 Потрясающе! Ты разгадал секрет корней в иврите!</span>
                      <button className={styles.restartBtn} onClick={() => { playClick(); setRootIdx(0); setSelectedLetters([]); setRootSolved(false); }}>
                        Пройти сначала ↩
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.currentLettersDisplay}>
                  Выбранный корень: <strong>{selectedLetters.join(' - ') || '—'}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── SECTION 5: All grammar rules ── */}
      {activeTab === 'rules' && (
        <div className={styles.sectionWrap}>
          <div className={styles.explainCard}>
            <h3>📖 Все правила иврита — коротко и понятно</h3>
            <p>
              Собери все ключевые правила в одном месте: от огласовок и «матерей чтения»
              до рода, числа, приставок и корней. Читай по порядку или сразу переходи к нужному блоку.
            </p>
          </div>

          <div className={styles.rulesList}>
            {GRAMMAR_RULES.map((group) => (
              <div key={group.section} className={styles.rulesCard}>
                <h4 className={styles.rulesCardTitle}>{group.icon} {group.section}</h4>
                <ul className={styles.rulesCardList}>
                  {group.rules.map((rule, i) => <li key={i}>{rule}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GrammarModule;
