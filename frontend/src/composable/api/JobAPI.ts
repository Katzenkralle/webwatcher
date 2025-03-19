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
    expectedReturnSchema: Record<string, string>;
}

export type TableLayout = {
    key: string;
    type: string;
};

let globalTableMetaData: Ref<TableMetaData[]> = ref([]);

export function useTableMetaData() {

    const fetchAllMetaData = async (): Promise<TableMetaData[]> => {
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
                        return resolve(response.data[key])
                    default:
                        globalTableMetaData.value = [
                            {
                                id: 0,
                                name: "Tabke",
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
                                name: "Entry",
                                script: "TestScript2",
                                description: "Hello World2",
                                enabled: false,
                                executeTimer: 0,
                                executedLast: 0,
                                forbidDynamicSchema: false,
                                expectedReturnSchema: {
                                    "some": "string|number",
                                    "aNumber": "number"
                                }
                            }
                        ]
                        return resolve(globalTableMetaData.value)

                    }
                reportError(response)                
                return reject(response)
            })
        });
    }

    const getTaleMetaData = async  (id: number|undefined): Promise<TableMetaData> => {
        const localElntry =  globalTableMetaData.value.find((table) => table.id === id);
        if(localElntry) {
            return new Promise((resolve) => resolve(localElntry));
        }
        return fetchAllMetaData().then((data) => {
            const entry = data.filter((table) => table.id === id)[0];
            if(entry) {
                return entry;
            }
            throw new Error("Table not found");
        });
    }

    const deleteTableMetaData = (id: number) => {
        const query = `
            mutation {
                deleteJob(id: ${id}) {
                    __typename
                    ... on ErrorMessage {
                        message
                        status
                    }
                    ... on jobsMetaDataResult {
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
                }`;
        queryGql(query).then((response) => {
            const key = response.keys[0];
            switch (key) {
                case "jobsMetaDataList":
                    globalTableMetaData.value = response.data[key]
                    break;
                default:
                    reportError(response)
            }
        });
    }
    
    return { 
        fetchTableMetaData: fetchAllMetaData,
        getTaleMetaData,
        deleteTableMetaData,
        localTableMetaData: globalTableMetaData
     }
    
}
   

export interface jobEnty {	timestamp: number
	runtime: number
	result: ErrorTypes
	scriptFailure: Boolean
	context: Record<string, any>
}

export const DUMMY_JOB_ENTRY: jobEnty = {
    timestamp: 0,
    runtime: 0,
    result: "CATS_AND_DOGS",
    scriptFailure: false,
    context: {}
}

export const useJobData = (jobId: number) => {
    const FETCH_AT_ONCE = 10; 
    
    const fetchData = async (range: [Number, Number]|undefined = undefined): Promise<Record<number, jobEnty>> => {
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
                            id
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
                        return resolve(response.data[key] as Record<number, jobEnty>)
                    default:
                        const generateRandomJobEntry = (): jobEnty => {
                            return {
                                timestamp: Date.now() - Math.floor(Math.random() * 1000000),
                                runtime: Math.floor(Math.random() * 500),
                                result: Math.random() > 0.5 ? "SUCCESS" : "FAILURE",
                                scriptFailure: Math.random() > 0.5,
                                context: {
                                    "some": Math.random().toString(36)+ " " + Math.random().toString(36),
                                    "aNumber": Math.floor(Math.random() * 100)
                                }
                            };
                        };

                        const data = Array.from({ length: 15 }, (_, index) => ({
                            [index]: generateRandomJobEntry()
                        })).reduce((acc, entry) => {
                            return { ...acc, ...entry };
                        }, {} as Record<number, jobEnty>);
                        data[15] = {
                            timestamp: 0,
                            runtime: 0,
                            result: "CATS_AND_DOGS",
                            scriptFailure: false,
                            context: {
                                "some": 0,
                                "aNumber": 1
                            }
                        }
                        return resolve(Object.keys(data).filter((key) =>{
                            const index = parseInt(key)
                            return (range ? index >= Number(range[0]) && index < Number(range[1]) : true)
                        }).map((key) => parseInt(key))
                        .reduce((acc, key) => {
                            acc[key] = data[key]
                            return acc
                        }, {} as Record<number, jobEnty>)                       
                        )
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