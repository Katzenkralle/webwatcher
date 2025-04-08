import {useJobDataHandler} from '@/composable/jobs/JobDataHandler'
import {computed, ref, watch} from 'vue'

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

const Graphs: GraphType = {
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
}


export const GraphConstructor = (jobDataHandler: ReturnType<typeof  useJobDataHandler>) => {
    const multiRowView = ref(true) // ture: looks At multiple rows, false: looks at one row
    const graphInput = ref<GraphInput|undefined>(undefined)

    const availableGraphTypes = ref<string[]>(Object.keys(Graphs))
    const selectedGraphType = ref<string>(Object.keys(Graphs)[0])

    watch(selectedGraphType, (newValue) => {
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
        if(!graphInput.value) return true
        return graphInput.value.cols.selected.length < 0 
        || graphInput.value.cols.selected.length > graphInput.value.cols.maxSelection
    })
    const rowInvalide = computed(() => {
        if(!graphInput.value) return true
        return graphInput.value.cols.selected.length < 0 
        || graphInput.value.cols.selected.length > graphInput.value.cols.maxSelection
    })


    const startGraphConstruction  = () => {
        graphInput.value ={
            cols: {
                enabled: true,
                maxSelection: Graphs[selectedGraphType.value].multiRowView.maxCols,
                allowedTypes: allowedGraphTypes.value,
                invalid: colsInvalide.value,
                selected: []
            },
            rows: {
                enabled: true,
                maxSelection: 0,
                invalid: rowInvalide.value,
                selected: []
            }
        }
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
        multiRowView,
        graphInput,
        availableGraphTypes,
        selectedGraphType,
    }

} 