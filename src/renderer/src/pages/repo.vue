<script setup lang="ts">
    import type { Commit, DiffData } from '@shared/types'

    const { toggle } = useTheme()
    const store = useRepoStore()
    const loading = ref(true)
    const error = ref('')
    let stopListening: (() => void) | null = null

    const activeTab = ref<'commit' | 'changes'>('commit')
    const selectedHash = ref('')
    const diff = ref<DiffData | null>(null)
    const diffLoading = ref(false)
    const diffError = ref('')

    const selectedCommit = computed<Commit | null>(() => store.commits.find(c => c.hash === selectedHash.value) ?? null)

    async function fetchDiff(commit: Commit | null): Promise<void> {
        if (!commit) {
            diff.value = null
            diffError.value = ''
            return
        }
        diffLoading.value = true
        diffError.value = ''
        const res = await window.api.diff.get({ commit: commit.hash, parents: commit.parents })
        diffLoading.value = false
        if (res.ok) diff.value = res.data
        else {
            diff.value = null
            diffError.value = res.error
        }
    }

    watch(selectedCommit, commit => {
        void fetchDiff(commit)
    })

    async function load(): Promise<void> {
        loading.value = true
        error.value = ''
        const [statusRes, logRes, branchRes] = await Promise.all([
            window.api.status.get(),
            window.api.log.get({}),
            window.api.branch.list(),
        ])
        if (statusRes.ok) {
            store.status = statusRes.data
            store.branch = statusRes.data.branch
        } else {
            error.value = statusRes.error
        }
        if (logRes.ok) store.commits = logRes.data
        else error.value = logRes.error
        if (branchRes.ok) store.localBranches = branchRes.data
        else error.value = branchRes.error
        loading.value = false
    }

    onMounted(() => {
        void load()
        stopListening = window.api.onRepoChanged(path => {
            if (path === store.path) void load()
        })
    })

    onUnmounted(() => stopListening?.())
</script>

<template>
    <div class="bg-canvas text-ink flex h-full flex-col">
        <!-- Toolbar -->
        <header class="border-line bg-surface flex h-12 shrink-0 items-center gap-2 border-b px-3">
            <button
                class="border-line bg-canvas hover:border-accent flex h-8 max-w-72 items-center gap-2 rounded-md border px-2 text-sm font-semibold"
                title="Switch branch (phase 4)">
                <span class="i-lucide-git-branch text-accent h-4 w-4" />
                <span class="truncate">{{ store.branch }}</span>
            </button>
            <span
                class="text-mute min-w-0 truncate text-sm"
                :title="store.path">
                {{ store.name }}
            </span>

            <div class="flex-1" />

            <button
                class="text-mute hover:bg-raised hover:text-ink flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition"
                title="Fetch (phase 4)">
                <span class="i-lucide-download h-4 w-4" />
                Fetch
            </button>
            <button
                class="text-mute hover:bg-raised hover:text-ink flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition"
                title="Pull (phase 4)">
                <span class="i-lucide-arrow-down-to-line h-4 w-4" />
                Pull
            </button>
            <button
                class="text-mute hover:bg-raised hover:text-ink flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition"
                title="Push (phase 4)">
                <span class="i-lucide-arrow-up-from-line h-4 w-4" />
                Push
            </button>

            <div class="bg-line mx-1 h-6 w-px" />

            <button
                class="text-mute hover:bg-raised hover:text-ink flex h-8 w-8 items-center justify-center rounded-md transition"
                title="Toggle light/dark theme"
                @click="toggle">
                <span class="i-lucide-moon light:i-lucide-sun h-4 w-4" />
            </button>
        </header>

        <div class="flex min-h-0 flex-1">
            <!-- Left sidebar: branches -->
            <aside class="border-line bg-surface flex w-60 shrink-0 flex-col border-r">
                <section class="min-h-0 flex-1 overflow-y-auto p-2">
                    <h3 class="text-mute px-2 pb-1 text-xs font-semibold tracking-wide uppercase">Local Branches</h3>
                    <ul
                        v-if="store.localBranches.length"
                        class="space-y-0.5">
                        <li
                            v-for="b in store.localBranches"
                            :key="b.name"
                            class="hover:bg-raised text-mute hover:text-ink flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm">
                            <span class="i-lucide-git-branch h-3.5 w-3.5 shrink-0" />
                            <span class="min-w-0 truncate">{{ b.name }}</span>
                            <span
                                v-if="b.current"
                                class="bg-accent ml-auto h-1.5 w-1.5 shrink-0 rounded-full" />
                        </li>
                    </ul>
                    <p
                        v-else
                        class="text-mute px-2 py-1 text-xs">
                        {{ loading ? 'Loading…' : 'No branches yet' }}
                    </p>
                </section>
                <section class="border-line min-h-0 flex-1 overflow-y-auto border-t p-2">
                    <h3 class="text-mute px-2 pb-1 text-xs font-semibold tracking-wide uppercase">Remote Branches</h3>
                    <p class="text-mute px-2 py-1 text-xs">No remotes yet</p>
                </section>
                <section class="border-line min-h-0 flex-1 overflow-y-auto border-t p-2">
                    <h3 class="text-mute px-2 pb-1 text-xs font-semibold tracking-wide uppercase">Tags</h3>
                    <p class="text-mute px-2 py-1 text-xs">No tags yet</p>
                </section>
            </aside>

            <!-- Center: commit graph -->
            <main class="min-w-0 flex-1 overflow-y-auto">
                <div class="border-line bg-canvas flex h-9 items-center gap-2 border-b px-3 text-sm font-semibold">
                    <span class="bg-ok h-3 w-3 rounded-sm" />
                    Working Directory
                </div>
                <div
                    v-if="loading"
                    class="text-mute flex h-48 flex-col items-center justify-center gap-2">
                    <span class="i-lucide-git-commit-horizontal h-8 w-8" />
                    <p class="m-0 text-sm">Loading…</p>
                </div>
                <GraphCommitGraph
                    v-else
                    :commits="store.commits"
                    @select="selectedHash = $event" />
                <p
                    v-if="error"
                    class="text-bad m-0 px-3 py-2 text-xs">
                    {{ error }}
                </p>
            </main>

            <!-- Right: details panel -->
            <aside class="border-line bg-surface flex w-80 shrink-0 flex-col border-l">
                <div class="border-line flex shrink-0 border-b">
                    <button
                        :class="activeTab === 'commit' ? 'border-accent border-b-2 font-semibold' : 'text-mute font-medium'"
                        class="flex-1 px-3 py-2 text-sm"
                        @click="activeTab = 'commit'">
                        Commit
                    </button>
                    <button
                        :class="activeTab === 'changes' ? 'border-accent border-b-2 font-semibold' : 'text-mute font-medium'"
                        class="flex-1 px-3 py-2 text-sm"
                        @click="activeTab = 'changes'">
                        Changes
                    </button>
                </div>
                <template v-if="activeTab === 'commit'">
                    <CommitCommitDetail
                        v-if="selectedCommit"
                        :commit="selectedCommit" />
                    <div
                        v-else
                        class="text-mute flex flex-1 items-center justify-center p-6 text-center text-sm">
                        Select a commit to see its details
                    </div>
                    <div
                        v-if="selectedCommit"
                        class="min-h-0 flex-1 overflow-y-auto">
                        <div
                            v-if="diffLoading"
                            class="text-mute flex h-32 items-center justify-center text-xs">
                            Loading diff…
                        </div>
                        <p
                            v-else-if="diffError"
                            class="text-bad m-0 px-3 py-2 text-xs">
                            {{ diffError }}
                        </p>
                        <CommitDiffViewer
                            v-else
                            :diff="diff" />
                    </div>
                </template>
                <div
                    v-else
                    class="text-mute flex flex-1 items-center justify-center p-6 text-center text-sm">
                    Working directory changes (phase 7)
                </div>
            </aside>
        </div>
    </div>
</template>
