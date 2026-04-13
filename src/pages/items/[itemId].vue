<script setup lang="ts">
import type {
  BuildingFormulaBundle,
  ItemEntry,
  PenguinMatrixEntry,
} from '~/types/operator'
import { ArrowLeft } from '@element-plus/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useRegionPreference } from '~/composables'
import { getItemById, getPenguinItemMatrix, listBuildingFormulas, listItems } from '~/services/operators'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { region } = useRegionPreference()

const routeParams = route.params as { itemId?: string }
const item = ref<ItemEntry>()
const isLoading = ref(true)
const errorMessage = ref('')
const isDev = import.meta.env.DEV
const penguinDrops = ref<PenguinMatrixEntry[]>([])
const penguinErrorMessage = ref('')
const isPenguinLoading = ref(false)
const buildingFormulaBundle = ref<BuildingFormulaBundle>({
  manufactFormulas: [],
  workshopFormulas: [],
})
const buildingFormulaErrorMessage = ref('')
const allItems = ref<ItemEntry[]>([])
const penguinServer = ref<'CN' | 'US' | 'JP' | 'KR'>('CN')
const penguinSortKey = ref<'dropRate' | 'sampleCount'>('dropRate')
const penguinServerOptions = [
  { label: 'CN', value: 'CN' },
  { label: 'KR', value: 'KR' },
  { label: 'JP', value: 'JP' },
  { label: 'US', value: 'US' },
] as const
const penguinSortOptions = [
  { label: 'dropRate', value: 'dropRate' },
  { label: 'sampleCount', value: 'sampleCount' },
] as const

const sortedPenguinDrops = computed(() => {
  const entries = [...penguinDrops.value]
  if (penguinSortKey.value === 'sampleCount') {
    return entries.sort((left, right) => right.times - left.times || right.dropRate - left.dropRate || left.stageId.localeCompare(right.stageId))
  }

  return entries.sort((left, right) => right.dropRate - left.dropRate || right.times - left.times || left.stageId.localeCompare(right.stageId))
})

const linkedBuildingFormulas = computed(() => {
  if (!item.value)
    return []

  return item.value.buildingProductList
    .map((product) => {
      const isWorkshop = product.roomType.toUpperCase() === 'WORKSHOP'
      const formula = isWorkshop
        ? buildingFormulaBundle.value.workshopFormulas.find(entry => entry.formulaId === product.formulaId)
        : buildingFormulaBundle.value.manufactFormulas.find(entry => entry.formulaId === product.formulaId)

      if (!formula)
        return undefined

      return {
        formula,
      }
    })
    .filter((entry): entry is {
      formula: BuildingFormulaBundle['manufactFormulas'][number] | BuildingFormulaBundle['workshopFormulas'][number]
    } => Boolean(entry))
    .filter(entry => entry.formula.costs.length > 0)
})

function getItemMeta(itemId: string) {
  return allItems.value.find(entry => entry.itemId === itemId)
}

onMounted(() => {
  loadItem()
})

watch(
  () => [routeParams.itemId, region.value],
  () => {
    loadItem()
  },
)

watch(penguinServer, () => {
  if (item.value)
    loadPenguinDrops(item.value.itemId)
})

async function loadItem() {
  const itemId = String(routeParams.itemId ?? '')
  isLoading.value = true
  errorMessage.value = ''
  item.value = undefined
  penguinDrops.value = []
  penguinErrorMessage.value = ''
  buildingFormulaBundle.value = {
    manufactFormulas: [],
    workshopFormulas: [],
  }
  buildingFormulaErrorMessage.value = ''
  allItems.value = []

  try {
    item.value = await getItemById(itemId, region.value)
    if (item.value) {
      allItems.value = await listItems(region.value)
      try {
        buildingFormulaBundle.value = await listBuildingFormulas(region.value)
      }
      catch (buildingError) {
        buildingFormulaBundle.value = {
          manufactFormulas: [],
          workshopFormulas: [],
        }
        buildingFormulaErrorMessage.value = String(buildingError)
      }

      await loadPenguinDrops(item.value.itemId)
    }
  }
  catch (error) {
    errorMessage.value = String(error)
  }
  finally {
    isLoading.value = false
  }
}

async function loadPenguinDrops(itemId: string) {
  isPenguinLoading.value = true
  penguinErrorMessage.value = ''

  try {
    penguinDrops.value = await getPenguinItemMatrix(itemId, penguinServer.value)
  }
  catch (error) {
    penguinDrops.value = []
    penguinErrorMessage.value = String(error)
  }
  finally {
    isPenguinLoading.value = false
  }
}
</script>

<script lang="ts">
export default {
  layout: 'operators',
}
</script>

<template>
  <section class="page-grid">
    <TopBar
      :title="item?.name || t('itemsDetail.topBar.title')"
    >
      <template #left>
        <div class="flex items-center gap-3">
          <button type="button" class="top-bar-icon" @click="router.push('/items')">
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <ItemIcon
            v-if="item"
            :item-id="item.itemId"
            :icon-id="item.iconId"
            :name="item.name"
            class="h-[44px] w-[44px]"
          />
        </div>
      </template>
    </TopBar>

    <section v-if="isLoading" class="grid gap-3 panel-soft rounded-panel px-4 py-4.5">
      <div class="mx-auto h-[84px] w-[84px] animate-pulse rounded-[22px] bg-[rgba(255,255,255,0.06)]" />
      <div class="mx-auto h-5 w-[48%] animate-pulse rounded-full bg-[rgba(255,255,255,0.08)]" />
      <div class="h-18 animate-pulse rounded-[18px] bg-[rgba(255,255,255,0.04)]" />
    </section>

    <section v-else-if="errorMessage" class="grid gap-2.5 panel-soft rounded-panel p-4">
      <p class="m-0 text-[rgba(215,223,239,0.75)]">
        {{ t('itemsDetail.states.error') }}
      </p>
      <p class="m-0 text-[rgba(191,201,220,0.64)]">
        {{ errorMessage }}
      </p>
    </section>

    <section v-else-if="!item" class="grid gap-2.5 panel-soft rounded-panel p-4">
      <p class="m-0 text-[rgba(215,223,239,0.75)]">
        {{ t('itemsDetail.states.notFound') }}
      </p>
      <p class="m-0 text-[rgba(191,201,220,0.64)]">
        {{ t('itemsDetail.states.notFoundDescription') }}
      </p>
      <button type="button" class="action-btn justify-self-start" @click="router.push('/items')">
        {{ t('itemsDetail.states.backToList') }}
      </button>
    </section>

    <section v-else class="grid gap-4">
      <p v-if="isDev" class="m-0 text-center text-[0.76rem] text-[rgba(191,201,220,0.5)]">
        {{ item.itemId }}
      </p>

      <section v-if="linkedBuildingFormulas.length || buildingFormulaErrorMessage" class="grid gap-3 panel-soft rounded-panel px-4 py-4.5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="m-0 text-[0.98rem] text-white font-700 tracking-[-0.02em]">
            {{ t('itemsDetail.sections.buildingRecipes') }}
          </h3>
        </div>

        <section v-if="buildingFormulaErrorMessage" class="grid gap-1.5 panel-soft rounded-panel p-4">
          <p class="m-0 text-[0.9rem] text-[rgba(215,223,239,0.75)]">
            {{ t('itemsDetail.states.buildingFormulaError') }}
          </p>
          <p class="m-0 text-[0.82rem] text-[rgba(191,201,220,0.64)]">
            {{ buildingFormulaErrorMessage }}
          </p>
        </section>

        <section v-else-if="linkedBuildingFormulas.length" class="grid gap-2">
          <div
            v-for="entry in linkedBuildingFormulas"
            :key="entry.formula.formulaId"
            class="grid gap-2"
          >
            <div
              v-for="cost in entry.formula.costs"
              :key="`${entry.formula.formulaId}:${cost.id}`"
              class="flex items-center justify-between gap-3 rounded-[14px] bg-[rgba(255,255,255,0.035)] px-3 py-2"
            >
              <div class="min-w-0 flex items-center gap-3">
                <ItemIcon
                  :item-id="cost.id"
                  :icon-id="getItemMeta(cost.id)?.iconId"
                  :name="getItemMeta(cost.id)?.name || cost.id"
                  class="h-[40px] w-[40px] shrink-0"
                />
                <div class="grid min-w-0 gap-0.5">
                  <strong class="truncate text-[0.9rem] text-white font-600">
                    {{ getItemMeta(cost.id)?.name || cost.id }}
                  </strong>
                  <span class="truncate text-[0.76rem] text-[rgba(191,201,220,0.64)]">
                    {{ cost.type }}
                  </span>
                </div>
              </div>
              <span class="text-[0.88rem] text-[rgba(191,201,220,0.8)] font-700">
                x{{ cost.count }}
              </span>
            </div>
          </div>
        </section>
      </section>

      <section class="grid gap-3 panel-soft rounded-panel px-4 py-4.5">
        <div class="flex items-center justify-between gap-3">
          <h3 class="m-0 text-[0.98rem] text-white font-700 tracking-[-0.02em]">
            {{ t('itemsDetail.sections.penguinDrops') }}
          </h3>
          <div class="flex items-center gap-2">
            <el-select
              v-model="penguinSortKey"
              class="w-28"
              size="small"
            >
              <el-option
                v-for="option in penguinSortOptions"
                :key="option.value"
                :label="t(`itemsDetail.sort.${option.label}`)"
                :value="option.value"
              />
            </el-select>

            <el-select
              v-model="penguinServer"
              class="w-30"
              size="small"
            >
              <el-option
                v-for="option in penguinServerOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </div>

        <section v-if="isPenguinLoading" class="grid gap-2">
          <article
            v-for="index in 4"
            :key="index"
            class="grid animate-pulse gap-2 panel-soft rounded-panel p-4"
          >
            <div class="h-4 w-[42%] rounded-full bg-[rgba(255,255,255,0.08)]" />
            <div class="h-3 w-[68%] rounded-full bg-[rgba(255,255,255,0.05)]" />
          </article>
        </section>

        <section v-else-if="penguinErrorMessage" class="grid gap-1.5 panel-soft rounded-panel p-4">
          <p class="m-0 text-[0.9rem] text-[rgba(215,223,239,0.75)]">
            {{ t('itemsDetail.states.penguinError') }}
          </p>
          <p class="m-0 text-[0.82rem] text-[rgba(191,201,220,0.64)]">
            {{ penguinErrorMessage }}
          </p>
        </section>

        <section v-else-if="sortedPenguinDrops.length" class="grid gap-2">
          <article
            v-for="entry in sortedPenguinDrops"
            :key="`${entry.stageId}:${entry.start || 'none'}:${entry.end || 'none'}`"
            class="grid gap-2 panel-soft rounded-panel p-4"
          >
            <strong class="text-[0.96rem] text-white font-600">{{ entry.stageId }}</strong>
            <div class="flex flex-wrap gap-2">
              <span class="chip">
                {{ t('itemsDetail.labels.dropRate') }} {{ (entry.dropRate * 100).toFixed(2) }}%
              </span>
              <span class="chip">
                {{ t('itemsDetail.labels.sampleCount') }} {{ entry.times }}
              </span>
              <span class="chip">
                {{ t('itemsDetail.labels.dropSourcePenguin', { server: penguinServer }) }}
              </span>
            </div>
          </article>
        </section>

        <p v-else class="m-0 text-[0.9rem] text-[rgba(191,201,220,0.72)]">
          {{ t('itemsDetail.states.noPenguinDrops') }}
        </p>
      </section>
    </section>
  </section>
</template>
