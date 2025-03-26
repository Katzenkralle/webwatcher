import { requireLogin } from "./Auth";
import { useStatusMessage } from "../core/AppState";

export type ErrorTypes = "SUCCESS" |
    "AUTH_ERROR" |
    "PREMISSION_ERROR" |
    "FAILURE" |
    "NETWORK_ERROR" |
    "WARNING" |
    "OK" |
    "NOT_OK" |
    "UNHEALTHY" |
    "TIMEOUT" |
    "CATS_AND_DOGS";

export interface GQLResponse {
    data: { [key: string]: any };
    keys: string[];
    errors: any[];
}
export const GQL_ENDPOINT = '/gql'

export function queryGql(query: string): Promise<GQLResponse> {
    return fetch(GQL_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query }),
    }).then(async response => {
        return response.json().then(content => {
            if (!(content.data)){
                return { data: {}, keys: [], errors: content.errors } as GQLResponse;
            }
            let data = content.data;
            let keys = Object.keys(data);
            let errors = content.errors;
            for (let key of keys) {
                let __typename = data[key].__typename;
                delete data[key].__typename;
                if (__typename === "ErrorMessage" && data[key].status === "AUTH_ERROR") {
                    requireLogin();
                }
            }
            return { data: data, keys, errors } as GQLResponse;
        });
    }).catch((error) => {
        console.error(error);
        return { data: {}, keys: [], errors: [error] } as GQLResponse;
    });
}


export function reportError(gql: GQLResponse|Error, includeDataErrors: boolean = true) {
    const statusMessage = useStatusMessage(true);
    
    if (gql instanceof Error) {
        statusMessage.newStatusMessage(gql.message, "danger");
        statusMessage.fireBatch();
        return;
    }

    for (let error of gql.errors) {
        statusMessage.newStatusMessage(error.message, "danger");
    }
    if (includeDataErrors){
        for (let key of gql.keys) {
            if (gql.data[key] === "ErrorMessage") {
                statusMessage.newStatusMessage(gql.data[key].message, "danger");
            }
        }
    }
    statusMessage.fireBatch();
}