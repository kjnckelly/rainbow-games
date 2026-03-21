// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/rainbow-games/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Rainbow Games',
        short_name: 'Rainbow Games',
        description: 'A family card game rules reference',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // .md files do not need to be listed here — import.meta.glob with eager:true
        // inlines all game content into the JS bundle at build time, so it is already cached.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  // @ts-expect-error vitest@3 bundles vite@7 types; 'test' is valid at runtime
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
