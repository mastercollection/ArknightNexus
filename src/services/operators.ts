import type {
  BuildingFormulaBundle,
  ItemEntry,
  OperatorDetail,
  OperatorFilters,
  OperatorStatPoint,
  OperatorSummary,
  PenguinMatrixEntry,
  RegionCode,
  RegionSyncStatus,
  RegionTerms,
  SyncResult,
  UserPlan,
  UserPlanOperator,
} from '~/types/operator'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { appCacheDir, join } from '@tauri-apps/api/path'
import { open, save } from '@tauri-apps/plugin-dialog'
import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from '@tauri-apps/plugin-fs'
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
    baTags: operator.baTags ?? [],
    thumbnailHue: operator.thumbnailHue,
  }
}

const regionReadyCache = new Set<RegionCode>()
const regionTermsCache = new Map<RegionCode, RegionTerms>()
const regionStageCodeCache = new Map<RegionCode, Record<string, string>>()
const resolvedImageSourceCache = new Map<string, ResolvedImageSource>()
const penguinMatrixCache = new Map<string, PenguinMatrixEntry[]>()
const IMAGE_REMOTE_BASE_URL
  = 'https://raw.githubusercontent.com/fexli/ArknightsResource/refs/heads/main'
const PENGUIN_MATRIX_ENDPOINT = 'https://penguin-stats.io/PenguinStats/api/v2/result/matrix'

export type CachedImageKind = 'portrait' | 'moduleEquip' | 'moduleType' | 'skillIcon' | 'itemIcon'

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

async function logImageCache(
  level: 'warn' | 'error',
  message: string,
  details?: Record<string, unknown>,
) {
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
  if (
    !normalized
    || normalized.includes('/')
    || normalized.includes('\\')
    || normalized.includes('..')
  ) {
    return undefined
  }

  if (!/^[\w.\-[\]]+$/.test(normalized))
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

  if (kind === 'itemIcon') {
    return {
      parentRelativePath: 'images/items',
      relativePath: `images/items/${getImageFileName(normalizedId)}`,
      partRelativePath: `images/items/${getImageFileName(normalizedId)}.part`,
      candidateUrls: [`${IMAGE_REMOTE_BASE_URL}/items/${normalizedId}.png`],
    }
  }

  const uppercaseId = normalizedId.toUpperCase()
  return {
    parentRelativePath: 'images/modules/type',
    relativePath: `images/modules/type/${getImageFileName(normalizedId)}`,
    partRelativePath: `images/modules/type/${getImageFileName(normalizedId)}.part`,
    candidateUrls:
      uppercaseId === normalizedId
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
      const matchesQuery
        = normalizedQuery.length === 0
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
  const operator = fallbackOperators.find(operator => operator.id === id)
  if (!operator)
    return undefined

  return {
    ...operator,
    baTags: operator.baTags ?? [],
  }
}

async function ensureRegionReady(region: RegionCode) {
  setI18nLocale(region)
  if (!canUseTauri())
    return

  const result = await invoke<SyncResult>('ensure_region_fresh', {
    request: {
      region,
    },
  })

  if (result.status === 'success') {
    regionTermsCache.delete(region)
    regionStageCodeCache.delete(region)
  }

  regionReadyCache.add(region)
}

export async function syncRegionData(region: RegionCode = DEFAULT_REGION): Promise<SyncResult> {
  setI18nLocale(region)
  if (!canUseTauri()) {
    return {
      region,
      sourceRevision: 'fallback',
      sourceVersion: 'fallback',
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
  regionTermsCache.delete(region)
  regionStageCodeCache.delete(region)
  return result
}

export async function getRegionSyncStatus(): Promise<RegionSyncStatus[]> {
  if (!canUseTauri()) {
    return [
      {
        region: DEFAULT_REGION,
        sourceRevision: 'fallback',
        sourceVersion: 'fallback',
        fetchedAt: new Date().toISOString(),
        operatorCount: fallbackOperators.length,
        isReady: true,
      },
    ]
  }

  return invoke<RegionSyncStatus[]>('get_region_sync_status')
}

export async function getRegionTerms(region: RegionCode = DEFAULT_REGION): Promise<RegionTerms> {
  setI18nLocale(region)
  if (!canUseTauri())
    return {}

  await ensureRegionReady(region)

  if (regionTermsCache.has(region))
    return regionTermsCache.get(region) ?? {}

  let terms: RegionTerms
  try {
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

export async function getRegionStageCodes(
  region: RegionCode = DEFAULT_REGION,
): Promise<Record<string, string>> {
  setI18nLocale(region)
  if (!canUseTauri())
    return {}

  await ensureRegionReady(region)

  if (regionStageCodeCache.has(region))
    return regionStageCodeCache.get(region) ?? {}

  let stageCodes: Record<string, string>
  try {
    stageCodes = await invoke<Record<string, string>>('get_region_stage_codes', {
      request: {
        region,
      },
    })
  }
  catch (error) {
    if (!String(error).includes('동기화된 데이터'))
      throw error

    await syncRegionData(region)
    stageCodes = await invoke<Record<string, string>>('get_region_stage_codes', {
      request: {
        region,
      },
    })
  }

  regionStageCodeCache.set(region, stageCodes)
  return stageCodes
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

export async function getUserPlan(): Promise<UserPlan> {
  if (!canUseTauri()) {
    return {
      selectedOperatorIds: [],
      operators: [],
    }
  }

  return invoke<UserPlan>('get_user_plan')
}

export async function exportUserDataFile(): Promise<boolean> {
  if (!canUseTauri())
    return false

  const content = await invoke<string>('export_user_data')
  const destination = await save({
    defaultPath: 'user_data.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (!destination)
    return false

  await writeTextFile(destination, content)
  return true
}

export async function importUserDataFile(): Promise<boolean> {
  if (!canUseTauri())
    return false

  const source = await open({
    directory: false,
    multiple: false,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (!source || Array.isArray(source))
    return false

  const content = await readTextFile(source)
  await invoke('import_user_data', {
    request: {
      content,
    },
  })
  return true
}

export async function saveUserPlanSelection(operatorIds: string[]): Promise<string[]> {
  if (!canUseTauri())
    return operatorIds

  return invoke<string[]>('save_user_plan_selection', {
    request: {
      operatorIds,
    },
  })
}

export async function saveUserPlanOperator(plan: UserPlanOperator): Promise<UserPlanOperator> {
  if (!canUseTauri())
    return plan

  return invoke<UserPlanOperator>('save_user_plan_operator', {
    request: {
      plan,
    },
  })
}

export async function removeUserPlanOperator(operatorId: string): Promise<boolean> {
  if (!canUseTauri())
    return false

  return invoke<boolean>('remove_user_plan_operator', {
    request: {
      operatorId,
    },
  })
}

export async function resolveImageSource(
  request: ImageSourceRequest,
): Promise<ResolvedImageSource> {
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

    if (
      !request.forceRefresh
      && (await exists(descriptor.relativePath, { baseDir: BaseDirectory.AppCache }))
    ) {
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

export async function listItems(
  region: RegionCode = DEFAULT_REGION,
  classifyType?: string | null,
): Promise<ItemEntry[]> {
  setI18nLocale(region)
  if (!canUseTauri())
    return []

  await ensureRegionReady(region)

  return invoke<ItemEntry[]>('list_items', {
    request: {
      region,
      classifyType: classifyType?.trim() || null,
    },
  })
}

export async function saveUserItemCount(itemId: string, count: number): Promise<number> {
  if (!canUseTauri())
    return count

  return invoke<number>('save_user_item_count', {
    request: {
      itemId,
      count,
    },
  })
}

export async function importUserItemCounts(content: string): Promise<number> {
  if (!canUseTauri())
    return 0

  return invoke<number>('import_user_item_counts', {
    request: {
      content,
    },
  })
}

export async function listBuildingFormulas(
  region: RegionCode = DEFAULT_REGION,
): Promise<BuildingFormulaBundle> {
  setI18nLocale(region)
  if (!canUseTauri()) {
    return {
      manufactFormulas: [],
      workshopFormulas: [],
    }
  }

  await ensureRegionReady(region)

  return invoke<BuildingFormulaBundle>('list_building_formulas', {
    request: { region },
  })
}

export async function getItemById(
  id: string,
  region: RegionCode = DEFAULT_REGION,
): Promise<ItemEntry | undefined> {
  const normalizedId = id.trim()
  if (!normalizedId)
    return undefined

  const items = await listItems(region)
  return items.find(item => item.itemId === normalizedId)
}

interface PenguinMatrixResponseEntry {
  stageId: string
  itemId: string
  quantity: number
  times: number
  start?: string | null
  end?: string | null
}

interface PenguinMatrixResponse {
  matrix?: Array<{
    stageId: string
    itemId: string
    quantity: number
    times: number
    start?: string | null
    end?: string | null
  }>
}

export async function getPenguinItemMatrix(
  itemId: string,
  server: 'CN' | 'US' | 'JP' | 'KR' = 'CN',
): Promise<PenguinMatrixEntry[]> {
  const normalizedItemId = itemId.trim()
  if (!normalizedItemId)
    return []

  const cacheKey = `${server}:${normalizedItemId}`
  if (penguinMatrixCache.has(cacheKey))
    return penguinMatrixCache.get(cacheKey) ?? []

  const url = new URL(PENGUIN_MATRIX_ENDPOINT)
  url.searchParams.set('itemFilter', normalizedItemId)
  url.searchParams.set('server', server)

  const response = await fetch(url.toString())
  if (!response.ok)
    throw new Error(`Penguin Stats request failed: ${response.status}`)

  const payload = (await response.json()) as PenguinMatrixResponse | PenguinMatrixResponseEntry[]
  const matrix = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.matrix)
      ? payload.matrix
      : []

  const result = matrix
    .filter(entry => entry.itemId === normalizedItemId && entry.times > 0 && entry.quantity > 0)
    .map(entry => ({
      stageId: entry.stageId,
      itemId: entry.itemId,
      quantity: entry.quantity,
      times: entry.times,
      start: entry.start ?? null,
      end: entry.end ?? null,
      dropRate: entry.quantity / entry.times,
    }))
    .sort(
      (left, right) =>
        right.dropRate - left.dropRate
        || right.times - left.times
        || left.stageId.localeCompare(right.stageId),
    )

  penguinMatrixCache.set(cacheKey, result)
  return result
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

export function getOperatorStats(
  detail: OperatorDetail,
  elite: number,
  level: number,
): OperatorStatPoint {
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
    attackInterval: Number(
      (
        progression.min.attackInterval
        + (progression.max.attackInterval - progression.min.attackInterval) * progress
      ).toFixed(1),
    ),
    hpRecoveryPerSec: Number(
      (
        progression.min.hpRecoveryPerSec
        + (progression.max.hpRecoveryPerSec - progression.min.hpRecoveryPerSec) * progress
      ).toFixed(1),
    ),
  }
}

export function getOperatorFilterOptions() {
  return {
    rarities: Array.from(new Set(fallbackOperators.map(operator => operator.rarity))).sort(
      (a, b) => b - a,
    ),
    professions: Array.from(
      new Set(fallbackOperators.map(operator => operator.profession)),
    ).sort(),
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
