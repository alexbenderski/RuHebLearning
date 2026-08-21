export interface PhraseItem {
  id: string;
  hebrew: string;
  transliteration: string;
  translation: string;
  words: string[]; // Hebrew words that make up this phrase (for vocabulary lookup)
  /** Optional feminine form of the phrase */
  hebrewF?: string;
  transliterationF?: string;
  translationF?: string;
}

export interface PhraseCategory {
  id: string;
  name: string;
  icon: string;
  phrases: PhraseItem[];
}

export const PHRASE_CATEGORIES: PhraseCategory[] = [
  {
    id: 'greetings',
    name: 'Приветствия и вежливость',
    icon: '👋',
    phrases: [
      { id: 'p1', hebrew: 'שָׁלוֹם! מָה שְׁלוֹמְךָ?', transliteration: 'шалом! ма шломха?', translation: 'Привет! Как дела? (м.р.)', hebrewF: 'שָׁלוֹם! מָה שְׁלוֹמֵךְ?', transliterationF: 'шалом! ма шломех?', translationF: 'Привет! Как дела? (ж.р.)', words: ['שלום', 'מה', 'שלומך'] },
      { id: 'p2', hebrew: 'בֹּקֶר טוֹב!', transliteration: 'бокер тов!', translation: 'Доброе утро!', words: ['בוקר', 'טוב'] },
      { id: 'p3', hebrew: 'עֶרֶב טוֹב!', transliteration: 'эрев тов!', translation: 'Добрый вечер!', words: ['ערב', 'טוב'] },
      { id: 'p4', hebrew: 'לַיְלָה טוֹב!', transliteration: 'лайла тов!', translation: 'Спокойной ночи!', words: ['לילה', 'טוב'] },
      { id: 'p5', hebrew: 'לְהִתְרָאוֹת מָחָר!', transliteration: 'леитраот махар!', translation: 'До завтра!', words: ['להתראות', 'מחר'] },
      { id: 'p6', hebrew: 'תּוֹדָה רַבָּה!', transliteration: 'тода раба!', translation: 'Большое спасибо!', words: ['תודה', 'רבה'] },
      { id: 'p7', hebrew: 'סְלִיחָה, אֵיפֹה הַשֵּׁרוּתִים?', transliteration: 'слиха, эйфо ха-шерутим?', translation: 'Извините, где туалет?', words: ['סליחה', 'איפה', 'שירותים'] },
      { id: 'p8', hebrew: 'בְּבַקָּשָׁה, תַּעֲזוֹר לִי?', transliteration: 'бэвакаша, таазор ли?', translation: 'Пожалуйста, помоги мне? (м.р.)', hebrewF: 'בְּבַקָּשָׁה, תַּעַזְרִי לִי?', transliterationF: 'бэвакаша, таазри ли?', translationF: 'Пожалуйста, помоги мне? (ж.р.)', words: ['בבקשה', 'תעזור', 'לי'] },
      { id: 'p9', hebrew: 'נָעִים מְאוֹד לְהַכִּיר אוֹתְךָ', transliteration: 'наим меод леhакир отха', translation: 'Очень приятно познакомиться (с тобой, м.р.)', hebrewF: 'נָעִים מְאוֹד לְהַכִּיר אוֹתָךְ', transliterationF: 'наим меод леhакир отхах', translationF: 'Очень приятно познакомиться (с тобой, ж.р.)', words: ['נעים מאוד', 'להכיר', 'אותך'] },
      { id: 'p10', hebrew: 'שֶׁיִּהְיֶה לְךָ יוֹם טוֹב!', transliteration: 'ше-ийе леха йом тов!', translation: 'Хорошего тебе дня! (м.р.)', hebrewF: 'שֶׁיִּהְיֶה לָךְ יוֹם טוֹב!', transliterationF: 'ше-ийе лах йом тов!', translationF: 'Хорошего тебе дня! (ж.р.)', words: ['שיהיה', 'לך', 'יום', 'טוב'] },
    ],
  },
  {
    id: 'cafe',
    name: 'В кафе и ресторане',
    icon: '☕',
    phrases: [
      { id: 'p11', hebrew: 'אֲנִי רוֹצֶה קָפֶה, בְּבַקָּשָׁה', transliteration: 'ани роце кафе, бэвакаша', translation: 'Я хочу кофе, пожалуйста (м.р.)', hebrewF: 'אֲנִי רוֹצָה קָפֶה, בְּבַקָּשָׁה', transliterationF: 'ани роца кафе, бэвакаша', translationF: 'Я хочу кофе, пожалуйста (ж.р.)', words: ['אני', 'רוצה', 'קפה', 'בבקשה'] },
      { id: 'p12', hebrew: 'תַּפְרִיט, בְּבַקָּשָׁה', transliteration: 'тафрит, бэвакаша', translation: 'Меню, пожалуйста', words: ['תפריט', 'בבקשה'] },
      { id: 'p13', hebrew: 'הַחֶשְׁבּוֹן, בְּבַקָּשָׁה', transliteration: 'ха-хешбон, бэвакаша', translation: 'Счёт, пожалуйста', words: ['חשבון', 'בבקשה'] },
      { id: 'p14', hebrew: 'זֶה טָעִים מְאוֹד!', transliteration: 'зэ таим меод!', translation: 'Это очень вкусно!', words: ['זה', 'טעים', 'מאוד'] },
      { id: 'p15', hebrew: 'אֲנִי צִמְחוֹנִי', transliteration: 'ани цимхони', translation: 'Я вегетарианец (м.р.)', hebrewF: 'אֲנִי צִמְחוֹנִית', transliterationF: 'ани цимхонит', translationF: 'Я вегетарианка (ж.р.)', words: ['אני', 'צמחוני'] },
      { id: 'p16', hebrew: 'מַיִם קָרִים, בְּבַקָּשָׁה', transliteration: 'маим карим, бэвакаша', translation: 'Холодную воду, пожалуйста', words: ['מים', 'קרים', 'בבקשה'] },
      { id: 'p17', hebrew: 'מָה אַתָּה מַמְלִיץ?', transliteration: 'ма ата мамлиц?', translation: 'Что ты рекомендуешь? (м.р.)', hebrewF: 'מָה אַתְּ מַמְלִיצָה?', transliterationF: 'ма ат мамлица?', translationF: 'Что ты рекомендуешь? (ж.р.)', words: ['מה', 'אתה', 'ממליץ'] },
      { id: 'p18', hebrew: 'אֲנִי רוֹצֶה לְהַזְמִין עוֹף', transliteration: 'ани роце леhазмин оф', translation: 'Я хочу заказать курицу (м.р.)', hebrewF: 'אֲנִי רוֹצָה לְהַזְמִין עוֹף', transliterationF: 'ани роца леhазмин оф', translationF: 'Я хочу заказать курицу (ж.р.)', words: ['אני', 'רוצה', 'להזמין', 'עוף'] },
      { id: 'p19', hebrew: 'תָּבִיא לִי סָלָט, בְּבַקָּשָׁה', transliteration: 'тави ли салат, бэвакаша', translation: 'Принеси мне салат, пожалуйста (м.р.)', hebrewF: 'תָּבִיאִי לִי סָלָט, בְּבַקָּשָׁה', transliterationF: 'тавии ли салат, бэвакаша', translationF: 'Принеси мне салат, пожалуйста (ж.р.)', words: ['תביא', 'לי', 'סלט', 'בבקשה'] },
      { id: 'p20', hebrew: 'זֶה חַם מִדַּי', transliteration: 'зэ хам мидай', translation: 'Это слишком горячо', words: ['זה', 'חם', 'מדי'] },
    ],
  },
  {
    id: 'shop',
    name: 'В магазине',
    icon: '🛍️',
    phrases: [
      { id: 'p21', hebrew: 'כַּמָּה זֶה עוֹלֶה?', transliteration: 'кама зэ оле?', translation: 'Сколько это стоит?', words: ['כמה', 'זה', 'עולה'] },
      { id: 'p22', hebrew: 'זֶה יָקָר מִדַּי', transliteration: 'зэ якар мидай', translation: 'Это слишком дорого', words: ['זה', 'יקר', 'מדי'] },
      { id: 'p23', hebrew: 'יֵשׁ לְךָ מִדָּה גְּדוֹלָה יוֹתֵר?', transliteration: 'еш леха мида гдола йотер?', translation: 'У вас есть размер побольше? (м.р.)', hebrewF: 'יֵשׁ לָךְ מִדָּה גְּדוֹלָה יוֹתֵר?', transliterationF: 'еш лах мида гдола йотер?', translationF: 'У вас есть размер побольше? (ж.р.)', words: ['יש', 'לך', 'מידה', 'גדול', 'יותר'] },
      { id: 'p24', hebrew: 'אֲנִי רוֹצֶה לִקְנוֹת חוּלְצָה', transliteration: 'ани роце ликнот хульца', translation: 'Я хочу купить рубашку (м.р.)', hebrewF: 'אֲנִי רוֹצָה לִקְנוֹת חוּלְצָה', transliterationF: 'ани роца ликнот хульца', translationF: 'Я хочу купить рубашку (ж.р.)', words: ['אני', 'רוצה', 'לקנות', 'חולצה'] },
      { id: 'p25', hebrew: 'אֵיפֹה הַקּוּפָּה?', transliteration: 'эйфо ха-купа?', translation: 'Где касса?', words: ['איפה', 'קופה'] },
      { id: 'p26', hebrew: 'אֶפְשָׁר לְשַׁלֵּם בְּכַּרְטִיס?', transliteration: 'эфшар лешалем бэ-картис?', translation: 'Можно заплатить картой?', words: ['אפשר', 'לשלם', 'כרטיס'] },
      { id: 'p27', hebrew: 'אֲנִי מְחַפֵּשׂ נַעֲלַיִם', transliteration: 'ани мехапес наалаим', translation: 'Я ищу обувь (м.р.)', hebrewF: 'אֲנִי מְחַפֶּשֶׂת נַעֲלַיִם', transliterationF: 'ани мехапесет наалаим', translationF: 'Я ищу обувь (ж.р.)', words: ['אני', 'מחפש', 'נעליים'] },
      { id: 'p28', hebrew: 'יֵשׁ מִבְצָע?', transliteration: 'еш мивца?', translation: 'Есть скидка / распродажа?', words: ['יש', 'מבצע'] },
      { id: 'p29', hebrew: 'אֲנִי רוֹצֶה לְהַחֲזִיר אֶת זֶה', transliteration: 'ани роце леhахазир эт зэ', translation: 'Я хочу вернуть это (м.р.)', hebrewF: 'אֲנִי רוֹצָה לְהַחֲזִיר אֶת זֶה', transliterationF: 'ани роца леhахазир эт зэ', translationF: 'Я хочу вернуть это (ж.р.)', words: ['אני', 'רוצה', 'להחזיר', 'את', 'זה'] },
      { id: 'p30', hebrew: 'תּוֹדָה, זֶה הַכֹּל', transliteration: 'тода, зэ hа-коль', translation: 'Спасибо, это всё', words: ['תודה', 'זה', 'הכל'] },
    ],
  },
  {
    id: 'questions',
    name: 'Вопросы и ответы',
    icon: '❓',
    phrases: [
      { id: 'p31', hebrew: 'אֵיפֹה אַתָּה גָּר?', transliteration: 'эйфо ата гар?', translation: 'Где ты живёшь? (м.р.)', hebrewF: 'אֵיפֹה אַתְּ גָּרָה?', transliterationF: 'эйфо ат гара?', translationF: 'Где ты живёшь? (ж.р.)', words: ['איפה', 'אתה', 'גר'] },
      { id: 'p32', hebrew: 'אֲנִי גָּר בְּתֵל אָבִיב', transliteration: 'ани гар бэ-тэль авив', translation: 'Я живу в Тель-Авиве (м.р.)', hebrewF: 'אֲנִי גָּרָה בְּתֵל אָבִיב', transliterationF: 'ани гара бэ-тэль авив', translationF: 'Я живу в Тель-Авиве (ж.р.)', words: ['אני', 'גר', 'תל אביב'] },
      { id: 'p33', hebrew: 'מָה הַשָּׁעָה?', transliteration: 'ма hа-шаа?', translation: 'Который час?', words: ['מה', 'שעה'] },
      { id: 'p34', hebrew: 'הַשָּׁעָה שָׁלוֹשׁ', transliteration: 'hа-шаа шалош', translation: 'Три часа', words: ['שעה', 'שלוש'] },
      { id: 'p35', hebrew: 'מֵאֵיפֹה אַתָּה?', transliteration: 'мэйфо ата?', translation: 'Откуда ты? (м.р.)', hebrewF: 'מֵאֵיפֹה אַתְּ?', transliterationF: 'мэйфо ат?', translationF: 'Откуда ты? (ж.р.)', words: ['מאיפה', 'אתה'] },
      { id: 'p36', hebrew: 'אֲנִי מֵרוּסְיָה', transliteration: 'ани мэ-русия', translation: 'Я из России', words: ['אני', 'רוסיה'] },
      { id: 'p37', hebrew: 'יֵשׁ לְךָ אַחִים?', transliteration: 'еш леха ахим?', translation: 'У тебя есть братья/сёстры? (м.р.)', hebrewF: 'יֵשׁ לָךְ אַחִים?', transliterationF: 'еш лах ахим?', translationF: 'У тебя есть братья/сёстры? (ж.р.)', words: ['יש', 'לך', 'אחים'] },
      { id: 'p38', hebrew: 'כַּמָּה שָׁנִים אַתָּה לוֹמֵד עִבְרִית?', transliteration: 'кама шаним ата ломед иврит?', translation: 'Сколько лет ты учишь иврит? (м.р.)', hebrewF: 'כַּמָּה שָׁנִים אַתְּ לוֹמֶדֶת עִבְרִית?', transliterationF: 'кама шаним ат ломедет иврит?', translationF: 'Сколько лет ты учишь иврит? (ж.р.)', words: ['כמה', 'שנים', 'אתה', 'לומד', 'עברית'] },
      { id: 'p39', hebrew: 'אֲנִי לוֹמֵד עִבְרִית שָׁנָה', transliteration: 'ани ломед иврит шана', translation: 'Я учу иврит (один) год (м.р.)', hebrewF: 'אֲנִי לוֹמֶדֶת עִבְרִית שָׁנָה', transliterationF: 'ани ломедет иврит шана', translationF: 'Я учу иврит (один) год (ж.р.)', words: ['אני', 'לומד', 'עברית', 'שנה'] },
      { id: 'p40', hebrew: 'אַתָּה מְדַבֵּר אַנְגְּלִית?', transliteration: 'ата медабер англит?', translation: 'Ты говоришь по-английски? (м.р.)', hebrewF: 'אַתְּ מְדַבֶּרֶת אַנְגְּלִית?', transliterationF: 'ат медаберет англит?', translationF: 'Ты говоришь по-английски? (ж.р.)', words: ['אתה', 'מדבר', 'אנגלית'] },
    ],
  },
  {
    id: 'travel',
    name: 'Путешествия и транспорт',
    icon: '🚌',
    phrases: [
      { id: 'p41', hebrew: 'אֵיפֹה הַתַּחֲנָה?', transliteration: 'эйфо hа-тахана?', translation: 'Где станция / остановка?', words: ['איפה', 'תחנה'] },
      { id: 'p42', hebrew: 'מָתַי יוֹצֵא הָאוֹטוֹבוּס?', transliteration: 'матай йоцэ hа-отобус?', translation: 'Когда отправляется автобус?', words: ['מתי', 'יוצא', 'אוטובוס'] },
      { id: 'p43', hebrew: 'אֲנִי צָרִיךְ כַּרְטִיס לָרַכֶּבֶת', transliteration: 'ани царих картис ла-ракевет', translation: 'Мне нужен билет на поезд (м.р.)', hebrewF: 'אֲנִי צְרִיכָה כַּרְטִיס לָרַכֶּבֶת', transliterationF: 'ани цриха картис ла-ракевет', translationF: 'Мне нужен билет на поезд (ж.р.)', words: ['אני', 'צריך', 'כרטיס', 'רכבת'] },
      { id: 'p44', hebrew: 'כַּמָּה זְמַן הַנְּסִיעָה?', transliteration: 'кама зман hа-нсиа?', translation: 'Сколько времени поездка?', words: ['כמה', 'זמן', 'נסיעה'] },
      { id: 'p45', hebrew: 'יֵשׁ מָקוֹם פָּנוּי?', transliteration: 'еш маком пануй?', translation: 'Есть свободное место?', words: ['יש', 'מקום', 'פנוי'] },
      { id: 'p46', hebrew: 'אֲנִי רוֹצֶה לִנְסוֹעַ לִירוּשָׁלַיִם', transliteration: 'ани роце линсоа ли-рушалаим', translation: 'Я хочу поехать в Иерусалим (м.р.)', hebrewF: 'אֲנִי רוֹצָה לִנְסוֹעַ לִירוּשָׁלַיִם', transliterationF: 'ани роца линсоа ли-рушалаим', translationF: 'Я хочу поехать в Иерусалим (ж.р.)', words: ['אני', 'רוצה', 'לנסוע', 'ירושלים'] },
      { id: 'p47', hebrew: 'אֵיפֹה הַמָּלוֹן?', transliteration: 'эйфо hа-малон?', translation: 'Где отель?', words: ['איפה', 'מלון'] },
      { id: 'p48', hebrew: 'תַּעֲזוֹר לִי לִמְצוֹא אֶת הָרְחוֹב', transliteration: 'таазор ли лимцо эт hа-рехов', translation: 'Помоги мне найти улицу (м.р.)', hebrewF: 'תַּעַזְרִי לִי לִמְצוֹא אֶת הָרְחוֹב', transliterationF: 'таазри ли лимцо эт hа-рехов', translationF: 'Помоги мне найти улицу (ж.р.)', words: ['תעזור', 'לי', 'למצוא', 'את', 'רחוב'] },
      { id: 'p49', hebrew: 'יָמִינָה, בְּבַקָּשָׁה', transliteration: 'ямина, бэвакаша', translation: 'Направо, пожалуйста', words: ['ימינה', 'בבקשה'] },
      { id: 'p50', hebrew: 'עֲצוֹר פֹּה, בְּבַקָּשָׁה', transliteration: 'ацор по, бэвакаша', translation: 'Останови здесь, пожалуйста', words: ['עצור', 'פה', 'בבקשה'] },
    ],
  },
];