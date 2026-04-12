<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  description?: string
}>()
</script>

<template>
  <header class="sticky top-0 z-40 px-4 pt-3 -mx-4">
    <div class="top-bar-shell">
      <div class="grid gap-3">
        <div class="flex items-center gap-3">
          <div v-if="$slots.left" class="flex shrink-0 items-center gap-2">
            <slot name="left" />
          </div>

          <div v-if="title || description" class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 v-if="title" class="m-0 text-[1.05rem] text-text font-700 leading-none">
                {{ title }}
              </h1>
              <span v-if="subtitle" class="chip bg-[rgba(104,144,255,0.14)] text-[0.76rem] text-[#d8e5ff]">
                {{ subtitle }}
              </span>
            </div>
            <p v-if="description" class="muted-copy mt-1 text-[0.84rem]">
              {{ description }}
            </p>
          </div>

          <div v-if="$slots.right" class="ml-auto flex items-center gap-2">
            <slot name="right" />
          </div>
        </div>

        <div v-if="$slots.support" class="grid gap-2">
          <slot name="support" />
        </div>
      </div>
    </div>
  </header>
</template>
