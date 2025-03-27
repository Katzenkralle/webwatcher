<script setup lang="ts">
import { useGraphHandler } from "@/composable/Graphs/GraphHandler"
import {defineProps, ref, computed} from "vue"

import { MultiSelect, Select } from 'primevue';

const props = defineProps<{
    jobId: number
    }>()

const selectedCols = ref([])    
const selectedRows = ref([]) 
const selectedChart = ref<string[]>([])



const graphHandler = useGraphHandler(props.jobId,ref("row"), selectedCols, selectedRows, selectedChart)

const computedSelectOptionsCols = computed(() => {
    return graphHandler.dataHandler.computeLayoutUnfiltered.value.map((element) => {
            return {"label": element.key}
        })
    })

const computedSelectOptionsCharts = computed(() => {
    return graphHandler.chartsOptions.value.map((element) => {
        return {"label": element}
    })
    })



</script>

<template>
    <h1>TEST</h1>
    <MultiSelect 
        v-model:model-value="selectedCols"
        @update:model-value="(newVal)  => {console.log(newVal)}"
        :options="computedSelectOptionsCols"
        optionLabel="label"
        option-value="label" 
    />
    
    <Select
        v-model:model-value="selectedChart"
        @update:model-value="(newVal) => {console.log(newVal)}"
        :options="computedSelectOptionsCharts"
        optionLabel="label"
        option-value="label"
    />
   

   
    
</template>

<style scoped>

</style>