import { attachConsole } from '@tauri-apps/plugin-log'

import ElementPlus from 'element-plus'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createRouterLayout } from 'vue-router-layout'
import { routes } from 'vue-router/auto-routes'
import { isDark } from '~/composables'
import App from './App.vue'
import { i18n } from './i18n'

import '~/styles/index.scss'
import '~/styles/element/index.scss'
import 'uno.css'

const RouterLayout = createRouterLayout((layout: any) => {
  return import(`./layouts/${layout}.vue`)
})

if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
  void attachConsole()
}

const app = createApp(App)
app.use(createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: RouterLayout,
      children: routes,
    },
  ],
}))
isDark.value = true
app.use(ElementPlus)
app.use(i18n)
app.mount('#app')
