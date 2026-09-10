import type { SwedishCourse, SwedishWord } from './swedish-data'
import { LanguageSwitch, courseCopy, useLanguage, wordMeaning } from './i18n'
import { learningLanguageConfig, type LearningLanguage } from './learning-language'
import { speakTargetLanguage } from './speech'
import KineticLoader from './KineticLoader'
import confetti from 'canvas-confetti'
import {
  ArrowLeft, ArrowRight, Brain, Check, ChevronLeft, ChevronRight, Ear, Eye, Gauge, Headphones,
  Keyboard, Languages, Lightbulb, Mic, Quote, RotateCcw, Sparkles, Star, Volume2, X, Zap,
} from 'lucide-react'
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent} from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { answerWords, grammarChunks, inputSlotRanges, inputSlots, MemoryJourney, SpeakingJourney } from './LearningJourney'
import { typingAnswersMatch, typingCharactersMatch, typingTargetFor } from './typing-comparison'

type Props = {
  learningLanguage: LearningLanguage
  course: SwedishCourse
  sessionId: string
  onExit: (elapsedSeconds?: number, studiedWords?: SwedishWord[]) => void
  onComplete: (correct: number, elapsedSeconds: number) => void
  onAddMistake: (word: SwedishWord) => void
  favorites: string[]
  onToggleFavorite: (word: string) => void
  companion?: React.ReactNode
}

type Mode = 'copy' | 'translation' | 'listening' | 'sentence'
type Difficulty = 'guided' | 'standard' | 'challenge'
type SoundProfile = 'clicky' | 'tactile' | 'soft'
type ErrorBehavior = 'retry-position' | 'restart-word'
type TrainingRoute = 'memory' | 'speaking' | 'free'

type PracticeSession = {
  version: 1
  sessionId: string
  courseLength: number
  currentWord: string
  index: number
  typed: string
  mistakeWords: string[]
  mistakeCount: number
  correctFirstTry: number
  correctChars: number
  mode: Mode
  difficulty: Difficulty
  errorBehavior?: ErrorBehavior
  soundProfile: SoundProfile
  elapsedSeconds: number
  recordedElapsedSeconds: number
  recordedWords: string[]
  completedWords: string[]
  wordErrorCounts: Record<string, number>
  rescuedWords: string[]
  reviewingWord: boolean
  savedAt: string
}

const practiceSessionKey = (sessionId: string) => `hej-practice-session:${sessionId}`
function readPracticeSession(sessionId: string, course: SwedishCourse) {
  try {
    const raw = localStorage.getItem(practiceSessionKey(sessionId))
    if (!raw) return null
    const session = JSON.parse(raw) as PracticeSession
    const valid = session.version === 1
      && session.sessionId === sessionId
      && session.courseLength === course.words.length
      && session.index >= 0
      && session.index < course.words.length
      && course.words[session.index]?.swedish === session.currentWord
      && typeof session.typed === 'string'
    if (valid) return session
    localStorage.removeItem(practiceSessionKey(sessionId))
  } catch {
    localStorage.removeItem(practiceSessionKey(sessionId))
  }
  return null
}

const modeOptions = [
  { id: 'copy' as Mode, icon: Eye, label: '看词跟打', short: '跟着瑞典语建立节奏' },
  { id: 'translation' as Mode, icon: Languages, label: '中文回译', short: '看中文写出瑞典语' },
  { id: 'listening' as Mode, icon: Ear, label: '听音辨词', short: '只凭发音完成拼写' },
  { id: 'sentence' as Mode, icon: Quote, label: '例句补词', short: '在真实语境中填词' },
]

const difficultyOptions = [
  { id: 'guided' as Difficulty, icon: Sparkles, label: '引导', short: '逐键提示' },
  { id: 'standard' as Difficulty, icon: Gauge, label: '标准', short: '即时纠错' },
  { id: 'challenge' as Difficulty, icon: Zap, label: '挑战', short: '隐藏辅助' },
]

const modeLabels: Record<Mode, string> = {
  copy: '看词跟打',
  translation: '中文回译',
  listening: '听音辨词',
  sentence: '例句补词',
}

const difficultyLabels: Record<Difficulty, string> = {
  guided: '引导',
  standard: '标准',
  challenge: '挑战',
}

const swedishKeyboardRows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'å'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ö', 'ä'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '?'],
]
const englishKeyboardRows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '?'],
]

const normalize = (value: string) => value.toLocaleLowerCase('sv')
export default function TypingTrainer({ learningLanguage, course, sessionId, onExit, onComplete, onAddMistake, favorites, onToggleFavorite, companion }: Props) {
  const { language, tr } = useLanguage()
  const targetLanguage = learningLanguageConfig[learningLanguage]
  const keyboardRows = learningLanguage === 'sv' ? swedishKeyboardRows : englishKeyboardRows
  const speak = useCallback((text: string) => speakWord(text, targetLanguage.locale), [targetLanguage.locale])
  const encouragement = learningLanguage === 'sv' ? 'Bra!' : 'Great!'
  const localizedCourse = courseCopy(course, language)
  const localizedModeOptions = modeOptions.filter((option) => !course.vocabularyOnly || option.id !== 'sentence').map((option) => ({
    ...option,
    label: tr(option.label, option.id === 'copy' ? `Copy ${targetLanguage.nameEn}` : option.id === 'translation' ? `Translate to ${targetLanguage.nameEn}` : option.id === 'listening' ? 'Listen and type' : 'Complete the sentence'),
    short: tr(option.short.replace('瑞典语', targetLanguage.nameZh), option.id === 'copy' ? `Build rhythm from visible ${targetLanguage.nameEn}` : option.id === 'translation' ? `Write ${targetLanguage.nameEn} from its meaning` : option.id === 'listening' ? 'Spell from sound only' : 'Fill the word in context'),
  }))
  const localizedDifficultyOptions = difficultyOptions.map((option) => ({
    ...option,
    label: tr(option.label, option.id === 'guided' ? 'Guided' : option.id === 'standard' ? 'Standard' : 'Challenge'),
    short: tr(option.short, option.id === 'guided' ? 'Next-key hints' : option.id === 'standard' ? 'Instant correction' : 'No visual help'),
  }))
  const localizedModeLabels: Record<Mode, string> = {
    copy: tr(modeLabels.copy, 'Copy'),
    translation: tr(modeLabels.translation, 'Translate'),
    listening: tr(modeLabels.listening, 'Listening'),
    sentence: tr(modeLabels.sentence, 'Sentence'),
  }
  const localizedDifficultyLabels: Record<Difficulty, string> = {
    guided: tr(difficultyLabels.guided, 'Guided'),
    standard: tr(difficultyLabels.standard, 'Standard'),
    challenge: tr(difficultyLabels.challenge, 'Challenge'),
  }
  const [index, setIndex] = useState(0)
  const [trainingRoute, setTrainingRoute] = useState<TrainingRoute>(() => {
    const saved = localStorage.getItem('hej-training-route')
    return saved === 'speaking' || saved === 'free' ? saved : 'memory'
  })
  const [launchedJourney, setLaunchedJourney] = useState<'memory' | 'speaking' | null>(null)
  const [typed, setTyped] = useState('')
  const [wrongKey, setWrongKey] = useState('')
  const [mistakeWords, setMistakeWords] = useState<string[]>([])
  const [mistakeCount, setMistakeCount] = useState(0)
  const [correctFirstTry, setCorrectFirstTry] = useState(0)
  const [correctChars, setCorrectChars] = useState(0)
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem('hej-practice-mode')
    if (course.vocabularyOnly && saved === 'sentence') return 'copy'
    return saved === 'translation' || saved === 'listening' || saved === 'sentence' ? saved : 'copy'
  })
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const saved = localStorage.getItem('hej-practice-difficulty')
    return saved === 'guided' || saved === 'challenge' ? saved : 'standard'
  })
  const [errorBehavior, setErrorBehavior] = useState<ErrorBehavior>(() =>
    localStorage.getItem('hej-error-behavior') === 'restart-word' ? 'restart-word' : 'retry-position',
  )
  const [ready, setReady] = useState(true)
  const [soundProfile, setSoundProfile] = useState<SoundProfile>(() => {
    const saved = localStorage.getItem('hej-key-sound')
    return saved === 'tactile' || saved === 'soft' ? saved : 'clicky'
  })
  const [reviewingWord, setReviewingWord] = useState(false)
  const [answerRescueOpen, setAnswerRescueOpen] = useState(false)
  const [showAnswerHint, setShowAnswerHint] = useState(false)
  const [answerChecked, setAnswerChecked] = useState(false)
  const [answerConfirmed, setAnswerConfirmed] = useState(false)
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [shortcutNotice, setShortcutNotice] = useState('')
  const [resumeSession, setResumeSession] = useState<PracticeSession | null>(() => readPracticeSession(sessionId, course))
  const [leavePromptOpen, setLeavePromptOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [prepareStage, setPrepareStage] = useState(0)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [resetPulse, setResetPulse] = useState(0)
  const [showKeyboard, setShowKeyboard] = useState(() => window.innerWidth <= 760)
  const captureRef = useRef<HTMLInputElement>(null)
  const resetTimerRef = useRef<number | null>(null)
  const typedRef = useRef('')
  const wrongLockedRef = useRef(false)
  const completedWordsRef = useRef<string[]>([])
  const pendingScoreRef = useRef(0)
  const captureKeyHandledRef = useRef(false)
  const captureKeyResetRef = useRef<number | null>(null)
  const answerTimerRef = useRef<number | null>(null)
  const noticeTimerRef = useRef<number | null>(null)
  const prepareTimersRef = useRef<number[]>([])
  const wordErrorCountsRef = useRef<Record<string, number>>({})
  const rescuedWordsRef = useRef<Set<string>>(new Set())
  const recordedElapsedRef = useRef(0)
  const recordedWordsRef = useRef<Set<string>>(new Set())
  const restoringSessionRef = useRef(false)

  const word = course.words[index]
  const target = word.swedish
  const typingTarget = typingTargetFor(target)
  const isWordComplete = answerConfirmed
  const currentExpected = typingTarget[typed.length] || ''
  const guidedHintsEnabled = difficulty === 'guided' && mode !== 'translation'
  const progress = ((index + (isWordComplete ? 1 : 0)) / course.words.length) * 100
  const wpm = elapsedSeconds > 0 ? Math.round((correctChars / 5) / (elapsedSeconds / 60)) : 0
  const accuracy = correctChars + mistakeCount > 0 ? Math.round(correctChars / (correctChars + mistakeCount) * 100) : 100

  useEffect(() => {
    if (!startedAt) return
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [startedAt])

  useEffect(() => {
    if (ready || reviewingWord) {
      if (reviewingWord) {
        restoringSessionRef.current = false
        captureRef.current?.blur()
      }
      return
    }
    captureRef.current?.focus({ preventScroll: true })
    if (restoringSessionRef.current) {
      restoringSessionRef.current = false
      return
    }
    typedRef.current = ''
    wrongLockedRef.current = false
    setTyped('')
    setWrongKey('')
    setAnswerChecked(false)
    setAnswerConfirmed(false)
    setActiveWordIndex(0)
  }, [index, mode, ready, reviewingWord])

  useEffect(() => {
    if (ready || mode === 'translation') return
    const timer = window.setTimeout(() => speak(target), 120)
    return () => window.clearTimeout(timer)
  }, [mode, ready, speak, target])

  useEffect(() => () => {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current)
    if (captureKeyResetRef.current) window.clearTimeout(captureKeyResetRef.current)
    if (answerTimerRef.current) window.clearTimeout(answerTimerRef.current)
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current)
    prepareTimersRef.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const sessionSnapshot = useCallback((seconds = elapsedSeconds): PracticeSession => ({
    version: 1,
    sessionId,
    courseLength: course.words.length,
    currentWord: target,
    index,
    typed: typedRef.current,
    mistakeWords,
    mistakeCount,
    correctFirstTry,
    correctChars,
    mode,
    difficulty,
    errorBehavior,
    soundProfile,
    elapsedSeconds: seconds,
    recordedElapsedSeconds: recordedElapsedRef.current,
    recordedWords: Array.from(recordedWordsRef.current),
    completedWords: completedWordsRef.current,
    wordErrorCounts: wordErrorCountsRef.current,
    rescuedWords: Array.from(rescuedWordsRef.current),
    reviewingWord,
    savedAt: new Date().toISOString(),
  }), [
    correctChars, correctFirstTry, course.words.length, difficulty, elapsedSeconds, errorBehavior, index, mistakeCount,
    mistakeWords, mode, reviewingWord, sessionId, soundProfile, target,
  ])

  const persistSession = useCallback((seconds = elapsedSeconds) => {
    localStorage.setItem(practiceSessionKey(sessionId), JSON.stringify(sessionSnapshot(seconds)))
  }, [elapsedSeconds, sessionId, sessionSnapshot])

  useEffect(() => {
    if (ready || done) return
    persistSession()
  }, [done, elapsedSeconds, index, mistakeCount, mistakeWords, persistSession, ready, reviewingWord, typed])

  useEffect(() => {
    if (ready || done) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      const seconds = startedAt ? Math.max(elapsedSeconds, Math.floor((Date.now() - startedAt) / 1000)) : elapsedSeconds
      persistSession(seconds)
      event.preventDefault()
      event.returnValue = ''
    }
    const saveOnPageHide = () => {
      const seconds = startedAt ? Math.max(elapsedSeconds, Math.floor((Date.now() - startedAt) / 1000)) : elapsedSeconds
      persistSession(seconds)
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    window.addEventListener('pagehide', saveOnPageHide)
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      window.removeEventListener('pagehide', saveOnPageHide)
    }
  }, [done, elapsedSeconds, persistSession, ready, startedAt])

  const finishWord = useCallback(() => {
    const passedFirstTry = !mistakeWords.includes(target)
    if (!completedWordsRef.current.includes(target)) completedWordsRef.current.push(target)
    playFeedback('complete', soundProfile)
    celebrateWord(course.accent)
    const nextScore = correctFirstTry + (passedFirstTry ? 1 : 0)
    pendingScoreRef.current = nextScore
    setCorrectFirstTry(nextScore)
    setReviewingWord(true)
  }, [correctFirstTry, course.accent, mistakeWords, soundProfile, target])

  const continueAfterReview = useCallback(() => {
    setReviewingWord(false)
    if (index === course.words.length - 1) {
      const seconds = startedAt ? Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) : 1
      localStorage.removeItem(practiceSessionKey(sessionId))
      setResumeSession(null)
      onComplete(pendingScoreRef.current, Math.max(1, seconds - recordedElapsedRef.current))
      setDone(true)
      return
    }
    setIndex((current) => current + 1)
  }, [course.words.length, index, onComplete, sessionId, startedAt])

  useEffect(() => {
    if (!isWordComplete || done || reviewingWord) return
    const timer = window.setTimeout(finishWord, 190)
    return () => window.clearTimeout(timer)
  }, [done, finishWord, isWordComplete, reviewingWord])

  const typeCharacter = useCallback((key: string) => {
    if (done || reviewingWord || answerRescueOpen || leavePromptOpen || wrongLockedRef.current || typedRef.current.length === typingTarget.length || key.length !== 1) return
    const expected = typingTarget[typedRef.current.length]
    if (!expected) return

    if (typingCharactersMatch(key, expected, learningLanguage)) {
      typedRef.current += expected
      setTyped(typedRef.current)
      setCorrectChars((count) => count + 1)
      playFeedback('key', soundProfile)
      return
    }

    playFeedback('wrong', soundProfile)
    navigator.vibrate?.(35)
    wrongLockedRef.current = true
    setWrongKey(key)
    setMistakeCount((count) => count + 1)
    setMistakeWords((items) => items.includes(target) ? items : [...items, target])
    setResetPulse((count) => count + 1)
    const nextWordErrors = (wordErrorCountsRef.current[target] || 0) + 1
    wordErrorCountsRef.current[target] = nextWordErrors
    if (nextWordErrors >= 3 && !rescuedWordsRef.current.has(target)) {
      rescuedWordsRef.current.add(target)
      onAddMistake(word)
      typedRef.current = ''
      setTyped('')
      setWrongKey('')
      setAnswerRescueOpen(true)
      captureRef.current?.blur()
      return
    }
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current)
    resetTimerRef.current = window.setTimeout(() => {
      if (errorBehavior === 'restart-word') typedRef.current = ''
      wrongLockedRef.current = false
      if (errorBehavior === 'restart-word') setTyped('')
      setWrongKey('')
      captureRef.current?.focus({ preventScroll: true })
    }, errorBehavior === 'retry-position' ? 220 : 320)
  }, [answerRescueOpen, done, errorBehavior, learningLanguage, leavePromptOpen, onAddMistake, reviewingWord, soundProfile, target, typingTarget, word])

  const closeAnswerRescue = () => {
    setAnswerRescueOpen(false)
    typedRef.current = ''
    wrongLockedRef.current = false
    setTyped('')
    setWrongKey('')
    window.setTimeout(() => captureRef.current?.focus({ preventScroll: true }), 30)
  }

  const selectWord = useCallback((wordIndex: number) => {
    const ranges = inputSlotRanges(typedRef.current)
    const range = ranges[wordIndex]
    const fallback = typedRef.current.length
    captureRef.current?.focus({ preventScroll: true })
    const caret = range?.end ?? fallback
    captureRef.current?.setSelectionRange(caret, caret)
    setActiveWordIndex(wordIndex)
  }, [])

  const checkWholeSentence = useCallback(() => {
    if (!typedRef.current.trim() || answerConfirmed) return
    if (typingAnswersMatch(typedRef.current, typingTarget, learningLanguage)) {
      setAnswerChecked(true)
      setAnswerConfirmed(true)
      setCorrectChars((count) => count + typingTarget.length)
      return
    }
    setAnswerChecked(true)
    setMistakeCount((count) => count + 1)
    setMistakeWords((items) => items.includes(target) ? items : [...items, target])
    wordErrorCountsRef.current[target] = (wordErrorCountsRef.current[target] || 0) + 1
    if (wordErrorCountsRef.current[target] === 1) onAddMistake(word)
    playFeedback('wrong', soundProfile)
    const enteredParts = inputSlots(typedRef.current)
    const expectedParts = answerWords(typingTarget)
    const mismatch = Array.from({ length: Math.max(enteredParts.length, expectedParts.length) }, (_, index) => index)
      .find((index) => !typingAnswersMatch(enteredParts[index] || '', expectedParts[index] || '', learningLanguage)) ?? 0
    window.setTimeout(() => selectWord(mismatch), 0)
  }, [answerConfirmed, learningLanguage, onAddMistake, selectWord, soundProfile, target, typingTarget, word])

  const handleKey = useCallback((key: string) => {
    if (key === 'Enter') {
      checkWholeSentence()
      return
    }
    if (key === 'Backspace') {
      if (answerConfirmed) return
      typedRef.current = typedRef.current.slice(0, -1)
      setTyped(typedRef.current)
      setAnswerChecked(false)
      return
    }
    if (answerConfirmed || key.length !== 1) return
    typedRef.current += key
    setTyped(typedRef.current)
    setAnswerChecked(false)
    playFeedback('key', soundProfile)
  }, [answerConfirmed, checkWholeSentence, soundProfile])

  const showNotice = useCallback((message: string) => {
    setShortcutNotice(message)
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current)
    noticeTimerRef.current = window.setTimeout(() => setShortcutNotice(''), 1100)
  }, [])

  const revealAnswer = useCallback(() => {
    setShowAnswerHint(true)
    showNotice(tr('答案已短暂显示', 'Answer shown briefly'))
    if (answerTimerRef.current) window.clearTimeout(answerTimerRef.current)
    answerTimerRef.current = window.setTimeout(() => setShowAnswerHint(false), 1600)
  }, [showNotice, tr])

  const toggleCurrentFavorite = useCallback(() => {
    onToggleFavorite(target)
    showNotice(favorites.includes(target) ? tr('已取消收藏', 'Removed from favourites') : tr('已收藏到词书', 'Saved to wordbook'))
  }, [favorites, onToggleFavorite, showNotice, target, tr])

  useEffect(() => {
    if (launchedJourney) return
    const onWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (leavePromptOpen) {
        if (event.key === 'Escape') {
          event.preventDefault()
          setLeavePromptOpen(false)
        }
        return
      }
      if (answerRescueOpen) {
        if (event.key === 'Enter' || event.key === 'Escape') {
          event.preventDefault()
          closeAnswerRescue()
        }
        return
      }
      if (!ready && !done && !reviewingWord && (event.metaKey || event.ctrlKey)) {
        const command = event.key.toLocaleLowerCase()
        if (command === 'p') {
          event.preventDefault()
          if (mode === 'translation') {
            showNotice(tr('中文回译不提供语音提示', 'Audio hints are disabled in translation mode'))
          } else {
            speak(target)
            showNotice(tr('正在播放发音', 'Playing pronunciation'))
          }
          return
        }
        if (command === 'a') {
          event.preventDefault()
          showNotice(tr('整句提交前不显示答案', 'The answer stays hidden until you submit the sentence'))
          return
        }
        if (command === 'u') {
          event.preventDefault()
          toggleCurrentFavorite()
          return
        }
      }
      if (reviewingWord) {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          continueAfterReview()
        }
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey || event.target === captureRef.current) return
      if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Enter') {
        event.preventDefault()
        handleKey(event.key)
      }
    }
    window.addEventListener('keydown', onWindowKeyDown)
    return () => window.removeEventListener('keydown', onWindowKeyDown)
  }, [answerRescueOpen, continueAfterReview, done, handleKey, launchedJourney, leavePromptOpen, mode, ready, revealAnswer, reviewingWord, showNotice, speak, target, toggleCurrentFavorite, tr])

  const handleCaptureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    if (reviewingWord || answerRescueOpen || leavePromptOpen) {
      return
    }
    if (value.length > typedRef.current.length) playFeedback('key', soundProfile)
    const expected = answerWords(typingTarget)
    const manuallyAdvanced = value.length > typedRef.current.length
      && /\s$/.test(value)
      && !/\s$/.test(typedRef.current)
    typedRef.current = value
    setTyped(value)
    if (manuallyAdvanced && activeWordIndex < expected.length - 1) {
      setActiveWordIndex(activeWordIndex + 1)
    }
    setAnswerChecked(false)
  }

  const handleCaptureKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (answerRescueOpen || leavePromptOpen) {
      event.preventDefault()
      return
    }
    if (reviewingWord && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault()
      continueAfterReview()
      return
    }
    if (event.key === ' ') {
      const range = inputSlotRanges(typedRef.current)[activeWordIndex]
      if (range && /\s/.test(typedRef.current[range.end] || '') && activeWordIndex < displayWordCount - 1) {
        event.preventDefault()
        selectWord(activeWordIndex + 1)
        return
      }
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      const nextIndex = Math.max(0, Math.min(displayWordCount - 1, activeWordIndex + direction))
      selectWord(nextIndex)
      return
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      const range = inputSlotRanges(typedRef.current)[activeWordIndex]
      const caret = event.currentTarget.selectionStart || 0
      if (range && ((event.key === 'Backspace' && caret <= range.start) || (event.key === 'Delete' && caret >= range.end))) {
        event.preventDefault()
        return
      }
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      handleKey(event.key)
    }
  }

  const letters = useMemo(() => Array.from(typingTarget), [typingTarget])
  const expectedWords = answerWords(typingTarget)
  const enteredWords = inputSlots(typed)
  const displayWordCount = Math.max(expectedWords.length, enteredWords.length)
  const moveToWord = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= course.words.length) return
    setIndex(nextIndex)
  }
  const completedCourse = () => onExit()
  const requestLeave = () => {
    persistSession(startedAt ? Math.max(elapsedSeconds, Math.floor((Date.now() - startedAt) / 1000)) : elapsedSeconds)
    setLeavePromptOpen(true)
    captureRef.current?.blur()
  }
  const leaveEarly = () => {
    const seconds = startedAt ? Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) : elapsedSeconds
    const completedNames = new Set([
      ...completedWordsRef.current,
      ...(typed.length === typingTarget.length ? [target] : []),
    ])
    const newlyStudied = course.words.filter((item) => completedNames.has(item.swedish) && !recordedWordsRef.current.has(item.swedish))
    const elapsedToRecord = Math.max(0, seconds - recordedElapsedRef.current)
    newlyStudied.forEach((item) => recordedWordsRef.current.add(item.swedish))
    recordedElapsedRef.current = seconds
    persistSession(seconds)
    setLeavePromptOpen(false)
    onExit(
      elapsedToRecord,
      newlyStudied,
    )
  }
  const selectSound = (profile: SoundProfile) => {
    setSoundProfile(profile)
    localStorage.setItem('hej-key-sound', profile)
    playFeedback('key', profile)
  }
  const selectTrainingRoute = (nextRoute: TrainingRoute) => {
    setTrainingRoute(nextRoute)
    localStorage.setItem('hej-training-route', nextRoute)
  }
  const selectMode = (nextMode: Mode) => {
    setMode(nextMode)
    localStorage.setItem('hej-practice-mode', nextMode)
  }
  const selectDifficulty = (nextDifficulty: Difficulty) => {
    setDifficulty(nextDifficulty)
    localStorage.setItem('hej-practice-difficulty', nextDifficulty)
  }
  const selectErrorBehavior = (nextBehavior: ErrorBehavior) => {
    setErrorBehavior(nextBehavior)
    localStorage.setItem('hej-error-behavior', nextBehavior)
  }
  const prepareTraining = (launch: () => void) => {
    setPrepareStage(0)
    setPreparing(true)
    prepareTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    prepareTimersRef.current = [
      window.setTimeout(() => setPrepareStage(1), 900),
      window.setTimeout(() => setPrepareStage(2), 1800),
      window.setTimeout(() => {
        launch()
        setPreparing(false)
      }, 2850),
    ]
  }
  const beginTraining = () => {
    if (trainingRoute === 'memory' || trainingRoute === 'speaking') {
      setLaunchedJourney(trainingRoute)
      return
    }
    prepareTraining(() => {
        localStorage.removeItem(practiceSessionKey(sessionId))
        setResumeSession(null)
        recordedElapsedRef.current = 0
        recordedWordsRef.current = new Set()
        completedWordsRef.current = []
        wordErrorCountsRef.current = {}
        rescuedWordsRef.current = new Set()
        if (difficulty === 'guided') setShowKeyboard(true)
        if (difficulty === 'challenge') setShowKeyboard(false)
        setStartedAt(Date.now())
        setReady(false)
    })
  }
  const continueSavedSession = () => {
    if (!resumeSession) return
    setMode(resumeSession.mode)
    setDifficulty(resumeSession.difficulty)
    setErrorBehavior(resumeSession.errorBehavior || 'retry-position')
    setSoundProfile(resumeSession.soundProfile)
    const saved = resumeSession
    prepareTraining(() => {
      restoringSessionRef.current = true
      setIndex(saved.index)
      typedRef.current = saved.typed
      setTyped(saved.typed)
      setMistakeWords(saved.mistakeWords)
      setMistakeCount(saved.mistakeCount)
      setCorrectFirstTry(saved.correctFirstTry)
      pendingScoreRef.current = saved.correctFirstTry
      setCorrectChars(saved.correctChars)
      setElapsedSeconds(saved.elapsedSeconds)
      recordedElapsedRef.current = saved.recordedElapsedSeconds
      recordedWordsRef.current = new Set(saved.recordedWords)
      completedWordsRef.current = saved.completedWords
      wordErrorCountsRef.current = saved.wordErrorCounts
      rescuedWordsRef.current = new Set(saved.rescuedWords)
      setReviewingWord(saved.reviewingWord)
      setStartedAt(Date.now() - saved.elapsedSeconds * 1000)
      setResumeSession(null)
      setReady(false)
    })
  }
  const restartSavedSession = () => {
    localStorage.removeItem(practiceSessionKey(sessionId))
    setResumeSession(null)
  }
  const leavePrompt = leavePromptOpen ? <div className="practice-session-backdrop" role="dialog" aria-modal="true" aria-labelledby="leave-session-title">
    <section className="practice-session-modal leave-session-modal">
      <span className="practice-session-icon"><ArrowLeft size={24} /></span>
      <p className="section-kicker">PAUSA · {tr('暂时离开', 'PAUSE PRACTICE')}</p>
      <h2 id="leave-session-title">{tr('要暂停这次训练吗？', 'Pause this practice?')}</h2>
      <p>{tr(`当前位置会自动保存。下次进入「${course.title}」时，可以从第 ${index + 1} 题继续。`, `Your position will be saved. The next time you open “${localizedCourse.title}”, you can continue from item ${index + 1}.`)}</p>
      <div className="practice-session-summary"><span>{index + 1} / {course.words.length}</span><strong>{target}</strong><small>{formatTime(elapsedSeconds)}</small></div>
      <div className="practice-session-actions">
        <button onClick={leaveEarly}><ArrowLeft size={17} />{tr('保存并离开', 'Save and leave')}</button>
        <button onClick={() => { setLeavePromptOpen(false); captureRef.current?.focus({ preventScroll: true }) }}>{tr('继续学习', 'Keep learning')}<Keyboard size={17} /></button>
      </div>
    </section>
  </div> : null

  if (launchedJourney === 'memory') {
    return <MemoryJourney
      learningLanguage={learningLanguage}
      course={course}
      sessionId={sessionId}
      onExit={onExit}
      onComplete={onComplete}
      companion={companion}
    />
  }

  if (launchedJourney === 'speaking') {
    return <SpeakingJourney
      learningLanguage={learningLanguage}
      course={course}
      sessionId={sessionId}
      onExit={onExit}
      onComplete={onComplete}
      companion={companion}
    />
  }

  if (preparing) {
    const preparationSteps = [
      [tr('正在读取本课词句', 'Loading this lesson’s words'), tr(`已找到 ${course.words.length} 个训练项目`, `${course.words.length} practice items found`)],
      learningLanguage === 'sv'
        ? [tr('正在校准键盘与特殊字母', 'Calibrating your keyboard and Swedish letters'), tr('å / ä 可用 a，ö 可用 o；原字母也能直接输入', 'a can replace å / ä, and o can replace ö; original letters still work')]
        : [tr('正在校准英语键盘布局', 'Calibrating your English keyboard'), tr('已准备常用标点与连续输入', 'Preparing punctuation and continuous input')],
      [tr('正在准备发音和机械键盘音色', 'Preparing pronunciation and keyboard sound'), tr(`${localizedModeLabels[mode]} · ${localizedDifficultyLabels[difficulty]}`, `${localizedModeLabels[mode]} · ${localizedDifficultyLabels[difficulty]}`)],
    ]
    return <main className="main typing-preparing-page" style={{ '--accent': course.accent, '--loader-accent': '#3b746f' } as React.CSSProperties}>
      <KineticLoader
        eyebrow={`${learningLanguage === 'sv' ? 'TRÄNING' : 'TRAINING'} · ${tr('正在进入训练', 'PREPARING PRACTICE')}`}
        title={tr(`让手指和${targetLanguage.nameZh}进入同一个节奏`, `Bringing your fingers and ${targetLanguage.nameEn} into rhythm`)}
        description={tr(`正在准备「${localizedCourse.title}」的输入环境。`, `Preparing the typing environment for “${localizedCourse.title}”.`)}
        progress={[24, 61, 89][prepareStage]}
        activity={preparationSteps[prepareStage][0]}
        detail={preparationSteps[prepareStage][1]}
        meta={[localizedModeLabels[mode], localizedDifficultyLabels[difficulty], `${course.words.length} ${tr('个词句', 'items')}`]}
      />
    </main>
  }

  if (ready) {
    return (
      <main className="main typing-intro-page">
        <header className="typing-intro-header">
          <button className="icon-button" onClick={() => onExit()} aria-label={tr('返回主页', 'Back home')}><ArrowLeft size={20} /></button>
          <span>{learningLanguage === 'sv' ? 'TRÄNING' : 'TRAINING'} · {tr('训练准备', 'SETUP')}</span>
          <LanguageSwitch compact />
        </header>
        <section className="typing-intro-panel" style={{ '--accent': course.accent } as React.CSSProperties}>
          <div className="intro-course">
            <p className="course-eyebrow">{course.eyebrow}</p>
            <h1>{localizedCourse.title}</h1>
            <p>{localizedCourse.description}</p>
            <div className="intro-course-meta"><span><strong>{course.words.length}</strong> {tr('个词句', 'items')}</span><span><strong>{course.level}</strong> {tr('难度', 'level')}</span></div>
            <div className="key-art" aria-hidden="true">{(learningLanguage === 'sv' ? ['Å', 'Ä', 'Ö'] : ['A', 'B', 'C']).map((key) => <span key={key}>{key}</span>)}</div>
          </div>
          <div className="intro-settings">
            <div>
              <span className="intro-label">{tr('选择学习路线', 'Choose a learning route')}</span>
              <div className="training-route-grid">
                <button className={trainingRoute === 'memory' ? 'active' : ''} onClick={() => selectTrainingRoute('memory')}>
                  <span className="route-icon"><Brain size={20} /></span>
                  <span><strong>{tr('记忆路径', 'Memory path')}</strong><small>{tr('理解、跟打、回忆、听辨与延迟抽查', 'Understand, type, recall, listen and retrieve later')}</small></span>
                  <i>{tr('推荐', 'Recommended')}</i>
                </button>
                <button className={trainingRoute === 'speaking' ? 'active' : ''} onClick={() => selectTrainingRoute('speaking')}>
                  <span className="route-icon"><Mic size={20} /></span>
                  <span><strong>{tr('开口训练', 'Speaking practice')}</strong><small>{tr('跟读、录音、回听，再从中文主动说出', 'Shadow, record, listen back and speak from meaning')}</small></span>
                </button>
                <button className={trainingRoute === 'free' ? 'active' : ''} onClick={() => selectTrainingRoute('free')}>
                  <span className="route-icon"><Keyboard size={20} /></span>
                  <span><strong>{tr('自由练习', 'Free practice')}</strong><small>{tr('保留四种练习模式，统一使用整句输入', 'Keep all four modes with whole-sentence entry')}</small></span>
                </button>
              </div>
            </div>
            {trainingRoute === 'memory' && <div className="route-preview memory-route-preview">
              <span><i>1</i>{tr('理解', 'Understand')}</span><b>→</b><span><i>2</i>{tr('跟打', 'Copy')}</span><b>→</b><span><i>3</i>{tr('回忆', 'Recall')}</span><b>→</b><span><i>4</i>{tr('听辨', 'Listen')}</span><b>→</b><span><i>5</i>{tr('抽查', 'Check')}</span>
            </div>}
            {trainingRoute === 'speaking' && <div className="route-preview speaking-route-preview">
              <span><i><Volume2 size={12} /></i>{tr('听原音', 'Listen')}</span><b>→</b><span><i><Mic size={12} /></i>{tr('录音模仿', 'Shadow')}</span><b>→</b><span><i><Brain size={12} /></i>{tr('中文开口', 'Recall aloud')}</span>
            </div>}
            {trainingRoute === 'free' && <div>
              <span className="intro-label">{tr('训练模式', 'Practice mode')}</span>
              <div className="practice-mode-grid">{localizedModeOptions.map(({ id, icon: Icon, label, short }) =>
                <button key={id} className={mode === id ? 'active' : ''} onClick={() => selectMode(id)}><Icon size={19} /><span><strong>{label}</strong><small>{short}</small></span><i /></button>,
              )}</div>
            </div>}
            {trainingRoute === 'free' && <div className="whole-sentence-method">
              <span className="error-behavior-icon"><Check size={17} /></span>
              <span><strong>{tr('整句写完，再统一检查', 'Finish first, then check')}</strong><small>{tr('输入过程中不提示对错；提交后按单词标出需要修改的部分。', 'No interruptions while typing. Word-level feedback appears after submission.')}</small></span>
            </div>}
            {trainingRoute === 'free' && <div>
              <span className="intro-label">{tr('机械键盘音色', 'Mechanical keyboard sound')}</span>
              <div className="sound-profile-grid">
                <button className={soundProfile === 'clicky' ? 'active' : ''} onClick={() => selectSound('clicky')}><span className="sound-bars"><i /><i /><i /></span><strong>{tr('青轴', 'Clicky')}</strong><small>{tr('清脆', 'Crisp')}</small></button>
                <button className={soundProfile === 'tactile' ? 'active' : ''} onClick={() => selectSound('tactile')}><span className="sound-bars tactile"><i /><i /><i /></span><strong>{tr('茶轴', 'Tactile')}</strong><small>{tr('厚实', 'Deep')}</small></button>
                <button className={soundProfile === 'soft' ? 'active' : ''} onClick={() => selectSound('soft')}><span className="sound-bars soft"><i /><i /><i /></span><strong>{tr('静音', 'Soft')}</strong><small>{tr('轻柔', 'Quiet')}</small></button>
              </div>
            </div>}
            <button className="intro-start-button" onClick={beginTraining}>
              {trainingRoute === 'memory' ? <Brain size={19} /> : trainingRoute === 'speaking' ? <Mic size={19} /> : <Keyboard size={19} />}
              {trainingRoute === 'memory' ? tr('开始记忆路径', 'Start memory path') : trainingRoute === 'speaking' ? tr('开始开口训练', 'Start speaking') : tr('开始自由练习', 'Start free practice')}
              <ArrowRight size={19} />
            </button>
          </div>
        </section>
        {resumeSession && <div className="practice-session-backdrop" role="dialog" aria-modal="true" aria-labelledby="resume-session-title">
          <section className="practice-session-modal resume-session-modal">
            <span className="practice-session-icon"><RotateCcw size={24} /></span>
            <p className="section-kicker">{learningLanguage === 'sv' ? 'FORTSÄTT' : 'RESUME'} · {tr('继续学习', 'RESUME PRACTICE')}</p>
            <h2 id="resume-session-title">{tr('上次练习还没有结束', 'Your last practice is waiting')}</h2>
            <p>{tr(`你停在第 ${resumeSession.index + 1}/${course.words.length} 题「${resumeSession.currentWord}」，可以从刚才的位置继续。`, `You stopped at item ${resumeSession.index + 1}/${course.words.length}, “${resumeSession.currentWord}”. Continue exactly where you left off.`)}</p>
            <div className="resume-session-progress"><i style={{ width: `${(resumeSession.index / course.words.length) * 100}%`, background: course.accent }} /><span>{formatTime(resumeSession.elapsedSeconds)} · {tr(new Date(resumeSession.savedAt).toLocaleString('zh-CN'), new Date(resumeSession.savedAt).toLocaleString('en-GB'))}</span></div>
            <div className="practice-session-actions">
              <button onClick={restartSavedSession}><RotateCcw size={17} />{tr('重新开始', 'Start over')}</button>
              <button onClick={continueSavedSession}>{tr('继续上次训练', 'Resume practice')}<ArrowRight size={17} /></button>
            </div>
          </section>
        </div>}
      </main>
    )
  }

  if (reviewingWord) {
    const memoryTags = [
      language === 'zh' ? word.note || '本课核心表达' : 'Core lesson expression',
      target.includes(' ') ? tr('常用短语', 'Common phrase') : tr('核心词汇', 'Core word'),
      tr('整句输入完成', 'Whole sentence completed'),
    ]
    const isLastWord = index === course.words.length - 1
    return (
      <main className="main typing-page word-memory-page">
        <header className="typing-header">
          <button className="icon-button" onClick={requestLeave} aria-label={tr('返回主页', 'Back home')}><ArrowLeft size={20} /></button>
          <div className="practice-title"><span>{learningLanguage === 'sv' ? 'MINNESPAUS' : 'MEMORY PAUSE'} · {tr('记忆停靠', 'MEMORY PAUSE')}</span><strong>{localizedCourse.title}</strong></div>
          <div className="typing-header-actions">
            <div className="active-practice-config"><span>{localizedModeLabels[mode]}</span><i />{tr('整句检查', 'Whole-sentence check')}</div>
            <LanguageSwitch compact />
          </div>
          <div className="lesson-count">{index + 1}<span> / {course.words.length}</span></div>
        </header>
        <div className="progress-track"><i style={{ width: `${progress}%`, background: course.accent }} /></div>
        <section className="memory-stage" style={{ '--accent': course.accent } as React.CSSProperties}>
          <div className="memory-success"><span><Check size={18} /></span><p><strong>{encouragement}</strong> {tr('这个词已经通过键盘进入你的短期记忆。', 'Typing has moved this word into your short-term memory.')}</p></div>
          <div className="sentence-breakdown free-sentence-breakdown">
            <div className="sentence-breakdown-heading">
              <span>{tr('整句输入正确', 'FULL SENTENCE CORRECT')}</span>
              <h2>{wordMeaning(word, language)}</h2>
              <p>{tr('按表达块记住整句话，而不是回忆字符位置。', 'Remember the sentence in chunks, not by character position.')}</p>
            </div>
            <div className="sentence-chunk-row">
              {grammarChunks(typingTarget, learningLanguage).map((chunk, chunkIndex) => <div key={`${chunk.words.join('-')}-${chunkIndex}`}>
                <span>{tr(chunk.zh, chunk.en)}</span>
                <strong>{chunk.words.join(' ')}</strong>
                <i />
              </div>)}
            </div>
            <div className="sentence-breakdown-note">
              <Lightbulb size={18} />
              <div><strong>{tr('使用与记忆提示', 'USAGE AND MEMORY NOTE')}</strong><p>{word.note || (course.vocabularyOnly ? wordMeaning(word, language) : language === 'zh' ? word.exampleChinese : word.example)}</p></div>
            </div>
            <button className="breakdown-listen" onClick={() => speak(target)}><Volume2 size={17} />{tr('听整句语气', 'Hear the full sentence')}</button>
            <div className="memory-tags">{memoryTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
          <footer className="memory-footer">
            <div><span>{tr('本课记忆进度', 'Lesson memory progress')}</span><strong>{index + 1} / {course.words.length}</strong></div>
            <button onClick={continueAfterReview}>{isLastWord ? tr('查看本课结果', 'View lesson results') : tr('记住了，继续', 'Got it, continue')}<ArrowRight size={18} /></button>
          </footer>
          {companion && <aside className="memory-companion">{companion}<span>{encouragement} {tr('再读一遍就继续。', 'Read it once more, then continue.')}</span></aside>}
        </section>
        {leavePrompt}
      </main>
    )
  }

  if (done) {
    const firstTryRate = Math.round((correctFirstTry / course.words.length) * 100)
    return (
      <main className="main result-page">
        <div className="result-language"><LanguageSwitch compact /></div>
        <div className="result-panel">
          <span className="result-mark"><Check size={38} /></span>
          <p className="course-eyebrow">{learningLanguage === 'sv' ? 'LEKTION KLAR' : 'LESSON COMPLETE'} · {tr('键盘训练完成', 'PRACTICE COMPLETE')}</p>
          <h1>{learningLanguage === 'sv' ? 'Bra jobbat!' : 'Well done!'}</h1>
          <p>{tr(`你完成了「${course.title}」的整句输入训练。`, `You completed the whole-sentence practice for “${localizedCourse.title}”.`)}</p>
          <div className="score-row">
            <div><strong>{firstTryRate}%</strong><span>{tr('首次正确率', 'First-try accuracy')}</span></div>
            <div><strong>{course.words.length}</strong><span>{tr('完成句子', 'Sentences completed')}</span></div>
            <div><strong>{mistakeCount}</strong><span>{tr('整句修改次数', 'Sentence revisions')}</span></div>
          </div>
          {mistakeWords.length > 0 && <div className="review-list"><span>{tr('需要重练', 'Review again')}</span>{mistakeWords.map((item) => <strong key={item}>{item}</strong>)}</div>}
          <button className="primary-button" onClick={completedCourse}>{tr('保存并返回主页', 'Save and return home')}</button>
        </div>
      </main>
    )
  }

  return (
    <main className="main typing-page typing-active-page" onClick={() => captureRef.current?.focus({ preventScroll: true })}>
      <header className="typing-header">
        <button className="icon-button" onClick={requestLeave} aria-label={tr('返回主页', 'Back home')}><ArrowLeft size={20} /></button>
        <div className="practice-title"><span>{course.eyebrow}</span><strong>{localizedCourse.title}</strong></div>
        <div className="typing-header-actions">
          <div className="active-practice-config"><span>{localizedModeLabels[mode]}</span><i />{tr('整句检查', 'Whole-sentence check')}</div>
          <LanguageSwitch compact />
          <div className="typing-command-dock">
            {mode !== 'translation' && <button onClick={() => { speak(target); showNotice(tr('正在播放发音', 'Playing pronunciation')) }} aria-label={tr('播放发音', 'Play pronunciation')} title={tr('播放发音', 'Play pronunciation')}><Volume2 size={17} /></button>}
            <button className={favorites.includes(target) ? 'active favorite' : ''} onClick={toggleCurrentFavorite} aria-label={favorites.includes(target) ? tr('取消收藏', 'Remove favourite') : tr('收藏句子', 'Favourite sentence')} title={favorites.includes(target) ? tr('取消收藏', 'Remove favourite') : tr('收藏句子', 'Favourite sentence')}><Star size={17} fill={favorites.includes(target) ? 'currentColor' : 'none'} /></button>
          </div>
        </div>
        <div className="lesson-count">{index + 1}<span> / {course.words.length}</span></div>
      </header>
      <div className="progress-track"><i style={{ width: `${progress}%`, background: course.accent }} /></div>

      <section className="typing-workspace">
        <div className="word-neighbors">
          <button onClick={() => moveToWord(index - 1)} disabled={index === 0}><ChevronLeft size={18} /><span><small>{tr('上一题', 'Previous')}</small>{index > 0 ? tr(`第 ${index} 题`, `Item ${index}`) : ''}</span></button>
          <button onClick={() => moveToWord(index + 1)} disabled={index === course.words.length - 1}><span><small>{tr('下一题', 'Next')}</small>{index < course.words.length - 1 ? tr(`第 ${index + 2} 题`, `Item ${index + 2}`) : ''}</span><ChevronRight size={18} /></button>
        </div>

        <div className="typing-prompt">
          <span>{mode === 'copy' ? `${learningLanguage === 'sv' ? 'FÖLJ TEXTEN' : 'FOLLOW THE TEXT'} · ${tr('看词跟打', `COPY ${targetLanguage.nameEn.toLocaleUpperCase()}`)}` : mode === 'translation' ? `${learningLanguage === 'sv' ? 'ÖVERSÄTT' : 'TRANSLATE'} · ${tr('中文回译', 'TRANSLATE')}` : mode === 'listening' ? `${learningLanguage === 'sv' ? 'LYSSNA' : 'LISTEN'} · ${tr('听音辨词', 'LISTEN AND TYPE')}` : `${learningLanguage === 'sv' ? 'I MENINGEN' : 'IN CONTEXT'} · ${tr('例句补词', 'COMPLETE THE SENTENCE')}`}</span>
          <h2 className={mode === 'sentence' ? 'sentence-prompt' : ''}>
            {mode === 'listening'
              ? tr('听发音，写下完整内容', 'Listen and type the complete sentence')
              : mode === 'sentence' ? blankWordInSentence(word.example, target)
                : mode === 'translation' ? word.chinese : target}
          </h2>
          <p>{mode === 'translation'
            ? tr('只看中文，独立写出完整句子。', 'Write the complete sentence from its meaning only.')
            : mode === 'copy'
              ? wordMeaning(word, language)
            : course.vocabularyOnly
            ? word.note || tr('来自开源经典词包', 'From an open-source classic word list')
            : mode === 'listening'
              ? tr('输入时不显示原句，完成后再统一检查。', 'The original stays hidden until you submit.')
              : language === 'zh' ? word.exampleChinese : tr('根据语境补全缺少的表达。', 'Complete the missing expression from context.')}</p>
        </div>

        <div className="whole-sentence-entry">
          <div className={`journey-word-board typing-word-board ${answerChecked ? 'checked' : ''}`} aria-label={tr('按单词显示的整句输入', 'Whole sentence input shown by word')}>
            {Array.from({ length: displayWordCount }, (_, wordIndex) => {
              const entered = enteredWords[wordIndex] || ''
              const expected = expectedWords[wordIndex] || ''
              const matches = typingAnswersMatch(entered, expected, learningLanguage)
              const state = !answerChecked ? '' : !entered ? 'missing' : !expected ? 'extra' : matches ? 'correct' : 'incorrect'
              return <span key={`${wordIndex}-${expected}`} className={`${state} ${activeWordIndex === wordIndex ? 'active-edit' : ''}`} onClick={(event) => { event.stopPropagation(); selectWord(wordIndex) }}>
                <strong>{entered || '\u00a0'}</strong>
                {answerChecked && state !== 'correct' && <small>{expected ? tr(`应为 ${expected}`, `Expected: ${expected}`) : tr('多余部分', 'Extra word')}</small>}
              </span>
            })}
          </div>
          <input
            ref={captureRef}
            className="typing-capture"
            value={typed}
            aria-label={tr('整句输入区', 'Whole sentence input')}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            onChange={handleCaptureChange}
            onKeyDown={handleCaptureKeyDown}
            onSelect={(event) => {
              const position = event.currentTarget.selectionStart || 0
              const ranges = inputSlotRanges(typedRef.current)
              const selected = ranges.findIndex((range) => position >= range.start && position <= range.end)
              if (selected >= 0) setActiveWordIndex(selected)
            }}
            onPaste={(event) => event.preventDefault()}
          />
          {learningLanguage === 'sv' && <p className="typing-keyboard-note"><Keyboard size={14} />{tr('键盘没有瑞典字母也没关系：å / ä 可输入 a，ö 可输入 o；原字母同样正确。', 'No Swedish keys? You may type a for å / ä and o for ö; the original letters are also correct.')}</p>}
          <div className={`journey-feedback ${answerChecked && !answerConfirmed ? 'error' : ''}`} role="status">
            {answerChecked && !answerConfirmed
              ? <><X size={17} />{tr('已定位错误词；按 ← / → 切换单词块，用退格键逐字修改。', 'The first error is active. Use ← / → to switch word blocks and Backspace to edit letters.')}</>
              : answerConfirmed
                ? <><Check size={17} />{tr('整句正确，正在打开表达块复盘。', 'Correct. Opening the phrase breakdown.')}</>
                : <><Keyboard size={17} />{tr('从高亮单词块开始；随时按空格进入下一个。', 'Start with the highlighted word. Press Space any time to move to the next word.')}</>}
          </div>
          <button className="journey-primary journey-check-sentence" onClick={checkWholeSentence} disabled={!typed.trim() || answerConfirmed}>
            <Check size={17} />{answerChecked ? tr('修改后重新检查', 'Check revised sentence') : tr('检查整句', 'Check sentence')}
          </button>
        </div>
      </section>
      {companion && <aside className="training-companion">{companion}<span>{learningLanguage === 'sv' ? 'Jag är med dig.' : 'I am right here.'}</span></aside>}
      {shortcutNotice && <div className="shortcut-notice" role="status">{shortcutNotice}</div>}
      {answerRescueOpen && <div className="answer-rescue-backdrop" role="dialog" aria-modal="true" aria-labelledby="answer-rescue-title">
        <section className="answer-rescue-modal">
          <div className="answer-rescue-status"><span>3</span><div><strong>{tr('这个词已经错了三次', 'Three attempts on this word')}</strong><small>{tr('先看清答案，再重新建立一次正确记忆。', 'Pause, study the answer, then rebuild the correct memory.')}</small></div></div>
          <p className="section-kicker">{learningLanguage === 'sv' ? 'RÄTT SVAR' : 'CORRECT ANSWER'} · {tr('正确答案', 'CORRECT ANSWER')}</p>
          <h2 id="answer-rescue-title">{target}</h2>
          <p className="answer-rescue-meaning">{wordMeaning(word, language)}</p>
          {mode !== 'translation' && <button className="answer-rescue-sound" onClick={() => speak(target)}><Volume2 size={18} />{tr('听一次发音', 'Listen once')}</button>}
          {course.vocabularyOnly
            ? word.note && <span className="answer-rescue-example">{word.note}</span>
            : <><blockquote>{word.example}</blockquote>{language === 'zh' && <span className="answer-rescue-example">{word.exampleChinese}</span>}</>}
          <div className="answer-rescue-saved"><Star size={17} fill="currentColor" /><span><strong>{tr('已加入错题库', 'Added to mistake book')}</strong>{tr('稍后可以从左侧导航进行针对性复习。', 'Review it later from the dedicated mistake book.')}</span></div>
          <button className="answer-rescue-continue" onClick={closeAnswerRescue}>{tr('看清楚了，重新输入', 'Got it, type it again')}<ArrowRight size={18} /></button>
        </section>
      </div>}
      {leavePrompt}
      <div className="typing-bottom-bar">
        <div className="typing-metrics">
          <span><b>{formatTime(elapsedSeconds)}</b> {tr('时间', 'Time')}</span>
          <span><b>{index + 1}</b> / {course.words.length} {tr('当前题', 'Current')}</span>
          <span><b>{index}</b> {tr('完成句子', 'Completed')}</span>
          <span><b>{mistakeCount}</b> {tr('整句修改', 'Revisions')}</span>
        </div>
      </div>
    </main>
  )
}

function blankWordInSentence(sentence: string, target: string) {
  const index = normalize(sentence).indexOf(normalize(target))
  if (index < 0) return sentence
  return `${sentence.slice(0, index)}${'＿'.repeat(Math.min(8, Math.max(3, target.length)))}${sentence.slice(index + target.length)}`
}

function celebrateWord(accent: string) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const colors = ['#f7c948', '#2858c8', '#ffffff', accent]
  const common = {
    particleCount: 28,
    spread: 54,
    startVelocity: 27,
    gravity: 1.05,
    ticks: 95,
    scalar: .72,
    colors,
    disableForReducedMotion: true,
  }
  void confetti({ ...common, angle: 62, origin: { x: .42, y: .52 } })
  void confetti({ ...common, angle: 118, origin: { x: .58, y: .52 } })
}

const speakWord = speakTargetLanguage

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const rest = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${rest}`
}

let audioContext: AudioContext | null = null

function playFeedback(type: 'key' | 'wrong' | 'complete', profile: SoundProfile) {
  try {
    audioContext ||= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
    if (type === 'key') {
      playMechanicalKey(audioContext, profile)
      return
    }
    if (type === 'complete') {
      playSuccessChime(audioContext)
      return
    }
    const now = audioContext.currentTime
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const config = {
      key: { frequency: 240, duration: 0.035, volume: 0.025, wave: 'triangle' as OscillatorType },
      wrong: { frequency: 105, duration: 0.11, volume: 0.05, wave: 'square' as OscillatorType },
    }[type]
    oscillator.type = config.wave
    oscillator.frequency.setValueAtTime(config.frequency, now)
    gain.gain.setValueAtTime(config.volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start(now)
    oscillator.stop(now + config.duration)
  } catch {
    // Audio feedback is optional when the browser blocks Web Audio.
  }
}

function playSuccessChime(context: AudioContext) {
  const now = context.currentTime
  const notes = [
    { frequency: 880, delay: 0, volume: .075, duration: .42 },
    { frequency: 1318.51, delay: .075, volume: .065, duration: .5 },
  ]

  notes.forEach(({ frequency, delay, volume, duration }) => {
    const start = now + delay
    const fundamental = context.createOscillator()
    const fundamentalGain = context.createGain()
    fundamental.type = 'sine'
    fundamental.frequency.setValueAtTime(frequency, start)
    fundamentalGain.gain.setValueAtTime(.0001, start)
    fundamentalGain.gain.exponentialRampToValueAtTime(volume, start + .008)
    fundamentalGain.gain.exponentialRampToValueAtTime(.0001, start + duration)
    fundamental.connect(fundamentalGain)
    fundamentalGain.connect(context.destination)

    const shimmer = context.createOscillator()
    const shimmerGain = context.createGain()
    shimmer.type = 'sine'
    shimmer.frequency.setValueAtTime(frequency * 2.42, start)
    shimmerGain.gain.setValueAtTime(.0001, start)
    shimmerGain.gain.exponentialRampToValueAtTime(volume * .26, start + .004)
    shimmerGain.gain.exponentialRampToValueAtTime(.0001, start + duration * .58)
    shimmer.connect(shimmerGain)
    shimmerGain.connect(context.destination)

    fundamental.start(start)
    shimmer.start(start)
    fundamental.stop(start + duration)
    shimmer.stop(start + duration * .6)
  })
}

function playMechanicalKey(context: AudioContext, profile: SoundProfile) {
  const now = context.currentTime
  const settings = {
    clicky: { duration: .038, impact: .095, body: 465, click: 1950, rebound: 1180, filterQ: 1.8 },
    tactile: { duration: .044, impact: .075, body: 365, click: 1450, rebound: 840, filterQ: 1.35 },
    soft: { duration: .032, impact: .032, body: 285, click: 980, rebound: 620, filterQ: 1.05 },
  }[profile]
  const variation = .94 + Math.random() * .12

  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * settings.duration), context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let index = 0; index < data.length; index += 1) {
    const decay = Math.pow(1 - index / data.length, 7)
    data[index] = (Math.random() * 2 - 1) * decay
  }
  const noise = context.createBufferSource()
  const noiseFilter = context.createBiquadFilter()
  const noiseGain = context.createGain()
  noise.buffer = buffer
  noiseFilter.type = 'bandpass'
  noiseFilter.frequency.setValueAtTime(settings.click * variation, now)
  noiseFilter.Q.setValueAtTime(settings.filterQ, now)
  noiseGain.gain.setValueAtTime(settings.impact, now)
  noiseGain.gain.exponentialRampToValueAtTime(.0001, now + settings.duration)
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(context.destination)

  const body = context.createOscillator()
  const bodyGain = context.createGain()
  body.type = 'triangle'
  body.frequency.setValueAtTime(settings.body * variation, now)
  body.frequency.exponentialRampToValueAtTime(settings.body * .56, now + settings.duration)
  bodyGain.gain.setValueAtTime(profile === 'soft' ? .026 : .052, now)
  bodyGain.gain.exponentialRampToValueAtTime(.0001, now + settings.duration)
  body.connect(bodyGain)
  bodyGain.connect(context.destination)

  const rebound = context.createOscillator()
  const reboundGain = context.createGain()
  const reboundStart = now + (profile === 'soft' ? .018 : .022)
  rebound.type = 'square'
  rebound.frequency.setValueAtTime(settings.rebound * variation, reboundStart)
  reboundGain.gain.setValueAtTime(profile === 'clicky' ? .024 : profile === 'tactile' ? .017 : .007, reboundStart)
  reboundGain.gain.exponentialRampToValueAtTime(.0001, reboundStart + .015)
  rebound.connect(reboundGain)
  reboundGain.connect(context.destination)

  noise.start(now)
  body.start(now)
  rebound.start(reboundStart)
  noise.stop(now + settings.duration)
  body.stop(now + settings.duration)
  rebound.stop(reboundStart + .017)
}
