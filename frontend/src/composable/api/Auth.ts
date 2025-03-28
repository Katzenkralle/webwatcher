import { AUTH_ENDPOINT } from "@/main"
import router from "@/router";
import { queryGql, type GQLResponse } from "./QueryHandler";
import { ref } from "vue";
import { useStatusMessage } from "../core/AppState";


export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface SessionData {
    expiration: string;
    sessionId: string;
}

interface Message {
    message: string;
    status: number;
}
interface User {
    username: string;
    isAdmin: boolean;
}

export const getSessionFromJWT = () => {
    let token = document.cookie.split('; ').find(row => row.startsWith('oauth2='));
    token = token ? token.split('=')[1] : undefined;
    if (!token) {
        return null;
    }
    token = token.split(' ')[1]; // Get the payload part
    try {
        // Phrase JWT
        const base64Url = token.split('.')[1]; // Get the payload part
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/'); // Base64 adjustments
        return JSON.parse(JSON.parse(atob(base64)).sub); // Decode and parse JSON
    }
    catch (e) {
        return {user: "", session: ""}
    }
}


export function requireLogin() {
    document.cookie = "oauth2=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push({ name: "login" , query: { redirect: router.currentRoute.value.fullPath } });
}

export const changePassword = async (oldPassword: string, newPassword: string) => {
    const query = `
    mutation {
        changePassword(oldPassword: "${oldPassword}", newPassword: "${newPassword}") {
            __typename
            ... on Message {
                message
                status
            }
        }
    }`;
    return queryGql(query).then((response: GQLResponse) => {
        console.log(response);
        useStatusMessage().newStatusMessage(response.data.changePassword.message, response.data.changePassword.status);
    }).catch((error) => {
        reportError(error);
    });
}

export const logout = async (sessionId: string|undefined = undefined): Promise<void> => {
    let logoutThisInstance = false;
    const thisSessionId = getSessionFromJWT().session
    if (!sessionId || thisSessionId == sessionId) {
        sessionId = thisSessionId
        logoutThisInstance = true;
    }

    const query = `
      mutation {
        logout(sessionId: "${sessionId}") {
        __typename
        ... on Message {
            message
            status
        }
        }
    }`;
    return new Promise((resolve, reject) => {
        queryGql(query).then((response: GQLResponse) => {
            useStatusMessage().newStatusMessage(response.data.logout.message, response.data.logout.status);
            if (logoutThisInstance) {
                requireLogin();
            }
            resolve();
        }).catch((error) => {
            reportError(error);
            reject();
        })
    });
}

export const requestToken = async (username: string, password: string) => {
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
        if (!response.ok) {
            throw new Error(response.statusText ? response.statusText : 'Unknown error');
        }
        console.log("Response: ", response);
        return response.json() as Promise<AuthResponse>;
    })
    .catch((resp_or_err: any) => {
        if (!(resp_or_err instanceof Error)) {
            resp_or_err = new Error(resp_or_err.statusText ? resp_or_err.statusText : 'Unknown error');
        }
        console.error(resp_or_err);
        throw resp_or_err;
    });
}

export const getUser = async (): Promise<User | Message> => {
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
    }`;
    
    return queryGql(query).then((response: GQLResponse) => {
        switch (response.keys[0]) {
            case "user":
                return response.data.user as User;
            case "Message":
                return response.data.user as Message;
            default:
                console.error("Unexpected response from server");
                throw new Error("Unexpected response from server");
                
        }
    }).catch((error) => {
        return { message: "Unexpected response from server", status: 0 } as Message;
    });
};

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
                expiration
                sessionId
            }
            }
        }      
    }`;
    return queryGql(query).then((response: GQLResponse) => {
        switch (response.keys[0]) {
            case "sessions":
                return response.data.sessions as SessionData[];
            default:
                throw response
        }
    }).catch((error) => {
        reportError(error);
        return [];
    });
};

