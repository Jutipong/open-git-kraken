<script setup lang="ts">
    const open = ref(false)
    const menu = ref<HTMLElement | null>(null)

    function toggle(): void {
        open.value = !open.value
    }

    function close(): void {
        open.value = false
    }

    function onKeydown(e: KeyboardEvent): void {
        if (e.key === 'Escape') close()
    }

    onMounted(() => window.addEventListener('keydown', onKeydown))
    onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
    <div class="relative inline-block">
        <slot
            name="trigger"
            :toggle="toggle"
            :open="open" />
        <Teleport to="body">
            <div
                v-if="open"
                class="fixed inset-0 z-40"
                @click="close"
                @contextmenu.prevent="close" />
        </Teleport>
        <div
            v-if="open"
            ref="menu"
            class="border-line bg-surface absolute top-full right-0 z-50 mt-1 min-w-52 overflow-hidden rounded-lg border p-1 shadow-2xl">
            <slot :close="close" />
        </div>
    </div>
</template>
