/* Lesson content. Each item line is "English | native script | pronunciation or romanization". */
(function () {
  const P = t => t.trim().split('\n').map(l => l.split('|').map(s => s.trim()));
  const SECTIONS = [
    { id: 'greetings', icon: '👋', title: 'Greetings', intro: 'Say hello, goodbye and introduce yourself.' },
    { id: 'numbers', icon: '🔢', title: 'Numbers', intro: 'Count from 1 to 10, plus 20 and 100.' },
    { id: 'phrases', icon: '💬', title: 'Essential phrases', intro: 'Politeness and survival phrases you will use every day.' },
    { id: 'colors', icon: '🎨', title: 'Colors', intro: 'Describe the world around you.' },
    { id: 'family', icon: '👨‍👩‍👧', title: 'Family & friends', intro: 'Talk about the people you love.' },
    { id: 'food', icon: '🍽️', title: 'Food & drink', intro: 'Order a meal and talk about what you eat.' },
    { id: 'travel', icon: '🧭', title: 'Getting around', intro: 'Ask for directions and find your way.' },
    { id: 'days', icon: '📅', title: 'Days & time', intro: 'The days of the week and talking about when.' },
  ];
  const D = {};

  D.es = {
    name: 'Spanish', native: 'Español', flag: '🇪🇸', speech: 'es-ES', rtl: false, level: 'Easy for English speakers',
    speakers: 'About 480 million native speakers; official in 20 countries',
    blurb: 'Spanish is phonetic: words are pronounced the way they are written. Vowels are always short and clear (a, e, i, o, u), and the letter h is silent. Nouns are masculine or feminine, and questions and exclamations start with an upside-down mark: ¿ and ¡.',
    data: {
      greetings: P(`
Hello | Hola | OH-lah
Good morning | Buenos días | BWEH-nohs DEE-ahs
Good afternoon | Buenas tardes | BWEH-nahs TAR-dehs
Good evening / night | Buenas noches | BWEH-nahs NOH-chehs
Goodbye | Adiós | ah-dee-OHS
See you later | Hasta luego | AH-stah LWEH-goh
How are you? | ¿Cómo estás? | KOH-moh ehs-TAHS
I'm fine, thank you | Estoy bien, gracias | ehs-TOY byehn GRAH-syahs
Nice to meet you | Mucho gusto | MOO-choh GOOS-toh
What is your name? | ¿Cómo te llamas? | KOH-moh teh YAH-mahs
My name is… | Me llamo… | meh YAH-moh`),
      numbers: P(`
one | uno | OO-noh
two | dos | dohs
three | tres | trehs
four | cuatro | KWAH-troh
five | cinco | SEEN-koh
six | seis | sayss
seven | siete | SYEH-teh
eight | ocho | OH-choh
nine | nueve | NWEH-veh
ten | diez | dyehs
twenty | veinte | BAYN-teh
one hundred | cien | syehn`),
      phrases: P(`
Please | Por favor | por fah-BOR
Thank you | Gracias | GRAH-syahs
You're welcome | De nada | deh NAH-dah
Excuse me | Perdón | pehr-DOHN
I'm sorry | Lo siento | loh SYEHN-toh
Yes | Sí | see
No | No | noh
I don't understand | No entiendo | noh ehn-TYEHN-doh
Do you speak English? | ¿Hablas inglés? | AH-blahs een-GLEHS
Help! | ¡Ayuda! | ah-YOO-dah
How much does it cost? | ¿Cuánto cuesta? | KWAHN-toh KWEHS-tah`),
      colors: P(`
red | rojo | ROH-hoh
blue | azul | ah-SOOL
green | verde | BEHR-deh
yellow | amarillo | ah-mah-REE-yoh
black | negro | NEH-groh
white | blanco | BLAHN-koh
orange | naranja | nah-RAHN-hah
purple | morado | moh-RAH-doh
pink | rosa | ROH-sah
brown | marrón | mah-RROHN
gray | gris | grees`),
      family: P(`
mother | madre | MAH-dreh
father | padre | PAH-dreh
sister | hermana | ehr-MAH-nah
brother | hermano | ehr-MAH-noh
daughter | hija | EE-hah
son | hijo | EE-hoh
grandmother | abuela | ah-BWEH-lah
grandfather | abuelo | ah-BWEH-loh
friend | amigo / amiga | ah-MEE-goh / ah-MEE-gah
family | familia | fah-MEE-lyah`),
      food: P(`
water | agua | AH-gwah
bread | pan | pahn
coffee | café | kah-FEH
milk | leche | LEH-cheh
rice | arroz | ah-RROHS
chicken | pollo | POH-yoh
fruit | fruta | FROO-tah
I am hungry | Tengo hambre | TEHN-goh AHM-breh
The menu, please | La carta, por favor | lah KAR-tah por fah-BOR
The bill, please | La cuenta, por favor | lah KWEHN-tah por fah-BOR
delicious | delicioso | deh-lee-SYOH-soh`),
      travel: P(`
Where is…? | ¿Dónde está…? | DOHN-deh ehs-TAH
the bathroom | el baño | ehl BAH-nyoh
the airport | el aeropuerto | ehl ah-eh-roh-PWEHR-toh
the train station | la estación de tren | lah ehs-tah-SYOHN deh trehn
left | izquierda | ees-KYEHR-dah
right | derecha | deh-REH-chah
straight ahead | todo recto | TOH-doh REHK-toh
the hotel | el hotel | ehl oh-TEHL
a ticket | un billete | oon bee-YEH-teh
I need a taxi | Necesito un taxi | neh-seh-SEE-toh oon TAHK-see`),
      days: P(`
Monday | lunes | LOO-nehs
Tuesday | martes | MAR-tehs
Wednesday | miércoles | MYEHR-koh-lehs
Thursday | jueves | HWEH-vehs
Friday | viernes | VYEHR-nehs
Saturday | sábado | SAH-bah-doh
Sunday | domingo | doh-MEEN-goh
today | hoy | oy
tomorrow | mañana | mah-NYAH-nah
yesterday | ayer | ah-YEHR`),
    },
  };

  D.fr = {
    name: 'French', native: 'Français', flag: '🇫🇷', speech: 'fr-FR', rtl: false, level: 'Moderate',
    speakers: 'About 80 million native speakers; spoken on five continents',
    blurb: 'French spelling is tricky because many final letters are silent. The r is pronounced at the back of the throat, and nasal vowels like "an", "on" and "in" are made through the nose. Words are linked in speech (liaison), and nouns are masculine (le) or feminine (la).',
    data: {
      greetings: P(`
Hello / Good day | Bonjour | bohn-ZHOOR
Hi | Salut | sah-LOO
Good evening | Bonsoir | bohn-SWAHR
Good night | Bonne nuit | bun NWEE
Goodbye | Au revoir | oh ruh-VWAHR
See you soon | À bientôt | ah byan-TOH
How are you? | Comment allez-vous ? | koh-mahn tah-lay VOO
I'm fine, thank you | Je vais bien, merci | zhuh vay byan mehr-SEE
Nice to meet you | Enchanté(e) | ahn-shahn-TAY
What is your name? | Comment vous appelez-vous ? | koh-mahn voo zah-play VOO
My name is… | Je m'appelle… | zhuh mah-PEL`),
      numbers: P(`
one | un | uhn
two | deux | duh
three | trois | trwah
four | quatre | KAH-truh
five | cinq | sank
six | six | sees
seven | sept | set
eight | huit | weet
nine | neuf | nuhf
ten | dix | dees
twenty | vingt | van
one hundred | cent | sahn`),
      phrases: P(`
Please | S'il vous plaît | seel voo PLEH
Thank you | Merci | mehr-SEE
You're welcome | De rien | duh RYAN
Excuse me | Excusez-moi | ehk-skew-zay MWAH
I'm sorry | Je suis désolé(e) | zhuh swee day-zoh-LAY
Yes | Oui | wee
No | Non | nohn
I don't understand | Je ne comprends pas | zhuh nuh kohm-PRAHN pah
Do you speak English? | Parlez-vous anglais ? | par-lay voo ahn-GLAY
Help! | Au secours ! | oh suh-KOOR
How much does it cost? | Combien ça coûte ? | kohm-BYAN sah KOOT`),
      colors: P(`
red | rouge | roozh
blue | bleu | bluh
green | vert | vehr
yellow | jaune | zhohn
black | noir | nwahr
white | blanc | blahn
orange | orange | oh-RAHNZH
purple | violet | vee-oh-LAY
pink | rose | rohz
brown | marron | mah-ROHN
gray | gris | gree`),
      family: P(`
mother | mère | mehr
father | père | pehr
sister | sœur | suhr
brother | frère | frehr
daughter | fille | fee
son | fils | fees
grandmother | grand-mère | grahn-MEHR
grandfather | grand-père | grahn-PEHR
friend | ami(e) | ah-MEE
family | famille | fah-MEE`),
      food: P(`
water | eau | oh
bread | pain | pan
coffee | café | kah-FAY
milk | lait | leh
rice | riz | ree
chicken | poulet | poo-LAY
fruit | fruit | frwee
I am hungry | J'ai faim | zhay fan
The menu, please | La carte, s'il vous plaît | lah kart seel voo PLEH
The bill, please | L'addition, s'il vous plaît | lah-dee-SYOHN seel voo PLEH
delicious | délicieux | day-lee-SYUH`),
      travel: P(`
Where is…? | Où est… ? | oo eh
the bathroom | les toilettes | lay twah-LET
the airport | l'aéroport | lah-ay-roh-POR
the train station | la gare | lah gar
left | à gauche | ah gohsh
right | à droite | ah drwaht
straight ahead | tout droit | too drwah
the hotel | l'hôtel | loh-TEL
a ticket | un billet | uhn bee-YAY
I need a taxi | J'ai besoin d'un taxi | zhay buh-ZWAN duhn tak-SEE`),
      days: P(`
Monday | lundi | luhn-DEE
Tuesday | mardi | mar-DEE
Wednesday | mercredi | mehr-kruh-DEE
Thursday | jeudi | zhuh-DEE
Friday | vendredi | vahn-druh-DEE
Saturday | samedi | sahm-DEE
Sunday | dimanche | dee-MAHNSH
today | aujourd'hui | oh-zhoor-DWEE
tomorrow | demain | duh-MAN
yesterday | hier | ee-YEHR`),
    },
  };

  D.zh = {
    name: 'Mandarin Chinese', native: '普通话', flag: '🇨🇳', speech: 'zh-CN', rtl: false, level: 'Challenging',
    speakers: 'About 940 million native speakers, the most of any language',
    blurb: 'Mandarin is a tonal language: the same syllable means different things depending on its pitch. There are four tones plus a neutral one (ā á ǎ à). Writing uses characters rather than an alphabet, and pinyin, the Latin spelling shown here, is used to learn pronunciation. Grammar is simple: no verb conjugation or plurals.',
    data: {
      greetings: P(`
Hello | 你好 | nǐ hǎo
Good morning | 早上好 | zǎoshang hǎo
Good evening | 晚上好 | wǎnshang hǎo
Goodbye | 再见 | zàijiàn
See you later | 回头见 | huítóu jiàn
How are you? | 你好吗？ | nǐ hǎo ma
I'm fine, thank you | 我很好，谢谢 | wǒ hěn hǎo, xièxie
Nice to meet you | 很高兴认识你 | hěn gāoxìng rènshi nǐ
What is your name? | 你叫什么名字？ | nǐ jiào shénme míngzi
My name is… | 我叫… | wǒ jiào…`),
      numbers: P(`
one | 一 | yī
two | 二 | èr
three | 三 | sān
four | 四 | sì
five | 五 | wǔ
six | 六 | liù
seven | 七 | qī
eight | 八 | bā
nine | 九 | jiǔ
ten | 十 | shí
twenty | 二十 | èrshí
one hundred | 一百 | yì bǎi`),
      phrases: P(`
Please | 请 | qǐng
Thank you | 谢谢 | xièxie
You're welcome | 不客气 | bú kèqi
Excuse me | 请问 | qǐngwèn
I'm sorry | 对不起 | duìbuqǐ
Yes | 是 | shì
No | 不是 | bú shì
I don't understand | 我听不懂 | wǒ tīng bu dǒng
Do you speak English? | 你会说英语吗？ | nǐ huì shuō yīngyǔ ma
Help! | 救命！ | jiùmìng
How much does it cost? | 多少钱？ | duōshao qián`),
      colors: P(`
red | 红色 | hóngsè
blue | 蓝色 | lánsè
green | 绿色 | lǜsè
yellow | 黄色 | huángsè
black | 黑色 | hēisè
white | 白色 | báisè
orange | 橙色 | chéngsè
purple | 紫色 | zǐsè
pink | 粉色 | fěnsè
brown | 棕色 | zōngsè
gray | 灰色 | huīsè`),
      family: P(`
mother | 妈妈 | māma
father | 爸爸 | bàba
older sister | 姐姐 | jiějie
older brother | 哥哥 | gēge
younger sister | 妹妹 | mèimei
younger brother | 弟弟 | dìdi
daughter | 女儿 | nǚ'ér
son | 儿子 | érzi
friend | 朋友 | péngyou
family | 家人 | jiārén`),
      food: P(`
water | 水 | shuǐ
rice | 米饭 | mǐfàn
noodles | 面条 | miàntiáo
tea | 茶 | chá
coffee | 咖啡 | kāfēi
milk | 牛奶 | niúnǎi
chicken | 鸡肉 | jīròu
fruit | 水果 | shuǐguǒ
I am hungry | 我饿了 | wǒ è le
The menu, please | 请给我菜单 | qǐng gěi wǒ càidān
The bill, please | 买单 | mǎidān
delicious | 好吃 | hǎochī`),
      travel: P(`
Where is…? | …在哪里？ | …zài nǎlǐ
the bathroom | 洗手间 | xǐshǒujiān
the airport | 机场 | jīchǎng
the train station | 火车站 | huǒchēzhàn
left | 左边 | zuǒbiān
right | 右边 | yòubiān
straight ahead | 一直走 | yìzhí zǒu
the hotel | 酒店 | jiǔdiàn
a ticket | 票 | piào
I need a taxi | 我需要出租车 | wǒ xūyào chūzūchē`),
      days: P(`
Monday | 星期一 | xīngqī yī
Tuesday | 星期二 | xīngqī èr
Wednesday | 星期三 | xīngqī sān
Thursday | 星期四 | xīngqī sì
Friday | 星期五 | xīngqī wǔ
Saturday | 星期六 | xīngqī liù
Sunday | 星期天 | xīngqī tiān
today | 今天 | jīntiān
tomorrow | 明天 | míngtiān
yesterday | 昨天 | zuótiān`),
    },
  };

  D.ar = {
    name: 'Arabic', native: 'العربية', flag: '🇸🇦', speech: 'ar-SA', rtl: true, level: 'Challenging',
    speakers: 'About 370 million native speakers; official in 25 countries',
    blurb: 'Arabic is written from right to left, and most letters change shape depending on their position in a word. Short vowels are usually not written. This course uses Modern Standard Arabic, understood across the Arab world; everyday speech varies by country (Egyptian, Levantine, Gulf and Moroccan dialects). Many sounds, like ḥ, kh, ʿ and q, have no English equivalent.',
    data: {
      greetings: P(`
Hello | مرحبا | marḥaban
Good morning | صباح الخير | ṣabāḥ al-khayr
Good evening | مساء الخير | masāʾ al-khayr
Peace be upon you | السلام عليكم | as-salāmu ʿalaykum
And upon you, peace | وعليكم السلام | wa ʿalaykum as-salām
Goodbye | مع السلامة | maʿa s-salāma
How are you? | كيف حالك؟ | kayfa ḥāluk
I'm fine, thank you | أنا بخير، شكرا | anā bi-khayr, shukran
Nice to meet you | تشرفنا | tasharrafnā
What is your name? | ما اسمك؟ | mā ismuk
My name is… | اسمي… | ismī…`),
      numbers: P(`
one | ١ · واحد | wāḥid
two | ٢ · اثنان | ithnān
three | ٣ · ثلاثة | thalātha
four | ٤ · أربعة | arbaʿa
five | ٥ · خمسة | khamsa
six | ٦ · ستة | sitta
seven | ٧ · سبعة | sabʿa
eight | ٨ · ثمانية | thamāniya
nine | ٩ · تسعة | tisʿa
ten | ١٠ · عشرة | ʿashara
twenty | ٢٠ · عشرون | ʿishrūn
one hundred | ١٠٠ · مئة | miʾa`),
      phrases: P(`
Please | من فضلك | min faḍlik
Thank you | شكرا | shukran
You're welcome | عفوا | ʿafwan
Excuse me | المعذرة | al-maʿdhira
I'm sorry | آسف | āsif
Yes | نعم | naʿam
No | لا | lā
I don't understand | لا أفهم | lā afham
Do you speak English? | هل تتكلم الإنجليزية؟ | hal tatakallam al-inglīziyya
Help! | النجدة! | an-najda
How much does it cost? | بكم هذا؟ | bikam hādhā`),
      colors: P(`
red | أحمر | aḥmar
blue | أزرق | azraq
green | أخضر | akhḍar
yellow | أصفر | aṣfar
black | أسود | aswad
white | أبيض | abyaḍ
orange | برتقالي | burtuqālī
purple | بنفسجي | banafsajī
pink | وردي | wardī
brown | بني | bunnī
gray | رمادي | ramādī`),
      family: P(`
mother | أم | umm
father | أب | ab
sister | أخت | ukht
brother | أخ | akh
daughter | ابنة | ibna
son | ابن | ibn
grandmother | جدة | jadda
grandfather | جد | jadd
friend | صديق | ṣadīq
family | عائلة | ʿāʾila`),
      food: P(`
water | ماء | māʾ
bread | خبز | khubz
coffee | قهوة | qahwa
tea | شاي | shāy
milk | حليب | ḥalīb
rice | أرز | aruzz
chicken | دجاج | dajāj
fruit | فاكهة | fākiha
I am hungry | أنا جائع | anā jāʾiʿ
The menu, please | القائمة من فضلك | al-qāʾima min faḍlik
The bill, please | الحساب من فضلك | al-ḥisāb min faḍlik
delicious | لذيذ | ladhīdh`),
      travel: P(`
Where is…? | أين…؟ | ayna…
the bathroom | الحمام | al-ḥammām
the airport | المطار | al-maṭār
the train station | محطة القطار | maḥaṭṭat al-qiṭār
left | يسار | yasār
right | يمين | yamīn
straight ahead | على طول | ʿalā ṭūl
the hotel | الفندق | al-funduq
a ticket | تذكرة | tadhkira
I need a taxi | أحتاج إلى سيارة أجرة | aḥtāj ilā sayyārat ujra`),
      days: P(`
Monday | الاثنين | al-ithnayn
Tuesday | الثلاثاء | ath-thulāthāʾ
Wednesday | الأربعاء | al-arbiʿāʾ
Thursday | الخميس | al-khamīs
Friday | الجمعة | al-jumʿa
Saturday | السبت | as-sabt
Sunday | الأحد | al-aḥad
today | اليوم | al-yawm
tomorrow | غدا | ghadan
yesterday | أمس | amsi`),
    },
  };

  window.LANG_SECTIONS = SECTIONS;
  window.LANGS = D;
})();
