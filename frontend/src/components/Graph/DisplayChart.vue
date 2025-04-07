<script setup lang="ts">

import Chart from 'primevue/chart';
import GraphSelector from "./GraphSelector.vue";
import {defineProps, ref, computed} from "vue"
import { useGraphHandler } from "@/composable/Graphs/GraphHandler"

const props = defineProps<{
    graphHandler: ReturnType<typeof useGraphHandler>
    }>()

const labels = ['A', 'B', 'C'];
const data = [200, 500, 400]

const chartData = {
  labels: labels,
  datasets: [
    {
      data: data,
    },
  ],
};

const chartType = computed(() =>
    props.graphHandler.selectedChart.value[0]
)

</script>

<template>
    <div>
        <h1>{{ chartType }}</h1>

        <Chart 
            v-if="chartType"
            :type="chartType" 
            :data="chartData" 
            class="h-[30rem]" 
            />
        
    </div>
</template>

