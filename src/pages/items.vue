<script setup lang="ts">
import type { ItemEntry } from '~/types/operator'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView, useRouter } from 'vue-router'
import { useInfiniteSlice, useRegionPreference } from '~/composables'
import { listItems } from '~/services/operators'

const router = useRouter()
const { t } = useI18n()
const { region } = useRegionPreference()
const isDev = import.meta.env.DEV

const items = ref<ItemEntry[]>([])
const searchQuery = ref('')
const isLoading = ref(true)
const errorMessage = ref('')

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query)
    return items.value

  return items.value.filter(item =>
    [
      item.name,
      item.description,
      item.usage,
      item.obtainApproach,
      item.classifyType,
      item.itemType,
      item.itemId,
    ]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(query)),
  )
})

const {
  sentinel: itemLoadSentinel,
  visibleCount: visibleItemCount,
  visibleItems,
  reset: resetVisibleItems,
} = useInfiniteSlice(filteredItems, {
  initialCount: 48,
  batchSize: 30,
})

onMounted(() => {
  loadItems()
})

watch(region, () => {
  loadItems()
})

watch(filteredItems, () => {
  resetVisibleItems()
})

async function loadItems() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await listItems(region.value, 'MATERIAL')
    items.value = result
    resetVisibleItems()
  }
  catch (error) {
    items.value = []
    errorMessage.value = String(error)
  }
  finally {
    isLoading.value = false
  }
}
</script>

<script lang="ts">
export default {
  layout: 'operators',
}
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" v-if="Component" />

    <section v-else class="page-grid">
      <TopBar
        :title="t('itemsPage.topBar.title')"
        :description="t('itemsPage.topBar.description')"
      >
        <template #left>
          <button type="button" class="top-bar-icon" @click="router.push('/')">
            <el-icon><ArrowLeft /></el-icon>
          </button>
        </template>

        <template #support>
          <el-input
            v-model="searchQuery"
            :placeholder="t('itemsPage.search.placeholder')"
            :prefix-icon="Search"
            clearable
          />
        </template>
      </TopBar>

      <section v-if="errorMessage" class="grid gap-2.5 panel-soft rounded-panel p-4">
        <p class="m-0 text-[rgba(215,223,239,0.75)]">
          {{ t('itemsPage.states.error') }}
        </p>
        <p class="m-0 text-[rgba(191,201,220,0.64)]">
          {{ errorMessage }}
        </p>
      </section>

      <section v-else-if="isLoading" class="grid grid-cols-3 gap-3.5 lg:grid-cols-5 sm:grid-cols-4 xl:grid-cols-6">
        <article
          v-for="index in 18"
          :key="index"
          class="grid animate-pulse gap-2.5 panel-soft rounded-panel p-3"
        >
          <div class="mx-auto h-[72px] w-[72px] rounded-[18px] bg-[rgba(255,255,255,0.06)]" />
          <div class="h-4 rounded-full bg-[rgba(255,255,255,0.08)]" />
          <div class="h-3 w-[70%] rounded-full bg-[rgba(255,255,255,0.05)]" />
        </article>
      </section>

      <section v-else-if="!filteredItems.length" class="grid gap-2.5 panel-soft rounded-panel p-4">
        <p class="m-0 text-[rgba(215,223,239,0.75)]">
          {{ t('itemsPage.states.empty') }}
        </p>
      </section>

      <section v-else class="grid gap-3.5">
        <div class="grid grid-cols-3 gap-3.5 lg:grid-cols-5 sm:grid-cols-4 xl:grid-cols-6">
          <article
            v-for="item in visibleItems"
            :key="item.itemId"
            class="grid cursor-pointer gap-2.5 panel-soft rounded-panel p-3 transition-all duration-200 hover:border-[rgba(133,182,255,0.45)] hover:-translate-y-0.5"
            @click="router.push(`/items/${item.itemId}`)"
          >
            <ItemIcon :item-id="item.itemId" :icon-id="item.iconId" :name="item.name" class="mx-auto" />
            <div class="grid gap-1">
              <strong class="line-clamp-2 text-[0.92rem] text-white leading-snug tracking-[-0.02em]">{{ item.name }}</strong>
              <p class="line-clamp-2 text-[0.74rem] text-[rgba(191,201,220,0.7)]">
                {{ item.usage || item.obtainApproach || item.itemType }}
              </p>
              <p v-if="isDev" class="line-clamp-1 text-[0.68rem] text-[rgba(191,201,220,0.46)]">
                {{ item.itemId }}
              </p>
            </div>
          </article>
        </div>

        <div
          v-if="visibleItemCount < filteredItems.length"
          ref="itemLoadSentinel"
          class="h-8"
          aria-hidden="true"
        />
      </section>
    </section>
  </RouterView>
</template>
