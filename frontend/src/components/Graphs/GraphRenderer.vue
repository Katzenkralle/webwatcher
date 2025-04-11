<script setup lang="tsx">
import Chart from 'primevue/chart';
import { type GraphDataSeries, type GraphDataSources } from '@/composable/jobs/GraphDataHandler';
import { computed, ref, type ComputedRef } from 'vue';
import { type flattendJobEnty } from '@/composable/jobs/JobDataHandler';
import { useStatusMessage } from '@/composable/core/AppState';

const props = defineProps<{
    graphData: GraphDataSeries;
    computedDisplayData: ComputedRef<flattendJobEnty[]>
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
const getRowRange = (baseRange: number[]):  number[] => {
    let data = props.graphData.options?.pullAllRows ?
            props.computedDisplayData.value.map((row) => row.id)
            : baseRange
    if (props.graphData.options?.pullXNewRows) {
        data.sort((a, b) => b - a);
        data = data.slice(0, props.graphData.options.pullXNewRows).reverse();;
    }
    return data
}

const getDataRowBased = (lable: string[], dataLocation: number[]): ChartData => {
    let usedDataLocations:number[] = [];
    return {
        datasets: lable.map((lable) => {
            const dataPoints: any[] = [];
            
            // We can not usee filter/map here, because we need to keep the order of the data
            for (const id of getRowRange(dataLocation)) {
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
        }),
        labels: usedDataLocations.map((entry) =>  String(entry))
    }
}

const getDataColBased = (lable: string[], dataLocation: number[]): ChartData => {
    const usedRows = getRowRange(dataLocation);
    return {
        datasets: usedRows.map((rowId) => {
            if(!props.computedDisplayData.value[rowId]){
                useStatusMessage().newStatusMessage(
                    `Row with id ${rowId} not found in data. Please check your graph input.`,
                    'warn'
                )
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


const computedGraphInputData = computed((): ChartData => {
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

</script>

<template>

    <div>
        <Chart
            :type="props.graphData.displayType as string"
            
            :data="computedGraphInputData"
        ></Chart>

    </div>

</template>