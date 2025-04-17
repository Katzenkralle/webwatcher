<script setup lang="ts">
import { ref } from 'vue';
import { Button } from 'primevue';
import SmallSeperator from './SmallSeperator.vue';
const state = ref(false);

const props = defineProps<{
    title?: string;
    message?: string;
    icon?: string;
    passthrouClasses?: string
    hideSeperator?: boolean
    closeOnly?: boolean
}>();

const openDialog = () => {
    document.body.style.overflow = 'hidden';
    state.value = true;
};

const closeDialog = () => {
    document.body.style.overflow = 'initial';
    state.value = false;
};

const emit = defineEmits(['submit', 'cancel']);
defineExpose({ openDialog, closeDialog });
</script>

<template>
    <Transition 
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
    >
        <div v-if="state" class="fixed inset-0 z-50 flex justify-center items-center bg-crust-d/90">
            <div :class="`min-w-25 min-h-25 bg-panel rounded-lg p-5 m-auto flex flex-col items-center overflow-auto
                max-h-screen max-w-screen ${passthrouClasses ? passthrouClasses : ''}`">
                <slot name="header">
                    <div class="flex flex-row justify-between items-center w-full mb-2">
                        <i :class="props.icon ? props.icon : ''"></i>
                        <h2 class="">{{ props.title ? props.title : "Dialog" }}</h2>
                        <Button icon="pi pi-times" 
                        severity="danger"
                        variant="text"
                        size="small"
                        class="col-start-3 justify-self-end"
                        @click="() => {emit('cancel'); closeDialog()}" />
                    </div>
                </slot>
                <slot>
                    <p class="w-full">{{ props.message ? props.message : "Are you sure?" }}</p>
                </slot>
                <SmallSeperator v-if="!props.hideSeperator" class="my-2" />
                <a v-else class="my-2"></a>
                <slot name="footer">
                    <div class="flex flex-row w-full justify-end space-x-2 mt-auto">
                        <template
                            v-if="!props.closeOnly">
                            <Button 
                                size="small" 
                                label="Cancel" 
                                severity="danger"
                                @click="() => {emit('submit', false); closeDialog()}" />
                            <Button
                                size="small"
                                label="Submit"
                                @click="() => {emit('submit', true); closeDialog()}" />
                        </template>
                        <template  v-else>
                            <Button 
                                size="small" 
                                label="Close" 
                                severity="danger"
                                @click="() => {emit('submit', false); closeDialog()}" />
                        </template>
                    </div>
                </slot>
            </div>
        </div>
    </Transition>
</template>
