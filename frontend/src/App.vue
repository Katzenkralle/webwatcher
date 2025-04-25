<script setup lang="ts">
import { RouterView } from 'vue-router'

import HeaderBar from '@/components/core/HeaderBar.vue'
import Footer from '@/components/core/FooterBar.vue'
import GoUpButton from '@/components/core/GoUpButton.vue'
</script>

<template>
  <HeaderBar />
  <GoUpButton />
  <RouterView />
  <Footer />
</template>
