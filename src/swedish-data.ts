export type SwedishWord = {
  swedish: string
  chinese: string
  english?: string
  example: string
  exampleChinese: string
  exampleEnglish?: string
  note?: string
}

export type SwedishCourse = {
  id: string
  eyebrow: string
  title: string
  titleEn?: string
  description: string
  descriptionEn?: string
  level: string
  accent: string
  vocabularyOnly?: boolean
  words: SwedishWord[]
}

export type CoursePackSource = {
  title: string
  url: string
  note: string
}

export type CoursePack = {
  id: string
  title: string
  titleEn?: string
  swedishTitle: string
  description: string
  descriptionEn?: string
  level: string
  accent: string
  category: '入门' | '生活' | '词汇' | '发音' | '职场' | '考试' | '文化' | '亲子'
  categoryEn?: string
  cover: 'starter' | 'life' | 'words' | 'sound' | 'work' | 'exam' | 'culture' | 'family' | 'premium'
  tags: string[]
  tagsEn?: string[]
  learners: number
  featured?: boolean
  premium?: boolean
  contentVersion?: string
  sources?: CoursePackSource[]
  courses: SwedishCourse[]
}

export const courses: SwedishCourse[] = [
  {
    id: 'first-steps', eyebrow: '01 · START', title: '第一次见面', description: '问候、道别和最重要的礼貌用语', level: 'A1', accent: '#f7c948',
    words: [
      { swedish: 'hej', chinese: '你好', example: 'Hej! Hur mår du?', exampleChinese: '你好！你好吗？' },
      { swedish: 'tack', chinese: '谢谢', example: 'Tack så mycket.', exampleChinese: '非常感谢。' },
      { swedish: 'ja', chinese: '是 / 好', example: 'Ja, gärna.', exampleChinese: '好啊，我很乐意。' },
      { swedish: 'nej', chinese: '不', example: 'Nej, tack.', exampleChinese: '不了，谢谢。' },
      { swedish: 'ursäkta', chinese: '打扰一下 / 对不起', example: 'Ursäkta, var ligger stationen?', exampleChinese: '打扰一下，车站在哪里？' },
      { swedish: 'hejdå', chinese: '再见', example: 'Hejdå, vi ses imorgon!', exampleChinese: '再见，明天见！' },
      { swedish: 'välkommen', chinese: '欢迎', example: 'Välkommen till Sverige!', exampleChinese: '欢迎来到瑞典！' },
      { swedish: 'snälla', chinese: '请 / 拜托', example: 'Kan du hjälpa mig, snälla?', exampleChinese: '你能帮帮我吗？' },
    ],
  },
  {
    id: 'fika', eyebrow: '02 · FIKA', title: '咖啡时间', description: '在咖啡店自然地点单和聊天', level: 'A1', accent: '#e97747',
    words: [
      { swedish: 'kaffe', chinese: '咖啡', example: 'En kaffe, tack.', exampleChinese: '请给我一杯咖啡。', note: 'ett kaffe，也常说 en kopp kaffe' },
      { swedish: 'kanelbulle', chinese: '肉桂卷', example: 'Jag tar en kanelbulle.', exampleChinese: '我要一个肉桂卷。', note: 'en kanelbulle' },
      { swedish: 'mjölk', chinese: '牛奶', example: 'Vill du ha mjölk i kaffet?', exampleChinese: '你的咖啡里要加牛奶吗？' },
      { swedish: 'socker', chinese: '糖', example: 'Utan socker, tack.', exampleChinese: '请不要加糖。' },
      { swedish: 'gott', chinese: '好吃的', example: 'Det var jättegott!', exampleChinese: '太好吃了！' },
      { swedish: 'notan', chinese: '账单', example: 'Kan vi få notan?', exampleChinese: '可以给我们账单吗？' },
      { swedish: 'te', chinese: '茶', example: 'Jag vill gärna ha te.', exampleChinese: '我想要茶。' },
      { swedish: 'vatten', chinese: '水', example: 'Ett glas vatten, tack.', exampleChinese: '请给我一杯水。' },
    ],
  },
  {
    id: 'city', eyebrow: '03 · STADEN', title: '城市出行', description: '问路、坐车和寻找目的地', level: 'A1–A2', accent: '#70a982',
    words: [
      { swedish: 'station', chinese: '车站', example: 'Var ligger stationen?', exampleChinese: '车站在哪里？', note: 'en station' },
      { swedish: 'tunnelbana', chinese: '地铁', example: 'Jag tar tunnelbanan.', exampleChinese: '我坐地铁。', note: 'en tunnelbana' },
      { swedish: 'biljett', chinese: '车票', example: 'Var köper jag en biljett?', exampleChinese: '我在哪里买票？', note: 'en biljett' },
      { swedish: 'vänster', chinese: '左边', example: 'Sväng till vänster.', exampleChinese: '向左转。' },
      { swedish: 'höger', chinese: '右边', example: 'Butiken ligger till höger.', exampleChinese: '商店在右边。' },
      { swedish: 'nära', chinese: '附近 / 近', example: 'Är det nära härifrån?', exampleChinese: '离这里近吗？' },
      { swedish: 'buss', chinese: '公交车', example: 'Bussen kommer snart.', exampleChinese: '公交车很快就来。', note: 'en buss' },
      { swedish: 'hållplats', chinese: '车站 / 站点', example: 'Nästa hållplats är Slussen.', exampleChinese: '下一站是 Slussen。', note: 'en hållplats' },
    ],
  },
  {
    id: 'daily-life', eyebrow: '04 · VARDAG', title: '我的一天', description: '用简单句描述工作与日常生活', level: 'A2', accent: '#6e86c5',
    words: [
      { swedish: 'morgon', chinese: '早晨', example: 'God morgon!', exampleChinese: '早上好！', note: 'en morgon' },
      { swedish: 'jobbar', chinese: '工作', example: 'Jag jobbar hemifrån idag.', exampleChinese: '我今天在家工作。' },
      { swedish: 'äter', chinese: '吃', example: 'Vi äter lunch klockan tolv.', exampleChinese: '我们十二点吃午饭。' },
      { swedish: 'promenerar', chinese: '散步', example: 'Jag promenerar efter jobbet.', exampleChinese: '我下班后散步。' },
      { swedish: 'hemma', chinese: '在家', example: 'Jag är hemma ikväll.', exampleChinese: '我今晚在家。' },
      { swedish: 'sover', chinese: '睡觉', example: 'Barnet sover redan.', exampleChinese: '孩子已经睡了。' },
      { swedish: 'vaknar', chinese: '醒来', example: 'Jag vaknar klockan sju.', exampleChinese: '我七点醒来。' },
      { swedish: 'lagar mat', chinese: '做饭', example: 'Vi lagar mat tillsammans.', exampleChinese: '我们一起做饭。' },
    ],
  },
  {
    id: 'home', eyebrow: '05 · HEMMA', title: '我的家', description: '认识房间、家具和日常居住表达', level: 'A1', accent: '#cf6d83',
    words: [
      { swedish: 'lägenhet', chinese: '公寓', example: 'Jag bor i en liten lägenhet.', exampleChinese: '我住在一间小公寓里。', note: 'en lägenhet' },
      { swedish: 'rum', chinese: '房间', example: 'Lägenheten har tre rum.', exampleChinese: '这套公寓有三个房间。', note: 'ett rum' },
      { swedish: 'kök', chinese: '厨房', example: 'Köket är ljust.', exampleChinese: '厨房很明亮。', note: 'ett kök' },
      { swedish: 'badrum', chinese: '浴室', example: 'Badrummet ligger till vänster.', exampleChinese: '浴室在左边。', note: 'ett badrum' },
      { swedish: 'sovrum', chinese: '卧室', example: 'Sovrummet är på övervåningen.', exampleChinese: '卧室在楼上。', note: 'ett sovrum' },
      { swedish: 'fönster', chinese: '窗户', example: 'Öppna fönstret, tack.', exampleChinese: '请打开窗户。', note: 'ett fönster' },
      { swedish: 'dörr', chinese: '门', example: 'Stäng dörren.', exampleChinese: '把门关上。', note: 'en dörr' },
      { swedish: 'nyckel', chinese: '钥匙', example: 'Var är min nyckel?', exampleChinese: '我的钥匙在哪里？', note: 'en nyckel' },
    ],
  },
  {
    id: 'shopping', eyebrow: '06 · BUTIKEN', title: '逛商店', description: '询价、尺码和结账时的必备词汇', level: 'A2', accent: '#bd8f36',
    words: [
      { swedish: 'kostar', chinese: '价格是', example: 'Hur mycket kostar den?', exampleChinese: '这个多少钱？' },
      { swedish: 'billig', chinese: '便宜的', example: 'Den här är ganska billig.', exampleChinese: '这个挺便宜的。' },
      { swedish: 'dyr', chinese: '贵的', example: 'Jackan är för dyr.', exampleChinese: '这件夹克太贵了。' },
      { swedish: 'storlek', chinese: '尺码', example: 'Vilken storlek behöver du?', exampleChinese: '你需要什么尺码？', note: 'en storlek' },
      { swedish: 'kvitto', chinese: '小票', example: 'Vill du ha kvittot?', exampleChinese: '你要小票吗？', note: 'ett kvitto' },
      { swedish: 'kontant', chinese: '现金', example: 'Kan jag betala kontant?', exampleChinese: '我可以付现金吗？' },
      { swedish: 'kort', chinese: '卡', example: 'Jag betalar med kort.', exampleChinese: '我刷卡付款。', note: 'ett kort' },
      { swedish: 'öppet', chinese: '营业中 / 开着的', example: 'Är butiken öppen idag?', exampleChinese: '商店今天营业吗？' },
    ],
  },
  {
    id: 'work', eyebrow: '07 · JOBBET', title: '工作与学习', description: '办公室、学校和线上沟通高频词', level: 'A2', accent: '#4f8f9d',
    words: [
      { swedish: 'möte', chinese: '会议', example: 'Vi har ett möte klockan nio.', exampleChinese: '我们九点有个会议。', note: 'ett möte' },
      { swedish: 'kollega', chinese: '同事', example: 'Min kollega heter Anna.', exampleChinese: '我的同事叫 Anna。', note: 'en kollega' },
      { swedish: 'chef', chinese: '老板 / 主管', example: 'Chefen är på kontoret.', exampleChinese: '主管在办公室。', note: 'en chef' },
      { swedish: 'mejl', chinese: '电子邮件', example: 'Jag skickar ett mejl.', exampleChinese: '我发一封邮件。', note: 'ett mejl' },
      { swedish: 'dator', chinese: '电脑', example: 'Min dator är långsam.', exampleChinese: '我的电脑很慢。', note: 'en dator' },
      { swedish: 'rast', chinese: '休息时间', example: 'Vi tar en kort rast.', exampleChinese: '我们短暂休息一下。', note: 'en rast' },
      { swedish: 'uppgift', chinese: '任务 / 作业', example: 'Uppgiften är svår.', exampleChinese: '这个任务很难。', note: 'en uppgift' },
      { swedish: 'fråga', chinese: '问题', example: 'Jag har en fråga.', exampleChinese: '我有一个问题。', note: 'en fråga' },
    ],
  },
  {
    id: 'weather', eyebrow: '08 · VÄDRET', title: '天气与季节', description: '瑞典人最常开启的话题', level: 'A1–A2', accent: '#6b94c7',
    words: [
      { swedish: 'soligt', chinese: '晴朗的', example: 'Det är soligt idag.', exampleChinese: '今天天气晴朗。' },
      { swedish: 'regnar', chinese: '下雨', example: 'Det regnar hela dagen.', exampleChinese: '一整天都在下雨。' },
      { swedish: 'snöar', chinese: '下雪', example: 'Det snöar ute.', exampleChinese: '外面正在下雪。' },
      { swedish: 'kallt', chinese: '冷的', example: 'Det är kallt i kväll.', exampleChinese: '今晚很冷。' },
      { swedish: 'varmt', chinese: '暖和 / 热', example: 'Det blir varmt i helgen.', exampleChinese: '周末会很暖和。' },
      { swedish: 'vår', chinese: '春天', example: 'Våren kommer sent i år.', exampleChinese: '今年春天来得晚。', note: 'en vår' },
      { swedish: 'sommar', chinese: '夏天', example: 'Sommaren är ljus i Sverige.', exampleChinese: '瑞典的夏天很明亮。', note: 'en sommar' },
      { swedish: 'vinter', chinese: '冬天', example: 'Vintern kan vara lång.', exampleChinese: '冬天可能很漫长。', note: 'en vinter' },
    ],
  },
  {
    id: 'health', eyebrow: '09 · HÄLSA', title: '身体与健康', description: '描述不舒服并寻求基本帮助', level: 'A2', accent: '#71a66a',
    words: [
      { swedish: 'läkare', chinese: '医生', example: 'Jag behöver träffa en läkare.', exampleChinese: '我需要看医生。', note: 'en läkare' },
      { swedish: 'apotek', chinese: '药店', example: 'Finns det ett apotek i närheten?', exampleChinese: '附近有药店吗？', note: 'ett apotek' },
      { swedish: 'ont', chinese: '疼', example: 'Jag har ont i huvudet.', exampleChinese: '我头疼。' },
      { swedish: 'sjuk', chinese: '生病的', example: 'Jag är sjuk idag.', exampleChinese: '我今天生病了。' },
      { swedish: 'frisk', chinese: '健康的 / 康复的', example: 'Nu är jag frisk igen.', exampleChinese: '我现在又康复了。' },
      { swedish: 'huvud', chinese: '头', example: 'Mitt huvud känns tungt.', exampleChinese: '我的头感觉很沉。', note: 'ett huvud' },
      { swedish: 'mage', chinese: '胃 / 肚子', example: 'Jag har ont i magen.', exampleChinese: '我肚子疼。', note: 'en mage' },
      { swedish: 'medicin', chinese: '药', example: 'Ta medicinen efter maten.', exampleChinese: '饭后吃药。', note: 'en medicin' },
    ],
  },
  {
    id: 'people', eyebrow: '10 · MÄNNISKOR', title: '家人与朋友', description: '介绍身边的人和周末活动', level: 'A1', accent: '#b1709d',
    words: [
      { swedish: 'familj', chinese: '家庭', example: 'Min familj bor i Kina.', exampleChinese: '我的家人住在中国。', note: 'en familj' },
      { swedish: 'vän', chinese: '朋友', example: 'Hon är min bästa vän.', exampleChinese: '她是我最好的朋友。', note: 'en vän' },
      { swedish: 'mamma', chinese: '妈妈', example: 'Min mamma gillar att resa.', exampleChinese: '我妈妈喜欢旅行。' },
      { swedish: 'pappa', chinese: '爸爸', example: 'Min pappa lagar god mat.', exampleChinese: '我爸爸做饭很好吃。' },
      { swedish: 'barn', chinese: '孩子', example: 'De har två barn.', exampleChinese: '他们有两个孩子。', note: 'ett barn' },
      { swedish: 'tillsammans', chinese: '一起', example: 'Vi fikar tillsammans.', exampleChinese: '我们一起喝咖啡。' },
      { swedish: 'helg', chinese: '周末', example: 'Vad gör du i helgen?', exampleChinese: '你周末做什么？', note: 'en helg' },
      { swedish: 'fest', chinese: '聚会', example: 'Vi ska på fest ikväll.', exampleChinese: '我们今晚要去参加聚会。', note: 'en fest' },
    ],
  },
  {
    id: 'time', eyebrow: '11 · TIDEN', title: '时间表达', description: '约时间和谈论过去与未来', level: 'A1–A2', accent: '#7b7ab1',
    words: [
      { swedish: 'idag', chinese: '今天', example: 'Vad gör du idag?', exampleChinese: '你今天做什么？' },
      { swedish: 'imorgon', chinese: '明天', example: 'Vi ses imorgon.', exampleChinese: '我们明天见。' },
      { swedish: 'igår', chinese: '昨天', example: 'Jag jobbade igår.', exampleChinese: '我昨天工作了。' },
      { swedish: 'kväll', chinese: '晚上', example: 'Har du tid i kväll?', exampleChinese: '你今晚有时间吗？', note: 'en kväll' },
      { swedish: 'vecka', chinese: '星期 / 周', example: 'Nästa vecka är jag ledig.', exampleChinese: '下周我休假。', note: 'en vecka' },
      { swedish: 'månad', chinese: '月份 / 月', example: 'Jag har bott här i en månad.', exampleChinese: '我在这里住了一个月。', note: 'en månad' },
      { swedish: 'klockan', chinese: '在……点钟', example: 'Mötet börjar klockan tio.', exampleChinese: '会议十点开始。' },
      { swedish: 'snart', chinese: '很快 / 马上', example: 'Tåget kommer snart.', exampleChinese: '火车马上就来。' },
    ],
  },
  {
    id: 'survival-phrases', eyebrow: '12 · UTTRYCK', title: '生存瑞典语', description: '可以直接拿来使用的八个完整句子', level: 'A2', accent: '#d36b57',
    words: [
      { swedish: 'Jag heter', chinese: '我叫……', example: 'Hej, jag heter Lin.', exampleChinese: '你好，我叫 Lin。' },
      { swedish: 'Hur mår du?', chinese: '你好吗？', example: 'Hej! Hur mår du idag?', exampleChinese: '你好！你今天好吗？' },
      { swedish: 'Jag förstår inte', chinese: '我不明白', example: 'Ursäkta, jag förstår inte.', exampleChinese: '对不起，我不明白。' },
      { swedish: 'Kan du hjälpa mig?', chinese: '你能帮助我吗？', example: 'Ursäkta, kan du hjälpa mig?', exampleChinese: '打扰一下，你能帮我吗？' },
      { swedish: 'Vad betyder det?', chinese: '那是什么意思？', example: 'Vad betyder det på svenska?', exampleChinese: '那用瑞典语是什么意思？' },
      { swedish: 'Kan du säga det igen?', chinese: '你能再说一遍吗？', example: 'Kan du säga det igen, lite långsammare?', exampleChinese: '你能慢一点再说一遍吗？' },
      { swedish: 'Jag lär mig svenska', chinese: '我正在学瑞典语', example: 'Jag lär mig svenska varje dag.', exampleChinese: '我每天都在学瑞典语。' },
      { swedish: 'Vi ses senare', chinese: '待会儿见', example: 'Tack för idag, vi ses senare!', exampleChinese: '今天谢谢你，待会儿见！' },
    ],
  },
]

export const allWords = courses.flatMap((course) =>
  course.words.map((word) => ({ ...word, courseId: course.id, courseTitle: course.title, accent: course.accent })),
)

export type DictionaryWord = (typeof allWords)[number]

const premiumDaily1000 = loadCoursePackFile(premiumDaily1000File, 1000)

export const coursePacks: CoursePack[] = [
  premiumDaily1000,
  {
    id: 'daily-starter',
    title: '瑞典语日常入门',
    swedishTitle: 'Svenska varje dag',
    description: '从问候、咖啡店、城市出行到日常作息，建立第一套能真正使用的瑞典语。',
    level: 'A1 · 入门',
    accent: '#2858c8',
    category: '入门',
    cover: 'starter',
    tags: ['零基础', '日常会话'],
    learners: 2846,
    featured: true,
    courses: courses.slice(0, 4),
  },
  {
    id: 'life-in-sweden',
    title: '瑞典生活场景口语',
    swedishTitle: 'Livet i Sverige',
    description: '围绕居家、购物、天气、健康和社交，解决在瑞典生活中最常遇到的表达。',
    level: 'A1–A2 · 场景',
    accent: '#4f8f79',
    category: '生活',
    cover: 'life',
    tags: ['在瑞生活', '高频场景'],
    learners: 1932,
    featured: true,
    courses: [courses[4], courses[5], courses[7], courses[8], courses[9]],
  },
  {
    id: 'a1-core',
    title: 'A1 核心词汇与句型',
    swedishTitle: 'Ord & uttryck A1',
    description: '集中训练工作、时间和生存表达，用高频词与完整句型强化键盘记忆。',
    level: 'A1–A2 · 强化',
    accent: '#b26a4f',
    category: '词汇',
    cover: 'words',
    tags: ['核心词汇', '句型强化'],
    learners: 1587,
    courses: [courses[6], courses[10], courses[11]],
  },
  {
    id: 'pronunciation-lab',
    title: '瑞典语发音训练营',
    swedishTitle: 'Uttal från grunden',
    description: '从 å、ä、ö 到长短元音和句子节奏，用键盘输入配合跟读建立清晰发音。',
    level: 'A1 · 发音',
    accent: '#2f7f9d',
    category: '发音',
    cover: 'sound',
    tags: ['元音专项', '跟读节奏'],
    learners: 1249,
    featured: true,
    courses: [courses[0], courses[7], courses[10], courses[11]],
  },
  {
    id: 'swedish-at-work',
    title: '瑞典职场沟通',
    swedishTitle: 'Svenska på jobbet',
    description: '覆盖会议、邮件、同事交流和时间安排，帮助你更自然地参与瑞典工作环境。',
    level: 'A2 · 职场',
    accent: '#6f62a6',
    category: '职场',
    cover: 'work',
    tags: ['会议表达', '工作邮件'],
    learners: 986,
    courses: [courses[6], courses[10], courses[2], courses[3]],
  },
  {
    id: 'sfi-ready',
    title: 'SFI 入学与课堂准备',
    swedishTitle: 'Redo för SFI',
    description: '训练自我介绍、课堂提问、时间表达和生活信息，为进入 SFI 课堂做好准备。',
    level: 'A1–A2 · 备考',
    accent: '#c45f64',
    category: '考试',
    cover: 'exam',
    tags: ['SFI 准备', '课堂表达'],
    learners: 1108,
    courses: [courses[0], courses[3], courses[6], courses[10], courses[11]],
  },
  {
    id: 'swedish-culture',
    title: '从 Fika 读懂瑞典',
    swedishTitle: 'Fika & svensk kultur',
    description: '从咖啡文化、季节、家庭与城市生活进入瑞典人的日常语境与表达习惯。',
    level: 'A1–A2 · 文化',
    accent: '#bc7c32',
    category: '文化',
    cover: 'culture',
    tags: ['文化阅读', 'Fika'],
    learners: 1376,
    courses: [courses[1], courses[7], courses[9], courses[2]],
  },
  {
    id: 'family-swedish',
    title: '亲子瑞典语启蒙',
    swedishTitle: 'Svenska tillsammans',
    description: '用家庭、居家、天气和日常活动词汇，和孩子一起完成轻量、可重复的输入练习。',
    level: 'A1 · 亲子',
    accent: '#cf6d83',
    category: '亲子',
    cover: 'family',
    tags: ['亲子共学', '轻量启蒙'],
    learners: 742,
    courses: [courses[0], courses[4], courses[7], courses[9]],
  },
]

export const getPackWords = (pack: CoursePack) =>
  pack.courses.flatMap((course) =>
    course.words.map((word) => ({ ...word, courseId: course.id, courseTitle: course.title, accent: course.accent })),
  )
import premiumDaily1000File from './course-packs/premium-daily-1000.json'
import { loadCoursePackFile } from './course-packs/schema'
