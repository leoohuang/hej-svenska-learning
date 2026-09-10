import { Globe2 } from 'lucide-react'
import type React from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { CoursePack, SwedishCourse, SwedishWord } from './swedish-data'

export type Language = 'zh' | 'en'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  tr: (chinese: string, english: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => localStorage.getItem('hej-language') === 'en' ? 'en' : 'zh')
  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    localStorage.setItem('hej-language', nextLanguage)
  }
  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])
  const value = useMemo(() => ({
    language,
    setLanguage,
    tr: (chinese: string, english: string) => language === 'zh' ? chinese : english,
  }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}

export function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage()
  return <div className={`language-switch${compact ? ' compact' : ''}`} aria-label={language === 'zh' ? '切换界面语言' : 'Switch interface language'}>
    <Globe2 size={compact ? 14 : 16} />
    <button className={language === 'zh' ? 'active' : ''} onClick={() => setLanguage('zh')}>中文</button>
    <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
  </div>
}

const packEnglish: Record<string, { title: string; description: string; category: string; tags: string[] }> = {
  'daily-starter': { title: 'Everyday Swedish Starter', description: 'Build your first practical Swedish toolkit through greetings, cafés, city travel and daily routines.', category: 'Beginner', tags: ['Absolute beginner', 'Daily conversation'] },
  'life-in-sweden': { title: 'Swedish for Life in Sweden', description: 'Handle the language you need most for housing, shopping, weather, health and social life in Sweden.', category: 'Daily life', tags: ['Life in Sweden', 'Practical scenes'] },
  'a1-core': { title: 'A1 Core Words & Phrases', description: 'Strengthen high-frequency vocabulary and reusable phrases through focused keyboard practice.', category: 'Vocabulary', tags: ['Core vocabulary', 'Phrase building'] },
  'pronunciation-lab': { title: 'Swedish Pronunciation Lab', description: 'Train å, ä, ö, vowel length and sentence rhythm through listening, repetition and typing.', category: 'Pronunciation', tags: ['Vowel practice', 'Rhythm'] },
  'swedish-at-work': { title: 'Swedish at Work', description: 'Learn the language of meetings, email, schedules and everyday communication with colleagues.', category: 'Work', tags: ['Meetings', 'Work email'] },
  'sfi-ready': { title: 'Get Ready for SFI', description: 'Practise introductions, classroom questions, schedules and daily information before starting SFI.', category: 'Exam prep', tags: ['SFI preparation', 'Classroom Swedish'] },
  'swedish-culture': { title: 'Understand Sweden through Fika', description: 'Explore everyday Swedish language through fika, seasons, family life and city culture.', category: 'Culture', tags: ['Culture', 'Fika'] },
  'family-swedish': { title: 'Swedish for Families', description: 'Learn together through short, repeatable activities about home, family, weather and daily life.', category: 'Family', tags: ['Learn together', 'Gentle start'] },
}

const courseEnglish: Record<string, { title: string; description: string }> = {
  'first-steps': { title: 'First Encounters', description: 'Greetings, goodbyes and essential polite expressions' },
  fika: { title: 'Fika Time', description: 'Order and chat naturally in a café' },
  city: { title: 'Getting Around the City', description: 'Ask for directions, use transport and find places' },
  'daily-life': { title: 'My Day', description: 'Describe work and everyday routines with simple sentences' },
  home: { title: 'My Home', description: 'Rooms, furniture and everyday expressions at home' },
  shopping: { title: 'Shopping', description: 'Prices, sizes and essential checkout language' },
  work: { title: 'Work and Study', description: 'High-frequency language for offices, school and online communication' },
  weather: { title: 'Weather and Seasons', description: 'The conversation starter Swedes use most often' },
  health: { title: 'Body and Health', description: 'Describe symptoms and ask for basic help' },
  people: { title: 'Family and Friends', description: 'Introduce people and talk about weekend plans' },
  time: { title: 'Talking about Time', description: 'Make plans and talk about the past and future' },
  'survival-phrases': { title: 'Survival Swedish', description: 'Eight complete sentences you can use immediately' },
}

const meaningEnglish: Record<string, string> = {
  hej: 'hello', tack: 'thank you', ja: 'yes / okay', nej: 'no', ursäkta: 'excuse me / sorry', hejdå: 'goodbye', välkommen: 'welcome', snälla: 'please',
  kaffe: 'coffee', kanelbulle: 'cinnamon bun', mjölk: 'milk', socker: 'sugar', gott: 'tasty', notan: 'the bill', te: 'tea', vatten: 'water',
  station: 'station', tunnelbana: 'metro', biljett: 'ticket', vänster: 'left', höger: 'right', nära: 'nearby / close', buss: 'bus', hållplats: 'stop / station',
  morgon: 'morning', jobbar: 'work / am working', äter: 'eat', promenerar: 'take a walk', hemma: 'at home', sover: 'sleep', vaknar: 'wake up', 'lagar mat': 'cook',
  lägenhet: 'apartment', rum: 'room', kök: 'kitchen', badrum: 'bathroom', sovrum: 'bedroom', fönster: 'window', dörr: 'door', nyckel: 'key',
  kostar: 'costs', billig: 'cheap', dyr: 'expensive', storlek: 'size', kvitto: 'receipt', kontant: 'cash', kort: 'card', öppet: 'open',
  möte: 'meeting', kollega: 'colleague', chef: 'manager / boss', mejl: 'email', dator: 'computer', rast: 'break', uppgift: 'task / assignment', fråga: 'question',
  soligt: 'sunny', regnar: 'is raining', snöar: 'is snowing', kallt: 'cold', varmt: 'warm / hot', vår: 'spring', sommar: 'summer', vinter: 'winter',
  läkare: 'doctor', apotek: 'pharmacy', ont: 'pain / sore', sjuk: 'ill', frisk: 'healthy / recovered', huvud: 'head', mage: 'stomach', medicin: 'medicine',
  familj: 'family', vän: 'friend', mamma: 'mother', pappa: 'father', barn: 'child / children', tillsammans: 'together', helg: 'weekend', fest: 'party',
  idag: 'today', imorgon: 'tomorrow', igår: 'yesterday', kväll: 'evening', vecka: 'week', månad: 'month', klockan: 'at ... o’clock', snart: 'soon',
  'Jag heter': 'My name is ...', 'Hur mår du?': 'How are you?', 'Jag förstår inte': 'I do not understand', 'Kan du hjälpa mig?': 'Can you help me?',
  'Vad betyder det?': 'What does that mean?', 'Kan du säga det igen?': 'Can you say that again?', 'Jag lär mig svenska': 'I am learning Swedish', 'Vi ses senare': 'See you later',
}

export function packCopy(pack: CoursePack, language: Language) {
  const english = packEnglish[pack.id]
  const embeddedEnglish = pack.titleEn && pack.descriptionEn
    ? { title: pack.titleEn, description: pack.descriptionEn, category: pack.categoryEn || pack.category, tags: pack.tagsEn || pack.tags }
    : undefined
  return language === 'en' && (embeddedEnglish || english)
    ? embeddedEnglish || english
    : { title: pack.title, description: pack.description, category: pack.category, tags: pack.tags }
}

export function courseCopy(course: SwedishCourse, language: Language) {
  const english = courseEnglish[course.id]
  const embeddedEnglish = course.titleEn && course.descriptionEn
    ? { title: course.titleEn, description: course.descriptionEn }
    : undefined
  return language === 'en' && (embeddedEnglish || english) ? embeddedEnglish || english : { title: course.title, description: course.description }
}

export function wordMeaning(word: SwedishWord, language: Language) {
  return language === 'en' ? word.english || meaningEnglish[word.swedish] || word.chinese : word.chinese
}
