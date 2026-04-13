<script setup lang="ts">
import type { OperatorSummary } from '~/types/operator'
import { ArrowLeft, Filter, Search } from '@element-plus/icons-vue'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useInfiniteSlice, useRegionPreference } from '~/composables'
import { translateProfession } from '~/i18n'
import { listOperators } from '~/services/operators'

const route = useRoute()
const { t } = useI18n()
const filters = reactive({
  query: typeof route.query.q === 'string' ? route.query.q : '',
  affiliation: null as string | null,
  rarity: null as number | null,
  profession: null as string | null,
})

const router = useRouter()
const { region } = useRegionPreference()
const allOperators = ref<OperatorSummary[]>([])
const operatorList = ref<OperatorSummary[]>([])
const isLoading = ref(true)
const errorMessage = ref('')
const filterDrawerOpen = ref(false)
const lastLoadedRegion = ref(region.value)
const isCondensedTopBar = ref(false)
const lastScrollY = ref(0)
const scrollReady = ref(false)
const topBarLockUntil = ref(0)
const upwardTravel = ref(0)
const downwardTravel = ref(0)
const loadingCardCount = 12

const options = computed(() => {
  return {
    affiliations: Array.from(new Set(
      allOperators.value.flatMap(operator => [
        ...operator.teams,
        ...operator.nations,
        ...operator.groups,
      ]),
    )).sort(),
    rarities: Array.from(new Set(allOperators.value.map(operator => operator.rarity))).sort((a, b) => b - a),
    professions: Array.from(new Set(allOperators.value.map(operator => operator.profession))).sort(),
  }
})

const activeFilterChips = computed(() => {
  const chips: string[] = []
  if (filters.query.trim())
    chips.push(`검색: ${filters.query.trim()}`)
  if (filters.affiliation)
    chips.push(`소속: ${filters.affiliation}`)
  if (filters.rarity)
    chips.push(`${filters.rarity} ★`)
  if (filters.profession)
    chips.push(translateProfession(filters.profession))
  return chips
})

function applyLocalFilters() {
  const query = filters.query.trim().toLowerCase()
  operatorList.value = allOperators.value.filter((operator) => {
    const matchesQuery = query.length === 0
      || [
        operator.name,
        operator.profession,
        ...operator.teams,
        ...operator.nations,
        ...operator.groups,
      ].some(value => value.toLowerCase().includes(query))

    const matchesAffiliation = !filters.affiliation
      || [
        ...operator.teams,
        ...operator.nations,
        ...operator.groups,
      ].includes(filters.affiliation)

    const matchesRarity = !filters.rarity || operator.rarity === filters.rarity
    const matchesProfession = !filters.profession || operator.profession === filters.profession

    return matchesQuery && matchesAffiliation && matchesRarity && matchesProfession
  })
}
const {
  sentinel: operatorLoadSentinel,
  visibleCount: visibleOperatorCount,
  visibleItems: visibleOperators,
} = useInfiniteSlice(operatorList, {
  initialCount: 36,
  batchSize: 24,
})

async function loadOperators() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (lastLoadedRegion.value !== region.value) {
      allOperators.value = []
      operatorList.value = []
      lastLoadedRegion.value = region.value
    }

    if (allOperators.value.length === 0)
      allOperators.value = await listOperators({}, region.value)

    applyLocalFilters()
  }
  catch (error) {
    errorMessage.value = String(error)
    operatorList.value = []
  }
  finally {
    isLoading.value = false
  }
}

watch(() => [filters.query, filters.affiliation, filters.rarity, filters.profession], () => {
  applyLocalFilters()
})

watch(() => route.query.q, (query) => {
  filters.query = typeof query === 'string' ? query : ''
})

watch(region, () => {
  loadOperators()
})

loadOperators()

function clearFilters() {
  filters.affiliation = null
  filters.rarity = null
  filters.profession = null
}

function handleScroll() {
  if (!scrollReady.value)
    return

  const now = performance.now()
  const currentScrollY = window.scrollY
  const delta = currentScrollY - lastScrollY.value

  if (delta > 0) {
    downwardTravel.value += delta
    upwardTravel.value = 0
  }
  else if (delta < 0) {
    upwardTravel.value += Math.abs(delta)
    downwardTravel.value = 0
  }

  if (currentScrollY < 48) {
    isCondensedTopBar.value = false
    upwardTravel.value = 0
    downwardTravel.value = 0
  }
  else if (now < topBarLockUntil.value) {
    lastScrollY.value = currentScrollY
    return
  }
  else if (!isCondensedTopBar.value && currentScrollY > 140 && downwardTravel.value > 52) {
    isCondensedTopBar.value = true
    topBarLockUntil.value = now + 220
    upwardTravel.value = 0
    downwardTravel.value = 0
  }
  else if (isCondensedTopBar.value && (currentScrollY < 56 || upwardTravel.value > 56)) {
    isCondensedTopBar.value = false
    topBarLockUntil.value = now + 220
    upwardTravel.value = 0
    downwardTravel.value = 0
  }

  lastScrollY.value = currentScrollY
}

onMounted(() => {
  lastScrollY.value = window.scrollY
  requestAnimationFrame(() => {
    lastScrollY.value = window.scrollY
    upwardTravel.value = 0
    downwardTravel.value = 0
    scrollReady.value = true
  })
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  scrollReady.value = false
  topBarLockUntil.value = 0
  upwardTravel.value = 0
  downwardTravel.value = 0
})
</script>

<script lang="ts">
export default {
  layout: 'operators',
}
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="Component" v-if="Component" />

    <section v-else class="page-grid">
      <TopBar
        :title="t('operatorsList.topBar.title')"
        :description="isCondensedTopBar ? undefined : t('operatorsList.topBar.description')"
      >
        <template #left>
          <button type="button" class="top-bar-icon" @click="router.push('/')">
            <el-icon><ArrowLeft /></el-icon>
          </button>
        </template>

        <template #right>
          <button type="button" class="top-bar-icon" @click="filterDrawerOpen = true">
            <el-icon><Filter /></el-icon>
          </button>
        </template>

        <template #support>
          <div
            class="grid transition-all duration-200"
            :class="isCondensedTopBar ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-24 opacity-100'"
          >
            <el-input
              v-model="filters.query"
              :placeholder="t('operatorsList.search.placeholder')"
              :prefix-icon="Search"
              clearable
            />
          </div>
          <div v-if="isCondensedTopBar || activeFilterChips.length" class="flex flex-wrap gap-2">
            <span v-for="chip in activeFilterChips" :key="chip" class="chip">{{ chip }}</span>
            <span v-if="isCondensedTopBar && !activeFilterChips.length" class="chip">
              {{ t('operatorsList.states.noFilters') }}
            </span>
          </div>
        </template>
      </TopBar>

      <section v-if="errorMessage" class="grid min-h-48 place-content-center gap-2 panel-soft rounded-panel p-4 text-center">
        <h2 class="m-0">
          {{ t('operatorsList.states.errorTitle') }}
        </h2>
        <p class="muted-copy">
          {{ errorMessage }}
        </p>
      </section>

      <section v-else-if="isLoading" class="grid gap-4">
        <div class="grid gap-1">
          <h2 class="m-0 text-[1.05rem] text-white font-700">
            {{ t('operatorsList.states.loadingTitle') }}
          </h2>
          <p class="muted-copy">
            {{ t('operatorsList.states.loadingDescription') }}
          </p>
        </div>

        <div class="grid grid-cols-3 gap-3.5 lg:grid-cols-5 sm:grid-cols-4 xl:grid-cols-6">
          <article
            v-for="index in loadingCardCount"
            :key="index"
            class="grid content-start gap-2 panel-soft rounded-panel p-3"
          >
            <div class="relative mx-auto w-fit">
              <div class="grid h-[84px] w-[84px] place-items-center overflow-hidden border border-line rounded-[24px] bg-[rgba(10,15,30,0.92)]">
                <div class="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_top,rgba(94,182,255,0.12),transparent_64%),rgba(255,255,255,0.02)]">
                  <div class="h-12 w-12 animate-pulse rounded-[20px] bg-[rgba(255,255,255,0.06)]" />
                </div>
              </div>
            </div>

            <div class="mx-auto h-4 w-[72%] animate-pulse rounded-pill bg-[rgba(255,255,255,0.08)]" />
          </article>
        </div>
      </section>

      <section v-else-if="operatorList.length" class="grid gap-3.5">
        <div class="grid grid-cols-3 gap-3.5 lg:grid-cols-5 sm:grid-cols-4 xl:grid-cols-6">
          <button
            v-for="operator in visibleOperators"
            :key="operator.id"
            type="button"
            class="grid content-start gap-2 panel-soft rounded-panel p-3 text-left text-white transition-all duration-200 hover:border-[rgba(133,182,255,0.45)] hover:-translate-y-0.5"
            @click="router.push(`/operators/${operator.id}`)"
          >
            <div class="relative mx-auto w-fit">
              <span class="operator-stars-overlay text-gold">{{ '★'.repeat(operator.rarity) }}</span>
              <OperatorPortrait :char-id="operator.id" :name="operator.name" :hue="operator.thumbnailHue" size="md" />
            </div>

            <strong class="truncate text-center text-[1rem] leading-tight tracking-[-0.03em]">{{ operator.name }}</strong>
          </button>
        </div>

        <div
          v-if="visibleOperatorCount < operatorList.length"
          ref="operatorLoadSentinel"
          class="h-8"
          aria-hidden="true"
        />
      </section>

      <section v-else class="grid min-h-48 place-content-center gap-2 panel-soft rounded-panel p-4 text-center">
        <h2 class="m-0">
          {{ t('operatorsList.states.emptyTitle') }}
        </h2>
        <p class="muted-copy">
          {{ t('operatorsList.states.emptyDescription') }}
        </p>
      </section>

      <el-drawer
        v-model="filterDrawerOpen"
        direction="btt"
        size="min(60vh, 26rem)"
        :with-header="false"
      >
        <div class="grid gap-4 p-4">
          <div class="grid gap-1">
            <p class="eyebrow m-0">
              Filter Controls
            </p>
            <h2 class="m-0 text-[1.2rem] font-700">
              {{ t('operatorsList.filters.title') }}
            </h2>
          </div>

          <label class="grid gap-2">
            <span class="text-[0.9rem] text-[rgba(230,236,250,0.76)]">{{ t('operatorsList.filters.affiliation') }}</span>
            <el-select v-model="filters.affiliation" :placeholder="t('operatorsList.filters.affiliation')" clearable filterable>
              <el-option
                v-for="affiliation in options.affiliations"
                :key="affiliation"
                :label="affiliation"
                :value="affiliation"
              />
            </el-select>
          </label>

          <label class="grid gap-2">
            <span class="text-[0.9rem] text-[rgba(230,236,250,0.76)]">{{ t('operatorsList.filters.rarity') }}</span>
            <el-select v-model="filters.rarity" :placeholder="t('operatorsList.filters.rarity')" clearable>
              <el-option v-for="rarity in options.rarities" :key="rarity" :label="`${rarity} ★`" :value="rarity" />
            </el-select>
          </label>

          <label class="grid gap-2">
            <span class="text-[0.9rem] text-[rgba(230,236,250,0.76)]">{{ t('operatorsList.filters.profession') }}</span>
            <el-select v-model="filters.profession" :placeholder="t('operatorsList.filters.profession')" clearable>
              <el-option
                v-for="profession in options.professions"
                :key="profession"
                :label="translateProfession(profession)"
                :value="profession"
              />
            </el-select>
          </label>

          <button type="button" class="action-btn" @click="clearFilters">
            {{ t('operatorsList.filters.reset') }}
          </button>
        </div>
      </el-drawer>
    </section>
  </router-view>
</template>
