<script setup lang="ts">
import router from '@/router'
import Button from 'primevue/button'
</script>

<template>
  <div class="w-min h-min py-1">
    <Button
      icon="pi pi-angle-left"
      class="bg-panel"
      variant="outlined"
      severity="warn"
      @click="() => router.go(-1)"
    />
  </div>
</template>
