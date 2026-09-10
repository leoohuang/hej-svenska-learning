import type { ChangeEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, Brain, Check, Ear, Headphones, Keyboard,
  Lightbulb, MapPin, Mic, Play, RotateCcw, Sparkles, Square, Volume2, X,
} from 'lucide-react'
import type { SwedishCourse, SwedishWord } from './swedish-data'
import type { LearningLanguage } from './learning-language'
import { learningLanguageConfig } from './learning-language'
import { LanguageSwitch, courseCopy, useLanguage, wordMeaning } from './i18n'
import { speakTargetLanguage } from './speech'
import { playTypingSound, type TypingSoundProfile } from './typing-sound'
import { typingAnswersMatch, typingTargetFor } from './typing-comparison'

type JourneyProps = {
  learningLanguage: LearningLanguage
  course: SwedishCourse
  sessionId: string
  onExit: (elapsedSeconds?: number, studiedWords?: SwedishWord[]) => void
  onComplete: (correct: number, elapsedSeconds: number) => void
  companion?: React.ReactNode
}

type MemoryStepKind = 'learn' | 'copy' | 'recall' | 'listen' | 'check'
type MemoryStep = { kind: MemoryStepKind; wordIndex: number; group: number }

function buildMemorySteps(words: SwedishWord[]) {
  const steps: MemoryStep[] = []
  for (let start = 0; start < words.length; start += 4) {
    const indexes = words.slice(start, start + 4).map((_, offset) => start + offset)
    indexes.forEach((wordIndex) => {
      steps.push({ kind: 'learn', wordIndex, group: start / 4 })
      steps.push({ kind: 'copy', wordIndex, group: start / 4 })
    })
    indexes.forEach((wordIndex) => steps.push({ kind: 'recall', wordIndex, group: start / 4 }))
    indexes.forEach((wordIndex) => steps.push({ kind: 'listen', wordIndex, group: start / 4 }))
    const delayedOrder = indexes.length > 2 ? [...indexes.slice(2), ...indexes.slice(0, 2)] : [...indexes].reverse()
    delayedOrder.forEach((wordIndex) => steps.push({ kind: 'check', wordIndex, group: start / 4 }))
  }
  return steps
}

const stepCopy: Record<MemoryStepKind, { zh: string; en: string; detailZh: string; detailEn: string }> = {
  learn: { zh: '理解表达', en: 'Understand', detailZh: '先理解使用场景和表达结构', detailEn: 'Understand the scene and structure first' },
  copy: { zh: '建立形式', en: 'Build form', detailZh: '看着原句，准确输入一次', detailEn: 'Copy the sentence accurately once' },
  recall: { zh: '主动回忆', en: 'Active recall', detailZh: '只看中文，独立写出句子', detailEn: 'Write it from the Chinese meaning' },
  listen: { zh: '听力提取', en: 'Listening recall', detailZh: '只听声音，写出听到的内容', detailEn: 'Type the sentence from sound only' },
  check: { zh: '延迟抽查', en: 'Delayed check', detailZh: '隔开几题后，再独立想一次', detailEn: 'Recall it again after a delay' },
}

function phaseIndex(kind: MemoryStepKind) {
  return ['learn', 'copy', 'recall', 'listen', 'check'].indexOf(kind)
}

export function answerWords(value: string) {
  const normalized = typingTargetFor(value)
  return normalized ? normalized.split(' ') : []
}

// Preserve empty positions between spaces so a deleted word never pulls later
// words into the wrong visual slot.
export function inputSlots(value: string) {
  const withoutPunctuation = value.replace(/[^\p{L}\p{N}\s]/gu, '')
  const trimmedEnd = withoutPunctuation.trimEnd()
  return trimmedEnd ? trimmedEnd.split(/\s/) : []
}

export function inputSlotRanges(value: string) {
  const ranges: Array<{ start: number, end: number }> = []
  let start = 0
  for (let index = 0; index < value.length; index += 1) {
    if (/\s/.test(value[index])) {
      ranges.push({ start, end: index })
      start = index + 1
    }
  }
  if (start < value.length) ranges.push({ start, end: value.length })
  return ranges
}

export function phraseChunks(value: string) {
  const words = answerWords(value)
  if (words.length <= 4) return words.map((word) => [word])
  const chunkCount = 3
  const baseSize = Math.floor(words.length / chunkCount)
  const remainder = words.length % chunkCount
  const chunks: string[][] = []
  let cursor = 0
  for (let index = 0; index < chunkCount; index += 1) {
    const size = baseSize + (index < remainder ? 1 : 0)
    chunks.push(words.slice(cursor, cursor + size))
    cursor += size
  }
  return chunks
}

export function grammarChunks(value: string, learningLanguage: LearningLanguage) {
  const words = answerWords(value)
  if (words.length <= 1) return words.length ? [{ words, zh: '核心表达', en: 'CORE EXPRESSION' }] : []
  const subjects = learningLanguage === 'sv'
    ? new Set(['jag', 'du', 'han', 'hon', 'den', 'det', 'vi', 'ni', 'de'])
    : new Set(['i', 'you', 'he', 'she', 'it', 'we', 'they'])
  const auxiliaries = learningLanguage === 'sv'
    ? new Set(['kan', 'ska', 'vill', 'har', 'är', 'var'])
    : new Set(['can', 'could', 'will', 'would', 'do', 'does', 'did', 'have', 'has', 'is', 'are', 'was', 'were'])
  const first = words[0].toLocaleLowerCase()
  const second = words[1].toLocaleLowerCase()

  if (auxiliaries.has(first) && subjects.has(second)) {
    return [
      { words: [words[0]], zh: '谓语', en: 'PREDICATE' },
      { words: [words[1]], zh: '主语', en: 'SUBJECT' },
      ...(words.length > 2 ? [{ words: words.slice(2), zh: '补语 / 宾语', en: 'COMPLEMENT / OBJECT' }] : []),
    ]
  }
  if (subjects.has(first)) {
    return [
      { words: [words[0]], zh: '主语', en: 'SUBJECT' },
      { words: [words[1]], zh: '谓语', en: 'PREDICATE' },
      ...(words.length > 2 ? [{ words: words.slice(2), zh: '补语 / 宾语', en: 'COMPLEMENT / OBJECT' }] : []),
    ]
  }
  return [
    { words: [words[0]], zh: '谓语 / 核心表达', en: 'PREDICATE / CORE' },
    { words: words.slice(1), zh: '补语 / 宾语', en: 'COMPLEMENT / OBJECT' },
  ]
}

export function wordRanges(value: string) {
  return Array.from(value.matchAll(/[\p{L}\p{N}]+/gu), (match) => ({
    start: match.index || 0,
    end: (match.index || 0) + match[0].length,
  }))
}

export function MemoryJourney({ learningLanguage, course, sessionId, onExit, onComplete, companion }: JourneyProps) {
  const { language, tr } = useLanguage()
  const targetConfig = learningLanguageConfig[learningLanguage]
  const localizedCourse = courseCopy(course, language)
  const steps = useMemo(() => buildMemorySteps(course.words), [course.words])
  const [stepIndex, setStepIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(false)
  const [stepComplete, setStepComplete] = useState(false)
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [stepMistakes, setStepMistakes] = useState(0)
  const [recallAttempts, setRecallAttempts] = useState(0)
  const [recallFirstTry, setRecallFirstTry] = useState(0)
  const [mastered, setMastered] = useState<Set<string>>(new Set())
  const [done, setDone] = useState(false)
  const [startedAt] = useState(Date.now())
  const soundProfile = (localStorage.getItem('hej-key-sound') || 'clicky') as TypingSoundProfile
  const inputRef = useRef<HTMLInputElement>(null)
  const completedRef = useRef(false)
  const recallAttemptsRef = useRef(0)
  const recallFirstTryRef = useRef(0)
  const masteredRef = useRef<Set<string>>(new Set())
  const step = steps[stepIndex]
  const word = course.words[step.wordIndex]
  const target = typingTargetFor(word.swedish)
  const copy = stepCopy[step.kind]
  const isRecall = step.kind === 'recall' || step.kind === 'check'
  const requiresInput = step.kind !== 'learn'
  const progress = ((stepIndex + (done ? 1 : 0)) / steps.length) * 100
  const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000))

  useEffect(() => {
    setTyped('')
    setChecked(false)
    setStepComplete(false)
    setActiveWordIndex(0)
    setStepMistakes(0)
    completedRef.current = false
    if (step.kind === 'listen') {
      const timer = window.setTimeout(() => speakTargetLanguage(word.swedish, targetConfig.locale), 180)
      return () => window.clearTimeout(timer)
    }
    if (requiresInput) window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 30)
  }, [requiresInput, step.kind, step.wordIndex, targetConfig.locale, word.swedish])

  const advance = () => {
    if (stepIndex === steps.length - 1) {
      const seconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000))
      localStorage.setItem(`hej-memory-mastery:${sessionId}`, JSON.stringify({
        updatedAt: new Date().toISOString(),
        mastered: Array.from(masteredRef.current),
        recallRate: recallAttemptsRef.current ? Math.round((recallFirstTryRef.current / recallAttemptsRef.current) * 100) : 0,
      }))
      onComplete(masteredRef.current.size, seconds)
      setDone(true)
      return
    }
    setStepIndex((current) => current + 1)
  }

  const completeInputStep = (mistakes = stepMistakes) => {
    if (completedRef.current) return
    completedRef.current = true
    if (isRecall) {
      recallAttemptsRef.current += 1
      setRecallAttempts(recallAttemptsRef.current)
      if (mistakes === 0) {
        recallFirstTryRef.current += 1
        setRecallFirstTry(recallFirstTryRef.current)
      }
    }
    if (step.kind === 'check' && mistakes === 0) {
      masteredRef.current.add(word.swedish)
      setMastered(new Set(masteredRef.current))
    }
    setStepComplete(true)
  }

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.currentTarget.value
    if (next.length > typed.length) playTypingSound('key', soundProfile)
    const expected = answerWords(target)
    const manuallyAdvanced = next.length > typed.length
      && /\s$/.test(next)
      && !/\s$/.test(typed)
    setTyped(next)
    if (manuallyAdvanced && activeWordIndex < expected.length - 1) {
      setActiveWordIndex(activeWordIndex + 1)
    }
    setChecked(false)
  }

  const submitSentence = () => {
    if (stepComplete || !typed.trim()) return
    if (typingAnswersMatch(typed, target, learningLanguage)) {
      playTypingSound('complete', soundProfile)
      completeInputStep(stepMistakes)
      return
    }
    playTypingSound('wrong', soundProfile)
    setStepMistakes((count) => count + 1)
    setChecked(true)
    const entered = inputSlots(typed)
    const expected = answerWords(target)
    const mismatch = Array.from({ length: Math.max(entered.length, expected.length) }, (_, index) => index)
      .find((index) => !typingAnswersMatch(entered[index] || '', expected[index] || '', learningLanguage)) ?? 0
    window.setTimeout(() => selectWord(mismatch), 0)
  }

  if (done) {
    const recallRate = recallAttempts ? Math.round((recallFirstTry / recallAttempts) * 100) : 0
    return <main className="main journey-page journey-result" style={{ '--journey-accent': course.accent } as React.CSSProperties}>
      <section className="journey-result-card">
        <span className="journey-result-mark"><Brain size={32} /></span>
        <p className="section-kicker">MEMORY BUILT · {tr('记忆路径完成', 'MEMORY PATH COMPLETE')}</p>
        <h1>{tr('这次不是“打完了”，而是留下来了。', 'You did more than type it. You retained it.')}</h1>
        <div className="journey-result-metrics">
          <div><strong>{mastered.size}</strong><span>{tr('已通过延迟抽查', 'Passed delayed recall')}</span></div>
          <div><strong>{recallRate}%</strong><span>{tr('独立回忆率', 'Independent recall')}</span></div>
          <div><strong>{course.words.length}</strong><span>{tr('本次接触词句', 'Items practised')}</span></div>
        </div>
        <p>{tr('真正需要复习的内容会在下次优先出现。速度不是主角，能不能独立想起来才是。', 'Items that still need work will return first next time. Recall matters more than speed.')}</p>
        <button onClick={() => onExit()}>{tr('保存并返回主页', 'Save and return home')}<ArrowRight size={18} /></button>
      </section>
    </main>
  }

  const expectedWords = answerWords(target)
  const enteredWords = inputSlots(typed)
  const displayWordCount = Math.max(expectedWords.length, enteredWords.length)
  const selectWord = (wordIndex: number) => {
    const ranges = inputSlotRanges(typed)
    const range = ranges[wordIndex]
    const fallback = typed.length
    inputRef.current?.focus({ preventScroll: true })
    const caret = range?.end ?? fallback
    inputRef.current?.setSelectionRange(caret, caret)
    setActiveWordIndex(wordIndex)
  }
  return <main className="main journey-page" style={{ '--journey-accent': course.accent } as React.CSSProperties} onClick={() => requiresInput && inputRef.current?.focus({ preventScroll: true })}>
    <header className="journey-header">
      <button onClick={() => onExit(elapsedSeconds, course.words.slice(0, Math.min(course.words.length, (step.group + 1) * 4)))} aria-label={tr('退出记忆路径', 'Exit memory path')}><ArrowLeft size={19} /></button>
      <div><span>{localizedCourse.title}</span><strong>{tr(`第 ${step.group + 1} 组 · ${copy.zh}`, `Set ${step.group + 1} · ${copy.en}`)}</strong></div>
      <div className="journey-header-meta"><Brain size={16} /><span>{mastered.size} {tr('句已掌握', 'mastered')}</span><LanguageSwitch compact /></div>
    </header>
    <div className="journey-progress"><i style={{ width: `${progress}%` }} /></div>

    <section className="journey-stage">
      <nav className="journey-phase-track" aria-label={tr('记忆阶段', 'Memory phases')}>
        {(['learn', 'copy', 'recall', 'listen', 'check'] as MemoryStepKind[]).map((kind) => {
          const phase = stepCopy[kind]
          const active = phaseIndex(kind) === phaseIndex(step.kind)
          const passed = phaseIndex(kind) < phaseIndex(step.kind)
          return <span key={kind} className={`${active ? 'active' : ''} ${passed ? 'passed' : ''}`}><i>{passed ? <Check size={12} /> : phaseIndex(kind) + 1}</i>{tr(phase.zh, phase.en)}</span>
        })}
      </nav>

      <article className={`journey-card journey-${step.kind}`}>
        <div className="journey-card-top">
          <span>{step.kind === 'learn' ? <Sparkles size={17} /> : step.kind === 'listen' ? <Ear size={17} /> : step.kind === 'check' ? <Brain size={17} /> : <Keyboard size={17} />}{tr(copy.zh, copy.en)}</span>
          <small>{tr(copy.detailZh, copy.detailEn)}</small>
        </div>

        {step.kind === 'learn' && <>
          <div className="journey-scene"><span>{tr('中文含义', 'MEANING')}</span><h2>{word.chinese}</h2></div>
          <div className="journey-expression">
            <button onClick={(event) => { event.stopPropagation(); speakTargetLanguage(word.swedish, targetConfig.locale) }} aria-label={tr('播放原句', 'Play sentence')}><Volume2 size={20} /></button>
            <div><p>{targetConfig.nativeName.toLocaleUpperCase(targetConfig.locale)}</p><h1>{word.swedish}</h1></div>
          </div>
          {!course.vocabularyOnly && <blockquote>{language === 'zh' ? word.exampleChinese : word.example}</blockquote>}
          <button className="journey-primary" onClick={advance}>{tr('理解了，开始建立形式', 'Understood, build the form')}<ArrowRight size={18} /></button>
        </>}

        {step.kind !== 'learn' && !stepComplete && <>
          <div className="journey-prompt">
            {step.kind === 'copy' && <><span>{tr('看原句输入', 'COPY THE SENTENCE')}</span><h2>{word.swedish}</h2><p>{word.chinese}</p></>}
            {step.kind === 'recall' && <><span>{tr('只看中文', 'MEANING ONLY')}</span><h2>{word.chinese}</h2><p>{tr('不要播放声音，先让大脑主动提取。', 'Retrieve it without audio or answer hints.')}</p></>}
            {step.kind === 'listen' && <><button className="journey-listen" onClick={(event) => { event.stopPropagation(); speakTargetLanguage(word.swedish, targetConfig.locale) }}><Headphones size={25} /><span>{tr('再听一次', 'Listen again')}</span></button><h2>{tr('写下你听到的完整内容', 'Type the complete sentence you hear')}</h2></>}
            {step.kind === 'check' && <><span>{tr('延迟抽查 · 无提示', 'DELAYED CHECK · NO HINTS')}</span><h2>{word.chinese}</h2><p>{tr('这一次答对，才会记为真正掌握。', 'Pass this recall to mark the phrase as mastered.')}</p></>}
          </div>
          <div className={`journey-word-board ${checked ? 'checked' : ''}`}>
            {Array.from({ length: displayWordCount }, (_, index) => {
              const entered = enteredWords[index] || ''
              const expected = expectedWords[index] || ''
              const matches = typingAnswersMatch(entered, expected, learningLanguage)
              const state = !checked ? '' : !entered ? 'missing' : !expected ? 'extra' : matches ? 'correct' : 'incorrect'
              return <span key={`${index}-${expected}`} className={`${state} ${activeWordIndex === index ? 'active-edit' : ''}`} onClick={(event) => { event.stopPropagation(); selectWord(index) }}>
                <strong>{entered || '\u00a0'}</strong>
                {checked && state !== 'correct' && <small>{expected ? tr(`应为 ${expected}`, `Expected: ${expected}`) : tr('多余部分', 'Extra word')}</small>}
              </span>
            })}
          </div>
          <input
            ref={inputRef}
            className="journey-capture"
            value={typed}
            onChange={handleInput}
            onSelect={(event) => {
              const position = event.currentTarget.selectionStart || 0
              const ranges = inputSlotRanges(typed)
              const selected = ranges.findIndex((range) => position >= range.start && position <= range.end)
              if (selected >= 0) setActiveWordIndex(selected)
            }}
            onKeyDown={(event) => {
              if (event.key === ' ') {
                const range = inputSlotRanges(typed)[activeWordIndex]
                if (range && /\s/.test(typed[range.end] || '') && activeWordIndex < displayWordCount - 1) {
                  event.preventDefault()
                  selectWord(activeWordIndex + 1)
                  return
                }
              }
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                const direction = event.key === 'ArrowLeft' ? -1 : 1
                selectWord(Math.max(0, Math.min(displayWordCount - 1, activeWordIndex + direction)))
                return
              }
              if (event.key === 'Backspace' || event.key === 'Delete') {
                const range = inputSlotRanges(typed)[activeWordIndex]
                const caret = event.currentTarget.selectionStart || 0
                if (range && ((event.key === 'Backspace' && caret <= range.start) || (event.key === 'Delete' && caret >= range.end))) {
                  event.preventDefault()
                  return
                }
              }
              if (event.key === 'Enter') {
                event.preventDefault()
                submitSentence()
              }
            }}
            autoCapitalize="none"
            autoComplete="off"
            autoFocus
            spellCheck={false}
            aria-label={tr('记忆路径输入区', 'Memory path input')}
          />
          {learningLanguage === 'sv' && <p className="typing-keyboard-note"><Keyboard size={14} />{tr('键盘没有瑞典字母也没关系：å / ä 可输入 a，ö 可输入 o；原字母同样正确。', 'No Swedish keys? You may type a for å / ä and o for ö; the original letters are also correct.')}</p>}
          <div className={`journey-feedback ${checked ? 'error' : ''}`}>
            {checked ? <><X size={16} />{tr('已定位错误词；按 ← / → 切换单词块，用退格键逐字修改', 'The first error is active. Use ← / → to switch word blocks and Backspace to edit letters.')}</> : <><Keyboard size={16} />{tr('从高亮单词块开始；随时按空格进入下一个。', 'Start with the highlighted word. Press Space any time to move to the next word.')}</>}
          </div>
          <button className="journey-primary journey-check-sentence" disabled={!typed.trim()} onClick={submitSentence}>
            {checked ? tr('修改后重新检查', 'Check revised sentence') : tr('检查整句', 'Check full sentence')}
            <Check size={18} />
          </button>
        </>}

        {step.kind !== 'learn' && stepComplete && <div className="sentence-breakdown">
          <div className="sentence-breakdown-heading">
            <span>{tr('整句提取成功', 'FULL SENTENCE RETRIEVED')}</span>
            <h2>{word.chinese}</h2>
            <p>{tr('现在把它看成几个表达块，而不是一串字符。', 'Now see it as meaningful chunks, not a string of characters.')}</p>
          </div>
          <div className="sentence-chunk-row">
            {grammarChunks(target, learningLanguage).map((chunk, index) => <div key={`${chunk.words.join('-')}-${index}`} style={{ '--chunk-index': index } as React.CSSProperties}>
              <span>{tr(chunk.zh, chunk.en)}</span>
              <strong>{chunk.words.join(' ')}</strong>
              <i />
            </div>)}
          </div>
          <div className="sentence-breakdown-note">
            <Lightbulb size={18} />
            <div><strong>{tr('把表达块整体调出来', 'Retrieve the chunks as units')}</strong><p>{word.note || (course.vocabularyOnly ? word.chinese : language === 'zh' ? word.exampleChinese : word.example)}</p></div>
          </div>
          <button className="journey-primary journey-next-step" onClick={advance}>
            {step.kind === 'check' ? tr('记住了，继续下一组', 'Mastered—continue') : tr('看懂拆解，继续', 'Understood—continue')}
            <ArrowRight size={18} />
          </button>
        </div>}
      </article>
      <footer className="journey-session-footer"><span>{stepIndex + 1} / {steps.length}</span><strong>{tr('本节不计算打字速度，只计算独立回忆', 'This session measures recall, not typing speed')}</strong>{companion}</footer>
    </section>
  </main>
}

type SpeakingProps = JourneyProps

type SpeakingStep = { kind: 'context' | 'transfer'; wordIndex: number; group: number }

function buildSpeakingSteps(words: SwedishWord[]) {
  const steps: SpeakingStep[] = []
  for (let start = 0; start < words.length; start += 3) {
    const indexes = words.slice(start, start + 3).map((_, offset) => start + offset)
    indexes.forEach((wordIndex) => steps.push({ kind: 'context', wordIndex, group: start / 3 }))
    indexes.forEach((wordIndex) => steps.push({ kind: 'transfer', wordIndex, group: start / 3 }))
  }
  return steps
}

function usageScene(word: SwedishWord, language: 'zh' | 'en') {
  if (language === 'en') {
    if (word.english) return `You need to communicate this intention in a real conversation: “${word.english}”.`
    return `You need to express this naturally to another person in a real conversation.`
  }
  if (word.note) return word.note
  if (/[?？]$/.test(word.swedish)) return `当你需要向对方询问、确认或请求信息时，用这句话开启回应。`
  if (/^[!！]|[!！]$/.test(word.swedish) || word.swedish.split(/\s+/).length <= 3) return `当你与人见面、回应对方或快速表达态度时，可以直接使用这句话。`
  return `当真实对话中需要表达“${word.chinese}”这个意图时，用这句话完成你的回应。`
}

function transferTask(word: SwedishWord, language: 'zh' | 'en') {
  if (language === 'en') return `Keep the useful sentence frame, then change one person, time, place or need so the sentence becomes yours.`
  if (/[?？]$/.test(word.swedish)) return `先用这句话完成提问，再替换你真正想问的人、地点或信息，造一个新的问题。`
  return `保留这句话最有用的结构，把人物、时间、地点或具体需求中的一个换成你自己的信息。`
}

export function SpeakingJourney({ learningLanguage, course, onExit, onComplete, companion }: SpeakingProps) {
  const { language, tr } = useLanguage()
  const targetConfig = learningLanguageConfig[learningLanguage]
  const localizedCourse = courseCopy(course, language)
  const steps = useMemo(() => buildSpeakingSteps(course.words), [course.words])
  const [stepIndex, setStepIndex] = useState(0)
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [referenceOpen, setReferenceOpen] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [needsReview, setNeedsReview] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [permissionError, setPermissionError] = useState('')
  const [startedAt] = useState(Date.now())
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const step = steps[stepIndex]
  const word = course.words[step.wordIndex]
  const progress = (stepIndex / steps.length) * 100

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  useEffect(() => {
    setAudioUrl('')
    setReferenceOpen(false)
    setPermissionError('')
  }, [stepIndex])

  const playOriginal = () => speakTargetLanguage(word.swedish, targetConfig.locale)

  const startRecording = async () => {
    setPermissionError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })))
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    } catch {
      setPermissionError(tr('无法使用麦克风，请检查浏览器权限。', 'Microphone access is unavailable. Check your browser permission.'))
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    setRecording(false)
  }

  const moveNext = (passed?: boolean) => {
    let nextCompleted = completed
    if (step.kind === 'transfer' && passed !== undefined) {
      if (passed) {
        nextCompleted += 1
        setCompleted(nextCompleted)
      } else {
        setNeedsReview((items) => items.includes(word.swedish) ? items : [...items, word.swedish])
      }
    }
    if (stepIndex === steps.length - 1) {
      onComplete(nextCompleted, Math.max(1, Math.floor((Date.now() - startedAt) / 1000)))
      setDone(true)
      return
    }
    setStepIndex((current) => current + 1)
  }

  if (done) return <main className="main journey-page journey-result speaking-result">
    <section className="journey-result-card">
      <span className="journey-result-mark"><Mic size={32} /></span>
      <p className="section-kicker">SPEAKING COMPLETE · {tr('开口训练完成', 'SPEAKING COMPLETE')}</p>
      <h1>{tr('今天你真的开口了。', 'You actually spoke today.')}</h1>
      <div className="journey-result-metrics">
        <div><strong>{completed}</strong><span>{tr('完成场景迁移', 'Context transfers completed')}</span></div>
        <div><strong>{needsReview.length}</strong><span>{tr('需要重新迁移', 'Phrases to transfer again')}</span></div>
      </div>
      <p>{tr('你不仅复述了原句，还在新的生活场景里重新组织和使用了它。', 'You did more than repeat the model—you reorganised and used it in a new situation.')}</p>
      <button onClick={() => onExit()}>{tr('保存并返回主页', 'Save and return home')}<ArrowRight size={18} /></button>
    </section>
  </main>

  return <main className="main journey-page speaking-page" style={{ '--journey-accent': course.accent } as React.CSSProperties}>
    <header className="journey-header">
      <button onClick={() => onExit(Math.max(1, Math.floor((Date.now() - startedAt) / 1000)), course.words.slice(0, Math.min(course.words.length, (step.group + 1) * 3)))} aria-label={tr('退出开口训练', 'Exit speaking practice')}><ArrowLeft size={19} /></button>
      <div><span>{localizedCourse.title}</span><strong>{step.kind === 'context' ? tr('理解使用场景', 'Understand the situation') : tr('场景迁移与造句', 'Transfer and create')}</strong></div>
      <div className="journey-header-meta"><Mic size={16} /><span>{stepIndex + 1} / {steps.length}</span><LanguageSwitch compact /></div>
    </header>
    <div className="journey-progress"><i style={{ width: `${progress}%` }} /></div>
    <section className="speaking-stage">
      <div className="speaking-mode-switch"><span className={step.kind === 'context' ? 'active' : ''}><i>1</i>{tr('先学习 3 个使用场景', 'Learn 3 usage situations')}</span><span className={step.kind === 'transfer' ? 'active' : ''}><i>2</i>{tr('隔开后迁移并造句', 'Transfer after a delay')}</span></div>
      <article className="speaking-card">
        {step.kind === 'context' ? <>
          <p className="section-kicker">WHEN TO USE IT · {tr('先知道为什么说', 'UNDERSTAND THE INTENTION')}</p>
          <div className="speaking-usage-scene"><MapPin size={20} /><div><span>{tr('真实使用场景', 'REAL-LIFE SITUATION')}</span><p>{usageScene(word, language)}</p></div></div>
          <h1>{word.swedish}</h1>
          <p className="speaking-meaning">{word.chinese}</p>
          <button className="speaking-original" onClick={playOriginal}><Volume2 size={21} />{tr('听自然原音与语气', 'Hear the natural tone')}</button>
          <div className="speaking-usage-tip"><Lightbulb size={18} /><div><strong>{tr('使用时不要逐词翻译', 'Do not translate word by word')}</strong><p>{tr('记住“在什么情况下说”以及整句话表达的意图。稍后系统会换一个场景让你重新组织。', 'Remember when to say it and the intention it carries. A different situation will ask you to rebuild it later.')}</p></div></div>
          <button className="journey-primary speaking-context-next" onClick={() => moveNext()}>{tr('理解使用方式，学习下一句', 'Understood—learn the next situation')}<ArrowRight size={18} /></button>
        </> : <>
          <p className="section-kicker">USE IT FOR REAL · {tr('场景迁移', 'TRANSFER THE PHRASE')}</p>
          <div className="speaking-transfer-scene">
            <span><MapPin size={16} />{tr('新的生活场景', 'A NEW SITUATION')}</span>
            <h1>{word.chinese}</h1>
            <p>{usageScene(word, language)}</p>
          </div>
          <div className="speaking-creation-task">
            <span><Sparkles size={17} />{tr('不是复读任务', 'CREATE, DO NOT PARROT')}</span>
            <p>{transferTask(word, language)}</p>
            <ol>
              <li>{tr('先说出适合这个场景的原表达', 'Say the useful base expression')}</li>
              <li>{tr('替换一个真实细节，造出属于你的新句子', 'Change one real detail and create your own sentence')}</li>
              <li>{tr('把新句子完整说一遍', 'Say your new sentence in full')}</li>
            </ol>
          </div>
          <div className={`record-orbit ${recording ? 'recording' : ''}`}>
            <button onClick={recording ? stopRecording : startRecording} aria-label={recording ? tr('停止录音', 'Stop recording') : tr('开始录音', 'Start recording')}>
              {recording ? <Square size={25} fill="currentColor" /> : <Mic size={30} />}
            </button>
            <span>{recording ? tr('正在录制你的场景回答', 'Recording your situation response') : audioUrl ? tr('先回听：你是否真的改变了一个细节？', 'Listen back: did you really change one detail?') : tr('准备好后，录下原表达和你的新句子', 'Record the base phrase and your new sentence')}</span>
          </div>
          {permissionError && <p className="speaking-error">{permissionError}</p>}
          {audioUrl && <div className="speaking-playback"><audio src={audioUrl} controls /><span><Headphones size={16} />{tr('你的场景回答', 'Your response')}</span></div>}
          {audioUrl && !referenceOpen && <button className="speaking-reference-toggle" onClick={() => setReferenceOpen(true)}><Play size={15} />{tr('回听后查看参考结构', 'Show the reference after listening')}</button>}
          {referenceOpen && <div className="speaking-reference"><span>{tr('参考结构，不是唯一答案', 'REFERENCE, NOT THE ONLY ANSWER')}</span><strong>{word.swedish}</strong><button onClick={playOriginal}><Volume2 size={16} />{tr('听参考语气', 'Hear the model')}</button></div>}
          {audioUrl && <div className="speaking-self-check">
            <p>{tr('你的回答是否适合场景，并且至少替换了一个真实细节？', 'Did your answer fit the situation and change at least one real detail?')}</p>
            <button onClick={() => moveNext(false)}><RotateCcw size={16} />{tr('还没有迁移成功', 'Not transferred yet')}</button>
            <button onClick={() => moveNext(true)}><Check size={16} />{tr('我在新场景里用出来了', 'I used it in the new situation')}</button>
          </div>}
        </>}
      </article>
      <footer className="journey-session-footer"><span>{step.kind === 'context' ? tr('学习使用条件', 'Learn when to use it') : tr('迁移到新场景', 'Transfer it')}</span><strong>{tr('目标不是背出原句，而是在真实生活里调动这句话', 'The goal is not repetition—it is using the phrase when life calls for it')}</strong>{companion}</footer>
    </section>
  </main>
}
