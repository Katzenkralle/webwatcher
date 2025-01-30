<script setup lang="ts">
import { ref, defineProps, watch } from 'vue'
import { useStatusMessage, type StatusMessage } from '@/composable/AppState';
import Button from 'primevue/button';
import Message from 'primevue/message';

const props = defineProps<{ 
    xExpand: "left" | "right" | "center",
    yExpand: "top" | "bottom" | "center",
}>();

const isOpendInteractive = ref<"interactivly" | "display" | null>(null);

const displayedMessages = ref<StatusMessage[]>([]);
const progress = ref<number>(0);
const PROGRESS_DURATION = 2000;

watch(isOpendInteractive, (val, old_val) => {
    if (val == "interactivly") {
        displayedMessages.value = useStatusMessage().statusMsgList.value;
    }
    if (val == null && old_val == "interactivly") {
        setTimeout(() => {
            isOpendInteractive.value = null;
        }, 700);
    }
});

watch(useStatusMessage().getRecentStatusMessage, (msg) => {
    if (msg == null || isOpendInteractive.value == "interactivly") return;
    isOpendInteractive.value = "display";
    displayedMessages.value.includes(msg) ? null : displayedMessages.value.push(msg)
    progress.value = 0;
    let prev_progress: number
    const interval = setInterval(() => {
        if (prev_progress === progress.value || isOpendInteractive.value == "interactivly" || !displayedMessages.value) {
            // exit early if new message is displayed or the notification is opend interactively
            // or the notification is cleared
            clearInterval(interval);
        }
        prev_progress = progress.value;
        progress.value += 25;
        if (progress.value >= 100) {
            clearInterval(interval);
            isOpendInteractive.value = null;
            setTimeout(() => {
                progress.value = 0;
            }, 700);
        }
    }, PROGRESS_DURATION/4);
});

const removeMessage = (msg: StatusMessage) => {
    const index = useStatusMessage().statusMsgList.value?.indexOf(msg);
    if (index !== undefined && index !== null) {
        useStatusMessage().removeStatusMessage([index]);
    }
}

</script>

<template>
    <div class="">
    <Button icon="pi pi-clock" class="ml-auto" 
    :severity="useStatusMessage().getRecentStatusMessage.value?.severity" 
    @click="isOpendInteractive != null ? isOpendInteractive = null : isOpendInteractive = 'interactivly'"></Button>
    <div class="relative">
        <div :class="{'absolute bg-panel rounded-lg overflow-hidden transition-all duration-700 min-w-64 border-2 border border-app': true,
                'invisable opacity-0': isOpendInteractive == null,
                'right-0': props.xExpand == 'left',
                'left-0': props.xExpand == 'right',
                'bottom-0': props.yExpand == 'top',
                'top-0': props.yExpand == 'bottom',
                'left-1/2 transform -translate-x-1/2': props.yExpand == 'center',
                'top-1/2 transform -translate-y-1/2': props.xExpand == 'center',
        }">
            <div class="flex flex-col h-full w-full p-3 overflow-y-scroll">
                <h3 class="mx-auto">{{ (isOpendInteractive == "display" ? "New " : "") + "Notifications"}}</h3>
                <div v-if="displayedMessages" v-for="msg in displayedMessages">
                    <Message
                        class="border border-2 mt-2" 
                        :severity="msg.severity" 
                        closable
                        @close="removeMessage(msg)"> 
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
                </div>
                <div v-else>
                    <p>No new notifications</p>
                </div>
                <div class="w-full h-[2px] relative mt-4">
                    <div id="progress" :class="{
                        'bg-info h-full transition-all ease-linear': true,
                        ['duration-' + PROGRESS_DURATION / 4]: true,
                        'invisible': isOpendInteractive == 'interactivly',
                    }" :style="`width: ${progress}%`"></div>
                </div>
            </div>
        </div>
        </div>
    </div>
</template>