import { ref, computed, type Ref } from "vue";
import  router from "@/router";

export interface StatusMessage {
    msg: string;
    severity: "secondary" | "success" | "info" | "warn" | "help" | "danger" | "contrast";
    time: string
    icon: string
}

const isLoading: Ref<boolean> = ref(false);
const statusMsg: Ref<StatusMessage[]> = ref([]); 

export const useLoadingAnimation = () => {
    const setState = (value: boolean) => {
        isLoading.value = value;
    }
    return {
        isLoading,
        setState
    }; 
};

export const useStatusMessage = () => {
    const newStatusMessage = (msg: string, severity: "secondary" | "success" | "info" | "warn" | "help" | "danger" | "contrast") => {
        let icon = "";
        switch (severity) {
            case "secondary":
                icon = "pi-equals";
                break;
            case "success":
                icon = "pi-check";
                break;
            case "info":
                icon = "pi-info";
                break;
            case "warn":
                icon = "pi-exclamation-triangle";
                break;
            case "help":
                icon = "pi-question";
                break;
            case "danger":
                icon = "pi-exclamation-triangle";
                break;
            case "contrast":
                icon = "pi-expand";
                break;
        }

        statusMsg.value.push({
            msg: msg,
            severity: severity,
            time: new Date().toLocaleTimeString(),
            icon: icon
        });
    }

    const removeStatusMessage = (index: number[], all: boolean = false) => {
        if (all) {
            statusMsg.value = [];
            return;
        }
        index.forEach((i) => {
            statusMsg.value.splice(i, 1);
        });
        return;
    }

    const getRecentStatusMessage = computed(() => {
        if (statusMsg.value.length === 0) {
            return null;
        }
        return statusMsg.value[statusMsg.value.length - 1];
    });

    const statusMsgList = computed(() => {
        return statusMsg.value;
    });

    return {
        newStatusMessage,
        removeStatusMessage,
        getRecentStatusMessage,
        statusMsgList
    }; 
};

export const useQueryRouting = () => {
    const routeToQuery = (fallback="/") => {
        let search = new URLSearchParams(window.location.search);
        const query = (search.has("redirect") ? search.get("redirect") : fallback) as string;
        console.log("Redirecting to", query);
        router.push(query);
    }
    return {
        routeToQuery
    };
}