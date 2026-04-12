import type { RegionCode } from '~/types/operator'
import { computed, ref } from 'vue'
import { setI18nLocale } from '~/i18n'

const region = ref<RegionCode>('kr')

const regionLabels: Record<RegionCode, string> = {
  kr: 'KR',
  cn: 'CN',
  jp: 'JP',
  tw: 'TW',
  en: 'EN',
}

const regionOptions = Object.entries(regionLabels).map(([value, label]) => ({
  value: value as RegionCode,
  label,
}))

export function useRegionPreference() {
  const regionLabel = computed(() => regionLabels[region.value])

  function setRegion(nextRegion: RegionCode) {
    region.value = nextRegion
    setI18nLocale(nextRegion)
  }

  return {
    region,
    regionLabel,
    regionOptions,
    setRegion,
  }
}
