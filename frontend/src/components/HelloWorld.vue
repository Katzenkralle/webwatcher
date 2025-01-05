<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import Button from "primevue/button"
import RadioButton from 'primevue/radiobutton';

const date = ref(new Date().toLocaleString());
let intervalId: number;

onMounted(() => {
    intervalId = setInterval(() => {
        date.value = new Date().toLocaleString();
    }, 1000);
});

onUnmounted(() => {
    clearInterval(intervalId);
});

</script>

<template>
    <h1>Hello World</h1>
    <h3>Vue Test:</h3>
    <p>{{ date }}</p>
    <h3>PrimeVue Test:</h3>
    <Button label="Click me" class="bg-panel p-1 border-2 border-info rounded-lg" />
    
</template>