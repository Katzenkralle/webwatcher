import { queryGql, reportError, recordListToRecord } from "./QueryHandler";
import { useLoadingAnimation, useStatusMessage } from "../core/AppState";
import { ref } from "vue";


export const globalScriptData = ref<Record<string, ScriptMeta>>({});

export interface ScriptMeta {
    // name: string; is returned by the query, we put it as key in the dict
    fsPath: string;
    description: string;
    modifyedAt: string;
    expectedReturnSchema: Record<string, any>; // expected return schema of the script
    inputSchema: Record<string, string>; //  input parameters for the script
}

export interface ScriptValidationResult {
    id?: string
    valid: boolean;
    availableParameters: Record<string, string>;
    supportsStaticSchema: boolean;
    validationMsg: string;
}

const toBase64 = (file: File) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
});

const setScriptMetaData = (data: Record<string, any>[]) => {
    data.forEach((element) => {
        const { name, ...rest } = element;
        rest.inputSchema = recordListToRecord(rest.inputSchema);
        rest.expectedReturnSchema = recordListToRecord(rest.expectedReturnSchema);
        // we use the name as key in the dict        
        globalScriptData.value[name] = rest as ScriptMeta;
    });
};

export async function deleteScript(name: string) {
    useLoadingAnimation().setState(true);
    const mutation = `
    mutation {
        deleteScript(
            name: ${name}
        ) {
            __typename
            ... on jobsMetaData {
                fsPath
                description
                staticSchema
                availableParameters
            }
            ... on Message {
                message
                status
            }
          }
    }`;   
    queryGql(mutation).then((response) => {
        if (response.providedTypes[0].type === "jobsMetaData") {
            setScriptMetaData(response.data as (ScriptMeta & { name: string})[]);
            useStatusMessage().newStatusMessage("Script deleted", "success");
            return;
        }
        if(response.errors) {
            console.error(response.errors);
            throw new Error("Error deleting script:" + JSON.stringify(response.errors));
        }
        throw new Error(response.data.message);
    }).catch((e) => {
        useStatusMessage().newStatusMessage(e, "danger");
    }).finally(() => {  
        useLoadingAnimation().setState(false);
    });
}

export async function fetchScripts() {
    return queryGql(`
        query {
            __typename
            ... on jobsMetaData {
                fsPath
                name
                description
                expectedSchema
            }
            ... on Message {
                message
                status
            }
        }`
    ).then((response) => {
        const key = response.providedTypes[0].type;
        switch (key) {
            case "scripts":
                setScriptMetaData(response.data as (ScriptMeta & { name: string})[]);
                return;
            default:
                throw new Error("Error fetching scripts");
        }
    }).catch((e) => {
        globalScriptData.value = {
            script1: {
                fsPath: '/path/to/script1',
                modifyedAt: '1742369540',
                description: 'Description of script1',
                expectedReturnSchema: {},
                inputSchema: {}
            },
            script2:{
                fsPath: '/path/to/script2',
                modifyedAt: '1742369540',
                description: 'Description of script2',
                expectedReturnSchema: {"test": "string", "data": "int"},
                inputSchema: { "test": "string", "data": "int"}
            }
        };
        reportError(e);
    });
}

export async function getAllScripts() {
    if(!Object.keys(globalScriptData.value).length) {
        await fetchScripts();
    }
    return globalScriptData.value;
}

export async function validateFile(file: File, associatedScript?: String): Promise<ScriptValidationResult> {
    const formData = new FormData();
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
        }`;
    
    return queryGql(mutation, {
            file: await toBase64(file),
            name: associatedScript
        }).then((response) => {
            if(response.errors) {
                throw response;
            }
            response.data.preuploadScript.availableParameters = recordListToRecord(response.data.preuploadScript.availableParameters)
            return response.data.preuploadScript as ScriptValidationResult;
    }).catch((e) => {
        reportError(e);
        return { id:'-1', valid: false, availableParameters: {}, supportsStaticSchema: false} as ScriptValidationResult;
    });
}
export async function submitScript(name: String, discription: String, id: String): Promise<void> {
    useLoadingAnimation().setState(true);
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
                    expectedReturnSchema {
                    key
                    value
                    }
                    fsPath
                    inputSchema {
                    key
                    value
                    }
                    name
                }
                }
                ... on Message {
                __typename
                message
                status
                }
        }
        }`;
    return new Promise((resolve, reject) => {
        return queryGql(mutation, {
            id: id,
            name: name,
            discription: discription,
        }).then((response) => {
            if (response.providedTypes[0].type === "ScriptContentList") {
                console.log(response.data.uploadScriptData.scripts);
                setScriptMetaData(response.data.uploadScriptData.scripts);
                resolve();
            } 
            throw response
        }).catch((e) => {
            reportError(e);
            reject();
        }).finally(() => {
            useLoadingAnimation().setState(false);
        });
    });
}
