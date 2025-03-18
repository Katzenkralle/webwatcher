<script setup lang="ts">
import { defineProps, ref } from 'vue'
const props = defineProps<{
    passthroughClass?: string
    isDashed?: boolean
    dashedColor?: string
}>()

const dashedColor = ref(props.dashedColor ?? 'var(--color-base)')
</script>

<template>
    <span :class="`
        w-5/6 h-1 bg-h-panel-d 
        ${props.passthroughClass ? props.passthroughClass : ''} 
        ${props.isDashed ? 'dashed' : ''} 
    `"></span>
</template>

<style scoped>
.dashed {
    @apply bg-[repeating-linear-gradient(90deg,v-bind(dashedColor),v-bind(dashedColor)_16px,transparent_16px,transparent_32px)];
}

</style>
