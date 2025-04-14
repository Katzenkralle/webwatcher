import {ref, computed, type Ref, type ComputedRef} from 'vue';
import { useJobData, type jobEnty, type TableLayout,  type jobEntryInput, DUMMY_JOB_ENTRY, type TableMetaData, getJobMetaData } from '../api/JobAPI';
import { reportError } from '@/composable/api/QueryHandler';
import type { IterationContext } from './FilterGroups';
import { useLoadingAnimation, useStatusMessage } from '../core/AppState';
import { useFilterIterationContext} from "@/composable/jobs/FilterGroups";

/*
global: refers to local data accessible from all components
local: referce to data tat is shared by one use instance
displayed: referse to data that is displayed in the frontend, is a subset of the data
remote: referse to data on the server
*/

let globalJobData: Record<number, Ref<Record<number, jobEnty>>> = {}

export interface flattendJobEnty {
    [key: string]: any;
}

interface sortByString {
    key: string,
    ignoreColumns: string[],
    caseInsensitive: boolean  
}

export interface HighlightSubstring {
    start: number,
    end: number
}

function longestCommonSubstring(input: string, target: string, caseSensitive: boolean = false): HighlightSubstring[] {
    let matches: HighlightSubstring[] = [{ start: 0, end: 0 }];
    if (!caseSensitive) {
        input = input.toLowerCase();
        target = target.toLowerCase();
    }
    for (let i = 0; i < input.length; i++) {
        for (let j = input.length; j > i; j--) {
            let substring = input.slice(i, j);
            if (target.includes(substring) && substring.length > target.length / 2) {
                // we only consider substrings that are at least half the length of the target

                matches.push({ start: i, end: j });
                i = j;
                break;
            }
        }
    }
    matches = matches.sort((a, b) => (b.end - b.start)-(a.end - a.start));
    return matches;
}

export const useJobDataHandler = (
    jobId: number, 
    fetchAmount: Ref<number>|ComputedRef<number>,
    hiddenColumns: Ref<string[]> = ref([]),
    sortByString: ComputedRef<sortByString> | undefined = undefined, // [key, [columns_NOT_to_sort_by]]
    filters: IterationContext|undefined = undefined,
    staticContextSchema: ComputedRef<Record<string,string>|undefined>
    ) => {
    if (globalJobData[jobId] === undefined) {
        globalJobData[jobId] = ref([]);
    }    
    const localJobData: Ref<Record<number, jobEnty>> = globalJobData[jobId];
    const apiHandler = useJobData(jobId)
    const allFetched = ref(false);
    const highlightSubstring = ref<Record<number, Record<string, HighlightSubstring[]>>>({})

    const lazyFetch = async(startAt: number|undefined = undefined, all: boolean = false) => {
        useLoadingAnimation().setState(true);
        startAt = startAt || Object.keys(localJobData.value).length;
        if (Object.keys(localJobData.value).length < startAt + fetchAmount.value && !allFetched.value) {
            console.log("Lazy fetching data from " + startAt + " to " + (startAt + fetchAmount.value));
            localJobData.value = {
                ...localJobData.value,
                ...await apiHandler.fetchData(!all ? [startAt, startAt + fetchAmount.value] : undefined)
                    .then((data) => {
                        console.log(data)
                        if (Object.keys(data).length < fetchAmount.value) {
                            allFetched.value = true;
                        }
                        return data;
                    })
                    .catch((e) => {
                        console.log(e);
                        reportError(e);
                        return {}
                    })
                };
        }
        if (all) {
            useStatusMessage().newStatusMessage("All data fetched", "success");
            allFetched.value = true;
        }
        useLoadingAnimation().setState(false);
    }

    const retriveRowsById = async(options: {id?: number[],  all?: boolean, newestNRows?:  number}): Promise<number> =>  {
        // Returns number of unresolved entrys

        let rowsToFetch: number = function() {
            if (options.id && options.id.length) {
                return options.id.reduce((acc: number, curr:  number) => {
                    if (localJobData.value[curr] === undefined) {
                        return acc+1;
                    }
                    options.id = options.id!.filter((id) => id !== curr);
                    return acc;
                },0);
            }
            if (options.all) {
                return Infinity;
            }
            if (options.newestNRows) {
                return options.newestNRows;
            }
            return 0;
        }()
        if (rowsToFetch === 0) {
            return rowsToFetch;
        }
        return apiHandler.fetchData(undefined, options.id, options.newestNRows)
            .then((data) => {
                const currentKeys = Object.keys(localJobData.value);
                data = Object.keys(data)
                    .filter((key) => !currentKeys.includes(key))
                    .reduce((acc: Record<number, jobEnty>, key) => {
                        const index = parseInt(key);
                        acc[index] = data[index];
                        return acc;
                    }, {});
                if (options.id) {
                    rowsToFetch = options.id.reduce((acc: number, curr: number) => {  
                            if (data[curr] === undefined) {
                                acc++;
                            }
                            return acc;
                        }, 0) + Object.keys(data).length  // + object length, because we subtract it in the return   
                        
                }
                if (Object.keys(data).length === 0) {
                    return 0;
                }
                localJobData.value = {
                    ...localJobData.value,
                    ...data
                };
                if (rowsToFetch === Infinity) {
                    return 0;
                } 
                return Math.max(0, rowsToFetch - Object.keys(data).length);
            }).catch((e) => {
                reportError(e);
                return rowsToFetch
            }
        );
    }   

    const addOrEditEntry = async(entry: jobEntryInput) => {
        apiHandler.addOrUpdateJobEntry(entry).then((data) => {         
            localJobData.value = {
                ...localJobData.value,
                ...data
            };
        })
    }
    const deleteEntry = async(id: number[]) => {
        apiHandler.deleteJobEntry(id).then((data: number[]) => {
            data.forEach((id) => {
                delete localJobData.value[id];
            });
        })
    }

    const getColumnsByType = (type: string|undefined, includeHiddenColumns: boolean = true): string[] => {
        /*
        Returns all columns that have the given type.
        If type is undefined, all columns are returned.
        If type is "type", all columns that have multiple types are returned.
        */
        
        return (includeHiddenColumns ? computeLayoutUnfiltered : computeLayout).value
          .filter(col => 
            type === undefined
            ||
            (type === "type" && col.type.includes("|"))
            ||
            col.type.split("|").includes(type)
            ).map(col => col.key);
    }

    const computeLayoutUnfiltered = computed((): TableLayout[] => {
        const staticSchema: TableLayout[] = [
            { key: "id", type: "number" } as TableLayout,
            ...Object.keys(DUMMY_JOB_ENTRY).map(key => {
                if (key != "context") {
                    return { key, type: String(typeof (DUMMY_JOB_ENTRY as Record<string, any>)[key]) };
                }
                return null;
            }).filter((layout): layout is TableLayout => layout !== null)
        ];
          
        const contextColNames: TableLayout[] = [...Object.values(localJobData.value).flatMap((row: jobEnty) => 
                Object.entries(row.context)
                .map(([key, value]) => ({ key, type: typeof value }))
            ), ...(staticContextSchema.value 
                ?  Object.entries(staticContextSchema.value)
                    .map(([key, value]) => ({ key, type: value }))
                : [])]
            .reduce((acc: TableLayout[], curr: TableLayout) => {
                const existing = acc.find((layout) => layout.key === curr.key);
                if (!existing) {
                    acc.push(curr);
                } else if (!existing.type.split("|").includes(curr.type)) {
                    existing.type += "|" + curr.type;
                }
                return acc;
            }, []);

        return [
            ...staticSchema,
            ...contextColNames
        ];
    })
    const computeLayout = computed((): TableLayout[] => {
        return computeLayoutUnfiltered.value.filter((layout) => !hiddenColumns.value.includes(layout.key));
    });

    const computedFilterdJobData = computed(() => {
        console.debug("Recomputed Display Data");
        let flattendJobEntys: flattendJobEnty[] = Object.keys(localJobData.value).map((key: string) => {
            const index = parseInt(key);
            const row = localJobData.value[index];
            return {
                id: index,
                ...row,
                ...row.context,
                context: undefined
            };
        });
        if (filters) {
            flattendJobEntys = filters.applyFiltersOnData(flattendJobEntys);
            if (!allFetched.value && flattendJobEntys.length < fetchAmount.value) {
                lazyFetch(flattendJobEntys.length);
            }
        }
        return flattendJobEntys;
    });
    
    const computeDisplayedData = computed((): flattendJobEnty[]  => {
        let flattendJobEntys = computedFilterdJobData.value;
        highlightSubstring.value = []
        
        if (sortByString && sortByString.value.key) {
            // Sorts strings by 1) the longest common substring and 2) the total length 
            // amount of substrings matches in the columns.
            // Note: Not the whole substring must match, we consider 1/2 to be the minimum match

            // ensure that all columns are present
            const columns = computeLayout.value.map(layout => layout.key).filter(col => !sortByString.value.ignoreColumns.includes(col));
            const sortKey = sortByString.value.key

            // we create a sort map, to not loss track of the indeces after sorting
            // we try to not rely on any specific colum of flattendJobEnty, even if we know that the key is present
            const entriesSortMap: {job: flattendJobEnty, highlights: Record<string, HighlightSubstring[]>}[] 
                = flattendJobEntys.map((entry) => {
                let highlights: { [key: string]: HighlightSubstring[] } = {};
                columns.forEach((col) => {   
                    highlights[col] = longestCommonSubstring(String(entry[col]),
                    sortKey,
                    !sortByString.value.caseInsensitive)
                });               
                return { job: entry, highlights: highlights };
            });
            entriesSortMap.sort((a, b) => {
                let aScore: number[] = [];
                let bScore: number[] = [];
                // itterate over all columns and add the longest common substring length to the score
                columns.forEach((col) => {
                    a.highlights[col].forEach((highlight) => {
                        aScore.push(highlight.end - highlight.start);
                    });
                    b.highlights[col].forEach((highlight) => {
                        bScore.push(highlight.end - highlight.start);
                    });
                });
                
                // sort the scores in descending order
                // longest common substring is the best match
                aScore = aScore.sort((a, b) => b - a);
                bScore = bScore.sort((a, b) => b - a);
                let i = 0;
                for(; i < aScore.length; i++) {
                    if (aScore[i] !== bScore[i]) {
                        return bScore[i] - aScore[i];
                    }
                }

                // if the scores are equal, we sort by the total score
                return aScore.reduce((acc, val) => acc + val, 0) 
                    - bScore.reduce((acc, val) => acc + val, 0);
            });
            flattendJobEntys = entriesSortMap.map((entry, index) => {
                highlightSubstring.value[index] = entry.highlights
                return entry.job
            });
        }
        return flattendJobEntys;
    });

    const saveToFile = async (mode: 'all'|'visable', constrainColumn: string[] = []) => {
        // When supported by firefox, replace with File System API
        try {
            useLoadingAnimation().setState(true);
            let data
            if (mode === 'all') {
                data = localJobData.value;
            } else {
                data = computeDisplayedData.value;
                data = data.map((entry) => {
                    return Object.keys(entry).reduce((acc: Record<string, any>, key) => {
                        if (constrainColumn.includes(key)) {
                            return acc;
                        }
                        acc[key] = entry[key];
                        return acc;
                    }, {} as Record<string, any>);
                });
            }
            const blob = new Blob([JSON.stringify(data)], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${jobId}_${new Date().toISOString()}_${mode}Data_webwatcher.json`; // File name
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            }
        catch (e) {
            useStatusMessage().newStatusMessage("Failed to save data to file", "danger");
            throw new Error("Failed to save data to file");;
        }
        finally {
            useLoadingAnimation().setState(false);
        }
        }

    return {
        jobId,
        computeDisplayedData,
        highlightSubstring,
        computeLayout,
        computeLayoutUnfiltered,
        hasStaticContext: computed(() => staticContextSchema.value !== undefined && Object.keys(staticContextSchema.value).length > 0),
        computedAllFetched: computed(() => allFetched.value),
        localJobData,
        filters,
        saveToFile,
        addOrEditEntry,
        deleteEntry,
        lazyFetch,
        retriveRowsById,
        getColumnsByType
    };
}

export const useJobUiCreator = (jobId: number) => {
    const intenalColums = [...Object.keys(DUMMY_JOB_ENTRY).filter((col) => col != 'context'), 'id'];

    const hiddenColumns = ref<string[]>([]);
    const fetchAmount = ref(30);
    const page = ref(0);
    const sortByString = ref<sortByString>({ key: "", ignoreColumns: [], caseInsensitive: true });

    const mainDataTable = ref<any>(null);
    const filterContext = useFilterIterationContext();
    
    const metaData = ref<TableMetaData|undefined>(undefined);

    getJobMetaData(jobId).then((data) => {
        metaData.value = data;
    })

    const jobDataHandler = useJobDataHandler(jobId,
        computed(() => fetchAmount.value+1),
        hiddenColumns,
        computed(() => sortByString.value),
        filterContext,
        computed(() => metaData.value?.expectedReturnSchema));
    
    const unsetSortByString = () => {
        sortByString.value.key = "";
        }

    const unsetPrimevueSort = () => {
        mainDataTable.value.$data.d_multiSortMeta = []
    }

    return {
        jobDataHandler,
        mainDataTable,
        hiddenColumns,
        fetchAmount,
        intenalColums,
        page,
        metaData,
        sortByString,
        filterContext,
        unsetSortByString,
        unsetPrimevueSort
    }
}