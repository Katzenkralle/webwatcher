<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
    rotation: {
        type: Number,
        default: 0
    },
    color: {
        type: String,
        default: '--color-text'
    },
    arrowSize: {
        type: Number,
        default: 2
    },
});

const arrowStyle = computed(() => ({
    '--rotation': `${props.rotation}deg`,
    '--arrow-color': `var(${props.color})`,
    '--arrow-size': `${props.arrowSize}vw`,
    '--arrow-box-size': `${props.arrowSize * 2}vw`,}));
</script>

<template>
    <div class="arrow" :style="arrowStyle">
        <span></span>
        <span></span>
        <span></span>
    </div>
</template>

<style scoped>
.arrow {
    display: grid;
    place-items: center;
    height: var(--arrow-box-size);
    width: var(--arrow-box-size);
    margin-top: calc(var(--spacing) * 5);
    margin-bottom: calc(var(--spacing) * 10);
    transform: rotate(var(--rotation));
    cursor: pointer;
}

.arrow span {
    display: block;
    width: var(--arrow-size);
    height: var(--arrow-size);
    border-bottom: 5px solid var(--arrow-color);
    border-right: 5px solid var(--arrow-color);
    transform: rotate(45deg);
    margin: -10px;
    animation: animate 2s infinite;
}

.arrow span:nth-child(2) {
    animation-delay: -0.2s;
}

.arrow span:nth-child(3) {
    animation-delay: -0.4s;
}

@keyframes animate {
    0% {
        opacity: 0;
        transform: rotate(45deg) translate(-20px, -20px);
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0;
        transform: rotate(45deg) translate(20px, 20px);
    }
}
</style>
