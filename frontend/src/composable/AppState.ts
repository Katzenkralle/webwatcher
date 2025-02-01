import { ref, computed, type Ref } from "vue";
import  router from "@/router";

export interface StatusMessage {
    msg: string;
    severity: "secondary" | "success" | "info" | "warn" | "help" | "danger" | "contrast";
    time: string
    icon: string
}

const isLoading: Ref<boolean> = ref(false);
const statusMsg: Ref<Record<number, StatusMessage>> = ref({});

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
        const keys = Object.keys(statusMsg.value).map(k => k);
        statusMsg.value[keys.length-1 >=0 ? parseInt(keys[keys.length-1])+1 : 0] = ({
            msg: msg,
            severity: severity,
            time: new Date().toLocaleTimeString(),
            icon: icon,
        });
    }

    const removeStatusMessage = (index: number[], all: boolean = false) => {
        console.log("Removing", index);
        if (all) {
            statusMsg.value = [];
            return;
        }
        index.forEach((i) => {
            // For some reason, the index is a string, so we need to convert it to an integer
            // this happens at some point but I have absolutely no idea where...
            i = typeof i === "string" ? parseInt(i) : i;
            statusMsg.value = Object.fromEntries(Object.entries(statusMsg.value).filter(([k, v]) => parseInt(k) !== i));
        });
        return;
    }

    const getRecentStatusMessage = computed(() => {
        const keys = Object.keys(statusMsg.value).map(k => k);
        if (keys.length === 0) {
            return null;
        }
        const last = parseInt(keys[keys.length-1]);
        return {"index": last, "msg": statusMsg.value[last]};
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