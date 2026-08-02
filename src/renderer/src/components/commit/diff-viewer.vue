<script setup lang="ts">
    import type { DiffData } from '@shared/types'

    const props = defineProps<{ diff: DiffData | null }>()

    type DiffLineType = 'header' | 'hunk' | 'add' | 'del' | 'context'

    interface DiffLine {
        type: DiffLineType
        text: string
    }

    function parseLines(content: string): DiffLine[] {
        return content.split('\n').map(line => {
            if (line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')) {
                return { type: 'header', text: line }
            }
            if (line.startsWith('@@')) return { type: 'hunk', text: line }
            if (line.startsWith('+')) return { type: 'add', text: line }
            if (line.startsWith('-')) return { type: 'del', text: line }
            return { type: 'context', text: line }
        })
    }

    const lines = computed<DiffLine[]>(() => {
        const content = props.diff?.content ?? ''
        return content.trim() === '' ? [] : parseLines(content)
    })

    const added = computed(() => props.diff?.added ?? 0)
    const removed = computed(() => props.diff?.removed ?? 0)

    function lineClass(type: DiffLineType): string {
        switch (type) {
            case 'header':
                return 'text-mute'
            case 'hunk':
                return 'bg-raised text-accent'
            case 'add':
                return 'diff-add'
            case 'del':
                return 'diff-del'
            default:
                return 'text-ink'
        }
    }
</script>

<template>
    <div class="min-w-0">
        <div class="bg-surface border-line flex shrink-0 items-center gap-2 border-b px-3 py-1.5 text-xs font-semibold">
            <span class="text-ok">{{ added }} +</span>
            <span class="text-bad">{{ removed }} −</span>
        </div>
        <p
            v-if="!lines.length"
            class="text-mute m-0 px-3 py-4 text-center text-xs">
            No changes in this commit
        </p>
        <div
            v-else
            class="overflow-x-auto">
            <div
                v-for="(line, i) in lines"
                :key="i"
                :class="lineClass(line.type)"
                class="px-3 font-mono text-xs leading-5 whitespace-pre">
                {{ line.text }}
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .diff-add {
        background: color-mix(in srgb, var(--c-ok) 16%, transparent);
        color: var(--c-ink);
    }
    .diff-del {
        background: color-mix(in srgb, var(--c-bad) 16%, transparent);
        color: var(--c-ink);
    }
</style>
