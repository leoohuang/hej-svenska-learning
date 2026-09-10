import {
  ArrowLeft, ArrowRight, Briefcase, Check, Coffee, Lock, MessageCircle,
  RotateCcw, ShoppingBasket, Sparkles, Trees, Volume2, X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLanguage } from './i18n'
import { learningLanguageConfig, learningStorageKey, type LearningLanguage } from './learning-language'

type LocalText = { zh: string; en: string }
type ScenarioQuestion =
  | {
      type: 'choice'
      npc: LocalText
      prompt: LocalText
      options: Array<{ text: string; meaning: LocalText }>
      correct: number
      explanation: LocalText
    }
  | {
      type: 'order'
      npc: LocalText
      prompt: LocalText
      tokens: string[]
      correct: string[]
      explanation: LocalText
    }
  | {
      type: 'gap'
      npc: LocalText
      prompt: LocalText
      sentence: string
      options: string[]
      correct: number
      explanation: LocalText
    }

type Scenario = {
  id: string
  icon: typeof Briefcase
  theme: 'office' | 'cafe' | 'market' | 'courtyard'
  title: LocalText
  swedishTitle: string
  description: LocalText
  level: string
  duration: number
  npc: { name: string; role: LocalText; skin: string; hair: string; outfit: string }
  crowd: Array<{ skin: string; hair: string; outfit: string }>
  questions: ScenarioQuestion[]
}

type ScenarioProgress = Record<string, { completed: boolean; best: number }>

const tx = (language: 'zh' | 'en', value: LocalText) => value[language]

const swedishScenarios: Scenario[] = [
  {
    id: 'morning-meeting',
    icon: Briefcase,
    theme: 'office',
    title: { zh: '职场晨会', en: 'Morning Stand-up' },
    swedishTitle: 'MORGONMÖTE',
    description: { zh: '汇报今天的安排、提出问题并礼貌地加入讨论。', en: 'Share your plan, ask for help and join a workplace discussion naturally.' },
    level: 'A2',
    duration: 6,
    npc: { name: 'Elin', role: { zh: '项目负责人', en: 'Project lead' }, skin: '#f1c6a5', hair: '#c66f46', outfit: '#39796d' },
    crowd: [
      { skin: '#8d5d48', hair: '#222c3b', outfit: '#315b9b' },
      { skin: '#e8b98f', hair: '#d4af67', outfit: '#b35e72' },
    ],
    questions: [
      {
        type: 'choice',
        npc: { zh: 'God morgon! Vad arbetar du med i dag?', en: 'God morgon! Vad arbetar du med i dag?' },
        prompt: { zh: 'Elin 问你今天要做什么。选择最自然的回答。', en: 'Elin asks what you are working on today. Choose the most natural reply.' },
        options: [
          { text: 'I dag arbetar jag med rapporten.', meaning: { zh: '我今天处理报告。', en: 'Today I am working on the report.' } },
          { text: 'Jag rapport kaffe i dag.', meaning: { zh: '词序和搭配不正确。', en: 'The word order and phrasing are incorrect.' } },
          { text: 'Hejdå, vi ses i går.', meaning: { zh: '再见，我们昨天见。', en: 'Goodbye, see you yesterday.' } },
        ],
        correct: 0,
        explanation: { zh: '“arbetar med”表示“正在处理、从事”，很适合汇报工作。', en: '“Arbetar med” means “to work on” and fits a status update naturally.' },
      },
      {
        type: 'order',
        npc: { zh: 'Kan vi börja mötet nu?', en: 'Kan vi börja mötet nu?' },
        prompt: { zh: '按正确顺序组装句子：我们现在可以开始会议吗？', en: 'Build the sentence: Can we start the meeting now?' },
        tokens: ['mötet', 'Kan', 'nu', 'börja', 'vi'],
        correct: ['Kan', 'vi', 'börja', 'mötet', 'nu'],
        explanation: { zh: '一般疑问句把情态动词 Kan 放在句首：Kan + 主语 + 动词。', en: 'A yes/no question starts with the modal: Kan + subject + verb.' },
      },
      {
        type: 'gap',
        npc: { zh: 'Behöver du hjälp med presentationen?', en: 'Behöver du hjälp med presentationen?' },
        prompt: { zh: '选择最合适的词完成句子。', en: 'Choose the word that completes the sentence naturally.' },
        sentence: 'Jag behöver ____ hjälp med presentationen.',
        options: ['lite', 'många', 'aldrig'],
        correct: 0,
        explanation: { zh: 'hjälp 是不可数概念，这里用 lite hjälp 表示“一点帮助”。', en: 'Hjälp is uncountable here, so lite hjälp means “a little help”.' },
      },
    ],
  },
  {
    id: 'fika-chat',
    icon: Coffee,
    theme: 'cafe',
    title: { zh: 'Fika 闲聊', en: 'Fika Chat' },
    swedishTitle: 'FIKA MED VÄNNER',
    description: { zh: '点一杯饮料，接住朋友的话题，再自然地聊聊周末。', en: 'Order a drink, follow the conversation and talk about your weekend.' },
    level: 'A1',
    duration: 5,
    npc: { name: 'Maja', role: { zh: '新朋友', en: 'New friend' }, skin: '#c88964', hair: '#342b2b', outfit: '#c9677c' },
    crowd: [
      { skin: '#f0c5a0', hair: '#d29a57', outfit: '#527b9c' },
      { skin: '#80503e', hair: '#252c35', outfit: '#d19a45' },
    ],
    questions: [
      {
        type: 'choice',
        npc: { zh: 'Vill du ha kaffe eller te?', en: 'Vill du ha kaffe eller te?' },
        prompt: { zh: 'Maja 问你想喝咖啡还是茶。怎么回答更自然？', en: 'Maja asks whether you want coffee or tea. Which reply sounds natural?' },
        options: [
          { text: 'Jag tar gärna en kaffe, tack.', meaning: { zh: '我很乐意来杯咖啡，谢谢。', en: 'I would gladly have a coffee, thanks.' } },
          { text: 'Kaffe är jag i bordet.', meaning: { zh: '这个句子无法表达点单。', en: 'This sentence does not express an order.' } },
          { text: 'Jag dricker i går.', meaning: { zh: '我昨天喝。', en: 'I drink yesterday.' } },
        ],
        correct: 0,
        explanation: { zh: 'Jag tar gärna… 是轻松又礼貌的选择表达，很适合 Fika。', en: 'Jag tar gärna… is a relaxed, polite way to choose something during fika.' },
      },
      {
        type: 'order',
        npc: { zh: 'Vad gjorde du i helgen?', en: 'Vad gjorde du i helgen?' },
        prompt: { zh: '按正确顺序组装：你周末做了什么？', en: 'Build the sentence: What did you do this weekend?' },
        tokens: ['du', 'Vad', 'helgen', 'gjorde', 'i'],
        correct: ['Vad', 'gjorde', 'du', 'i', 'helgen'],
        explanation: { zh: '特殊疑问句通常是：疑问词 + 动词 + 主语。', en: 'A wh-question usually follows: question word + verb + subject.' },
      },
      {
        type: 'gap',
        npc: { zh: 'Det var trevligt att ses!', en: 'Det var trevligt att ses!' },
        prompt: { zh: '选择最合适的词。', en: 'Choose the best word.' },
        sentence: 'Ska vi ta en fika ____ igen?',
        options: ['tillsammans', 'dyrt', 'vänster'],
        correct: 0,
        explanation: { zh: 'tillsammans 表示“一起”，放在这里自然地邀请对方。', en: 'Tillsammans means “together” and makes this a natural invitation.' },
      },
    ],
  },
  {
    id: 'grocery-checkout',
    icon: ShoppingBasket,
    theme: 'market',
    title: { zh: '超市结账', en: 'At the Checkout' },
    swedishTitle: 'I MATAFFÄREN',
    description: { zh: '询问价格、听懂收银员的问题，并顺利完成付款。', en: 'Ask about prices, understand the cashier and complete your purchase.' },
    level: 'A1',
    duration: 4,
    npc: { name: 'Oskar', role: { zh: '收银员', en: 'Cashier' }, skin: '#e7b58f', hair: '#5b3e33', outfit: '#315f91' },
    crowd: [
      { skin: '#976347', hair: '#1f2935', outfit: '#b56049' },
      { skin: '#f1c8aa', hair: '#dbc07f', outfit: '#6b8f63' },
    ],
    questions: [
      {
        type: 'choice',
        npc: { zh: 'Vill du ha kvittot?', en: 'Vill du ha kvittot?' },
        prompt: { zh: '收银员问你要不要小票。请选择合适回答。', en: 'The cashier asks whether you want the receipt. Choose a suitable reply.' },
        options: [
          { text: 'Ja tack, gärna.', meaning: { zh: '好的，谢谢。', en: 'Yes please, thank you.' } },
          { text: 'Jag är ett kvitto.', meaning: { zh: '我是一张小票。', en: 'I am a receipt.' } },
          { text: 'Nej i måndag.', meaning: { zh: '不，在星期一。', en: 'No, on Monday.' } },
        ],
        correct: 0,
        explanation: { zh: 'Ja tack, gärna 是接受提议时简洁自然的说法。', en: 'Ja tack, gärna is a concise, natural way to accept an offer.' },
      },
      {
        type: 'order',
        npc: { zh: 'Fråga gärna om du undrar över priset.', en: 'Fråga gärna om du undrar över priset.' },
        prompt: { zh: '按正确顺序组装：这个多少钱？', en: 'Build the sentence: How much does this cost?' },
        tokens: ['det', 'Hur', 'kostar', 'mycket'],
        correct: ['Hur', 'mycket', 'kostar', 'det'],
        explanation: { zh: '固定高频表达是 Hur mycket kostar det?，可以直接记成一个整体。', en: 'Hur mycket kostar det? is a high-frequency phrase worth learning as one chunk.' },
      },
      {
        type: 'gap',
        npc: { zh: 'Hur vill du betala?', en: 'Hur vill du betala?' },
        prompt: { zh: '选择正确的介词。', en: 'Choose the correct preposition.' },
        sentence: 'Kan jag betala ____ kort?',
        options: ['med', 'på', 'från'],
        correct: 0,
        explanation: { zh: 'betala med kort 表示“用银行卡付款”。', en: 'Betala med kort means “pay by card”.' },
      },
    ],
  },
  {
    id: 'neighbor-chat',
    icon: Trees,
    theme: 'courtyard',
    title: { zh: '邻里寒暄', en: 'Meeting a Neighbour' },
    swedishTitle: 'PÅ GÅRDEN',
    description: { zh: '在院子里打招呼、谈天气，并自然地结束一段短对话。', en: 'Say hello in the courtyard, talk about the weather and end the chat naturally.' },
    level: 'A1',
    duration: 5,
    npc: { name: 'Lars', role: { zh: '邻居', en: 'Neighbour' }, skin: '#efc3a0', hair: '#b9a582', outfit: '#715b91' },
    crowd: [
      { skin: '#85533e', hair: '#242b35', outfit: '#4e866d' },
      { skin: '#d59a74', hair: '#743f32', outfit: '#d39b42' },
    ],
    questions: [
      {
        type: 'choice',
        npc: { zh: 'Hej! Hur är läget?', en: 'Hej! Hur är läget?' },
        prompt: { zh: '邻居问你最近怎么样。选择友好又自然的回答。', en: 'Your neighbour asks how things are. Choose a friendly, natural reply.' },
        options: [
          { text: 'Bra, tack! Hur är det själv?', meaning: { zh: '很好，谢谢！你呢？', en: 'Good, thanks! How about you?' } },
          { text: 'Jag är väder.', meaning: { zh: '我是天气。', en: 'I am weather.' } },
          { text: 'Nej, jag heter tisdag.', meaning: { zh: '不，我叫星期二。', en: 'No, my name is Tuesday.' } },
        ],
        correct: 0,
        explanation: { zh: 'Hur är det själv? 会把问题自然地抛回给对方，让聊天继续。', en: 'Hur är det själv? returns the question naturally and keeps the conversation going.' },
      },
      {
        type: 'order',
        npc: { zh: 'Vilket fint väder vi har!', en: 'Vilket fint väder vi har!' },
        prompt: { zh: '按正确顺序组装：今天天气很好。', en: 'Build the sentence: The weather is lovely today.' },
        tokens: ['väder', 'Det', 'i dag', 'fint', 'är'],
        correct: ['Det', 'är', 'fint', 'väder', 'i dag'],
        explanation: { zh: 'Det är fint väder 是谈论好天气的常用句型。', en: 'Det är fint väder is a common pattern for talking about pleasant weather.' },
      },
      {
        type: 'gap',
        npc: { zh: 'Vi ses snart igen!', en: 'Vi ses snart igen!' },
        prompt: { zh: '选择正确的时间词。', en: 'Choose the correct time word.' },
        sentence: 'Vi ses ____!',
        options: ['imorgon', 'bordet', 'billigt'],
        correct: 0,
        explanation: { zh: 'Vi ses imorgon! 就是“明天见！”，简短又自然。', en: 'Vi ses imorgon! means “See you tomorrow!” and is short and natural.' },
      },
    ],
  },
]

const englishQuestions: ScenarioQuestion[][] = [
  [
    { type: 'choice', npc: { zh: 'Good morning! What are you working on today?', en: 'Good morning! What are you working on today?' }, prompt: { zh: '选择最自然的晨会回答。', en: 'Choose the most natural stand-up reply.' }, options: [{ text: 'I am finishing the report this morning.', meaning: { zh: '我今天上午会完成报告。', en: 'I am finishing the report this morning.' } }, { text: 'I finish yesterday tomorrow.', meaning: { zh: '时态和时间词冲突。', en: 'The tense and time words conflict.' } }, { text: 'Report is coffee me.', meaning: { zh: '语序不正确。', en: 'The word order is incorrect.' } }], correct: 0, explanation: { zh: '现在进行时适合描述当前正在推进的工作。', en: 'The present continuous works naturally for current tasks.' } },
    { type: 'order', npc: { zh: 'Shall we start?', en: 'Shall we start?' }, prompt: { zh: '组装：我们现在可以开始会议吗？', en: 'Build: Can we start the meeting now?' }, tokens: ['meeting', 'Can', 'now', 'the', 'start', 'we'], correct: ['Can', 'we', 'start', 'the', 'meeting', 'now'], explanation: { zh: '一般疑问句以 Can 开头，随后是主语和动词。', en: 'A yes/no question begins with Can, followed by subject and verb.' } },
    { type: 'gap', npc: { zh: 'Do you need help with the slides?', en: 'Do you need help with the slides?' }, prompt: { zh: '选择最自然的限定词。', en: 'Choose the most natural determiner.' }, sentence: 'I need ____ help with the slides.', options: ['a little', 'many', 'an'], correct: 0, explanation: { zh: 'help 是不可数名词，这里使用 a little。', en: 'Help is uncountable here, so a little is the natural choice.' } },
  ],
  [
    { type: 'choice', npc: { zh: 'Would you like coffee or tea?', en: 'Would you like coffee or tea?' }, prompt: { zh: '选择自然又礼貌的回答。', en: 'Choose a natural, polite reply.' }, options: [{ text: 'I would love a coffee, please.', meaning: { zh: '我想要一杯咖啡，谢谢。', en: 'I would love a coffee, please.' } }, { text: 'Coffee is me on table.', meaning: { zh: '句子无法表达点单。', en: 'This does not express an order.' } }, { text: 'I drank tomorrow.', meaning: { zh: '时态不正确。', en: 'The tense is incorrect.' } }], correct: 0, explanation: { zh: 'Would love...please 是友好自然的点单方式。', en: 'Would love...please is a friendly, natural way to order.' } },
    { type: 'order', npc: { zh: 'How was your weekend?', en: 'How was your weekend?' }, prompt: { zh: '组装：你周末做了什么？', en: 'Build: What did you do at the weekend?' }, tokens: ['you', 'What', 'weekend', 'did', 'the', 'at', 'do'], correct: ['What', 'did', 'you', 'do', 'at', 'the', 'weekend'], explanation: { zh: '过去时疑问句使用 What + did + 主语 + 动词原形。', en: 'Past questions use What + did + subject + base verb.' } },
    { type: 'gap', npc: { zh: 'It was lovely to see you!', en: 'It was lovely to see you!' }, prompt: { zh: '选择最自然的词。', en: 'Choose the most natural word.' }, sentence: 'Let us have coffee ____ next week.', options: ['together', 'expensive', 'left'], correct: 0, explanation: { zh: 'together 表示“一起”，能自然完成邀请。', en: 'Together completes the invitation naturally.' } },
  ],
  [
    { type: 'choice', npc: { zh: 'Would you like a receipt?', en: 'Would you like a receipt?' }, prompt: { zh: '选择合适的结账回答。', en: 'Choose a suitable checkout reply.' }, options: [{ text: 'Yes, please. Thank you.', meaning: { zh: '好的，谢谢。', en: 'Yes, please. Thank you.' } }, { text: 'I am a receipt.', meaning: { zh: '我是一张小票。', en: 'I am a receipt.' } }, { text: 'No in Monday.', meaning: { zh: '介词使用错误。', en: 'The preposition is incorrect.' } }], correct: 0, explanation: { zh: 'Yes, please 是接受提议时简洁礼貌的表达。', en: 'Yes, please is a concise, polite way to accept an offer.' } },
    { type: 'order', npc: { zh: 'Let me know if you have a question.', en: 'Let me know if you have a question.' }, prompt: { zh: '组装：这个多少钱？', en: 'Build: How much does this cost?' }, tokens: ['this', 'How', 'cost', 'does', 'much'], correct: ['How', 'much', 'does', 'this', 'cost'], explanation: { zh: 'How much does this cost? 是询价的固定高频表达。', en: 'How much does this cost? is a useful high-frequency question.' } },
    { type: 'gap', npc: { zh: 'How would you like to pay?', en: 'How would you like to pay?' }, prompt: { zh: '选择正确的介词。', en: 'Choose the correct preposition.' }, sentence: 'Can I pay ____ card?', options: ['by', 'at', 'from'], correct: 0, explanation: { zh: '英语中说 pay by card。', en: 'The standard phrase is pay by card.' } },
  ],
  [
    { type: 'choice', npc: { zh: 'Hi! How are things?', en: 'Hi! How are things?' }, prompt: { zh: '选择友好自然的回答。', en: 'Choose a friendly, natural reply.' }, options: [{ text: 'Good, thanks! How about you?', meaning: { zh: '很好，谢谢！你呢？', en: 'Good, thanks! How about you?' } }, { text: 'I am weather.', meaning: { zh: '我是天气。', en: 'I am weather.' } }, { text: 'No, my name is Tuesday.', meaning: { zh: '不，我叫星期二。', en: 'No, my name is Tuesday.' } }], correct: 0, explanation: { zh: 'How about you? 能自然地把问题抛回给对方。', en: 'How about you? returns the question and keeps the chat moving.' } },
    { type: 'order', npc: { zh: 'Lovely weather today!', en: 'Lovely weather today!' }, prompt: { zh: '组装：今天天气很好。', en: 'Build: The weather is lovely today.' }, tokens: ['weather', 'The', 'today', 'lovely', 'is'], correct: ['The', 'weather', 'is', 'lovely', 'today'], explanation: { zh: '主语 The weather 后接 is 和形容词 lovely。', en: 'The subject The weather is followed by is and lovely.' } },
    { type: 'gap', npc: { zh: 'See you again soon!', en: 'See you again soon!' }, prompt: { zh: '选择正确的时间词。', en: 'Choose the correct time word.' }, sentence: 'See you ____!', options: ['tomorrow', 'table', 'cheap'], correct: 0, explanation: { zh: 'See you tomorrow! 是自然简短的告别。', en: 'See you tomorrow! is a short, natural goodbye.' } },
  ],
]

const englishScenarios: Scenario[] = swedishScenarios.map((scenario, index) => ({
  ...scenario,
  id: `en-${scenario.id}`,
  swedishTitle: ['MORNING STAND-UP', 'COFFEE WITH FRIENDS', 'AT THE CHECKOUT', 'MEETING A NEIGHBOUR'][index],
  questions: englishQuestions[index],
}))

const readProgress = (key: string): ScenarioProgress => {
  try { return JSON.parse(localStorage.getItem(key) || '{}') as ScenarioProgress } catch { return {} }
}

const speak = (text: string, locale: string) => {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = locale
  utterance.rate = 0.82
  speechSynthesis.speak(utterance)
}

let feedbackAudio: AudioContext | null = null
const playFeedback = (correct: boolean) => {
  try {
    const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    feedbackAudio ||= new AudioContextConstructor()
    const context = feedbackAudio
    if (context.state === 'suspended') void context.resume()
    const now = context.currentTime
    const frequencies = correct ? [523.25, 659.25, 783.99] : [220, 185]
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = now + index * .07
      oscillator.type = correct ? 'sine' : 'triangle'
      oscillator.frequency.setValueAtTime(frequency, start)
      gain.gain.setValueAtTime(.0001, start)
      gain.gain.exponentialRampToValueAtTime(.055, start + .012)
      gain.gain.exponentialRampToValueAtTime(.0001, start + .18)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + .2)
    })
  } catch {
    // Sound is optional when Web Audio is unavailable.
  }
}

function NpcCharacter({ person, primary = false }: { person: Scenario['npc'] | Scenario['crowd'][number]; primary?: boolean }) {
  return <div
    className={`scenario-person npc-person${primary ? ' primary' : ''}`}
    style={{ '--person-skin': person.skin, '--person-hair': person.hair, '--person-outfit': person.outfit } as React.CSSProperties}
    aria-hidden="true"
  >
    <i className="person-shadow" />
    <span className="person-body"><i /></span>
    <span className="person-neck" />
    <span className="person-head"><i className="person-hair" /><i className="person-eye left" /><i className="person-eye right" /><i className="person-mouth" /></span>
    <span className="person-arm left" /><span className="person-arm right" />
  </div>
}

function SceneWorld({ scenario, learner, speaking }: { scenario: Scenario; learner: React.ReactNode; speaking: boolean }) {
  const { language } = useLanguage()
  return <section className={`scenario-world world-${scenario.theme}${speaking ? ' is-speaking' : ''}`}>
    <div className="world-sky"><i /><i /></div>
    <div className="world-set">
      <span className="set-window" /><span className="set-board" /><span className="set-table" /><span className="set-plant" /><span className="set-counter" />
    </div>
    <div className="scene-crowd left"><NpcCharacter person={scenario.crowd[0]} /></div>
    <div className="scene-crowd right"><NpcCharacter person={scenario.crowd[1]} /></div>
    <div className="scene-npc">
      <div className="npc-name"><strong>{scenario.npc.name}</strong><span>{tx(language, scenario.npc.role)}</span></div>
      <NpcCharacter person={scenario.npc} primary />
    </div>
    <div className="scene-learner">{learner}<span>{language === 'zh' ? '你' : 'YOU'}</span></div>
  </section>
}

export default function ScenarioSimulation({ learningLanguage, learner, locked = false, onRequireAuth }: { learningLanguage: LearningLanguage; learner: React.ReactNode; locked?: boolean; onRequireAuth?: () => void }) {
  const { language, tr } = useLanguage()
  const target = learningLanguageConfig[learningLanguage]
  const scenarios = learningLanguage === 'sv' ? swedishScenarios : englishScenarios
  const progressKey = learningStorageKey(learningLanguage, 'hej-scenario-progress-v1')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [ordered, setOrdered] = useState<string[]>([])
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [missedCurrent, setMissedCurrent] = useState(false)
  const [score, setScore] = useState(0)
  const [progress, setProgress] = useState<ScenarioProgress>(() => locked ? {} : readProgress(progressKey))
  const active = useMemo(() => scenarios.find((item) => item.id === activeId) || null, [activeId])
  const question = active?.questions[step]
  const complete = Boolean(active && step >= active.questions.length)

  const openScenario = (scenario: Scenario) => {
    setActiveId(scenario.id)
    setStep(0)
    setSelected(null)
    setOrdered([])
    setIsCorrect(null)
    setMissedCurrent(false)
    setScore(0)
    window.scrollTo(0, 0)
  }

  const leaveScenario = () => {
    setActiveId(null)
    setStep(0)
    setSelected(null)
    setOrdered([])
    setIsCorrect(null)
    setMissedCurrent(false)
    window.scrollTo(0, 0)
  }

  const evaluate = () => {
    if (!question) return
    const correct = question.type === 'order'
      ? ordered.join(' ') === question.correct.join(' ')
      : selected === question.correct
    setIsCorrect(correct)
    if (correct && !missedCurrent) setScore((current) => current + 1)
    if (!correct) setMissedCurrent(true)
    playFeedback(correct)
  }

  const continueStory = () => {
    if (!active || !question) return
    if (!isCorrect) {
      setSelected(null)
      setOrdered([])
      setIsCorrect(null)
      return
    }
    const nextStep = step + 1
    if (nextStep >= active.questions.length) {
      const finalScore = score
      const next = {
        ...progress,
        [active.id]: {
          completed: true,
          best: Math.max(progress[active.id]?.best || 0, finalScore),
        },
      }
      setProgress(next)
      localStorage.setItem(progressKey, JSON.stringify(next))
    }
    setStep(nextStep)
    setSelected(null)
    setOrdered([])
    setIsCorrect(null)
    setMissedCurrent(false)
  }

  if (!active) {
    const completedCount = Object.values(progress).filter((item) => item.completed).length
    return <main className="main scenario-library">
      <header className="scenario-library-header">
        <div>
          <p className="section-kicker">VERKLIGA SITUATIONER · {tr('场景模拟', 'REAL-LIFE SCENARIOS')}</p>
          <h1>{tr(`把${target.nameZh}用在真正会遇到的时刻。`, `Use ${target.nameEn} in moments you will actually meet.`)}</h1>
          <p>{tr('进入一段短剧情，观察人物反应，用选择、排序和填空完成真实交流。', 'Step into a short story, read the room and move the conversation forward through choices, ordering and gap fills.')}</p>
        </div>
        <div className="scenario-overview">
          <span><strong>{completedCount}</strong> / {scenarios.length}</span>
          <small>{tr('场景已完成', 'scenarios complete')}</small>
        </div>
      </header>
      <section className="scenario-feature-strip">
        <div><MessageCircle size={18} /><span><strong>{tr('剧情式对话', 'Story dialogue')}</strong>{tr('每个回答都会得到人物反馈', 'Characters react to every answer')}</span></div>
        <div><Sparkles size={18} /><span><strong>{tr('三种题型', 'Three activity types')}</strong>{tr('选择、排序与情境填空', 'Choices, ordering and gap fills')}</span></div>
        <div className="mini-scene-cast"><NpcCharacter person={scenarios[0].crowd[0]} /><NpcCharacter person={scenarios[1].npc} primary /><NpcCharacter person={scenarios[2].crowd[1]} /></div>
      </section>
      <section className="scenario-grid">
        {scenarios.map((scenario, index) => {
          const Icon = scenario.icon
          const saved = progress[scenario.id]
          return <article key={scenario.id} className={`scenario-card scene-${scenario.theme}`}>
            <div className="scenario-card-art">
              <span className="scene-number">{String(index + 1).padStart(2, '0')}</span>
              <Icon size={24} />
              <div className="card-cast"><NpcCharacter person={scenario.npc} primary /><NpcCharacter person={scenario.crowd[0]} /></div>
            </div>
            <div className="scenario-card-copy">
              <div><span>{scenario.level}</span><span>{scenario.duration} {tr('分钟', 'min')}</span>{saved?.completed && <span className="scene-done"><Check size={12} />{tr('已完成', 'Complete')}</span>}</div>
              <p>{scenario.swedishTitle}</p>
              <h2>{tx(language, scenario.title)}</h2>
              <p>{tx(language, scenario.description)}</p>
              <footer><span>{scenario.npc.name} · {tx(language, scenario.npc.role)}</span><button onClick={() => locked ? onRequireAuth?.() : openScenario(scenario)}>{locked ? <><Lock size={15} />{tr('登录后进入', 'Log in to enter')}</> : <>{saved?.completed ? tr('再次进入', 'Play again') : tr('进入场景', 'Enter scene')}<ArrowRight size={16} /></>}</button></footer>
            </div>
          </article>
        })}
      </section>
    </main>
  }

  if (complete) {
    return <main className={`main scenario-complete complete-${active.theme}`}>
      <div className="scenario-complete-cast"><div>{learner}</div><NpcCharacter person={active.npc} primary /></div>
      <section>
        <span className="scenario-complete-mark"><Check size={30} /></span>
        <p className="section-kicker">SCENARIO KLART</p>
        <h1>{tr('这段对话，你接住了。', 'You carried the conversation.')}</h1>
        <p>{tr(`你完成了「${active.title.zh}」，现在可以把这些表达带进真实生活。`, `You completed “${active.title.en}”. These expressions are ready for real life.`)}</p>
        <div className="scenario-score"><strong>{score}/{active.questions.length}</strong><span>{tr('首次作答正确', 'correct on the first try')}</span></div>
        <div className="scenario-complete-actions">
          <button onClick={() => openScenario(active)}><RotateCcw size={17} />{tr('再来一次', 'Play again')}</button>
          <button onClick={leaveScenario}>{tr('返回场景大厅', 'Back to scenarios')}<ArrowRight size={17} /></button>
        </div>
      </section>
    </main>
  }

  if (!question) return null
  const orderedComplete = question.type === 'order' && ordered.length === question.tokens.length
  const canSubmit = question.type === 'order' ? orderedComplete : selected !== null
  const answerLine = question.type === 'choice' && selected !== null
    ? question.options[selected].text
    : question.type === 'gap' && selected !== null
      ? question.sentence.replace('____', question.options[selected])
      : question.type === 'order' && ordered.length
        ? ordered.join(' ')
        : ''

  return <main className="main scenario-session">
    <header className="scenario-session-header">
      <button onClick={leaveScenario} aria-label={tr('返回场景大厅', 'Back to scenarios')}><ArrowLeft size={19} /></button>
      <div><span>{active.swedishTitle}</span><strong>{tx(language, active.title)}</strong></div>
      <div className="scenario-step"><span>{step + 1} / {active.questions.length}</span><i><b style={{ width: `${(step + 1) / active.questions.length * 100}%` }} /></i></div>
    </header>
    <SceneWorld scenario={active} learner={learner} speaking={isCorrect !== null} />
    <section className={`scenario-dialogue-panel${isCorrect !== null ? isCorrect ? ' correct' : ' incorrect' : ''}`}>
      <div className="npc-dialogue">
        <div><strong>{active.npc.name}</strong><span>{tx(language, active.npc.role)}</span></div>
        <blockquote>{tx(language, question.npc)}</blockquote>
        <button onClick={() => speak(tx(language, question.npc), target.locale)} aria-label={tr('播放对话', 'Play dialogue')}><Volume2 size={18} /></button>
      </div>
      <div className="scenario-question">
        <div className="scenario-question-heading">
          <span>{question.type === 'choice' ? tr('对话选择', 'CHOOSE A REPLY') : question.type === 'order' ? tr('句子排序', 'BUILD THE SENTENCE') : tr('情境填空', 'FILL THE GAP')}</span>
          <h2>{tx(language, question.prompt)}</h2>
        </div>
        {isCorrect === null && question.type === 'choice' && <div className="scenario-choice-list">{question.options.map((option, index) =>
          <button key={option.text} className={selected === index ? 'active' : ''} onClick={() => setSelected(index)}><span>{String.fromCharCode(65 + index)}</span><strong>{option.text}</strong></button>,
        )}</div>}
        {isCorrect === null && question.type === 'gap' && <div className="scenario-gap-task">
          <p>{question.sentence.split('____')[0]}<strong>{selected === null ? '____' : question.options[selected]}</strong>{question.sentence.split('____')[1]}</p>
          <div>{question.options.map((option, index) => <button key={option} className={selected === index ? 'active' : ''} onClick={() => setSelected(index)}>{option}</button>)}</div>
        </div>}
        {isCorrect === null && question.type === 'order' && <div className="scenario-order-task">
          <div className="order-result">{ordered.length ? ordered.map((token, index) => <button key={`${token}-${index}`} onClick={() => setOrdered((current) => current.filter((_, itemIndex) => itemIndex !== index))}>{token}</button>) : <span>{tr('依次选择下方词块', 'Choose the word blocks in order')}</span>}</div>
          <div className="order-bank">{question.tokens.map((token) => <button key={token} disabled={ordered.includes(token)} onClick={() => setOrdered((current) => [...current, token])}>{token}</button>)}</div>
        </div>}
        {isCorrect !== null && <div className="scenario-feedback">
          <span>{isCorrect ? <Check size={21} /> : <X size={21} />}</span>
          <div><strong>{isCorrect ? tr(`${learningLanguage === 'sv' ? 'Bra!' : '很好！'} 人物听懂你了`, `${learningLanguage === 'sv' ? 'Bra!' : 'Great!'} They understood you`) : tr('这句话还需要调整', 'This needs one more try')}</strong><p>{tx(language, question.explanation)}</p>{answerLine && <blockquote>{answerLine}</blockquote>}</div>
        </div>}
        <footer>
          <span>{tr('得分', 'Score')} <strong>{score}</strong></span>
          {isCorrect === null
            ? <button disabled={!canSubmit} onClick={evaluate}>{tr('确认回答', 'Check answer')}<ArrowRight size={17} /></button>
            : <button onClick={continueStory}>{isCorrect ? step === active.questions.length - 1 ? tr('完成场景', 'Finish scenario') : tr('继续对话', 'Continue story') : tr('重新回答', 'Try again')}<ArrowRight size={17} /></button>}
        </footer>
      </div>
    </section>
  </main>
}
