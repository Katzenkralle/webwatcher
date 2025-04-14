import { ref, type Ref} from 'vue';
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
            const key = response.providedTypes[0].type;
            switch (key) {
                case "jobsMetaDataList":
                    return resolve(response.data[key])
                default:
                    throw response
            }
        }).catch((error) => {
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
            reportError(error)
            return reject(error)
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
        const key = response.providedTypes[0].type;
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
            const key = response.providedTypes[0].type;
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
   

export interface jobEnty {	
    timestamp: number
	runtime: number
	result: ErrorTypes
	scriptFailure: Boolean
	context: Record<string, any>
}

export interface jobEntryInput extends jobEnty {
    callId: number|undefined;
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
    

    const pfraseeJobEntry = (entry: Record<any, any>): Record<number, jobEnty> => {
        const callId: number = entry.callId!;
        delete entry.callId;
        try {
            entry.context = JSON.parse(entry.context);
        } catch (e) {
            entry.context = {}
        }
        return {[callId]: entry as jobEnty}
        }
    
    const fetchData = async (range: [Number, Number]|undefined = undefined, specificRows: number[]|undefined = undefined, lastN: number|undefined=undefined): Promise<Record<number, jobEnty>> => {
        
            const query = `
                query JobEntryLookup($jobId: Int!, $lastN: Int, $range: PaginationInput, $specificRows: [Int!]) {
                    getJobEntries(
                        jobId: $jobId,
                        newestN: $lastN,
                        range: $range,
                        specificRows: $specificRows
                    ) {
                        ... on JobEntryList {
                        __typename
                        jobs {
                            callId
                            context
                            result
                            runtime
                            scriptFailure
                            timestamp
                        }
                        }
                        ... on Message {
                        __typename
                        message
                        status
                        }
                    }
                }
            `;
            return queryGql(query, {
                jobId: jobId,
                lastN: lastN,
                range: range ? {
                    max: range[1], 
                    startElement: range[0]} : undefined,
                specificRows: specificRows
            }).then((response) => {
                const key = response.providedTypes[0].type;
                switch (key) {
                    case "JobEntryList":
                        const entries: Record<number, jobEnty> = response.data.getJobEntries.jobs
                            .reduce((acc: Record<number, jobEnty>, entry: jobEntryInput) => {
                                const phrased = pfraseeJobEntry(entry);
                                return {...acc, ...phrased}
                            }, {});
                        return entries
                    default:
                        throw response
                }
            }).catch((error) => {
                reportError(error)
                throw error
            })
    }

    const addOrUpdateJobEntry = async (entry: jobEntryInput & {id: number|undefined}): Promise<Record<number, jobEnty>> => {
        // This is a workaround for we use mix naming for the callId and id
        if (!entry.callId && entry.id) {
            entry.callId = entry.id;
            delete entry.id;
        }

        const query = `
            mutation AddOrUpdateJobEntry($jobId: Int!, $entry: JobEntyInput!) {
                addOrEditEntryInJob(
                  jobId: $jobId,
                  data: $entry
                ){
                    ... on JobEntry {
                        __typename
                        context
                        callId
                        result
                        runtime
                        scriptFailure
                        timestamp
                        }
                        ... on Message {
                        __typename
                        message
                        status
                        }
                    }         
                }`
        return queryGql(query, {
            jobId: jobId,
            entry: entry}).then((response) => {
            const key = response.providedTypes[0].type;
            console.log(response)
            switch (key) {
                case "JobEntry":
                    return pfraseeJobEntry(response.data.addOrEditEntryInJob)
                default:
                    throw response
            }}).catch((error) => {
                reportError(error)
                return Promise.reject(error)
            })
        }   
            
        return { fetchData, addOrUpdateJobEntry }
}

