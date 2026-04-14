import { attachConsole } from '@tauri-apps/plugin-log'

import ElementPlus from 'element-plus'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createRouterLayout } from 'vue-router-layout'
import { routes } from 'vue-router/auto-routes'
import { isDark } from '~/composables'
import { initializeDiagnostics } from '~/services/diagnostics'
import App from './App.vue'
import { i18n } from './i18n'

import '~/styles/index.scss'
import '~/styles/element/index.scss'
import 'uno.css'

const RouterLayout = createRouterLayout((layout: any) => {
  return import(`./layouts/${layout}.vue`)
})

function isAndroidTauriWebView() {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window) || typeof navigator === 'undefined')
    return false

  const userAgent = navigator.userAgent
  return /Android/i.test(userAgent) && /\bwv\b/i.test(userAgent)
}

if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
  void attachConsole()
}

const app = createApp(App)
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: RouterLayout,
      children: routes,
    },
  ],
})

if (isAndroidTauriWebView()) {
  void import('~/services/androidBack').then(({ initializeAndroidBackHandler }) => {
    void initializeAndroidBackHandler(router)
  })
}

app.use(router)
initializeDiagnostics(app, router)
isDark.value = true
app.use(ElementPlus)
app.use(i18n)
app.mount('#app')
