<script setup lang="ts">
    defineProps<{ open: boolean }>()
    const emit = defineEmits<{ close: [] }>()

    function onKeydown(e: KeyboardEvent): void {
        if (e.key === 'Escape') emit('close')
    }

    onMounted(() => window.addEventListener('keydown', onKeydown))
    onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
    <Teleport to="body">
        <div
            v-if="open"
            class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                class="bg-ink/60 absolute inset-0"
                @click="emit('close')" />
            <div class="border-line bg-surface relative w-full max-w-md rounded-lg border p-5 shadow-2xl">
                <slot name="header" />
                <slot />
                <slot name="footer" />
            </div>
        </div>
    </Teleport>
</template>
