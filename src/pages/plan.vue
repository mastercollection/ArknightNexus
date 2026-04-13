<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const { t } = useI18n()
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
    </TopBar>

    <section class="grid gap-2.5 panel-soft rounded-panel p-4">
      <p class="m-0 text-[rgba(215,223,239,0.75)]">
        {{ t('planPage.states.placeholderTitle') }}
      </p>
      <p class="m-0 text-[rgba(191,201,220,0.64)]">
        {{ t('planPage.states.placeholderDescription') }}
      </p>
    </section>
  </section>
</template>
