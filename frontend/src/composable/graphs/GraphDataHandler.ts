import { useJobDataHandler } from '@/composable/jobs/JobDataHandler'
import { computed, reactive, ref, watch } from 'vue'

export interface GraphInput {
  cols: {
    enabled: boolean
    maxSelection: number // 0 means unlimited
    allowedTypes: string[]
    invalid: boolean
    selected: string[]
  }
  rows: {
    enabled: boolean
    maxSelection: number // 0 means unlimited
    invalid: boolean
    selected: number[]
  }
}

export interface GraphDataSources {
  source: 'rowById' | 'colByName'
  includes: any[]
}

export interface GraphDataSeries {
  displayType: keyof typeof GraphConstraints
  label: GraphDataSources
  data: GraphDataSources
  options?: {
    pullAllRows: boolean
    pullXNewRows?: number
  },
  colUsedAsLabel: string
}

interface GraphType {
  [graphType: string]: {
    multiRowView: {
      max: {
        cols: 0
        rows: 0
      }
    }
    singelRowView: {
      max: {
        cols: 0
        rows: 0
      }
    }
  }
}

// ToDo: remove or change this arbitrary values
export const GraphConstraints: GraphType = {
  pie: {
    multiRowView: {
      max: {
        cols: 0,
        rows: 0,
      },
    },
    singelRowView: {
      max: {
        cols: 0,
        rows: 0,
      },
    },
  },
  line: {
    multiRowView: {
      max: {
        cols: 0,
        rows: 0,
      },
    },
    singelRowView: {
      max: {
        cols: 0,
        rows: 0,
      },
    },
  },
  bar: {
    multiRowView: {
      max: {
        cols: 0,
        rows: 0,
      },
    },
    singelRowView: {
      max: {
        cols: 0,
        rows: 0,
      },
    },
  },
} as const

export const useGraphConstructor = (jobDataHandler: ReturnType<typeof useJobDataHandler>) => {
  const rowBasedView = ref(true) // ture: looks At multiple rows, false: looks at one row
  const graphInput = reactive<GraphInput>({
    cols: {
      enabled: false,
      maxSelection: 0,
      allowedTypes: [],
      invalid: true,
      selected: [],
    },
    rows: {
      enabled: false,
      maxSelection: 0,
      invalid: true,
      selected: [],
    },
  })
  const pullFutureRows = ref(false)
  const pullXNewRows = ref<number>(0) // 0 means all rows
  const availableGraphTypes = ref<string[]>(Object.keys(GraphConstraints))
  const selectedGraphType = ref<string | undefined>()
  const colUsedAsLabel = ref<string>('id')

  watch(selectedGraphType, () => {
    if (!selectedGraphType.value) {
      graphInput.cols.enabled = false
      graphInput.rows.enabled = false
    } else {
      graphInput.cols.enabled = true
      graphInput.rows.enabled = !pullFutureRows.value
    }
  })

  const checkInvalid = (targer: 'cols' | 'rows'): boolean => {
    if (!selectedGraphType.value) return true
    const maxColsCurentMode = rowBasedView.value
      ? GraphConstraints[selectedGraphType.value].multiRowView.max[targer]
      : GraphConstraints[selectedGraphType.value].singelRowView.max[targer]
    const maxSelection = maxColsCurentMode === 0 ? Infinity : maxColsCurentMode
    return (
      graphInput[targer].selected.length <= 0 || graphInput[targer].selected.length > maxSelection
    )
  }

  const setAllowedTypes = () => {
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
  }

  // We need to test if this is needed
  watch(rowBasedView, () => {
    if (!selectedGraphType.value) return
    const curenntCols = graphInput.cols.selected
    const curenntRows = graphInput.rows.selected
    if (
      GraphConstraints[selectedGraphType.value].multiRowView.max.cols !== 0 &&
      curenntCols.length > GraphConstraints[selectedGraphType.value].multiRowView.max.cols
    ) {
      graphInput.cols.selected = []
    }
    if (
      GraphConstraints[selectedGraphType.value].multiRowView.max.rows !== 0 &&
      curenntRows.length > GraphConstraints[selectedGraphType.value].multiRowView.max.rows
    ) {
      graphInput.rows.selected = []
    }
  })

  watch(
    () => pullFutureRows.value,
    (newValue) => {
      if (newValue) {
        graphInput.rows.enabled = false
      } else if (graphInput.cols.enabled) {
        graphInput.rows.enabled = true
      }
    },
  )

  watch(
    () => [graphInput.cols.selected, graphInput.rows.selected],
    ([newCols, newRows]) => {
      if (newCols) {
        graphInput.cols.invalid = checkInvalid('cols')
        graphInput.cols.allowedTypes = setAllowedTypes()
      }
      if (newRows) {
        graphInput.rows.invalid = checkInvalid('rows')
      }
    },
  )

  const reset = () => {
    graphInput.cols = {
      enabled: false,
      maxSelection: 0,
      allowedTypes: [],
      invalid: true,
      selected: [],
    }

    graphInput.rows = {
      enabled: false,
      maxSelection: 0,
      invalid: true,
      selected: [],
    }
    colUsedAsLabel.value = ''
    pullFutureRows.value = false
    pullXNewRows.value = 0
    selectedGraphType.value = undefined
    rowBasedView.value = true
  }

  const curentGraph = computed((): GraphDataSeries | undefined => {
    if (
      !graphInput ||
      graphInput.cols.invalid ||
      (graphInput.rows.invalid && !pullFutureRows.value)
    ) {
      return undefined
    }
    const rows: GraphDataSources = {
      source: 'rowById',
      includes: graphInput.rows.selected,
    }
    const cols: GraphDataSources = {
      source: 'colByName',
      includes: graphInput.cols.selected,
    }
    const additionaOptions = {
      displayType: selectedGraphType.value as string,
      options: {
        pullAllRows: pullFutureRows.value,
        pullXNewRows: pullXNewRows.value,
      },
      colUsedAsLabel: colUsedAsLabel.value,
    }
    return rowBasedView.value
      ? {
          ...additionaOptions,
          label: cols,
          data: rows,
        }
      : {
          ...additionaOptions,
          label: rows,
          data: cols,
        }
  })

  return {
    jobId: jobDataHandler.jobId,
    rowBasedView,
    colUsedAsLabel,
    pullFutureRows,
    pullXNewRows,
    graphInput,
    availableGraphTypes,
    selectedGraphType,
    curentGraph,
    reset,
  }
}
