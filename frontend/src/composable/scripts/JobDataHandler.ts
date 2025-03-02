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

export const useJobDataHandler = (
    jobId: number, 
    includeInternalData: Ref<boolean> = ref(false),
    fetchAmount: Ref<number>|ComputedRef<number> = ref(10),
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
    
        /*if (range)(
            watch(range, async(newRange) => {
                const presentEntrys = localJobData.value.length
                if (presentEntrys < newRange[1]){
                    console.debug("Fetching aditional Data")
                    localJobData.value.push(...await apiHandler.fetchData([presentEntrys, newRange[1]]).catch(() => []));
                }
            })
        )*/
    }
    init();

    const getColumnsByType = (type: string|undefined): string[] => {
        /*
        Returns all columns that have the given type.
        If type is undefined, all columns are returned.
        If type is "type", all columns that have multiple types are returned.
        */
        
        return computeLayout.value.filter(col => 
            type === undefined
            ||
            (type === "type" && col.type.includes("|"))
            ||
            col.type.split("|").includes(type)
            ).map(col => col.key);
    }

    const computeRelevantDataRange = computed((): Record<number, jobEnty> => 
       localJobData.value // range ? localJobData.value.slice(range.value[0], range.value[1]) :
    ) 

    const computeLayout = computed((): TableLayout[] => {
        const staticSchema: TableLayout[] = [
            { key: "id", type: "number" } as TableLayout,
            ...Object.keys(DUMMY_JOB_ENTRY).map(key => {
                if (key != "context") {
                    return { key, type: String(typeof (DUMMY_JOB_ENTRY as Record<string, any>)[key]) };
                }
                return null;
            }).filter((layout): layout is TableLayout => layout !== null)
        ];
          
        const contextColNames: TableLayout[] = Object.values(computeRelevantDataRange.value).flatMap((row: jobEnty) => 
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
            ...(includeInternalData.value ? staticSchema : []),
            ...contextColNames
        ];
    })

    const lazyFetch = async(startAt: number|undefined = undefined) => {
        startAt = startAt || Object.keys(localJobData.value).length;
        if (Object.keys(localJobData.value).length < startAt + fetchAmount.value && !allFetched.value) {
            console.log("Fetching additional data", startAt, fetchAmount.value);
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
                ...(includeInternalData.value ? row : {}),
                ...row.context,
                context: undefined
            };
        });
        if (filters) {
            flattendJobEntys = filters.applyFiltersOnData(flattendJobEntys);
        }

        return flattendJobEntys;
        
    });

    return { 
        computeDisplayedData,
        computeLayout,
        computedAllFetched: computed(() => allFetched.value),
        localJobData,
        filters,
        lazyFetch,
        getColumnsByType
    };
}