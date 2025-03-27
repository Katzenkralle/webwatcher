<script setup lang="ts">
import { useGraphHandler } from "@/composable/Graphs/GraphHandler"
import {defineProps, ref, computed} from "vue"

import { MultiSelect, Select, FloatLabel } from 'primevue';

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
    <div class="flex flex-row">
        <FloatLabel class="w-full md:w-80" variant="in">
            <Select
                v-model:model-value="selectedChart"
                @update:model-value="(newVal) => {console.log(newVal)}"
                :options="computedSelectOptionsCharts"
                optionLabel="label"
                option-value="label"
                overlay-class="SelectChart"
                class="w-40"
            />
            <label for="SelectChart">Select Chart</label>
        </FloatLabel>
        <FloatLabel class="w-full md:w-80" variant="in">
            <MultiSelect 
                v-model:model-value="selectedCols"
                @update:model-value="(newVal)  => {console.log(newVal)}"
                :options="computedSelectOptionsCols"
                optionLabel="label"
                option-value="label" 
                size="small"
                class="w-40"
                overlayClass="SelectColumnsMultiselect"
            />
            <label for="SelectColumnsMultiselect">Select Columns</label>
        </FloatLabel> 
    </div>
</template>

<style scoped>

</style>