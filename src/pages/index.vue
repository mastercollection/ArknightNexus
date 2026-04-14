<script setup lang="ts">
import type { OperatorSummary, RegionSyncStatus } from '~/types/operator'
import { RefreshRight, Search, Setting } from '@element-plus/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useRegionPreference } from '~/composables'
import {
  getFeaturedOperators,
  getRegionSyncStatus,
  syncRegionData,
} from '~/services/operators'

const router = useRouter()
const { t } = useI18n()
const { region, regionOptions, setRegion } = useRegionPreference()
const searchQuery = ref('')
const featuredOperators = ref<OperatorSummary[]>([])
const syncStatus = ref<RegionSyncStatus | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const appIcon = new URL('../assets/icons/app/nexus-beacon.svg', import.meta.url).href

const menuItems = computed(() => [
  {
    title: 'Operators',
    caption: t('home.menu.operators.caption'),
    status: t('home.menu.status.active'),
    enabled: true,
    icon: new URL('../assets/icons/home/operator.webp', import.meta.url).href,
    action: () => router.push('/operators'),
  },
  {
    title: 'Plan',
    caption: t('home.menu.plan.caption'),
    status: t('home.menu.status.active'),
    enabled: true,
    icon: new URL('../assets/icons/home/prts.png', import.meta.url).href,
    action: () => router.push('/plan'),
  },
  {
    title: 'Items',
    caption: t('home.menu.items.caption'),
    status: t('home.menu.status.active'),
    enabled: true,
    icon: new URL('../assets/icons/home/items.webp', import.meta.url).href,
    action: () => router.push('/items'),
  },
  {
    title: 'Enemies',
    caption: t('home.menu.enemies.caption'),
    status: t('home.menu.status.pending'),
    enabled: false,
    icon: new URL('../assets/icons/home/enemy.webp', import.meta.url).href,
  },
])

function openOperatorSearch() {
  const query = searchQuery.value.trim()
  router.push({
    path: '/operators',
    query: query ? { q: query } : undefined,
  })
}

async function loadHome() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [featured, statuses] = await Promise.all([
      getFeaturedOperators(region.value),
      getRegionSyncStatus(),
    ])

    featuredOperators.value = featured
    syncStatus.value = statuses.find(status => status.region === region.value) ?? null
  }
  catch (error) {
    errorMessage.value = String(error)
  }
  finally {
    isLoading.value = false
  }
}

async function forceSync() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await syncRegionData(region.value)
    await loadHome()
  }
  catch (error) {
    errorMessage.value = String(error)
    isLoading.value = false
  }
}

onMounted(() => {
  void loadHome()
})

watch(region, () => {
  void loadHome()
})

function handleRegionChange(nextRegion: string | number | boolean) {
  setRegion(nextRegion as typeof region.value)
}

function openSettings() {
  void router.push('/settings')
}
</script>

<script lang="ts">
export default {
  layout: 'home',
}
</script>

<template>
  <section class="page-grid">
    <TopBar>
      <template #left>
        <button
          type="button"
          class="inline-flex items-center gap-2.5 border-0 bg-transparent p-0 text-white"
          @click="router.push('/')"
        >
          <img :src="appIcon" alt="" class="h-7 w-7 shrink-0 rounded-[8px]">
          <strong>Arknights Nexus</strong>
        </button>
      </template>

      <template #right>
        <button type="button" class="top-bar-icon" @click="forceSync">
          <el-icon><RefreshRight /></el-icon>
        </button>
        <el-select :model-value="region" class="w-24" @update:model-value="handleRegionChange">
          <el-option
            v-for="option in regionOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <button type="button" class="top-bar-icon" @click="openSettings">
          <el-icon><Setting /></el-icon>
        </button>
      </template>
    </TopBar>

    <section class="grid gap-3.5 panel px-4 py-4.5">
      <p class="eyebrow">
        {{ t('home.search.eyebrow') }}
      </p>
      <el-input
        v-model="searchQuery"
        :placeholder="t('home.search.placeholder')"
        :prefix-icon="Search"
        clearable
        @keyup.enter="openOperatorSearch"
      />
      <button type="button" class="action-btn" @click="openOperatorSearch">
        {{ t('home.search.action') }}
      </button>
    </section>

    <section class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <div class="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <button
          v-for="item in menuItems"
          :key="item.title"
          type="button"
          class="grid gap-4 card-tile p-4 text-left text-white transition-all duration-200"
          :class="
            item.enabled
              ? 'cursor-pointer border-[rgba(109,169,255,0.24)] hover:-translate-y-0.5 hover:border-[rgba(133,182,255,0.45)]'
              : 'cursor-default opacity-60'
          "
          @click="item.enabled && item.action?.()"
        >
          <div class="flex items-start justify-between gap-2">
            <el-image :src="item.icon" :alt="item.title" class="h-[38px] w-[38px]" />
            <span class="rounded-pill bg-[rgba(255,255,255,0.06)] px-2.25 py-0.9 text-[0.72rem]">
              {{ item.status }}
            </span>
          </div>
          <div class="grid gap-1.5">
            <strong>{{ item.title }}</strong>
            <p class="muted-copy">
              {{ item.caption }}
            </p>
          </div>
        </button>
      </div>
    </section>
  </section>
</template>
