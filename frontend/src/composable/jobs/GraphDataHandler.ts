import {useJobDataHandler} from '@/composable/jobs/JobDataHandler'
import {computed, ref, watch, type ComputedRef, type Ref} from 'vue'

export interface GraphInput {
    cols: {
      enabled: boolean
      maxSelection: ComputedRef<number> // 0 means unlimited
      allowedTypes: ComputedRef<string[]>
      invalid: ComputedRef<boolean>
      selected: string[]
    },
    rows: {
      enabled: ComputedRef<boolean>
      maxSelection: ComputedRef<number> // 0 means unlimited
      invalid: ComputedRef<boolean>
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
    const graphInput = ref<GraphInput>({
        cols: {
            enabled: false,
            maxSelection: computed(() => 0),
            allowedTypes: computed(() => []),
            invalid: computed(() => true),
            selected: []
        },
        rows: {
            enabled: computed(() => false),
            maxSelection: computed(() => 0),
            invalid: computed(() => true),
            selected: []
        }
    })
    const pullFutureRows = ref(false)
    const pullXNewRows = ref<number>(0) // 0 means all rows
    const availableGraphTypes = ref<string[]>(Object.keys(GraphConstraints))
    const selectedGraphType = ref<string|undefined>()

    watch(selectedGraphType, () => {
        startGraphConstruction()
    })
    // We need to test if this is needed
    //watch(rowBasedView, () => {
    //    startGraphConstruction()
    //})

    const allowedGraphTypes = computed((): string[] => {
        if (!graphInput.value || graphInput.value.cols.selected.length === 0) {
            return []
        }
        const usedRow = jobDataHandler.computeLayoutUnfiltered.value.find((layout) => {
            return layout.key === graphInput.value?.cols.selected[0]
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
        return graphInput.value.cols.selected.length <= 0 
        || graphInput.value.cols.selected.length > maxSelection
    })

    const rowInvalide = computed(() => {
        if (!selectedGraphType.value) return true
        const maxRowsCurentMode = rowBasedView.value 
        ? GraphConstraints[selectedGraphType.value].multiRowView.maxRows
        : GraphConstraints[selectedGraphType.value].singelRowView.maxRows
        const maxSelection = maxRowsCurentMode === 0
            ? Infinity
            : maxRowsCurentMode
        return graphInput.value.rows.selected.length <= 0 
        || graphInput.value.rows.selected.length > maxSelection
    })


    const startGraphConstruction  = () => {
        if(!selectedGraphType.value){
            return
        }
        graphInput.value = {
            cols: {
                enabled: true,
                // this is problematic, but __shold__ nver happen
                maxSelection: computed(() => rowBasedView.value 
                    ? GraphConstraints[selectedGraphType.value?? ''].multiRowView.maxCols
                    : GraphConstraints[selectedGraphType.value?? ''].singelRowView.maxCols),
                allowedTypes: allowedGraphTypes,
                invalid: colsInvalide,
                selected: []
            },
            rows: {
                enabled: computed(() => !pullFutureRows.value),
                maxSelection: computed(() =>rowBasedView.value 
                ? GraphConstraints[selectedGraphType.value??''].multiRowView.maxRows
                : GraphConstraints[selectedGraphType.value??''].singelRowView.maxRows),
                invalid: rowInvalide,
                selected: []
            }
        }
    }
    const reset = () => {
        graphInput.value = {
            cols: {
                enabled: false,
                maxSelection: computed(() => 0),
                allowedTypes: computed(() => []),
                invalid: computed(() => true),
                selected: []
            },
            rows: {
                enabled: computed(() => false),
                maxSelection: computed(() => 0),
                invalid: computed(() => true),
                selected: []
            }
        }
        pullFutureRows.value = false
        pullXNewRows.value = 0
        selectedGraphType.value = undefined
        rowBasedView.value = true
    }

    const curentGraph = computed((): GraphDataSeries | undefined => {
        if(!graphInput.value || graphInput.value.cols.invalid || 
            (graphInput.value.rows.invalid  && !pullFutureRows.value) ){
            return undefined
        }
        const rows: GraphDataSources  = {
            source: "rowById",
            includes: graphInput.value.rows.selected
        }
        const cols:  GraphDataSources = {
            source:  "colByName",
            includes: graphInput.value.cols.selected
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
