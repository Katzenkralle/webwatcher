<script setup lang="ts">
import InputText from 'primevue/inputtext';
import FileUpload, {type FileUploadSelectEvent} from 'primevue/fileupload';
import InlineMessage from 'primevue/inlinemessage';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';

import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';


import {ref, watch, reactive, computed} from 'vue';

import { useLoadingAnimation} from "@/composable/core/AppState";
import { useScriptAPI, type ScriptValidation } from "@/composable/api/ScriptAPI";
import "@/components/reusables/GoBack.vue";

// reactive needed for deep watch
const nameStatus = reactive<{field: string, severity: string, summary: string, blacklist: string[]}>({field: '', severity: 'warn', summary: 'Should be provided.', blacklist: []});
const discription = ref('');

const fileStatus = ref<{severity: string, summary: string, params: [string, string][]}>({severity: 'error', summary: 'A file must be provided.', params: []});

const onFileSelect = (file_event: FileUploadSelectEvent) => {
    useLoadingAnimation().setState(true);
    fileStatus.value = {severity: 'warn', summary: 'Validating File...',  params: []};
    useScriptAPI().validateFile(file_event.files[0]).then((response: ScriptValidation) => {
        if (response.valid) {
            fileStatus.value = {severity: 'success', summary: 'File is valid.', params: response.parameters};
        } else {
            fileStatus.value = {severity: 'error', summary: 'File is invalid.',  params: []};
        }
        useLoadingAnimation().setState(false);
    });
}

const onSubmit = () => {
    useLoadingAnimation().setState(true);
    useScriptAPI().submitScript(nameStatus.field).then((response) => {
        if (response) {
            useLoadingAnimation().setState(false);

        } else {
            fileStatus.value = {severity: 'error', summary: 'An error occured.', params: []};
        }
        useLoadingAnimation().setState(false);
    });
}

watch(nameStatus, (newVal) => {
    if (newVal.field.length > 0) {
        nameStatus.severity =  'success'
        nameStatus.summary = '';
    } else if (nameStatus.blacklist.includes(newVal.field)) {
        nameStatus.severity =  'error'
        nameStatus.summary = 'Name not allowed or already in use.';
    } 
    else {
        nameStatus.severity =  'warn'
        nameStatus.summary = 'Should be provided.';
    }
});

let noErrors = computed(() => {
    return (nameStatus.severity === 'success' || nameStatus.severity === 'warn')  && fileStatus.value.severity === 'success';
});

</script>

<template>
    <main class="flex flex-col items-center w-screen">
            <GoBack />
            <h1>Upload Script</h1>
            <form class="card flex flex-col">
                    <div class="input-box">
                        <label for="scriptName">Script Name</label>
                        <InputText id="scriptName" aria-describedby="scriptNameHelp" v-model="nameStatus.field" />
                        <small id="scriptNameHelp">Choose a name for the script</small>
                        <InlineMessage target="scriptName" :severity="nameStatus.severity">{{nameStatus.summary}}</InlineMessage>
                    </div>
                    <div class="input-box">
                        <label for="scriptDiscription">Add a discription</label>
                        <Textarea id="scriptDiscription" v-model="discription" autoResize rows="5" cols="30" />
                    </div>


                    <div class="input-box"> 
                        <label for="fileSelect">Select a file to upload</label>
                        <InputGroup>
                            <InputGroupAddon>
                                <FileUpload 
                                    id="fileSelect"
                                    mode="basic" 
                                    name="demo[]" 
                                    customUpload 
                                    chooseLabel="Select File" 
                                    @select="onFileSelect" 
                                />
                            </InputGroupAddon>
                                <InlineMessage target="fileSelect" :severity="fileStatus.severity">{{ fileStatus.summary }}</InlineMessage>
                        </InputGroup>
                        <small>From this file the data is collected.</small>
                        <div :class="{
                            // We cannot use hidden here, for we need to animate the element
                            'opacity-0 w-0 h-0': fileStatus.severity !== 'success',
                            'visible opacity-100 w-auto h-auto': fileStatus.severity === 'success',
                            'transition-all duration-1000 ease-in-out overflow-hidden': true
                        }"> 
                        <DataTable :value="fileStatus.params" class="mt-4">
                            <template #header>
                                <h4>Script Parameters</h4>
                            </template>
                            <Column field="0" header="Parameter"></Column>
                            <Column field="1" header="Type"></Column>
                            <template #footer>
                                <p class="italic">The available parameters</p>
                            </template>
                        </DataTable>
                    </div>
                </div>
                <div class="input-box">
                    <Button label="Submit" :disabled="!noErrors" @click="useScriptAPI"></Button>
                </div>
            </form>
    </main>
</template>