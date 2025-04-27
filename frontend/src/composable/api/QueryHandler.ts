import { requireLogin } from './Auth'
import { useStatusMessage,  loadingBarIsLoading } from '../core/AppState'

export interface GQLResponse {
  data: { [key: string]: any }
  providedTypes: { type: string; field: string }[]
  errors: any[]
}
export const GQL_ENDPOINT = '/gql'

export function queryGql(
  query: string,
  variables: Record<string, any> | undefined = undefined,
  useLoadingBar: boolean = true,
): Promise<GQLResponse> {
  if (useLoadingBar) {
    loadingBarIsLoading.value = true
  }
  return fetch(GQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      variables: variables ?? {},
    }),
  })
    .then(async (response) => {
      return response.json().then((content) => {
        if (!content.data) {
          throw content.errors
        }
        const data = content.data
        const errors = content.errors
        const providedTypes: { type: string; field: string }[] = []
        for (const key of Object.keys(data)) {
          const __typename = data[key].__typename
          providedTypes.push({ type: __typename, field: key })
          delete data[key].__typename
          if (__typename === 'Message' && data[key].status === 'AUTH_ERROR') {
            data[key].status = 'danger'
            requireLogin()
          }
        }
        return { data: data, providedTypes: providedTypes, errors } as GQLResponse
      })
    })
    .catch((error) => {
      if (!(error instanceof Array)) {
        error = [error]
      }
      return {
        data: {},
        providedTypes: [{ type: 'gqlAPIError', field: '' }],
        errors: error,
      } as GQLResponse
    })
    .finally(() => {
      if (useLoadingBar) {
        loadingBarIsLoading.value = false
      }
    })
}

export function recordListToRecord<T extends Record<string | number, any>>(
  list: T[],
  key: string | number = 'key',
  value: string | number = 'value',
): Record<any, any> {
  const result: Record<any, any> = {}
  list.forEach((item) => {
    if (typeof item === 'object' && key in item && value in item) {
      result[item[key]] = item[value]
    }
  })
  return result
}

export function reportError(gql: GQLResponse | Error, includeDataErrors: boolean = true) {
  const statusMessage = useStatusMessage(true)

  if (gql instanceof Error) {
    statusMessage.newStatusMessage(gql.message, 'danger')
    statusMessage.fireBatch()
    return
  }
  if (gql.errors) {
    for (const error of gql.errors) {
      statusMessage.newStatusMessage(error.message, 'danger')
    }
  }
  if (includeDataErrors) {
    for (const key of gql.providedTypes) {
      if (key.type === 'Message') {
        statusMessage.newStatusMessage(gql.data[key.field].message, gql.data[key.field].status)
      }
    }
  }
  statusMessage.fireBatch()
}
