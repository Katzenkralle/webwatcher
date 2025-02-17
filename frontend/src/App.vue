<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import HeaderBar from '@/components/core/HeaderBar.vue'
import Footer from '@/components/core/Footer.vue'

</script>

<template>
  <HeaderBar />
  <RouterView />
  <Footer />
</template>
