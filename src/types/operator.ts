export interface OperatorSummary {
  id: string
  name: string
  rarity: number
  profession: string
  branch: string
  teams: string[]
  nations: string[]
  groups: string[]
  thumbnailHue: number
}

export interface OperatorStatPoint {
  hp: number
  attack: number
  defense: number
  resistance: number
  redeployTime: number
  dpCost: number
  block: number
  attackInterval: number
  hpRecoveryPerSec: number
}

export interface OperatorStatProgression {
  level: number
  min: OperatorStatPoint
  max: OperatorStatPoint
  range?: OperatorRange | null
}

export interface OperatorBlackboardEntry {
  key: string
  value: number | null
  valueStr: string | null
}

export interface OperatorSkill {
  id: string
  name: string
  recoveryType: string
  activationType: string
  description: string
  unlockElite?: number
  unlockLevel?: number
  levels: OperatorSkillLevel[]
}

export interface OperatorRangeGrid {
  row: number
  col: number
}

export interface OperatorRange {
  id: string
  grids: OperatorRangeGrid[]
}

export interface OperatorTalent {
  groupKey: string
  name: string
  description: string
  elite: number
  level: number
  requiredPotentialRank: number
  blackboard: OperatorBlackboardEntry[]
}

export interface OperatorPotential {
  rank: number
  description: string
}

export interface ModuleCost {
  id: string
  count: number
  type: string
  itemName?: string | null
  itemRarity?: string | null
  itemIconId?: string | null
  itemType?: string | null
}

export interface OperatorModuleBattlePhase {
  equipLevel: number
  parts: OperatorModuleBattlePart[]
  attributeBlackboard: OperatorBlackboardEntry[]
}

export interface OperatorModuleBattlePart {
  target: string
  traitCandidates: OperatorModuleTraitCandidate[]
  talentCandidates: OperatorModuleTalentCandidate[]
}

export interface OperatorModuleTraitCandidate {
  description: string
  elite: number
  level: number
  requiredPotentialRank: number
  blackboard: OperatorBlackboardEntry[]
  range?: OperatorRange | null
}

export interface OperatorModuleTalentCandidate {
  name?: string | null
  description: string
  elite: number
  level: number
  requiredPotentialRank: number
  blackboard: OperatorBlackboardEntry[]
  range?: OperatorRange | null
}

export interface OperatorModule {
  uniEquipId: string
  uniEquipName: string
  uniEquipIcon: string
  uniEquipDesc: string
  typeIcon: string
  unlockEvolvePhase: string
  charId: string
  unlockLevel: number
  missionList: string[]
  unlockFavors?: Record<string, number> | null
  unlockFavorPercents?: Record<string, number> | null
  itemCost?: Record<string, ModuleCost[]> | null
  isSpecialEquip: boolean
  specialEquipDesc?: string | null
  battlePhases: OperatorModuleBattlePhase[]
}

export interface OperatorTrait {
  groupKey: string
  description: string
  elite: number
  level: number
  requiredPotentialRank: number
  blackboard: OperatorBlackboardEntry[]
}

export interface OperatorSkillLevel {
  level: number
  spCost: number
  initialSp: number
  duration: number
  description: string
  blackboard: OperatorBlackboardEntry[]
  range?: OperatorRange | null
}

export interface OperatorDetail extends OperatorSummary {
  codename: string
  quote: string
  tags: string[]
  traits: OperatorTrait[]
  talents: OperatorTalent[]
  potentials: OperatorPotential[]
  modules: OperatorModule[]
  archetypeDescription: string
  eliteCaps: number[]
  stats: OperatorStatProgression[]
  skills: OperatorSkill[]
}

export interface OperatorFilters {
  query?: string
  rarity?: number | null
  profession?: string | null
}

export type RegionCode = 'cn' | 'kr' | 'jp' | 'tw' | 'en'

export interface RegionSyncStatus {
  region: RegionCode
  sourceRevision: string | null
  fetchedAt: string | null
  operatorCount: number
  isReady: boolean
}

export interface SyncResult {
  region: RegionCode
  sourceRevision: string
  updatedAt: string
  operatorCount: number
  status: string
}

export type RegionTerms = Record<string, string>
