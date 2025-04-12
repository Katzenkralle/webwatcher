<script setup lang="tsx">
import Chart from 'primevue/chart';
import { type GraphDataSeries, type GraphDataSources } from '@/composable/jobs/GraphDataHandler';
import { computed, ref, watch, type ComputedRef } from 'vue';
import { type flattendJobEnty, useJobDataHandler } from '@/composable/jobs/JobDataHandler';
import { useStatusMessage } from '@/composable/core/AppState';

const props = defineProps<{
    graphData: GraphDataSeries;
    computedDisplayData: ComputedRef<flattendJobEnty[]>;
    fetchSpecificData: ReturnType<typeof useJobDataHandler>['retriveRowsById'];
}>();

interface ChartDatasets {
    label: string;
    data: any[];
    backgroundColor?: string[];
    borderColor?: string[];
}


interface ChartData {
    labels: string[];
    datasets: ChartDatasets[];
}
const getRowRange = async(baseRange: number[]):  Promise<number[]> => {
    console.log(props.graphData.options)
    await props.fetchSpecificData({
        id: !props.graphData.options?.pullAllRows || props.graphData.options?.pullXNewRows !== undefined 
            ? baseRange : undefined,
        all: props.graphData.options?.pullAllRows && !props.graphData.options?.pullXNewRows, 
        newestNRows: props.graphData.options?.pullXNewRows  
    }).then((result) => {
        if (result!== 0){
            useStatusMessage().newStatusMessage(
                `${result} rows for a Graph could not be fetched!`,
                'warn'
            )
        }
    })
    let data = props.graphData.options?.pullAllRows ?
            props.computedDisplayData.value.map((row) => row.id)
            : baseRange
    if (props.graphData.options?.pullXNewRows) {
        data.sort((a, b) => b - a);
        data = data.slice(0, props.graphData.options.pullXNewRows).reverse();;
    }
    return data
}

const getDataRowBased = async(lable: string[], dataLocation: number[]): Promise<ChartData> => {
    let usedDataLocations:number[] = [];
    return {
        datasets: await Promise.all(lable.map(async(lable) => {
            const dataPoints: any[] = [];
            
            // We can not usee filter/map here, because we need to keep the order of the data
            for (const id of await getRowRange(dataLocation)) {
                const row = props.computedDisplayData.value.find(row => row.id === id);
                if (row) {
                    if (!usedDataLocations.includes(row.id)) {
                        usedDataLocations.push(row.id);
                    }
                    dataPoints.push(row[lable]);
                }
            }
            
            return {
                label: lable,
                data: dataPoints
            }
        })),
        labels: usedDataLocations.map((entry) =>  String(entry))
    }
}

const getDataColBased = async (lable: string[], dataLocation: number[]): Promise<ChartData> => {
    const usedRows = await getRowRange(dataLocation);
    return {
        datasets: usedRows.map((rowId) => {
            if(!props.computedDisplayData.value[rowId]){
                //  A row could not be found
                return {
                    label: String(rowId),
                    data: []
                }
            }
            return {
                label: String(rowId),
                data: lable.map((lable) => {
                    return props.computedDisplayData.value[rowId][lable]
                })
            }
        }),
        labels: lable
    }
}


const computedGraphInputData = computed(async(): Promise<ChartData> => {
    if (props.graphData.data.source  ===  props.graphData.label.source){
        useStatusMessage().newStatusMessage(
            'Graph data source and label source are the same. Please check your graph input.',
            'warn'
        )
        return {
            datasets: [],
            labels: []
        }
    }
    if (props.graphData.data.source === "rowById"){
        console.log('rowById')
        return getDataRowBased(props.graphData.label.includes, props.graphData.data.includes)

    } else if (props.graphData.data.source === "colByName"){
        console.log('colByName')
        return getDataColBased(props.graphData.data.includes,  props.graphData.label.includes)
    }
    useStatusMessage().newStatusMessage(
            'Unexpected graph data source. Please check your graph input.',
            'danger'
        )
    return {
            datasets: [],
            labels: []
        }
})

// Create a reactive variable to hold the resolved chart data
const chartData = ref<ChartData>({
    datasets: [],
    labels: []
});

// Update chartData whenever computedGraphInputData changes
watch(computedGraphInputData, async () => {
    chartData.value = await computedGraphInputData.value;
}, { immediate: true });
</script>

<template>    
    <Chart
        :type="props.graphData.displayType as string"
        :data="chartData"/>
</template>