import type { BuildingFormulaBundle, BuildingCostEntry, ItemEntry } from '~/types/operator'
import type { PlanMaterialTotal } from '~/composables/usePlanCosts'

const LMD_ITEM_ID = '4001'

export function expandPlanMaterials(
  materials: PlanMaterialTotal[],
  formulas: BuildingFormulaBundle,
  itemsById: Record<string, ItemEntry>,
) {
  const workshopFormulaByItemId = new Map(
    formulas.workshopFormulas
      .filter(formula => formula.formulaType !== 'F_ASC')
      .map(formula => [formula.itemId, formula] as const),
  )
  const manufactFormulaByItemId = new Map(
    formulas.manufactFormulas
      .filter(formula => formula.formulaType === 'F_ASC')
      .map(formula => [formula.itemId, formula] as const),
  )
  const expanded = new Map<string, PlanMaterialTotal>()

  for (const material of materials)
    appendExpandedMaterial(
      expanded,
      material,
      workshopFormulaByItemId,
      manufactFormulaByItemId,
      itemsById,
      new Set(),
    )

  return Array.from(expanded.values())
}

function appendExpandedMaterial(
  expanded: Map<string, PlanMaterialTotal>,
  material: PlanMaterialTotal,
  workshopFormulaByItemId: Map<string, BuildingFormulaBundle['workshopFormulas'][number]>,
  manufactFormulaByItemId: Map<string, BuildingFormulaBundle['manufactFormulas'][number]>,
  itemsById: Record<string, ItemEntry>,
  visiting: Set<string>,
) {
  if (visiting.has(material.id)) {
    appendMaterial(expanded, material)
    return
  }

  const workshopFormula = workshopFormulaByItemId.get(material.id)
  const manufactFormula = manufactFormulaByItemId.get(material.id)

  if (workshopFormula) {
    appendExpandedByFormula(
      expanded,
      material,
      workshopFormula.costs,
      workshopFormula.count,
      workshopFormula.goldCost,
      workshopFormulaByItemId,
      manufactFormulaByItemId,
      itemsById,
      visiting,
    )
    return
  }

  if (manufactFormula) {
    appendExpandedByFormula(
      expanded,
      material,
      manufactFormula.costs,
      manufactFormula.count,
      0,
      workshopFormulaByItemId,
      manufactFormulaByItemId,
      itemsById,
      visiting,
    )
    return
  }

  appendMaterial(expanded, material)
}

function appendExpandedByFormula(
  expanded: Map<string, PlanMaterialTotal>,
  material: PlanMaterialTotal,
  costs: BuildingCostEntry[],
  outputCount: number,
  goldCost: number,
  workshopFormulaByItemId: Map<string, BuildingFormulaBundle['workshopFormulas'][number]>,
  manufactFormulaByItemId: Map<string, BuildingFormulaBundle['manufactFormulas'][number]>,
  itemsById: Record<string, ItemEntry>,
  visiting: Set<string>,
) {
  if ((costs?.length ?? 0) === 0 && goldCost <= 0) {
    appendMaterial(expanded, material)
    return
  }

  const requiredCrafts = Math.ceil(material.count / Math.max(1, outputCount))
  const nextVisiting = new Set(visiting)
  nextVisiting.add(material.id)

  for (const cost of costs)
    appendExpandedCost(expanded, cost, requiredCrafts, workshopFormulaByItemId, manufactFormulaByItemId, itemsById, nextVisiting)

  if (goldCost > 0) {
    appendExpandedCost(
      expanded,
      { id: LMD_ITEM_ID, count: goldCost, type: 'MATERIAL' },
      requiredCrafts,
      workshopFormulaByItemId,
      manufactFormulaByItemId,
      itemsById,
      nextVisiting,
    )
  }
}

function appendExpandedCost(
  expanded: Map<string, PlanMaterialTotal>,
  cost: BuildingCostEntry,
  multiplier: number,
  workshopFormulaByItemId: Map<string, BuildingFormulaBundle['workshopFormulas'][number]>,
  manufactFormulaByItemId: Map<string, BuildingFormulaBundle['manufactFormulas'][number]>,
  itemsById: Record<string, ItemEntry>,
  visiting: Set<string>,
) {
  const item = itemsById[cost.id]
  const nextMaterial: PlanMaterialTotal = {
    id: cost.id,
    name: item?.name?.trim() || cost.id,
    iconId: item?.iconId,
    rarity: item?.rarity,
    type: item?.itemType,
    count: cost.count * multiplier,
  }

  appendExpandedMaterial(expanded, nextMaterial, workshopFormulaByItemId, manufactFormulaByItemId, itemsById, visiting)
}

function appendMaterial(expanded: Map<string, PlanMaterialTotal>, material: PlanMaterialTotal) {
  const existing = expanded.get(material.id)
  if (existing) {
    existing.count += material.count
    return
  }

  expanded.set(material.id, { ...material })
}
