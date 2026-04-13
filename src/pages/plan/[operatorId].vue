<script setup lang="ts">
import type { ItemEntry, UserPlanOperator } from '~/types/operator'
import { ArrowLeft, DocumentChecked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ItemIcon from '~/components/ItemIcon.vue'
import PlanMaterialsGrid from '~/components/PlanMaterialsGrid.vue'
import { useRegionPreference } from '~/composables'
import {
  calculatePlanCostsWithItems,
  estimatePlanFarming,
  getEliteLevelCap,
  getPlanByOperatorId,
  resolvePlanOperator,
} from '~/composables/usePlanCosts'
import {
  getOperatorById,
  getUserPlan,
  listItems,
  resolveImageSource,
  saveUserPlanOperator,
} from '~/services/operators'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { region } = useRegionPreference()

const isLoading = ref(true)
const isSaving = ref(false)
const errorMessage = ref('')
const saveState = ref<'idle' | 'success' | 'error'>('idle')
const operator = ref<Awaited<ReturnType<typeof getOperatorById>>>()
const localPlan = ref<UserPlanOperator>()
const itemsById = ref<Record<string, ItemEntry>>({})
const moduleTypeIconSources = ref<Record<string, string>>({})
const numberFormatter = new Intl.NumberFormat('ko-KR')
const expItemId = '5001'

const skillLevelOptions = Array.from({ length: 10 }, (_, index) => index + 1)
const masteryIconMap: Partial<Record<number, string>> = {
  8: new URL('../../assets/icons/skill/8.png', import.meta.url).href,
  9: new URL('../../assets/icons/skill/9.png', import.meta.url).href,
  10: new URL('../../assets/icons/skill/10.png', import.meta.url).href,
}

const costBreakdown = computed(() => {
  if (!operator.value || !localPlan.value)
    return null

  return calculatePlanCostsWithItems(operator.value, localPlan.value, itemsById.value)
})
const farmingEstimate = computed(() =>
  costBreakdown.value ? estimatePlanFarming(costBreakdown.value) : null,
)
const showExpOverview = computed(() => (farmingEstimate.value?.exp ?? 0) > 0)
const showLmdOverview = computed(() => (farmingEstimate.value?.lmd ?? 0) > 0)
const showResourceOverview = computed(() => showExpOverview.value || showLmdOverview.value)

const currentEliteCap = computed(() =>
  operator.value && localPlan.value
    ? getEliteLevelCap(operator.value, localPlan.value.current.elite)
    : 1,
)

const targetEliteCap = computed(() =>
  operator.value && localPlan.value
    ? getEliteLevelCap(operator.value, localPlan.value.target.elite)
    : 1,
)
const visibleModules = computed(() =>
  operator.value?.modules.filter(module => getModuleMaxStage(module.uniEquipId) > 0) ?? [],
)
const saveButtonClass = computed(() => {
  if (saveState.value === 'success')
    return 'text-[#7ee787] border-[rgba(126,231,135,0.28)] bg-[rgba(126,231,135,0.08)]'

  if (saveState.value === 'error')
    return 'text-[#ffb3b3] border-[rgba(255,120,120,0.28)] bg-[rgba(255,120,120,0.08)]'

  return ''
})

const operatorId = computed(() => String((route.params as { operatorId?: string }).operatorId ?? '').trim())
let saveStateResetTimer: ReturnType<typeof setTimeout> | undefined

async function loadDetailPage() {
  if (!operatorId.value) {
    errorMessage.value = t('planPage.detail.notFoundDescription')
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  saveState.value = 'idle'

  try {
    const [detail, plan, items] = await Promise.all([
      getOperatorById(operatorId.value, region.value),
      getUserPlan(),
      listItems(region.value),
    ])

    if (!detail) {
      operator.value = undefined
      localPlan.value = undefined
      errorMessage.value = t('planPage.detail.notFoundDescription')
      return
    }

    operator.value = detail
    localPlan.value = resolvePlanOperator(detail, getPlanByOperatorId(plan, detail.id))
    itemsById.value = Object.fromEntries(items.map(item => [item.itemId, item]))
    await loadModuleTypeImageSources()
  }
  catch (error) {
    operator.value = undefined
    localPlan.value = undefined
    itemsById.value = {}
    errorMessage.value = String(error)
  }
  finally {
    isLoading.value = false
  }
}

async function savePlan() {
  if (!localPlan.value)
    return

  isSaving.value = true

  try {
    localPlan.value = await saveUserPlanOperator(localPlan.value)
    setSaveState('success')
    ElMessage.success(t('planPage.detail.saved'))
  }
  catch (error) {
    setSaveState('error')
    ElMessage.error(String(error))
  }
  finally {
    isSaving.value = false
  }
}

function setSaveState(nextState: 'idle' | 'success' | 'error') {
  saveState.value = nextState

  if (saveStateResetTimer)
    clearTimeout(saveStateResetTimer)

  if (nextState !== 'idle') {
    saveStateResetTimer = setTimeout(() => {
      saveState.value = 'idle'
    }, 1800)
  }
}

function moduleStageOptions(maxStage: number) {
  return Array.from({ length: maxStage + 1 }, (_, index) => index)
}

function getModuleMaxStage(moduleId: string) {
  const detailModule = operator.value?.modules.find(module => module.uniEquipId === moduleId)
  return Math.max(0, ...detailModule?.battlePhases.map(phase => phase.equipLevel) ?? [0])
}

function getSkillLevelIcon(level: number) {
  return masteryIconMap[level]
}

function getSkillLevelLabel(level: number) {
  return level <= 7 ? `Lv.${level}` : `Rank ${level - 7}`
}

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

async function loadModuleTypeImageSources() {
  if (!operator.value) {
    moduleTypeIconSources.value = {}
    return
  }

  const entries = await Promise.all(visibleModules.value.map(async (module) => {
    const typeIcon = module.typeIcon?.trim()
    if (!typeIcon)
      return [module.uniEquipId, undefined] as const

    const resolved = await resolveImageSource({
      kind: 'moduleType',
      id: typeIcon,
    })

    return [module.uniEquipId, resolved.src] as const
  }))

  moduleTypeIconSources.value = Object.fromEntries(
    entries.filter((entry): entry is [string, string] => Boolean(entry[1])),
  )
}

watch(() => localPlan.value?.current.elite, () => {
  if (!operator.value || !localPlan.value)
    return

  localPlan.value.current.level = Math.min(localPlan.value.current.level, getEliteLevelCap(operator.value, localPlan.value.current.elite))
})

watch(() => localPlan.value?.target.elite, () => {
  if (!operator.value || !localPlan.value)
    return

  localPlan.value.target.level = Math.min(localPlan.value.target.level, getEliteLevelCap(operator.value, localPlan.value.target.elite))
})

onMounted(() => {
  void loadDetailPage()
})

watch([operatorId, region], () => {
  void loadDetailPage()
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
      :title="operator?.name ?? t('planPage.detail.title')"
      :description="t('planPage.detail.description')"
    >
      <template #left>
        <button type="button" class="top-bar-icon" @click="router.push('/plan')">
          <el-icon><ArrowLeft /></el-icon>
        </button>
      </template>

      <template #right>
        <button type="button" class="top-bar-icon" :class="saveButtonClass" :disabled="isSaving" @click="savePlan">
          <el-icon><DocumentChecked /></el-icon>
        </button>
      </template>
    </TopBar>

    <section v-if="errorMessage" class="grid gap-2.5 panel-soft rounded-panel p-4">
      <p class="m-0 text-[rgba(215,223,239,0.75)]">
        {{ t('planPage.detail.errorTitle') }}
      </p>
      <p class="m-0 text-[rgba(191,201,220,0.64)]">
        {{ errorMessage }}
      </p>
      <button type="button" class="action-btn justify-self-start" @click="loadDetailPage">
        {{ t('planPage.actions.retry') }}
      </button>
    </section>

    <section v-else-if="isLoading || !operator || !localPlan" class="grid gap-3 panel-soft rounded-panel p-4">
      <div class="h-5 w-[32%] animate-pulse rounded-full bg-[rgba(255,255,255,0.08)]" />
      <div class="h-[180px] animate-pulse rounded-panel bg-[rgba(255,255,255,0.05)]" />
    </section>

    <template v-else>
      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <section class="grid gap-3">
          <article class="grid gap-3 panel-soft rounded-panel p-4">
            <div class="flex items-center gap-3">
              <OperatorPortrait :char-id="operator.id" :name="operator.name" :hue="operator.thumbnailHue" size="md" />
              <div class="grid gap-0.5">
                <strong class="text-[1.1rem] text-white">{{ operator.name }}</strong>
                <span class="text-[0.82rem] text-[rgba(191,201,220,0.68)]">{{ operator.profession }} / {{ operator.branch }}</span>
              </div>
            </div>

            <section class="grid gap-3 rounded-panel bg-[rgba(255,255,255,0.03)] p-4">
              <div class="grid gap-1">
                <h2 class="m-0 text-[1rem] text-white font-700">
                  {{ t('planPage.detail.stateTitle') }}
                </h2>
                <p class="m-0 text-[0.8rem] text-[rgba(191,201,220,0.68)]">
                  {{ t('planPage.detail.stateDescription') }}
                </p>
              </div>

              <div class="grid gap-2.5">
                <div class="grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2.5 text-[0.76rem] text-[rgba(191,201,220,0.58)]">
                  <span />
                  <span>{{ t('planPage.detail.currentTitle') }}</span>
                  <span>{{ t('planPage.detail.targetTitle') }}</span>
                </div>

                <div class="grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-2.5">
                  <span class="pt-2 text-[0.82rem] text-[rgba(191,201,220,0.72)]">{{ t('planPage.detail.elite') }}</span>
                  <el-select v-model="localPlan.current.elite">
                    <el-option v-for="elite in [0, 1, 2]" :key="elite" :label="`E${elite}`" :value="elite" />
                  </el-select>
                  <el-select v-model="localPlan.target.elite">
                    <el-option v-for="elite in [0, 1, 2]" :key="elite" :label="`E${elite}`" :value="elite" />
                  </el-select>
                </div>

                <div class="grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-2.5">
                  <span class="pt-2 text-[0.82rem] text-[rgba(191,201,220,0.72)]">{{ t('planPage.detail.level') }}</span>
                  <el-input-number v-model="localPlan.current.level" :min="1" :max="currentEliteCap" :controls="false" class="w-full" />
                  <el-input-number v-model="localPlan.target.level" :min="1" :max="targetEliteCap" :controls="false" class="w-full" />
                </div>
              </div>
            </section>
          </article>

          <article class="grid gap-3 panel-soft rounded-panel p-4">
            <div class="grid gap-1">
              <h2 class="m-0 text-[1rem] text-white font-700">
                {{ t('planPage.detail.skillsTitle') }}
              </h2>
              <p class="m-0 text-[0.82rem] text-[rgba(191,201,220,0.68)]">
                {{ t('planPage.detail.skillsDescription') }}
              </p>
            </div>

            <div class="grid gap-2.5">
              <article
                v-for="(skill, index) in operator.skills"
                :key="skill.id"
                class="grid gap-2.5 rounded-panel bg-[rgba(255,255,255,0.03)] p-3.5"
              >
                <div class="grid gap-0.5">
                  <strong class="text-[0.94rem] text-white">{{ skill.name }}</strong>
                </div>

                <div class="grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-2.5">
                  <span class="pt-2 text-[0.82rem] text-[rgba(191,201,220,0.72)]">{{ t('planPage.detail.level') }}</span>
                  <el-select v-model="localPlan.current.skillLevels[index]">
                    <el-option v-for="level in skillLevelOptions" :key="level" :label="getSkillLevelLabel(level)" :value="level">
                      <div class="flex items-center gap-2">
                        <img
                          v-if="getSkillLevelIcon(level)"
                          :src="getSkillLevelIcon(level)"
                          :alt="getSkillLevelLabel(level)"
                          class="h-5 w-5 object-contain"
                        >
                        <span>{{ getSkillLevelLabel(level) }}</span>
                      </div>
                    </el-option>
                  </el-select>
                  <el-select v-model="localPlan.target.skillLevels[index]">
                    <el-option v-for="level in skillLevelOptions" :key="level" :label="getSkillLevelLabel(level)" :value="level">
                      <div class="flex items-center gap-2">
                        <img
                          v-if="getSkillLevelIcon(level)"
                          :src="getSkillLevelIcon(level)"
                          :alt="getSkillLevelLabel(level)"
                          class="h-5 w-5 object-contain"
                        >
                        <span>{{ getSkillLevelLabel(level) }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </div>
              </article>
            </div>
          </article>

          <article v-if="visibleModules.length" class="grid gap-3 panel-soft rounded-panel p-4">
            <div class="grid gap-1">
              <h2 class="m-0 text-[1rem] text-white font-700">
                {{ t('planPage.detail.modulesTitle') }}
              </h2>
              <p class="m-0 text-[0.82rem] text-[rgba(191,201,220,0.68)]">
                {{ t('planPage.detail.modulesDescription') }}
              </p>
            </div>

            <div class="grid gap-2.5">
              <article
                v-for="module in visibleModules"
                :key="module.uniEquipId"
                class="grid gap-2.5 rounded-panel bg-[rgba(255,255,255,0.03)] p-3.5"
              >
                <div class="flex items-start gap-2.5">
                  <img
                    v-if="moduleTypeIconSources[module.uniEquipId]"
                    :src="moduleTypeIconSources[module.uniEquipId]"
                    :alt="module.uniEquipName"
                    class="mt-0.5 h-9 w-9 shrink-0 rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(7,18,36,0.85)] p-1.5 object-contain"
                  >
                  <div class="grid gap-0.5">
                    <strong class="text-[0.94rem] text-white">{{ module.uniEquipName }}</strong>
                  </div>
                </div>

                <div class="grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-2.5">
                  <span class="pt-2 text-[0.82rem] text-[rgba(191,201,220,0.72)]">{{ t('planPage.detail.stage') }}</span>
                  <el-select
                    v-model="localPlan.current.modules.find(entry => entry.moduleId === module.uniEquipId)!.currentStage"
                  >
                    <el-option
                      v-for="stage in moduleStageOptions(getModuleMaxStage(module.uniEquipId))"
                      :key="stage"
                      :label="stage === 0 ? t('planPage.detail.moduleLocked') : `Stage ${stage}`"
                      :value="stage"
                    />
                  </el-select>
                  <el-select
                    v-model="localPlan.target.modules.find(entry => entry.moduleId === module.uniEquipId)!.targetStage"
                  >
                    <el-option
                      v-for="stage in moduleStageOptions(getModuleMaxStage(module.uniEquipId))"
                      :key="stage"
                      :label="stage === 0 ? t('planPage.detail.moduleLocked') : `Stage ${stage}`"
                      :value="stage"
                    />
                  </el-select>
                </div>
              </article>
            </div>
          </article>
        </section>

        <aside class="grid h-fit gap-4">
          <section class="grid gap-3 panel-soft rounded-panel p-4">
            <div class="grid gap-1">
              <h2 class="m-0 text-[1rem] text-white font-700">
                {{ t('planPage.detail.summaryTitle') }}
              </h2>
              <p class="m-0 text-[0.82rem] text-[rgba(191,201,220,0.68)]">
                {{ t('planPage.detail.summaryDescription') }}
              </p>
            </div>

            <div
              v-if="showResourceOverview"
              class="grid grid-cols-2 gap-3"
            >
              <article v-if="showExpOverview" class="grid gap-1.5 rounded-panel bg-[rgba(255,255,255,0.03)] p-3 text-center">
                <span class="text-[0.8rem] text-[rgba(191,201,220,0.72)]">{{ t('planPage.summary.expLabel') }}</span>
                <div class="mx-auto">
                  <ItemIcon
                    :item-id="expItemId"
                    :icon-id="itemsById[expItemId]?.iconId"
                    :name="itemsById[expItemId]?.name ?? t('planPage.summary.expLabel')"
                  />
                </div>
                <strong class="text-[1.2rem] text-white font-700">{{ formatNumber(farmingEstimate?.exp ?? 0) }}</strong>
              </article>

              <article v-if="showLmdOverview" class="grid gap-1.5 rounded-panel bg-[rgba(255,255,255,0.03)] p-3 text-center">
                <span class="text-[0.8rem] text-[rgba(191,201,220,0.72)]">{{ t('planPage.summary.lmdLabel') }}</span>
                <div class="mx-auto">
                  <ItemIcon
                    :item-id="farmingEstimate?.lmdItem?.id ?? '4001'"
                    :icon-id="farmingEstimate?.lmdItem?.iconId"
                    :name="farmingEstimate?.lmdItem?.name ?? t('planPage.summary.lmdLabel')"
                  />
                </div>
                <strong class="text-[1.2rem] text-white font-700">{{ formatNumber(farmingEstimate?.lmd ?? 0) }}</strong>
              </article>
            </div>

            <div v-if="showResourceOverview" class="grid gap-2 rounded-panel bg-[rgba(255,255,255,0.03)] p-3">
              <div class="grid gap-0.5">
                <strong class="text-[0.9rem] text-white">{{ t('planPage.summary.farmingTitle') }}</strong>
                <span class="text-[0.76rem] text-[rgba(191,201,220,0.62)]">{{ t('planPage.summary.farmingDescription') }}</span>
              </div>
              <div v-if="showExpOverview" class="flex items-center justify-between gap-3">
                <span class="text-[0.84rem] text-[rgba(191,201,220,0.78)]">{{ t('planPage.summary.expLabel') }} {{ farmingEstimate?.expStage.code }}</span>
                <span class="chip">{{ t('planPage.summary.runs', { count: farmingEstimate?.expStage.runs ?? 0 }) }}</span>
              </div>
              <div v-if="showLmdOverview" class="flex items-center justify-between gap-3">
                <span class="text-[0.84rem] text-[rgba(191,201,220,0.78)]">{{ t('planPage.summary.lmdLabel') }} {{ farmingEstimate?.lmdStage.code }}</span>
                <span class="chip">{{ t('planPage.summary.runs', { count: farmingEstimate?.lmdStage.runs ?? 0 }) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-[0.84rem] text-[rgba(191,201,220,0.78)]">{{ t('planPage.summary.expLabel') }} + {{ t('planPage.summary.lmdLabel') }}</span>
                <span class="chip">{{ t('planPage.summary.totalSanity', { count: formatNumber(farmingEstimate?.totalSanity ?? 0) }) }}</span>
              </div>
            </div>

            <div v-if="costBreakdown?.errors.length" class="grid gap-2 rounded-panel bg-[rgba(255,102,102,0.08)] p-3">
              <p
                v-for="message in costBreakdown.errors"
                :key="message"
                class="m-0 text-[0.82rem] text-[rgba(255,198,198,0.84)]"
              >
                {{ message }}
              </p>
            </div>

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
              :materials="costBreakdown?.materials ?? []"
              :empty-label="t('planPage.detail.noMaterials')"
              columns-class="grid-cols-2 gap-2"
            />
          </section>
        </aside>
      </section>
    </template>
  </section>
</template>
