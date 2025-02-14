<script setup lang="ts">
import { useTableMetaData } from "@/composable/api/JobAPI";

</script>

<template>
  <main>
    <h1>Tables:</h1>
    <div v-for="element in useTableMetaData().localTableMetaData.value" :key="element.id"
        class="border-2 border-info rounded-lg p-2 m-2 w-20v h-20v w-min-fit h-min-fit bg-panel selectable hover:border-success overflow-scroll"> 
      <router-link :to="'/table/' + element.id"
        class="flex flex-col h-full">
        <h3>{{ element.name }}</h3>
        <p>{{ element.description }}</p>
        <p class="mt-auto">Script: {{ element.script }}</p>
        <p>Creation: {{ element.executeTimer }}</p>
      </router-link>
    </div>
  </main>
</template>
