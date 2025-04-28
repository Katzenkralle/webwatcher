import { queryGql, reportError } from '@/composable/api/QueryHandler'

export interface jobEnty {
  timestamp: string
  runtime: number
  errorMsg: string
  scriptFailure: boolean
  context: Record<string, any>
}

export interface jobEntryInput extends jobEnty {
  callId?: number | undefined
}

export const DUMMY_JOB_ENTRY: jobEnty = {
  timestamp: 'sometime',
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
            newestFirst: true,
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
