import React, { useState } from 'react';
import { HEBREW_LETTERS, FINAL_LETTERS } from '../../data/alphabet';
import styles from './GrammarModule.module.css';

// ── Nikud data ────────────────────────────────────────────────────────────────
const NIKUD_MARKS = [
  { name: 'Камац',         nameHe: 'קָמַץ',    symbol: 'בָ',  sound: 'А (долгий)',  example: 'אָב',   exampleRu: 'отец' },
  { name: 'Патах',         nameHe: 'פַּתָּח',   symbol: 'בַ',  sound: 'А (краткий)', example: 'יַד',   exampleRu: 'рука' },
  { name: 'Цере',          nameHe: 'צֵרֵי',    symbol: 'בֵ',  sound: 'Э (долгий)',  example: 'בֵּן',   exampleRu: 'сын' },
  { name: 'Сеголь',        nameHe: 'סֶגּוֹל',   symbol: 'בֶ',  sound: 'Э (краткий)', example: 'אֶרֶץ',  exampleRu: 'страна' },
  { name: 'Хирик',         nameHe: 'חִירִיק',   symbol: 'בִ',  sound: 'И',           example: 'מִי',    exampleRu: 'кто' },
  { name: 'Холам',         nameHe: 'חוֹלָם',    symbol: 'בֹ/וֹ', sound: 'О',         example: 'שָׁלוֹם', exampleRu: 'мир' },
  { name: 'Шурек',         nameHe: 'שׁוּרֶק',   symbol: 'וּ',  sound: 'У (долгий)',  example: 'שׁוּק',   exampleRu: 'рынок' },
  { name: 'Кибуц',         nameHe: 'קִיבּוּץ',  symbol: 'בֻ',  sound: 'У (краткий)', example: 'כֻּלָּם',  exampleRu: 'все' },
  { name: 'Шва',           nameHe: 'שְׁוָא',    symbol: 'בְ',  sound: 'молчит / Э краткий', example: 'בְּרָכָה', exampleRu: 'благословение' },
  { name: 'Хатаф-Патах',   nameHe: 'חָטַף פַּתָּח', symbol: 'בֲ', sound: 'А краткий', example: 'אֲבָל', exampleRu: 'но' },
  { name: 'Хатаф-Сеголь',  nameHe: 'חָטַף סֶגּוֹל', symbol: 'בֱ', sound: 'Э краткий', example: 'אֱמֶת', exampleRu: 'истина' },
  { name: 'Хатаф-Камац',   nameHe: 'חָטַף קָמַץ', symbol: 'בֳ', sound: 'О краткий', example: 'אֳנִי', exampleRu: 'корабль' },
  { name: 'Dagesh (дагеш)', nameHe: 'דָּגֵשׁ',   symbol: 'בּ',  sound: 'Удваивает/укрепляет букву', example: 'שַׁבָּת', exampleRu: 'суббота' },
  { name: 'Shin Dot / Sin Dot', nameHe: 'שִׁין / שִׂין', symbol: 'שׁ / שׂ', sound: 'Ш (правый) / С (левый)', example: 'שָׁלוֹם / שִׂמְחָה', exampleRu: 'мир / радость' },
];

// ── Gender examples ───────────────────────────────────────────────────────────
const GENDER_MASC = [
  { he: 'בַּיִת', tr: 'байт',    ru: 'дом' },
  { he: 'סֵפֶר', tr: 'сефер',   ru: 'книга' },
  { he: 'כֶּלֶב', tr: 'келев',   ru: 'собака' },
  { he: 'שֻׁלְחָן', tr: 'шулхан', ru: 'стол' },
];
const GENDER_FEM = [
  { he: 'מִשְׁפָּחָה', tr: 'мишпаха', ru: 'семья (-ה)' },
  { he: 'דֶּלֶת',     tr: 'делет',   ru: 'дверь (-ת)' },
  { he: 'עִיר',       tr: 'ир',      ru: 'город (исключение)' },
  { he: 'שָׁנָה',     tr: 'шана',    ru: 'год (-ה)' },
];

// ── Plural examples ───────────────────────────────────────────────────────────
const PLURAL_MASC = [
  { sg: 'כֶּלֶב', pl: 'כְּלָבִים', sgRu: 'собака', plRu: 'собаки' },
  { sg: 'סֵפֶר', pl: 'סְפָרִים', sgRu: 'книга',   plRu: 'книги'  },
  { sg: 'יוֹם',  pl: 'יָמִים',   sgRu: 'день',    plRu: 'дни'    },
];
const PLURAL_FEM = [
  { sg: 'שָׁנָה',     pl: 'שָׁנִים',    sgRu: 'год',    plRu: 'годы'    },
  { sg: 'מִשְׁפָּחָה', pl: 'מִשְׁפָּחוֹת', sgRu: 'семья', plRu: 'семьи'  },
  { sg: 'מִלָּה',     pl: 'מִלִּים',    sgRu: 'слово',  plRu: 'слова'   },
];

// ── ה Article examples ─────────────────────────────────────────────────────────
const ARTICLE_EX = [
  { indef: 'בַּיִת', def: 'הַבַּיִת', ru: 'дом / дом (тот)' },
  { indef: 'סֵפֶר', def: 'הַסֵּפֶר', ru: 'книга / книга (та)' },
  { indef: 'יֶלֶד', def: 'הַיֶּלֶד', ru: 'ребёнок / ребёнок (тот)' },
  { indef: 'עִיר',  def: 'הָעִיר',  ru: 'город / город (тот)' },
];

// ── Root examples ─────────────────────────────────────────────────────────────
const ROOT_EX = [
  { root: 'כ-ת-ב', words: ['כָּתַב — писал', 'כּוֹתֵב — пишет', 'לִכְתֹּב — писать', 'כְּתָבִים — тексты'] },
  { root: 'ל-מ-ד', words: ['לָמַד — учил', 'לוֹמֵד — учится', 'לִלְמֹד — учиться', 'תַּלְמִיד — ученик'] },
  { root: 'ד-ב-ר', words: ['דִּבֵּר — говорил', 'מְדַבֵּר — говорит', 'לְדַבֵּר — говорить', 'דָּבָר — слово/вещь'] },
];

// ── Section accordion ─────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.section} ${open ? styles.sectionOpen : ''}`}>
      <button className={styles.sectionHeader} onClick={() => setOpen((o) => !o)}>
        <span className={styles.sectionIcon}>{icon}</span>
        <span className={styles.sectionTitle}>{title}</span>
        <span className={styles.sectionChevron}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const GrammarModule: React.FC = () => (
  <div className={styles.page}>
    <div className={styles.hero}>
      <h1 className={styles.heroTitle}>📝 Грамматика иврита</h1>
      <p className={styles.heroSub}>
        Нажми на раздел, чтобы раскрыть объяснение. Каждый раздел — отдельная тема.
      </p>
    </div>

    <div className={styles.sections}>

      {/* ── 1. NIKUD ──────────────────────────────────────────────────────── */}
      <Section icon="🔤" title="ניקוד — Никуд (знаки гласных)">
        <div className={styles.textBlock}>
          <p>
            В иврите буквы — это <strong>согласные</strong>. Гласные обычно <em>не пишутся</em>
            в современных текстах — читатель угадывает их по контексту.
          </p>
          <p>
            Но в учебниках, детских книгах и молитвенниках используют <strong>никуд</strong> —
            маленькие точки и чёрточки <em>под, над или внутри</em> буквы, обозначающие гласный звук.
          </p>
          <p className={styles.nikudToggleHint}>
            💡 Используй кнопку <strong>«ניקוד»</strong> в шапке сайта, чтобы включить никуд для всех слов на сайте!
          </p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Знак</th>
                <th>Название (рус.)</th>
                <th>Пример</th>
                <th>Звук</th>
              </tr>
            </thead>
            <tbody>
              {NIKUD_MARKS.map((m) => (
                <tr key={m.name}>
                  <td className={styles.hebrewBig} dir="rtl">{m.symbol}</td>
                  <td>
                    <span className={styles.nameRu}>{m.name}</span>
                    <span className={styles.nameHe} dir="rtl">{m.nameHe}</span>
                  </td>
                  <td className={styles.exampleCell} dir="rtl">
                    <span className={styles.hebrewBig}>{m.example}</span>
                    <span className={styles.exampleRu}>({m.exampleRu})</span>
                  </td>
                  <td className={styles.soundCell}>{m.sound}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tipBox}>
          <strong>Совет:</strong> Начни с камац (А), хирик (И), шурек (У) и холам (О) — этих четырёх знаков
          хватит для чтения большинства слов!
        </div>
      </Section>

      {/* ── 2. ALPHABET ───────────────────────────────────────────────────── */}
      <Section icon="🔡" title="האלפבית — Алфавит">
        <div className={styles.textBlock}>
          <p>
            В иврите <strong>22 буквы</strong>, все — согласные. Текст пишется <strong>справа налево</strong>.
            5 букв имеют особую «конечную» форму (софит) — когда стоят в конце слова.
          </p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Буква</th><th>Название</th><th>Звук</th><th>Конечная</th></tr>
            </thead>
            <tbody>
              {HEBREW_LETTERS.map((l) => {
                const fin = FINAL_LETTERS.find((f) => f.finalOf === l.letter);
                return (
                  <tr key={l.letter}>
                    <td className={styles.hebrewBig} dir="rtl">{l.letter}</td>
                    <td>{l.name}</td>
                    <td className={styles.soundCell}>{l.transliteration}</td>
                    <td className={styles.hebrewBig} dir="rtl">{fin ? fin.letter : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.tipBox}>
          <strong>Помни:</strong> Буквы ב, כ, פ имеют два звука — твёрдый (с дагешем: בּ = Б, כּ = К, פּ = П)
          и мягкий (без дагеша: ב = В, כ = Х, פ = Ф).
        </div>
      </Section>

      {/* ── 3. GENDER ─────────────────────────────────────────────────────── */}
      <Section icon="⚤" title="מין — Род (мужской и женский)">
        <div className={styles.textBlock}>
          <p>
            В иврите два рода: <strong>мужской (זכר, захар)</strong> и <strong>женский (נקבה, некева)</strong>.
            Прилагательные и глаголы согласуются с родом существительного.
          </p>
        </div>

        <div className={styles.twoCol}>
          <div className={styles.colBlock}>
            <div className={styles.colTitle}>♂ Мужской род</div>
            <ul className={styles.ruleList}>
              <li>Обычно не имеет особого окончания</li>
              <li>Множественное число: <span className={styles.hebInline} dir="rtl">ים-</span></li>
            </ul>
            <div className={styles.exList}>
              {GENDER_MASC.map((w) => (
                <div key={w.he} className={styles.exItem}>
                  <span className={styles.hebrewMed} dir="rtl">{w.he}</span>
                  <span className={styles.exTr}>{w.tr}</span>
                  <span className={styles.exRu}>{w.ru}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.colBlock}>
            <div className={styles.colTitle}>♀ Женский род</div>
            <ul className={styles.ruleList}>
              <li>Часто оканчивается на <span className={styles.hebInline} dir="rtl">ה-</span> или <span className={styles.hebInline} dir="rtl">ת-</span></li>
              <li>Множественное число: <span className={styles.hebInline} dir="rtl">ות-</span></li>
            </ul>
            <div className={styles.exList}>
              {GENDER_FEM.map((w) => (
                <div key={w.he} className={styles.exItem}>
                  <span className={styles.hebrewMed} dir="rtl">{w.he}</span>
                  <span className={styles.exTr}>{w.tr}</span>
                  <span className={styles.exRu}>{w.ru}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.tipBox}>
          <strong>Важно:</strong> Прилагательное всегда стоит <em>после</em> существительного и согласуется с ним в роде.
          Пример: <span className={styles.hebInline} dir="rtl">כֶּלֶב גָּדוֹל</span> (большая собака, м.р.)
          vs <span className={styles.hebInline} dir="rtl">מִשְׁפָּחָה גְּדוֹלָה</span> (большая семья, ж.р.)
        </div>
      </Section>

      {/* ── 4. DEFINITE ARTICLE ───────────────────────────────────────────── */}
      <Section icon="ה" title="ה הידיעה — Определённый артикль «ה»">
        <div className={styles.textBlock}>
          <p>
            В иврите нет неопределённого артикля (русское «один» или английское «a»).
            Определённый артикль — это приставка <strong className={styles.hebInline} dir="rtl">הַ-</strong>{' '}
            («ха-»), которая присоединяется непосредственно к слову.
          </p>
          <p>
            Перед гортанными буквами (א, ה, ח, ע, ר) гласная меняется на{' '}
            <strong className={styles.hebInline} dir="rtl">הָ-</strong> («ха-» с камацем).
          </p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Без артикля</th><th>С артиклем ה</th><th>Значение</th></tr>
            </thead>
            <tbody>
              {ARTICLE_EX.map((ex) => (
                <tr key={ex.indef}>
                  <td className={styles.hebrewMed} dir="rtl">{ex.indef}</td>
                  <td className={styles.hebrewMed} dir="rtl">{ex.def}</td>
                  <td className={styles.soundCell}>{ex.ru}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tipBox}>
          <strong>Подсказка:</strong> Предлоги «в», «на» (בְּ-), «и» (וְ-) тоже пишутся слитно со словом.
          Например: <span className={styles.hebInline} dir="rtl">בַּבַּיִת</span> = в доме (ב + הַ + בַּיִת).
        </div>
      </Section>

      {/* ── 5. PLURAL ─────────────────────────────────────────────────────── */}
      <Section icon="🔢" title="יחיד ורבים — Единственное и множественное число">
        <div className={styles.textBlock}>
          <p>
            Мужской род получает суффикс <strong className={styles.hebInline} dir="rtl">ים-</strong> (-им),
            женский — <strong className={styles.hebInline} dir="rtl">ות-</strong> (-от).
            При этом гласные внутри слова часто меняются.
          </p>
        </div>

        <div className={styles.twoCol}>
          <div className={styles.colBlock}>
            <div className={styles.colTitle}>♂ Мужской (ים-)</div>
            {PLURAL_MASC.map((r) => (
              <div key={r.sg} className={styles.pluralRow}>
                <span className={styles.hebrewMed} dir="rtl">{r.sg}</span>
                <span className={styles.arrow}>→</span>
                <span className={styles.hebrewMed} dir="rtl">{r.pl}</span>
                <span className={styles.exRu}>{r.sgRu} → {r.plRu}</span>
              </div>
            ))}
          </div>

          <div className={styles.colBlock}>
            <div className={styles.colTitle}>♀ Женский (ות-)</div>
            {PLURAL_FEM.map((r) => (
              <div key={r.sg} className={styles.pluralRow}>
                <span className={styles.hebrewMed} dir="rtl">{r.sg}</span>
                <span className={styles.arrow}>→</span>
                <span className={styles.hebrewMed} dir="rtl">{r.pl}</span>
                <span className={styles.exRu}>{r.sgRu} → {r.plRu}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.tipBox}>
          <strong>Исключения:</strong> Некоторые мужские слова образуют множественное число с суффиксом -ות
          (например, <span className={styles.hebInline} dir="rtl">אָבוֹת</span> — отцы),
          а женские — с суффиксом -ים. Их нужно запоминать.
        </div>
      </Section>

      {/* ── 6. ROOT SYSTEM ────────────────────────────────────────────────── */}
      <Section icon="🌳" title="שורש — Трёхбуквенный корень">
        <div className={styles.textBlock}>
          <p>
            Большинство слов иврита строятся по принципу <strong>трёхбуквенного корня (шореш)</strong>.
            Из одного корня образуются десятки слов путём изменения гласных и добавления суффиксов/префиксов.
          </p>
          <p>
            Зная корень, можно угадать значение незнакомого слова!
          </p>
        </div>

        {ROOT_EX.map((r) => (
          <div key={r.root} className={styles.rootBlock}>
            <div className={styles.rootTitle}>
              Корень: <span className={styles.rootLetters} dir="rtl">{r.root}</span>
            </div>
            <div className={styles.rootWords}>
              {r.words.map((w) => (
                <div key={w} className={styles.rootWord} dir="rtl">{w}</div>
              ))}
            </div>
          </div>
        ))}

        <div className={styles.tipBox}>
          <strong>Метод:</strong> Когда встречаешь новое слово, попробуй найти в нём три согласные — это и есть корень.
          Например, в слове <span className={styles.hebInline} dir="rtl">תַּלְמִיד</span> (ученик) корень ל-מ-ד (учить).
        </div>
      </Section>

      {/* ── 7. BASIC VERBS ────────────────────────────────────────────────── */}
      <Section icon="🏃" title="פועל — Глаголы: базовая форма">
        <div className={styles.textBlock}>
          <p>
            Инфинитив (неопределённая форма) начинается с <strong className={styles.hebInline} dir="rtl">לְ-</strong> (ле-).
            Базовое настоящее время изменяется по роду и числу говорящего.
          </p>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr><th>Инфинитив</th><th>Транслит.</th><th>Значение</th><th>Он (м.р.)</th><th>Она (ж.р.)</th></tr>
            </thead>
            <tbody>
              {[
                { inf: 'לָלֶכֶת', tr: 'лалехет', ru: 'идти',     m: 'הוֹלֵךְ (holeх)', f: 'הוֹלֶכֶת (holexet)' },
                { inf: 'לֶאֱכֹל', tr: 'леэхоль', ru: 'есть/кушать', m: 'אוֹכֵל (охель)', f: 'אוֹכֶלֶת (охелет)' },
                { inf: 'לִשְׁתּוֹת', tr: 'лиштот', ru: 'пить',    m: 'שׁוֹתֶה (шоте)', f: 'שׁוֹתָה (шота)' },
                { inf: 'לְדַבֵּר', tr: 'ледабер', ru: 'говорить', m: 'מְדַבֵּר (медабер)', f: 'מְדַבֶּרֶת (медаберет)' },
                { inf: 'לִלְמֹד', tr: 'лильмод', ru: 'учиться',  m: 'לוֹמֵד (ломед)', f: 'לוֹמֶדֶת (ломедет)' },
              ].map((v) => (
                <tr key={v.inf}>
                  <td className={styles.hebrewMed} dir="rtl">{v.inf}</td>
                  <td className={styles.soundCell}>{v.tr}</td>
                  <td className={styles.soundCell}>{v.ru}</td>
                  <td className={styles.hebrewSmall} dir="rtl">{v.m}</td>
                  <td className={styles.hebrewSmall} dir="rtl">{v.f}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tipBox}>
          <strong>Структура:</strong> Прошедшее: <span className={styles.hebInline} dir="rtl">כָּתַב</span> (он написал),
          настоящее: <span className={styles.hebInline} dir="rtl">כּוֹתֵב</span> (он пишет),
          будущее: <span className={styles.hebInline} dir="rtl">יִכְתֹּב</span> (он напишет).
        </div>
      </Section>

    </div>
  </div>
);

export default GrammarModule;
