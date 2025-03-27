<script setup lang="ts">
import { useGraphHandler } from "@/composable/Graphs/GraphHandler"

import {defineProps, ref, computed} from "vue"
import Chart from "primevue/chart";
import GraphSelector from "./GraphSelector.vue";

const props = defineProps<{
    jobId: number
    }>()

const selectedCols = ref([])    
const selectedRows = ref([]) 
const selectedChart = ref<string[]>([])

const graphHandler = useGraphHandler(props.jobId,ref("row"), selectedCols, selectedRows, selectedChart)

const computedChart = computed(() => {
    return GraphSelector.selectedChart.value
})

const computedChartLabel = computed(() => {
    return graphHandler.reformData.value.label
})

const computedChartData = computed(() => {
    return graphHandler.reformData.value.dataList
})

const setChartData = computed(() => {
    //for element in Data, push {labels: , datasests: {data}} #TODO
    return {
        labels: computedChartLabel.value,
        datasets: [
            {
                data: computedChartData.value
            }
        ]
    };
})

const selectChart = computedChart.value // #TODO
const chartData = setChartData.value
const chartOptions = ref({plugins: {legend: {labels: {cutout: '60%'}}}
    })

</script>

<template>
    <div class="card">
        <Chart type="selectChart" :data="chartData" :options="chartOptions" class="h-[30rem]"  />
    </div>
</template>

<style scoped>

</style>