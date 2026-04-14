<script setup lang="ts">
import type { ItemEntry } from '~/types/operator'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView, useRouter } from 'vue-router'
import { useInfiniteSlice, useRegionPreference } from '~/composables'
import { importUserItemCounts, listItems, saveUserItemCount } from '~/services/operators'

const router = useRouter()
const { t } = useI18n()
const { region } = useRegionPreference()
const isDev = import.meta.env.DEV

const items = ref<ItemEntry[]>([])
const searchQuery = ref('')
const isLoading = ref(true)
const errorMessage = ref('')
const editingItemId = ref<string>()
const isImportDialogOpen = ref(false)
const importPayload = ref('')
const isImportingItemCounts = ref(false)
const ownedCountDraft = ref('0')
const savingItemIds = ref(new Set<string>())
const ownedCountFormatter = new Intl.NumberFormat()
let adjustHoldTimeoutId: number | undefined
let adjustHoldIntervalId: number | undefined
let adjustHoldStartedAt = 0

const editingItem = computed(() =>
  items.value.find(item => item.itemId === editingItemId.value),
)

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

function formatOwnedCount(count: number, itemId?: string) {
  const normalized = Math.max(0, Math.trunc(count))
  if (itemId !== '4001')
    return ownedCountFormatter.format(normalized)

  if (normalized < 1_000_000)
    return `${(normalized / 1_000).toFixed(1)}K`

  return `${(normalized / 1_000_000).toFixed(1)}M`
}

function isSavingItemCount(itemId: string) {
  return savingItemIds.value.has(itemId)
}

function setItemSaving(itemId: string, saving: boolean) {
  const next = new Set(savingItemIds.value)
  if (saving)
    next.add(itemId)
  else
    next.delete(itemId)

  savingItemIds.value = next
}

async function updateOwnedCount(item: ItemEntry, nextValue: number | string | undefined) {
  const parsedValue = Number(nextValue ?? 0)
  const normalized = Number.isFinite(parsedValue)
    ? Math.max(0, Math.trunc(parsedValue))
    : 0
  const previous = item.ownedCount

  if (normalized === previous || isSavingItemCount(item.itemId))
    return

  item.ownedCount = normalized
  setItemSaving(item.itemId, true)

  try {
    item.ownedCount = await saveUserItemCount(item.itemId, normalized)
  }
  catch (error) {
    item.ownedCount = previous
    ElMessage.error(String(error))
  }
  finally {
    setItemSaving(item.itemId, false)
  }
}

function openOwnedCountEditor(item: ItemEntry) {
  editingItemId.value = item.itemId
  ownedCountDraft.value = String(item.ownedCount)
}

function closeOwnedCountEditor() {
  stopAdjustingCount()

  if (editingItem.value && isSavingItemCount(editingItem.value.itemId))
    return

  editingItemId.value = undefined
}

function updateEditingOwnedCount(nextValue: number | string | undefined) {
  if (!editingItem.value)
    return

  return updateOwnedCount(editingItem.value, nextValue)
}

function normalizeOwnedCountInput(value: string) {
  const digitsOnly = value.replace(/\D/g, '')
  if (!digitsOnly)
    return '0'

  return String(Math.min(9_999_999, Number(digitsOnly)))
}

function setOwnedCountDraftValue(nextValue: number) {
  ownedCountDraft.value = String(Math.min(9_999_999, Math.max(0, Math.trunc(nextValue))))
}

function adjustOwnedCountDraft(direction: -1 | 1, step: number) {
  const currentValue = Number(ownedCountDraft.value || '0')
  const safeCurrentValue = Number.isFinite(currentValue) ? currentValue : 0
  setOwnedCountDraftValue(safeCurrentValue + direction * step)
}

function getHoldStep() {
  const elapsed = Date.now() - adjustHoldStartedAt
  if (elapsed >= 3000)
    return 10
  if (elapsed >= 1500)
    return 5
  return 1
}

function stopAdjustingCount() {
  if (adjustHoldTimeoutId) {
    window.clearTimeout(adjustHoldTimeoutId)
    adjustHoldTimeoutId = undefined
  }

  if (adjustHoldIntervalId) {
    window.clearInterval(adjustHoldIntervalId)
    adjustHoldIntervalId = undefined
  }
}

function beginAdjustingCount(direction: -1 | 1) {
  if (!editingItem.value || isSavingItemCount(editingItem.value.itemId))
    return

  stopAdjustingCount()
  adjustHoldStartedAt = Date.now()
  adjustOwnedCountDraft(direction, 1)

  adjustHoldTimeoutId = window.setTimeout(() => {
    adjustHoldIntervalId = window.setInterval(() => {
      adjustOwnedCountDraft(direction, getHoldStep())
    }, 100)
  }, 450)
}

async function commitOwnedCountDraft() {
  stopAdjustingCount()

  if (!editingItem.value)
    return

  const normalized = normalizeOwnedCountInput(ownedCountDraft.value)
  ownedCountDraft.value = normalized
  await updateEditingOwnedCount(normalized)
}

async function handleOwnedCountDialogClose() {
  await commitOwnedCountDraft()
  closeOwnedCountEditor()
}

function handleOwnedCountDraftInput(value: string) {
  ownedCountDraft.value = normalizeOwnedCountInput(value)
}

function handleOwnedCountDialogModelUpdate(open: boolean) {
  if (!open)
    void handleOwnedCountDialogClose()
}

function openItemCountImportDialog() {
  importPayload.value = ''
  isImportDialogOpen.value = true
}

function closeItemCountImportDialog() {
  if (isImportingItemCounts.value)
    return

  isImportDialogOpen.value = false
}

function handleItemCountImportDialogModelUpdate(open: boolean) {
  if (!open)
    closeItemCountImportDialog()
}

async function submitItemCountImport() {
  if (isImportingItemCounts.value)
    return

  isImportingItemCounts.value = true

  try {
    const importedCount = await importUserItemCounts(importPayload.value)
    await loadItems()
    isImportDialogOpen.value = false
    importPayload.value = ''
    ElMessage.success(t('itemsPage.messages.importSuccess', { count: importedCount }))
  }
  catch (error) {
    ElMessage.error(String(error))
  }
  finally {
    isImportingItemCounts.value = false
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

        <template #right>
          <button type="button" class="action-btn" @click="openItemCountImportDialog">
            {{ t('itemsPage.actions.importJson') }}
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
            class="grid min-h-[168px] cursor-pointer content-between gap-3 panel-soft rounded-panel p-3 transition-all duration-200 hover:border-[rgba(133,182,255,0.45)] hover:-translate-y-0.5"
            @click="router.push(`/items/${item.itemId}`)"
          >
            <ItemIcon :item-id="item.itemId" :icon-id="item.iconId" :name="item.name" class="mx-auto" />
            <div class="grid gap-2">
              <div class="grid gap-2">
                <strong class="line-clamp-2 text-[0.92rem] text-white leading-snug tracking-[-0.02em]">{{ item.name }}</strong>
                <button
                  type="button"
                  class="min-h-[40px] w-full flex items-center justify-center border border-[rgba(133,182,255,0.24)] rounded-[12px] bg-[rgba(77,117,188,0.16)] px-3 py-2 text-[0.9rem] text-[rgba(231,239,255,0.92)] font-700 transition-colors duration-200 hover:border-[rgba(133,182,255,0.42)] hover:bg-[rgba(77,117,188,0.24)]"
                  @click.stop="openOwnedCountEditor(item)"
                >
                  x {{ formatOwnedCount(item.ownedCount, item.itemId) }}
                </button>
                <p v-if="isDev" class="line-clamp-1 text-[0.68rem] text-[rgba(191,201,220,0.46)]">
                  {{ item.itemId }}
                </p>
              </div>
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

      <el-dialog
        :model-value="Boolean(editingItem)"
        :title="editingItem?.name || t('itemsPage.topBar.title')"
        width="min(92vw, 420px)"
        align-center
        destroy-on-close
        :close-on-click-modal="!editingItem || !isSavingItemCount(editingItem.itemId)"
        :close-on-press-escape="!editingItem || !isSavingItemCount(editingItem.itemId)"
        @update:model-value="handleOwnedCountDialogModelUpdate"
      >
        <div v-if="editingItem" class="grid gap-4">
          <div class="grid justify-items-center gap-3 text-center">
            <ItemIcon
              :item-id="editingItem.itemId"
              :icon-id="editingItem.iconId"
              :name="editingItem.name"
              class="h-[72px] w-[72px]"
            />
            <div class="grid gap-1">
              <strong class="text-[1rem] text-white font-700 leading-snug tracking-[-0.02em]">
                {{ editingItem.name }}
              </strong>
              <p class="m-0 text-[0.8rem] text-[rgba(191,201,220,0.68)]">
                {{ t('itemsPage.editor.currentCount') }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="h-[52px] w-[52px] flex shrink-0 items-center justify-center border border-[rgba(133,182,255,0.28)] rounded-[16px] bg-[rgba(77,117,188,0.16)] text-[1.4rem] text-white font-700 transition-colors duration-200 disabled:cursor-not-allowed hover:border-[rgba(133,182,255,0.48)] hover:bg-[rgba(77,117,188,0.24)] disabled:opacity-45"
              :disabled="isSavingItemCount(editingItem.itemId)"
              @mousedown.prevent="beginAdjustingCount(-1)"
              @mouseup="commitOwnedCountDraft"
              @mouseleave="commitOwnedCountDraft"
              @touchstart.prevent="beginAdjustingCount(-1)"
              @touchend.prevent="commitOwnedCountDraft"
              @touchcancel.prevent="commitOwnedCountDraft"
            >
              -
            </button>

            <el-input
              :model-value="ownedCountDraft"
              size="large"
              inputmode="numeric"
              :disabled="isSavingItemCount(editingItem.itemId)"
              class="owned-count-input min-w-0 flex-1"
              @update:model-value="handleOwnedCountDraftInput"
              @blur="commitOwnedCountDraft"
              @keydown.enter="commitOwnedCountDraft"
            />

            <button
              type="button"
              class="h-[52px] w-[52px] flex shrink-0 items-center justify-center border border-[rgba(133,182,255,0.28)] rounded-[16px] bg-[rgba(77,117,188,0.16)] text-[1.4rem] text-white font-700 transition-colors duration-200 disabled:cursor-not-allowed hover:border-[rgba(133,182,255,0.48)] hover:bg-[rgba(77,117,188,0.24)] disabled:opacity-45"
              :disabled="isSavingItemCount(editingItem.itemId)"
              @mousedown.prevent="beginAdjustingCount(1)"
              @mouseup="commitOwnedCountDraft"
              @mouseleave="commitOwnedCountDraft"
              @touchstart.prevent="beginAdjustingCount(1)"
              @touchend.prevent="commitOwnedCountDraft"
              @touchcancel.prevent="commitOwnedCountDraft"
            >
              +
            </button>
          </div>

          <p class="m-0 text-center text-[1.1rem] text-white font-700">
            x {{ formatOwnedCount(Number(ownedCountDraft) || 0, editingItem.itemId) }}
          </p>
        </div>
      </el-dialog>

      <el-dialog
        :model-value="isImportDialogOpen"
        :title="t('itemsPage.importDialog.title')"
        width="min(92vw, 560px)"
        align-center
        destroy-on-close
        :close-on-click-modal="!isImportingItemCounts"
        :close-on-press-escape="!isImportingItemCounts"
        @update:model-value="handleItemCountImportDialogModelUpdate"
      >
        <div class="grid gap-4">
          <p class="m-0 text-[0.88rem] text-[rgba(191,201,220,0.74)]">
            {{ t('itemsPage.importDialog.description') }}
          </p>

          <el-input
            v-model="importPayload"
            type="textarea"
            :rows="10"
            :disabled="isImportingItemCounts"
            :placeholder="t('itemsPage.importDialog.placeholder')"
          />

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="ghost-link"
              :disabled="isImportingItemCounts"
              @click="closeItemCountImportDialog"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="action-btn"
              :disabled="isImportingItemCounts"
              @click="submitItemCountImport"
            >
              {{ t('itemsPage.actions.applyImport') }}
            </button>
          </div>
        </div>
      </el-dialog>
    </section>
  </RouterView>
</template>
