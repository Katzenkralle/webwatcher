<script setup lang="ts">
const props = defineProps<{
    passthroughClass?: string
}>()

</script>

<template>
    <span :class="`w-5/6 h-1 bg-crust-h ${props.passthroughClass}`"></span>
</template>