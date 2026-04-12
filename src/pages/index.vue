<script setup lang="ts">
import type { OperatorSummary, RegionSyncStatus } from '~/types/operator'
import { RefreshRight, Search, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useRegionPreference } from '~/composables'
import { translateProfession } from '~/i18n'
import { getFeaturedOperators, getRegionSyncStatus, syncRegionData } from '~/services/operators'

const router = useRouter()
useI18n()
const { region, regionLabel, regionOptions, setRegion } = useRegionPreference()
const searchQuery = ref('')
const featuredOperators = ref<OperatorSummary[]>([])
const syncStatus = ref<RegionSyncStatus | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const settingsOpen = ref(false)
const globeIcon = new URL('../assets/icons/globe.svg', import.meta.url).href

const menuItems = [
  {
    title: 'Operators',
    caption: '오퍼레이터 도감과 상세 스탯',
    status: '활성',
    enabled: true,
    icon: new URL('../assets/icons/home/operator.webp', import.meta.url).href,
    action: () => router.push('/operators'),
  },
  {
    title: 'Enemies',
    caption: '적 타입과 위협 요소 정리',
    status: '준비중',
    enabled: false,
    icon: new URL('../assets/icons/home/enemy.webp', import.meta.url).href,
  },
  {
    title: 'Operations',
    caption: '맵 구조와 오퍼레이션 흐름',
    status: '준비중',
    enabled: false,
    icon: new URL('../assets/icons/home/operations.webp', import.meta.url).href,
  },
  {
    title: 'Items',
    caption: '재화와 파밍 동선 관리',
    status: '준비중',
    enabled: false,
    icon: new URL('../assets/icons/home/items.webp', import.meta.url).href,
  },
]

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
  loadHome()
})

watch(region, () => {
  loadHome()
})

function handleRegionChange(nextRegion: string | number | boolean) {
  setRegion(nextRegion as typeof region.value)
}

function openSettings() {
  settingsOpen.value = true
}

function handleSettingsSync() {
  settingsOpen.value = false
  forceSync()
}

function notifySettingsPending() {
  ElMessage.info('세부 설정 화면은 준비 중입니다.')
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
          <span class="h-[0.85rem] w-[0.85rem] rounded-full bg-[linear-gradient(135deg,#75d2ff,#4d6bff)] shadow-glow" />
          <strong>Arknights Nexus</strong>
        </button>
      </template>

      <template #right>
        <button type="button" class="top-bar-icon" @click="forceSync">
          <el-icon><RefreshRight /></el-icon>
        </button>
        <el-select
          :model-value="region"
          class="w-24"
          @update:model-value="handleRegionChange"
        >
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

    <header class="flex items-start justify-between gap-4 panel px-4 py-4.5">
      <div>
        <p class="eyebrow">
          Control Deck
        </p>
        <h1 class="section-title">
          탐색 허브
        </h1>
      </div>
      <span class="rounded-pill bg-[rgba(95,155,255,0.12)] px-2.5 py-1.25 text-[0.74rem] text-accent tracking-[0.08em] uppercase">
        {{ regionLabel }}
      </span>
    </header>

    <section class="grid gap-3.5 panel px-4 py-4.5">
      <p class="eyebrow">
        빠른 탐색
      </p>
      <el-input
        v-model="searchQuery"
        placeholder="오퍼레이터 이름, 직군, 진영 검색"
        :prefix-icon="Search"
        clearable
        @keyup.enter="openOperatorSearch"
      />
      <button type="button" class="action-btn" @click="openOperatorSearch">
        오퍼레이터 검색
      </button>
    </section>

    <section class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <div class="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <button
          v-for="item in menuItems"
          :key="item.title"
          type="button"
          class="grid gap-4 card-tile p-4 text-left text-white transition-all duration-200"
          :class="item.enabled
            ? 'cursor-pointer border-[rgba(109,169,255,0.24)] hover:-translate-y-0.5 hover:border-[rgba(133,182,255,0.45)]'
            : 'cursor-default opacity-60'"
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

      <aside class="grid gap-3.5 panel p-4">
        <p class="eyebrow">
          상태
        </p>
        <div class="grid gap-1.5">
          <strong>오퍼레이터 도감 우선 구현</strong>
          <p class="muted-copy">
            첫 화면은 탐색 중심으로 단순화했고, 현재 실제 진입 가능한 섹션은 Operators입니다.
          </p>
        </div>
        <dl class="grid m-0 gap-2.5">
          <div class="flex justify-between gap-4 border-t border-soft pt-2.5">
            <dt class="text-[rgba(191,201,220,0.64)]">
              활성 모듈
            </dt>
            <dd class="m-0 text-[#dfe8ff]">
              1
            </dd>
          </div>
          <div class="flex justify-between gap-4 border-t border-soft pt-2.5">
            <dt class="text-[rgba(191,201,220,0.64)]">
              오퍼레이터 수
            </dt>
            <dd class="m-0 text-[#dfe8ff]">
              {{ syncStatus?.operatorCount ?? featuredOperators.length }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 border-t border-soft pt-2.5">
            <dt class="text-[rgba(191,201,220,0.64)]">
              동기화 상태
            </dt>
            <dd class="m-0 text-[#dfe8ff]">
              {{ syncStatus?.isReady ? 'Ready' : 'Need Sync' }}
            </dd>
          </div>
        </dl>
      </aside>
    </section>

    <section class="grid gap-3.5">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="eyebrow">
            Featured Operators
          </p>
          <h2 class="section-title">
            추천 오퍼레이터
          </h2>
        </div>
        <button type="button" class="action-btn" @click="router.push('/operators')">
          전체 보기
        </button>
      </div>

      <div v-if="errorMessage" class="grid gap-2.5 border border-soft rounded-[18px] bg-[rgba(255,255,255,0.03)] p-4">
        <p class="m-0 text-[rgba(215,223,239,0.75)]">
          {{ errorMessage }}
        </p>
        <button type="button" class="action-btn" @click="forceSync">
          다시 동기화
        </button>
      </div>

      <div v-else-if="isLoading" class="grid gap-2.5 border border-soft rounded-[18px] bg-[rgba(255,255,255,0.03)] p-4">
        <p class="m-0 text-[rgba(215,223,239,0.75)]">
          오퍼레이터 데이터를 불러오는 중입니다.
        </p>
      </div>

      <div v-else class="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <button
          v-for="operator in featuredOperators"
          :key="operator.id"
          type="button"
          class="grid content-start gap-2.25 card-tile p-4 text-left text-white transition-all duration-200 hover:border-[rgba(133,182,255,0.45)] hover:-translate-y-0.5"
          @click="router.push(`/operators/${operator.id}`)"
        >
          <div class="relative mx-auto w-fit">
            <span class="operator-stars-overlay text-accent">{{ '★'.repeat(operator.rarity) }}</span>
            <OperatorPortrait :char-id="operator.id" :name="operator.name" :hue="operator.thumbnailHue" size="md" />
          </div>
          <div class="grid gap-1">
            <strong class="truncate text-[1.1rem] leading-none tracking-[-0.02em]">{{ operator.name }}</strong>
            <p class="muted-copy">
              {{ translateProfession(operator.profession) }}
            </p>
          </div>
        </button>
      </div>
    </section>
  </section>

  <el-drawer
    v-model="settingsOpen"
    direction="rtl"
    size="min(88vw, 24rem)"
    :with-header="false"
  >
    <div class="grid gap-4 p-4">
      <div class="grid gap-1">
        <p class="eyebrow m-0">
          App Controls
        </p>
        <h2 class="m-0 text-[1.2rem] font-700">
          홈 설정
        </h2>
      </div>

      <div class="grid gap-2">
        <div class="flex items-center gap-2 border border-soft rounded-pill bg-[rgba(255,255,255,0.03)] px-2.5 py-2">
          <span class="h-8 w-8 inline-flex flex-none items-center justify-center rounded-full bg-[rgba(109,169,255,0.12)] text-[rgba(214,229,255,0.86)]">
            <img :src="globeIcon" alt="" class="h-[18px] w-[18px] opacity-92">
          </span>
          <el-select
            :model-value="region"
            class="min-w-0 flex-1"
            aria-label="Region / Locale"
            @update:model-value="handleRegionChange"
          >
            <el-option
              v-for="option in regionOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
      </div>

      <div class="grid gap-2 rounded-card bg-[rgba(255,255,255,0.04)] p-4">
        <strong>현재 동기화 상태</strong>
        <p class="muted-copy">
          {{ syncStatus?.isReady ? '준비됨' : '동기화 필요' }}
        </p>
        <button type="button" class="action-btn" @click="handleSettingsSync">
          동기화 실행
        </button>
      </div>

      <button type="button" class="action-btn" @click="notifySettingsPending">
        추가 설정은 준비 중
      </button>
    </div>
  </el-drawer>
</template>
