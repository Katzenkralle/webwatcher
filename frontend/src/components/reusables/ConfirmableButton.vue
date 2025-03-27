<script setup lang="ts">
import Popover from 'primevue/popover';
import Button from 'primevue/button';
import { ref } from 'vue';

const emit = defineEmits(['confirm', 'cancel']);

const props = defineProps<{
    confirmMessage: string;
    confirmIcon: string;
    confirmClass?: string;
    buttonClass?: string;
    disabled?: boolean;
    buttonIcon: string;
    buttonLabel: string;
}>();

const confirmDialog = ref(); // Ref for the popover


</script>

<template>
    <Popover ref="confirmDialog" :showCloseIcon="false">
            <div :class="`flex flex-col space-y-2 max-w-64 ${props.confirmClass}`">
                <span>
                    <i v-if="props.confirmIcon" :class="`${props.confirmIcon} mr-1`"/>
                    {{ props.confirmMessage }}
                </span>
                <div class="w-full flex flex-row justify-end space-x-2">
                    <Button 
                        @click="() => { confirmDialog?.toggle(false); emit('cancel')}" 
                        severity="danger"
                        label="Cancel"
                        icon="pi pi-times"
                        size="small"
                        />
                    <Button 
                        @click="() => { confirmDialog?.toggle(false); emit('confirm')}" 
                        severity="succsess"
                        label="Proceed"
                        icon="pi pi-check"
                        size="small"
                        />
                </div>
            </div>
    </Popover>
    <Button @click="(e) => confirmDialog?.toggle(e)" 
        :icon="props.buttonIcon" 
        :class="props.buttonClass" 
        :label="props.buttonLabel"
        :disabled="props.disabled !== undefined ? props.disabled : false"/>
</template>