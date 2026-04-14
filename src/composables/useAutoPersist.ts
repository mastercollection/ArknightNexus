import type { ComputedRef, Ref } from 'vue'
import { onBeforeUnmount, ref, watch } from 'vue'

type MaybeRef<T> = Ref<T> | ComputedRef<T>

interface UseAutoPersistOptions<T, R = void> {
  source: MaybeRef<T>
  delay?: number
  enabled?: () => boolean
  persist: (value: T) => Promise<R>
  applyPersisted?: (result: R) => void
  onError?: (error: unknown) => void
}

export function useAutoPersist<T, R = void>(options: UseAutoPersistOptions<T, R>) {
  const isPersisting = ref(false)
  const delay = options.delay ?? 400
  let persistTimer: ReturnType<typeof setTimeout> | undefined
  let suppressWatch = false
  let lastPersistedSnapshot = ''
  let pendingPersistAfterCurrent = false

  function snapshotOf(value: T) {
    return JSON.stringify(value)
  }

  function clearPersistTimer() {
    if (!persistTimer)
      return

    clearTimeout(persistTimer)
    persistTimer = undefined
  }

  function markPersisted(value: T) {
    lastPersistedSnapshot = snapshotOf(value)
    pendingPersistAfterCurrent = false
    clearPersistTimer()
  }

  function runWithoutTracking(callback: () => void) {
    suppressWatch = true
    callback()
    queueMicrotask(() => {
      suppressWatch = false
    })
  }

  async function persistNow() {
    const currentValue = options.source.value
    const currentSnapshot = snapshotOf(currentValue)
    if (!currentSnapshot || currentSnapshot === lastPersistedSnapshot)
      return

    if (isPersisting.value) {
      pendingPersistAfterCurrent = true
      return
    }

    isPersisting.value = true

    try {
      const result = await options.persist(currentValue)
      lastPersistedSnapshot = snapshotOf(options.source.value)

      if (options.applyPersisted) {
        runWithoutTracking(() => {
          options.applyPersisted?.(result)
        })
        lastPersistedSnapshot = snapshotOf(options.source.value)
      }
    }
    catch (error) {
      options.onError?.(error)
    }
    finally {
      isPersisting.value = false

      if (pendingPersistAfterCurrent) {
        pendingPersistAfterCurrent = false
        if (snapshotOf(options.source.value) !== lastPersistedSnapshot)
          schedulePersist()
      }
    }
  }

  function schedulePersist() {
    clearPersistTimer()
    persistTimer = setTimeout(() => {
      persistTimer = undefined
      void persistNow()
    }, delay)
  }

  watch(options.source, (nextValue) => {
    if (suppressWatch)
      return

    if (options.enabled && !options.enabled())
      return

    if (snapshotOf(nextValue) === lastPersistedSnapshot)
      return

    schedulePersist()
  })

  onBeforeUnmount(() => {
    clearPersistTimer()
  })

  return {
    isPersisting,
    clearPersistTimer,
    markPersisted,
    persistNow,
    runWithoutTracking,
    schedulePersist,
  }
}
