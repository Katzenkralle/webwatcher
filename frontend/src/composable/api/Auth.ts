import { AUTH_ENDPOINT } from "@/main"
import router from "@/router";
import { queryGql, type GQLResponse } from "./GqlHandler";

export interface AuthResponse {
    access_token: string;
    token_type: string;
}
interface ErrorMessage {
    message: string;
    status: number;
}
interface User {
    username: string;
    isAdmin: boolean;
}



export function requireLogin() {
    document.cookie = "oauth2=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push({ name: "login" , query: { redirect: router.currentRoute.value.fullPath } });
}


export function useAuth() {
    const requestToken = async (username: string, password: string) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        return await fetch(`${AUTH_ENDPOINT}/token`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        }).then( async response => {
            console.log(response);
            if (!response.ok) {
                throw new Error(response.statusText ? response.statusText : 'Unknown error');
            }
            return response.json() as Promise<AuthResponse>;
        })
        .catch((resp_or_err: any) => {

            console.log("1");
            if (!(resp_or_err instanceof Error)) {
                resp_or_err = new Error(resp_or_err.statusText ? resp_or_err.statusText : 'Unknown error');
            }
            console.log(resp_or_err);
            throw resp_or_err;
        });
    }

    const getUser = async (): Promise<User | ErrorMessage> => {
        const query = `
        {
            user {
                __typename
                ... on DbUser {
                    username
                    isAdmin
                }
                ... on ErrorMessage {
                    message
                    status
                }
            }
        }`;
      
        return queryGql(query).then((response: GQLResponse) => {
            switch (response.keys[0]) {
                case "user":
                    return response.data.user as User;
                case "ErrorMessage":
                    return response.data.user as ErrorMessage;
                default:
                    console.error("Unexpected response from server");
                    throw new Error("Unexpected response from server");
                    
            }
        }).catch((error) => {
            return { message: "Unexpected response from server", status: 0 } as ErrorMessage;
        });
        
    };
    return {requestToken, getUser};
}

