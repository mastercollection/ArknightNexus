export interface RichInlineBadge {
  text: string
  iconSrc?: string
}

export type RichTextSegment
  = | { type: 'text', text: string }
    | { type: 'value', text: string, badges?: RichInlineBadge[], annotationKey?: string }
    | { type: 'highlight', children: RichTextSegment[] }
    | { type: 'term', key: string, text: string, badges?: RichInlineBadge[], annotationKey?: string }

export interface SkillComparisonRow {
  key: string
  label: string
  values: string[]
}

export interface TalentPotentialVariantViewModel {
  key: string
  potentialLabel: string
  fallbackDescriptionSegments?: RichTextSegment[]
}

export interface TalentCardViewModel {
  key: string
  name: string
  baseDescriptionSegments: RichTextSegment[]
  conditionLabel: string
  conditionElite?: number
  conditionLevel?: number
  basePotentialLabel?: string
  potentialVariants: TalentPotentialVariantViewModel[]
}

export interface PotentialItemViewModel {
  key: string
  rankLabel: string
  iconSrc: string
  description: string
}

export interface TraitItemViewModel {
  key: string
  descriptionSegments: RichTextSegment[]
  conditionLabel: string
  conditionElite?: number
  conditionLevel?: number
  potentialLabel?: string
}
