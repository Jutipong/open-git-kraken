import { defineConfig, presetAttributify, presetIcons, presetWind4 } from 'unocss'

export default defineConfig({
    presets: [presetWind4({ dark: { light: '.light', dark: '.dark' } }), presetAttributify(), presetIcons()],
    theme: {
        extend: {
            colors: {
                canvas: 'var(--c-canvas)',
                surface: 'var(--c-surface)',
                raised: 'var(--c-raised)',
                line: 'var(--c-line)',
                ink: 'var(--c-ink)',
                mute: 'var(--c-mute)',
                accent: 'var(--c-accent)',
                ok: 'var(--c-ok)',
                bad: 'var(--c-bad)',
                warn: 'var(--c-warn)',
                branch0: 'var(--c-b0)',
                branch1: 'var(--c-b1)',
                branch2: 'var(--c-b2)',
                branch3: 'var(--c-b3)',
                branch4: 'var(--c-b4)',
            },
        },
    },
})
