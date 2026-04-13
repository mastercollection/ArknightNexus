<script setup lang="ts">
import { ref, watch } from 'vue'
import { resolveImageSource } from '~/services/operators'

const props = defineProps<{
  itemId: string
  iconId?: string | null
  name: string
}>()

const rootElement = ref<HTMLElement>()
const imageLoaded = ref(false)
const imageFailed = ref(false)
const imageSrc = ref<string>()
const isResolving = ref(false)
const hasIntersected = ref(false)
const operatorSilhouetteIcon = new URL('../assets/icons/operator-silhouette.svg', import.meta.url).href

let observer: IntersectionObserver | null = null

watch(
  [() => props.itemId, () => props.iconId, hasIntersected],
  async ([itemId, iconId, intersected], _, onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })

    imageLoaded.value = false
    imageFailed.value = false
    imageSrc.value = undefined

    const resolvedImageId = (iconId?.trim() || itemId.trim())
    if (!intersected || !resolvedImageId) {
      isResolving.value = false
      return
    }

    isResolving.value = true

    try {
      const resolved = await resolveImageSource({
        kind: 'itemIcon',
        id: resolvedImageId,
      })

      if (cancelled)
        return

      imageSrc.value = resolved.src
      imageFailed.value = !resolved.src
    }
    catch {
      if (!cancelled)
        imageFailed.value = true
    }
    finally {
      if (!cancelled)
        isResolving.value = false
    }
  },
  { immediate: true },
)

watch(rootElement, (element, previousElement) => {
  if (previousElement)
    observer?.unobserve(previousElement)
  if (element)
    observer?.observe(element)
}, { immediate: true })

function handleLoad() {
  imageLoaded.value = true
}

function handleError() {
  imageFailed.value = true
}

if (typeof window !== 'undefined') {
  observer = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) {
      hasIntersected.value = true
      if (rootElement.value)
        observer?.unobserve(rootElement.value)
      observer?.disconnect()
      observer = null
    }
  }, { rootMargin: '180px 0px' })
}
</script>

<template>
  <div
    ref="rootElement"
    class="grid h-[72px] w-[72px] place-items-center overflow-hidden border border-soft rounded-[18px] bg-[rgba(7,18,36,0.9)]"
  >
    <el-skeleton
      v-if="(hasIntersected || isResolving || imageSrc) && !imageLoaded && !imageFailed"
      animated
      :rows="0"
      class="h-full w-full"
    >
      <template #template>
        <div class="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_top,rgba(94,182,255,0.14),transparent_64%),rgba(255,255,255,0.02)]">
          <img
            :src="operatorSilhouetteIcon"
            :alt="name"
            class="h-[40px] w-[40px] object-contain opacity-92"
          >
        </div>
      </template>
    </el-skeleton>

    <img
      v-if="imageSrc && !imageFailed"
      :src="imageSrc"
      :alt="name"
      class="h-[58px] w-[58px] object-contain"
      loading="lazy"
      decoding="async"
      @load="handleLoad"
      @error="handleError"
    >

    <span
      v-if="imageFailed || (!hasIntersected && !imageSrc)"
      class="text-center text-[0.72rem] text-[rgba(223,232,255,0.88)] font-700 leading-tight"
    >
      {{ name.slice(0, 2) }}
    </span>
  </div>
</template>
