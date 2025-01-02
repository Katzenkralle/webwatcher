<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HeaderBar from '@/components/HeaderBar.vue'
import Footer from '@/components/Footer.vue'
</script>

<template>
  <HeaderBar />
  <RouterView />
  <Footer />
</template>

