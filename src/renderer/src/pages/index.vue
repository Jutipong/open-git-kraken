<script setup lang="ts">
    import { useRouter } from 'vue-router'

    import type { RecentRepo } from '@shared/types'

    const router = useRouter()
    const { toggle } = useTheme()
    const store = useRepoStore()
    const error = ref('')

    const recents = ref<RecentRepo[]>([])
    const showClone = ref(false)
    const cloneUrl = ref('')
    const cloneDir = ref('')
    const cloning = ref(false)
    const cloneError = ref('')

    async function loadRecents(): Promise<void> {
        recents.value = await window.api.repo.recent()
    }

    async function openRepo(path: string): Promise<void> {
        const result = await window.api.repo.open(path)
        if (result.ok) {
            store.set(result.data)
            void loadRecents()
            router.push('/repo')
        } else {
            error.value = result.error
        }
    }

    async function pickAndOpen(): Promise<void> {
        const path = await window.api.dialog.openFolder()
        if (path) await openRepo(path)
    }

    async function pickFolder(): Promise<void> {
        const dir = await window.api.dialog.openFolder()
        if (dir) cloneDir.value = dir
    }

    async function doClone(): Promise<void> {
        if (!cloneUrl.value || !cloneDir.value) return
        cloning.value = true
        cloneError.value = ''
        const result = await window.api.repo.clone({ url: cloneUrl.value.trim(), dir: cloneDir.value })
        cloning.value = false
        if (result.ok) {
            store.set(result.data)
            showClone.value = false
            void loadRecents()
            router.push('/repo')
        } else {
            cloneError.value = result.error
        }
    }

    async function removeRecent(path: string): Promise<void> {
        await window.api.repo.removeRecent(path)
        void loadRecents()
    }

    function formatDate(ts: number): string {
        return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    }

    onMounted(() => void loadRecents())
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
                @click="pickAndOpen">
                <span class="i-lucide-folder-open text-accent h-8 w-8" />
                <span class="text-base font-semibold">Open Repository</span>
                <span class="text-mute text-xs">Open an existing folder on disk</span>
            </button>

            <button
                class="border-line bg-surface text-ink hover:border-accent hover:bg-raised flex flex-col items-center gap-3 rounded-lg border px-10 py-8 transition"
                @click="showClone = true">
                <span class="i-lucide-git-clone text-accent h-8 w-8" />
                <span class="text-base font-semibold">Clone Repository</span>
                <span class="text-mute text-xs">Clone from a remote URL</span>
            </button>
        </div>

        <section class="w-full max-w-xl">
            <h2 class="text-mute m-0 mb-2 text-sm font-semibold tracking-wide uppercase">Recent Repositories</h2>
            <ul
                v-if="recents.length"
                class="border-line bg-surface divide-line divide-y overflow-hidden rounded-lg border">
                <li
                    v-for="r in recents"
                    :key="r.path"
                    class="group flex items-center gap-3 px-4 py-3">
                    <button
                        class="flex min-w-0 flex-1 items-center gap-3 text-left"
                        @click="openRepo(r.path)">
                        <span class="i-lucide-git-branch text-accent h-4 w-4 shrink-0" />
                        <span class="min-w-0">
                            <span class="text-ink block truncate text-sm font-medium">{{ r.name }}</span>
                            <span class="text-mute block truncate text-xs">{{ r.path }}</span>
                        </span>
                    </button>
                    <span class="text-mute shrink-0 text-xs">{{ formatDate(r.lastOpened) }}</span>
                    <button
                        class="text-mute hover:text-bad shrink-0 rounded p-1"
                        title="Remove from recents"
                        @click="removeRecent(r.path)">
                        <span class="i-lucide-x h-4 w-4" />
                    </button>
                </li>
            </ul>
            <p
                v-else
                class="border-line bg-surface text-mute m-0 rounded-lg border p-6 text-center">
                No recent repositories yet
            </p>
        </section>

        <button
            class="border-line bg-surface text-mute hover:text-ink fixed top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg border transition"
            title="Toggle light/dark theme"
            @click="toggle">
            <span class="i-lucide-moon light:i-lucide-sun h-4 w-4" />
        </button>

        <UiDialog
            :open="showClone"
            @close="showClone = false">
            <template #header>
                <h2 class="text-ink m-0 mb-4 text-base font-semibold">Clone Repository</h2>
            </template>

            <div class="space-y-3">
                <label class="block">
                    <span class="text-mute mb-1 block text-xs font-medium">Remote URL</span>
                    <input
                        v-model="cloneUrl"
                        type="text"
                        autofocus
                        placeholder="https://github.com/user/repo.git"
                        class="border-line bg-canvas text-ink focus:border-accent w-full rounded-md border px-3 py-2 text-sm outline-none"
                        @keyup.enter="doClone" />
                </label>
                <div>
                    <span class="text-mute mb-1 block text-xs font-medium">Destination folder</span>
                    <div class="flex gap-2">
                        <input
                            :value="cloneDir"
                            readonly
                            placeholder="Select a folder…"
                            class="border-line bg-canvas text-ink w-full rounded-md border px-3 py-2 text-sm outline-none" />
                        <button
                            class="border-line bg-canvas text-ink hover:border-accent shrink-0 rounded-md border px-3 text-sm"
                            @click="pickFolder">
                            Browse…
                        </button>
                    </div>
                </div>
                <p
                    v-if="cloneError"
                    class="text-bad m-0 text-xs">
                    {{ cloneError }}
                </p>
            </div>

            <div class="mt-5 flex justify-end gap-2">
                <button
                    class="text-mute hover:bg-raised hover:text-ink rounded-md px-3 py-1.5 text-sm"
                    @click="showClone = false">
                    Cancel
                </button>
                <button
                    :disabled="cloning || !cloneUrl || !cloneDir"
                    class="bg-accent text-canvas rounded-md px-4 py-1.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                    @click="doClone">
                    {{ cloning ? 'Cloning…' : 'Clone' }}
                </button>
            </div>
        </UiDialog>
    </div>
</template>
