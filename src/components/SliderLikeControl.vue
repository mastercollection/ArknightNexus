<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number
  min: number
  max: number
  step?: number
  showValue?: boolean
  valuePrefix?: string
  valueSuffix?: string
  disabled?: boolean
}>(), {
  step: 1,
  showValue: true,
  valuePrefix: '',
  valueSuffix: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const isCoarsePointer = ref(false)
let mediaQuery: MediaQueryList | null = null
let mediaListener: ((event: MediaQueryListEvent) => void) | null = null

const displayValue = computed(() => `${props.valuePrefix}${props.modelValue}${props.valueSuffix}`)

function updatePointerMode(matches: boolean) {
  isCoarsePointer.value = matches
}

function handleNativeInput(event: Event) {
  const nextValue = Number((event.target as HTMLInputElement).value)
  emit('update:modelValue', nextValue)
}

onMounted(() => {
  if (typeof window === 'undefined' || !window.matchMedia)
    return

  mediaQuery = window.matchMedia('(pointer: coarse)')
  updatePointerMode(mediaQuery.matches)

  mediaListener = (event: MediaQueryListEvent) => {
    updatePointerMode(event.matches)
  }

  mediaQuery.addEventListener('change', mediaListener)
})

onBeforeUnmount(() => {
  if (mediaQuery && mediaListener)
    mediaQuery.removeEventListener('change', mediaListener)
})
</script>

<template>
  <div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
    <input
      v-if="isCoarsePointer"
      class="slider-like-native"
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      @input="handleNativeInput"
    >

    <el-slider
      v-else
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :show-tooltip="false"
      @update:model-value="emit('update:modelValue', Number($event))"
    />

    <strong v-if="showValue" class="min-w-8 text-right">
      {{ displayValue }}
    </strong>
  </div>
</template>

<style scoped>
.slider-like-native {
  appearance: none;
  width: 100%;
  height: 0.35rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  outline: none;
}

.slider-like-native::-webkit-slider-thumb {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(133, 182, 255, 0.95);
  border-radius: 999px;
  background: #eef5ff;
  box-shadow: 0 0 0 0.25rem rgba(92, 170, 255, 0.16);
}

.slider-like-native::-moz-range-track {
  height: 0.35rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
}

.slider-like-native::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(133, 182, 255, 0.95);
  border-radius: 999px;
  background: #eef5ff;
  box-shadow: 0 0 0 0.25rem rgba(92, 170, 255, 0.16);
}
</style>
