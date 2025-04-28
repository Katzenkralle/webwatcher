<script setup lang="ts">
import { ref, computed, watch, type Ref } from 'vue'
import { type Loading } from '@/composable/core/AppState'


const loadingAnimationCounter = ref(-1)
const DEFAULT_DURATION = 2
const props = defineProps<{
  loading: Ref<Loading>
}>()

// Onetime loading bar
const oneTimePos = ref(0)
const durationOnetime = computed(() => props.loading.value.onetime.duration ?? (DEFAULT_DURATION * 60))
let increasePosInter: number|undefined = undefined
watch(
  () => props.loading.value.onetime.loading,
  (newValue) => {
    if (newValue){
        oneTimePos.value = 1
        increasePosInter = setInterval(() => {
          //if (oneTimePos.value <  1) {
          //  oneTimePos.value = 1
          //} else
           if (oneTimePos.value < 80) {
            oneTimePos.value = Math.min(1.15*oneTimePos.value, 80)
          } else {
            clearInterval(increasePosInter!)
          }
        }, durationOnetime.value)
        } else {
          if (increasePosInter) {
            clearInterval(increasePosInter)
            increasePosInter = undefined
          }
          oneTimePos.value = 100
          setTimeout(() => {
            oneTimePos.value = -1
          }, 300)
        }
    },
  { immediate: true },
)

// Continuous loading bar
const durationContinuous = computed(() => props.loading.value.continuous.duration ?? DEFAULT_DURATION)
const loadingState = ref(true)
const statusBar = ref<HTMLElement | null>(null)
let lastChangeAt = Infinity
let timeoutIdTrue: number | null = null
watch(
  () => props.loading.value.continuous.loading,
  (newValue) => {
    const diff = lastChangeAt + durationContinuous.value * 0.8 * 1000 - Date.now()
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

watch(() => statusBar.value, (bar) => {
  if (bar) {
    bar.style.setProperty('--loading-bar-duration-continuous', `${durationContinuous.value}s`)
  }
})

</script>
<template>
  <div id="appStatusBar" ref="statusBar" class="w-full h-1 bg-panel-d relative">
    <div class="absolute top-0">
      <Transition name="loading">
        <div v-if="loadingState" class="relative w-screen h-1 overflow-hidden">
          <div
            class="animation-bar"
            @animationiteration="
              (e) => {
                loadingAnimationCounter = e.elapsedTime / durationContinuous
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
    <div class="absolute top-0">
      <div class="relative w-screen h-1 overflow-hidden">
        <Transition name="onetime">
          <div  v-if="oneTimePos >= 0" class="one-time-animation-bar" :style="`left: ${oneTimePos}%`"></div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
@reference "@/assets/global.css";

.one-time-animation-bar {
  @apply w-[101%] h-1 bg-error absolute z-4 [transform:translateX(-101%)] transition-all
  duration-300 ease-linear 
}

.onetime-leave-active {
  opacity: 0;
}

.animation-bar {
  @apply w-[100px] h-1 bg-info absolute z-5 [transform:translateX(-100%)];
  animation: l-to-r var(--loading-bar-duration-continuous) cubic-bezier(0.46, 0.03, 0.52, 0.96) forwards infinite;
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
  transition: linear var(--loading-bar-duration-continuous);
  opacity: 0;
  animation-iteration-count: v-bind(loadingAnimationCounter + 1) !important;
}
</style>
