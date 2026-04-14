<script setup lang="ts">
import type { DiagnosticsSummary } from '~/services/diagnostics'
import type { RegionSyncStatus } from '~/types/operator'
import { ArrowLeft, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useRegionPreference } from '~/composables'
import {
  exportLatestDiagnosticsLog,
  getDiagnosticsSummary,
  openDiagnosticsLogDir,
} from '~/services/diagnostics'
import {
  exportUserDataFile,
  getRegionSyncStatus,
  importUserDataFile,
  syncRegionData,
} from '~/services/operators'

const router = useRouter()
const { t } = useI18n()
const { region, regionOptions, setRegion } = useRegionPreference()
const syncStatus = ref<RegionSyncStatus | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const userDataBusy = ref(false)
const diagnosticsBusy = ref(false)
const diagnosticsSummary = ref<DiagnosticsSummary | null>(null)
const globeIcon = new URL('../assets/icons/globe.svg', import.meta.url).href
const appIcon = new URL('../assets/icons/app/nexus-beacon.svg', import.meta.url).href
const isAndroidPlatform = computed(() => diagnosticsSummary.value?.platform === 'android')

async function loadSettings() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [statuses, summary] = await Promise.all([
      getRegionSyncStatus(),
      getDiagnosticsSummary(),
    ])

    syncStatus.value = statuses.find(status => status.region === region.value) ?? null
    diagnosticsSummary.value = summary
  }
  catch (error) {
    errorMessage.value = String(error)
  }
  finally {
    isLoading.value = false
  }
}

async function handleSettingsSync() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await syncRegionData(region.value)
    await loadSettings()
    ElMessage.success(t('home.messages.syncCompleted'))
  }
  catch (error) {
    errorMessage.value = String(error)
    ElMessage.error(String(error))
    isLoading.value = false
  }
}

function handleRegionChange(nextRegion: string | number | boolean) {
  setRegion(nextRegion as typeof region.value)
}

async function handleExportUserData() {
  userDataBusy.value = true

  try {
    const exported = await exportUserDataFile()
    if (exported)
      ElMessage.success(t('home.messages.userDataExported'))
  }
  catch (error) {
    ElMessage.error(String(error))
  }
  finally {
    userDataBusy.value = false
  }
}

async function handleImportUserData() {
  try {
    await ElMessageBox.confirm(
      t('home.messages.userDataImportConfirm'),
      t('home.settings.userDataImport'),
      {
        confirmButtonText: t('common.confirm'),
        cancelButtonText: t('common.cancel'),
        type: 'warning',
      },
    )
  }
  catch {
    return
  }

  userDataBusy.value = true

  try {
    const imported = await importUserDataFile()
    if (imported)
      ElMessage.success(t('home.messages.userDataImported'))
  }
  catch (error) {
    ElMessage.error(String(error))
  }
  finally {
    userDataBusy.value = false
  }
}

async function handleOpenDiagnosticsLogDir() {
  diagnosticsBusy.value = true

  try {
    if (isAndroidPlatform.value) {
      const exported = await exportLatestDiagnosticsLog()
      ElMessage.success(t('home.messages.logsExported', { file: exported.relativePath }))
    }
    else {
      diagnosticsSummary.value = await openDiagnosticsLogDir()
      ElMessage.success(t('home.messages.logsOpened'))
    }
  }
  catch (error) {
    await ElMessageBox.alert(
      [
        isAndroidPlatform.value ? t('home.messages.logsExportFailed') : t('home.messages.logsOpenFailed'),
        diagnosticsSummary.value?.logDir ?? '',
      ].filter(Boolean).join('\n\n'),
      t('home.settings.diagnosticsTitle'),
      {
        confirmButtonText: t('common.confirm'),
        type: 'info',
      },
    )
  }
  finally {
    diagnosticsBusy.value = false
  }
}

onMounted(() => {
  void loadSettings()
})

watch(region, () => {
  void loadSettings()
})
</script>

<script lang="ts">
export default {
  layout: 'home',
}
</script>

<template>
  <section class="page-grid">
    <TopBar :title="t('home.settings.title')" :description="t('home.settings.pageDescription')">
      <template #left>
        <button
          type="button"
          class="top-bar-icon"
          :aria-label="t('common.back')"
          @click="router.push('/')"
        >
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <img :src="appIcon" alt="" class="h-7 w-7 shrink-0 rounded-[8px]">
      </template>

      <template #right>
        <button type="button" class="top-bar-icon" :disabled="isLoading" @click="handleSettingsSync">
          <el-icon><RefreshRight /></el-icon>
        </button>
      </template>
    </TopBar>

    <div class="grid gap-4">
      <div class="grid gap-2 panel px-4 py-4.5">
        <strong>{{ t('home.settings.regionTitle') }}</strong>
        <p class="muted-copy">
          {{ t('home.settings.regionDescription') }}
        </p>
        <div
          class="flex items-center gap-2 border border-soft rounded-pill bg-[rgba(255,255,255,0.03)] px-2.5 py-2"
        >
          <span
            class="h-8 w-8 inline-flex flex-none items-center justify-center rounded-full bg-[rgba(109,169,255,0.12)] text-[rgba(214,229,255,0.86)]"
          >
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

      <div class="grid gap-2 panel px-4 py-4.5">
        <strong>{{ t('home.settings.syncStatusTitle') }}</strong>
        <p class="muted-copy">
          {{ syncStatus?.isReady ? t('home.settings.syncReady') : t('home.settings.syncNeeded') }}
        </p>
        <button type="button" class="action-btn" :disabled="isLoading" @click="handleSettingsSync">
          {{ t('home.settings.syncAction') }}
        </button>
      </div>

      <div class="grid gap-2 panel px-4 py-4.5">
        <strong>{{ t('home.settings.userDataTitle') }}</strong>
        <p class="muted-copy">
          {{ t('home.settings.userDataDescription') }}
        </p>
        <div class="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            class="action-btn"
            :disabled="userDataBusy"
            @click="handleExportUserData"
          >
            {{ t('home.settings.userDataExport') }}
          </button>
          <button
            type="button"
            class="action-btn"
            :disabled="userDataBusy"
            @click="handleImportUserData"
          >
            {{ t('home.settings.userDataImport') }}
          </button>
        </div>
      </div>

      <div class="grid gap-3 panel px-4 py-4.5">
        <div class="grid gap-1">
          <strong>{{ t('home.settings.diagnosticsTitle') }}</strong>
          <p class="muted-copy">
            {{
              isAndroidPlatform
                ? t('home.settings.diagnosticsDescriptionAndroid')
                : t('home.settings.diagnosticsDescriptionDesktop')
            }}
          </p>
        </div>

        <div class="grid gap-1.5 text-[0.82rem] text-[rgba(214,229,255,0.74)]">
          <p class="m-0">
            {{ t('home.settings.diagnosticsVersionLabel') }}:
            <strong class="text-white">{{ diagnosticsSummary?.appVersion ?? '...' }}</strong>
          </p>
          <p class="m-0">
            {{ t('home.settings.diagnosticsPlatformLabel') }}:
            <strong class="text-white">{{ diagnosticsSummary?.platform ?? '...' }}</strong>
          </p>
          <p class="m-0 break-all">
            {{ t('home.settings.diagnosticsPathLabel') }}:
            <strong class="text-white">{{ diagnosticsSummary?.logDir ?? '...' }}</strong>
          </p>
        </div>

        <button
          type="button"
          class="action-btn"
          :disabled="diagnosticsBusy || !diagnosticsSummary?.logDir"
          @click="handleOpenDiagnosticsLogDir"
        >
          {{
            isAndroidPlatform
              ? t('home.settings.diagnosticsExportLogs')
              : t('home.settings.diagnosticsOpenLogs')
          }}
        </button>
      </div>

      <p v-if="errorMessage" class="m-0 border border-[rgba(255,120,120,0.2)] rounded-card bg-[rgba(255,120,120,0.08)] px-4 py-3 text-[0.88rem] text-[rgba(255,214,214,0.92)]">
        {{ errorMessage }}
      </p>
    </div>
  </section>
</template>
