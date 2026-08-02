<script setup lang="ts">
    import { useRouter } from 'vue-router'

    const router = useRouter()
    const { toggle } = useTheme()
    const store = useRepoStore()
    const error = ref('')

    async function openRepo(): Promise<void> {
        const path = await window.api.dialog.openFolder()
        if (!path) return
        const result = await window.api.repo.open(path)
        if (result.ok) {
            store.set(result.data)
            router.push('/repo')
        } else {
            error.value = result.error
        }
    }
</script>

<template>
    <div class="flex h-full flex-col items-center justify-center gap-8 overflow-y-auto">
        <p
            v-if="error"
            class="border-bad text-bad bg-bad/10 fixed top-4 left-1/2 -translate-x-1/2 rounded-md border px-4 py-2 text-sm">
            {{ error }}
        </p>
        <header class="flex flex-col items-center gap-2">
            <div class="flex items-center gap-3">
                <span class="i-lucide-git-branch text-accent h-10 w-10" />
                <h1 class="m-0 text-3xl font-bold">Open Git Kraken</h1>
            </div>
            <p class="text-mute m-0">Free &amp; open-source Git GUI — no forced updates, no licensing</p>
        </header>

        <div class="flex gap-4">
            <button
                class="border-line bg-surface text-ink hover:border-accent hover:bg-raised flex flex-col items-center gap-3 rounded-lg border px-10 py-8 transition"
                @click="openRepo">
                <span class="i-lucide-folder-open text-accent h-8 w-8" />
                <span class="text-base font-semibold">Open Repository</span>
                <span class="text-mute text-xs">Open an existing folder on disk</span>
            </button>

            <button
                class="border-line bg-surface text-mute flex flex-col items-center gap-3 rounded-lg border px-10 py-8 transition"
                title="Clone comes in phase 3">
                <span class="i-lucide-git-clone h-8 w-8" />
                <span class="text-base font-semibold">Clone Repository</span>
                <span class="text-xs">Clone from a remote URL</span>
            </button>
        </div>

        <section class="w-full max-w-xl">
            <h2 class="text-mute m-0 mb-2 text-sm font-semibold tracking-wide uppercase">Recent Repositories</h2>
            <p class="border-line bg-surface text-mute m-0 rounded-lg border p-6 text-center">No recent repositories yet</p>
        </section>

        <button
            class="border-line bg-surface text-mute hover:text-ink fixed top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg border transition"
            title="Toggle light/dark theme"
            @click="toggle">
            <span class="i-lucide-moon light:i-lucide-sun h-4 w-4" />
        </button>
    </div>
</template>
