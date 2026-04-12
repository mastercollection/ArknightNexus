import type { OperatorBlackboardEntry } from '~/types/operator'
import type { RichInlineBadge, RichTextSegment } from '~/types/operator-view'

type RichDescriptionAnnotations = Record<string, RichInlineBadge[]>

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatNumber(value: number) {
  if (Number.isInteger(value))
    return String(value)

  return value.toFixed(3).replace(/\.?0+$/, '')
}

function lookupBlackboardEntry(blackboard: OperatorBlackboardEntry[], key: string) {
  return blackboard.find(item => item.key.trim() === key)
}

function lookupBlackboardText(blackboard: OperatorBlackboardEntry[], key: string) {
  const entry = lookupBlackboardEntry(blackboard, key)
  if (!entry)
    return null

  const valueStr = entry.valueStr?.trim()
  if (valueStr)
    return valueStr

  return entry.value == null ? null : formatNumber(entry.value)
}

function lookupBlackboardPercent(blackboard: OperatorBlackboardEntry[], key: string) {
  const entry = lookupBlackboardEntry(blackboard, key)
  if (!entry || entry.value == null)
    return null

  return `${formatNumber(entry.value * 100)}%`
}

function resolveMarkupContent(content: string, blackboard: OperatorBlackboardEntry[]) {
  const trimmed = content.trim()
  const separatorIndex = trimmed.indexOf(':')
  const key = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : undefined
  const format = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : undefined

  if (format === '0%' && key) {
    const percent = lookupBlackboardPercent(blackboard, key.trim())
    if (percent)
      return escapeHtml(percent)
  }

  const directMatch = lookupBlackboardText(blackboard, trimmed)
  if (directMatch)
    return directMatch

  return resolvePlainTextContent(content, blackboard)
}

function resolvePlaceholderToken(token: string, blackboard: OperatorBlackboardEntry[]) {
  const trimmed = token.trim()
  const separatorIndex = trimmed.indexOf(':')
  const key = separatorIndex >= 0 ? trimmed.slice(0, separatorIndex) : trimmed
  const format = separatorIndex >= 0 ? trimmed.slice(separatorIndex + 1) : undefined

  if (format === '0%') {
    const percent = lookupBlackboardPercent(blackboard, key.trim())
    if (percent)
      return percent
  }

  const text = lookupBlackboardText(blackboard, key.trim())
  if (text)
    return text

  return `{${token}}`
}

function getTokenAnnotationKey(token: string) {
  return token.trim()
}

function resolvePlainTextContent(text: string, blackboard: OperatorBlackboardEntry[]) {
  let output = ''
  let cursor = 0
  const pattern = /\{([^{}]+)\}/g

  while (true) {
    const match = pattern.exec(text)
    if (!match) {
      output += text.slice(cursor)
      return output
    }

    output += text.slice(cursor, match.index)
    output += resolvePlaceholderToken(match[1] ?? '', blackboard)
    cursor = match.index + match[0].length
  }
}

function appendTextSegment(segments: RichTextSegment[], text: string) {
  if (!text)
    return

  const previous = segments[segments.length - 1]
  if (previous?.type === 'text')
    previous.text += text
  else
    segments.push({ type: 'text', text })
}

function appendValueSegment(
  segments: RichTextSegment[],
  token: string,
  text: string,
  annotations: RichDescriptionAnnotations,
) {
  segments.push({
    type: 'value',
    text,
    badges: annotations[getTokenAnnotationKey(token)],
    annotationKey: getTokenAnnotationKey(token),
  })
}

function appendPlainTextSegments(
  segments: RichTextSegment[],
  text: string,
  blackboard: OperatorBlackboardEntry[],
  annotations: RichDescriptionAnnotations = {},
) {
  let cursor = 0
  const pattern = /\{([^{}]+)\}/g

  while (true) {
    const match = pattern.exec(text)
    if (!match) {
      appendTextSegment(segments, text.slice(cursor))
      return
    }

    appendTextSegment(segments, text.slice(cursor, match.index))
    appendValueSegment(
      segments,
      match[1] ?? '',
      resolvePlaceholderToken(match[1] ?? '', blackboard),
      annotations,
    )
    cursor = match.index + match[0].length
  }
}

function isBlueAccentTag(tagName: string) {
  return tagName.includes('ba.')
}

function isTermLinkTag(tagName: string) {
  return tagName.startsWith('$')
}

export function parseRichDescription(
  text: string,
  blackboard: OperatorBlackboardEntry[] = [],
  annotations: RichDescriptionAnnotations = {},
) {
  const segments: RichTextSegment[] = []
  let cursor = 0

  while (true) {
    const start = text.indexOf('<', cursor)
    if (start === -1) {
      appendPlainTextSegments(segments, text.slice(cursor), blackboard, annotations)
      return segments
    }

    appendPlainTextSegments(segments, text.slice(cursor, start), blackboard, annotations)
    const rest = text.slice(start)
    if (!(rest.startsWith('<@') || rest.startsWith('<$'))) {
      appendTextSegment(segments, '<')
      cursor = start + 1
      continue
    }

    const tagCloseOffset = rest.indexOf('>')
    if (tagCloseOffset === -1) {
      appendTextSegment(segments, rest)
      return segments
    }

    const tagName = rest.slice(1, tagCloseOffset)
    const contentStart = start + tagCloseOffset + 1
    const contentEnd = text.indexOf('</>', contentStart)
    if (contentEnd === -1) {
      appendTextSegment(segments, rest)
      return segments
    }

    const content = text.slice(contentStart, contentEnd)
    if (isTermLinkTag(tagName)) {
      const trimmedContent = content.trim()
      const placeholderToken = /^\{[^{}]+\}$/.test(trimmedContent)
        ? trimmedContent.slice(1, -1)
        : undefined
      segments.push({
        type: 'term',
        key: tagName.slice(1),
        text: resolveMarkupContent(content, blackboard),
        badges: placeholderToken ? annotations[getTokenAnnotationKey(placeholderToken)] : undefined,
        annotationKey: placeholderToken ? getTokenAnnotationKey(placeholderToken) : undefined,
      })
    }
    else if (isBlueAccentTag(tagName)) {
      segments.push({
        type: 'highlight',
        children: parseRichDescription(content, blackboard, annotations),
      })
    }
    else {
      appendPlainTextSegments(
        segments,
        resolveMarkupContent(content, blackboard),
        blackboard,
        annotations,
      )
    }

    cursor = contentEnd + 3
  }
}

export function formatRichDescription(
  text: string,
  blackboard: OperatorBlackboardEntry[] = [],
) {
  return parseRichDescription(text, blackboard)
}
