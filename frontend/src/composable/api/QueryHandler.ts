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
    providedTypes: {type: string, field: string}[];
    errors: any[];
}
export const GQL_ENDPOINT = '/gql'

export function queryGql(query: string, variables:  Record<string, any>|undefined = undefined): Promise<GQLResponse> {
    return fetch(GQL_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            query: query,
            variables: variables ?? {}
            }),
    }).then(async response => {
        return response.json().then(content => {
            if (!(content.data)){
                throw content.errors
            }
            let data = content.data;
            let errors = content.errors;
            let providedTypes: {type: string, field: string}[] = [];
            for (let key of Object.keys(data)) {
                let __typename = data[key].__typename;
                providedTypes.push({type: __typename, field: key});
                delete data[key].__typename;
                if (__typename === "Message" && data[key].status === "AUTH_ERROR") {
                    data[key].status = "danger";
                    requireLogin();
                }
            }
            return { data: data, providedTypes: providedTypes, errors } as GQLResponse;
        });
    }).catch((error) => {
        if (!(error instanceof Array)) {
            error = [error];
        }
        return { data: {}, providedTypes: [{type: "gqlAPIError", field: ''}], errors: error } as GQLResponse;
    });
}


export function reportError(gql: GQLResponse|Error, includeDataErrors: boolean = true) {
    const statusMessage = useStatusMessage(true);
    
    if (gql instanceof Error) {
        statusMessage.newStatusMessage(gql.message, "danger");
        statusMessage.fireBatch();
        return;
    }
    if (gql.errors){
        for (let error of gql.errors) {
            statusMessage.newStatusMessage(error.message, "danger");
        }
    }
    if (includeDataErrors){
        for (let key of gql.providedTypes) {
            if (key.type === "Message") {
                statusMessage.newStatusMessage(gql.data[key.field].message, gql.data[key.field].status);
            }
        }
    }
    statusMessage.fireBatch();
}