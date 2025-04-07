<script setup lang="ts">

import {defineProps, ref, computed} from "vue"

import { MultiSelect, Select, FloatLabel } from 'primevue';
import { useGraphHandler } from "@/composable/Graphs/GraphHandler"

const props = defineProps<{
    graphHandler: ReturnType<typeof useGraphHandler>
    }>()


const computedSelectOptionsCols = computed(() => {
    return props.graphHandler.dataHandler.computeLayoutUnfiltered.value.map((element) => {
            return {"label": element.key}
        })
    })

const computedSelectOptionsCharts = computed(() => {
    return props.graphHandler.chartsOptions.value.map((element) => {
        return {"label": element}
    })
    })


</script>

<template>
    <div class="flex flex-row">
        <h1>{{props.graphHandler.selectedChart}}</h1>
        <FloatLabel class="w-full md:w-80" variant="in">
            <Select
                v-model:model-value="props.graphHandler.selectedChart"
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
                v-model:model-value="props.graphHandler.selectedCols"
                @update:model-value="(newVal)  => {console.log(newVal)}"
                :options="computedSelectOptionsCols"
                optionLabel="label"
                option-value="label" 
                class="w-40"
                overlayClass="SelectColumnsMultiselect"
            />
            <label for="SelectColumnsMultiselect">Select Columns</label>
        </FloatLabel> 
    </div>
</template>

<style scoped>

</style>