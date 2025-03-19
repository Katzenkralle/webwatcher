import {ref, computed, type Ref} from "vue";
import { useJobDataHandler } from "../jobs/JobDataHandler";

export const useGraphHandler = (jobId:  number,
        mode: Ref<string>,
        selectedCols: Ref<number[]>,
        selectedRowId: Ref<number | undefined>) => {
    const dataHandler = useJobDataHandler(jobId, mode.value == "row" ? ref(100) : computed(() => selectedCols.value.length))

    
    return {
        dataHandler,
        
    }
    

}