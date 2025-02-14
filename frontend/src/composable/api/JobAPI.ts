import { ref, resolveComponent, type Ref} from 'vue';
import { useStatusMessage } from '../core/AppState';
import { queryGql, reportError, type ErrorTypes } from "@/composable/api/GqlHandler" 

export interface TableMetaData {
    id: number;
    name: string;
    script: string;
    description: string;
    enabled: boolean;
    executeTimer: number;
    executedLast: number;
    forbidDynamicSchema: boolean;
    expectedReturnSchema: any;
}

export type TableLayout = {
    key: string;
    type: string;
};

let globalTableMetaData: Ref<TableMetaData[]> = ref([]);

export function useTableMetaData() {

    const fetchTableMetaData = (): Promise<Boolean> => {
        return new Promise(async (resolve, reject) => {
            const query = `
            query {
                jobsMetaDataResult {
                    __typename
                    ... on jobsMetaDataList {
                        jobs {
                        id
                        name
                        script
                        description
                        enabled
                        executeTimer
                        executedLast
                        forbidDynamicSchema
                        expectedReturnSchema
                        }
                    }
                    ... on ErrorMessage {
                        message
                        status
                    }
                }
            }
            `;
            queryGql(query).then((response) => {
                const key = response.keys[0];
                switch (key) {
                    case "jobsMetaDataList":
                        globalTableMetaData.value = response.data[key]
                        return resolve(true)
                    default:
                        globalTableMetaData.value = [
                            {
                                id: 0,
                                name: "TestTable",
                                script: "TestScript",
                                description: "Hello World",
                                enabled: false,
                                executeTimer: 0,
                                executedLast: 0,
                                forbidDynamicSchema: false,
                                expectedReturnSchema: {}
                            },
                            {
                                id: 1,
                                name: "TestTable2",
                                script: "TestScript2",
                                description: "Hello World2",
                                enabled: false,
                                executeTimer: 0,
                                executedLast: 0,
                                forbidDynamicSchema: false,
                                expectedReturnSchema: {
                                    "some": "string",
                                    "aNumber": 1
                                }
                            }
                        ]
                        return resolve(true)

                    }
                reportError(response)                
                return reject(response)
            })
        });
    }

    const getTaleMetaData = (id: number|undefined) => {
        return globalTableMetaData.value.find((table) => table.id === id);
    }

    const updateTableMetaData = (data: TableMetaData) => {
        console.log("Not jet implemented")
    }

    return { 
        fetchTableMetaData,
        getTaleMetaData,
        updateTableMetaData,
        localTableMetaData: globalTableMetaData
     }
    
}
   

export interface jobEnty {
	callId: number
	timestamp: number
	runtime: number
	result: ErrorTypes
	scriptFailure: Boolean
	context: Record<string, any>
}

export const DUMMY_JOB_ENTRY: jobEnty = {
    callId: 0,
    timestamp: 0,
    runtime: 0,
    result: "CATS_AND_DOGS",
    scriptFailure: false,
    context: {}
}

export const useJobData = (jobId: number) => {
    const FETCH_AT_ONCE = 500    
    
    const fetchData = async (range: [Number, Number]|undefined = undefined): Promise<jobEnty[]> => {
        return new Promise(async (resolve, reject) => {
            const query = `
                query {
                    jobsEntryResult(
                        id: ${jobId},
                        ${range ? `NthElement: { max: ${FETCH_AT_ONCE}, startElement: ${range[0]} }` : ``}
                    ) {
                    __typename
                    ... on jobsEntryList {
                        jobs {
                            callId
                            timestamp
                            runtime
                            result
                            scriptFailure
                            context
                        }
                    }
                    ... on ErrorMessage {
                        message
                        status
                    }
                }
            }
            `;
            queryGql(query).then((response) => {
                const key = response.keys[0];
                switch (key) {
                    case "jobEntry":
                        return resolve(response.data[key] as jobEnty[])
                    default:
                        return resolve([
                            {
                                callId: 0,
                                timestamp: 0,
                                runtime: 0,
                                result: "OK",
                                scriptFailure: false,
                                context: {
                                    "some": 1,
                                    "aNumber": "string"
                                }
                            },
                            {
                                callId: 1,
                                timestamp: 1,
                                runtime: 1,
                                result: "NOT_OK",
                                scriptFailure: false,
                                context: {
                                    "some": "string",
                                    "aNumber": 1
                                }
                            }
                        ])
                }
                reportError(response)                
                return reject(response)
            })
        });
    }
    return { fetchData }
}

// This is not good practice, but itll work for now
useTableMetaData().fetchTableMetaData();