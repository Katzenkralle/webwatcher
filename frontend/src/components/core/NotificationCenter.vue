<script setup lang="ts">
import { ref, defineProps, watch, computed, type Ref } from 'vue'
import { useStatusMessage, type StatusMessage } from '@/composable/core/AppState';
import Button from 'primevue/button';
import Message from 'primevue/message';

const props = defineProps<{ 
    xExpand: "left" | "right" | "center",
    yExpand: "top" | "bottom" | "center",
}>();

const isOpendInteractive = ref<"interactivly" | "display" | null>(null);

const displayedMessages: Ref<Record<number, StatusMessage>> = ref({})
const progress = ref<number>(0);
const PROGRESS_DURATION = 2000;
const OPEN_CLOSE_DURATION = 700; // Define the duration constant

const prevNotificationHeader = ref<string>("");

const resetStateIfClosed = () => {
    setTimeout(() => {
        if (isOpendInteractive.value == null) {
            displayedMessages.value = [];
            progress.value = 0;
        }
    }, OPEN_CLOSE_DURATION);
}

const notificationHeader = computed(() => {
    if (!isOpendInteractive.value){
        return prevNotificationHeader.value;
    }
    const mode_connection = () => {
        switch (isOpendInteractive.value) {
            case "interactivly":
                return "pending";
            case "display":
                return "new";
            default:
                return "";
        }
    }
    const len = Object.keys(displayedMessages.value).length;
    const header = `${len} ${mode_connection()} Notification${len > 1 ? 's' : ''}`;
    prevNotificationHeader.value = header;
    return header;
});

watch(isOpendInteractive, (val, old_val) => {
    if (val == "interactivly") {
        displayedMessages.value = useStatusMessage().statusMsgList.value;
    }
    if (val == null && old_val == "interactivly") {
        resetStateIfClosed();
    }
});

watch(useStatusMessage().getRecentStatusMessage, (last_msg) => {
    if (last_msg == null || isOpendInteractive.value == "interactivly") return;
    isOpendInteractive.value = "display";
    displayedMessages.value[last_msg.index] = last_msg.msg;
    progress.value = 0;
    const interval = setInterval(() => {
        let last_index = parseInt(Object.keys(displayedMessages.value)[Object.keys(displayedMessages.value).length - 1]);
        if (isOpendInteractive.value == "interactivly" || (!isNaN(last_index) && last_index != last_msg.index)) {
            // exit early if new message is displayed or the notification is opend interactively
            // or the notification is cleared
            clearInterval(interval);
        }
        progress.value += 25;
        if (progress.value > 100 || isOpendInteractive.value == null || isNaN(last_index)) {
            clearInterval(interval);
            isOpendInteractive.value = null;
            resetStateIfClosed();
        }
    }, (PROGRESS_DURATION/4));
});

watch(
  () => useStatusMessage().statusMsgList.value,
  (msgList) => {
    if (isOpendInteractive.value === "interactivly") {
      displayedMessages.value = msgList;
    } else if (isOpendInteractive.value === "display") {
      // Only include messages that are in both msgList and displayedMessages by key
      displayedMessages.value = Object.keys(displayedMessages.value)
        .filter(key => key in msgList)
        .reduce((obj, key) => {
          // Type assertion to ensure TypeScript understands that the key exists in the object
          (obj as Record<string, any>)[key] = displayedMessages.value[parseInt(key)];
          return obj;
        }, {} as Record<string, any>);
    }
  },
  { deep: true }
);



</script>

<template>
    <div>
    <Button icon="pi pi-clock" class="ml-auto w-full h-full" 
    :severity="useStatusMessage().getRecentStatusMessage.value?.msg.severity" 
    @click="isOpendInteractive != null ? isOpendInteractive = null : isOpendInteractive = 'interactivly'"></Button>
    <div class="relative">
        <div :class="{
                'absolute flex flex-col bg-panel w-screen md:w-128 rounded-lg transition-all border-2 border-app z-20 max-w-[95vw] my-2': true,
                [`duration-${OPEN_CLOSE_DURATION}`]: true, 
                'max-h-0 translate-x-full invisible opacity-0': !isOpendInteractive, 
                'max-h-[100vh] opacity-100 visible': isOpendInteractive,
                'right-0': props.xExpand == 'left',
                'left-0': props.xExpand == 'right',
                'bottom-0': props.yExpand == 'top',
                'top-0': props.yExpand == 'bottom',
                'left-1/2 transform -translate-x-1/2': props.yExpand == 'center',
                'top-1/2 transform -translate-y-1/2': props.xExpand == 'center',
        }">
            <div class="absolute top-0 right-0 mt-2 mr-2" v-if="isOpendInteractive == 'interactivly'">
                <Button @click="() => {
                    isOpendInteractive = null;
                }" severity="danger" class="ml-auto" icon="pi pi-times"></Button>
            </div>


            <div class="flex flex-col h-full w-full p-3 overflow-y-scroll overflow-x-hidden">
                <h3 class="mx-auto mb-4 mt-2">{{ notificationHeader }}</h3>
                <div class="grid grid-cols-3 gap-y-4 justify-items-stretch">
                    <template v-if="Object.keys(displayedMessages).length" v-for="([index, msg]) in Object.entries(displayedMessages).reverse()" >
                            <span class="grid_element col-span-2">
                                <Message
                                    class="border border-2 w-full h-full"
                                    :severity="msg.severity">   
                                    <template #icon>
                                        <i :class="`pi ${msg.icon}`"></i>
                                    </template>
                                    <template #closeicon>
                                        <i class="pi pi-times-circle"></i>
                                    </template>                     
                                    <span class="flex flex-col">
                                        <p>{{ msg.msg }}</p>
                                        <p class="text-xs">{{ msg.time }}</p>
                                    </span>
                            </Message>
                            </span>
                            <span class="grid_element">
                                <Button @click="() => {
                                    useStatusMessage().removeStatusMessage([Number(index)]);
                                }" class="h-full w-fit text-center ml-2 animate-fade-in" label="Remove"/>
                            </span>    
                    </template>
                    <template v-else>
                        <p class="col-span-3 justify-stretch text-center">No Messages</p>
                    </template>
                </div>
                
                <div :class="{'w-full h-[4px] rounded-lg relative mt-4 bg-crust-d': true,
                            'invisible': isOpendInteractive == 'interactivly'}">
                    <div id="progress" class="bg-info h-full transition-all ease-linear" 
                        :style="`width: ${progress}%; transition-duration: ${(PROGRESS_DURATION / 4)}ms;`"/>
                </div>
            </div>
        </div>
        </div>
    </div>
</template>


<style lang="css" scoped>
.grid_element::after {
    content: "";
    display: block;
    border-bottom: 2px solid var(--color-text-d);
    transform: translate(0px, calc(var(--spacing) * 2));
    width: 100%;
}

</style>