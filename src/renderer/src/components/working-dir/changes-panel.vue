<script setup lang="ts">
    import type { FileStatus } from '@shared/types'

    const store = useRepoStore()

    const message = ref('')
    const amend = ref(false)
    const busy = ref(false)
    const actionError = ref('')
    /** Path currently awaiting discard confirmation (two-click confirm). */
    const confirming = ref('')

    const canCommit = computed(() => message.value.trim() !== '' || amend.value)

    interface FileSection {
        title: string
        empty: string
        staged: boolean
        /** Whether the file can be discarded (tracked files only — `git checkout --` can't delete untracked files). */
        discardable: boolean
        files: FileStatus[]
    }

    const sections = computed<FileSection[]>(() => {
        const s = store.status
        return [
            { title: 'Staged Changes', empty: 'No staged changes', staged: true, discardable: false, files: s?.staged ?? [] },
            { title: 'Unstaged Changes', empty: 'No unstaged changes', staged: false, discardable: true, files: s?.unstaged ?? [] },
            { title: 'Untracked Files', empty: 'No untracked files', staged: false, discardable: false, files: s?.untracked ?? [] },
        ]
    })

    async function run(action: () => Promise<{ ok: boolean; error?: string }>): Promise<boolean> {
        busy.value = true
        actionError.value = ''
        const res = await action()
        busy.value = false
        if (!res.ok) actionError.value = res.error ?? 'Operation failed'
        return res.ok
    }

    /** Flips a file's state: `makeStaged` is the desired end state (`staged: true` = git add, `false` = git reset). */
    function toggleStaged(path: string, makeStaged: boolean): void {
        void run(() => window.api.stage.set({ files: [path], staged: makeStaged }))
    }

    function discard(path: string): void {
        confirming.value = ''
        void run(() => window.api.discard.file({ files: [path] }))
    }

    async function commit(): Promise<void> {
        const ok = await run(() => window.api.commit.create({ message: message.value.trim(), amend: amend.value }))
        if (ok) {
            message.value = ''
            amend.value = false
        }
    }
</script>

<template>
    <div class="flex h-full min-h-0 flex-col">
        <!-- Commit box -->
        <div class="border-line flex shrink-0 flex-col gap-2 border-b p-3">
            <textarea
                v-model="message"
                rows="3"
                placeholder="Commit message…"
                class="bg-canvas border-line text-ink placeholder:text-mute focus:border-accent min-h-16 resize-none rounded-md border p-2 text-xs leading-relaxed outline-none"
                @keydown.ctrl.enter.prevent="commit" />
            <label class="text-mute flex cursor-pointer items-center gap-1.5 text-xs select-none">
                <input
                    v-model="amend"
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[--c-accent]" />
                Amend last commit
            </label>
            <button
                :disabled="!canCommit || busy"
                class="bg-accent h-8 shrink-0 rounded-md text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                @click="commit">
                {{ amend ? 'Amend commit' : 'Commit' }}
            </button>
            <p
                v-if="actionError"
                class="text-bad m-0 text-xs break-words">
                {{ actionError }}
            </p>
        </div>

        <!-- File list -->
        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-2">
            <section
                v-for="section in sections"
                :key="section.title">
                <h3 class="text-mute px-2 pb-1 text-[11px] font-semibold tracking-wide uppercase">
                    {{ section.title }}
                    <span
                        v-if="section.files.length"
                        class="ml-1 normal-case"
                        >({{ section.files.length }})</span
                    >
                </h3>
                <ul
                    v-if="section.files.length"
                    class="space-y-0.5">
                    <li
                        v-for="file in section.files"
                        :key="file.path"
                        class="group hover:bg-raised flex items-center gap-1.5 rounded-md px-2 py-1 text-sm">
                        <span class="i-lucide-file-text text-mute h-3.5 w-3.5 shrink-0" />
                        <span
                            class="text-ink min-w-0 flex-1 truncate font-mono text-xs"
                            :title="file.path">
                            {{ file.path }}
                        </span>
                        <button
                            class="text-mute hover:text-ink rounded px-1.5 py-0.5 text-[11px] font-semibold opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                            :disabled="busy"
                            @click="toggleStaged(file.path, !section.staged)">
                            {{ section.staged ? 'Unstage' : 'Stage' }}
                        </button>
                        <template v-if="section.discardable">
                            <button
                                v-if="confirming !== file.path"
                                class="text-bad hover:bg-bad rounded px-1.5 py-0.5 text-[11px] font-semibold opacity-0 transition group-hover:opacity-100 hover:text-white focus:opacity-100"
                                :disabled="busy"
                                @click="confirming = file.path">
                                Discard
                            </button>
                            <template v-else>
                                <button
                                    class="bg-bad rounded px-1.5 py-0.5 text-[11px] font-semibold text-white"
                                    :disabled="busy"
                                    @click="discard(file.path)">
                                    Sure?
                                </button>
                                <button
                                    class="text-mute hover:text-ink rounded px-1.5 py-0.5 text-[11px]"
                                    @click="confirming = ''">
                                    Cancel
                                </button>
                            </template>
                        </template>
                    </li>
                </ul>
                <p
                    v-else
                    class="text-mute px-2 py-0.5 text-xs">
                    {{ section.empty }}
                </p>
            </section>
        </div>
    </div>
</template>
