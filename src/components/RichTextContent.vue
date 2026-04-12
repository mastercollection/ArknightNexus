<script setup lang="ts">
import type { RichTextSegment } from '~/types/operator-view'

defineOptions({
  name: 'RichTextContent',
})

defineProps<{
  segments: RichTextSegment[]
}>()

const emit = defineEmits<{
  termClick: [payload: { key: string, label: string }]
}>()

function handleTermClick(segment: Extract<RichTextSegment, { type: 'term' }>) {
  emit('termClick', {
    key: segment.key,
    label: segment.text,
  })
}
</script>

<template>
  <span class="rich-content">
    <template v-for="(segment, index) in segments" :key="`${segment.type}-${index}`">
      <span v-if="segment.type === 'text'" class="rich-text">{{ segment.text }}</span>
      <span v-else-if="segment.type === 'value'" class="rich-value">
        <span class="rich-text">{{ segment.text }}</span>
        <span
          v-for="badge in segment.badges ?? []"
          :key="`${index}-${badge.text}-${badge.iconSrc ?? 'none'}`"
          class="rich-inline-badge"
        >
          <img
            v-if="badge.iconSrc"
            :src="badge.iconSrc"
            alt=""
            class="rich-inline-badge__icon"
          >
          <span class="rich-inline-badge__text">{{ badge.text }}</span>
        </span>
      </span>
      <span v-else-if="segment.type === 'highlight'" class="rich-highlight">
        <RichTextContent :segments="segment.children" @term-click="emit('termClick', $event)" />
      </span>
      <span v-else class="rich-term">
        <button
          type="button"
          class="term-link"
          @click.stop="handleTermClick(segment)"
        >
          {{ segment.text }}
        </button>
        <span
          v-for="badge in segment.badges ?? []"
          :key="`${index}-${badge.text}-${badge.iconSrc ?? 'none'}`"
          class="rich-inline-badge"
        >
          <img
            v-if="badge.iconSrc"
            :src="badge.iconSrc"
            alt=""
            class="rich-inline-badge__icon"
          >
          <span class="rich-inline-badge__text">{{ badge.text }}</span>
        </span>
      </span>
    </template>
  </span>
</template>

<style scoped>
.rich-content {
  white-space: pre-wrap;
}

.rich-highlight {
  color: #6ecfff;
  font-weight: 600;
}

.rich-value,
.rich-term {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.34rem;
}

.term-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #7ccfff;
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 0.14em;
  cursor: pointer;
}

.term-link:hover {
  color: #a6ddff;
}

.rich-inline-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  padding: 0.08rem 0.48rem;
  color: rgba(238, 242, 251, 0.82);
  font-size: 0.72em;
  line-height: 1.4;
  vertical-align: middle;
}

.rich-inline-badge__icon {
  width: 0.92rem;
  height: 0.92rem;
  object-fit: contain;
  flex: 0 0 auto;
}

.rich-inline-badge__text {
  display: inline-flex;
  align-items: center;
  line-height: 1.2;
}
</style>
