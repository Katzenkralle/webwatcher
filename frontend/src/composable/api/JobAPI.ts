import { ref, type Ref} from 'vue';
import { useStatusMessage } from '../core/AppState';
import { queryGql, reportError, type ErrorTypes } from "@/composable/api/QueryHandler" 

export interface TableMetaData {
    id: number;
    name: string;
    script: string;
    description: string;
    enabled: boolean;
    executeTimer: string;
    executedLast: number;
    forbidDynamicSchema: boolean;
    expectedReturnSchema: Record<string, string>;
    parameters: Record<string, string>; // KV of parameter name and value
}

export type TableLayout = {
    key: string;
    type: string;
};

export let globalTableMetaData: Ref<TableMetaData[]> = ref([]);



const fetchAllJobMetaData = async (): Promise<TableMetaData[]> => {
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
                ... on Message {
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
                    return resolve(response.data[key])
                default:
                    return resolve([
                        {
                            id: 0,
                            name: "Tabke",
                            script: "script1",
                            description: "Hello World",
                            enabled: false,
                            executeTimer: "0",
                            executedLast: 0,
                            forbidDynamicSchema: false,
                            expectedReturnSchema: {},
                            parameters: {}
                        },
                        {
                            id: 1,
                            name: "Entry",
                            script: "script2",
                            description: "Hello World2",
                            enabled: false,
                            executeTimer: "0",
                            executedLast: 0,
                            forbidDynamicSchema: true,
                            expectedReturnSchema: {
                                "some": "string|number",
                                "aNumber": "number"
                            },
                            parameters: {
                                "test": "value",
                            }
                        }
                    ])
                    

                }
            reportError(response)                
            return reject(response)
        })
    });
}

export const getAllJobMetaData = async(forceRefetch: boolean = false): Promise<TableMetaData[]> => {
    if(forceRefetch || !globalTableMetaData.value.length){
        const jobDate = await fetchAllJobMetaData()
        globalTableMetaData.value = jobDate
    }
    return globalTableMetaData.value
}

export const getJobMetaData = async  (id: number|undefined): Promise<TableMetaData> => {
    const localElntry =  globalTableMetaData.value.find((table) => table.id === id || !id);
    if(localElntry) {
        return new Promise((resolve) => resolve(localElntry));
    }
    return getAllJobMetaData().then((data) => {
        const entry = data.filter((table) => table.id === id)[0];
        if(entry) {
            return entry;
        }
        throw new Error("Table not found");
    });
}

export const deleteJob = async(id: number) => {
    const query = `
        mutation {
            deleteJob(id: ${id}) {
                __typename
                ... on Message {
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

export const updateOrCreateJob = async(entry: TableMetaData): Promise<void> => {
    const query = `
        mutation {
            createOrModifyJob(
                ${entry.id >= 0 ? `id: ${entry.id},` : ``}
                name: "${entry.name}",
                script: "${entry.script}",
                description: "${entry.description}",
                enabled: ${entry.enabled},
                forbidDynamicSchema: ${entry.forbidDynamicSchema},
                executeTimer: "${entry.executeTimer}",
                expectedReturnSchema: ${JSON.stringify(entry.expectedReturnSchema)}
            ) {
                __typename
                ... on Message {
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
    return new Promise((resolve, reject) => {
        queryGql(query).then((response) => {
            const key = response.keys[0];
            switch (key) {
                case "jobsMetaDataList":
                    globalTableMetaData.value = response.data[key];
                    resolve();
                    break;
                default:
                    reportError(response);
                    reject(response);
            }
        }).catch((error) => {
            reportError(error);
            reject();
        });
    });
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
                    ... on Message {
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

