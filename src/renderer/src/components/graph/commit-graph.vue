<script setup lang="ts">
    import { createGitgraph, MergeStyle, Orientation, TemplateName, templateExtend } from '@gitgraph/js'
    import { toGraphData, type GraphDataNode } from '@utils/graph-data'

    import type { Commit } from '@shared/types'

    const props = defineProps<{ commits: Commit[] }>()
    const emit = defineEmits<{ select: [hash: string] }>()

    const container = ref<HTMLElement | null>(null)
    const { theme } = useTheme()

    let graph: ReturnType<typeof createGitgraph> | null = null

    /** GitKraken-flavoured template; message/dot colors follow the active theme. */
    function buildTemplate(): ReturnType<typeof templateExtend> {
        const dark = theme.value === 'dark'
        return templateExtend(TemplateName.Metro, {
            colors: ['#6147FF', '#24D18F', '#FF9F1C', '#FF375F', '#0BB3FF', '#BF5AF2', '#FFD60A', '#30D158'],
            arrow: { size: null, offset: 1.5 },
            branch: { lineWidth: 3, spacing: 22, mergeStyle: MergeStyle.Straight, label: { display: false } },
            commit: {
                spacing: 24,
                message: {
                    display: true,
                    displayAuthor: false,
                    displayHash: false,
                    font: 'normal 12px system-ui, sans-serif',
                    color: dark ? '#D8DCE3' : '#1F2328',
                },
                dot: { size: 6, strokeWidth: 2, strokeColor: dark ? '#202124' : '#FFFFFF' },
            },
            tag: {
                color: '#FFFFFF',
                bgColor: '#6147FF',
                font: 'normal 10px system-ui, sans-serif',
                pointerWidth: 8,
            },
        })
    }

    function graphData(): GraphDataNode[] {
        return toGraphData(props.commits).map(node => ({ ...node, onClick: () => emit('select', node.hash) }))
    }

    function mountGraph(): void {
        if (!container.value) return
        // createGitgraph appends an <svg> to the container, so clear it when rebuilding (theme switch).
        container.value.replaceChildren()
        graph = createGitgraph(container.value, {
            orientation: Orientation.VerticalReverse, // newest commit on top, like GitKraken
            template: buildTemplate(),
            responsive: true,
        })
        try {
            graph.import(graphData())
        } catch {
            // Invalid graph data — render an empty graph rather than crash the workspace.
        }
    }

    onMounted(() => {
        mountGraph()
        watch(
            () => props.commits,
            () => graph?.import(graphData())
        )
        watch(theme, () => mountGraph())
    })
</script>

<template>
    <div
        ref="container"
        class="min-w-0 px-2 py-2" />
</template>
