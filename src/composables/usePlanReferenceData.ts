import type { BuildingFormulaBundle, ItemEntry, RegionCode } from '~/types/operator'
import { listBuildingFormulas, listItems } from '~/services/operators'

export async function loadPlanReferenceData(region: RegionCode) {
  const [items, formulas] = await Promise.all([
    listItems(region),
    listBuildingFormulas(region),
  ])

  return {
    items,
    itemsById: Object.fromEntries(items.map(item => [item.itemId, item] as const)) as Record<string, ItemEntry>,
    formulas,
  }
}

export function createEmptyBuildingFormulaBundle(): BuildingFormulaBundle {
  return {
    manufactFormulas: [],
    workshopFormulas: [],
  }
}
