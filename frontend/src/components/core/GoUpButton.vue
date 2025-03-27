<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import Button from "primevue/button";

const showScrollButton = ref(false);

const handleScroll = () => {
  showScrollButton.value = window.scrollY > 100; // Show button after scrolling 100px
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
    <Transition name="slide-right">
        <Button
            v-show="showScrollButton"
            icon="pi pi-angle-up"
            @click="scrollToTop"
            variant="outlined"
            severity="info"
            class="bg-panel-d fixed w-10 h-10 bottom-4 right-4 p-3 z-10 rounded-full shadow-lg 
                transition-all duration-900;"
        />
    </Transition>
</template>


<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
    transition: all 0.3s ease;
}

.slide-right-enter-from {
    transform: translateX(30px);
    opacity: 0;
}

.slide-right-leave-to {
    transform: translateX(30px);
    opacity: 0;
}
</style>

