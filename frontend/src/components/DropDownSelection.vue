<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits } from 'vue'

const props = defineProps<{ 
    options: Array<[string, (number, string) => null]>,
    multiSelect: boolean,
    selected?: Array<number>,
    isActive: Ref<boolean>
}>()
const emit = defineEmits();

const selected = ref<Array<number>>(props.selected? props.selected : [])

const computeIndex = computed(() => props.options.map((element, index) => {
    return {
        index: index,
        text: element[0]
    }
}))

const addToSelected = (index: number) => {
    selected.value.push(index)

    if (!props.multiSelect) {
        handelSelection()
    }
}
const handelSelection = () => {
    selected.value.forEach(index => {
        props.options[index][1](index, props.options[index][0])
    });
    emit('close');
    selected.value = []
}
</script>

<template>
    <div :class="{ hidden: !isActive,
        'bg-panel': true,
        'absolut': true,
        'w-auto': true,
        'h-auto': true,
        'p-2': true,
        'z-50': true,
        'border-2': true,
        'border-success': true,
     }">
        <div v-for="element in computeIndex" :key="element.index">
            <button @click="() => (addToSelected(element.index))" class="dropdown-item">{{ element.text }}</button>
        </div>
        <div v-if="multiSelect">
            <button @click="handelSelection()">Ok</button>
        </div>
    </div>
</template>
