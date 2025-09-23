import ElementPlus from 'element-plus'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createRouterLayout } from 'vue-router-layout'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'

import '~/styles/index.scss'
import 'uno.css'

const RouterLayout = createRouterLayout((layout: any) => {
  return import(`./layouts/${layout}.vue`)
})

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

app.use(ElementPlus)
app.mount('#app')
