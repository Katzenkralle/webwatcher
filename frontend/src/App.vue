<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import HeaderBar from '@/components/core/HeaderBar.vue'
import Footer from '@/components/core/Footer.vue'
import GoUpButton from '@/components/core/GoUpButton.vue'
</script>

<template>
  <HeaderBar />
  <GoUpButton />
  <RouterView />
  <Footer />
</template>
