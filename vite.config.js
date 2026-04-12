import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
// eslint-disable-next-line node/prefer-global/process
const host = typeof process !== 'undefined' ? process.env.TAURI_DEV_HOST : undefined
// eslint-disable-next-line node/prefer-global/process
const PLATFORM = process.env.TAURI_ENV_PLATFORM
// https://vite.dev/config/
export default defineConfig(({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, './src')}/`,
    },
  },
  css: {
    preprocessorOptions: {
      scss: {},
    },
  },
  plugins: [
    vue(),
    VueRouter({
      extensions: ['.vue'],
      dts: 'src/typed-router.d.ts',
    }),
    vueDevTools(),
    UnoCSS(),
    ElementPlus({
      useSource: true,
    }),
    AutoImport({
      imports: [
        // Presets
        'vue',
        'vue-router',
        // 'vue-i18n',
        'pinia',
        {
          '@/store': ['useStore'],
        },
        // '@vueuse/core',
        // 'vee-validate',
        // Only type import
        {
          from: 'vue-router',
          imports: ['RouteLocationRaw'],
          type: true,
        },
      ],
      // Automatically generate types
      dts: 'src/auto-imports.d.ts',
      // Auto import inside Vue template
      vueTemplate: true,
    }),
    Components({
      extensions: ['vue'],
      dts: 'src/components.d.ts',
    }),
  ],
  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 3000,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 3001,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    outDir: './dist',
    target: PLATFORM === 'windows' ? 'chrome107' : 'safari16',
    // eslint-disable-next-line node/prefer-global/process
    minify: !process.env.TAURI_DEBUG ? false : 'esbuild',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1024,
    // eslint-disable-next-line node/prefer-global/process
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}))
