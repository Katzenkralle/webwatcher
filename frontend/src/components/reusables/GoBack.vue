<script setup  lang="ts">
import Button from 'primevue/button';
</script>

<template>
    <Button @click="$router.go(-1)" 
    aria-label="Go Back" 
    icon="pi pi-arrow-left"
    severity="danger" rounded outlined
    class=" cursor-pointer
        !absolute left-1 top-1 md:left-10 md:top-5  " />
</template>