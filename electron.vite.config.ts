import { fileURLToPath, URL } from 'node:url'

import Vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import VueRouter from 'unplugin-vue-router/vite'

const r = (p: string): string => fileURLToPath(new URL(p, import.meta.url))

const rendererSrc = r('./src/renderer/src')

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '@shared': r('./src/shared'),
            },
        },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: {
                '@shared': r('./src/shared'),
            },
        },
    },
    renderer: {
        resolve: {
            alias: {
                '@': rendererSrc,
                '@components': `${rendererSrc}/components`,
                '@utils': `${rendererSrc}/utils`,
                '@stores': `${rendererSrc}/stores`,
                '@types': `${rendererSrc}/types`,
                '@styles': `${rendererSrc}/assets/styles`,
                '@assets': `${rendererSrc}/assets`,
                '@shared': r('./src/shared'),
            },
        },
        plugins: [
            VueRouter({
                dts: `${rendererSrc}/typed-router.d.ts`,
                routesFolder: [{ src: `${rendererSrc}/pages` }],
            }),
            AutoImport({
                imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
                dirs: [`${rendererSrc}/utils/**`, `${rendererSrc}/stores/**`, `!${rendererSrc}/utils/config/**`],
                dts: `${rendererSrc}/auto-imports.d.ts`,
            }),
            Components({
                dirs: [`${rendererSrc}/components`],
                directoryAsNamespace: true,
                dts: `${rendererSrc}/components.d.ts`,
            }),
            Vue(),
            UnoCSS(),
        ],
    },
})
