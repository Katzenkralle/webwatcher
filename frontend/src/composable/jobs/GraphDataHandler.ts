import {useJobDataHandler} from '@/composable/jobs/JobDataHandler'
import {computed, ref, watch, type ComputedRef, type Ref} from 'vue'

export interface GraphInput {
    cols: {
      enabled: boolean
      maxSelection: number // 0 means unlimited
      allowedTypes: ComputedRef<string[]>
      invalid: ComputedRef<boolean>
      selected: string[]
    },
    rows: {
      enabled: boolean
      maxSelection: number // 0 means unlimited
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

export const GraphConstraints: GraphType = {
    pie: {
        multiRowView: {
            maxCols: 1,
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
            maxRows: 1
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
    const multiRowView = ref(true) // ture: looks At multiple rows, false: looks at one row
    const graphInput = ref<GraphInput>({
        cols: {
            enabled: false,
            maxSelection: 0,
            allowedTypes: computed(() => []),
            invalid: computed(() => true),
            selected: []
        },
        rows: {
            enabled: false,
            maxSelection: 0,
            invalid: computed(() => true),
            selected: []
        }
    })
    const availableGraphTypes = ref<string[]>(Object.keys(GraphConstraints))
    const selectedGraphType = ref<string|undefined>()

    watch(selectedGraphType, (newValue) => {
        startGraphConstruction()
    })

    watch(multiRowView, (newValue) => {
        startGraphConstruction()
    })

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
        const maxColsCurentMode = multiRowView.value 
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
        const maxRowsCurentMode = multiRowView.value 
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
                maxSelection: multiRowView.value 
                    ? GraphConstraints[selectedGraphType.value].multiRowView.maxCols
                    : GraphConstraints[selectedGraphType.value].singelRowView.maxCols,
                allowedTypes: allowedGraphTypes,
                invalid: colsInvalide,
                selected: []
            },
            rows: {
                enabled: true,
                maxSelection: multiRowView.value 
                ? GraphConstraints[selectedGraphType.value].multiRowView.maxRows
                : GraphConstraints[selectedGraphType.value].singelRowView.maxRows,
                invalid: rowInvalide,
                selected: []
            }
        }
    }
    const reset = () => {
        graphInput.value = {
            cols: {
                enabled: false,
                maxSelection: 0,
                allowedTypes: computed(() => []),
                invalid: computed(() => true),
                selected: []
            },
            rows: {
                enabled: false,
                maxSelection: 0,
                invalid: computed(() => true),
                selected: []
            }
        }
        selectedGraphType.value = undefined
        multiRowView.value = true
    }

    const curentGraph = computed((): GraphDataSeries | undefined => {
        if(!graphInput.value || graphInput.value.cols.invalid || graphInput.value.rows.invalid){
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

        return multiRowView.value
        ? {
            displayType: selectedGraphType.value as string,
            label: cols,
            data: rows 
        }
        : {
            displayType: selectedGraphType.value as string,
            label: rows,
            data: cols,
        }
    })

    return{
        jobId: jobDataHandler.jobId,
        multiRowView,
        graphInput,
        availableGraphTypes,
        selectedGraphType,
        curentGraph,
        reset,
    }

} 
