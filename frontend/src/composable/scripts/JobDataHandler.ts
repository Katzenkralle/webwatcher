import {ref, computed, type Ref, watch, type ComputedRef} from 'vue';
import { useJobData, type TableMetaData, type jobEnty, type TableLayout, DUMMY_JOB_ENTRY } from '../api/JobAPI';
import type { IterationContext, Group as FilterGroup, Group, AbstractCondition } from './FilterGroups';
import { useStatusMessage } from '../core/AppState';
/*
global: refers to local data accessible from all components
local: referce to data tat is shared by one use instance
displayed: referse to data that is displayed in the frontend, is a subset of the data
remote: referse to data on the server
*/

let globalJobData: Record<number, Ref<Record<number, jobEnty>>> = {}
export let handlerRefs: Record<number, Ref<jobEnty[]>> = {}

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
    hiddenColumns: Ref<string[]> = ref([]),
    fetchAmount: Ref<number>|ComputedRef<number> = ref(10),
    sortByString: ComputedRef<sortByString> | undefined = undefined, // [key, [columns_NOT_to_sort_by]]
    filters: IterationContext|undefined = undefined,
    ) => {
    const localJobData: Ref<Record<number, jobEnty>> = ref([]);
    const apiHandler = useJobData(jobId)
    const allFetched = ref(false);
    const highlightSubstring = ref<Record<number, Record<string, HighlightSubstring[]>>>({})

    const init = async () => {
        if (!(jobId in globalJobData)) {
                globalJobData[jobId] = ref(await apiHandler.fetchData([0, fetchAmount.value]).catch(() => {
                    useStatusMessage().newStatusMessage("Failed to fetch additional data", "danger");
                    return []
                }));
        };
        
        localJobData.value = globalJobData[jobId].value;
    }
    init();

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
          
        const contextColNames: TableLayout[] = Object.values(localJobData.value).flatMap((row: jobEnty) => 
            Object.entries(row.context).map(([key, value]) => ({ key, type: typeof value }))
        ).reduce((acc: TableLayout[], curr: TableLayout) => {
            const existing = acc.find((layout) => layout.key === curr.key);
            if (!existing) {
                acc.push(curr);
            } else if (existing.type !== curr.type) {
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

    const lazyFetch = async(startAt: number|undefined = undefined, all: boolean = false) => {
        startAt = startAt || Object.keys(localJobData.value).length;
        if (Object.keys(localJobData.value).length < startAt + fetchAmount.value && !allFetched.value) {
            localJobData.value = {
                ...localJobData.value,
                ...await apiHandler.fetchData(!all ? [startAt, startAt + fetchAmount.value] : undefined)
                    .then((data) => {
                        if (Object.keys(data).length < fetchAmount.value) {
                            allFetched.value = true;
                        }
                        return data;
                    })
                    .catch(() => {
                        useStatusMessage().newStatusMessage("Failed to fetch additional data", "danger");
                        return {}
                    })
                };
        }
        if (all) {
            allFetched.value = true;
        }
    }
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

    return { 
        computeDisplayedData,
        highlightSubstring,
        computeLayout,
        computeLayoutUnfiltered,
        computedAllFetched: computed(() => allFetched.value),
        localJobData,
        filters,
        lazyFetch,
        getColumnsByType
    };
}