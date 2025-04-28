import { ref, computed, type Ref, type ComputedRef, watch, watchEffect } from 'vue'
import {
  useJobData,
  DUMMY_JOB_ENTRY,
  type jobEnty,
  type jobEntryInput,
} from '@/composable/jobs/JobAPI'

import { getJobMetaData, type TableLayout, type JobMeta } from '@/composable/jobs/JobMetaAPI'

import { reportError } from '@/composable/api/QueryHandler'
import type { IterationContext } from '../filter/FilterGroups'
import { useStatusMessage } from '../core/AppState'
import { useFilterIterationContext } from '@/composable/filter/FilterGroups'

import { sortByStr, type sortByString, type HighlightSubstring } from './SortByString'
/*
global: refers to local data accessible from all components
local: referce to data tat is shared by one use instance
displayed: referse to data that is displayed in the frontend, is a subset of the data
remote: referse to data on the server
*/

const globalJobData: Record<number, Ref<Record<number, jobEnty>>> = {}

export interface flattendJobEnty {
  [key: string]: any
}


function convertPyTypes(type: string): string {
  // Converts python types to js types
  switch (type) {
    case 'int':
      return 'number'
    case 'float':
      return 'number'
    case 'str':
      return 'string'
    case 'bool':
      return 'boolean'
    case 'list':
      return 'array'
    case 'dict':
      return 'object'
    default:
      return type
  }
}

export const useJobDataHandler = (
  jobId: number,
  fetchAmount: Ref<number> | ComputedRef<number>,
  sortByString: ComputedRef<sortByString> | undefined = undefined, // [key, [columns_NOT_to_sort_by]]
  filters: IterationContext | undefined = undefined,
  staticContextSchema: ComputedRef<Record<string, string> | undefined>,
) => {
  if (globalJobData[jobId] === undefined) {
    globalJobData[jobId] = ref([])
  }
  const localJobData: Ref<Record<number, jobEnty>> = globalJobData[jobId]
  const apiHandler = useJobData(jobId)
  const allFetched = ref(false)
  const highlightSubstring = ref<Record<number, Record<string, HighlightSubstring[]>>>({})

  let isFetching: boolean = false

  const lazyFetch = async (
    startAt: number | undefined = undefined,
    all: boolean = false,
    force: boolean = false,
  ) => {
    startAt = startAt || Object.keys(localJobData.value).length
    if (
      force ||
      (Object.keys(localJobData.value).length < startAt + fetchAmount.value && !allFetched.value)
    ) {
      isFetching = true
      localJobData.value = {
        ...localJobData.value,
        ...(await apiHandler
          .fetchData(!all ? [startAt, startAt + fetchAmount.value] : undefined)
          .then((data) => {
            if (Object.keys(data).length < fetchAmount.value) {
              allFetched.value = true
            }
            return data
          })
          .catch((e) => {
            console.error(e)
            reportError(e)
            allFetched.value = true
            return {}
          })
          .finally(() => {
            isFetching = false
          })),
      }
    }
    if (all) {
      useStatusMessage().newStatusMessage('All data fetched', 'success')
      allFetched.value = true
    }
  }

  /*
  const lazyFetch = async (...args: [
    startAt?: number | undefined,
    all?: boolean,
    force?: boolean
  ]) => {
    if (asyncFetchRef) {
      return asyncFetchRef
    }
    asyncFetchRef = lazyFetchExecutor(...args)
    return asyncFetchRef
  }
   */

  const retriveRowsById = async (options: {
    id?: number[]
    all?: boolean
    newestNRows?: number
  }): Promise<number> => {
    // Returns number of unresolved entrys

    let rowsToFetch: number = (function () {
      if (options.id && options.id.length) {
        return options.id.reduce((acc: number, curr: number) => {
          if (localJobData.value[curr] === undefined) {
            return acc + 1
          }
          options.id = options.id!.filter((id) => id !== curr)
          return acc
        }, 0)
      }
      if (options.all) {
        return Infinity
      }
      if (options.newestNRows) {
        return options.newestNRows
      }
      return 0
    })()

    const fetchFromRemote = async () => {
      return apiHandler
      .fetchData(undefined, options.id, options.newestNRows)
      .then((data) => {
        const currentKeys = Object.keys(localJobData.value)
        data = Object.keys(data)
          .filter((key) => !currentKeys.includes(key))
          .reduce((acc: Record<number, jobEnty>, key) => {
            const index = parseInt(key)
            acc[index] = data[index]
            return acc
          }, {})
        if (options.id) {
          rowsToFetch =
            options.id.reduce((acc: number, curr: number) => {
              if (data[curr] === undefined) {
                acc++
              }
              return acc
            }, 0) + Object.keys(data).length // + object length, because we subtract it in the return
        }
        if (Object.keys(data).length === 0) {
          return 0
        }
        localJobData.value = {
          ...localJobData.value,
          ...data,
        }
        if (rowsToFetch === Infinity) {
          return 0
        }
        return Math.max(0, rowsToFetch - Object.keys(data).length)
      })
      .catch((e) => {
        reportError(e)
        return rowsToFetch
      })
      }

    if (rowsToFetch === 0 || allFetched.value) {
        return 0
    }
    
    // Wait until the current fetch operation completes
    return new Promise<number>((resolve) => {
      const checkFetching = () => {
        if (!isFetching) {
          if (allFetched.value) {
            resolve(0)
          } else { 
            fetchFromRemote().then((data) => {
              resolve(data)
            })
          }
        } else {
          setTimeout(checkFetching, 100);
        }
      };
      checkFetching();
    });
    
  }

  const addOrEditEntry = async (entry: jobEntryInput) => {
    apiHandler.addOrUpdateJobEntry(entry).then((data) => {
      localJobData.value = {
        ...localJobData.value,
        ...data,
      }
    })
  }
  const deleteEntry = async (id: number[]) => {
    apiHandler.deleteJobEntry(id).then((data: number[]) => {
      data.forEach((id) => {
        delete localJobData.value[id]
      })
    })
  }

  const hiddenColumnsState = ref<string[]>([])
  const filterHiddenColumns = (columns: string[]) => {
    const known_columns = computeLayoutUnfiltered.value.map((layout) => layout.key)
    return columns.filter((col) => known_columns.includes(col))
  }
  const hiddenColumns = computed({
    get(): string[] {
      return filterHiddenColumns(hiddenColumnsState.value)
    },
    set(columns: string[]) {
      hiddenColumnsState.value = filterHiddenColumns(columns)
    },
  })

  const getColumnsByType = (
    type: string | undefined,
    includeHiddenColumns: boolean = true,
  ): string[] => {
    /*
        Returns all columns that have the given type.
        If type is undefined, all columns are returned.
        If type is "type", all columns that have multiple types are returned.
        */

    return (includeHiddenColumns ? computeLayoutUnfiltered : computeLayout).value
      .filter((col) => type === undefined || type === 'type' || col.type.split('|').includes(type))
      .map((col) => col.key)
  }

  const computeLayoutUnfiltered = computed((): TableLayout[] => {
    const staticSchema: TableLayout[] = [
      { key: 'id', type: 'number' } as TableLayout,
      ...Object.keys(DUMMY_JOB_ENTRY)
        .map((key) => {
          if (key != 'context') {
            return { key, type: String(typeof (DUMMY_JOB_ENTRY as Record<string, any>)[key]) }
          }
          return null
        })
        .filter((layout): layout is TableLayout => layout !== null),
    ]

    const contextColNames: TableLayout[] = [
      ...Object.values(localJobData.value).flatMap((row: jobEnty) =>
        Object.entries(row.context ?? {}).map(([key, value]) => ({ key, type: typeof value })),
      ),
      ...(staticContextSchema.value
        ? Object.entries(staticContextSchema.value).map(([key, value]) => ({
            key,
            type: convertPyTypes(value),
          }))
        : []),
    ].reduce((acc: TableLayout[], curr: TableLayout) => {
      const existing = acc.find((layout) => layout.key === curr.key)
      if (!existing) {
        acc.push(curr)
      } else if (!existing.type.split('|').includes(curr.type)) {
        existing.type += '|' + curr.type
      }
      return acc
    }, [])

    return [...staticSchema, ...contextColNames]
  })
  const computeLayout = computed((): TableLayout[] => {
    return computeLayoutUnfiltered.value.filter(
      (layout) => !hiddenColumns.value.includes(layout.key),
    )
  })

  const computedFilterdJobData = computed(() => {
    let flattendJobEntys: flattendJobEnty[] = Object.keys(localJobData.value)
      .map((key: string) => {
      const index = parseInt(key)
      const row = localJobData.value[index]
      return {
        id: index,
        ...row,
        ...row.context,
        context: undefined,
      }
      })
      .sort((a, b) => b.id - a.id) // Sort by id in descending order
    if (filters) {
      flattendJobEntys = filters.applyFiltersOnData(flattendJobEntys)
    }
    if (!allFetched.value && flattendJobEntys.length < fetchAmount.value) {
      lazyFetch(flattendJobEntys.length)
    }
    return flattendJobEntys
  })

  const computeDisplayedData = ref<flattendJobEnty[]>([])
  watchEffect(() => {
    console.debug("Recomputing displayed data")
    highlightSubstring.value = []
    let flattendJobEntys: flattendJobEnty[] = computedFilterdJobData.value
    if (sortByString && sortByString.value.key) {
      const result = sortByStr(
        computedFilterdJobData.value,
        sortByString.value,
        computeLayoutUnfiltered.value,
      )
      flattendJobEntys = result.content
      highlightSubstring.value = result.highlightSubstring
    } else {
      highlightSubstring.value = []
    }
    computeDisplayedData.value = flattendJobEntys
  })

  const saveToFile = async (mode: 'all' | 'visable', constrainColumn: string[] = []) => {
    // When supported by firefox, replace with File System API
    try {
      let data
      if (mode === 'all') {
        data = localJobData.value
      } else {
        data = computeDisplayedData.value
        data = data.map((entry) => {
          return Object.keys(entry).reduce(
            (acc: Record<string, any>, key) => {
              if (constrainColumn.includes(key)) {
                return acc
              }
              acc[key] = entry[key]
              return acc
            },
            {} as Record<string, any>,
          )
        })
      }
      const blob = new Blob([JSON.stringify(data)], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${jobId}_${new Date().toISOString()}_${mode}Data_webwatcher.json` // File name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      useStatusMessage().newStatusMessage('Failed to save data to file', 'danger')
      throw new Error('Failed to save data to file')
    }
  }

  return {
    jobId,
    computeDisplayedData,
    highlightSubstring,
    computeLayout,
    computeLayoutUnfiltered,
    hasStaticContext: computed(
      () => staticContextSchema.value && Object.keys(staticContextSchema.value).length > 0,
    ),
    computedAllFetched: computed(() => allFetched.value),
    localJobData,
    filters,
    hiddenColumns,
    saveToFile,
    addOrEditEntry,
    deleteEntry,
    lazyFetch,
    retriveRowsById,
    getColumnsByType,
  }
}

export const useJobUiCreator = (jobId: number) => {
  const intenalColums = [...Object.keys(DUMMY_JOB_ENTRY).filter((col) => col != 'context'), 'id']

  const fetchAmount = ref(30)
  const page = ref(0)
  const sortByString = ref<sortByString>({ key: '', ignoreColumns: [], caseInsensitive: true })

  const mainDataTable = ref<any>(null)
  const filterContext = useFilterIterationContext()

  const metaData = ref<JobMeta | undefined>(undefined)

  getJobMetaData(jobId).then((data) => {
    metaData.value = data
  })

  const jobDataHandler = useJobDataHandler(
    jobId,
    computed(() => fetchAmount.value + 1),
    computed(() => sortByString.value),
    filterContext,
    computed(() => metaData.value?.expectedReturnSchema),
  )

  jobDataHandler.hiddenColumns.value = intenalColums.filter((col) => col != 'id')

  const unsetSortByString = () => {
    sortByString.value.key = ''
  }

  const unsetPrimevueSort = () => {
    mainDataTable.value.$data.d_multiSortMeta = []
  }

  return {
    jobDataHandler,
    mainDataTable,
    fetchAmount,
    intenalColums,
    page,
    metaData,
    sortByString,
    filterContext,
    unsetSortByString,
    unsetPrimevueSort,
  }
}
