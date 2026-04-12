import type { OperatorBlackboardEntry } from '~/types/operator'
import type {
  RichInlineBadge,
  RichTextSegment,
  TalentPotentialVariantViewModel,
} from '~/types/operator-view'
import { parseRichDescription } from './useRichDescription'

const displayValueTokenPattern = /[+\-]?\d+(?:\.\d+)?%?(?:~[+\-]?\d+(?:\.\d+)?%?)?(?:\([+\-]?\d+(?:\.\d+)?%?(?:~[+\-]?\d+(?:\.\d+)?%?)?\))?/g

interface PotentialDiffCandidate {
  description: string
  requiredPotentialRank: number
  blackboard: OperatorBlackboardEntry[]
}

interface PotentialDiffOptions<T extends PotentialDiffCandidate> {
  candidates: T[]
  keyPrefix: string
  getPotentialLabel: (requiredPotentialRank: number) => string
  getPotentialIconSrc: (requiredPotentialRank: number) => string | undefined
}

export interface PotentialDiffDisplayResult {
  baseDescriptionSegments: RichTextSegment[]
  basePotentialLabel?: string
  potentialVariants: TalentPotentialVariantViewModel[]
}

export function buildPotentialDiffDisplay<T extends PotentialDiffCandidate>(
  options: PotentialDiffOptions<T>,
): PotentialDiffDisplayResult {
  const sortedCandidates = [...options.candidates].sort((left, right) => {
    return left.requiredPotentialRank - right.requiredPotentialRank
  })
  const fallbackCandidate = sortedCandidates[0]
  if (!fallbackCandidate) {
    return {
      baseDescriptionSegments: [],
      potentialVariants: [],
    }
  }

  const baseCandidate = sortedCandidates.find(candidate => candidate.requiredPotentialRank === 0) ?? fallbackCandidate
  const baseSegments = parseRichDescription(baseCandidate.description, baseCandidate.blackboard)
  const inlineBadgeMap = new Map<number, RichInlineBadge[]>()
  const baseSignature = getSegmentsSignature(baseSegments)
  const seenVariantSignatures = new Set<string>([baseSignature])
  const potentialVariants = sortedCandidates
    .filter(candidate => candidate !== baseCandidate && candidate.requiredPotentialRank > 0)
    .map((candidate): TalentPotentialVariantViewModel | null => {
      const descriptionSegments = parseRichDescription(candidate.description, candidate.blackboard)
      const signature = getSegmentsSignature(descriptionSegments)
      if (seenVariantSignatures.has(signature))
        return null

      seenVariantSignatures.add(signature)
      const potentialLabel = options.getPotentialLabel(candidate.requiredPotentialRank)
      const talpuBadges = extractTalpuBadgeTexts(candidate.description)
      const comparisonSegments = talpuBadges.length
        ? parseRichDescription(stripTalpuMarkup(candidate.description), candidate.blackboard)
        : descriptionSegments
      const inlineBadges = buildVariantDisplayDiffBadges(
        baseSegments,
        comparisonSegments,
        options.getPotentialIconSrc(candidate.requiredPotentialRank),
        talpuBadges,
      )

      if (inlineBadges) {
        inlineBadges.forEach((badges, index) => {
          inlineBadgeMap.set(index, [...(inlineBadgeMap.get(index) ?? []), ...badges])
        })
      }

      return {
        key: `${options.keyPrefix}:${candidate.requiredPotentialRank}`,
        potentialLabel,
        fallbackDescriptionSegments: inlineBadges ? undefined : descriptionSegments,
      }
    })
    .filter((variant): variant is TalentPotentialVariantViewModel => Boolean(variant))

  return {
    baseDescriptionSegments: applyInlineBadgesToSegments(baseSegments, inlineBadgeMap),
    basePotentialLabel: baseCandidate.requiredPotentialRank > 0
      ? options.getPotentialLabel(baseCandidate.requiredPotentialRank)
      : undefined,
    potentialVariants,
  }
}

function getSegmentsSignature(segments: ReturnType<typeof parseRichDescription>) {
  return JSON.stringify(segments)
}

function buildVariantDisplayDiffBadges(
  baseSegments: RichTextSegment[],
  variantSegments: RichTextSegment[],
  potentialIconSrc: string | undefined,
  talpuBadges: string[] = [],
) {
  const baseTokens = collectDisplayValueTokens(baseSegments)
  const variantTokens = collectDisplayValueTokens(variantSegments)
  if (baseTokens.length !== variantTokens.length)
    return null

  const badgesByIndex = new Map<number, RichInlineBadge[]>()
  let changedIndex = 0

  for (let index = 0; index < baseTokens.length; index += 1) {
    const baseToken = baseTokens[index]
    const variantToken = variantTokens[index]
    if (!baseToken || !variantToken || baseToken.value === variantToken.value)
      continue

    const talpuBadge = talpuBadges[changedIndex]
    const delta = talpuBadge || summarizeDisplayTokenDelta(baseToken.value, variantToken.value)
    const badgeText = talpuBadge
      ? `${variantToken.value}${talpuBadge}`
      : delta
        ? `${variantToken.value}(${delta})`
        : variantToken.value

    badgesByIndex.set(index, [
      ...(badgesByIndex.get(index) ?? []),
      { text: badgeText, iconSrc: potentialIconSrc },
    ])
    changedIndex += 1
  }

  return badgesByIndex.size ? badgesByIndex : null
}

function collectDisplayValueTokens(segments: RichTextSegment[]) {
  const values: Array<{ value: string }> = []
  const flattenedTexts = flattenDisplayTexts(segments)
  let pendingToken = ''

  flattenedTexts.forEach((text) => {
    const matches = text.match(displayValueTokenPattern) ?? []
    matches.forEach((match) => {
      if (pendingToken && /^\([+\-]?\d/.test(match)) {
        pendingToken += match
        values.push({ value: pendingToken })
        pendingToken = ''
        return
      }

      if (/[+\-]?\d(?:\.\d+)?%?$/.test(match) && !/\)$/.test(match)) {
        if (pendingToken)
          values.push({ value: pendingToken })
        pendingToken = match
        return
      }

      if (pendingToken) {
        values.push({ value: pendingToken })
        pendingToken = ''
      }

      values.push({ value: match })
    })
  })

  if (pendingToken)
    values.push({ value: pendingToken })

  return values
}

function flattenDisplayTexts(segments: RichTextSegment[]) {
  const texts: string[] = []

  segments.forEach((segment) => {
    if (segment.type === 'highlight') {
      texts.push(...flattenDisplayTexts(segment.children))
      return
    }

    if (segment.type === 'text' || segment.type === 'value' || segment.type === 'term')
      texts.push(segment.text)
  })

  return texts
}

function summarizeDisplayTokenDelta(baseToken: string, variantToken: string) {
  const inlineDeltaMatch = variantToken.match(/\(([+\-]?\d+(?:\.\d+)?%?(?:~[+\-]?\d+(?:\.\d+)?%?)?)\)$/)
  if (inlineDeltaMatch?.[1])
    return inlineDeltaMatch[1]

  const numberPattern = /-?\d+(?:\.\d+)?/g
  const baseNumbers = baseToken.match(numberPattern)
  const variantNumbers = variantToken.match(numberPattern)
  if (!baseNumbers || !variantNumbers || baseNumbers.length !== variantNumbers.length)
    return null

  const baseSkeleton = baseToken.replace(numberPattern, '#')
  const variantSkeleton = variantToken.replace(numberPattern, '#')
  if (baseSkeleton !== variantSkeleton)
    return null

  const deltas = baseNumbers.map((baseNumber, index) => {
    const variantNumber = variantNumbers[index]
    if (!variantNumber)
      return null

    const delta = Number(variantNumber) - Number(baseNumber)
    if (!Number.isFinite(delta))
      return null

    return formatSignedNumber(delta)
  })

  if (deltas.some(delta => !delta))
    return null

  let diffIndex = 0
  return baseSkeleton.replace(/#/g, () => deltas[diffIndex++] ?? '')
}

function applyInlineBadgesToSegments(
  segments: RichTextSegment[],
  badgesByTokenIndex: Map<number, RichInlineBadge[]>,
) {
  const tokenState = { index: 0 }
  return segments.flatMap(segment => applyInlineBadgesToSegment(segment, badgesByTokenIndex, tokenState))
}

function applyInlineBadgesToSegment(
  segment: RichTextSegment,
  badgesByTokenIndex: Map<number, RichInlineBadge[]>,
  tokenState: { index: number },
): RichTextSegment[] {
  if (segment.type === 'highlight') {
    return [{
      ...segment,
      children: segment.children.flatMap(child => applyInlineBadgesToSegment(child, badgesByTokenIndex, tokenState)),
    }]
  }

  if (segment.type === 'term') {
    const tokenCount = countDisplayTokens(segment.text)
    if (tokenCount === 1) {
      const badges = badgesByTokenIndex.get(tokenState.index)
      tokenState.index += 1
      return badges?.length ? [{ ...segment, badges }] : [segment]
    }

    tokenState.index += tokenCount
    return [segment]
  }

  if (segment.type !== 'text' && segment.type !== 'value')
    return [segment]

  return splitSegmentTextWithBadges(segment.text, badgesByTokenIndex, tokenState)
}

function splitSegmentTextWithBadges(
  text: string,
  badgesByTokenIndex: Map<number, RichInlineBadge[]>,
  tokenState: { index: number },
) {
  const parts: RichTextSegment[] = []
  let cursor = 0
  displayValueTokenPattern.lastIndex = 0

  while (true) {
    const match = displayValueTokenPattern.exec(text)
    if (!match) {
      if (cursor < text.length)
        parts.push({ type: 'text', text: text.slice(cursor) })
      return parts
    }

    if (match.index > cursor)
      parts.push({ type: 'text', text: text.slice(cursor, match.index) })

    parts.push({
      type: 'value',
      text: match[0],
      badges: badgesByTokenIndex.get(tokenState.index),
    })

    tokenState.index += 1
    cursor = match.index + match[0].length
  }
}

function countDisplayTokens(text: string) {
  return text.match(displayValueTokenPattern)?.length ?? 0
}

function extractTalpuBadgeTexts(text: string) {
  return Array.from(text.matchAll(/<@ba\.talpu>(.*?)<\/>/g))
    .map(match => (match[1] ?? '').trim())
    .filter(Boolean)
}

function stripTalpuMarkup(text: string) {
  return text.replace(/<@ba\.talpu>.*?<\/>/g, '')
}

function formatDisplayNumber(value: number) {
  if (Number.isInteger(value))
    return String(value)

  return value
    .toFixed(4)
    .replace(/\.?0+$/, '')
}

function formatSignedNumber(value: number) {
  const displayValue = formatDisplayNumber(value)
  return value > 0 ? `+${displayValue}` : displayValue
}
