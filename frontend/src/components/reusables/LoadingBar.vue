<script setup lang="ts">
import { ref, computed, type Ref } from "vue";

const loadingAnimationCounter = ref(-1);
const DEFAULT_DURATION = 2;
const props = defineProps<{
    isLoading: Ref<boolean>,
    duration?: number
}>()

const duration = computed(() => props.duration ?? DEFAULT_DURATION) 

</script>
<template>
    <div id="appStatusBar" class="w-full h-1 bg-panel-d">
            <Transition name="loading">
                <div v-if="props.isLoading.value" class="relative w-screen h-1 overflow-hidden">
                    <div @animationiteration = "(e) => {loadingAnimationCounter = e.elapsedTime / duration }"
                        @animationstart="() => {loadingAnimationCounter = 0}"
                        class="w-[100px] h-1 bg-info left-to-right"></div>
                    <div class="w-[100px] h-1 bg-info left-to-right" :style="{ animationDelay: '0.25s' }"></div>
                    <div class="w-[100px] h-1 bg-info left-to-right" :style="{ animationDelay: '0.5s' }"></div>
                </div>
            </Transition>
        </div>
</template>

<style lang="css" scoped>
.left-to-right {
    position: absolute;
    transform: translateX(-100%);
    animation: l-to-r v-bind(duration + "s") cubic-bezier(.46,.03,.52,.96) forwards infinite;
}
@keyframes l-to-r {
    0% {
        left: 0px;
    }
    100% { 
        left: 100%;
        transform: translateX(0);
    }
}

.loading-leave-active .left-to-right,
.loading-leave-active {
    /* transistion needet to delay removal from DOM, .loading-leave-active serves as trigger */
    transition: none v-bind(duration + "s");
    animation-iteration-count: v-bind(loadingAnimationCounter +1) !important;
}

</style>

