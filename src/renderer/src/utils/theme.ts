export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'ogk-theme'

/**
 * Module-level singleton so every `useTheme()` caller shares one reactive `theme`. A per-call `ref` would silently desync watchers across
 * components (e.g. the commit graph re-rendering on theme change while the toolbar holds a different ref).
 */
const theme = ref<Theme>(localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark')

function apply(t: Theme): void {
    theme.value = t
    document.documentElement.classList.toggle('light', t === 'light')
    localStorage.setItem(STORAGE_KEY, t)
}

apply(theme.value)

export function useTheme(): { theme: Ref<Theme>; toggle: () => void } {
    return { theme, toggle: (): void => apply(theme.value === 'dark' ? 'light' : 'dark') }
}
