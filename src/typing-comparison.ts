import type { LearningLanguage } from './learning-language'

const swedishPlainKeyFallbacks: Record<string, string> = {
  å: 'a',
  ä: 'a',
  ö: 'o',
}

export const typingTargetFor = (value: string) => value
  .normalize('NFC')
  .replace(/[^\p{L}\p{N}\s]/gu, '')
  .replace(/\s+/g, ' ')
  .trim()

function lowerTypingText(value: string, learningLanguage: LearningLanguage) {
  return value.normalize('NFC').toLocaleLowerCase(learningLanguage === 'sv' ? 'sv-SE' : 'en-US')
}

export function typingCharactersMatch(
  entered: string,
  expected: string,
  learningLanguage: LearningLanguage,
) {
  const normalizedEntered = lowerTypingText(entered, learningLanguage)
  const normalizedExpected = lowerTypingText(expected, learningLanguage)
  if (normalizedEntered === normalizedExpected) return true
  if (learningLanguage !== 'sv') return false
  return swedishPlainKeyFallbacks[normalizedExpected] === normalizedEntered
}

export function typingAnswersMatch(
  entered: string,
  expected: string,
  learningLanguage: LearningLanguage,
) {
  const enteredCharacters = Array.from(lowerTypingText(typingTargetFor(entered), learningLanguage))
  const expectedCharacters = Array.from(lowerTypingText(typingTargetFor(expected), learningLanguage))
  return enteredCharacters.length === expectedCharacters.length
    && expectedCharacters.every((character, index) => typingCharactersMatch(enteredCharacters[index], character, learningLanguage))
}
