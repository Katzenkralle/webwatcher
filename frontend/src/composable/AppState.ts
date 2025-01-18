import { ref } from "vue";
import  router from "@/router";
const isLoading = ref(false);
const statusMsg = ref("");

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
    const setState = (value: string) => {
        statusMsg.value = value;
    }
    return {
        statusMsg,
        setState
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