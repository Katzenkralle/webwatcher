<script setup lang="ts">
import { ref, computed, watch, type Ref } from 'vue'

const loadingAnimationCounter = ref(-1)
const DEFAULT_DURATION = 2
const props = defineProps<{
  isLoading: Ref<boolean>
  duration?: number
}>()

const duration = computed(() => props.duration ?? DEFAULT_DURATION)
const loadingState = ref(false)
let lastChangeAt = Infinity
let timeoutIdTrue: number | null = null

watch(
  () => props.isLoading.value,
  (newValue) => {
    // Clear any existing timer
    const diff = lastChangeAt + duration.value * 0.8 * 1000 - Date.now()
    if (diff > 0 || !newValue) {
      if (timeoutIdTrue === null) {
        timeoutIdTrue = setTimeout(() => {
          loadingState.value = true
          lastChangeAt = Date.now()
          timeoutIdTrue = null
          setTimeout(() => {
            loadingState.value = false
          }, 10)
        }, diff)
      }
    } else {
      loadingState.value = newValue
      lastChangeAt = Date.now()
    }
  },
  { immediate: true },
)
</script>
<template>
  <div id="appStatusBar" class="w-full h-1 bg-panel-d">
    <Transition name="loading">
      <div v-if="loadingState" class="relative w-screen h-1 overflow-hidden">
        <div
          class="animation-bar"
          @animationiteration="
            (e) => {
              loadingAnimationCounter = e.elapsedTime / duration
            }
          "
          @animationstart="
            () => {
              loadingAnimationCounter = 0
            }
          "
        ></div>
        <div class="animation-bar" :style="{ animationDelay: '0.25s' }"></div>
        <div class="animation-bar" :style="{ animationDelay: '0.5s' }"></div>
      </div>
    </Transition>
  </div>
</template>

<style lang="css" scoped>
@reference "@/assets/global.css";

.animation-bar {
  @apply w-[100px] h-1 bg-info absolute z-10 [transform:translateX(-100%)];
  animation: l-to-r v-bind(duration + 's') cubic-bezier(0.46, 0.03, 0.52, 0.96) forwards infinite;
}
@keyframes l-to-r {
  0% {
    left: 0;
  }
  100% {
    left: 100%;
    transform: translateX(0);
  }
}

.loading-leave-active .animation-bar,
.loading-leave-active {
  /* transistion needet to delay removal from DOM, .loading-leave-active serves as trigger */
  transition: linear v-bind(duration + 's');
  opacity: 0;
  animation-iteration-count: v-bind(loadingAnimationCounter + 1) !important;
}
</style>
