<script setup lang="ts">
import type { PlanMaterialTotal } from '~/composables/usePlanCosts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ItemIcon from '~/components/ItemIcon.vue'

const props = withDefaults(defineProps<{
  materials: PlanMaterialTotal[]
  emptyLabel: string
  excludeItemIds?: string[]
  columnsClass?: string
}>(), {
  excludeItemIds: () => ['4001'],
  columnsClass: 'grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4',
})

const { t } = useI18n()
const numberFormatter = new Intl.NumberFormat('ko-KR')

const materialGroups = computed(() => {
  const grouped = new Map<number, PlanMaterialTotal[]>()

  for (const material of props.materials.filter(material => !props.excludeItemIds.includes(material.id))) {
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
</script>

<template>
  <div v-if="materialGroups.length" class="grid gap-4">
    <section v-for="group in materialGroups" :key="group.tier" class="grid gap-2.5">
      <div class="flex items-center gap-3">
        <strong class="text-[0.82rem] text-[rgba(215,223,239,0.82)] font-700">{{ getMaterialTierLabel(group.tier) }}</strong>
      </div>
      <div class="grid" :class="columnsClass">
        <article
          v-for="material in group.entries"
          :key="material.id"
          class="grid gap-1.5 rounded-panel bg-[rgba(255,255,255,0.03)] px-2.5 py-2 text-center"
        >
          <div class="mx-auto scale-90">
            <ItemIcon :item-id="material.id" :icon-id="material.iconId" :name="material.name" />
          </div>
          <strong class="truncate text-[0.8rem] text-white">{{ material.name }}</strong>
          <span class="text-[0.72rem] text-[rgba(191,201,220,0.68)]">{{ formatNumber(material.count) }}</span>
        </article>
      </div>
    </section>
  </div>

  <p v-else class="m-0 text-[0.82rem] text-[rgba(191,201,220,0.68)]">
    {{ emptyLabel }}
  </p>
</template>
