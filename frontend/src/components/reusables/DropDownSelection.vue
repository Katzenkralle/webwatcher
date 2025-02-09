<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits, type Ref } from 'vue'

const props = defineProps<{ 
    options: Array<[string, (arg0: number, arg1: any) => null, any]>,
    multiSelect: boolean,
    selected?: Array<number>,
    isActive: boolean
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
        props.options[index][1](index, props.options[index][2])
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
        'z-50': true,
        'border-x-2': true,
        'border-b-2': true,
        'border-info': true,
     }">
     <div class="flex flex-col w-full h-full">
        <template v-for="element in computeIndex" :key="element.index">
            <button class="border-b-2 border-dashed border-b-[transparent] hover:border-success selectable
                    dropdown-item align-middle min-h-8 py-2"
                @click="() => (addToSelected(element.index))">{{ element.text }}</button>
        </template>
    </div>
        <div v-if="multiSelect">
            <button @click="handelSelection()">Ok</button>
        </div>
    </div>
</template>
