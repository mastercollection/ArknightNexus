import type { App } from 'vue'
import type { Router } from 'vue-router'
import { getVersion } from '@tauri-apps/api/app'
import { appLogDir } from '@tauri-apps/api/path'
import { BaseDirectory, copyFile, readDir, stat } from '@tauri-apps/plugin-fs'
import { error, info, warn } from '@tauri-apps/plugin-log'
import { openPath } from '@tauri-apps/plugin-opener'

type DiagnosticLevel = 'info' | 'warn' | 'error'

interface DiagnosticContext {
  [key: string]: unknown
}

export interface DiagnosticsSummary {
  appVersion: string
  logDir: string | null
  platform: string
}

export interface ExportedDiagnosticsLog {
  fileName: string
  relativePath: string
}

const UNKNOWN_VERSION = 'unknown'
const UNKNOWN_PLATFORM = 'unknown'

function canUseTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function detectPlatform() {
  if (typeof navigator === 'undefined')
    return UNKNOWN_PLATFORM

  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('android'))
    return 'android'
  if (userAgent.includes('windows'))
    return 'windows'
  if (userAgent.includes('mac os x'))
    return 'macos'
  if (userAgent.includes('linux'))
    return 'linux'

  return UNKNOWN_PLATFORM
}

function normalizeError(errorLike: unknown) {
  if (errorLike instanceof Error) {
    return {
      name: errorLike.name,
      message: errorLike.message,
      stack: errorLike.stack,
    }
  }

  if (typeof errorLike === 'string')
    return { message: errorLike }

  return { message: String(errorLike) }
}

function normalizeReason(reason: unknown) {
  if (reason instanceof Error)
    return normalizeError(reason)

  if (typeof reason === 'object' && reason !== null) {
    try {
      return JSON.parse(JSON.stringify(reason)) as Record<string, unknown>
    }
    catch {
      return { message: String(reason) }
    }
  }

  return { message: String(reason) }
}

function serializeContext(context: DiagnosticContext) {
  return JSON.stringify(context, (_key, value) => {
    if (value instanceof Error)
      return normalizeError(value)

    return value
  })
}

async function writeDiagnostic(level: DiagnosticLevel, event: string, context: DiagnosticContext) {
  const payload = `[diagnostics] ${event} ${serializeContext(context)}`

  if (level === 'warn') {
    console.warn(payload)
  }
  else if (level === 'error') {
    console.error(payload)
  }

  if (!canUseTauri())
    return

  if (level === 'info') {
    await info(payload)
    return
  }

  if (level === 'warn') {
    await warn(payload)
    return
  }

  await error(payload)
}

let diagnosticsSummaryPromise: Promise<DiagnosticsSummary> | null = null

export async function getDiagnosticsSummary(): Promise<DiagnosticsSummary> {
  diagnosticsSummaryPromise ??= (async () => {
    const platform = detectPlatform()
    if (!canUseTauri()) {
      return {
        appVersion: UNKNOWN_VERSION,
        logDir: null,
        platform,
      }
    }

    const [appVersion, logDir] = await Promise.all([
      getVersion().catch(() => UNKNOWN_VERSION),
      appLogDir().catch(() => null),
    ])

    return {
      appVersion,
      logDir,
      platform,
    }
  })()

  return diagnosticsSummaryPromise
}

export async function openDiagnosticsLogDir() {
  const summary = await getDiagnosticsSummary()
  if (!summary.logDir)
    throw new Error('로그 디렉터리를 찾을 수 없습니다.')

  await openPath(summary.logDir)
  return summary
}

export async function exportLatestDiagnosticsLog(): Promise<ExportedDiagnosticsLog> {
  const entries = await readDir('', { baseDir: BaseDirectory.AppLog })
  const files = entries.filter(entry => entry.isFile && entry.name.toLowerCase().endsWith('.log'))

  if (!files.length)
    throw new Error('내보낼 로그 파일이 없습니다.')

  const candidates = await Promise.all(files.map(async (entry) => {
    const fileInfo = await stat(entry.name, { baseDir: BaseDirectory.AppLog })
    return {
      mtime: fileInfo.mtime?.getTime() ?? 0,
      name: entry.name,
    }
  }))

  candidates.sort((left, right) => right.mtime - left.mtime)
  const latestFile = candidates[0]
  if (!latestFile)
    throw new Error('내보낼 로그 파일이 없습니다.')

  const exportedName = `diagnostics-${Date.now()}.log`

  await copyFile(latestFile.name, exportedName, {
    fromPathBaseDir: BaseDirectory.AppLog,
    toPathBaseDir: BaseDirectory.Download,
  })

  return {
    fileName: latestFile.name,
    relativePath: exportedName,
  }
}

export function initializeDiagnostics(app: App, router: Router) {
  void getDiagnosticsSummary().then((summary) => {
    void writeDiagnostic('info', 'diagnostics-ready', { ...summary })
  })

  app.config.errorHandler = (capturedError, instance, infoText) => {
    void getDiagnosticsSummary().then(summary =>
      writeDiagnostic('error', 'vue-error', {
        ...summary,
        component: instance?.$options?.name ?? 'anonymous',
        error: normalizeError(capturedError),
        info: infoText,
      }),
    )
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      void getDiagnosticsSummary().then(summary =>
        writeDiagnostic('error', 'window-error', {
          ...summary,
          colno: event.colno,
          error: normalizeError(event.error ?? event.message),
          filename: event.filename,
          lineno: event.lineno,
        }),
      )
    })

    window.addEventListener('unhandledrejection', (event) => {
      void getDiagnosticsSummary().then(summary =>
        writeDiagnostic('error', 'unhandled-rejection', {
          ...summary,
          reason: normalizeReason(event.reason),
        }),
      )
    })
  }

  router.afterEach((to, from, failure) => {
    void getDiagnosticsSummary().then(summary =>
      writeDiagnostic(failure ? 'warn' : 'info', 'route-change', {
        ...summary,
        from: from.fullPath,
        to: to.fullPath,
        failure: failure ? String(failure) : null,
      }),
    )
  })
}
