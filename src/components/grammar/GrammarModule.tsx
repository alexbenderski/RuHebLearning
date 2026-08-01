import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GrammarItem } from '../../types';
import useCloudTTS from '../../hooks/useCloudTTS';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useProgressTracker } from '../../hooks/useProgressTracker';
import styles from './GrammarModule.module.css';

// ──────────────────────────────────────────────
// SECTION 1: Nikud / Vowels & Diacritics Syllable Matcher Data
// ──────────────────────────────────────────────
interface SyllableMatch {
  id: string;
  syllable: GrammarItem;
  sound: string; // The target Russian transcription (e.g., "ба", "бе")
}

const SYLLABLE_DATA: SyllableMatch[] = [
  { id: 'nik1', syllable: { hebrew: 'בָּ', transliteration: 'ба', translation: 'Слог БА (Огласовка Камац)' }, sound: 'ба' },
  { id: 'nik2', syllable: { hebrew: 'בֵּ', transliteration: 'бе', translation: 'Слог БЕ (Огласовка Цере)' }, sound: 'бе' },
  { id: 'nik3', syllable: { hebrew: 'בִּי', transliteration: 'би', translation: 'Слог БИ (Огласовка Хирик)' }, sound: 'би' },
  { id: 'nik4', syllable: { hebrew: 'בּוֹ', transliteration: 'бо', translation: 'Слог БО (Огласовка Холам)' }, sound: 'бо' },
  { id: 'nik5', syllable: { hebrew: 'בּוּ', transliteration: 'бу', translation: 'Слог БУ (Огласовка Шурук)' }, sound: 'бу' },
];

// ──────────────────────────────────────────────
// SECTION 2: Gender & Number Card Sorting Data
// ──────────────────────────────────────────────
interface GenderWord {
  id: string;
  item: GrammarItem;
  gender: 'masc' | 'fem';
  explanation?: string; // Russian explanation for exceptions
}

const GENDER_WORDS: GenderWord[] = [
  { id: 'gen1', item: { hebrew: 'יֶלֶד', transliteration: 'йелед', translation: 'мальчик' }, gender: 'masc' },
  { id: 'gen2', item: { hebrew: 'יַלְדָּה', transliteration: 'яльда', translation: 'девочка' }, gender: 'fem' },
  { id: 'gen3', item: { hebrew: 'חָתוּל', transliteration: 'хатуль', translation: 'кот' }, gender: 'masc' },
  { id: 'gen4', item: { hebrew: 'חֲתוּלָה', transliteration: 'хатула', translation: 'кошка' }, gender: 'fem' },
  { id: 'gen5', item: { hebrew: 'טוֹב', transliteration: 'тов', translation: 'хороший' }, gender: 'masc' },
  { id: 'gen6', item: { hebrew: 'טוֹבָה', transliteration: 'това', translation: 'хорошая' }, gender: 'fem' },
  // Tricky exceptions
  { id: 'gen7', item: { hebrew: 'שֻׁלְחָן', transliteration: 'шулхан', translation: 'стол (исключение!)' }, gender: 'masc', explanation: 'Оканчивается как мужской род, но во множественном числе получает женское окончание "от" (шулханот)!' },
  { id: 'gen8', item: { hebrew: 'שֻׁלְחָנוֹת', transliteration: 'шулханот', translation: 'столы (исключение!)' }, gender: 'masc', explanation: 'Хотя окончание "-от" женское, само слово "стол" остаётся мужского рода!' },
  { id: 'gen9', item: { hebrew: 'לַיְלָה', transliteration: 'лайла', translation: 'ночь (исключение!)' }, gender: 'masc', explanation: 'Оканчивается на "-а" (типично для женского рода), но это слово мужского рода!' },
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
}

const PREFIX_COMBOS: PrefixCombo[] = [
  { label: 'Без приставки', prefix: '', hebrewResult: 'בַּיִת', translitResult: 'байт', translationResult: 'дом (какой-то один из многих)' },
  { label: 'Артикль «ה» (Определённость)', prefix: 'הַ', hebrewResult: 'הַבַּיִת', translitResult: 'ха-байт', translationResult: 'конкретный / этот дом' },
  { label: 'Предлог «ב» (В каком-то)', prefix: 'בְּ', hebrewResult: 'בְּבַיִת', translitResult: 'бэ-байт', translationResult: 'в каком-то доме (неопределённый)' },
  { label: 'Слияние «ב + ה» (В этом конкретном)', prefix: 'בַּ', hebrewResult: 'בַּבַּיִת', translitResult: 'ба-байт', translationResult: 'в этом конкретном доме (внутри)' },
  { label: 'Предлог «ל» (К какому-то)', prefix: 'לְ', hebrewResult: 'לְבַיִת', translitResult: 'лэ-байт', translationResult: 'к какому-то дому / в направление дома' },
  { label: 'Слияние «ל + ה» (К этому конкретному)', prefix: 'לַ', hebrewResult: 'לַבַּיִת', translitResult: 'ла-байт', translationResult: 'к этому конкретному дому / прямо в этот дом' },
];

// ──────────────────────────────────────────────
// SECTION 4: Roots (Shoresh) Data
// ──────────────────────────────────────────────
interface RootChallenge {
  id: string;
  rootLetters: string[]; // e.g. ["כ", "ת", "ב"]
  correctIndices: number[]; // Indices of actual root letters in the challenge presentation
  wordPool: { word: GrammarItem; isRootNode: boolean }[];
  hint: string;
}

const ROOT_CHALLENGES: RootChallenge[] = [
  {
    id: 'root1',
    rootLetters: ['כ', 'ת', 'ב'],
    correctIndices: [0, 1, 2], // כ-ת-ב
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
    correctIndices: [0, 1, 2], // ל-מ-ד
    hint: 'Корень, связанный с учёбой и получением знаний.',
    wordPool: [
      { word: { hebrew: 'לִלְמֹד', transliteration: 'лильмод', translation: 'учиться' }, isRootNode: true },
      { word: { hebrew: 'תַּלְמִיד', transliteration: 'талмид', translation: 'ученик' }, isRootNode: true },
      { word: { hebrew: 'לִמּוּด', transliteration: 'лимуд', translation: 'обучение' }, isRootNode: true },
      { word: { hebrew: 'מְלַמֵּד', transliteration: 'меламед', translation: 'преподаёт / учитель' }, isRootNode: true },
    ]
  },
  {
    id: 'root3',
    rootLetters: ['א', 'כ', 'ל'],
    correctIndices: [0, 1, 2], // א-כ-л
    hint: 'Корень, связанный с приёмом пищи.',
    wordPool: [
      { word: { hebrew: 'לֶאֱכֹל', transliteration: 'леэхоль', translation: 'кушать' }, isRootNode: true },
      { word: { hebrew: 'אוֹכֶל', transliteration: 'охель', translation: 'еда' }, isRootNode: true },
      { word: { hebrew: 'מַאֲכָל', transliteration: 'маахаль', translation: 'блюдо' }, isRootNode: true },
      { word: { hebrew: 'אָכַל', transliteration: 'ахаль', translation: 'съел' }, isRootNode: true },
    ]
  }
];

type ActiveTab = 'nikud' | 'gender' | 'prefixes' | 'roots';

interface GrammarModuleProps {
  userId?: string;
}

const GrammarModule: React.FC<GrammarModuleProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('nikud');
  const { playAudio } = useCloudTTS();
  const { playClick, playMatch } = useSoundEffects();
  const { trackStep } = useProgressTracker(userId);

  // ──────────────────────────────────────────────
  // States for Section 1 (Nikud Game)
  // ──────────────────────────────────────────────
  const [selectedSyllableId, setSelectedSyllableId] = useState<string | null>(null);
  const [nikudScore, setNikudScore] = useState(0);
  const [nikudDone, setNikudDone] = useState<Set<string>>(new Set());

  // ──────────────────────────────────────────────
  // States for Section 2 (Gender Game)
  // ──────────────────────────────────────────────
  const [genderIndex, setGenderIndex] = useState(0);
  const [genderFeedback, setGenderFeedback] = useState<string | null>(null);
  const [genderScore, setGenderScore] = useState(0);
  const [genderGameDone, setGenderGameDone] = useState(false);

  // ──────────────────────────────────────────────
  // States for Section 3 (Prefix Simulator)
  // ──────────────────────────────────────────────
  const [prefixIdx, setPrefixIdx] = useState(0);

  // ──────────────────────────────────────────────
  // States for Section 4 (Roots Game)
  // ──────────────────────────────────────────────
  const [rootIdx, setRootIdx] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [rootSolved, setRootSolved] = useState(false);

  const handleTabChange = (tab: ActiveTab) => {
    playClick();
    setActiveTab(tab);
  };

  const handleTTS = (hebrew: string) => {
    playAudio(hebrew);
  };

  // ──────────────────────────────────────────────
  // Section 1: Syllable Matcher Handler
  // ──────────────────────────────────────────────
  const handleSelectSyllable = (id: string, hebrew: string) => {
    playClick();
    handleTTS(hebrew);
    if (nikudDone.has(id)) return;
    setSelectedSyllableId(id);
  };

  const handleMatchSound = (sound: string) => {
    if (!selectedSyllableId) return;
    const match = SYLLABLE_DATA.find((s) => s.id === selectedSyllableId);
    if (match && match.sound === sound) {
      playMatch();
      setNikudScore((s) => s + 1);
      setNikudDone((prev) => new Set(prev).add(selectedSyllableId));
      setSelectedSyllableId(null);
      trackStep({
        moduleId: 'grammar',
        stepId: `nikud_match:${match.syllable.hebrew}`,
        isCorrect: true,
      }).catch((e) => console.error(e));
    } else {
      playClick(); // buzz/error tone or regular click
    }
  };

  // ──────────────────────────────────────────────
  // Section 2: Gender Selector Handler
  // ──────────────────────────────────────────────
  const handleGenderChoice = (choice: 'masc' | 'fem') => {
    const currentWord = GENDER_WORDS[genderIndex];
    const isCorrect = currentWord.gender === choice;

    if (isCorrect) {
      playMatch();
      setGenderScore((s) => s + 1);
      setGenderFeedback('✅ Правильно!');
    } else {
      playClick();
      setGenderFeedback(`❌ Неверно! Попробуй ещё раз. ${currentWord.explanation ?? ''}`);
    }

    trackStep({
      moduleId: 'grammar',
      stepId: `gender_choice:${currentWord.item.hebrew}`,
      isCorrect: isCorrect,
    }).catch((e) => console.error(e));

    setTimeout(() => {
      setGenderFeedback(null);
      if (genderIndex + 1 < GENDER_WORDS.length) {
        setGenderIndex((idx) => idx + 1);
      } else {
        setGenderGameDone(true);
      }
    }, 2800);
  };

  // ──────────────────────────────────────────────
  // Section 4: Roots Selector Handler
  // ──────────────────────────────────────────────
  const handleLetterClick = (letter: string) => {
    playClick();
    const challenge = ROOT_CHALLENGES[rootIdx];
    let nextSelected = [...selectedLetters];

    if (nextSelected.includes(letter)) {
      nextSelected = nextSelected.filter((l) => l !== letter);
    } else {
      if (nextSelected.length < 3) {
        nextSelected.push(letter);
      }
    }
    setSelectedLetters(nextSelected);

    // Verify root letters
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
      {/* Module Title / Navbar */}
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
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 1 VIEW */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'nikud' && (
        <div className={styles.sectionWrap}>
          <div className={styles.explainCard}>
            <h3>🎯 Что такое Никуд (Огласовки)?</h3>
            <p>
              В иврите пишутся только согласные буквы! Гласные звуки (а, е, и, о, у) обозначаются точками и чёрточками вокруг букв.
              Давай научимся быстро читать огласовки с буквой <strong>ב (Бет)</strong>!
            </p>
          </div>

          <div className={styles.gameArea}>
            <div className={styles.nikudLayout}>
              {/* Syllable Board */}
              <div className={styles.syllableColumn}>
                <h4>Выбери слог:</h4>
                <div className={styles.syllableGrid}>
                  {SYLLABLE_DATA.map((item) => {
                    const isSelected = selectedSyllableId === item.id;
                    const isMatched = nikudDone.has(item.id);
                    return (
                      <button
                        key={item.id}
                        className={`${styles.syllableTile} ${isSelected ? styles.syllableTileActive : ''} ${isMatched ? styles.tileDisabled : ''}`}
                        onClick={() => handleSelectSyllable(item.id, item.syllable.hebrew)}
                      >
                        <span className={styles.hebrewText}>{item.syllable.hebrew}</span>
                        {isMatched && <span className={styles.matchedCheck}>✅</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sound Targets */}
              <div className={styles.soundColumn}>
                <h4>Сопоставь с русским звуком:</h4>
                <div className={styles.soundGrid}>
                  {['ба', 'бе', 'би', 'бо', 'бу'].map((sound) => {
                    return (
                      <button
                        key={sound}
                        disabled={!selectedSyllableId}
                        className={`${styles.soundTile} ${!selectedSyllableId ? styles.soundTileInactive : ''}`}
                        onClick={() => handleMatchSound(sound)}
                      >
                        <span className={styles.soundLabel}>{sound.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Completion Badge */}
            <div className={styles.statusRow}>
              <span>Слогов разгадано: <strong>{nikudScore} / {SYLLABLE_DATA.length}</strong></span>
              {nikudDone.size === SYLLABLE_DATA.length && (
                <span className={styles.winBanner}>🎉 Отлично! Ты умеешь читать базовый Никуд!</span>
              )}
            </div>

            {/* Syllabus Info Board */}
            <div className={styles.helperBoard}>
              <h4>🔍 Справочник по текущим огласовкам:</h4>
              <div className={styles.referenceGrid}>
                {SYLLABLE_DATA.map((s) => (
                  <div key={s.id} className={styles.refItem}>
                    <button className={styles.miniTtsBtn} onClick={() => handleTTS(s.syllable.hebrew)}>🔊</button>
                    <strong>{s.syllable.hebrew}</strong> — [{s.syllable.transliteration}] — {s.syllable.translation}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 2 VIEW */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'gender' && (
        <div className={styles.sectionWrap}>
          <div className={styles.explainCard}>
            <h3>👫 Род в Иврите: Мужской vs Женский</h3>
            <p>
              В иврите существительные и прилагательные делятся на мужской и женский род.
              Обычно слова женского рода оканчиваются на <strong>"а" (огласовка камац + буква хей «ה»)</strong> или на <strong>"т" (буква тав «ת»)</strong>.
              Но берегись ловушек и исключений!
            </p>
          </div>

          <div className={styles.gameArea}>
            {!genderGameDone ? (
              <div className={styles.genderContainer}>
                {/* Active card */}
                {(() => {
                  const current = GENDER_WORDS[genderIndex];
                  return (
                    <div className={styles.genderCard}>
                      <div className={styles.cardHeader}>
                        <button className={styles.speakBtn} onClick={() => handleTTS(current.item.hebrew)}>🔊 Прослушать</button>
                        <span>Слово {genderIndex + 1} из {GENDER_WORDS.length}</span>
                      </div>
                      <div className={styles.genderHebValue}>{current.item.hebrew}</div>
                      <div className={styles.genderTranslit}>[{current.item.transliteration}]</div>
                      <div className={styles.genderTranslation}>Значение: {current.item.translation}</div>
                    </div>
                  );
                })()}

                {/* Feedback */}
                {genderFeedback && <div className={styles.genderFeedback}>{genderFeedback}</div>}

                {/* Interactive Buckets */}
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
                <p>Твой результат: <strong>{genderScore} из {GENDER_WORDS.length}</strong> угаданных слов!</p>
                <button
                  className={styles.startBtn}
                  onClick={() => {
                    setGenderIndex(0);
                    setGenderScore(0);
                    setGenderGameDone(false);
                    setGenderFeedback(null);
                  }}
                >
                  Играть заново ↩
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 3 VIEW */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === 'prefixes' && (
        <div className={styles.sectionWrap}>
          <div className={styles.explainCard}>
            <h3>🛡️ Волшебный артикль «ה» [ха] и приставки слияния</h3>
            <p>
              В русском языке нет артиклей, но в иврите артикль <strong>ה [ха]</strong> делает слово определённым.
              А если перед ним поставить предлоги <strong>בּ [в]</strong> или <strong>ל [к]</strong>, они поглощают артикль, превращаясь в <strong>ба-</strong> и <strong>ла-</strong>!
              Давай посмотрим, как преображается корень слова <strong>байт (дом)</strong>:
            </p>
          </div>

          <div className={styles.gameArea}>
            <div className={styles.prefixesSimulator}>
              {/* Root card display */}
              <div className={styles.simulatorPreview}>
                <div className={styles.simText}>
                  {PREFIX_COMBOS[prefixIdx].hebrewResult}
                </div>
                <div className={styles.simSub}>
                  транслитерация: <strong>{PREFIX_COMBOS[prefixIdx].translitResult}</strong>
                </div>
                <div className={styles.simMeaning}>
                  перевод: <strong>{PREFIX_COMBOS[prefixIdx].translationResult}</strong>
                </div>
                <button className={styles.simSpeakBtn} onClick={() => handleTTS(PREFIX_COMBOS[prefixIdx].hebrewResult)}>
                  🔊 Прослушать произношение
                </button>
              </div>

              {/* Selector toggles */}
              <div className={styles.prefixesMenu}>
                <h4>Выбери приставку для просмотра слияния:</h4>
                <div className={styles.simButtonsCol}>
                  {PREFIX_COMBOS.map((combo, idx) => (
                    <button
                      key={combo.label}
                      className={`${styles.simToggle} ${prefixIdx === idx ? styles.simToggleActive : ''}`}
                      onClick={() => {
                        playClick();
                        setPrefixIdx(idx);
                        handleTTS(combo.hebrewResult);
                      }}
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

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECTION 4 VIEW */}
      {/* ───────────────────────────────────────────────────────────────── */}
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

              {/* Letters picker */}
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

              {/* Results & Family Map */}
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
                    <button
                      className={styles.nextChallengeBtn}
                      onClick={() => {
                        playClick();
                        setRootIdx((i) => i + 1);
                        setSelectedLetters([]);
                        setRootSolved(false);
                      }}
                    >
                      Следующий корень →
                    </button>
                  ) : (
                    <div className={styles.completeRootsBox}>
                      <span className={styles.winBanner}>🌳 Потрясающе! Ты разгадал секрет корней в иврите!</span>
                      <button
                        className={styles.restartBtn}
                        onClick={() => {
                          playClick();
                          setRootIdx(0);
                          setSelectedLetters([]);
                          setRootSolved(false);
                        }}
                      >
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
    </div>
  );
};

export default GrammarModule;
