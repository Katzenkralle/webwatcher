<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import router from '@/router';

import { CronPrime } from '@vue-js-cron/prime'

import { getJobMetaData, type TableMetaData } from '@/composable/api/JobAPI';
import { useStatusMessage } from '@/composable/core/AppState';
import { getAllScripts } from '@/composable/api/ScriptAPI';

import InlineMessage from 'primevue/inlinemessage';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import InputSwitch from 'primevue/inputswitch';

import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';


const isEdit = ref<boolean>(false);
const jobMetaData = ref<TableMetaData>(
    {
    id: 0,
    name: "",
    script: "",
    description: "",
    enabled: true,
    executeTimer: "0 0 * * *",
    executedLast: 0,
    forbidDynamicSchema: false,
    expectedReturnSchema: {},
    }
);
const nameStatus = computed((): {severity: string, summary: string} => {
    if (jobMetaData.value.name === "") {
        return {severity: 'warn', summary: 'Should be provided.'};
    }
    return {severity: 'success', summary: ''};
});


const availableScriptsOptions = ref<Record<string, string>[]>([]);

const getAvailableStrings = (async () => {
    availableScriptsOptions.value = await getAllScripts()
                    .then((data) => Object.keys(data)
                        .map((entry) => {return {name: entry}}));
}); 


const refreshJobMetaData = (id: string|string[]|undefined) => {
    console.log('refreshJobMetaData', id);
    if (!id) {
            isEdit.value = false;
            console.log('isEdit', isEdit.value);
            return;
    }
    let jobId: number =  Number(id);
  
    console.log('jobId', jobId);
    getJobMetaData(Number(id)).then((data: TableMetaData) => {
            jobMetaData.value = data;
            isEdit.value = true;
        }).catch((error) => {
            useStatusMessage().newStatusMessage('Job not found.', 'danger');
            router.push('/jobs');
        });
    }

onMounted(() => {
    refreshJobMetaData(router.currentRoute.value.params.id);
    getAvailableStrings()
});

watch(ref(router.currentRoute.value.params.id), (newJobId) => {
    refreshJobMetaData(newJobId);
});
</script>

<template>
    <main class="flex w-full justify-center">
        <div class="card flex flex-col">
            <div class="flex flex-row justify-between items-center">
                <h1 v-if="!isEdit">Create Job</h1>
                <h1 v-else>Edit Job</h1>
                <div class="input-box !flex-row items-center space-x-2">
                    <label for="enableToggle">Enabled</label>
                    <InputSwitch id="enableToggle" v-model="jobMetaData.enabled" />
                </div>
            </div>
            <div class="input-box">
                <label for="jobName">Name</label>
                <InputText
                    id="jobName"
                    v-model:model-value="jobMetaData.name"
                    placeholder="Who am I?"
                    :disabled="isEdit"
                    class="w-full"
                    aria-describedby="jobName"
                />
                <small id="jobName">Choose a name for the script</small>
                <InlineMessage target="jobName" :severity="nameStatus.severity">{{nameStatus.summary}}</InlineMessage>
            </div>

            <div class="input-box">
                <label for="jobDiscription">Add a discription</label>
                <Textarea 
                    id="jobDiscription" 
                    v-model="jobMetaData.description" 
                    placeholder="What do I do?"
                    autoResize 
                    rows="5"
                    cols="30" />
            </div>

            <div class="input-box">
                <label for="scriptSelector">Script</label>
                <Select 
                    id="scriptSelector"
                    :options="availableScriptsOptions"
                    placeholder="Where do I run?"
                    option-label="name"
                    option-value="name"/>              
            </div>

            <div class="input-box">
                <label for="cronSetting">Cron</label>
                <CronPrime
                    id="cronSetting"
                    v-model:model-value="jobMetaData.executeTimer"
                    class="flex flex-wrap items-baseline
                    bg-crust p-1 rounded-md [&>*]:m-1 border border-info 
                    hover:border-app
                    transition-colors duration-300 ease-in-out"
                    />
                <!-- This is a hidden input to prevent the outer
                 container from shrinking when the value of ther real input changes -->
                <CronPrime
                :model-value="'* * * * *'"
                class="h-0 opacity-0"
                />
            </div>

            <div class="input-box">
                <Button
                    label="Save"
                    security="success"
                    @click="console.log('Save')"
                />
            </div>
        </div>
    </main>
</template>