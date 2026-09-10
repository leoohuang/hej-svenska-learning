export type LearningLanguage = 'sv' | 'en'

export const learningLanguageConfig = {
  sv: { code: 'SV', nameZh: '瑞典语', nameEn: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', locale: 'sv-SE' },
  en: { code: 'EN', nameZh: '英语', nameEn: 'English', nativeName: 'English', flag: '🇬🇧', locale: 'en-GB' },
} satisfies Record<LearningLanguage, {
  code: string
  nameZh: string
  nameEn: string
  nativeName: string
  flag: string
  locale: string
}>

export function learningStorageKey(language: LearningLanguage, base: string) {
  return language === 'sv' ? base : `${base}:${language}`
}
