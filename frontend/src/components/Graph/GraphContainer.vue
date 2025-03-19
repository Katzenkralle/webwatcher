<script setup lang="ts">
import { useGraphHandler } from "@/composable/Graphs/GraphHandler"
import {defineProps, ref, computed} from "vue"

import { MultiSelect } from 'primevue';

const props = defineProps<{
    jobId: number
    }>()

const selectedCols = ref([])    
const selectedRows = ref([])    



const graphHandler = useGraphHandler(props.jobId, selectedCols, selectedRows)
console.log(graphHandler.dataHandler.computeLayoutUnfiltered.value)

const computedSelectOptionsCols = computed(() => {
    console.log(graphHandler.dataHandler.computeLayoutUnfiltered.value)
    return graphHandler.dataHandler.computeLayoutUnfiltered.value.map((element) => {
            return {"label": element.key}
        })
    })

const computedSelectOptionsChart = computed(() => {
    return 
    
    })


</script>

<template>
    <h1>TEST</h1>
    <MultiSelect 
        v-model:model-value="selectedCols"
        @update:model-value="(newVal) => {console.log(newVal)}"
        :options="computedSelectOptionsCols"
        optionLabel="Select Cols"
        option-value="label" 
    />
    <MultiSelect
        v-model:model-value="selectedChart"
        @update:model-value=""
        :options="computedSelectOptionsChart"
        optionLabel="Seleced Chart"
        option-value="label" 
        :maxSelectedLabels="1"
        :showSelectAll="false"

    />
</template>

<style scoped>

</style>