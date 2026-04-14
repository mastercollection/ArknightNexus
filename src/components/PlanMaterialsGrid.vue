<script setup lang="ts">
import type { PlanMaterialTotal } from '~/composables/usePlanCosts'
import type { BuildingFormulaBundle, ItemEntry } from '~/types/operator'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ItemIcon from '~/components/ItemIcon.vue'
import { expandPlanMaterials } from '~/composables/usePlanMaterialExpansion'

const props = withDefaults(defineProps<{
  materials: PlanMaterialTotal[]
  emptyLabel: string
  formulas?: BuildingFormulaBundle | null
  itemsById?: Record<string, ItemEntry>
  excludeItemIds?: string[]
  columnsClass?: string
  expanded?: boolean
  showShortage?: boolean
}>(), {
  formulas: null,
  itemsById: () => ({}),
  excludeItemIds: () => ['4001'],
  columnsClass: 'grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4',
  expanded: false,
  showShortage: false,
})
const emit = defineEmits<{
  (event: 'toggleExpand'): void
}>()

const { t } = useI18n()
const router = useRouter()
const numberFormatter = new Intl.NumberFormat('ko-KR')
const canExpandRecipes = computed(() => Boolean(props.formulas?.workshopFormulas.length))
const displayedMaterials = computed(() =>
  props.expanded && props.formulas
    ? expandPlanMaterials(props.materials, props.formulas, props.itemsById)
    : props.materials,
)
const filteredMaterials = computed(() =>
  displayedMaterials.value.filter(material => !props.excludeItemIds.includes(material.id)),
)

const materialGroups = computed(() => {
  const grouped = new Map<number, PlanMaterialTotal[]>()

  for (const material of filteredMaterials.value) {
    const tier = getMaterialTier(material.rarity)
    const bucket = grouped.get(tier)
    if (bucket)
      bucket.push(material)
    else
      grouped.set(tier, [material])
  }

  return Array.from(grouped.entries())
    .sort((left, right) => right[0] - left[0])
    .map(([tier, entries]) => ({ tier, entries }))
})

function getMaterialTier(rarity?: string | null) {
  const matched = String(rarity ?? '').match(/\d+/)
  return matched ? Number.parseInt(matched[0], 10) : 0
}

function getMaterialTierLabel(tier: number) {
  return tier > 0 ? `T${tier}` : t('planPage.summary.miscTier')
}

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function getShortageCount(itemId: string, requiredCount: number) {
  if (!props.showShortage)
    return 0

  const ownedCount = props.itemsById[itemId]?.ownedCount ?? 0
  return Math.max(0, requiredCount - ownedCount)
}

function openItemDetail(itemId: string) {
  router.push(`/items/${itemId}`)
}
</script>

<template>
  <div class="grid gap-4">
    <template v-if="materialGroups.length">
      <section
        v-for="group in materialGroups"
        :key="`${expanded ? 'expanded' : 'collapsed'}:${group.tier}`"
        class="grid gap-2.5"
      >
        <div class="flex items-center justify-between gap-3">
          <strong class="text-[0.82rem] text-[rgba(215,223,239,0.82)] font-700">{{ getMaterialTierLabel(group.tier) }}</strong>
          <div v-if="canExpandRecipes && group.tier === materialGroups[0]?.tier" class="flex items-center gap-2.5">
            <span class="text-[0.74rem] text-[rgba(226,233,247,0.72)]">
              {{ expanded ? t('planPage.summary.showOriginalMaterials') : t('planPage.summary.expandRecipes') }}
            </span>
            <button
              type="button"
              class="relative h-5 w-9.5 border border-[rgba(122,144,184,0.22)] rounded-pill bg-[rgba(255,255,255,0.08)] p-0 transition-colors"
              :class="expanded ? 'bg-[rgba(40,144,255,0.9)]' : 'bg-[rgba(255,255,255,0.08)]'"
              :aria-pressed="expanded"
              @click="emit('toggleExpand')"
            >
              <span
                class="absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.28)] transition-transform"
                :class="expanded ? 'translate-x-4' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>
        <div class="grid" :class="columnsClass">
          <article
            v-for="material in group.entries"
            :key="material.id"
            class="grid gap-1.5 rounded-panel bg-[rgba(255,255,255,0.03)] px-2.5 py-2 text-center"
          >
            <button
              type="button"
              class="mx-auto scale-90 border-0 bg-transparent p-0"
              @click="openItemDetail(material.id)"
            >
              <ItemIcon :item-id="material.id" :icon-id="material.iconId" :name="material.name" />
            </button>
            <strong class="truncate text-[0.8rem] text-white">{{ material.name }}</strong>
            <span class="text-[0.72rem] text-[rgba(191,201,220,0.68)]">
              {{ t('planPage.summary.requiredCount', { count: formatNumber(material.count) }) }}
              <template v-if="getShortageCount(material.id, material.count) > 0">
                <span class="mx-1 text-[rgba(191,201,220,0.42)]">/</span>
                <span class="text-[rgba(255,172,172,0.86)] font-700">
                  {{ t('planPage.summary.shortageOnly', {
                    shortage: formatNumber(getShortageCount(material.id, material.count)),
                  }) }}
                </span>
              </template>
            </span>
          </article>
        </div>
      </section>
    </template>

    <p v-else class="m-0 text-[0.82rem] text-[rgba(191,201,220,0.68)]">
      {{ emptyLabel }}
    </p>
  </div>
</template>
