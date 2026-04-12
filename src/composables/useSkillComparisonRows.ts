import type { MaybeRefOrGetter } from 'vue'
import type { OperatorBlackboardEntry, OperatorSkill } from '~/types/operator'
import type { SkillComparisonRow } from '~/types/operator-view'
import { computed, toValue } from 'vue'

function formatNumber(value: number) {
  if (Number.isInteger(value))
    return String(value)

  return value.toFixed(3).replace(/\.?0+$/, '')
}

function humanizeMetricKey(value: string) {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function metricValue(entry: OperatorBlackboardEntry) {
  const valueStr = entry.valueStr?.trim()
  if (valueStr)
    return valueStr

  return entry.value == null ? '-' : formatNumber(entry.value)
}

export function useSkillComparisonRows(skill: MaybeRefOrGetter<OperatorSkill | undefined>) {
  return computed<SkillComparisonRow[]>(() => {
    const currentSkill = toValue(skill)
    if (!currentSkill)
      return []

    const rowMap = new Map<string, SkillComparisonRow>()

    currentSkill.levels.forEach((levelInfo) => {
      const metricEntries = [
        ['spCost', 'SP Cost', String(levelInfo.spCost)],
        ['initialSp', 'Initial SP', String(levelInfo.initialSp)],
        ['duration', 'Duration', String(levelInfo.duration)],
      ] as const

      metricEntries.forEach(([key, label, value]) => {
        if (!rowMap.has(key)) {
          rowMap.set(key, {
            key,
            label,
            values: Array.from({ length: currentSkill.levels.length }, () => '-'),
          })
        }

        rowMap.get(key)!.values[levelInfo.level - 1] = value
      })

      levelInfo.blackboard.forEach((entry) => {
        const key = entry.key.trim()
        if (!key)
          return

        if (!rowMap.has(key)) {
          rowMap.set(key, {
            key,
            label: humanizeMetricKey(key),
            values: Array.from({ length: currentSkill.levels.length }, () => '-'),
          })
        }

        rowMap.get(key)!.values[levelInfo.level - 1] = metricValue(entry)
      })
    })

    return Array.from(rowMap.values())
  })
}
