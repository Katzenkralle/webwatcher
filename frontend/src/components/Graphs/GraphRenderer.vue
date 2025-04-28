<script setup lang="tsx">
import Chart from 'primevue/chart'
import { type GraphDataSeries } from '@/composable/graphs/GraphDataHandler'
import { computed, ref, watch, type ComputedRef } from 'vue'
import { type flattendJobEnty, useJobDataHandler } from '@/composable/jobs/JobDataHandler'
import { useStatusMessage } from '@/composable/core/AppState'
import { getCssColors } from '@/composable/core/helpers'

const props = defineProps<{
  graphData: GraphDataSeries
  computedDisplayData: ComputedRef<flattendJobEnty[]>
  fetchSpecificData: ReturnType<typeof useJobDataHandler>['retriveRowsById']
}>()

interface ChartDatasets {
  label: string
  data: any[]
  backgroundColor?: string[]
  borderColor?: string[]
}

interface ChartData {
  labels: string[]
  datasets: ChartDatasets[]
}

const chartOptions = {
    scales: {
    x: {
      ticks: {
        color: getCssColors().text,
      },
    },
    y: {
      ticks: {
        color: getCssColors().text,
      },
    },
  },
  plugins: {
    legend: {
      labels: {
        color: getCssColors().text,
      },
    },
    tooltip: {
        titleColor: getCssColors().text,
        bodyColor: getCssColors().text,
        backgroundColor: getCssColors().panel,
        borderColor: getCssColors().info,
        borderWidth: 2,
        titleFont: {
        size: 14,   // Title text size (in px)
        weight: 'bold'
        },
        bodyFont: {
          size: 12,   // Body text size (in px)
        }
      }
  },
    
}

const getRowRange = async (baseRange: number[]): Promise<number[]> => {
  await props
    .fetchSpecificData({
      id:
        !props.graphData.options?.pullAllRows || props.graphData.options?.pullXNewRows !== undefined
          ? baseRange
          : undefined,
      all: props.graphData.options?.pullAllRows && !props.graphData.options?.pullXNewRows,
      newestNRows: props.graphData.options?.pullXNewRows,
    })
    .then((result) => {
      if (result !== 0) {
        useStatusMessage().newStatusMessage(
          `${result} rows for a Graph could not be fetched!`,
          'warn',
        )
      }
    })
  let data = props.graphData.options?.pullAllRows
    ? props.computedDisplayData.value.map((row) => row.id)
    : baseRange
  if (props.graphData.options?.pullXNewRows) {
    data = data.slice(0, props.graphData.options.pullXNewRows)
  }
  data = data.sort((a, b) => a - b)
  return data
}

const adjustForReturnType = (data: number | string | boolean) => {
  if (typeof data === 'string') {
    const asNum = parseFloat(data)
    try {
      if (!isNaN(asNum)) {
        return asNum
      }
    } catch {
      // Ignore error
    }
    return data.length
  }
  return data
}

const getDataRowBased = async (lable: string[], dataLocation: number[]): Promise<ChartData> => {
  const usedDataLocations: number[] = []
  const usedDataLables: string[] = []
  return {
    datasets: await Promise.all(
      lable.map(async (lable) => {
        const dataPoints: any[] = []

        // We can not usee filter/map here, because we need to keep the order of the data
        for (const id of await getRowRange(dataLocation)) {
          const row = props.computedDisplayData.value.find((row) => row.id === id)
          if (row) {
            if (!usedDataLocations.includes(row.id)) {
              usedDataLocations.push(row.id)
              usedDataLables.push(
                row[props.graphData.colUsedAsLabel] ?? String(row.id),
              )
            }
            dataPoints.push(adjustForReturnType(row[lable]))
          }
        }
        return {
          label: lable,
          data: dataPoints,
        }
      }),
    ),
    labels: usedDataLables,
  }
}

const getDataColBased = async (lable: string[], dataLocation: number[]): Promise<ChartData> => {
  const usedRows = await getRowRange(dataLocation)
  return {
    datasets: usedRows.map((rowId) => {
      const  indexOfRow = props.computedDisplayData.value.findIndex((row) => row.id === rowId)
      if (indexOfRow === -1) {
        //  A row could not be found
        return {
          label: String(rowId),
          data: [],
        }
      }
      return {
        label: String(props.computedDisplayData.value[indexOfRow][props.graphData.colUsedAsLabel]),
        data: lable.map((lable) => {
          return adjustForReturnType(props.computedDisplayData.value[indexOfRow][lable])
        }),
      }
    }),
    labels: lable,

  }
}

const computedGraphInputData = computed(async (): Promise<ChartData> => {
  // Force dependency tracking for props.computedDisplayData
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  const _ = props.computedDisplayData.value

  if (props.graphData.data.source === props.graphData.label.source) {
    useStatusMessage().newStatusMessage(
      'Graph data source and label source are the same. Please check your graph input.',
      'warn',
    )
    return {
      datasets: [],
      labels: [],
    }
  }
  if (props.graphData.data.source === 'rowById') {
    return getDataRowBased(props.graphData.label.includes, props.graphData.data.includes)
  } else if (props.graphData.data.source === 'colByName') {
    return getDataColBased(props.graphData.data.includes, props.graphData.label.includes)
  }
  useStatusMessage().newStatusMessage(
    'Unexpected graph data source. Please check your graph input.',
    'danger',
  )
  return {
    datasets: [],
    labels: [],
  }
})

// Create a reactive variable to hold the resolved chart data
const chartData = ref<ChartData>({
  datasets: [],
  labels: [],
})

// Update chartData whenever computedGraphInputData changes
watch(
  computedGraphInputData,
  async () => {
    chartData.value = await computedGraphInputData.value
  },
  { immediate: true },
)
</script>

<template>
  <Chart
    class="max-h-150 min-h-100 w-full flex justify-center items-center text-text"
    :type="props.graphData.displayType as string"
    :data="chartData"
    :options="chartOptions"
  />
</template>
