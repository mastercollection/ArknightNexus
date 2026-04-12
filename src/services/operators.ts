import type {
  OperatorDetail,
  OperatorFilters,
  OperatorStatPoint,
  OperatorSummary,
  RegionCode,
  RegionSyncStatus,
  RegionTerms,
  SyncResult,
} from '~/types/operator'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { appCacheDir, join } from '@tauri-apps/api/path'
import { BaseDirectory, exists, mkdir, remove, rename } from '@tauri-apps/plugin-fs'
import { error, warn } from '@tauri-apps/plugin-log'
import { download } from '@tauri-apps/plugin-upload'
import { operators as fallbackOperators } from '~/data/operators'
import { setI18nLocale } from '~/i18n'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function interpolate(start: number, end: number, progress: number) {
  return Math.round(start + (end - start) * progress)
}

export const DEFAULT_REGION: RegionCode = 'kr'

function toSummary(operator: OperatorDetail): OperatorSummary {
  return {
    id: operator.id,
    name: operator.name,
    rarity: operator.rarity,
    profession: operator.profession,
    branch: operator.branch,
    teams: operator.teams,
    nations: operator.nations,
    groups: operator.groups,
    thumbnailHue: operator.thumbnailHue,
  }
}

const regionReadyCache = new Set<RegionCode>()
const regionTermsCache = new Map<RegionCode, RegionTerms>()
const resolvedImageSourceCache = new Map<string, ResolvedImageSource>()
const IMAGE_REMOTE_BASE_URL = 'https://raw.githubusercontent.com/fexli/ArknightsResource/refs/heads/main'

export type CachedImageKind = 'portrait' | 'moduleEquip' | 'moduleType' | 'skillIcon'

export interface ImageSourceRequest {
  kind: CachedImageKind
  id: string
  forceRefresh?: boolean
}

export interface ResolvedImageSource {
  src?: string
  status: 'ready' | 'missing'
}

interface ImageDescriptor {
  parentRelativePath: string
  relativePath: string
  partRelativePath: string
  candidateUrls: string[]
}

function canUseTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function logImageCache(level: 'warn' | 'error', message: string, details?: Record<string, unknown>) {
  if (!canUseTauri())
    return

  const suffix = details ? ` ${JSON.stringify(details)}` : ''
  const payload = `[image-cache] ${message}${suffix}`

  if (level === 'warn') {
    await warn(payload)
    return
  }

  await error(payload)
}

function getImageCacheKey(request: ImageSourceRequest) {
  return `${request.kind}:${request.id.trim()}`
}

function getImageFileName(id: string) {
  return `${id}.png`
}

function normalizeImageId(value: string) {
  const normalized = value.trim()
  if (!normalized || normalized.includes('/') || normalized.includes('\\') || normalized.includes('..'))
    return undefined

  if (!/^[\w.-]+$/.test(normalized))
    return undefined

  return normalized
}

function buildImageDescriptor(kind: CachedImageKind, id: string): ImageDescriptor | undefined {
  const normalizedId = normalizeImageId(id)
  if (!normalizedId)
    return undefined

  if (kind === 'portrait') {
    return {
      parentRelativePath: 'images/portraits',
      relativePath: `images/portraits/${getImageFileName(normalizedId)}`,
      partRelativePath: `images/portraits/${getImageFileName(normalizedId)}.part`,
      candidateUrls: [`${IMAGE_REMOTE_BASE_URL}/avatar/ASSISTANT/${normalizedId}.png`],
    }
  }

  if (kind === 'moduleEquip') {
    const resolvedId = normalizedId.toLowerCase() === 'original' ? 'default' : normalizedId
    return {
      parentRelativePath: 'images/modules/equip',
      relativePath: `images/modules/equip/${getImageFileName(resolvedId)}`,
      partRelativePath: `images/modules/equip/${getImageFileName(resolvedId)}.part`,
      candidateUrls: [`${IMAGE_REMOTE_BASE_URL}/equip/${resolvedId}.png`],
    }
  }

  if (kind === 'skillIcon') {
    return {
      parentRelativePath: 'images/skills',
      relativePath: `images/skills/${getImageFileName(normalizedId)}`,
      partRelativePath: `images/skills/${getImageFileName(normalizedId)}.part`,
      candidateUrls: [`${IMAGE_REMOTE_BASE_URL}/skills/skill_icon_${normalizedId}.png`],
    }
  }

  const uppercaseId = normalizedId.toUpperCase()
  return {
    parentRelativePath: 'images/modules/type',
    relativePath: `images/modules/type/${getImageFileName(normalizedId)}`,
    partRelativePath: `images/modules/type/${getImageFileName(normalizedId)}.part`,
    candidateUrls: uppercaseId === normalizedId
      ? [`${IMAGE_REMOTE_BASE_URL}/equipt/${normalizedId}.png`]
      : [
          `${IMAGE_REMOTE_BASE_URL}/equipt/${normalizedId}.png`,
          `${IMAGE_REMOTE_BASE_URL}/equipt/${uppercaseId}.png`,
        ],
  }
}

async function getImageAbsolutePath(relativePath: string) {
  const cacheRoot = await appCacheDir()
  const segments = relativePath.split('/').filter(Boolean)
  return join(cacheRoot, ...segments)
}

async function ensureImageParentDir(parentRelativePath: string) {
  await mkdir(parentRelativePath, {
    baseDir: BaseDirectory.AppCache,
    recursive: true,
  })
}

async function removeImageIfExists(relativePath: string) {
  if (await exists(relativePath, { baseDir: BaseDirectory.AppCache })) {
    await remove(relativePath, { baseDir: BaseDirectory.AppCache, recursive: true })
  }
}

function listFallbackOperators(filters: OperatorFilters = {}): OperatorSummary[] {
  const normalizedQuery = filters.query?.trim().toLowerCase() ?? ''

  return fallbackOperators
    .filter((operator) => {
      const matchesQuery = normalizedQuery.length === 0
        || [
          operator.name,
          operator.codename,
          operator.profession,
          operator.branch,
          ...operator.teams,
          ...operator.nations,
          ...operator.groups,
        ].some(value => value.toLowerCase().includes(normalizedQuery))

      const matchesRarity = !filters.rarity || operator.rarity === filters.rarity
      const matchesProfession = !filters.profession || operator.profession === filters.profession

      return matchesQuery && matchesRarity && matchesProfession
    })
    .map(toSummary)
}

function getFallbackOperatorById(id: string): OperatorDetail | undefined {
  return fallbackOperators.find(operator => operator.id === id)
}

async function ensureRegionReady(region: RegionCode) {
  setI18nLocale(region)
  if (!canUseTauri() || regionReadyCache.has(region))
    return

  try {
    await invoke('list_operators', {
      request: {
        region,
      },
    })
    await invoke<Record<string, string>>('get_region_terms', {
      request: {
        region,
      },
    })
    regionReadyCache.add(region)
    return
  }
  catch (error) {
    if (!String(error).includes('동기화된 데이터')) {
      throw error
    }
  }

  await syncRegionData(region)
  regionReadyCache.add(region)
}

export async function syncRegionData(region: RegionCode = DEFAULT_REGION): Promise<SyncResult> {
  setI18nLocale(region)
  if (!canUseTauri()) {
    return {
      region,
      sourceRevision: 'fallback',
      updatedAt: new Date().toISOString(),
      operatorCount: fallbackOperators.length,
      status: 'fallback',
    }
  }

  const result = await invoke<SyncResult>('sync_region_data', {
    request: {
      region,
    },
  })
  regionReadyCache.add(region)
  return result
}

export async function getRegionSyncStatus(): Promise<RegionSyncStatus[]> {
  if (!canUseTauri()) {
    return [{
      region: DEFAULT_REGION,
      sourceRevision: 'fallback',
      fetchedAt: new Date().toISOString(),
      operatorCount: fallbackOperators.length,
      isReady: true,
    }]
  }

  return invoke<RegionSyncStatus[]>('get_region_sync_status')
}

export async function getRegionTerms(region: RegionCode = DEFAULT_REGION): Promise<RegionTerms> {
  setI18nLocale(region)
  if (!canUseTauri())
    return {}

  if (regionTermsCache.has(region))
    return regionTermsCache.get(region) ?? {}

  let terms: RegionTerms
  try {
    await ensureRegionReady(region)
    terms = await invoke<RegionTerms>('get_region_terms', {
      request: {
        region,
      },
    })
  }
  catch (error) {
    if (!String(error).includes('동기화된 데이터'))
      throw error

    await syncRegionData(region)
    terms = await invoke<RegionTerms>('get_region_terms', {
      request: {
        region,
      },
    })
  }

  regionTermsCache.set(region, terms)
  return terms
}

export async function getUserFavorites(): Promise<string[]> {
  if (!canUseTauri())
    return []

  return invoke<string[]>('get_user_favorites')
}

export async function toggleOperatorFavorite(operatorId: string): Promise<boolean> {
  if (!canUseTauri())
    return false

  return invoke<boolean>('toggle_operator_favorite', {
    request: {
      operatorId,
    },
  })
}

export async function resolveImageSource(request: ImageSourceRequest): Promise<ResolvedImageSource> {
  try {
    if (!canUseTauri())
      return { status: 'missing' }

    const descriptor = buildImageDescriptor(request.kind, request.id)
    if (!descriptor) {
      await logImageCache('warn', 'invalid image descriptor', {
        kind: request.kind,
        id: request.id,
      })
      return { status: 'missing' }
    }

    const cacheKey = getImageCacheKey(request)
    if (!request.forceRefresh && resolvedImageSourceCache.has(cacheKey))
      return resolvedImageSourceCache.get(cacheKey) ?? { status: 'missing' }

    const absolutePath = await getImageAbsolutePath(descriptor.relativePath)
    const cachedResult = {
      src: convertFileSrc(absolutePath),
      status: 'ready' as const,
    }

    if (!request.forceRefresh && await exists(descriptor.relativePath, { baseDir: BaseDirectory.AppCache })) {
      resolvedImageSourceCache.set(cacheKey, cachedResult)
      return cachedResult
    }

    await ensureImageParentDir(descriptor.parentRelativePath)
    await removeImageIfExists(descriptor.partRelativePath)

    for (const url of descriptor.candidateUrls) {
      try {
        const partAbsolutePath = await getImageAbsolutePath(descriptor.partRelativePath)
        await download(url, partAbsolutePath)
        await rename(descriptor.partRelativePath, descriptor.relativePath, {
          oldPathBaseDir: BaseDirectory.AppCache,
          newPathBaseDir: BaseDirectory.AppCache,
        })
        resolvedImageSourceCache.set(cacheKey, cachedResult)
        return cachedResult
      }
      catch (downloadError) {
        await logImageCache('error', 'download or rename failed', {
          kind: request.kind,
          id: request.id,
          url,
          relativePath: descriptor.relativePath,
          partRelativePath: descriptor.partRelativePath,
          message: String(downloadError),
        })
        await removeImageIfExists(descriptor.partRelativePath)
      }
    }

    await logImageCache('warn', 'all image candidates failed', {
      kind: request.kind,
      id: request.id,
      relativePath: descriptor.relativePath,
      absolutePath,
    })
    return { status: 'missing' }
  }
  catch (error) {
    await logImageCache('error', 'resolve threw', {
      kind: request.kind,
      id: request.id,
      message: String(error),
    })
    throw error
  }
}

export async function prefetchImages(requests: Array<Omit<ImageSourceRequest, 'forceRefresh'>>) {
  if (!canUseTauri() || !requests.length)
    return

  await Promise.all(requests.map(request => resolveImageSource(request)))
}

export async function clearImageCache() {
  if (!canUseTauri())
    return

  await removeImageIfExists('images')
  resolvedImageSourceCache.clear()
}

export async function listOperators(
  filters: OperatorFilters = {},
  region: RegionCode = DEFAULT_REGION,
): Promise<OperatorSummary[]> {
  setI18nLocale(region)
  if (!canUseTauri())
    return listFallbackOperators(filters)

  await ensureRegionReady(region)

  return invoke<OperatorSummary[]>('list_operators', {
    request: {
      region,
      query: filters.query?.trim() || null,
      rarity: filters.rarity ?? null,
      profession: filters.profession ?? null,
    },
  })
}

export async function getOperatorById(
  id: string,
  region: RegionCode = DEFAULT_REGION,
): Promise<OperatorDetail | undefined> {
  setI18nLocale(region)
  if (!canUseTauri())
    return getFallbackOperatorById(id)

  await ensureRegionReady(region)

  return invoke<OperatorDetail | null>('get_operator_detail', {
    request: {
      region,
      operatorId: id,
    },
  }).then(result => result ?? undefined)
}

export function getOperatorStats(detail: OperatorDetail, elite: number, level: number): OperatorStatPoint {
  const safeElite = clamp(elite, 0, detail.stats.length - 1)
  const progression = detail.stats[safeElite] ?? detail.stats[0]
  const maxLevel = detail.eliteCaps[safeElite] ?? detail.eliteCaps[0] ?? 1
  if (!progression)
    throw new Error(`Operator "${detail.id}" is missing stat progression data.`)

  const safeLevel = clamp(level, 1, maxLevel)
  const progress = maxLevel === 1 ? 1 : (safeLevel - 1) / (maxLevel - 1)

  return {
    hp: interpolate(progression.min.hp, progression.max.hp, progress),
    attack: interpolate(progression.min.attack, progression.max.attack, progress),
    defense: interpolate(progression.min.defense, progression.max.defense, progress),
    resistance: interpolate(progression.min.resistance, progression.max.resistance, progress),
    redeployTime: interpolate(progression.min.redeployTime, progression.max.redeployTime, progress),
    dpCost: interpolate(progression.min.dpCost, progression.max.dpCost, progress),
    block: interpolate(progression.min.block, progression.max.block, progress),
    attackInterval: Number((progression.min.attackInterval + (progression.max.attackInterval - progression.min.attackInterval) * progress).toFixed(1)),
    hpRecoveryPerSec: Number((progression.min.hpRecoveryPerSec + (progression.max.hpRecoveryPerSec - progression.min.hpRecoveryPerSec) * progress).toFixed(1)),
  }
}

export function getOperatorFilterOptions() {
  return {
    rarities: Array.from(new Set(fallbackOperators.map(operator => operator.rarity))).sort((a, b) => b - a),
    professions: Array.from(new Set(fallbackOperators.map(operator => operator.profession))).sort(),
  }
}

export async function getFeaturedOperators(
  region: RegionCode = DEFAULT_REGION,
  limit = 4,
): Promise<OperatorSummary[]> {
  setI18nLocale(region)
  const operators = await listOperators({}, region)

  return operators
    .slice()
    .sort((left, right) => {
      if (right.rarity !== left.rarity)
        return right.rarity - left.rarity

      return left.name.localeCompare(right.name)
    })
    .slice(0, limit)
}
