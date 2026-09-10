const noveltyVoicePattern = /albert|bad news|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox/i

const preferredVoiceNames: Record<string, RegExp> = {
  en: /sonia|libby|ryan|daniel|serena|kate|oliver|stephanie|jamie|samantha|ava|allison|susan|zoe|alex|google uk english|microsoft.*natural/i,
  sv: /sofie|mattias|alva|klara|oskar|google svenska|microsoft.*natural/i,
}

const normaliseLocale = (locale: string) => locale.toLowerCase().replace('_', '-')

function voiceScore(voice: SpeechSynthesisVoice, locale: string) {
  const requested = normaliseLocale(locale)
  const language = requested.split('-')[0]
  const available = normaliseLocale(voice.lang)
  if (available.split('-')[0] !== language || noveltyVoicePattern.test(voice.name)) return -Infinity

  let score = available === requested ? 120 : 70
  if (preferredVoiceNames[language]?.test(voice.name)) score += 65
  if (/natural|neural|enhanced|premium/i.test(voice.name)) score += 45
  if (/google|microsoft|apple/i.test(voice.name)) score += 20
  if (voice.default) score += 6
  return score
}

function selectVoice(locale: string) {
  return window.speechSynthesis
    .getVoices()
    .map((voice) => ({ voice, score: voiceScore(voice, locale) }))
    .filter(({ score }) => Number.isFinite(score))
    .sort((a, b) => b.score - a.score)[0]?.voice
}

function sentenceRate(text: string) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  if (wordCount <= 3) return 0.88
  if (wordCount <= 7) return 0.94
  return 0.97
}

export function speakTargetLanguage(text: string, locale: string) {
  if (!text.trim() || !('speechSynthesis' in window)) return

  const synthesis = window.speechSynthesis
  synthesis.cancel()

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(text)
    const voice = selectVoice(locale)
    utterance.lang = voice?.lang || locale
    utterance.voice = voice || null
    utterance.rate = sentenceRate(text)
    utterance.pitch = 1
    utterance.volume = 1
    synthesis.speak(utterance)
  }

  // Chromium may expose voices a moment after the page becomes interactive.
  if (synthesis.getVoices().length > 0) {
    speak()
    return
  }

  let started = false
  const speakOnce = () => {
    if (started) return
    started = true
    speak()
  }
  const fallback = window.setTimeout(speakOnce, 350)
  synthesis.addEventListener('voiceschanged', () => {
    window.clearTimeout(fallback)
    speakOnce()
  }, { once: true })
}
