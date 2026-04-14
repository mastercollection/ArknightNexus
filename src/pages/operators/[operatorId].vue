<script setup lang="ts">
import type {
  OperatorBlackboardEntry,
  OperatorDetail,
  OperatorModule,
  OperatorModuleTalentCandidate,
  OperatorModuleTraitCandidate,
  OperatorRange,
  RegionTerms,
} from '~/types/operator'
import type { RichTextSegment, TalentPotentialVariantViewModel } from '~/types/operator-view'
import { ArrowLeft, Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import elitePhase0Icon from '~/assets/icons/elite/0.webp'
import elitePhase1Icon from '~/assets/icons/elite/1.webp'
import elitePhase2Icon from '~/assets/icons/elite/2.webp'
import potentialLevel1Icon from '~/assets/icons/potential/1.png'
import potentialLevel2Icon from '~/assets/icons/potential/2.png'
import potentialLevel3Icon from '~/assets/icons/potential/3.png'
import potentialLevel4Icon from '~/assets/icons/potential/4.png'
import potentialLevel5Icon from '~/assets/icons/potential/5.png'
import potentialLevel6Icon from '~/assets/icons/potential/6.png'
import masteryLevel8Icon from '~/assets/icons/skill/8.png'
import masteryLevel9Icon from '~/assets/icons/skill/9.png'
import masteryLevel10Icon from '~/assets/icons/skill/10.png'
import { useAutoPersist, useOperatorDetailViewModel, useRegionPreference } from '~/composables'
import { buildPotentialDiffDisplay } from '~/composables/usePotentialDiffDisplay'
import { parseRichDescription } from '~/composables/useRichDescription'
import {
  translateProfession,
  translateSkillActivation,
  translateSkillRecovery,
  translateStatLabel,
} from '~/i18n'
import {
  getOperatorById,
  getRegionTerms,
  getUserFavorites,
  prefetchImages,
  resolveImageSource,
  toggleOperatorFavorite,
} from '~/services/operators'

type DetailSectionKey = 'stats' | 'abilities' | 'potentials' | 'modules' | 'skills'

interface RangeMatrixCell {
  key: string
  isActive: boolean
  isOrigin: boolean
}

interface RangeMatrix {
  id: string
  columnCount: number
  rows: RangeMatrixCell[][]
}

interface ModuleStatBonusItem {
  key: string
  label: string
  value: string
}

interface ModuleEffectCandidateViewModel {
  key: string
  title: string
  conditionElite: number
  conditionLevel: number
  baseDescriptionSegments: RichTextSegment[]
  basePotentialLabel?: string
  potentialVariants: Array<TalentPotentialVariantViewModel & { rangeMatrix?: RangeMatrix | null }>
  rangeMatrix: RangeMatrix | null
}

interface ModuleEffectPartViewModel {
  target: string
  traitGroups: ModuleEffectCandidateViewModel[]
  talentGroups: ModuleEffectCandidateViewModel[]
}

const masteryLevelIcons: Record<number, string> = {
  8: masteryLevel8Icon,
  9: masteryLevel9Icon,
  10: masteryLevel10Icon,
}

const elitePhaseIcons: Record<number, string> = {
  0: elitePhase0Icon,
  1: elitePhase1Icon,
  2: elitePhase2Icon,
}

const potentialIcons: Record<number, string> = {
  1: potentialLevel1Icon,
  2: potentialLevel2Icon,
  3: potentialLevel3Icon,
  4: potentialLevel4Icon,
  5: potentialLevel5Icon,
  6: potentialLevel6Icon,
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { region } = useRegionPreference()

const routeParams = route.params as { operatorId?: string }
const operator = ref<OperatorDetail>()
const isLoading = ref(true)
const errorMessage = ref('')
const isFavorite = ref(false)
const moduleTypeIconSources = ref<Record<string, string>>({})
const moduleEquipIconSources = ref<Record<string, string>>({})
const skillIconSources = ref<Record<string, string>>({})

const elite = ref(0)
const level = ref(1)
const selectedSkillId = ref<string>()
const selectedModuleId = ref<string>()
const selectedModuleBattleLevel = ref(1)
const selectedSkillLevel = ref(1)
const abilitiesEliteTab = ref(0)
const regionTerms = ref<RegionTerms>({})
const termSheetOpen = ref(false)
const activeTermLabel = ref('')
const activeTermDescription = ref('')
const nameElement = ref<HTMLElement>()
const skillTableScroller = ref<HTMLElement>()
const statsSection = ref<HTMLElement>()
const abilitiesSection = ref<HTMLElement>()
const potentialsSection = ref<HTMLElement>()
const modulesSection = ref<HTMLElement>()
const skillsSection = ref<HTMLElement>()
const nameFontSize = ref(48)
const currentSection = ref<DetailSectionKey>('stats')
const activeDetailPanels = ref<DetailSectionKey[]>([
  'stats',
  'abilities',
  'potentials',
  'modules',
  'skills',
])
let sectionObserver: IntersectionObserver | null = null
const {
  markPersisted: markFavoritePersisted,
  runWithoutTracking: runFavoriteWithoutTracking,
} = useAutoPersist({
  source: isFavorite,
  delay: 250,
  enabled: () => Boolean(operator.value?.id),
  persist: async (desiredValue) => {
    if (!operator.value)
      return desiredValue

    const persistedValue = await toggleOperatorFavorite(operator.value.id)
    if (persistedValue === desiredValue)
      return persistedValue

    return toggleOperatorFavorite(operator.value.id)
  },
  applyPersisted: (persistedValue) => {
    isFavorite.value = persistedValue
  },
  onError: () => {
    ElMessage.info(t('operatorDetail.messages.favoriteFailed'))
  },
})
const activeTermSegments = computed(() => parseRichDescription(activeTermDescription.value, []))
const currentSectionLabel = computed(() => {
  const labels: Record<DetailSectionKey, string> = {
    stats: t('operatorDetail.sections.stats'),
    abilities: t('operatorDetail.sections.abilities'),
    potentials: t('operatorDetail.sections.potentials'),
    modules: t('operatorDetail.sections.modules'),
    skills: t('operatorDetail.sections.skills'),
  }
  return labels[currentSection.value]
})
const selectedSkillLevelInfo = computed(() => {
  const skill = selectedSkill.value
  if (!skill)
    return undefined

  return (
    skill.levels.find(levelInfo => levelInfo.level === selectedSkillLevel.value)
    ?? skill.levels[0]
  )
})
const selectedSkillDescriptionSegments = computed(() => {
  const levelInfo = selectedSkillLevelInfo.value
  if (!levelInfo)
    return []

  return parseRichDescription(levelInfo.description, levelInfo.blackboard)
})
const selectedSkillUnlockElite = computed(() => selectedSkill.value?.unlockElite)
const selectedSkillUnlockLevel = computed(() => selectedSkill.value?.unlockLevel)
const professionLabel = computed(() => {
  return operator.value ? translateProfession(operator.value.profession) : ''
})
const selectedSkillRecoveryLabel = computed(() => {
  return selectedSkill.value ? translateSkillRecovery(selectedSkill.value.recoveryType) : ''
})
const selectedSkillActivationLabel = computed(() => {
  return selectedSkill.value ? translateSkillActivation(selectedSkill.value.activationType) : ''
})
const selectedAbilityRange = computed(() => {
  return operator.value?.stats[abilitiesEliteTab.value]?.range ?? null
})
const selectedSkillRange = computed(() => {
  return selectedSkillLevelInfo.value?.range ?? null
})
const abilityRangeMatrix = computed(() => buildRangeMatrix(selectedAbilityRange.value))
const skillRangeMatrix = computed(() => buildRangeMatrix(selectedSkillRange.value))
const selectedModule = computed(() => {
  const modules = operator.value?.modules ?? []
  return modules.find(module => module.uniEquipId === selectedModuleId.value) ?? modules[0]
})
const selectedModuleBattlePhaseOptions = computed(() => {
  return selectedModule.value?.battlePhases.map(phase => ({
    label: String(phase.equipLevel),
    value: phase.equipLevel,
  })) ?? []
})
const selectedModuleBattlePhase = computed(() => {
  const phases = selectedModule.value?.battlePhases ?? []
  return phases.find(phase => phase.equipLevel === selectedModuleBattleLevel.value) ?? phases[0]
})
const selectedModuleFavorPercent = computed(() => {
  const favorPercent = Number(
    selectedModule.value?.unlockFavorPercents?.[String(selectedModuleBattleLevel.value)] ?? 0,
  )

  if (!Number.isFinite(favorPercent) || favorPercent <= 0)
    return undefined

  return favorPercent
})
const selectedModuleStatBonuses = computed<ModuleStatBonusItem[]>(() => {
  return selectedModuleBattlePhase.value?.attributeBlackboard
    .map(entry => normalizeModuleStatBonus(entry))
    .filter((entry): entry is ModuleStatBonusItem => Boolean(entry)) ?? []
})
const selectedModuleEffectParts = computed(() => {
  return selectedModuleBattlePhase.value?.parts
    .map((part): ModuleEffectPartViewModel => ({
      target: part.target,
      traitGroups: mergeModuleTraitGroups(part.traitCandidates),
      talentGroups: mergeModuleTalentGroups(part.talentCandidates),
    }))
    .filter(part => part.traitGroups.length || part.talentGroups.length) ?? []
})

const {
  eliteOptions,
  eliteTabOptions,
  maxLevel,
  statCards,
  traits,
  talents,
  potentials,
  selectedSkill,
  selectedSkillMetricRows,
} = useOperatorDetailViewModel(operator, elite, level, selectedSkillId, abilitiesEliteTab)

watchEffect(() => {
  const currentOperator = operator.value
  if (!currentOperator)
    return

  if (!currentOperator.eliteCaps[elite.value])
    elite.value = 0

  const maxLevel = currentOperator.eliteCaps[elite.value] ?? 1
  if (level.value > maxLevel)
    level.value = maxLevel

  if (!selectedSkillId.value)
    selectedSkillId.value = currentOperator.skills[0]?.id

  if (!currentOperator.modules.some(module => module.uniEquipId === selectedModuleId.value))
    selectedModuleId.value = currentOperator.modules[0]?.uniEquipId

  const modulePhases = selectedModule.value?.battlePhases ?? []
  if (!modulePhases.some(phase => phase.equipLevel === selectedModuleBattleLevel.value))
    selectedModuleBattleLevel.value = modulePhases[0]?.equipLevel ?? 1

  const availableLevels = selectedSkill.value?.levels.length ?? 1
  if (selectedSkillLevel.value > availableLevels)
    selectedSkillLevel.value = availableLevels
})

watch(elite, () => {
  level.value = Math.min(level.value, maxLevel.value)
})

watch(selectedSkillId, () => {
  selectedSkillLevel.value = 1
})

watch(selectedSkillLevel, async () => {
  await nextTick()
  scrollSkillTableToSelectedLevel()
})

onMounted(() => {
  loadOperator()
  window.addEventListener('resize', fitOperatorName)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', fitOperatorName)
  sectionObserver?.disconnect()
})

async function loadOperator() {
  const operatorId = String(routeParams.operatorId ?? '')
  isLoading.value = true
  errorMessage.value = ''

  try {
    operator.value = await getOperatorById(operatorId, region.value)
    regionTerms.value = await getRegionTerms(region.value)
    const favorites = await getUserFavorites()
    runFavoriteWithoutTracking(() => {
      isFavorite.value = favorites.includes(operatorId)
    })
    markFavoritePersisted(isFavorite.value)
    if (operator.value?.id) {
      try {
        await prefetchImages([{
          kind: 'portrait',
          id: operator.value.id,
        }])
      }
      catch {
        // 초상화 컴포넌트가 자체 fallback을 가진다.
      }
    }
    await loadSkillIconSources(operator.value?.skills ?? [])
    await loadModuleImageSources(operator.value?.modules ?? [])
    abilitiesEliteTab.value = elite.value
    await nextTick()
    fitOperatorName()
    setupSectionObserver()
  }
  catch (error) {
    operator.value = undefined
    errorMessage.value = String(error)
  }
  finally {
    isLoading.value = false
  }
}

watch(
  () => [routeParams.operatorId, region.value],
  () => {
    loadOperator()
  },
)

function handleTermSelection({ key, label }: { key: string, label: string }) {
  const description = regionTerms.value[key]
  if (!description)
    return

  activeTermLabel.value = label
  activeTermDescription.value = description
  termSheetOpen.value = true
}

function fitOperatorName() {
  const element = nameElement.value
  if (!element)
    return

  let size = Math.min(window.innerWidth >= 768 ? 48 : 40, 48)
  element.style.fontSize = `${size}px`

  while (element.scrollWidth > element.clientWidth && size > 24) {
    size -= 1
    element.style.fontSize = `${size}px`
  }

  nameFontSize.value = size
}

function scrollSkillTableToSelectedLevel() {
  const scroller = skillTableScroller.value
  if (!scroller)
    return

  if (selectedSkillLevel.value === 1) {
    scroller.scrollTo({
      left: 0,
      behavior: 'smooth',
    })
    return
  }

  const activeHeader = scroller.querySelector<HTMLElement>(
    `[data-skill-level="${selectedSkillLevel.value}"]`,
  )
  if (!activeHeader)
    return

  const stickyOffset = 92
  const targetLeft = Math.max(0, activeHeader.offsetLeft - stickyOffset)

  scroller.scrollTo({
    left: targetLeft,
    behavior: 'smooth',
  })
}

function setupSectionObserver() {
  sectionObserver?.disconnect()

  const sections = [
    { key: 'stats', element: statsSection.value },
    { key: 'abilities', element: abilitiesSection.value },
    { key: 'potentials', element: potentialsSection.value },
    { key: 'modules', element: modulesSection.value },
    { key: 'skills', element: skillsSection.value },
  ].filter((section): section is { key: DetailSectionKey, element: HTMLElement } =>
    Boolean(section.element),
  )

  if (!sections.length)
    return

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const activeEntry = entries
        .filter(entry => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

      if (!activeEntry)
        return

      const sectionKey = activeEntry.target.getAttribute('data-section') as DetailSectionKey | null
      if (sectionKey)
        currentSection.value = sectionKey
    },
    {
      rootMargin: '-88px 0px -45% 0px',
      threshold: [0.15, 0.35, 0.6],
    },
  )

  sections.forEach(({ element }) => {
    sectionObserver?.observe(element)
  })
}

async function toggleFavorite() {
  if (!operator.value)
    return

  isFavorite.value = !isFavorite.value
}

function buildRangeMatrix(range: OperatorRange | null | undefined): RangeMatrix | null {
  if (!range)
    return null

  const activeCells = new Set(range.grids.map(grid => `${grid.row}:${grid.col}`))
  const allRows = [0, ...range.grids.map(grid => grid.row)]
  const allCols = [0, ...range.grids.map(grid => grid.col)]
  const minRow = Math.min(...allRows)
  const maxRow = Math.max(...allRows)
  const minCol = Math.min(...allCols)
  const maxCol = Math.max(...allCols)
  const rows: RangeMatrixCell[][] = []

  for (let row = maxRow; row >= minRow; row -= 1) {
    const cells: RangeMatrixCell[] = []

    for (let col = minCol; col <= maxCol; col += 1) {
      cells.push({
        key: `${row}:${col}`,
        isActive: activeCells.has(`${row}:${col}`),
        isOrigin: row === 0 && col === 0,
      })
    }

    rows.push(cells)
  }

  return {
    id: range.id,
    columnCount: maxCol - minCol + 1,
    rows,
  }
}

function getSkillLevelIcon(level: number) {
  return masteryLevelIcons[level]
}

function getElitePhaseIcon(elite: number) {
  return elitePhaseIcons[elite]
}

function getElitePhaseFromCode(phase: string | undefined) {
  switch (phase) {
    case 'PHASE_0':
      return 0
    case 'PHASE_1':
      return 1
    case 'PHASE_2':
      return 2
    default:
      return undefined
  }
}

function getModuleEquipRequestId(module: OperatorModule | undefined) {
  const icon = module?.uniEquipIcon?.trim()
  if (!icon)
    return undefined

  if (module?.typeIcon?.trim().toLowerCase() === 'original')
    return 'original'

  return icon
}

function normalizeModuleStatBonus(entry: OperatorBlackboardEntry): ModuleStatBonusItem | null {
  const key = entry.key.trim()
  if (!key)
    return null

  return {
    key,
    label: getModuleStatLabel(key),
    value: formatModuleStatValue(entry),
  }
}

function getModuleStatLabel(key: string) {
  const statKeyMap: Record<string, string> = {
    max_hp: 'hp',
    atk: 'atk',
    def: 'def',
    magic_resistance: 'magic_res',
    magic_res: 'magic_res',
    cost: 'cost',
    block_cnt: 'block_cnt',
    respawn_time: 'respawn_time',
    attack_interval: 'attack_interval',
    hp_recovery_per_sec: 'hp_recovery_per_sec',
  }

  const mappedKey = statKeyMap[key]
  if (mappedKey)
    return translateStatLabel(mappedKey)

  return humanizeModuleKey(key)
}

function formatModuleStatValue(entry: OperatorBlackboardEntry) {
  if (entry.valueStr?.trim())
    return prefixModuleValue(entry.valueStr.trim())

  const value = entry.value ?? 0
  const displayValue = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return prefixModuleValue(displayValue)
}

function prefixModuleValue(value: string) {
  return value.startsWith('-') || value.startsWith('+') ? value : `+${value}`
}

function humanizeModuleKey(value: string) {
  return value
    .trim()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function getModuleTargetLabel(target: string) {
  switch (target) {
    case 'TRAIT':
      return t('operatorDetail.labels.traitOverride')
    case 'TALENT':
      return t('operatorDetail.labels.talentOverride')
    default:
      return humanizeModuleKey(target)
  }
}

function mergeModuleTraitGroups(candidates: OperatorModuleTraitCandidate[]) {
  const groups = new Map<string, OperatorModuleTraitCandidate[]>()

  candidates.forEach((candidate) => {
    const key = [
      candidate.elite,
      candidate.level,
      getDescriptionStructureSignature(candidate.description),
    ].join(':')
    const group = groups.get(key) ?? []
    group.push(candidate)
    groups.set(key, group)
  })

  return Array.from(groups.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, group]) =>
      buildModuleEffectCandidateViewModel(
        key,
        t('operatorDetail.labels.traitOverride'),
        group,
      ))
}

function mergeModuleTalentGroups(candidates: OperatorModuleTalentCandidate[]) {
  const groups = new Map<string, OperatorModuleTalentCandidate[]>()

  candidates.forEach((candidate) => {
    const key = [
      candidate.elite,
      candidate.level,
      candidate.name?.trim() || '',
      getDescriptionStructureSignature(candidate.description),
    ].join(':')
    const group = groups.get(key) ?? []
    group.push(candidate)
    groups.set(key, group)
  })

  return Array.from(groups.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, group]) =>
      buildModuleEffectCandidateViewModel(
        key,
        group[0]?.name?.trim() || t('operatorDetail.labels.talentOverride'),
        group,
      ))
}

function buildModuleEffectCandidateViewModel<
  T extends OperatorModuleTraitCandidate | OperatorModuleTalentCandidate,
>(
  key: string,
  title: string,
  candidates: T[],
): ModuleEffectCandidateViewModel {
  const sortedCandidates = [...candidates].sort((left, right) => {
    return left.requiredPotentialRank - right.requiredPotentialRank
      || left.elite - right.elite
      || left.level - right.level
  })
  const fallbackCandidate = sortedCandidates[0]

  if (!fallbackCandidate) {
    return {
      key,
      title,
      conditionElite: 0,
      conditionLevel: 1,
      baseDescriptionSegments: [],
      potentialVariants: [],
      rangeMatrix: null,
    }
  }

  const baseCandidate = sortedCandidates.find(candidate => candidate.requiredPotentialRank === 0) ?? fallbackCandidate
  const variantRangeMatrixByRank = new Map<number, RangeMatrix | null>(
    sortedCandidates.map(candidate => [candidate.requiredPotentialRank, buildRangeMatrix(candidate.range)]),
  )
  const potentialDiffDisplay = buildPotentialDiffDisplay({
    candidates: sortedCandidates,
    keyPrefix: key,
    getPotentialLabel: requiredPotentialRank =>
      t('operatorDetail.labels.potentialValue', { value: requiredPotentialRank + 1 }),
    getPotentialIconSrc: requiredPotentialRank =>
      potentialIcons[(requiredPotentialRank + 1) as keyof typeof potentialIcons] ?? potentialIcons[1],
  })

  return {
    key,
    title,
    conditionElite: baseCandidate.elite,
    conditionLevel: baseCandidate.level,
    baseDescriptionSegments: potentialDiffDisplay.baseDescriptionSegments,
    basePotentialLabel: potentialDiffDisplay.basePotentialLabel,
    potentialVariants: potentialDiffDisplay.potentialVariants.map(variant => ({
      ...variant,
      rangeMatrix: variant.fallbackDescriptionSegments?.length
        ? variantRangeMatrixByRank.get(getPotentialRankFromVariantKey(variant.key)) ?? null
        : null,
    })),
    rangeMatrix: buildRangeMatrix(baseCandidate.range),
  }
}

function getDescriptionStructureSignature(description: string) {
  return description
    .replace(/<@ba\.talpu>.*?<\/>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[+\-]?\d+(?:\.\d+)?%?(?:~[+\-]?\d+(?:\.\d+)?%?)?(?:\([+\-]?\d+(?:\.\d+)?%?(?:~[+\-]?\d+(?:\.\d+)?%?)?\))?/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
}

function getPotentialRankFromVariantKey(key: string) {
  const rank = Number(key.split(':').pop())
  return Number.isFinite(rank) ? rank : 0
}

async function loadModuleImageSources(modules: OperatorModule[]) {
  moduleTypeIconSources.value = {}
  moduleEquipIconSources.value = {}

  const requests = modules.flatMap((module) => {
    const collectedRequests: Array<{ kind: 'moduleType' | 'moduleEquip', id: string }> = []
    const typeIcon = module.typeIcon?.trim()
    if (typeIcon) {
      collectedRequests.push({
        kind: 'moduleType',
        id: typeIcon,
      })
    }

    const equipIcon = getModuleEquipRequestId(module)
    if (equipIcon) {
      collectedRequests.push({
        kind: 'moduleEquip',
        id: equipIcon,
      })
    }

    return collectedRequests
  })

  try {
    await prefetchImages(requests)
  }
  catch {
    // 이미지 fallback UI가 있으므로 선조회 실패는 무시한다.
  }

  const typeEntries = await Promise.all(
    modules.map(async (module) => {
      const typeIcon = module.typeIcon?.trim()
      if (!typeIcon)
        return [module.uniEquipId, undefined] as const

      try {
        const resolved = await resolveImageSource({
          kind: 'moduleType',
          id: typeIcon,
        })
        return [module.uniEquipId, resolved.src] as const
      }
      catch {
        return [module.uniEquipId, undefined] as const
      }
    }),
  )

  const equipEntries = await Promise.all(
    modules.map(async (module) => {
      const equipIcon = getModuleEquipRequestId(module)
      if (!equipIcon)
        return [module.uniEquipId, undefined] as const

      try {
        const resolved = await resolveImageSource({
          kind: 'moduleEquip',
          id: equipIcon,
        })
        return [module.uniEquipId, resolved.src] as const
      }
      catch {
        return [module.uniEquipId, undefined] as const
      }
    }),
  )

  moduleTypeIconSources.value = Object.fromEntries(
    typeEntries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  )
  moduleEquipIconSources.value = Object.fromEntries(
    equipEntries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  )
}

async function loadSkillIconSources(skills: OperatorDetail['skills']) {
  skillIconSources.value = {}

  const requests = skills
    .map(skill => (skill.iconId ?? skill.id).trim())
    .filter(Boolean)
    .map(id => ({
      kind: 'skillIcon' as const,
      id,
    }))

  try {
    await prefetchImages(requests)
  }
  catch {
    // 스킬 탭은 텍스트 fallback이 있으므로 선조회 실패는 무시한다.
  }

  const entries = await Promise.all(
    skills.map(async (skill) => {
      const skillId = (skill.iconId ?? skill.id).trim()
      if (!skillId)
        return [skill.id, undefined] as const

      try {
        const resolved = await resolveImageSource({
          kind: 'skillIcon',
          id: skillId,
        })
        return [skill.id, resolved.src] as const
      }
      catch {
        return [skill.id, undefined] as const
      }
    }),
  )

  skillIconSources.value = Object.fromEntries(
    entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
  )
}
</script>

<script lang="ts">
export default {
  layout: 'operators',
}
</script>

<template>
  <section v-if="operator" class="page-grid">
    <TopBar :title="operator.name" :subtitle="currentSectionLabel">
      <template #left>
        <button type="button" class="top-bar-icon" @click="router.push('/operators')">
          <el-icon><ArrowLeft /></el-icon>
        </button>
      </template>

      <template #right>
        <button type="button" class="top-bar-icon" @click="toggleFavorite">
          <el-icon><StarFilled v-if="isFavorite" /><Star v-else /></el-icon>
        </button>
      </template>
    </TopBar>

    <header class="grid gap-4 panel-soft rounded-[28px] p-5">
      <div class="flex flex-wrap gap-2">
        <span v-for="team in operator.teams" :key="`team-${team}`" class="chip-team chip">{{
          team
        }}</span>
        <span
          v-for="nation in operator.nations"
          :key="`nation-${nation}`"
          class="chip-nation chip"
        >{{ nation }}</span>
        <span v-for="group in operator.groups" :key="`group-${group}`" class="chip-group chip">{{
          group
        }}</span>
        <span class="chip-profession chip">{{ professionLabel }}</span>
        <span class="chip-branch chip">{{ operator.branch }}</span>
      </div>

      <h1
        ref="nameElement"
        class="m-0 overflow-hidden whitespace-nowrap font-800 leading-none tracking-[-0.03em]"
        :style="{ fontSize: `${nameFontSize}px` }"
      >
        {{ operator.name }}
      </h1>

      <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div class="grid self-start gap-2">
          <p class="m-0 text-[rgba(228,234,250,0.75)]">
            {{ operator.quote }}
          </p>

          <div class="grid gap-2 pt-1">
            <div v-if="operator.tags.length" class="flex flex-wrap gap-2">
              <span v-for="tag in operator.tags" :key="tag" class="chip">{{ tag }}</span>
            </div>
            <div v-if="(operator.baTags ?? []).length" class="flex flex-wrap gap-2">
              <span
                v-for="tag in operator.baTags ?? []"
                :key="`ba-${tag}`"
                class="chip border-2 border-[rgba(94,182,255,0.52)] bg-[rgba(28,53,96,0.14)] text-[rgba(224,239,255,0.96)] shadow-[0_0_0_1px_rgba(94,182,255,0.1)_inset]"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <div class="grid justify-items-center gap-3">
          <OperatorPortrait :char-id="operator.id" :name="operator.name" :hue="operator.thumbnailHue" size="lg" />
          <div class="text-gold tracking-[0.12em]">
            <span v-for="index in operator.rarity" :key="index">★</span>
          </div>
        </div>
      </div>
    </header>

    <el-collapse
      v-model="activeDetailPanels"
      class="detail-collapse"
      @change="setupSectionObserver"
    >
      <el-collapse-item name="stats">
        <template #title>
          <div class="grid gap-0.5">
            <strong class="text-[0.98rem] text-white font-700">{{
              t('operatorDetail.sections.stats')
            }}</strong>
            <span class="text-[0.8rem] text-[rgba(205,214,235,0.62)]">{{
              t('operatorDetail.summaries.stats')
            }}</span>
          </div>
        </template>

        <section ref="statsSection" data-section="stats" class="grid gap-4 pt-1">
          <div class="grid gap-4 md:grid-cols-2 md:items-start">
            <label class="grid gap-2.5">
              <span class="text-[0.9rem] text-[rgba(230,236,250,0.76)]">{{
                t('operatorDetail.labels.elite')
              }}</span>
              <el-segmented v-model="elite" :options="eliteOptions" block>
                <template #default="{ item }">
                  <img
                    v-if="getElitePhaseIcon(item.value)"
                    :src="getElitePhaseIcon(item.value)"
                    :alt="`Elite ${item.value}`"
                    class="h-5 w-auto object-contain"
                  >
                  <template v-else>
                    {{ item.label }}
                  </template>
                </template>
              </el-segmented>
            </label>

            <label class="grid gap-2.5">
              <span class="text-[0.9rem] text-[rgba(230,236,250,0.76)]">{{
                t('operatorDetail.labels.level')
              }}</span>
              <SliderLikeControl v-model="level" :min="1" :max="maxLevel" />
            </label>
          </div>

          <section class="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <article v-for="item in statCards" :key="item.key" class="grid gap-1.5 stat-card p-4">
              <span class="text-[0.82rem] text-[rgba(205,214,235,0.7)]">{{
                translateStatLabel(item.key)
              }}</span>
              <strong class="text-[1.35rem]">{{ item.value }}</strong>
            </article>
          </section>
        </section>
      </el-collapse-item>

      <el-collapse-item name="abilities">
        <template #title>
          <div class="grid gap-0.5">
            <strong class="text-[0.98rem] text-white font-700">{{
              t('operatorDetail.sections.abilities')
            }}</strong>
            <span class="text-[0.8rem] text-[rgba(205,214,235,0.62)]">{{
              t('operatorDetail.summaries.abilities')
            }}</span>
          </div>
        </template>

        <section ref="abilitiesSection" data-section="abilities" class="grid gap-4 pt-1">
          <el-segmented
            v-if="eliteTabOptions.length"
            v-model="abilitiesEliteTab"
            :options="eliteTabOptions"
            block
          >
            <template #default="{ item }">
              <img
                v-if="getElitePhaseIcon(item.value)"
                :src="getElitePhaseIcon(item.value)"
                :alt="`Elite ${item.value}`"
                class="h-5 w-auto object-contain"
              >
              <template v-else>
                {{ item.label }}
              </template>
            </template>
          </el-segmented>

          <section
            v-if="abilityRangeMatrix"
            class="grid gap-3 rounded-card bg-[rgba(255,255,255,0.04)] p-4"
          >
            <div class="grid gap-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="m-0 text-[0.95rem] text-[rgba(236,240,250,0.9)]">
                  {{ t('operatorDetail.labels.attackRange') }}
                </h3>
                <span class="chip inline-flex items-center justify-center">
                  <img
                    v-if="getElitePhaseIcon(abilitiesEliteTab)"
                    :src="getElitePhaseIcon(abilitiesEliteTab)"
                    :alt="`Elite ${abilitiesEliteTab}`"
                    class="h-5 w-auto object-contain"
                  >
                  <template v-else>
                    {{ t('operatorDetail.labels.eliteShort', { elite: abilitiesEliteTab }) }}
                  </template>
                </span>
              </div>
            </div>

            <div
              class="grid w-fit gap-1 border border-line rounded-[20px] bg-[rgba(7,10,18,0.84)] p-2.5"
              :style="{
                gridTemplateColumns: `repeat(${abilityRangeMatrix.columnCount}, minmax(0, 2rem))`,
              }"
            >
              <template v-for="row in abilityRangeMatrix.rows" :key="row[0]?.key">
                <div
                  v-for="cell in row"
                  :key="cell.key"
                  class="grid h-8 w-8 place-items-center border rounded-[10px] text-[0.74rem] font-700"
                  :class="
                    cell.isOrigin
                      ? 'border-[rgba(255,208,120,0.42)] bg-[linear-gradient(135deg,rgba(255,209,102,0.34),rgba(255,165,84,0.2))] text-[rgba(255,245,214,0.96)]'
                      : cell.isActive
                        ? 'border-[rgba(112,198,255,0.36)] bg-[linear-gradient(135deg,rgba(84,168,255,0.24),rgba(111,233,255,0.16))] text-[rgba(236,246,255,0.94)]'
                        : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-[rgba(149,162,190,0.38)]'
                  "
                >
                  <span v-if="cell.isOrigin">●</span>
                </div>
              </template>
            </div>
          </section>

          <div class="grid gap-3">
            <div class="grid gap-1">
              <h3 class="m-0 text-[0.95rem] text-[rgba(236,240,250,0.9)]">
                {{ t('operatorDetail.labels.trait') }}
              </h3>
              <p class="m-0 text-[0.82rem] text-[rgba(205,214,235,0.66)]">
                {{ t('operatorDetail.descriptions.trait') }}
              </p>
            </div>

            <div class="grid gap-3">
              <article
                v-for="trait in traits"
                :key="trait.key"
                class="grid gap-2 rounded-card bg-[rgba(255,255,255,0.04)] p-4"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <strong>{{ t('operatorDetail.labels.trait') }}</strong>
                  <span class="chip inline-flex items-center gap-1.5">
                    <img
                      v-if="
                        typeof trait.conditionElite === 'number'
                          && getElitePhaseIcon(trait.conditionElite)
                      "
                      :src="getElitePhaseIcon(trait.conditionElite)"
                      :alt="`Elite ${trait.conditionElite}`"
                      class="h-4.5 w-auto object-contain"
                    >
                    <template v-if="typeof trait.conditionLevel === 'number'">
                      <span>Lv.{{ trait.conditionLevel }}</span>
                    </template>
                    <template v-else>
                      <span>{{ trait.conditionLabel }}</span>
                    </template>
                  </span>
                  <span v-if="trait.potentialLabel" class="chip">
                    {{ trait.potentialLabel }}
                  </span>
                </div>
                <RichTextContent
                  class="m-0 text-[rgba(236,240,250,0.88)]"
                  :segments="trait.descriptionSegments"
                  @term-click="handleTermSelection"
                />
              </article>
            </div>
          </div>

          <div v-if="operator.talents.length" class="grid gap-3 pt-1">
            <div class="grid gap-1">
              <h3 class="m-0 text-[0.95rem] text-[rgba(236,240,250,0.9)]">
                {{ t('operatorDetail.labels.talent') }}
              </h3>
              <p class="m-0 text-[0.82rem] text-[rgba(205,214,235,0.66)]">
                {{ t('operatorDetail.descriptions.talent') }}
              </p>
            </div>

            <div v-if="talents.length" class="grid gap-3">
              <article
                v-for="talent in talents"
                :key="talent.key"
                class="grid gap-3 rounded-card bg-[rgba(255,255,255,0.04)] p-4"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <strong>{{ talent.name }}</strong>
                  <span class="chip inline-flex items-center gap-1.5">
                    <img
                      v-if="
                        typeof talent.conditionElite === 'number'
                          && getElitePhaseIcon(talent.conditionElite)
                      "
                      :src="getElitePhaseIcon(talent.conditionElite)"
                      :alt="`Elite ${talent.conditionElite}`"
                      class="h-4.5 w-auto object-contain"
                    >
                    <template v-if="typeof talent.conditionLevel === 'number'">
                      <span>Lv.{{ talent.conditionLevel }}</span>
                    </template>
                    <template v-else>
                      <span>{{ talent.conditionLabel }}</span>
                    </template>
                  </span>
                  <span v-if="talent.basePotentialLabel" class="chip">
                    {{ talent.basePotentialLabel }}
                  </span>
                </div>
                <RichTextContent
                  class="m-0 text-[rgba(236,240,250,0.88)]"
                  :segments="talent.baseDescriptionSegments"
                  @term-click="handleTermSelection"
                />

                <div
                  v-if="talent.potentialVariants.some(variant => variant.fallbackDescriptionSegments?.length)"
                  class="grid gap-2 border-t border-[rgba(255,255,255,0.06)] pt-3"
                >
                  <article
                    v-for="variant in talent.potentialVariants"
                    :key="variant.key"
                    class="grid gap-1.5 rounded-[16px] bg-[rgba(255,255,255,0.03)] px-3 py-2.5"
                  >
                    <div
                      v-if="variant.fallbackDescriptionSegments?.length"
                      class="flex flex-wrap items-center gap-2"
                    >
                      <span class="chip text-[0.8rem]">
                        {{ variant.potentialLabel }}
                      </span>
                    </div>

                    <RichTextContent
                      v-if="variant.fallbackDescriptionSegments?.length"
                      class="m-0 text-[0.88rem] text-[rgba(221,228,244,0.8)] leading-snug"
                      :segments="variant.fallbackDescriptionSegments"
                      @term-click="handleTermSelection"
                    />
                  </article>
                </div>
              </article>
            </div>

            <p v-else class="m-0 muted-copy">
              {{ t('operatorDetail.states.noTalentForCurrentStage') }}
            </p>
          </div>
        </section>
      </el-collapse-item>

      <el-collapse-item v-if="potentials.length" name="potentials">
        <template #title>
          <div class="grid gap-0.5">
            <strong class="text-[0.98rem] text-white font-700">{{
              t('operatorDetail.sections.potentials')
            }}</strong>
            <span class="text-[0.8rem] text-[rgba(205,214,235,0.62)]">{{
              t('operatorDetail.summaries.potentials')
            }}</span>
          </div>
        </template>

        <section ref="potentialsSection" data-section="potentials" class="grid gap-3 pt-1">
          <article
            v-for="potential in potentials"
            :key="potential.key"
            class="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-3 rounded-[16px] bg-[rgba(255,255,255,0.03)] px-3 py-2.5"
          >
            <img
              :src="potential.iconSrc"
              :alt="potential.rankLabel"
              class="h-8 w-8 object-contain"
            >
            <strong class="text-[0.92rem] text-[rgba(244,247,255,0.94)] leading-tight">
              {{ potential.rankLabel }}
            </strong>
            <p class="m-0 text-[0.88rem] text-[rgba(236,240,250,0.84)] leading-snug">
              {{ potential.description }}
            </p>
          </article>
        </section>
      </el-collapse-item>

      <el-collapse-item v-if="operator.modules.length" name="modules">
        <template #title>
          <div class="grid gap-0.5">
            <strong class="text-[0.98rem] text-white font-700">{{
              t('operatorDetail.sections.modules')
            }}</strong>
            <span class="text-[0.8rem] text-[rgba(205,214,235,0.62)]">{{
              t('operatorDetail.summaries.modules')
            }}</span>
          </div>
        </template>

        <section ref="modulesSection" data-section="modules" class="grid gap-4 pt-1">
          <div class="flex gap-2.5 overflow-x-auto pb-1">
            <button
              v-for="module in operator.modules"
              :key="module.uniEquipId"
              type="button"
              class="inline-flex items-center gap-2 whitespace-nowrap border border-line rounded-pill bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-[rgba(240,244,255,0.84)] transition-colors duration-200"
              :class="
                selectedModule?.uniEquipId === module.uniEquipId
                  ? 'border-[rgba(129,214,255,0.45)] bg-[linear-gradient(135deg,rgba(89,181,255,0.25),rgba(138,248,255,0.16))]'
                  : 'hover:bg-[rgba(255,255,255,0.07)]'
              "
              @click="selectedModuleId = module.uniEquipId"
            >
              <img
                v-if="moduleTypeIconSources[module.uniEquipId]"
                :src="moduleTypeIconSources[module.uniEquipId]"
                :alt="module.typeIcon"
                class="h-8 w-8 rounded-[10px] bg-[rgba(6,10,18,0.75)] object-contain p-1"
              >
              <span class="max-w-[12rem] truncate">{{ module.typeIcon.toUpperCase() }}</span>
            </button>
          </div>

          <article
            v-if="selectedModule"
            class="grid gap-4 rounded-card bg-[rgba(255,255,255,0.04)] p-4"
          >
            <div class="grid gap-4">
              <h3 class="m-0 text-[1.02rem] text-white">
                {{ selectedModule.uniEquipName }}
              </h3>

              <div class="flex items-start justify-between gap-3">
                <div class="grid justify-items-start">
                  <img
                    v-if="moduleEquipIconSources[selectedModule.uniEquipId]"
                    :src="moduleEquipIconSources[selectedModule.uniEquipId]"
                    :alt="selectedModule.uniEquipName"
                    class="h-18 w-18 border border-[rgba(255,255,255,0.08)] rounded-[18px] bg-[rgba(7,10,18,0.82)] object-contain p-2"
                  >
                </div>

                <div class="flex flex-1 flex-wrap items-center self-center justify-end gap-2">
                  <span v-if="selectedModule.isSpecialEquip" class="chip-caution">
                    {{ t('operatorDetail.labels.specialModule') }}
                  </span>
                  <span v-if="selectedModule.missionList.length" class="chip-caution">
                    {{ t('operatorDetail.labels.missionUnlocked') }}
                  </span>
                  <span class="chip-caution inline-flex items-center gap-1.5">
                    <span class="text-[rgba(255,214,192,0.76)]">{{
                      t('operatorDetail.labels.unlockCondition')
                    }}</span>
                    <img
                      v-if="
                        typeof getElitePhaseFromCode(selectedModule.unlockEvolvePhase)
                          === 'number'
                      "
                      :src="
                        getElitePhaseIcon(
                          getElitePhaseFromCode(selectedModule.unlockEvolvePhase)!,
                        )
                      "
                      :alt="selectedModule.unlockEvolvePhase"
                      class="h-4.5 w-auto object-contain"
                    >
                    <span>Lv.{{ selectedModule.unlockLevel }}</span>
                  </span>

                  <span
                    v-if="selectedModuleFavorPercent"
                    class="chip-caution inline-flex items-center gap-1.5"
                  >
                    <span class="text-[rgba(255,214,192,0.76)]">{{
                      t('operatorDetail.labels.favorCondition')
                    }}</span>
                    <span>{{ selectedModuleFavorPercent }}%</span>
                  </span>
                </div>
              </div>

              <div v-if="selectedModuleBattlePhaseOptions.length" class="grid gap-3">
                <div class="grid gap-1">
                  <h4 class="m-0 text-[0.94rem] text-[rgba(236,240,250,0.9)]">
                    {{ t('operatorDetail.labels.moduleStage') }}
                  </h4>
                </div>

                <el-segmented
                  v-model="selectedModuleBattleLevel"
                  :options="selectedModuleBattlePhaseOptions"
                  block
                />
              </div>
            </div>

            <template v-if="selectedModuleBattlePhase">
              <section v-if="selectedModuleStatBonuses.length" class="grid gap-3">
                <div class="grid gap-1">
                  <h4 class="m-0 text-[0.94rem] text-[rgba(236,240,250,0.9)]">
                    {{ t('operatorDetail.labels.moduleStatBonus') }}
                  </h4>
                </div>

                <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <article
                    v-for="bonus in selectedModuleStatBonuses"
                    :key="bonus.key"
                    class="grid gap-1.5 rounded-card bg-[rgba(255,255,255,0.035)] p-3.5"
                  >
                    <span class="text-[0.78rem] text-[rgba(205,214,235,0.7)]">
                      {{ bonus.label }}
                    </span>
                    <strong class="text-[1.02rem] text-[rgba(239,246,255,0.94)]">
                      {{ bonus.value }}
                    </strong>
                  </article>
                </div>
              </section>

              <section v-if="selectedModuleEffectParts.length" class="grid gap-3">
                <div class="grid gap-1">
                  <h4 class="m-0 text-[0.94rem] text-[rgba(236,240,250,0.9)]">
                    {{ t('operatorDetail.labels.moduleEffects') }}
                  </h4>
                </div>

                <div class="grid gap-3">
                  <article
                    v-for="part in selectedModuleEffectParts"
                    :key="`${selectedModule.uniEquipId}-${selectedModuleBattlePhase.equipLevel}-${part.target}`"
                    class="grid gap-3 rounded-card bg-[rgba(255,255,255,0.035)] p-4"
                  >
                    <div class="flex flex-wrap items-center gap-2">
                      <strong>{{ getModuleTargetLabel(part.target) }}</strong>
                      <span class="chip">
                        {{ t('operatorDetail.labels.moduleStage') }} {{ selectedModuleBattlePhase.equipLevel }}
                      </span>
                    </div>

                    <div v-if="part.traitGroups.length" class="grid gap-3">
                      <article
                        v-for="candidate in part.traitGroups"
                        :key="candidate.key"
                        class="grid gap-2 rounded-[18px] bg-[rgba(255,255,255,0.03)] p-4"
                      >
                        <div class="flex flex-wrap items-center gap-2">
                          <strong>{{ candidate.title }}</strong>
                          <span class="chip inline-flex items-center gap-1.5">
                            <img
                              v-if="getElitePhaseIcon(candidate.conditionElite)"
                              :src="getElitePhaseIcon(candidate.conditionElite)"
                              :alt="`Elite ${candidate.conditionElite}`"
                              class="h-4.5 w-auto object-contain"
                            >
                            <span>Lv.{{ candidate.conditionLevel }}</span>
                          </span>
                          <span v-if="candidate.basePotentialLabel" class="chip">
                            {{ candidate.basePotentialLabel }}
                          </span>
                        </div>

                        <RichTextContent
                          class="m-0 text-[rgba(236,240,250,0.88)]"
                          :segments="candidate.baseDescriptionSegments"
                          @term-click="handleTermSelection"
                        />

                        <div
                          v-if="candidate.rangeMatrix"
                          class="grid w-fit gap-1 border border-line rounded-[20px] bg-[rgba(7,10,18,0.84)] p-2.5"
                          :style="{
                            gridTemplateColumns: `repeat(${candidate.rangeMatrix.columnCount}, minmax(0, 2rem))`,
                          }"
                        >
                          <template v-for="row in candidate.rangeMatrix.rows" :key="row[0]?.key">
                            <div
                              v-for="cell in row"
                              :key="cell.key"
                              class="grid h-8 w-8 place-items-center border rounded-[10px] text-[0.74rem] font-700"
                              :class="
                                cell.isOrigin
                                  ? 'border-[rgba(255,208,120,0.42)] bg-[linear-gradient(135deg,rgba(255,209,102,0.34),rgba(255,165,84,0.2))] text-[rgba(255,245,214,0.96)]'
                                  : cell.isActive
                                    ? 'border-[rgba(112,198,255,0.36)] bg-[linear-gradient(135deg,rgba(84,168,255,0.24),rgba(111,233,255,0.16))] text-[rgba(236,246,255,0.94)]'
                                    : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-[rgba(149,162,190,0.38)]'
                              "
                            >
                              <span v-if="cell.isOrigin">●</span>
                            </div>
                          </template>
                        </div>

                        <div
                          v-if="candidate.potentialVariants.some(variant => variant.fallbackDescriptionSegments?.length)"
                          class="grid gap-2 border-t border-[rgba(255,255,255,0.06)] pt-3"
                        >
                          <article
                            v-for="variant in candidate.potentialVariants"
                            :key="variant.key"
                            class="grid gap-1.5 rounded-[16px] bg-[rgba(255,255,255,0.03)] px-3 py-2.5"
                          >
                            <div
                              v-if="variant.fallbackDescriptionSegments?.length"
                              class="flex flex-wrap items-center gap-2"
                            >
                              <span class="chip text-[0.8rem]">
                                {{ variant.potentialLabel }}
                              </span>
                            </div>

                            <RichTextContent
                              v-if="variant.fallbackDescriptionSegments?.length"
                              class="m-0 text-[0.88rem] text-[rgba(221,228,244,0.8)] leading-snug"
                              :segments="variant.fallbackDescriptionSegments"
                              @term-click="handleTermSelection"
                            />

                            <div
                              v-if="variant.rangeMatrix"
                              class="grid w-fit gap-1 border border-line rounded-[20px] bg-[rgba(7,10,18,0.84)] p-2.5"
                              :style="{
                                gridTemplateColumns: `repeat(${variant.rangeMatrix.columnCount}, minmax(0, 2rem))`,
                              }"
                            >
                              <template v-for="row in variant.rangeMatrix.rows" :key="row[0]?.key">
                                <div
                                  v-for="cell in row"
                                  :key="cell.key"
                                  class="grid h-8 w-8 place-items-center border rounded-[10px] text-[0.74rem] font-700"
                                  :class="
                                    cell.isOrigin
                                      ? 'border-[rgba(255,208,120,0.42)] bg-[linear-gradient(135deg,rgba(255,209,102,0.34),rgba(255,165,84,0.2))] text-[rgba(255,245,214,0.96)]'
                                      : cell.isActive
                                        ? 'border-[rgba(112,198,255,0.36)] bg-[linear-gradient(135deg,rgba(84,168,255,0.24),rgba(111,233,255,0.16))] text-[rgba(236,246,255,0.94)]'
                                        : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-[rgba(149,162,190,0.38)]'
                                  "
                                >
                                  <span v-if="cell.isOrigin">●</span>
                                </div>
                              </template>
                            </div>
                          </article>
                        </div>
                      </article>
                    </div>

                    <div v-if="part.talentGroups.length" class="grid gap-3">
                      <article
                        v-for="candidate in part.talentGroups"
                        :key="candidate.key"
                        class="grid gap-2 rounded-[18px] bg-[rgba(255,255,255,0.03)] p-4"
                      >
                        <div class="flex flex-wrap items-center gap-2">
                          <strong>{{ candidate.title }}</strong>
                          <span class="chip inline-flex items-center gap-1.5">
                            <img
                              v-if="getElitePhaseIcon(candidate.conditionElite)"
                              :src="getElitePhaseIcon(candidate.conditionElite)"
                              :alt="`Elite ${candidate.conditionElite}`"
                              class="h-4.5 w-auto object-contain"
                            >
                            <span>Lv.{{ candidate.conditionLevel }}</span>
                          </span>
                          <span v-if="candidate.basePotentialLabel" class="chip">
                            {{ candidate.basePotentialLabel }}
                          </span>
                        </div>

                        <RichTextContent
                          class="m-0 text-[rgba(236,240,250,0.88)]"
                          :segments="candidate.baseDescriptionSegments"
                          @term-click="handleTermSelection"
                        />

                        <div
                          v-if="candidate.rangeMatrix"
                          class="grid w-fit gap-1 border border-line rounded-[20px] bg-[rgba(7,10,18,0.84)] p-2.5"
                          :style="{
                            gridTemplateColumns: `repeat(${candidate.rangeMatrix.columnCount}, minmax(0, 2rem))`,
                          }"
                        >
                          <template v-for="row in candidate.rangeMatrix.rows" :key="row[0]?.key">
                            <div
                              v-for="cell in row"
                              :key="cell.key"
                              class="grid h-8 w-8 place-items-center border rounded-[10px] text-[0.74rem] font-700"
                              :class="
                                cell.isOrigin
                                  ? 'border-[rgba(255,208,120,0.42)] bg-[linear-gradient(135deg,rgba(255,209,102,0.34),rgba(255,165,84,0.2))] text-[rgba(255,245,214,0.96)]'
                                  : cell.isActive
                                    ? 'border-[rgba(112,198,255,0.36)] bg-[linear-gradient(135deg,rgba(84,168,255,0.24),rgba(111,233,255,0.16))] text-[rgba(236,246,255,0.94)]'
                                    : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-[rgba(149,162,190,0.38)]'
                              "
                            >
                              <span v-if="cell.isOrigin">●</span>
                            </div>
                          </template>
                        </div>

                        <div
                          v-if="candidate.potentialVariants.some(variant => variant.fallbackDescriptionSegments?.length)"
                          class="grid gap-2 border-t border-[rgba(255,255,255,0.06)] pt-3"
                        >
                          <article
                            v-for="variant in candidate.potentialVariants"
                            :key="variant.key"
                            class="grid gap-1.5 rounded-[16px] bg-[rgba(255,255,255,0.03)] px-3 py-2.5"
                          >
                            <div
                              v-if="variant.fallbackDescriptionSegments?.length"
                              class="flex flex-wrap items-center gap-2"
                            >
                              <span class="chip text-[0.8rem]">
                                {{ variant.potentialLabel }}
                              </span>
                            </div>

                            <RichTextContent
                              v-if="variant.fallbackDescriptionSegments?.length"
                              class="m-0 text-[0.88rem] text-[rgba(221,228,244,0.8)] leading-snug"
                              :segments="variant.fallbackDescriptionSegments"
                              @term-click="handleTermSelection"
                            />

                            <div
                              v-if="variant.rangeMatrix"
                              class="grid w-fit gap-1 border border-line rounded-[20px] bg-[rgba(7,10,18,0.84)] p-2.5"
                              :style="{
                                gridTemplateColumns: `repeat(${variant.rangeMatrix.columnCount}, minmax(0, 2rem))`,
                              }"
                            >
                              <template v-for="row in variant.rangeMatrix.rows" :key="row[0]?.key">
                                <div
                                  v-for="cell in row"
                                  :key="cell.key"
                                  class="grid h-8 w-8 place-items-center border rounded-[10px] text-[0.74rem] font-700"
                                  :class="
                                    cell.isOrigin
                                      ? 'border-[rgba(255,208,120,0.42)] bg-[linear-gradient(135deg,rgba(255,209,102,0.34),rgba(255,165,84,0.2))] text-[rgba(255,245,214,0.96)]'
                                      : cell.isActive
                                        ? 'border-[rgba(112,198,255,0.36)] bg-[linear-gradient(135deg,rgba(84,168,255,0.24),rgba(111,233,255,0.16))] text-[rgba(236,246,255,0.94)]'
                                        : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-[rgba(149,162,190,0.38)]'
                                  "
                                >
                                  <span v-if="cell.isOrigin">●</span>
                                </div>
                              </template>
                            </div>
                          </article>
                        </div>
                      </article>
                    </div>
                  </article>
                </div>
              </section>

              <p
                v-if="!selectedModuleStatBonuses.length && !selectedModuleEffectParts.length"
                class="m-0 muted-copy"
              >
                {{ t('operatorDetail.states.noModuleDetails') }}
              </p>
            </template>

            <p v-else class="m-0 muted-copy">
              {{ t('operatorDetail.states.noModuleDetails') }}
            </p>
          </article>

          <p v-else class="m-0 muted-copy">
            {{ t('operatorDetail.states.noModules') }}
          </p>
        </section>
      </el-collapse-item>

      <el-collapse-item name="skills">
        <template #title>
          <div class="grid gap-0.5">
            <strong class="text-[0.98rem] text-white font-700">{{
              t('operatorDetail.sections.skills')
            }}</strong>
            <span class="text-[0.8rem] text-[rgba(205,214,235,0.62)]">{{
              t('operatorDetail.summaries.skills')
            }}</span>
          </div>
        </template>

        <section ref="skillsSection" data-section="skills" class="grid gap-4 pt-1">
          <div class="flex gap-2.5 overflow-x-auto pb-1">
            <button
              v-for="skill in operator.skills"
              :key="skill.id"
              type="button"
              class="grid h-[64px] w-[64px] place-items-center border border-line rounded-[20px] bg-[rgba(255,255,255,0.04)] p-2 text-[rgba(240,244,255,0.84)] transition-colors duration-200"
              :class="
                selectedSkill?.id === skill.id
                  ? 'border-[rgba(129,214,255,0.45)] bg-[linear-gradient(135deg,rgba(89,181,255,0.25),rgba(138,248,255,0.16))]'
                  : 'hover:bg-[rgba(255,255,255,0.07)]'
              "
              @click="selectedSkillId = skill.id"
            >
              <img
                v-if="skillIconSources[skill.id]"
                :src="skillIconSources[skill.id]"
                :alt="skill.name"
                class="h-11 w-11 object-contain"
              >
              <span
                v-else
                class="line-clamp-2 text-center text-[0.72rem] font-700 leading-tight"
              >
                {{ skill.name }}
              </span>
            </button>
          </div>

          <article v-if="selectedSkill" class="grid gap-4">
            <div class="grid gap-3 md:grid-cols-2 md:items-start">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="m-0">
                    {{ selectedSkill.name }}
                  </h3>
                  <span
                    v-if="selectedSkillUnlockElite !== undefined && selectedSkillUnlockLevel !== undefined"
                    class="chip chip-caution inline-flex items-center gap-1.5"
                  >
                    <span>{{ t('operatorDetail.labels.unlockCondition') }}</span>
                    <img
                      v-if="getElitePhaseIcon(selectedSkillUnlockElite)"
                      :src="getElitePhaseIcon(selectedSkillUnlockElite)"
                      :alt="`Elite ${selectedSkillUnlockElite}`"
                      class="h-4.5 w-auto object-contain"
                    >
                    <span>{{ t('operatorDetail.labels.conditionLevel', { level: selectedSkillUnlockLevel }) }}</span>
                  </span>
                  <span
                    v-if="selectedSkillLevelInfo"
                    class="chip inline-flex items-center justify-center"
                  >
                    <img
                      v-if="getSkillLevelIcon(selectedSkillLevelInfo.level)"
                      :src="getSkillLevelIcon(selectedSkillLevelInfo.level)"
                      :alt="`Skill level ${selectedSkillLevelInfo.level}`"
                      class="h-5 w-auto object-contain"
                    >
                    <template v-else>
                      {{
                        t('operatorDetail.labels.selectedLevel', {
                          level: selectedSkillLevelInfo.level,
                        })
                      }}
                    </template>
                  </span>
                </div>
                <RichTextContent
                  class="muted-copy mt-2"
                  :segments="selectedSkillDescriptionSegments"
                  @term-click="handleTermSelection"
                />
              </div>

              <div class="flex flex-wrap gap-2">
                <span class="chip">{{ selectedSkillRecoveryLabel }}</span>
                <span class="chip">{{ selectedSkillActivationLabel }}</span>
              </div>
            </div>

            <section class="grid gap-3 rounded-card bg-[rgba(255,255,255,0.04)] p-4">
              <div class="grid gap-1">
                <h3 class="m-0 text-[1rem]">
                  {{ t('operatorDetail.labels.displayLevel') }}
                </h3>
                <p class="m-0 muted-copy">
                  {{ t('operatorDetail.descriptions.skillDisplayLevel') }}
                </p>
              </div>

              <SliderLikeControl
                v-model="selectedSkillLevel"
                :min="1"
                :max="selectedSkill.levels.length"
                :step="1"
                value-prefix="Lv."
              />
            </section>

            <section class="grid gap-3 rounded-card bg-[rgba(255,255,255,0.04)] p-4">
              <div class="grid gap-1">
                <h3 class="m-0 text-[1rem]">
                  {{ t('operatorDetail.labels.levelComparison') }}
                </h3>
                <p class="m-0 muted-copy">
                  {{ t('operatorDetail.descriptions.skillLevelComparison') }}
                </p>
              </div>

              <section
                v-if="skillRangeMatrix"
                class="grid gap-3 rounded-card bg-[rgba(255,255,255,0.04)] p-4"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="m-0 text-[1rem]">
                    {{ t('operatorDetail.labels.skillRange') }}
                  </h3>
                  <span
                    v-if="selectedSkillLevelInfo"
                    class="chip inline-flex items-center justify-center"
                  >
                    <img
                      v-if="getSkillLevelIcon(selectedSkillLevelInfo.level)"
                      :src="getSkillLevelIcon(selectedSkillLevelInfo.level)"
                      :alt="`Skill level ${selectedSkillLevelInfo.level}`"
                      class="h-5 w-auto object-contain"
                    >
                    <template v-else> Lv.{{ selectedSkillLevelInfo.level }} </template>
                  </span>
                </div>

                <div
                  class="grid w-fit gap-1 border border-line rounded-[20px] bg-[rgba(7,10,18,0.84)] p-2.5"
                  :style="{
                    gridTemplateColumns: `repeat(${skillRangeMatrix.columnCount}, minmax(0, 2rem))`,
                  }"
                >
                  <template v-for="row in skillRangeMatrix.rows" :key="row[0]?.key">
                    <div
                      v-for="cell in row"
                      :key="cell.key"
                      class="grid h-8 w-8 place-items-center border rounded-[10px] text-[0.74rem] font-700"
                      :class="
                        cell.isOrigin
                          ? 'border-[rgba(255,208,120,0.42)] bg-[linear-gradient(135deg,rgba(255,209,102,0.34),rgba(255,165,84,0.2))] text-[rgba(255,245,214,0.96)]'
                          : cell.isActive
                            ? 'border-[rgba(112,198,255,0.36)] bg-[linear-gradient(135deg,rgba(84,168,255,0.24),rgba(111,233,255,0.16))] text-[rgba(236,246,255,0.94)]'
                            : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] text-[rgba(149,162,190,0.38)]'
                      "
                    >
                      <span v-if="cell.isOrigin">●</span>
                    </div>
                  </template>
                </div>
              </section>

              <div ref="skillTableScroller" class="overflow-x-auto">
                <table class="min-w-full border-separate border-spacing-0 text-left text-[0.9rem]">
                  <thead>
                    <tr>
                      <th
                        class="sticky left-0 z-1 bg-[rgba(11,15,25,0.96)] px-3 py-2 text-[rgba(205,214,235,0.7)]"
                      >
                        {{ t('operatorDetail.labels.item') }}
                      </th>
                      <th
                        v-for="levelInfo in selectedSkill.levels"
                        :key="levelInfo.level"
                        :data-skill-level="levelInfo.level"
                        class="min-w-[72px] border-b border-line px-3 py-2 text-center text-[rgba(205,214,235,0.7)]"
                        :class="
                          levelInfo.level === selectedSkillLevel
                            ? 'bg-[rgba(89,181,255,0.16)] text-white'
                            : ''
                        "
                      >
                        <img
                          v-if="getSkillLevelIcon(levelInfo.level)"
                          :src="getSkillLevelIcon(levelInfo.level)"
                          :alt="`Skill level ${levelInfo.level}`"
                          class="mx-auto h-5 w-auto object-contain"
                        >
                        <template v-else>
                          Lv.{{ levelInfo.level }}
                        </template>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in selectedSkillMetricRows" :key="row.key" class="align-top">
                      <th
                        class="sticky left-0 bg-[rgba(11,15,25,0.96)] px-3 py-2 text-white font-600"
                      >
                        {{ row.label }}
                      </th>
                      <td
                        v-for="(value, index) in row.values"
                        :key="`${row.key}-${index}`"
                        class="border-b border-line px-3 py-2 text-center text-[rgba(236,240,250,0.88)]"
                        :class="
                          selectedSkill.levels[index]?.level === selectedSkillLevel
                            ? 'bg-[rgba(89,181,255,0.12)] text-white'
                            : ''
                        "
                      >
                        {{ value }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </article>
        </section>
      </el-collapse-item>
    </el-collapse>
  </section>

  <section v-else class="grid min-h-[70svh] place-content-center gap-3 text-center">
    <template v-if="isLoading">
      <h1 class="m-0">
        {{ t('operatorDetail.states.loadingTitle') }}
      </h1>
      <p class="muted-copy">
        {{ t('operatorDetail.states.loadingDescription') }}
      </p>
    </template>

    <template v-else-if="errorMessage">
      <h1 class="m-0">
        {{ t('operatorDetail.states.errorTitle') }}
      </h1>
      <p class="muted-copy">
        {{ errorMessage }}
      </p>
    </template>

    <template v-else>
      <h1 class="m-0">
        {{ t('operatorDetail.states.notFoundTitle') }}
      </h1>
      <p class="muted-copy">
        {{ t('operatorDetail.states.notFoundDescription') }}
      </p>
      <el-button type="primary" round @click="router.push('/operators')">
        {{ t('operatorDetail.states.backToList') }}
      </el-button>
    </template>
  </section>

  <el-drawer
    v-model="termSheetOpen"
    direction="btt"
    size="min(65vh, 32rem)"
    :with-header="false"
    class="term-drawer"
  >
    <div class="grid gap-3 p-4">
      <div class="grid gap-1">
        <p class="eyebrow m-0">
          {{ t('operatorDetail.labels.termSheet') }}
        </p>
        <h2 class="m-0 text-[1.2rem] font-700">
          {{ activeTermLabel }}
        </h2>
      </div>
      <RichTextContent
        class="m-0 text-[rgba(236,240,250,0.88)]"
        :segments="activeTermSegments"
        @term-click="handleTermSelection"
      />
    </div>
  </el-drawer>
</template>

<style scoped>
:deep(.chip-team) {
  background: rgba(113, 165, 255, 0.16);
  border-color: rgba(113, 165, 255, 0.28);
  color: #dce9ff;
}

:deep(.chip-nation) {
  background: rgba(196, 181, 253, 0.16);
  border-color: rgba(196, 181, 253, 0.28);
  color: #e9ddff;
}

:deep(.chip-group) {
  background: rgba(244, 114, 182, 0.16);
  border-color: rgba(244, 114, 182, 0.28);
  color: #ffd3e7;
}

:deep(.chip-profession) {
  background: rgba(255, 197, 79, 0.16);
  border-color: rgba(255, 197, 79, 0.28);
  color: #ffe3a3;
}

:deep(.chip-branch) {
  background: rgba(52, 211, 153, 0.16);
  border-color: rgba(52, 211, 153, 0.28);
  color: #bbf7d0;
}

:deep(.term-drawer .el-drawer) {
  background:
    radial-gradient(circle at top, rgba(109, 204, 255, 0.14), transparent 34%),
    linear-gradient(180deg, #0b1120 0%, #09101d 100%);
  color: #edf3ff;
  border-top: 1px solid rgba(130, 170, 255, 0.18);
}

:deep(.term-drawer .el-drawer__body) {
  padding: 0;
  background: transparent;
  color: #edf3ff;
}
</style>
