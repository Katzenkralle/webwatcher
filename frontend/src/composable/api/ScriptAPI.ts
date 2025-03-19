import { queryGql } from "./GqlHandler";
import { useLoadingAnimation, useStatusMessage } from "../core/AppState";
import { ref } from "vue";


export const globalScriptData = ref<Record<string, ScriptMeta>>({});

export interface ScriptMeta {
    // name: string; is returned by the query, we put it as key in the dict
    fsPath: string;
    description: string;
    modifyedAt: string;
    staticSchema: Record<string, any>; // expected return schema of the script
    availableParameters: Record<string, string>; //  input parameters for the script
}

export interface ScriptValidationResult {
    valid: boolean;
    availableParameters: Record<string, string>;
    supportsStaticSchema: boolean;
}

const toBase64 = (file: File) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
});

const setScriptMetaData = (data: (ScriptMeta & { name: string})[]) => {
    data.forEach((element) => {
        const { name, ...rest } = element;
        globalScriptData.value[name] = rest;
    });
};

export async function deleteScript(name: string) {
    useLoadingAnimation().setState(true);
    const mutation = `mutation {
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
            ... on ErrorMessage {
                message
                status
            }
          }
        }`   
    queryGql(mutation).then((response) => {
        if (response.keys[0] === "jobsMetaData") {
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
            ... on ErrorMessage {
                message
                status
            }
        }`
    ).then((response) => {
        const key = response.keys[0];
        switch (key) {
            case "scripts":
                setScriptMetaData(response.data as (ScriptMeta & { name: string})[]);
                return;
            default:
                throw new Error("Error fetching scripts");
        }
    }).catch(() => {
        globalScriptData.value = {
            script1: {
                fsPath: '/path/to/script1',
                modifyedAt: '1742369540',
                description: 'Description of script1',
                staticSchema: {},
                availableParameters: {}
            },
            script2:{
                fsPath: '/path/to/script2',
                modifyedAt: '1742369540',
                description: 'Description of script2',
                staticSchema: {"test": "string", "data": "int"},
                availableParameters: { "test": "string", "data": "int"}
            }
        };
        useStatusMessage().newStatusMessage("Error fetching scripts", "danger");
    });
}

export async function getAllScripts() {
    if(!Object.keys(globalScriptData.value).length) {
        console.log("fetching scripts");
        await fetchScripts();
    }
    console.log("returning scripts", globalScriptData.value);
    return globalScriptData.value;
}

export function useScriptAPI() {
    async function validateFile(file: File, associatedScript?: String): Promise<ScriptValidationResult> {
        const formData = new FormData();
        // we trasfer the files in the gql request with base64 encoding for
        // they will be small an this is a simple way to do it
        const mutation = `
            mutation(
                file: ${toBase64(file)},
                ${associatedScript ? "associatedScript: " + associatedScript : ""}
            ) {
                valid
                availableParameters
                supportsStaticSchema
                }
            )`;
        
        return queryGql(mutation).then((response) => {
            if(response.errors) {
                console.error(response.errors);
                throw new Error("Error validating file:" + JSON.stringify(response.errors));
            }
            return response.data as ScriptValidationResult;
        }).catch((e) => {
            useStatusMessage().newStatusMessage(e, "danger");
            return { valid: false, availableParameters: {}, supportsStaticSchema: false} as ScriptValidationResult;
        });
    }
    async function submitScript(name: String, discription: String): Promise<void> {
        useLoadingAnimation().setState(true);
        const mutation = `mutation {
            submitScript(
                name: ${name},
                description: ${discription}
            ) {
                __typename
                ... on jobsMetaData {
                    fsPath
                    description
                    staticSchema
                    availableParameters
                }
                ... on ErrorMessage {
                    message
                    status
                }
            }
                `
        return new Promise((resolve, reject) => {
            return queryGql(mutation).then((response) => {
                if (response.keys[0] === "jobsMetaData") {
                    setScriptMetaData(response.data as (ScriptMeta & { name: string})[]);
                    resolve();
                } 
                if(response.errors) {
                    console.error(response.errors);
                    throw new Error("Error submitting script:" + JSON.stringify(response.errors));
                }
                throw new Error(response.data.message);
            }).catch((e) => {
                useStatusMessage().newStatusMessage(e, "danger");
                reject();
            }).finally(() => {
                useLoadingAnimation().setState(false);
            });
        });
    }

    return {
        validateFile,
        submitScript
    };

}
