import {ref, computed, type Ref} from "vue";
import { useJobDataHandler } from "../jobs/JobDataHandler";
//import { group } from "console";

export const useGraphHandler = (jobId:  number,
        mode: Ref<string>,
        selectedCols: Ref<number[]>,
        selectedRowId: Ref<number[]>,
        selectedChart: Ref<string[]>) => {
    const dataHandler = useJobDataHandler(jobId, mode.value == "row" ? ref(100) : computed(() => selectedCols.value.length))

    console.log("selectedCols", selectedCols.value)

    const chartsOptions = computed(() => {
        if ( selectedRowId.value.length < 2) {
            return ["vertical bar", "horizontal bar", "pie", "doughnut"]
        }
        else if (selectedRowId.value.length > 1) {
            return [ "vertical bar", "horizontal bar", "pie", "doughnut", "line"]
        }
        else {
            return ["chose more rows"]//warning: chose more rows
        }
    })
    
    

    
    return {
        dataHandler,
        chartsOptions
    }
}
