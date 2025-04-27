import { ref, type Ref } from 'vue'
import { queryGql, reportError, recordListToRecord } from '@/composable/api/QueryHandler'

export interface JobMeta {
  id: number
  name: string
  script: string
  description: string
  enabled: boolean
  executeTimer: string
  executedLast: string
  forbidDynamicSchema: boolean
  expectedReturnSchema: Record<string, string>
  parameters: Record<string, string> // KV of parameter name and value
}

export type TableLayout = {
  key: string
  type: string
}

const tableMetaDataFormatt = (data: Record<string, any>): JobMeta[] => {
  const relevantData: JobMeta[] = []
  data.jobs.forEach((entry: Record<string, any>) => {
    if (entry.expectedReturnSchema && Array.isArray(entry.expectedReturnSchema)) {
      entry.expectedReturnSchema = recordListToRecord(entry.expectedReturnSchema)
    }
    if (entry.parameters && Array.isArray(entry.parameters)) {
      entry.parameters = recordListToRecord(entry.parameters)
    }
    relevantData.push(entry as JobMeta)
  })
  return relevantData
}

export const globalTableMetaData: Ref<JobMeta[]> = ref([])
let fetchedTableMetaData = false

const fetchAllJobMetaData = async (): Promise<JobMeta[]> => {
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
            const relevantData: JobMeta[] = tableMetaDataFormatt(response.data.jobsMetadata)
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

export const getAllJobMetaData = async (forceRefetch: boolean = false): Promise<JobMeta[]> => {
  if (forceRefetch || (!globalTableMetaData.value.length && !fetchedTableMetaData)) {
    const jobDate = await fetchAllJobMetaData()
    fetchedTableMetaData = true
    globalTableMetaData.value = jobDate
  }
  return globalTableMetaData.value
}

export const getJobMetaData = async (id: number | undefined): Promise<JobMeta> => {
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

export const updateOrCreateJob = async (entry: JobMeta): Promise<void> => {
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
      .then(async (response) => {
        const key = response.providedTypes[0].type
        switch (key) {
          case 'JobFullInfoList':
            // eslint-disable-next-line no-case-declarations
            const relevantData: JobMeta[] = tableMetaDataFormatt(response.data.createOrModifyJob)
            // eslint-disable-next-line no-case-declarations
            const newIds = relevantData.map((table) => table.id)
            globalTableMetaData.value = [
              ...globalTableMetaData.value.filter((table) => !newIds.includes(table.id)),
              ...relevantData,
            ]
            resolve()
            break
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
