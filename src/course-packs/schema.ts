import type { CoursePack } from '../swedish-data'

const allowedCategories = new Set(['入门', '生活', '词汇', '发音', '职场', '考试', '文化', '亲子'])
const allowedCovers = new Set(['starter', 'life', 'words', 'sound', 'work', 'exam', 'culture', 'family', 'premium'])

export type CoursePackFile = {
  kind: 'hej-course-pack'
  formatVersion: 1
  contentVersion: string
  sources: Array<{ title: string; url: string; note: string }>
  pack: CoursePack
}

function assertText(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid course pack field: ${path}`)
}

function assertTextList(value: unknown, path: string) {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`Invalid course pack field: ${path}`)
  value.forEach((item, index) => assertText(item, `${path}[${index}]`))
}

export function loadCoursePackFile(input: unknown, expectedItems?: number): CoursePack {
  if (!input || typeof input !== 'object') throw new Error('Course pack must be an object')
  const file = input as CoursePackFile
  if (file.kind !== 'hej-course-pack' || file.formatVersion !== 1) {
    throw new Error('Unsupported course pack format')
  }
  assertText(file.contentVersion, 'contentVersion')
  if (!Array.isArray(file.sources) || file.sources.length === 0) throw new Error('Course pack sources are required')
  file.sources.forEach((source, index) => {
    assertText(source.title, `sources[${index}].title`)
    assertText(source.url, `sources[${index}].url`)
    assertText(source.note, `sources[${index}].note`)
  })

  const pack = file.pack
  assertText(pack?.id, 'pack.id')
  assertText(pack?.title, 'pack.title')
  assertText(pack?.swedishTitle, 'pack.swedishTitle')
  assertText(pack?.description, 'pack.description')
  assertText(pack?.level, 'pack.level')
  assertText(pack?.accent, 'pack.accent')
  assertText(pack?.category, 'pack.category')
  assertText(pack?.cover, 'pack.cover')
  if (!allowedCategories.has(pack.category)) throw new Error('Invalid course pack field: pack.category')
  if (!allowedCovers.has(pack.cover)) throw new Error('Invalid course pack field: pack.cover')
  assertTextList(pack?.tags, 'pack.tags')
  if (typeof pack?.learners !== 'number' || pack.learners < 0) throw new Error('Invalid course pack field: pack.learners')
  if (!Array.isArray(pack.courses) || pack.courses.length === 0) throw new Error('Course pack needs at least one lesson')

  const lessonIds = new Set<string>()
  const phrases = new Set<string>()
  let itemCount = 0
  pack.courses.forEach((course, courseIndex) => {
    assertText(course.id, `pack.courses[${courseIndex}].id`)
    if (lessonIds.has(course.id)) throw new Error(`Duplicate lesson id: ${course.id}`)
    lessonIds.add(course.id)
    assertText(course.eyebrow, `pack.courses[${courseIndex}].eyebrow`)
    assertText(course.title, `pack.courses[${courseIndex}].title`)
    assertText(course.description, `pack.courses[${courseIndex}].description`)
    assertText(course.level, `pack.courses[${courseIndex}].level`)
    assertText(course.accent, `pack.courses[${courseIndex}].accent`)
    if (!Array.isArray(course.words) || course.words.length === 0) throw new Error(`Lesson ${course.id} has no items`)
    course.words.forEach((word, wordIndex) => {
      assertText(word.swedish, `pack.courses[${courseIndex}].words[${wordIndex}].swedish`)
      assertText(word.chinese, `pack.courses[${courseIndex}].words[${wordIndex}].chinese`)
      assertText(word.example, `pack.courses[${courseIndex}].words[${wordIndex}].example`)
      assertText(word.exampleChinese, `pack.courses[${courseIndex}].words[${wordIndex}].exampleChinese`)
      const normalized = word.swedish.trim().toLocaleLowerCase('sv')
      if (phrases.has(normalized)) throw new Error(`Duplicate Swedish phrase: ${word.swedish}`)
      phrases.add(normalized)
      itemCount += 1
    })
  })
  if (expectedItems !== undefined && itemCount !== expectedItems) {
    throw new Error(`Expected ${expectedItems} items, found ${itemCount}`)
  }

  return {
    ...pack,
    contentVersion: file.contentVersion,
    sources: file.sources,
  }
}
