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

interface GraphDataSources {
    source: 'rowById'|'colByName'
    includes: any[]
}

interface GraphDataSeries {
    label: GraphDataSources;
    data: GraphDataSources;
}



interface GraphType {
    [graphType: string]: {
        multiRowView: {
            maxCols: number
        },
        singelRowView: {
            maxCols: number
        }
    }
}

export const GraphConstraints: GraphType = {
    pi: {
        multiRowView: {
            maxCols: 1
        },
        singelRowView: {
            maxCols: 0
        }
    },
    multiline: {
        multiRowView: {
            maxCols: 0
        },
        singelRowView: {
            maxCols: 0
        }
    },
    vbar: {
        multiRowView: {
            maxCols: 0
        },
        singelRowView: {
            maxCols: 0
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

        console.log("usedRow", usedRow)
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
        console.log("maxSelection", maxSelection)
        return graphInput.value.cols.selected.length <= 0 
        || graphInput.value.cols.selected.length > maxSelection
    })

    const rowInvalide = computed(() => {
        return graphInput.value.rows.selected.length <= 0 
        || (!multiRowView.value && graphInput.value.rows.selected.length > 1)
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
                maxSelection: multiRowView.value ? 0 : 1,
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

    const getGraph = ():GraphDataSeries =>{
        if(!graphInput.value || graphInput.value.cols.invalid || graphInput.value.rows.invalid){
            throw "Input is still invalide"
        }
        const rows: GraphDataSources  = {
            source: "rowById",
            includes: graphInput.value.rows.selected
        }
        const cols:  GraphDataSources = {
            source:  "colByName",
            includes: graphInput.value.cols.selected
        }
        if(multiRowView){
            return {
                label: cols,
                data: rows 
            }
        }  else {
            return {
                label: rows,
                data: cols,
            }
        }
    }

    return{
        jobId: jobDataHandler.jobId,
        multiRowView,
        graphInput,
        availableGraphTypes,
        selectedGraphType,
        getGraph,
        reset,
    }

} 