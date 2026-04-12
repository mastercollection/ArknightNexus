import type { Ref } from 'vue'
import type { OperatorDetail, OperatorTalent, OperatorTrait } from '~/types/operator'
import type {
  PotentialItemViewModel,
  TalentCardViewModel,
  TraitItemViewModel,
} from '~/types/operator-view'
import { computed } from 'vue'
import { i18n, translateSecondsValue } from '~/i18n'
import { getOperatorStats } from '~/services/operators'
import { buildPotentialDiffDisplay } from './usePotentialDiffDisplay'
import { parseRichDescription } from './useRichDescription'
import { useSkillComparisonRows } from './useSkillComparisonRows'

const potentialIcons = {
  1: new URL('../assets/icons/potential/1.png', import.meta.url).href,
  2: new URL('../assets/icons/potential/2.png', import.meta.url).href,
  3: new URL('../assets/icons/potential/3.png', import.meta.url).href,
  4: new URL('../assets/icons/potential/4.png', import.meta.url).href,
  5: new URL('../assets/icons/potential/5.png', import.meta.url).href,
  6: new URL('../assets/icons/potential/6.png', import.meta.url).href,
} as const

export function useOperatorDetailViewModel(
  operator: Ref<OperatorDetail | undefined>,
  elite: Ref<number>,
  level: Ref<number>,
  selectedSkillId: Ref<string | undefined>,
  abilitiesEliteTab: Ref<number>,
) {
  const eliteOptions = computed(() => {
    return operator.value?.eliteCaps.map((maxLevel, index) => ({
      label: `정예 ${index}`,
      value: index,
      maxLevel,
    })) ?? []
  })

  const eliteTabOptions = computed(() => {
    return operator.value?.eliteCaps.map((maxLevel, index) => ({
      label: `E${index}`,
      value: index,
      maxLevel,
    })) ?? []
  })

  const maxLevel = computed(() => operator.value?.eliteCaps[elite.value] ?? 1)

  const currentStats = computed(() => {
    if (!operator.value)
      return null

    return getOperatorStats(operator.value, elite.value, level.value)
  })

  const statCards = computed(() => {
    if (!currentStats.value)
      return []

    return [
      { key: 'hp', value: currentStats.value.hp },
      { key: 'atk', value: currentStats.value.attack },
      { key: 'def', value: currentStats.value.defense },
      { key: 'magic_res', value: currentStats.value.resistance },
      { key: 'cost', value: currentStats.value.dpCost },
      { key: 'block_cnt', value: currentStats.value.block },
      { key: 'respawn_time', value: translateSecondsValue(currentStats.value.redeployTime) },
      { key: 'attack_interval', value: translateSecondsValue(currentStats.value.attackInterval.toFixed(1)) },
    ]
  })

  const advancedStats = computed(() => {
    return [] as Array<{ label: string, value: string | number }>
  })

  const traits = computed<TraitItemViewModel[]>(() => {
    const selectedTraits = selectActiveTraits(operator.value?.traits ?? [], abilitiesEliteTab.value)

    if (!selectedTraits.length && operator.value?.archetypeDescription?.trim()) {
      return [{
        key: 'archetype-fallback',
        descriptionSegments: parseRichDescription(operator.value.archetypeDescription, []),
        conditionLabel: i18n.global.t('operatorDetail.labels.commonTrait'),
      }]
    }

    return selectedTraits.map(trait => ({
      key: `${trait.groupKey}-${trait.elite}-${trait.level}-${trait.requiredPotentialRank}`,
      descriptionSegments: parseRichDescription(trait.description, trait.blackboard),
      conditionLabel: `${i18n.global.t('operatorDetail.labels.eliteShort', { elite: trait.elite })} ${i18n.global.t('operatorDetail.labels.conditionLevel', { level: trait.level })}`,
      conditionElite: trait.elite,
      conditionLevel: trait.level,
      potentialLabel: trait.requiredPotentialRank > 0
        ? i18n.global.t('operatorDetail.labels.potentialValue', { value: trait.requiredPotentialRank + 1 })
        : undefined,
    }))
  })

  const talents = computed<TalentCardViewModel[]>(() => {
    return mergeTalentCards(selectActiveTalents(operator.value?.talents ?? [], abilitiesEliteTab.value))
  })

  const potentials = computed<PotentialItemViewModel[]>(() => {
    return operator.value?.potentials.map(potential => ({
      key: `${potential.rank}-${potential.description}`,
      rankLabel: i18n.global.t('operatorDetail.labels.potentialStage', { rank: potential.rank }),
      iconSrc: potentialIcons[potential.rank as keyof typeof potentialIcons] ?? potentialIcons[1],
      description: potential.description,
    })) ?? []
  })

  const selectedSkill = computed(() => {
    return operator.value?.skills.find(skill => skill.id === selectedSkillId.value) ?? operator.value?.skills[0]
  })

  const selectedSkillMetricRows = useSkillComparisonRows(selectedSkill)

  return {
    eliteOptions,
    eliteTabOptions,
    maxLevel,
    statCards,
    advancedStats,
    traits,
    talents,
    potentials,
    selectedSkill,
    selectedSkillMetricRows,
  }
}

function selectActiveTraits(traits: OperatorTrait[], selectedElite: number) {
  return selectHighestCandidates(
    traits.filter(trait => trait.elite <= selectedElite),
    trait => trait.groupKey,
  )
}

function selectActiveTalents(talents: OperatorTalent[], selectedElite: number) {
  return dedupeByCondition(
    talents.filter(talent => talent.elite === selectedElite),
    talent => `${talent.groupKey}:${talent.elite}:${talent.level}:${talent.requiredPotentialRank}`,
  ).sort((left, right) => {
    return left.groupKey.localeCompare(right.groupKey)
      || left.elite - right.elite
      || left.level - right.level
      || left.requiredPotentialRank - right.requiredPotentialRank
  })
}

function selectHighestCandidates<T extends {
  elite: number
  level: number
  requiredPotentialRank: number
}>(
  items: T[],
  getGroupKey: (item: T) => string,
) {
  const groups = new Map<string, T>()

  items.forEach((item) => {
    const key = getGroupKey(item)
    const existing = groups.get(key)
    if (!existing || compareCandidatePriority(item, existing) > 0)
      groups.set(key, item)
  })

  return Array.from(groups.values()).sort((left, right) => {
    return getGroupKey(left).localeCompare(getGroupKey(right))
  })
}

function compareCandidatePriority(
  left: { elite: number, level: number, requiredPotentialRank: number },
  right: { elite: number, level: number, requiredPotentialRank: number },
) {
  return left.elite - right.elite
    || left.level - right.level
    || left.requiredPotentialRank - right.requiredPotentialRank
}

function dedupeByCondition<T>(
  items: T[],
  getKey: (item: T) => string,
) {
  const groups = new Map<string, T>()

  items.forEach((item) => {
    groups.set(getKey(item), item)
  })

  return Array.from(groups.values())
}

function mergeTalentCards(talents: OperatorTalent[]): TalentCardViewModel[] {
  const groups = new Map<string, OperatorTalent[]>()

  talents.forEach((talent) => {
    const key = `${talent.groupKey}:${talent.elite}:${talent.level}`
    const group = groups.get(key) ?? []
    group.push(talent)
    groups.set(key, group)
  })

  return Array.from(groups.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, group]) => buildTalentCardViewModel(key, group))
}

function buildTalentCardViewModel(key: string, talents: OperatorTalent[]): TalentCardViewModel {
  const sortedTalents = [...talents].sort((left, right) => {
    return left.requiredPotentialRank - right.requiredPotentialRank
      || compareCandidatePriority(left, right)
  })
  const fallbackTalent = sortedTalents[0]
  if (!fallbackTalent) {
    return {
      key,
      name: '',
      baseDescriptionSegments: [],
      conditionLabel: '',
      potentialVariants: [],
    }
  }

  const baseTalent = sortedTalents.find(talent => talent.requiredPotentialRank === 0) ?? fallbackTalent
  const potentialDiffDisplay = buildPotentialDiffDisplay({
    candidates: sortedTalents,
    keyPrefix: key,
    getPotentialLabel: requiredPotentialRank =>
      i18n.global.t('operatorDetail.labels.potentialValue', { value: requiredPotentialRank + 1 }),
    getPotentialIconSrc: requiredPotentialRank =>
      potentialIcons[(requiredPotentialRank + 1) as keyof typeof potentialIcons] ?? potentialIcons[1],
  })

  return {
    key,
    name: baseTalent.name,
    baseDescriptionSegments: potentialDiffDisplay.baseDescriptionSegments,
    conditionLabel: `${i18n.global.t('operatorDetail.labels.eliteShort', { elite: baseTalent.elite })} ${i18n.global.t('operatorDetail.labels.conditionLevel', { level: baseTalent.level })}`,
    conditionElite: baseTalent.elite,
    conditionLevel: baseTalent.level,
    basePotentialLabel: potentialDiffDisplay.basePotentialLabel,
    potentialVariants: potentialDiffDisplay.potentialVariants,
  }
}
