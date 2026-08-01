/**
 * Pre-defined Hebrew sentences used by the WordsDragBuilderGame.
 *
 * Each token is one word in the sentence (stored in left-to-right Unicode order;
 * the sentence container is rendered with dir="rtl" so it displays correctly).
 *
 * Tokens whose `id` matches a VocabWord.id become blanks that the user must fill.
 * Tokens with `id: null` are "filler" words (prepositions, pronouns, etc.) shown
 * as plain text in the sentence.
 */

export interface SentenceToken {
  /** VocabWord.id if this is a vocabulary word, null for grammatical filler words. */
  id: string | null;
  hebrew: string;
  transliteration: string;
  translation: string;
}

export interface DragSentence {
  id: string;
  /** Full Russian translation shown as a hint after the user checks the answer. */
  translation: string;
  /** Words in natural reading order (the container uses dir="rtl"). */
  tokens: SentenceToken[];
}

export const DRAG_SENTENCES: DragSentence[] = [
  {
    id: 's1',
    translation: 'Привет, мама!',
    tokens: [
      { id: 'g1',   hebrew: 'שָׁלוֹם',     transliteration: 'шалом',    translation: 'Привет'  },
      { id: 'fam1', hebrew: 'אִמָּא',       transliteration: 'има',      translation: 'Мама'    },
    ],
  },
  {
    id: 's2',
    translation: 'Спасибо, папа!',
    tokens: [
      { id: 'g2',   hebrew: 'תּוֹדָה',     transliteration: 'тода',      translation: 'Спасибо' },
      { id: 'fam2', hebrew: 'אַבָּא',       transliteration: 'аба',       translation: 'Папа'    },
    ],
  },
  {
    id: 's3',
    translation: 'Я ем хлеб',
    tokens: [
      { id: null,   hebrew: 'אֲנִי',        transliteration: 'ани',       translation: 'Я'       },
      { id: null,   hebrew: 'אוֹכֵל',       transliteration: 'охель',     translation: 'ем'      },
      { id: 'f1',   hebrew: 'לֶחֶם',        transliteration: 'лехем',     translation: 'хлеб'    },
    ],
  },
  {
    id: 's4',
    translation: 'Папа пьёт воду',
    tokens: [
      { id: 'fam2', hebrew: 'אַבָּא',        transliteration: 'аба',       translation: 'Папа'    },
      { id: null,   hebrew: 'שׁוֹתֶה',       transliteration: 'шоте',      translation: 'пьёт'    },
      { id: 'f2',   hebrew: 'מַיִם',         transliteration: 'маим',      translation: 'воду'    },
    ],
  },
  {
    id: 's5',
    translation: 'Один, два, три',
    tokens: [
      { id: 'n1',   hebrew: 'אֶחָד',         transliteration: 'эхад',      translation: 'Один'    },
      { id: 'n2',   hebrew: 'שְׁתַּיִם',      transliteration: 'штайм',     translation: 'Два'     },
      { id: 'n3',   hebrew: 'שָׁלוֹשׁ',       transliteration: 'шалош',     translation: 'Три'     },
    ],
  },
  {
    id: 's6',
    translation: 'День и ночь',
    tokens: [
      { id: 'tm1',  hebrew: 'יוֹם',           transliteration: 'йом',       translation: 'День'    },
      { id: null,   hebrew: 'וְ',              transliteration: 'ве',        translation: 'и'       },
      { id: 'tm2',  hebrew: 'לַיְלָה',         transliteration: 'лайла',     translation: 'Ночь'    },
    ],
  },
  {
    id: 's7',
    translation: 'Красное яблоко',
    tokens: [
      { id: 'f4',   hebrew: 'תַּפּוּחַ',       transliteration: 'тапуах',    translation: 'Яблоко'  },
      { id: 'c1',   hebrew: 'אָדֹם',           transliteration: 'адом',      translation: 'Красный' },
    ],
  },
  {
    id: 's8',
    translation: 'Я хочу есть',
    tokens: [
      { id: null,   hebrew: 'אֲנִי',           transliteration: 'ани',       translation: 'Я'       },
      { id: null,   hebrew: 'רוֹצֶה',           transliteration: 'роце',      translation: 'хочу'    },
      { id: 'v2',   hebrew: 'לֶאֱכוֹל',         transliteration: 'леэхоль',   translation: 'есть'    },
    ],
  },
  {
    id: 's9',
    translation: 'Билет и станция',
    tokens: [
      { id: 't4',   hebrew: 'כַּרְטִיס',        transliteration: 'картис',    translation: 'Билет'   },
      { id: null,   hebrew: 'וְ',               transliteration: 'ве',        translation: 'и'       },
      { id: 't3',   hebrew: 'תַּחֲנָה',          transliteration: 'тахана',    translation: 'Станция' },
    ],
  },
  {
    id: 's10',
    translation: 'Пожалуйста, спасибо',
    tokens: [
      { id: 'g5',   hebrew: 'בְּבַקָּשָׁה',     transliteration: 'бэвакаша',  translation: 'Пожалуйста' },
      { id: 'g2',   hebrew: 'תּוֹדָה',          transliteration: 'тода',      translation: 'Спасибо'    },
    ],
  },
  {
    id: 's11',
    translation: 'Брат и сестра',
    tokens: [
      { id: 'fam3', hebrew: 'אָח',              transliteration: 'ах',        translation: 'Брат'    },
      { id: null,   hebrew: 'וְ',               transliteration: 'ве',        translation: 'и'       },
      { id: 'fam4', hebrew: 'אָחוֹת',            transliteration: 'ахот',      translation: 'Сестра'  },
    ],
  },
  {
    id: 's12',
    translation: 'Сейчас и завтра',
    tokens: [
      { id: 'tm3',  hebrew: 'עַכְשָׁיו',        transliteration: 'ахшав',     translation: 'Сейчас'  },
      { id: null,   hebrew: 'וְ',               transliteration: 'ве',        translation: 'и'       },
      { id: 'tm4',  hebrew: 'מָחָר',             transliteration: 'махар',     translation: 'Завтра'  },
    ],
  },
];
