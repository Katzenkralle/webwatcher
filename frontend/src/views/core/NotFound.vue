<script setup lang="ts">
import { Button } from 'primevue';
import { loadingBarIsLoading } from '@/composable/core/AppState'
</script>

<template>
  <main>
    <h1>404 Page not found!</h1>
    <Button label="Go to Home" icon="pi pi-home" @click="() => {
      if (loadingBarIsLoading.continuous.loading) {
        loadingBarIsLoading.continuous.loading = false

      } else {
        loadingBarIsLoading.continuous.loading = true

      }
    }" />
    <Button label="Go to Home" icon="pi pi-home" @click="() => {
      if (loadingBarIsLoading.onetime.loading) {
        loadingBarIsLoading.onetime.loading = false
      } else {
        loadingBarIsLoading.onetime.loading = true
    }}" />
  </main>
</template>
