<script setup lang="ts">
import type { BuildingFormulaBundle, ItemEntry, OperatorDetail, OperatorSummary, UserPlan } from '~/types/operator'
import { ArrowLeft, Check, Close, Delete, Plus, Search } from '@element-plus/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ItemIcon from '~/components/ItemIcon.vue'
import PlanMaterialsGrid from '~/components/PlanMaterialsGrid.vue'
import { loadPlanReferenceData, createEmptyBuildingFormulaBundle } from '~/composables/usePlanReferenceData'
import { useRegionPreference } from '~/composables'
import { aggregatePlanCostsWithItems, estimatePlanFarming, getPlanByOperatorId, resolvePlanOperator } from '~/composables/usePlanCosts'
import { translateProfession } from '~/i18n'
import {
  getOperatorById,
  getUserFavorites,
  getUserPlan,
  listItems,
  listOperators,
  removeUserPlanOperator,
  saveUserPlanSelection,
} from '~/services/operators'

const router = useRouter()
const { t } = useI18n()
const { region } = useRegionPreference()

const isLoading = ref(true)
const summaryLoading = ref(false)
const errorMessage = ref('')
const summaryErrorMessage = ref('')
const pickerOpen = ref(false)
const pickerQuery = ref('')
const activeTab = ref<'operators' | 'summary'>('operators')
const selectionMode = ref(false)
const pendingRemovalIds = ref<string[]>([])
const operators = ref<OperatorSummary[]>([])
const favoriteOperatorIds = ref<string[]>([])
const selectedOperatorIds = ref<string[]>([])
const userPlan = ref<UserPlan>({
  selectedOperatorIds: [],
  operators: [],
})
const itemsById = ref<Record<string, ItemEntry>>({})
const buildingFormulas = ref<BuildingFormulaBundle>(createEmptyBuildingFormulaBundle())
const summaryDetails = ref<OperatorDetail[]>([])
const summaryExpandRecipes = ref(false)
const numberFormatter = new Intl.NumberFormat('ko-KR')
const expItemId = '5001'
const tabOptions = computed(() => [
  { label: t('planPage.tabs.operators'), value: 'operators' },
  { label: t('planPage.tabs.summary'), value: 'summary' },
])

const selectedOperators = computed(() =>
  selectedOperatorIds.value
    .map(id => operators.value.find(operator => operator.id === id))
    .filter((operator): operator is OperatorSummary => Boolean(operator)),
)

const favoriteOperators = computed(() =>
  favoriteOperatorIds.value
    .map(id => operators.value.find(operator => operator.id === id))
    .filter((operator): operator is OperatorSummary => Boolean(operator))
    .filter(operator => !selectedOperatorIds.value.includes(operator.id)),
)

const pickerOperators = computed(() => {
  const query = pickerQuery.value.trim().toLowerCase()

  return operators.value.filter((operator) => {
    if (selectedOperatorIds.value.includes(operator.id))
      return false

    if (!query)
      return true

    return [
      operator.name,
      operator.profession,
      ...operator.teams,
      ...operator.nations,
      ...operator.groups,
    ].some(value => value.toLowerCase().includes(query))
  })
})

const summaryEntries = computed(() =>
  summaryDetails.value.map(detail => ({
    detail,
    plan: resolvePlanOperator(detail, getPlanByOperatorId(userPlan.value, detail.id)),
  })),
)

const summaryTotals = computed(() => aggregatePlanCostsWithItems(summaryEntries.value, itemsById.value))
const summaryFarming = computed(() => estimatePlanFarming(summaryTotals.value))
const showSummaryExp = computed(() => summaryFarming.value.exp > 0)
const showSummaryLmd = computed(() => summaryFarming.value.lmd > 0)
const showSummaryResourceOverview = computed(() => showSummaryExp.value || showSummaryLmd.value)

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function openItemDetail(itemId: string) {
  router.push(`/items/${itemId}`)
}

function toggleSummaryExpandRecipes() {
  summaryExpandRecipes.value = !summaryExpandRecipes.value
}

async function loadPlanOperators() {
  isLoading.value = true
  errorMessage.value = ''
  pickerOpen.value = false
  pickerQuery.value = ''
  summaryExpandRecipes.value = false

  try {
    const [favoriteIds, operatorList, plan, items] = await Promise.all([
      getUserFavorites(),
      listOperators({}, region.value),
      getUserPlan(),
      loadPlanReferenceData(region.value),
    ])

    operators.value = operatorList
    userPlan.value = plan
    itemsById.value = items.itemsById
    buildingFormulas.value = items.formulas
    selectedOperatorIds.value = plan.selectedOperatorIds.filter(id => operatorList.some(operator => operator.id === id))
    favoriteOperatorIds.value = favoriteIds.filter(id => operatorList.some(operator => operator.id === id))
  }
  catch (error) {
    operators.value = []
    favoriteOperatorIds.value = []
    selectedOperatorIds.value = []
    itemsById.value = {}
    buildingFormulas.value = createEmptyBuildingFormulaBundle()
    userPlan.value = {
      selectedOperatorIds: [],
      operators: [],
    }
    errorMessage.value = String(error)
  }
  finally {
    isLoading.value = false
  }
}

async function loadSummaryEntries() {
  if (!selectedOperatorIds.value.length) {
    summaryDetails.value = []
    summaryErrorMessage.value = ''
    return
  }

  summaryLoading.value = true
  summaryErrorMessage.value = ''

  try {
    const details = await Promise.all(
      selectedOperatorIds.value.map(id => getOperatorById(id, region.value)),
    )
    summaryDetails.value = details.filter((detail): detail is OperatorDetail => Boolean(detail))
  }
  catch (error) {
    summaryDetails.value = []
    summaryErrorMessage.value = String(error)
  }
  finally {
    summaryLoading.value = false
  }
}

async function addOperator(operatorId: string) {
  if (selectedOperatorIds.value.includes(operatorId))
    return

  selectedOperatorIds.value = await saveUserPlanSelection([...selectedOperatorIds.value, operatorId])
  userPlan.value.selectedOperatorIds = [...selectedOperatorIds.value]
}

async function removeOperator(operatorId: string) {
  await removeUserPlanOperator(operatorId)
  selectedOperatorIds.value = selectedOperatorIds.value.filter(id => id !== operatorId)
  userPlan.value = {
    selectedOperatorIds: [...selectedOperatorIds.value],
    operators: userPlan.value.operators.filter(operator => operator.operatorId !== operatorId),
  }
  summaryDetails.value = summaryDetails.value.filter(operator => operator.id !== operatorId)
}

async function removeSelectedOperators() {
  if (!pendingRemovalIds.value.length)
    return

  for (const operatorId of [...pendingRemovalIds.value])
    await removeOperator(operatorId)

  selectionMode.value = false
  pendingRemovalIds.value = []
}

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value
  pendingRemovalIds.value = []
}

function togglePendingRemoval(operatorId: string) {
  if (!selectionMode.value)
    return

  pendingRemovalIds.value = pendingRemovalIds.value.includes(operatorId)
    ? pendingRemovalIds.value.filter(id => id !== operatorId)
    : [...pendingRemovalIds.value, operatorId]
}

function openOperatorPlan(operatorId: string) {
  if (selectionMode.value) {
    togglePendingRemoval(operatorId)
    return
  }

  router.push(`/plan/${operatorId}`)
}

onMounted(() => {
  void loadPlanOperators()
})

watch(region, () => {
  summaryExpandRecipes.value = false
  void loadPlanOperators()
})

watch([activeTab, selectedOperatorIds, region], ([tab]) => {
  if (tab === 'summary')
    void loadSummaryEntries()
}, { deep: true })

watch(activeTab, (tab) => {
  if (tab !== 'operators') {
    selectionMode.value = false
    pendingRemovalIds.value = []
  }
})
</script>

<script lang="ts">
export default {
  layout: 'operators',
}
</script>

<template>
  <section class="page-grid">
    <TopBar
      :title="t('planPage.topBar.title')"
      :description="t('planPage.topBar.description')"
    >
      <template #left>
        <button type="button" class="top-bar-icon" @click="router.push('/')">
          <el-icon><ArrowLeft /></el-icon>
        </button>
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <button
            v-if="activeTab === 'operators' && selectedOperators.length"
            type="button"
            class="top-bar-icon"
            @click="selectionMode ? removeSelectedOperators() : toggleSelectionMode()"
          >
            <el-icon><component :is="selectionMode ? Check : Delete" /></el-icon>
          </button>
          <button
            v-if="selectionMode"
            type="button"
            class="top-bar-icon"
            @click="toggleSelectionMode"
          >
            <el-icon><Close /></el-icon>
          </button>
          <button v-if="!selectionMode" type="button" class="top-bar-icon" @click="pickerOpen = true">
            <el-icon><Plus /></el-icon>
          </button>
        </div>
      </template>
    </TopBar>

    <section>
      <el-segmented
        v-model="activeTab"
        :options="tabOptions"
        block
      />
    </section>

    <section v-if="errorMessage" class="grid gap-2.5 rounded-panel panel-soft p-4">
      <p class="m-0 text-[rgba(215,223,239,0.75)]">
        {{ t('planPage.states.errorTitle') }}
      </p>
      <p class="m-0 text-[rgba(191,201,220,0.64)]">
        {{ errorMessage }}
      </p>
      <button type="button" class="action-btn justify-self-start" @click="loadPlanOperators">
        {{ t('planPage.actions.retry') }}
      </button>
    </section>

    <section v-else-if="isLoading" class="grid gap-3 rounded-panel panel-soft p-4">
      <div class="h-5 w-[36%] animate-pulse rounded-full bg-[rgba(255,255,255,0.08)]" />
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <article
          v-for="index in 4"
          :key="index"
          class="grid animate-pulse gap-2 rounded-panel panel-soft p-3"
        >
          <div class="relative mx-auto w-fit">
            <div class="h-[84px] w-[84px] rounded-[24px] bg-[rgba(255,255,255,0.06)]" />
          </div>
          <div class="mx-auto h-4 w-[72%] rounded-full bg-[rgba(255,255,255,0.08)]" />
        </article>
      </div>
    </section>

    <template v-else>
      <section v-if="activeTab === 'operators'" class="grid gap-4">
        <section class="grid gap-3 rounded-panel panel-soft p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="grid gap-1">
              <h2 class="m-0 text-[1.02rem] text-white font-700 tracking-[-0.02em]">
                {{ selectedOperators.length ? t('planPage.sections.selected') : t('planPage.sections.favorites') }}
              </h2>
              <p class="m-0 text-[0.84rem] text-[rgba(191,201,220,0.72)]">
                {{ selectionMode ? t('planPage.states.selectionDescription') : selectedOperators.length ? t('planPage.states.selectedDescription') : t('planPage.states.favoritesDescription') }}
              </p>
            </div>
          </div>

          <div v-if="selectedOperators.length" class="grid grid-cols-3 gap-3.5 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <article
              v-for="operator in selectedOperators"
              :key="operator.id"
              class="grid content-start gap-2 rounded-panel panel-soft p-3"
              :class="selectionMode && pendingRemovalIds.includes(operator.id) ? 'border-[rgba(255,120,120,0.4)] bg-[rgba(120,20,28,0.2)]' : selectionMode ? 'border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]' : ''"
            >
              <button
                type="button"
                class="grid content-start gap-2 border-0 bg-transparent p-0 text-left text-white transition-all duration-200 hover:border-[rgba(133,182,255,0.45)] hover:-translate-y-0.5"
                @click="openOperatorPlan(operator.id)"
              >
                <div class="relative mx-auto w-fit">
                  <span
                    v-if="selectionMode"
                    class="absolute right-1 top-1 z-3 inline-flex h-6 w-6 items-center justify-center rounded-full border text-[0.82rem]"
                    :class="pendingRemovalIds.includes(operator.id) ? 'border-[rgba(255,120,120,0.38)] bg-[rgba(255,120,120,0.18)] text-[#ffb3b3]' : 'border-[rgba(255,255,255,0.12)] bg-[rgba(10,15,30,0.82)] text-[rgba(191,201,220,0.72)]'"
                  >
                    <el-icon><Check /></el-icon>
                  </span>
                  <span class="operator-stars-overlay text-gold">{{ '★'.repeat(operator.rarity) }}</span>
                  <OperatorPortrait :char-id="operator.id" :name="operator.name" :hue="operator.thumbnailHue" size="md" />
                </div>
                <strong class="truncate text-center text-[1rem] leading-tight tracking-[-0.03em]">
                  {{ operator.name }}
                </strong>
              </button>
            </article>
          </div>

          <div v-else-if="favoriteOperators.length" class="grid grid-cols-3 gap-3.5 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            <button
              v-for="operator in favoriteOperators"
              :key="operator.id"
              type="button"
              class="grid content-start gap-2 rounded-panel panel-soft p-3 text-left text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(133,182,255,0.45)]"
              @click="addOperator(operator.id)"
            >
              <div class="relative mx-auto w-fit">
                <span class="operator-stars-overlay text-gold">{{ '★'.repeat(operator.rarity) }}</span>
                <OperatorPortrait :char-id="operator.id" :name="operator.name" :hue="operator.thumbnailHue" size="md" />
              </div>
              <strong class="truncate text-center text-[1rem] leading-tight tracking-[-0.03em]">
                {{ operator.name }}
              </strong>
            </button>
          </div>

          <div v-else class="grid gap-2 rounded-[18px] bg-[rgba(255,255,255,0.03)] p-4">
            <p class="m-0 text-[rgba(215,223,239,0.75)]">
              {{ t('planPage.states.emptyTitle') }}
            </p>
            <p class="m-0 text-[rgba(191,201,220,0.64)]">
              {{ t('planPage.states.emptyDescription') }}
            </p>
          </div>
        </section>
      </section>

      <section v-else class="grid gap-4">
        <section v-if="summaryErrorMessage" class="grid gap-2.5 rounded-panel panel-soft p-4">
          <p class="m-0 text-[rgba(215,223,239,0.75)]">
            {{ t('planPage.summary.errorTitle') }}
          </p>
          <p class="m-0 text-[rgba(191,201,220,0.64)]">
            {{ summaryErrorMessage }}
          </p>
        </section>

        <section v-else-if="summaryLoading" class="grid gap-3 rounded-panel panel-soft p-4">
          <div class="h-5 w-[36%] animate-pulse rounded-full bg-[rgba(255,255,255,0.08)]" />
          <div class="grid gap-3 sm:grid-cols-3">
            <div v-for="index in 3" :key="index" class="h-[96px] animate-pulse rounded-panel bg-[rgba(255,255,255,0.05)]" />
          </div>
        </section>

        <template v-else-if="summaryEntries.length">
          <section v-if="showSummaryResourceOverview" class="grid gap-2">
            <article class="stat-card">
              <span class="eyebrow">{{ t('planPage.summary.operators') }}</span>
              <strong class="text-[1.5rem] text-white font-700">{{ formatNumber(summaryTotals.operatorCount) }}</strong>
            </article>

            <div class="grid grid-cols-2 gap-3">
              <article v-if="showSummaryExp" class="grid gap-1.5 rounded-panel panel-soft p-3 text-center">
                <span class="eyebrow">{{ t('planPage.summary.expLabel') }}</span>
                <button
                  type="button"
                  class="mx-auto border-0 bg-transparent p-0"
                  @click="openItemDetail(expItemId)"
                >
                  <ItemIcon
                    :item-id="expItemId"
                    :icon-id="itemsById[expItemId]?.iconId"
                    :name="itemsById[expItemId]?.name ?? t('planPage.summary.expLabel')"
                  />
                </button>
                <strong class="text-[1.2rem] text-white font-700">{{ formatNumber(summaryFarming.exp) }}</strong>
              </article>
              <article v-if="showSummaryLmd" class="grid gap-1.5 rounded-panel panel-soft p-3 text-center">
                <span class="eyebrow">{{ t('planPage.summary.lmdLabel') }}</span>
                <button
                  type="button"
                  class="mx-auto border-0 bg-transparent p-0"
                  @click="openItemDetail(summaryFarming.lmdItem?.id ?? '4001')"
                >
                  <ItemIcon
                    :item-id="summaryFarming.lmdItem?.id ?? '4001'"
                    :icon-id="summaryFarming.lmdItem?.iconId"
                    :name="summaryFarming.lmdItem?.name ?? t('planPage.summary.lmdLabel')"
                  />
                </button>
                <strong class="text-[1.2rem] text-white font-700">{{ formatNumber(summaryFarming.lmd) }}</strong>
              </article>
            </div>
          </section>

          <section v-else class="grid gap-3">
            <article class="stat-card">
              <span class="eyebrow">{{ t('planPage.summary.operators') }}</span>
              <strong class="text-[1.5rem] text-white font-700">{{ formatNumber(summaryTotals.operatorCount) }}</strong>
            </article>
          </section>

          <section v-if="showSummaryResourceOverview" class="grid gap-3 rounded-panel panel-soft p-4">
            <div class="grid gap-1">
              <h2 class="m-0 text-[1rem] text-white font-700">
                {{ t('planPage.summary.farmingTitle') }}
              </h2>
              <p class="m-0 text-[0.82rem] text-[rgba(191,201,220,0.68)]">
                {{ t('planPage.summary.farmingDescription') }}
              </p>
            </div>
            <div class="grid gap-2">
              <div v-if="showSummaryExp" class="flex items-center justify-between gap-3 rounded-panel bg-[rgba(255,255,255,0.03)] p-3">
                <span class="text-[0.9rem] text-[rgba(191,201,220,0.78)]">{{ t('planPage.summary.expLabel') }} {{ summaryFarming.expStage.code }}</span>
                <span class="chip">{{ t('planPage.summary.runs', { count: summaryFarming.expStage.runs }) }}</span>
              </div>
              <div v-if="showSummaryLmd" class="flex items-center justify-between gap-3 rounded-panel bg-[rgba(255,255,255,0.03)] p-3">
                <span class="text-[0.9rem] text-[rgba(191,201,220,0.78)]">{{ t('planPage.summary.lmdLabel') }} {{ summaryFarming.lmdStage.code }}</span>
                <span class="chip">{{ t('planPage.summary.runs', { count: summaryFarming.lmdStage.runs }) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3 rounded-panel bg-[rgba(255,255,255,0.03)] p-3">
                <span class="text-[0.9rem] text-[rgba(191,201,220,0.78)]">{{ t('planPage.summary.expLabel') }} + {{ t('planPage.summary.lmdLabel') }}</span>
                <span class="chip">{{ t('planPage.summary.totalSanity', { count: formatNumber(summaryFarming.totalSanity) }) }}</span>
              </div>
            </div>
          </section>

          <section v-if="summaryTotals.errors.length" class="grid gap-2 rounded-panel panel-soft p-4">
            <h2 class="m-0 text-[1rem] text-white font-700">
              {{ t('planPage.summary.validationTitle') }}
            </h2>
            <p
              v-for="message in summaryTotals.errors"
              :key="message"
              class="m-0 text-[0.84rem] text-[rgba(255,198,198,0.84)]"
            >
              {{ message }}
            </p>
          </section>

          <section class="grid gap-3">
            <div class="grid gap-1">
              <h2 class="m-0 text-[1rem] text-white font-700">
                {{ t('planPage.summary.materialsTitle') }}
              </h2>
              <p class="m-0 text-[0.82rem] text-[rgba(191,201,220,0.68)]">
                {{ t('planPage.summary.materialsDescription') }}
              </p>
            </div>

            <PlanMaterialsGrid
              :materials="summaryTotals.materials"
              :empty-label="t('planPage.detail.noMaterials')"
              :items-by-id="itemsById"
              :formulas="buildingFormulas"
              :expanded="summaryExpandRecipes"
              @toggle-expand="toggleSummaryExpandRecipes"
            />
          </section>

          <section class="grid gap-3">
            <article
              v-for="entry in summaryEntries"
              :key="entry.detail.id"
              class="grid gap-3 rounded-panel panel-soft p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <OperatorPortrait :char-id="entry.detail.id" :name="entry.detail.name" :hue="entry.detail.thumbnailHue" size="sm" />
                  <div class="grid gap-0.5">
                    <strong class="text-[0.98rem] text-white">{{ entry.detail.name }}</strong>
                    <span class="text-[0.78rem] text-[rgba(191,201,220,0.68)]">
                      {{ t('planPage.summary.routeLabel', {
                        current: `E${entry.plan.current.elite} Lv.${entry.plan.current.level}`,
                        target: `E${entry.plan.target.elite} Lv.${entry.plan.target.level}`,
                      }) }}
                    </span>
                  </div>
                </div>
                <button type="button" class="action-btn" @click="openOperatorPlan(entry.detail.id)">
                  {{ t('planPage.summary.openDetail') }}
                </button>
              </div>
            </article>
          </section>
        </template>

        <section v-else class="grid gap-2 rounded-[18px] bg-[rgba(255,255,255,0.03)] p-4">
          <p class="m-0 text-[rgba(215,223,239,0.75)]">
            {{ t('planPage.summary.emptyTitle') }}
          </p>
          <p class="m-0 text-[rgba(191,201,220,0.64)]">
            {{ t('planPage.summary.emptyDescription') }}
          </p>
        </section>
      </section>
    </template>

    <el-drawer
      v-model="pickerOpen"
      direction="btt"
      size="min(72vh, 36rem)"
      :with-header="false"
    >
      <div class="grid gap-4 p-4">
        <div class="grid gap-1">
          <p class="eyebrow m-0">
            Plan Operators
          </p>
          <h2 class="m-0 text-[1.2rem] text-white font-700">
            {{ t('planPage.picker.title') }}
          </h2>
        </div>

        <el-input
          v-model="pickerQuery"
          :placeholder="t('planPage.picker.searchPlaceholder')"
          :prefix-icon="Search"
          clearable
        />

        <div v-if="pickerOperators.length" class="grid gap-2">
          <button
            v-for="operator in pickerOperators"
            :key="operator.id"
            type="button"
            class="flex items-center gap-3 rounded-panel panel-soft p-3 text-left text-white transition-all duration-200 hover:border-[rgba(133,182,255,0.45)]"
            @click="addOperator(operator.id)"
          >
            <OperatorPortrait
              :char-id="operator.id"
              :name="operator.name"
              :hue="operator.thumbnailHue"
              size="sm"
            />
            <div class="grid min-w-0 flex-1 gap-0.5">
              <strong class="truncate text-[0.96rem] leading-tight tracking-[-0.02em]">
                {{ operator.name }}
              </strong>
              <span class="truncate text-[0.76rem] text-[rgba(191,201,220,0.64)]">
                {{ translateProfession(operator.profession) }}
              </span>
            </div>
            <span class="chip">
              {{ t('planPage.picker.add') }}
            </span>
          </button>
        </div>

        <div v-else class="grid gap-2 rounded-[18px] bg-[rgba(255,255,255,0.03)] p-4">
          <p class="m-0 text-[rgba(215,223,239,0.75)]">
            {{ t('planPage.picker.emptyTitle') }}
          </p>
          <p class="m-0 text-[rgba(191,201,220,0.64)]">
            {{ t('planPage.picker.emptyDescription') }}
          </p>
        </div>
      </div>
    </el-drawer>
  </section>
</template>
