<script setup lang="ts">
    const { toggle } = useTheme()
    const store = useRepoStore()
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
                    <p class="text-mute px-2 py-1 text-xs">No branches yet</p>
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
                <div class="text-mute flex h-48 flex-col items-center justify-center gap-2">
                    <span class="i-lucide-git-commit-horizontal h-8 w-8" />
                    <p class="m-0 text-sm">Commit graph comes in phase 3</p>
                </div>
            </main>

            <!-- Right: details panel -->
            <aside class="border-line bg-surface flex w-80 shrink-0 flex-col border-l">
                <div class="border-line flex shrink-0 border-b">
                    <button class="border-accent flex-1 border-b-2 px-3 py-2 text-sm font-semibold">Commit</button>
                    <button class="text-mute flex-1 px-3 py-2 text-sm font-medium">Changes</button>
                </div>
                <div class="text-mute flex flex-1 items-center justify-center p-6 text-center text-sm">
                    Select a commit to see its details (phase 5)
                </div>
            </aside>
        </div>
    </div>
</template>
