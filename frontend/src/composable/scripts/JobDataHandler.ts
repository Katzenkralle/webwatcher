import {ref, computed, type Ref, watch} from 'vue';
import { useJobData, type TableMetaData, type jobEnty, type TableLayout, DUMMY_JOB_ENTRY } from '../api/JobAPI';
import type { IterationContext, Group as FilterGroup, Group, AbstractCondition } from './FilterGroups';
/*
global: refers to local data accessible from all components
local: referce to data tat is shared by one use instance
displayed: referse to data that is displayed in the frontend, is a subset of the data
remote: referse to data on the server
*/

let globalJobData: Record<number, Ref<jobEnty[]>> = {}
export let handlerRefs: Record<number, Ref<jobEnty[]>> = {}

interface flattendJobEnty {
    [key: string]: any;
}

export const useJobDataHandler = (
    jobId: number, 
    filters: IterationContext|undefined = undefined,
    range: Ref<[number, number]>|undefined = undefined,
    ) => {
    const localJobData: Ref<jobEnty[]> = ref([]);

    const init = async () => {
        const apiHandler = useJobData(jobId)
        if (!(jobId in globalJobData)) {
                globalJobData[jobId] = ref(await apiHandler.fetchData().catch(() => []));
        };
        
        localJobData.value = globalJobData[jobId].value;
    
        if (range)(
            watch(range, async(newRange) => {
                const presentEntrys = localJobData.value.length
                if (presentEntrys < newRange[1]){
                    console.debug("Fetching aditional Data")
                    localJobData.value.push(...await apiHandler.fetchData([presentEntrys, newRange[1]]).catch(() => []));
                }
            })
        )
    }
    init();

    const getColumnsByType = (type: string|undefined): string[] => {
        return computeLayout.value.filter(col => col.type === type || type === undefined).map(col => col.key);
    }

    const computeRelevantDataRange = computed((): jobEnty[] => 
        range ? localJobData.value.slice(range.value[0], range.value[1]) : localJobData.value
    ) 

    const computeLayout = computed((): TableLayout[] => {
        const staticSchema: TableLayout[] = Object.keys(DUMMY_JOB_ENTRY).map(key => {
            if (key != "context") {
                return { key, type: String(typeof (DUMMY_JOB_ENTRY as Record<string, any>)[key]) };
            }
            return null;
        }).filter((layout): layout is TableLayout => layout !== null);
          
        const contextColNames: TableLayout[] = computeRelevantDataRange.value.flatMap((row: jobEnty) => 
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

        return [...staticSchema, ...contextColNames];
    })

    const computeDisplayedData = computed((): flattendJobEnty[]  => {
        console.debug("Recomputed Display Data");
        let relevantData: jobEnty[] = localJobData.value;
        if (filters) {
            relevantData = filters.applyFiltersOnData(computeRelevantDataRange.value);
        }
        else if (range) {
            let relevantData = [];
            for (let i = range.value[0]; i < range.value[1]; i++) {
                relevantData.push(localJobData.value[i]);
            }
            return relevantData;
        }

        return relevantData.map((row: jobEnty) => {
            return {
                ...row,
                ...row.context,
                context: undefined
            };
        });
        
    });

    return { computeDisplayedData, computeLayout, localJobData, getColumnsByType };
}