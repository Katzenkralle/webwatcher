import { ref } from "vue";

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