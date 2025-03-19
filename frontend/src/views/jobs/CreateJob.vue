<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import router from '@/router';

import { CronPrime } from '@vue-js-cron/prime'

import { useTableMetaData } from '@/composable/api/JobAPI';
import { useStatusMessage } from '@/composable/core/AppState';
import { getAllScripts } from '@/composable/api/ScriptAPI';

import InlineMessage from 'primevue/inlinemessage';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';

import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';


const isEdit = ref<boolean>(false);
const jobMetaData = ref(
    {
    id: 0,
    name: "",
    script: "",
    description: "",
    enabled: false,
    executeTimer: 0,
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
    useTableMetaData().getTaleMetaData(Number(id)).then((data) => {
            jobMetaData.value = data;
            isEdit.value = true;
        }).catch((error) => {
            useStatusMessage().newStatusMessage('Job not found.', 'danger');
            router.push('/tables');
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
    <main>
        <div class="flex flex-col items-center w-screen">
            <h1>Create Job</h1>
            <InputGroup>
                <label for="jobName">Name</label>
                <InputText
                    id="jobName"
                    v-model:model-value="jobMetaData.name"
                    placeholder="Name"
                    aria-describedby="jobName"
                />
                <small id="jobName">Choose a name for the script</small>
                <InlineMessage target="scriptName" :severity="nameStatus.severity">{{nameStatus.summary}}</InlineMessage>
            </InputGroup>

            <InputGroup>
                <label for="jobDiscription">Add a discription</label>
                <Textarea 
                    id="jobDiscription" 
                    v-model="jobMetaData.description" 
                    autoResize 
                    rows="5"
                    cols="30" />
            </InputGroup>

            <InputGroup>
                <label for="script">Script</label>
                <Select 
                    :options="availableScriptsOptions"
                    option-label="name"
                    option-value="name"/>              
            </InputGroup>


            <InputGroup>
                <CronPrime></CronPrime>
            </InputGroup>
        </div>
    </main>
</template>