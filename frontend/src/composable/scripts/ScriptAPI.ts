import { queryGql, reportError, recordListToRecord } from '@/composable/api/QueryHandler'
import { useStatusMessage } from '@/composable/core/AppState'
import { ref } from 'vue'

export const globalScriptData = ref<Record<string, ScriptMeta>>({})

export interface ScriptMeta {
  // name: string; is returned by the query, we put it as key in the dict
  fsPath: string
  description: string
  lastModified: string
  supportsStaticSchema: boolean
  inputSchema: Record<string, string> //  input parameters for the script
}

export interface ScriptValidationResult {
  id?: string
  valid: boolean
  availableParameters: Record<string, string>
  supportsStaticSchema: boolean
  validationMsg: string
}

const toBase64 = (file: File) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
  })

const setScriptMetaData = (data: Record<string, any>[]) => {
  data.forEach((element) => {
    const { name, ...rest } = element
    if (rest.inputSchema) {
      rest.inputSchema = recordListToRecord(rest.inputSchema)
    }
    // we use the name as key in the dict
    globalScriptData.value[name] = rest as ScriptMeta
  })
}

export async function deleteScript(name: string) {
  const mutation = `
    mutation removeScript ($name: String!) {
        deleteScript(name: $name) {
            message
            status
        }
        }`
  queryGql(mutation, { name: name })
    .then((response) => {
      if (response.data.deleteScript.status === 'SUCCESS') {
        delete globalScriptData.value[name]
        return
      }
      if (response.errors) {
        console.error(response.errors)
        throw new Error('Error deleting script:' + JSON.stringify(response.errors))
      }
      throw new Error(response.data.message)
    })
    .catch((e) => {
      useStatusMessage().newStatusMessage(e, 'danger')
    })
}

export async function removeTemporaryScripts() {
  const mutation = `
    mutation removeTemporaryScripts {
        removeTemporaryScripts {
            message
            status
        }
        }`
  return queryGql(mutation)
    .then((response) => {
      if (response.data.removeTemporaryScripts.status === 'SUCCESS') {
        useStatusMessage().newStatusMessage(
          response.data.removeTemporaryScripts.message,
          response.data.removeTemporaryScripts.status,
        )
      }
      throw response
    })
    .catch((e) => {
      reportError(e)
    })
}

export async function fetchScripts() {
  return queryGql(`
        query fetchScripts{
            scriptsMetadata {
            ... on ScriptContentList {
            __typename
            scripts {
                description
                fsPath
                lastModified
                name
                inputSchema {
                key
                value
                }
                supportsStaticSchema
            }
            }
            ... on Message {
            __typename
            message
            status
            }
        }
        }`)
    .then((response) => {
      const key = response.providedTypes[0].type
      switch (key) {
        case 'ScriptContentList':
          setScriptMetaData(response.data.scriptsMetadata.scripts)
          return
        default:
          throw new Error('Error fetching scripts')
      }
    })
    .catch((e) => {
      reportError(e)
    })
}

export async function getAllScripts() {
  if (!Object.keys(globalScriptData.value).length) {
    await fetchScripts()
  }
  return globalScriptData.value
}

export async function validateFile(
  file: File,
  associatedScript?: string,
): Promise<ScriptValidationResult> {
  // we trasfer the files in the gql request with base64 encoding for
  // they will be small an this is a simple way to do it
  const mutation = `
        mutation ValidateFile($file: B64Str!, $name: String) {
        preuploadScript(
            file: $file,
            name: $name
        ) {
            valid
            id
            availableParameters {
                key
                value
            }
            supportsStaticSchema
            validationMsg
            }
        }`

  return queryGql(mutation, {
    file: await toBase64(file),
    name: associatedScript,
  })
    .then((response) => {
      if (response.errors) {
        throw response
      }
      response.data.preuploadScript.availableParameters = recordListToRecord(
        response.data.preuploadScript.availableParameters,
      )
      return response.data.preuploadScript as ScriptValidationResult
    })
    .catch((e) => {
      reportError(e)
      return {
        id: '-1',
        valid: false,
        availableParameters: {},
        supportsStaticSchema: false,
      } as ScriptValidationResult
    })
}
export async function submitScript(
  name: string,
  discription: string,
  id: string | undefined,
): Promise<void> {
  const mutation = `mutation submitScript($name: String!, $discription: String!, $id: String) {
        uploadScriptData(
            id_: $id,
            name: $name,
            description: $discription
        ) {
            ... on ScriptContentList {
                __typename
                scripts {
                    description
                    fsPath
                    inputSchema {
                    key
                    value
                    }
                    name
                    supportsStaticSchema
                    lastModified
                }
                }
                ... on Message {
                __typename
                message
                status
                }
        }
        }`
  return new Promise((resolve, reject) => {
    return queryGql(mutation, {
      id: id,
      name: name,
      discription: discription,
    })
      .then((response) => {
        if (response.providedTypes[0].type === 'ScriptContentList') {
          setScriptMetaData(response.data.uploadScriptData.scripts)
          resolve()
        }
        throw response
      })
      .catch((e) => {
        reportError(e)
        reject()
      })
  })
}
