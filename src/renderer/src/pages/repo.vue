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

    const actionBusy = ref(false)
    const actionError = ref('')
    const branchError = ref('')
    const branchConfirm = ref('')
    const newBranch = ref('')

    const selectedCommit = computed<Commit | null>(() => store.commits.find(c => c.hash === selectedHash.value) ?? null)

    /** Runs a remote/branch mutation with busy + error feedback. */
    async function runAction(action: () => Promise<{ ok: boolean; error?: string }>): Promise<boolean> {
        actionBusy.value = true
        actionError.value = ''
        const res = await action()
        actionBusy.value = false
        if (!res.ok) actionError.value = res.error ?? 'Operation failed'
        return res.ok
    }

    function fetchRemote(): void {
        void runAction(() => window.api.remote.fetch())
    }

    /** Ctrl/Cmd+R — Fetch, Ctrl/Cmd+Shift+P — Push, Ctrl/Cmd+Shift+L — Pull (GitKraken-style shortcuts). */
    function onKeydown(e: KeyboardEvent): void {
        if (!(e.ctrlKey || e.metaKey) || e.altKey || e.repeat) return
        const key = e.key.toLowerCase()
        if (e.shiftKey) {
            if (key === 'p') {
                e.preventDefault()
                if (!actionBusy.value) pushRemote()
            } else if (key === 'l') {
                e.preventDefault()
                if (!actionBusy.value) pullRemote()
            }
        } else if (key === 'r') {
            e.preventDefault()
            if (!actionBusy.value) fetchRemote()
        }
    }

    function pullRemote(): void {
        void runAction(() => window.api.remote.pull({}))
    }

    function pushRemote(): void {
        void runAction(() => window.api.remote.push({}))
    }

    /** Checks out a local branch or a tag (detached HEAD) by name. */
    async function checkoutRef(name: string): Promise<void> {
        branchError.value = ''
        const res = await window.api.branch.checkout(name)
        if (!res.ok) branchError.value = res.error ?? 'Checkout failed'
    }

    /** Creates a local tracking branch from `origin/...` (e.g. `origin/foo` -> local `foo`). */
    async function checkoutRemote(name: string): Promise<void> {
        branchError.value = ''
        const res = await window.api.branch.checkoutRemote(name)
        if (!res.ok) branchError.value = res.error ?? 'Checkout failed'
    }

    async function deleteBranch(name: string): Promise<void> {
        branchConfirm.value = ''
        branchError.value = ''
        const res = await window.api.branch.delete(name)
        if (!res.ok) branchError.value = res.error ?? 'Delete failed'
    }

    async function createBranch(): Promise<void> {
        const name = newBranch.value.trim()
        if (!name) return
        branchError.value = ''
        const res = await window.api.branch.create(name)
        if (res.ok) newBranch.value = ''
        else branchError.value = res.error ?? 'Create failed'
    }

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
        const [statusRes, logRes, branchRes, remoteRes, tagRes] = await Promise.all([
            window.api.status.get(),
            window.api.log.get({}),
            window.api.branch.list(),
            window.api.branch.remote(),
            window.api.tag.list(),
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
        if (remoteRes.ok) store.remoteBranches = remoteRes.data
        else error.value = remoteRes.error
        if (tagRes.ok) store.tags = tagRes.data
        else error.value = tagRes.error
        loading.value = false
    }

    onMounted(() => {
        void load()
        stopListening = window.api.onRepoChanged(path => {
            if (path === store.path) void load()
        })
        window.addEventListener('keydown', onKeydown)
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', onKeydown)
        stopListening?.()
    })
</script>

<template>
    <div class="bg-canvas text-ink flex h-full flex-col">
        <!-- Toolbar -->
        <header class="border-line bg-surface flex h-12 shrink-0 items-center gap-2 border-b px-3">
            <UiDropdownMenu>
                <template #trigger="{ toggle }">
                    <button
                        class="border-line bg-canvas hover:border-accent flex h-8 max-w-72 items-center gap-2 rounded-md border px-2 text-sm font-semibold"
                        title="Switch branch"
                        @click="toggle">
                        <span class="i-lucide-git-branch text-accent h-4 w-4" />
                        <span class="truncate">{{ store.branch }}</span>
                    </button>
                </template>
                <template #default="{ close }">
                    <p class="text-mute px-2 py-1 text-xs font-semibold tracking-wide uppercase">Local Branches</p>
                    <ul class="max-h-72 overflow-y-auto">
                        <li
                            v-for="b in store.localBranches"
                            :key="b.name"
                            :class="b.current ? 'text-ink font-semibold' : 'text-mute hover:text-ink'"
                            class="hover:bg-raised flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm"
                            @click="b.current ? close() : (void checkoutRef(b.name), close())">
                            <span
                                v-if="b.current"
                                class="i-lucide-check text-accent h-3.5 w-3.5 shrink-0" />
                            <span class="min-w-0 truncate">{{ b.name }}</span>
                        </li>
                    </ul>
                    <div class="border-line my-1 border-t" />
                    <form
                        class="flex items-center gap-1.5 px-1 pb-1"
                        @submit.prevent="(void createBranch(), close())">
                        <input
                            v-model="newBranch"
                            type="text"
                            class="border-line bg-canvas text-ink placeholder:text-mute h-7 min-w-0 flex-1 rounded-md border px-2 text-xs outline-none"
                            placeholder="New branch name…" />
                        <button
                            type="submit"
                            class="bg-accent flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                            :disabled="newBranch.trim() === ''">
                            <span class="i-lucide-plus h-3 w-3" />
                            Create
                        </button>
                    </form>
                </template>
            </UiDropdownMenu>
            <span
                class="text-mute min-w-0 truncate text-sm"
                :title="store.path">
                {{ store.name }}
            </span>

            <div class="flex-1" />

            <button
                class="text-mute hover:bg-raised hover:text-ink flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50"
                title="Fetch from remotes"
                :disabled="actionBusy"
                @click="fetchRemote">
                <span class="i-lucide-download h-4 w-4" />
                Fetch
            </button>
            <button
                class="text-mute hover:bg-raised hover:text-ink flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50"
                title="Pull (merge) from upstream"
                :disabled="actionBusy"
                @click="pullRemote">
                <span class="i-lucide-arrow-down-to-line h-4 w-4" />
                Pull
            </button>
            <button
                class="text-mute hover:bg-raised hover:text-ink flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50"
                title="Push to remote"
                :disabled="actionBusy"
                @click="pushRemote">
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
                            :title="b.current ? b.name : `Checkout ${b.name}`"
                            class="hover:bg-raised group text-mute hover:text-ink flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm"
                            @click="!b.current && void checkoutRef(b.name)">
                            <span class="i-lucide-git-branch h-3.5 w-3.5 shrink-0" />
                            <span class="min-w-0 truncate">{{ b.name }}</span>
                            <span
                                v-if="b.current"
                                class="bg-accent ml-auto h-1.5 w-1.5 shrink-0 rounded-full" />
                            <button
                                v-else
                                :title="branchConfirm === b.name ? 'Sure? Click again to delete' : 'Delete branch'"
                                class="text-mute hover:bg-bad ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition group-hover:opacity-100 hover:text-white focus:opacity-100"
                                @click.stop="branchConfirm === b.name ? void deleteBranch(b.name) : (branchConfirm = b.name)">
                                <span class="i-lucide-trash-2 h-3 w-3" />
                            </button>
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
                    <ul
                        v-if="store.remoteBranches.length"
                        class="space-y-0.5">
                        <li
                            v-for="b in store.remoteBranches"
                            :key="b.name"
                            :title="`Checkout local tracking branch ${b.name}`"
                            class="hover:bg-raised text-mute hover:text-ink flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm"
                            @click="void checkoutRemote(b.name)">
                            <span class="i-lucide-cloud h-3.5 w-3.5 shrink-0" />
                            <span class="min-w-0 truncate">{{ b.name }}</span>
                        </li>
                    </ul>
                    <p
                        v-else
                        class="text-mute px-2 py-1 text-xs">
                        {{ loading ? 'Loading…' : 'No remotes yet' }}
                    </p>
                </section>
                <section class="border-line min-h-0 flex-1 overflow-y-auto border-t p-2">
                    <h3 class="text-mute px-2 pb-1 text-xs font-semibold tracking-wide uppercase">Tags</h3>
                    <ul
                        v-if="store.tags.length"
                        class="space-y-0.5">
                        <li
                            v-for="t in store.tags"
                            :key="t"
                            :title="`Checkout ${t} (detached HEAD)`"
                            class="hover:bg-raised text-mute hover:text-ink flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm"
                            @click="void checkoutRef(t)">
                            <span class="i-lucide-tag h-3.5 w-3.5 shrink-0" />
                            <span class="min-w-0 truncate">{{ t }}</span>
                        </li>
                    </ul>
                    <p
                        v-else
                        class="text-mute px-2 py-1 text-xs">
                        {{ loading ? 'Loading…' : 'No tags yet' }}
                    </p>
                </section>
            </aside>

            <!-- Center: commit graph -->
            <main class="min-w-0 flex-1 overflow-y-auto">
                <div
                    class="border-line bg-canvas hover:bg-raised flex h-9 cursor-pointer items-center gap-2 border-b px-3 text-sm font-semibold"
                    title="Show working directory changes"
                    @click="activeTab = 'changes'">
                    <span class="bg-ok h-3 w-3 rounded-sm" />
                    Working Directory
                </div>
                <p
                    v-if="actionError || branchError"
                    class="text-bad border-line bg-surface m-0 border-b px-3 py-2 text-xs break-words">
                    {{ actionError || branchError }}
                </p>
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
                    class="min-h-0 flex-1">
                    <WorkingDirChangesPanel />
                </div>
            </aside>
        </div>
    </div>
</template>
