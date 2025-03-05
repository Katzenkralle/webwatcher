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

function longestCommonSubstringLength(input: string, target: string, caseSensitive: boolean = false): number {
    let maxMatch = 0;
    if (!caseSensitive) {
        input = input.toLowerCase();
        target = target.toLowerCase();
    }
    for (let i = 0; i < input.length; i++) {
        for (let j = i + 1; j <= input.length; j++) {
            let substring = input.slice(i, j);
            if (target.includes(substring)) {
                maxMatch = Math.max(maxMatch, substring.length);
            }
        }
    }
    return maxMatch;
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
    let allFetched = ref(false);

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

    const lazyFetch = async(startAt: number|undefined = undefined) => {
        startAt = startAt || Object.keys(localJobData.value).length;
        if (Object.keys(localJobData.value).length < startAt + fetchAmount.value && !allFetched.value) {
            localJobData.value = {
                ...localJobData.value,
                ...await apiHandler.fetchData([startAt, startAt + fetchAmount.value])
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
    }
    const computeDisplayedData = computed((): flattendJobEnty[]  => {
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
        if (sortByString) {
            let indexValueMap: Record<number, number> = {};
            // ensure that all columns are present
            const columns = computeLayout.value.map(layout => layout.key).filter(col => !sortByString.value.ignoreColumns.includes(col));
            const sortKey = sortByString.value.key


            flattendJobEntys.sort((a, b) => {
                let aScore: number[] = [];
                let bScore: number[] = [];
                // itterate over all columns and add the longest common substring length to the score
                columns.forEach((col) => {
                    aScore.push(longestCommonSubstringLength(String(a[col]),
                        sortKey,
                        !sortByString.value.caseInsensitive));
                    bScore.push(longestCommonSubstringLength(String(b[col]),
                        sortKey,
                        !sortByString.value.caseInsensitive))
                });
                // array with highest score first
                // ToDo: check if simply adding the values together and returning the difference
                // would be a good enough approximation
                aScore = aScore.sort((a, b) => b - a);
                bScore = bScore.sort((a, b) => b - a);
                let i = 0;
                for(; i < aScore.length; i++) {
                    if (aScore[i] !== bScore[i]) {
                        return bScore[i] - aScore[i];
                    }
                }
                return 0;
            });
        }

        return flattendJobEntys;
    });

    return { 
        computeDisplayedData,
        computeLayout,
        computeLayoutUnfiltered,
        computedAllFetched: computed(() => allFetched.value),
        localJobData,
        filters,
        lazyFetch,
        getColumnsByType
    };
}