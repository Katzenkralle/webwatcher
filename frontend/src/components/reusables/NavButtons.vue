<script setup lang="ts">
import router from "@/router";
import Button from "primevue/button";

</script>

<template>
    <div class="w-min h-min py-1">
      <Button
        icon="pi pi-angle-left"
        class="bg-panel"
        @click="() => router.go(-1)"
        variant="outlined"
        severity="warn"
        />
    </div>
</template>

