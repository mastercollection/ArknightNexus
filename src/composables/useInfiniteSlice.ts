import type { Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface UseInfiniteSliceOptions {
  initialCount: number
  batchSize: number
  rootMargin?: string
}

export function useInfiniteSlice<T>(
  sourceItems: Ref<T[]>,
  options: UseInfiniteSliceOptions,
) {
  const sentinel = ref<HTMLElement>()
  const visibleCount = ref(options.initialCount)
  let observer: IntersectionObserver | null = null

  const visibleItems = computed(() => sourceItems.value.slice(0, visibleCount.value))

  function reset() {
    visibleCount.value = Math.min(options.initialCount, sourceItems.value.length)
  }

  function loadMore() {
    if (visibleCount.value >= sourceItems.value.length)
      return

    visibleCount.value = Math.min(
      visibleCount.value + options.batchSize,
      sourceItems.value.length,
    )
  }

  watch(sourceItems, () => {
    reset()
  })

  watch(sentinel, (element, previousElement) => {
    if (previousElement)
      observer?.unobserve(previousElement)
    if (element)
      observer?.observe(element)
  })

  onMounted(() => {
    observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting))
        loadMore()
    }, { rootMargin: options.rootMargin ?? '240px 0px' })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return {
    sentinel,
    visibleCount,
    visibleItems,
    reset,
    loadMore,
  }
}
