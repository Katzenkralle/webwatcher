import { AUTH_ENDPOINT } from '@/main'
import router from '@/router'
import { queryGql, reportError, type GQLResponse } from './QueryHandler'
import { useStatusMessage, loadingBarIsLoading } from '../core/AppState'

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface SessionData {
  created: string
  name: string
}

const readToken = () => {
  const token = document.cookie.split('; ').find((row) => row.startsWith('oauth2='))
  if (token) {
    return token.split('=')[1]
  }
  return null
}

export const getSessionFromJWT = () => {
  let token = readToken()
  if (!token) {
    return null
  }
  token = token.split(' ')[1] // Get the payload part
  try {
    // Phrase JWT
    const base64Url = token.split('.')[1] // Get the payload part
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/') // Base64 adjustments
    return JSON.parse(JSON.parse(atob(base64)).sub) // Decode and parse JSON
  } catch {
    return { user: '', session: '', name: '' }
  }
}

export function writeAuthCookie(type: string, token: string, allowInsecure: boolean = false) {
  document.cookie = `oauth2=${type} ${token};${allowInsecure ? '' : 'secure;'}path=/;samesite=strict;Max-Age=63158400`
  if (allowInsecure) {
    useStatusMessage().newStatusMessage(
      'You are using a insecure connection. Please use HTTPS.',
      'warn',
    )
  }
}

export function requireLogin() {
  if (readToken()) {
    useStatusMessage().newStatusMessage('You have been loged out!', 'danger')
  }
  document.cookie = 'oauth2=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
}

export const changePassword = async (oldPassword: string, newPassword: string) => {
  const query = `
    mutation changePassword($oldPassword: String!, $newPassword: String!) {
        changePassword(
            oldPassword: $oldPassword,
            newPassword: $newPassword
            ) {
            __typename
            ... on Message {
                message
                status
            }
        }
    }`
  return queryGql(query, { oldPassword: oldPassword, newPassword: newPassword })
    .then((response: GQLResponse) => {
      useStatusMessage().newStatusMessage(
        response.data.changePassword.message,
        response.data.changePassword.status,
      )
    })
    .catch((error) => {
      reportError(error)
    })
}

export const logout = async (
  sessionName: string | undefined = undefined,
  sessionId: string | undefined = undefined,
): Promise<void> => {
  let logoutThisInstance = false
  const thisSession = getSessionFromJWT()
  if (
    (sessionName && sessionName === thisSession.name) ||
    (sessionId && thisSession.session == sessionId) ||
    (!sessionName && !sessionId)
  ) {
    sessionId = thisSession.session
    logoutThisInstance = true
  }

  const query = `
      mutation logout($sessionId: String, $sessionName: String) {
        logout(
            sessionId: $sessionId,
            sessionName: $sessionName
        ) {
        __typename
        ... on Message {
            message
            status
        }
        }
    }`
  return new Promise((resolve, reject) => {
    queryGql(query, { sessionId: sessionId ?? '', sessionName: sessionName ?? '' })
      .then((response: GQLResponse) => {
        if (!response.data.logout) {
          throw response
        }
        useStatusMessage().newStatusMessage(
          response.data.logout.message,
          response.data.logout.status,
        )
        if (logoutThisInstance) {
          requireLogin()
        }
        resolve()
      })
      .catch((error) => {
        reportError(error)
        reject()
      })
  })
}

export const requestToken = async (
  username: string,
  password: string,
  name: string | undefined = undefined,
) => {
  loadingBarIsLoading.value.continuous.loading = true
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)
  if (name) {
    formData.append('client_id', name)
  }
  return await fetch(`${AUTH_ENDPOINT}/token`, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorBody = await response.text()
        const errorMsg = `${response.statusText ?? 'Unknown error'}: ${JSON.parse(errorBody).detail}`
        throw new Error(errorMsg)
      }
      return response.json() as Promise<AuthResponse>
    })
    .catch((resp_or_err: any) => {
      if (!(resp_or_err instanceof Error)) {
        resp_or_err = new Error(resp_or_err.statusText ? resp_or_err.statusText : 'Unknown error')
      }
      throw resp_or_err
    })
    .finally(() => {
      loadingBarIsLoading.value.continuous.loading = false
    })
}

export const getAllSessions = async () => {
  const query = `
    {
        sessions {
            ... on Message {
            __typename
            message
            status
            }
            ... on SessionList {
            __typename
            sessions {
                created
                name
            }
            }
        }      
    }`
  return queryGql(query)
    .then((response: GQLResponse) => {
      switch (response.providedTypes[0].type) {
        case 'SessionList':
          return response.data.sessions.sessions as SessionData[]
        default:
          throw response
      }
    })
    .catch((error) => {
      reportError(error)
      return []
    })
}
