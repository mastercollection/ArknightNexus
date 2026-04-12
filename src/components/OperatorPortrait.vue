<script setup lang="ts">
import { warn } from '@tauri-apps/plugin-log'
import { computed, ref, watch } from 'vue'
import { resolveImageSource } from '~/services/operators'

const props = defineProps<{
  charId?: string
  name: string
  hue: number
  size?: 'sm' | 'md' | 'lg'
}>()

const imageLoaded = ref(false)
const imageFailed = ref(false)
const portraitSrc = ref<string>()
const isResolving = ref(false)
const operatorSilhouetteIcon = new URL('../assets/icons/operator-silhouette.svg', import.meta.url).href

const initials = computed(() => {
  return props.name
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
})

const showFallback = computed(() => !isResolving.value && (imageFailed.value || !portraitSrc.value))
const showSkeleton = computed(() =>
  (isResolving.value || Boolean(portraitSrc.value))
  && !imageLoaded.value
  && !showFallback.value,
)

watch(
  () => props.charId,
  async (charId, _, onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })

    imageLoaded.value = false
    imageFailed.value = false
    portraitSrc.value = undefined
    isResolving.value = true

    const normalizedCharId = charId?.trim()
    if (!normalizedCharId) {
      isResolving.value = false
      return
    }

    try {
      const resolved = await resolveImageSource({
        kind: 'portrait',
        id: normalizedCharId,
      })

      if (cancelled)
        return

      portraitSrc.value = resolved.src
      imageFailed.value = !resolved.src
    }
    catch (error) {
      if (!cancelled) {
        imageFailed.value = true
        void warn(`[image-cache] portrait resolve failed {"charId":"${normalizedCharId}","name":"${props.name}","message":"${String(error).replace(/"/g, '\\"')}"}`)
      }
    }
    finally {
      if (!cancelled)
        isResolving.value = false
    }
  },
  { immediate: true },
)

function handleLoad() {
  imageLoaded.value = true
}

function handleError() {
  imageFailed.value = true
  void warn(`[image-cache] portrait image element failed {"charId":"${props.charId ?? ''}","src":"${portraitSrc.value ?? ''}"}`)
}
</script>

<template>
  <div
    class="portrait"
    :class="[size ?? 'md', { 'portrait-image-mode': !showFallback }]"
  >
    <el-skeleton
      v-if="showSkeleton"
      animated
      class="portrait-skeleton"
      :rows="0"
    >
      <template #template>
        <div class="portrait-skeleton-shell">
          <img
            :src="operatorSilhouetteIcon"
            :alt="name"
            class="portrait-skeleton-icon"
          >
        </div>
      </template>
    </el-skeleton>

    <img
      v-if="portraitSrc && !showFallback"
      :src="portraitSrc"
      :alt="name"
      class="portrait-image"
      loading="lazy"
      decoding="async"
      @load="handleLoad"
      @error="handleError"
    >

    <span v-if="showFallback">{{ initials }}</span>
  </div>
</template>

<style scoped>
.portrait {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 24px;
  background: rgba(10, 15, 30, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: white;
  font-family: 'Segoe UI', 'Noto Sans KR', sans-serif;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.portrait::after {
  display: none;
}

.portrait-image-mode::after {
  display: none;
}

.portrait span,
.portrait-image,
.portrait-skeleton {
  position: relative;
  z-index: 1;
}

.portrait-image,
.portrait-skeleton {
  width: 100%;
  height: 100%;
}

.portrait-image {
  object-fit: cover;
}

.portrait-skeleton {
  position: absolute;
  inset: 0;
}

.portrait-skeleton :deep(.el-skeleton__image),
.portrait-skeleton-item {
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.portrait-skeleton-shell {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  border-radius: inherit;
  background: radial-gradient(circle at top, rgba(94, 182, 255, 0.14), transparent 64%), rgba(255, 255, 255, 0.02);
}

.portrait-skeleton-icon {
  width: 58%;
  height: 58%;
  object-fit: contain;
  opacity: 0.94;
}

.portrait.sm {
  width: 64px;
  aspect-ratio: 1;
  border-radius: 18px;
  font-size: 1rem;
}

.portrait.md {
  width: 84px;
  aspect-ratio: 1;
  font-size: 1.25rem;
}

.portrait.lg {
  width: 116px;
  aspect-ratio: 1;
  border-radius: 28px;
  font-size: 1.65rem;
}
</style>
