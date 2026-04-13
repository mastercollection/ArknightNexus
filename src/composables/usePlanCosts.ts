import type {
  ItemEntry,
  OperatorDetail,
  OperatorUpgradeCost,
  UserPlan,
  UserPlanModule,
  UserPlanOperator,
  UserPlanOperatorState,
} from '~/types/operator'

const LMD_ITEM_ID = '4001'
const LS6_EXP_PER_RUN = 10000
const CE6_LMD_PER_RUN = 10000
const SUPPLY_STAGE_SANITY = 36
const MAX_ELITE = 2
const MAX_MODULE_STAGE = 3
const MAX_SKILL_LEVEL = 10

export interface PlanMaterialTotal {
  id: string
  name: string
  iconId?: string | null
  rarity?: string | null
  type?: string | null
  count: number
}

export interface PlanCostBreakdown {
  valid: boolean
  exp: number
  materials: PlanMaterialTotal[]
  errors: string[]
}

export interface PlanAggregateBreakdown extends PlanCostBreakdown {
  operatorCount: number
}

export interface PlanFarmingEstimate {
  exp: number
  lmd: number
  lmdItem?: PlanMaterialTotal
  expStage: {
    code: 'LS-6'
    runs: number
    sanity: number
  }
  lmdStage: {
    code: 'CE-6'
    runs: number
    sanity: number
  }
  totalSanity: number
}

export function getEliteLevelCap(detail: OperatorDetail, elite: number) {
  const safeElite = Math.min(Math.max(elite, 0), detail.eliteCaps.length - 1)
  return detail.eliteCaps[safeElite] ?? 1
}

export function createDefaultPlanOperator(detail: OperatorDetail): UserPlanOperator {
  return {
    operatorId: detail.id,
    current: {
      elite: 0,
      level: 1,
      skillLevels: buildDefaultSkillLevels(detail.skills.length),
      modules: detail.modules.map(module => ({
        moduleId: module.uniEquipId,
        currentStage: 0,
        targetStage: 0,
      })),
    },
    target: {
      elite: detail.eliteCaps.length > 2 ? 2 : Math.max(detail.eliteCaps.length - 1, 0),
      level: getEliteLevelCap(detail, detail.eliteCaps.length > 2 ? 2 : Math.max(detail.eliteCaps.length - 1, 0)),
      skillLevels: buildDefaultSkillLevels(detail.skills.length),
      modules: detail.modules.map(module => ({
        moduleId: module.uniEquipId,
        currentStage: 0,
        targetStage: getMaxModuleStage(module),
      })),
    },
  }
}

export function resolvePlanOperator(detail: OperatorDetail, plan?: UserPlanOperator | null): UserPlanOperator {
  const fallback = createDefaultPlanOperator(detail)
  if (!plan)
    return fallback

  return {
    operatorId: detail.id,
    current: normalizePlanState(detail, plan.current, fallback.current),
    target: normalizePlanState(detail, plan.target, fallback.target),
  }
}

export function getPlanByOperatorId(plan: UserPlan, operatorId: string) {
  return plan.operators.find(entry => entry.operatorId === operatorId)
}

export function calculatePlanCosts(detail: OperatorDetail, plan: UserPlanOperator): PlanCostBreakdown {
  return calculatePlanCostsWithItems(detail, plan, {})
}

export function calculatePlanCostsWithItems(
  detail: OperatorDetail,
  plan: UserPlanOperator,
  itemsById: Record<string, ItemEntry>,
): PlanCostBreakdown {
  const resolved = resolvePlanOperator(detail, plan)
  const errors = validatePlanRange(detail, resolved)
  const materialMap = new Map<string, PlanMaterialTotal>()
  let exp = 0

  if (errors.length) {
    return { valid: false, exp, materials: [], errors }
  }

  for (const segment of collectLevelSegments(detail, resolved.current, resolved.target)) {
    const expTable = detail.eliteExpCosts[segment.elite] ?? []
    const goldTable = detail.eliteUpgradeGoldCosts[segment.elite] ?? []
    for (let level = segment.fromLevel; level < segment.toLevel; level++) {
      exp += expTable[level - 1] ?? 0
      appendVirtualItemMaterial(materialMap, itemsById, LMD_ITEM_ID, goldTable[level - 1] ?? 0)
    }
  }

  for (let elite = resolved.current.elite; elite < resolved.target.elite; elite++) {
    appendVirtualItemMaterial(materialMap, itemsById, LMD_ITEM_ID, detail.eliteEvolveGoldCosts[elite] ?? 0)
    for (const cost of detail.eliteEvolveCosts?.[elite] ?? [])
      appendCost(materialMap, cost)
  }

  for (let skillIndex = 0; skillIndex < detail.skills.length; skillIndex++) {
    const currentLevel = resolved.current.skillLevels[skillIndex] ?? 1
    const targetLevel = resolved.target.skillLevels[skillIndex] ?? currentLevel

    for (let nextLevel = currentLevel + 1; nextLevel <= targetLevel; nextLevel++) {
      const stage = nextLevel <= 7
        ? detail.allSkillLevelUpCosts?.find(entry => entry.level === nextLevel)
        : detail.skills[skillIndex]?.upgradeCosts?.find(entry => entry.level === nextLevel)

      for (const cost of stage?.costs ?? [])
        appendCost(materialMap, cost)
    }
  }

  for (const module of mergeModules(detail, resolved.current.modules, resolved.target.modules)) {
    if (module.currentStage > module.targetStage)
      continue

    const detailModule = detail.modules.find(entry => entry.uniEquipId === module.moduleId)
    if (!detailModule)
      continue

    for (let stage = module.currentStage + 1; stage <= module.targetStage; stage++) {
      for (const cost of detailModule.itemCost?.[String(stage)] ?? [])
        appendCost(materialMap, cost)
    }
  }

  return {
    valid: true,
    exp,
    materials: Array.from(materialMap.values()).sort(comparePlanMaterials),
    errors,
  }
}

export function aggregatePlanCosts(
  entries: Array<{ detail: OperatorDetail, plan: UserPlanOperator }>,
): PlanAggregateBreakdown {
  return aggregatePlanCostsWithItems(entries, {})
}

export function aggregatePlanCostsWithItems(
  entries: Array<{ detail: OperatorDetail, plan: UserPlanOperator }>,
  itemsById: Record<string, ItemEntry>,
): PlanAggregateBreakdown {
  const aggregateMap = new Map<string, PlanMaterialTotal>()
  const errors = new Set<string>()
  let exp = 0
  let operatorCount = 0

  for (const entry of entries) {
    const result = calculatePlanCostsWithItems(entry.detail, entry.plan, itemsById)
    result.errors.forEach(error => errors.add(error))

    if (!result.valid)
      continue

    operatorCount += 1
    exp += result.exp

    for (const material of result.materials) {
      const key = material.id
      const existing = aggregateMap.get(key)
      if (existing) {
        existing.count += material.count
      }
      else {
        aggregateMap.set(key, { ...material })
      }
    }
  }

  return {
    valid: errors.size === 0,
    exp,
    materials: Array.from(aggregateMap.values()).sort(comparePlanMaterials),
    errors: Array.from(errors),
    operatorCount,
  }
}

export function estimatePlanFarming(breakdown: PlanCostBreakdown): PlanFarmingEstimate {
  const lmdItem = breakdown.materials.find(material => material.id === LMD_ITEM_ID)
  const lmd = lmdItem?.count ?? 0
  const expRuns = Math.ceil(breakdown.exp / LS6_EXP_PER_RUN)
  const lmdRuns = Math.ceil(lmd / CE6_LMD_PER_RUN)

  return {
    exp: breakdown.exp,
    lmd,
    lmdItem,
    expStage: {
      code: 'LS-6',
      runs: expRuns,
      sanity: expRuns * SUPPLY_STAGE_SANITY,
    },
    lmdStage: {
      code: 'CE-6',
      runs: lmdRuns,
      sanity: lmdRuns * SUPPLY_STAGE_SANITY,
    },
    totalSanity: (expRuns + lmdRuns) * SUPPLY_STAGE_SANITY,
  }
}

function normalizePlanState(
  detail: OperatorDetail,
  state: UserPlanOperatorState,
  fallback: UserPlanOperatorState,
): UserPlanOperatorState {
  const elite = clamp(state?.elite ?? fallback.elite, 0, Math.min(MAX_ELITE, detail.eliteCaps.length - 1))
  const level = clamp(state?.level ?? fallback.level, 1, getEliteLevelCap(detail, elite))
  const skillCount = Math.max(detail.skills.length, 3)
  const skillLevels = Array.from({ length: skillCount }, (_, index) =>
    clamp(state?.skillLevels?.[index] ?? fallback.skillLevels[index] ?? 1, 1, MAX_SKILL_LEVEL))

  const modules = mergeModules(detail, state?.modules ?? fallback.modules, fallback.modules)
    .map(module => ({
      moduleId: module.moduleId,
      currentStage: clamp(module.currentStage, 0, MAX_MODULE_STAGE),
      targetStage: clamp(module.targetStage, 0, MAX_MODULE_STAGE),
    }))

  return {
    elite,
    level,
    skillLevels,
    modules,
  }
}

function validatePlanRange(detail: OperatorDetail, plan: UserPlanOperator) {
  const errors: string[] = []

  if (compareState(plan.current, plan.target) > 0)
    errors.push(`${detail.name}: 초기 육성 단계가 목표보다 높습니다.`)

  plan.current.skillLevels.forEach((level, index) => {
    const target = plan.target.skillLevels[index] ?? level
    if (level > target)
      errors.push(`${detail.name}: 스킬 ${index + 1}의 초기 레벨이 목표보다 높습니다.`)
  })

  for (const module of mergeModules(detail, plan.current.modules, plan.target.modules)) {
    if (module.currentStage > module.targetStage)
      errors.push(`${detail.name}: 모듈 단계 설정이 올바르지 않습니다.`)
  }

  return errors
}

function compareState(left: UserPlanOperatorState, right: UserPlanOperatorState) {
  if (left.elite !== right.elite)
    return left.elite - right.elite

  return left.level - right.level
}

function collectLevelSegments(detail: OperatorDetail, current: UserPlanOperatorState, target: UserPlanOperatorState) {
  const segments: Array<{ elite: number, fromLevel: number, toLevel: number }> = []

  if (current.elite === target.elite) {
    segments.push({ elite: current.elite, fromLevel: current.level, toLevel: target.level })
    return segments
  }

  segments.push({
    elite: current.elite,
    fromLevel: current.level,
    toLevel: getEliteLevelCap(detail, current.elite),
  })

  for (let elite = current.elite + 1; elite < target.elite; elite++) {
    segments.push({
      elite,
      fromLevel: 1,
      toLevel: getEliteLevelCap(detail, elite),
    })
  }

  segments.push({
    elite: target.elite,
    fromLevel: 1,
    toLevel: target.level,
  })

  return segments
}

function appendCost(materialMap: Map<string, PlanMaterialTotal>, cost: OperatorUpgradeCost) {
  appendNamedMaterial(
    materialMap,
    cost.id,
    cost.itemName?.trim() || cost.id,
    cost.count,
    cost.itemIconId,
    cost.itemRarity,
    cost.itemType,
  )
}

function appendNamedMaterial(
  materialMap: Map<string, PlanMaterialTotal>,
  id: string,
  name: string,
  count: number,
  iconId?: string | null,
  rarity?: string | null,
  type?: string | null,
) {
  if (count <= 0)
    return

  const existing = materialMap.get(id)
  if (existing) {
    existing.count += count
    return
  }

  materialMap.set(id, {
    id,
    name,
    iconId,
    rarity,
    type,
    count,
  })
}

function appendVirtualItemMaterial(
  materialMap: Map<string, PlanMaterialTotal>,
  itemsById: Record<string, ItemEntry>,
  itemId: string,
  count: number,
) {
  const item = itemsById[itemId]
  appendNamedMaterial(
    materialMap,
    itemId,
    item?.name?.trim() || itemId,
    count,
    item?.iconId,
    item?.rarity,
    item?.itemType,
  )
}

function comparePlanMaterials(left: PlanMaterialTotal, right: PlanMaterialTotal) {
  return getMaterialTier(right) - getMaterialTier(left)
    || right.count - left.count
    || left.name.localeCompare(right.name)
}

function getMaterialTier(material: PlanMaterialTotal) {
  const normalized = String(material.rarity ?? '').trim().toLowerCase()
  const matched = normalized.match(/\d+/)
  if (matched)
    return Number.parseInt(matched[0], 10)

  return 0
}

function mergeModules(
  detail: OperatorDetail,
  primary: UserPlanModule[],
  fallback: UserPlanModule[],
) {
  return detail.modules.map((module) => {
    const current = primary.find(entry => entry.moduleId === module.uniEquipId)
    const backup = fallback.find(entry => entry.moduleId === module.uniEquipId)
    return {
      moduleId: module.uniEquipId,
      currentStage: current?.currentStage ?? backup?.currentStage ?? 0,
      targetStage: current?.targetStage ?? backup?.targetStage ?? getMaxModuleStage(module),
    }
  })
}

function getMaxModuleStage(module: OperatorDetail['modules'][number]) {
  return Math.min(
    MAX_MODULE_STAGE,
    Math.max(0, ...module.battlePhases.map(phase => phase.equipLevel)),
  )
}

function buildDefaultSkillLevels(skillCount: number) {
  return Array.from({ length: Math.max(skillCount, 3) }, () => 1)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
