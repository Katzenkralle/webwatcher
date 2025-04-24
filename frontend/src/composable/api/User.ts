import { queryGql, reportError, type GQLResponse } from '@/composable/api/QueryHandler'
import { ref } from 'vue'
import { useLoadingAnimation, useStatusMessage } from '../core/AppState'

export interface User {
  username: string
  isAdmin: boolean
}

const curentUser = ref<User | null>(null)

export const getUser = async (forceRefetch: boolean = false): Promise<User> => {
  if (!forceRefetch && curentUser.value) {
    return curentUser.value
  }

  const query = `
    {
        user {
            __typename
            ... on User {
                username
                isAdmin
            }
            ... on Message {
                message
                status
            }
        }
    }`

  return queryGql(query)
    .then((response: GQLResponse) => {
      switch (response.providedTypes[0].type) {
        case 'User':
          curentUser.value = response.data.user as User
          return curentUser.value
        default:
          throw response
      }
    })
    .catch((error: GQLResponse | Error) => {
      reportError(error)
      throw error
    })
}

export const allUsers = async (): Promise<User[]> => {
  const query = `
    {
        allUsers {
            ... on UserList {
            __typename
            users {
                isAdmin
                username
            }
            }
            ... on Message {
            __typename
            message
            status
            }
        }
    }`

  return queryGql(query)
    .then((response: GQLResponse) => {
      switch (response.providedTypes[0].type) {
        case 'UserList':
          return response.data.allUsers.users as User[]
        default:
          throw response
      }
    })
    .catch((error: GQLResponse | Error) => {
      reportError(error)
      throw error
    })
}

export const createUser = async (
  newUser: User & { password: string; currentPassword: string },
): Promise<User> => {
  useLoadingAnimation().setState(true)
  const mutation = `
    mutation createNewUser ($password: String!, $username: String!, $currentPassword: String!, $isAdmin: Boolean) {
        createUser(
            password: $password,
            username: $username,
            currentUserPassword: $currentPassword,
            isAdmin: $isAdmin
        ) {
            __typename
            ... on User {
            isAdmin
            username
            }
            ... on Message {
            message
            status
            }
        }
    }`

  return queryGql(mutation, newUser)
    .then((response: GQLResponse) => {
      switch (response.providedTypes[0].type) {
        case 'User':
          useStatusMessage().newStatusMessage('User created', 'success')
          return response.data.createUser as User
        default:
          throw response
      }
    })
    .catch((error: GQLResponse | Error) => {
      reportError(error)
      throw error
    })
    .finally(() => {
      useLoadingAnimation().setState(false)
    })
}

export const deleteUser = async (username: string): Promise<void> => {
  useLoadingAnimation().setState(true)
  const mutation = `
    mutation {
        deleteUser(username: "${username}") {
        __typename
        ... on Message {
                message
                status
            }
        }
    }`

  return queryGql(mutation)
    .then((response: GQLResponse) => {
      if (!response.errors && response.data.deleteUser.status === 'SUCCESS') {
        useStatusMessage().newStatusMessage(
          response.data.deleteUser.message,
          response.data.deleteUser.status,
        )
        return
      }
      throw response
    })
    .catch((error: GQLResponse | Error) => {
      reportError(error)
      throw error
    })
    .finally(() => {
      useLoadingAnimation().setState(false)
    })
}
