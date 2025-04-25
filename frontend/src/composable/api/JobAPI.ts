import { ref, type Ref } from 'vue'
import { queryGql, reportError, recordListToRecord, type GQLResponse } from '@/composable/api/QueryHandler'

export interface TableMetaData {
  id: number
  name: string
  script: string
  description: string
  enabled: boolean
  executeTimer: string
  executedLast: number
  forbidDynamicSchema: boolean
  expectedReturnSchema: Record<string, string>
  parameters: Record<string, string> // KV of parameter name and value
}

export type TableLayout = {
  key: string
  type: string
}

const tableMetaDataFormatt = (data: Record<string, any>): TableMetaData[] => {
  const relevantData: TableMetaData[] = []
  data.jobs.forEach((entry: Record<string, any>) => {
    if (entry.expectedReturnSchema && Array.isArray(entry.expectedReturnSchema)) {
      entry.expectedReturnSchema = recordListToRecord(entry.expectedReturnSchema)
    }
    if (entry.parameters && Array.isArray(entry.parameters)) {
      entry.parameters = recordListToRecord(entry.parameters)
    }
    relevantData.push(entry as TableMetaData)
  })
  return relevantData
}

export const globalTableMetaData: Ref<TableMetaData[]> = ref([])
let fetchedTableMetaData = false

const fetchAllJobMetaData = async (): Promise<TableMetaData[]> => {
  return new Promise(async (resolve, reject) => {
    const query = `
        query fetchJobMetadata {
        jobsMetadata {
        ... on JobFullInfoList {
            __typename
            jobs {
              description
              enabled
              executeTimer
              forbidDynamicSchema
              id
              name
              executedLast
              expectedReturnSchema {
                key
                value
              }
              script
              parameters {
                key
                value
              }
            }
          }
          ... on Message {
            __typename
            message
            status
          }
        }
        }
        `
    return queryGql(query)
      .then((response) => {
        const key = response.providedTypes[0].type
        switch (key) {
          case 'JobFullInfoList':
            // eslint-disable-next-line no-case-declarations
            const relevantData: TableMetaData[] = tableMetaDataFormatt(response.data.jobsMetadata)
            return resolve(relevantData)
          default:
            throw response
        }
      })
      .catch((error) => {
        reportError(error)
        return reject(error)
      })
  })
}

export const getAllJobMetaData = async (
  forceRefetch: boolean = false,
): Promise<TableMetaData[]> => {
  if (forceRefetch || (!globalTableMetaData.value.length && !fetchedTableMetaData)) {
    const jobDate = await fetchAllJobMetaData()
    fetchedTableMetaData = true
    globalTableMetaData.value = jobDate
  }
  return globalTableMetaData.value
}

export const getJobMetaData = async (id: number | undefined): Promise<TableMetaData> => {
  const localElntry = globalTableMetaData.value.find((table) => table.id === id || !id)
  if (localElntry) {
    return new Promise((resolve) => resolve(localElntry))
  }
  return getAllJobMetaData().then((data) => {
    const entry = data.filter((table) => table.id === id)[0]
    if (entry) {
      return entry
    }
    throw new Error('Table not found')
  })
}

export const deleteJob = async (id: number) => {
  const query = `
        mutation removeJob($jobId: Int!) {
            deleteJob(jobId: $jobId) {
                message
                status
            }
        }`
  queryGql(query, { jobId: id })
    .then((response) => {
      if (response.data.deleteJob && response.data.deleteJob.status === 'SUCCESS') {
        globalTableMetaData.value = globalTableMetaData.value.filter((table) => table.id !== id)
        return
      }
      throw response
    })
    .catch((error) => {
      reportError(error)
      return Promise.reject(error)
    })
}

export const updateOrCreateJob = async (entry: TableMetaData): Promise<void> => {
  const query = `
        mutation createOrModifyJob(
            $id: Int,
            $name: String!,
            $script: String!,
            $description: String,
            $enabled: Boolean,
            $forbidDynamicSchema: Boolean,
            $executeTimer: String,
            $parameterKv: JsonStr
            ){
            createOrModifyJob(
                id_: $id,
                name: $name,
                script: $script,
                description: $description,
                enabled: $enabled,
                forbidDynamicSchema: $forbidDynamicSchema,
                executeTimer: $executeTimer,
                paramerterKv: $parameterKv
            ) {
            ... on JobFullInfoList {
              __typename
              jobs {
                description
                enabled
                executeTimer
                executedLast
                expectedReturnSchema {
                  key
                  value
                }
                forbidDynamicSchema
                name
                id
                script
                parameters {
                  key
                  value
                }
              }
            }
            ... on Message {
              __typename
              message
              status
            }
          }
        }`
  const variables = {
    id: entry.id >= 0 ? entry.id : undefined,
    name: entry.name,
    script: entry.script,
    description: entry.description,
    enabled: entry.enabled,
    forbidDynamicSchema: entry.forbidDynamicSchema,
    executeTimer: entry.executeTimer,
    parameterKv: JSON.stringify(entry.parameters),
  }
  return new Promise((resolve, reject) => {
    queryGql(query, variables)
      .then(async(response) => {
        console.log(response)
        const key = response.providedTypes[0].type
        switch (key) {
          case 'JobFullInfoList':
            // eslint-disable-next-line no-case-declarations
            const relevantData: TableMetaData[] = tableMetaDataFormatt(response.data.createOrModifyJob)
            const newIds = relevantData.map((table) => table.id)
            globalTableMetaData.value = [
              ...globalTableMetaData.value.filter((table) => !newIds.includes(table.id)),
              ...relevantData,
            ]
            resolve()
          default:
            throw response
        }
      })
      .catch((error) => {
        reportError(error)
        reject()
      })
  })
}

export interface jobEnty {
  timestamp: number
  runtime: number
  errorMsg: string
  scriptFailure: boolean
  context: Record<string, any>
}

export interface jobEntryInput extends jobEnty {
  callId?: number | undefined
}

export const DUMMY_JOB_ENTRY: jobEnty = {
  timestamp: 0,
  runtime: 0,
  errorMsg: 'CATS_AND_DOGS',
  scriptFailure: false,
  context: {},
}

export const useJobData = (jobId: number) => {
  const pfraseeJobEntry = (entry: Record<any, any>): Record<number, jobEnty> => {
    const callId: number = entry.callId!
    delete entry.callId
    try {
      if (entry.context && typeof entry.context === 'string') {
        //  this should be done by gql but we may call it from other places
        entry.context = JSON.parse(entry.context)
      }
    } catch {
      entry.context = {}
    }
    return { [callId]: entry as jobEnty }
  }

  const fetchData = async (
    range: [number, number] | undefined = undefined,
    specificRows: number[] | undefined = undefined,
    lastN: number | undefined = undefined,
  ): Promise<Record<number, jobEnty>> => {
    const query = `
                query JobEntryLookup($jobId: Int!, $lastN: Int, $range: PaginationInput, $specificRows: [Int!]) {
                    getJobEntries(
                        jobId: $jobId,
                        newestN: $lastN,
                        range_: $range,
                        specificRows: $specificRows
                    ) {
                        ... on JobEntryList {
                        __typename
                        jobs {
                            callId
                            context
                            errorMsg
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
            `
    return queryGql(query, {
      jobId: jobId,
      lastN: lastN,
      range: range
        ? {
            max: range[1],
            startElement: range[0],
          }
        : undefined,
      specificRows: specificRows,
    })
      .then((response) => {
        const key = response.providedTypes[0].type
        switch (key) {
          case 'JobEntryList':
            // eslint-disable-next-line no-case-declarations
            const entries: Record<number, jobEnty> = response.data.getJobEntries.jobs.reduce(
              (acc: Record<number, jobEnty>, entry: jobEntryInput) => {
                return { ...acc, ...pfraseeJobEntry(entry) }
              },
              {},
            )
            return entries
          default:
            throw response
        }
      })
      .catch((error) => {
        reportError(error)
        throw error
      })
  }

  const addOrUpdateJobEntry = async (
    entry: jobEntryInput & { id?: number | undefined },
  ): Promise<Record<number, jobEnty>> => {
    // This is a workaround for we use mix naming for the callId and id
    const to_send: Record<string, any> = JSON.parse(JSON.stringify(entry))
    if (!to_send.callId && to_send.id !== undefined) {
      to_send.callId = to_send.id
      delete to_send.id
    }
    if (to_send.context) {
      to_send.context = JSON.stringify(to_send.context)
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
                        errorMsg
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
      entry: to_send,
    })
      .then((response) => {
        const key = response.providedTypes[0].type
        switch (key) {
          case 'JobEntry':
            return pfraseeJobEntry(response.data.addOrEditEntryInJob)
          default:
            throw response
        }
      })
      .catch((error) => {
        reportError(error)
        return Promise.reject(error)
      })
  }

  const deleteJobEntry = async (ids: number[]): Promise<number[]> => {
    const query = `
                mutation deleteEntryInJob($entryIds: [Int!]!, $jobId: Int!) {
                deleteEntryInJob(
                    entryIds: $entryIds,
                    jobId: $jobId
                    ) {
                    __typename
                    message
                    status
                    }
            }`
    return queryGql(query, {
      jobId: jobId,
      entryIds: ids,
    })
      .then((response) => {
        const key = response.providedTypes[0].type
        if (key === 'Message' && response.data.deleteEntryInJob.status === 'SUCCESS') {
          return ids
        }
        throw response
      })
      .catch((error) => {
        reportError(error)
        return Promise.reject(error)
      })
  }

  return { fetchData, addOrUpdateJobEntry, deleteJobEntry }
}
