import {useJobDataHandler} from '@/composable/jobs/JobDataHandler'
import {computed, reactive, ref, watch, type ComputedRef, type Reactive} from 'vue'

export interface GraphInput {
    cols: {
      enabled: boolean
      maxSelection: number // 0 means unlimited
      allowedTypes: string[]
      invalid: boolean
      selected: string[]
    },
    rows: {
      enabled: boolean
      maxSelection: number // 0 means unlimited
      invalid: boolean
      selected: number[]
    }
  }

export interface GraphDataSources {
    source: 'rowById'|'colByName'
    includes: any[]
}

export interface GraphDataSeries {
    displayType: keyof typeof GraphConstraints;
    label: GraphDataSources;
    data: GraphDataSources;
    options?: {
        pullAllRows: boolean
        pullXNewRows?: number
    }
}



interface GraphType {
    [graphType: string]: {
        multiRowView: {
            maxCols: number
            maxRows: number
        },
        singelRowView: {
            maxCols: number
            maxRows: number
        }
    }
}

// ToDo: remove or change this arbitrary values
export const GraphConstraints: GraphType = {
    pie: {
        multiRowView: {
            maxCols: 0,
            maxRows: 0
        },
        singelRowView: {
            maxCols: 0,
            maxRows: 0
        }
    },
    line: {
        multiRowView: {
            maxCols: 0,
            maxRows: 0
        },
        singelRowView: {
            maxCols: 0,
            maxRows: 0
        }
    },
    bar: {
        multiRowView: {
            maxCols: 0,
            maxRows: 0
        },
        singelRowView: {
            maxCols: 0,
            maxRows: 0
        }
    }
} as const


export const useGraphConstructor = (jobDataHandler: ReturnType<typeof  useJobDataHandler>) => {
    const rowBasedView = ref(true) // ture: looks At multiple rows, false: looks at one row
    const graphInput = reactive<GraphInput>({
        cols: {
            enabled: false,
            maxSelection: 0,
            allowedTypes: [],
            invalid: true,
            selected: []
        },
        rows: {
            enabled: false,
            maxSelection: 0,
            invalid: true,
            selected: []
        }
    })
    const pullFutureRows = ref(false)
    const pullXNewRows = ref<number>(0) // 0 means all rows
    const availableGraphTypes = ref<string[]>(Object.keys(GraphConstraints))
    const selectedGraphType = ref<string|undefined>()

    watch(selectedGraphType, () => {
        if (!selectedGraphType.value){
            graphInput.cols.enabled = false
            graphInput.rows.enabled = false

        }  else {
        graphInput.cols.enabled = true
        graphInput.rows.enabled = true
        }
    })
    // We need to test if this is needed
    watch(rowBasedView, () => {
        if (!selectedGraphType.value) return
        const curenntCols = graphInput.cols.selected
        const curenntRows = graphInput.rows.selected    
        if (GraphConstraints[selectedGraphType.value].multiRowView.maxCols !== 0 
            && curenntCols.length > GraphConstraints[selectedGraphType.value].multiRowView.maxCols) {
            graphInput.cols.selected = []
        }
        if (GraphConstraints[selectedGraphType.value].multiRowView.maxRows !== 0 
            && curenntRows.length > GraphConstraints[selectedGraphType.value].multiRowView.maxRows) {
            graphInput.rows.selected = []
        }
    })

    const allowedGraphTypes = computed((): string[] => {
        if (!graphInput || graphInput.cols.selected.length === 0) {
            return []
        }
        const usedRow = jobDataHandler.computeLayoutUnfiltered.value.find((layout) => {
            return layout.key === graphInput?.cols.selected[0]
        })?.type

        if (!usedRow) {
            return []
        }
        return [usedRow]
    })

    const colsInvalide = computed(() => {
        if (!selectedGraphType.value) return true
        const maxColsCurentMode = rowBasedView.value 
        ? GraphConstraints[selectedGraphType.value].multiRowView.maxCols
        : GraphConstraints[selectedGraphType.value].singelRowView.maxCols
        const maxSelection = maxColsCurentMode === 0
            ? Infinity
            : maxColsCurentMode
        return graphInput.cols.selected.length <= 0 
        || graphInput.cols.selected.length > maxSelection
    })

    const rowInvalide = computed(() => {
        if (!selectedGraphType.value) return true
        const maxRowsCurentMode = rowBasedView.value 
        ? GraphConstraints[selectedGraphType.value].multiRowView.maxRows
        : GraphConstraints[selectedGraphType.value].singelRowView.maxRows
        const maxSelection = maxRowsCurentMode === 0
            ? Infinity
            : maxRowsCurentMode
        return graphInput.rows.selected.length <= 0 
        || graphInput.rows.selected.length > maxSelection
    })


    const reset = () => {
        graphInput.cols = {
                enabled: false,
                maxSelection:  0,
                allowedTypes: [],
                invalid: true,
                selected: []
            }

        graphInput.rows = {
                enabled: false,
                maxSelection: 0,
                invalid:  true,
                selected: []
        }
        pullFutureRows.value = false
        pullXNewRows.value = 0
        selectedGraphType.value = undefined
        rowBasedView.value = true
    }

    const curentGraph = computed((): GraphDataSeries | undefined => {
        if(!graphInput || graphInput.cols.invalid || 
            (graphInput.rows.invalid  && !pullFutureRows.value) ){
            return undefined
        }
        const rows: GraphDataSources  = {
            source: "rowById",
            includes: graphInput.rows.selected
        }
        const cols:  GraphDataSources = {
            source:  "colByName",
            includes: graphInput.cols.selected
        }
        const additionaOptions ={
            displayType: selectedGraphType.value as string,
            options: {
                pullAllRows: pullFutureRows.value,
                pullXNewRows: pullXNewRows.value
            }
        }
        return rowBasedView.value
        ? {
            ...additionaOptions,
            label: cols,
            data: rows 
        }
        : {
            ...additionaOptions,
            label: rows,
            data: cols,
        }
    })

    return{
        jobId: jobDataHandler.jobId,
        rowBasedView,
        pullFutureRows,
        pullXNewRows,
        graphInput,
        availableGraphTypes,
        selectedGraphType,
        curentGraph,
        reset,
    }

} 
