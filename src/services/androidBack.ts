import type { Router } from 'vue-router'
import { addPluginListener, invoke, isTauri } from '@tauri-apps/api/core'
import type { PluginListener } from '@tauri-apps/api/core'

const ANDROID_BACK_PLUGIN = 'android-back'
let initialization: Promise<void> | null = null
let listener: PluginListener | null = null

function isAndroidWebView() {
  if (typeof navigator === 'undefined')
    return false

  const userAgent = navigator.userAgent
  return /Android/i.test(userAgent) && /\bwv\b/i.test(userAgent)
}

function canNavigateBack() {
  const historyState = window.history.state as { back?: string | null } | null
  return Boolean(historyState?.back)
}

export function initializeAndroidBackHandler(router: Router) {
  if (initialization)
    return initialization

  initialization = (async () => {
    if (typeof window === 'undefined' || !isTauri() || !isAndroidWebView())
      return

    if (listener) {
      await listener.unregister()
      listener = null
    }

    listener = await addPluginListener<{ source?: string }>(ANDROID_BACK_PLUGIN, 'back', async () => {
      if (canNavigateBack()) {
        void router.back()
        return
      }

      await invoke('plugin:android-back|finish')
    })

    console.info('[android-back] plugin listener registered')
  })().catch((error) => {
    initialization = null
    console.warn('[android-back] failed to register listener', error)
  })

  return initialization
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    void listener?.unregister()
    listener = null
    initialization = null
  })
}
