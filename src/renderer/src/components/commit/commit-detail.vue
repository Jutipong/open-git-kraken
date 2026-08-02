<script setup lang="ts">
    import { formatDate, shortHash } from '@utils/format'

    import type { Commit } from '@shared/types'

    defineProps<{ commit: Commit }>()

    const isTag = (ref: string): boolean => ref.startsWith('tag: ')
    const tagName = (ref: string): string => ref.slice('tag: '.length)
</script>

<template>
    <div class="border-line flex shrink-0 flex-col gap-2 border-b p-3">
        <h2 class="text-ink m-0 text-sm leading-snug font-semibold break-words">{{ commit.subject }}</h2>
        <div
            v-if="commit.refs.length"
            class="flex flex-wrap items-center gap-1">
            <span
                v-for="ref in commit.refs"
                :key="ref"
                :class="isTag(ref) ? 'bg-accent text-white' : 'bg-raised text-mute'"
                class="rounded px-1.5 py-0.5 text-[10px] font-semibold">
                {{ isTag(ref) ? tagName(ref) : ref }}
            </span>
        </div>
        <dl class="m-0 flex flex-col gap-1 text-xs">
            <div class="flex items-baseline gap-2">
                <dt class="text-mute w-14 shrink-0">Author</dt>
                <dd
                    class="text-ink m-0 min-w-0 truncate"
                    :title="commit.authorEmail">
                    {{ commit.authorName }}
                </dd>
            </div>
            <div class="flex items-baseline gap-2">
                <dt class="text-mute w-14 shrink-0">Date</dt>
                <dd class="text-ink m-0">{{ formatDate(commit.authorDate) }}</dd>
            </div>
            <div class="flex items-baseline gap-2">
                <dt class="text-mute w-14 shrink-0">Hash</dt>
                <dd
                    class="text-mute m-0 font-mono"
                    :title="commit.hash">
                    {{ shortHash(commit.hash) }}
                </dd>
            </div>
            <div
                v-if="commit.parents.length > 1"
                class="flex items-baseline gap-2">
                <dt class="text-mute w-14 shrink-0">Parents</dt>
                <dd class="text-mute m-0 font-mono">
                    {{ commit.parents.map(shortHash).join(' · ') }}
                </dd>
            </div>
        </dl>
        <pre
            v-if="commit.body"
            class="bg-canvas text-mute m-0 max-h-28 overflow-y-auto rounded p-2 text-xs break-words whitespace-pre-wrap"
            >{{ commit.body }}</pre>
    </div>
</template>
