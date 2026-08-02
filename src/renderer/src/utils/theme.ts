export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'ogk-theme'

export function useTheme(): { theme: Ref<Theme>; toggle: () => void } {
    const theme = ref<Theme>(localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark')

    const apply = (t: Theme): void => {
        theme.value = t
        document.documentElement.classList.toggle('light', t === 'light')
        localStorage.setItem(STORAGE_KEY, t)
    }

    apply(theme.value)

    const toggle = (): void => apply(theme.value === 'dark' ? 'light' : 'dark')

    return { theme, toggle }
}
