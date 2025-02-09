import { GQL_ENDPOINT } from "@/main";
import { requireLogin } from "./Auth";

export interface GQLResponse {
    data: { [key: string]: any };
    keys: string[];
    errors: any[];
}

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
        console.log(error);
        return { data: {}, keys: [], errors: [error] } as GQLResponse;
    });
}