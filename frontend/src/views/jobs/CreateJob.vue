<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import router from '@/router';

import { CronPrime } from '@vue-js-cron/prime'

import { getJobMetaData, updateOrCreateJob, type TableMetaData } from '@/composable/api/JobAPI';
import { useStatusMessage } from '@/composable/core/AppState';
import { getAllScripts, globalScriptData } from '@/composable/api/ScriptAPI';

import InlineMessage from 'primevue/inlinemessage';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import InputSwitch from 'primevue/inputswitch';
import FloatLabel from 'primevue/floatlabel';

import NavButtons from '@/components/reusables/NavButtons.vue';
import EditEntryPopup from '@/components/jobs/EditEntryPopup.vue';

const isEdit = ref<boolean>(false);
const jobMetaData = ref<Omit<TableMetaData, 'parameters'> & {parameters: Record<string, [string, any]>}>(
    {
    id: -1,
    name: "",
    script: "",
    description: "",
    enabled: true,
    executeTimer: "0 0 * * *",
    executedLast: 0,
    forbidDynamicSchema: false,
    expectedReturnSchema: {},
    parameters: {}
    }
);
const nameStatus = computed((): {severity: string, summary: string} => {
    if (jobMetaData.value.name === "") {
        return {severity: 'warn', summary: 'Should be provided.'};
    }
    return {severity: 'success', summary: ''};
});


const availableScriptsOptions = ref<Record<string, string>[]>([]);

const newParameterKvLayout = async (scriptName: string): Promise<Record<string, [string, any]>> => {
    const allScripts = await getAllScripts();
    return allScripts[scriptName] 
        ? Object.keys(allScripts[scriptName].inputSchema)
            .reduce((acc, key) => {
                acc[key] = [allScripts[scriptName].inputSchema[key], null];
                return acc;
            }, {} as Record<string, [string, any]>)
        : {}
};

const getAvailableStrings = (async () => {
    const allScripts = await getAllScripts();
    
    jobMetaData.value.parameters = await newParameterKvLayout(jobMetaData.value.script);
    availableScriptsOptions.value = Object.keys(allScripts)
                        .map((entry) => {return {name: entry, description: allScripts[entry].description};});
}); 


const refreshJobMetaData = (id: string|string[]|undefined) => {
    if (!id) {
            isEdit.value = false;
            return;
    }
    let jobId: number =  Number(id);
    getJobMetaData(Number(id)).then(async (data: TableMetaData) => { 
            jobMetaData.value = {...data, 
                parameters: await newParameterKvLayout(data.script)
            };
            isEdit.value = true;
        }).catch((error) => {
            useStatusMessage().newStatusMessage('Job not found.', 'danger');
            router.push('/jobs');
        });
    }

onMounted(() => {
    getAvailableStrings()
    refreshJobMetaData(router.currentRoute.value.params.id);
});

watch(ref(router.currentRoute.value.params.id), (newJobId) => {
    refreshJobMetaData(newJobId);
});
</script>

<template>
    <main>
        <div>
            <div class="flex flex-wrap items-center justify-between pt-3">
                <NavButtons />
                <h1 class="m-0!">{{ !isEdit ? 'Create Job' : 'Edit Job'}}</h1>
                <div class="input-box !flex-row !w-min items-center">
                    <label for="enableToggle" class="!mb-0 mr-2 ml-auto">Enabled</label>
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
                    v-model:model-value="jobMetaData.script"
                    :options="availableScriptsOptions"
                    @change="async (newVal) => {
                        jobMetaData.forbidDynamicSchema = false
                        jobMetaData.parameters = await newParameterKvLayout(newVal.value)
                    }"
                    placeholder="Where do I run?"
                    option-label="name"
                    option-value="name"/>
                    <div v-if="globalScriptData[jobMetaData.script]?.description">
                        <a  class="text-lg">Discription:</a>
                        <p class="bg-crust-d rounded-lg p-3 whitespace-pre">{{ globalScriptData[jobMetaData.script].description }}</p>
                    </div>
            </div>

            <div class="input-box"
                v-if="globalScriptData[jobMetaData.script]?.supportsStaticSchema">
                <label for="forbidDynamicSchema">Forbid Dynamic Schema</label>
                <div class="flex flex-row items-center">
                    <InputSwitch id="forbidDynamicSchema" v-model="jobMetaData.forbidDynamicSchema" />
                    <a class="text-md text-info ml-2">Will I be restricted?</a>
                </div>
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

            <div class="input-box" v-if="jobMetaData.parameters && Object.keys(jobMetaData.parameters).length > 0">
                <label for="">Parameters for the Script</label>

                <div v-for="([name, [type, _]]) in Object.entries(jobMetaData.parameters)"
                    class="mb-2 flex flex-col space-y-1">
                    <a :for="name" class="font-bold">{{name}}</a>
                    <FloatLabel :for="`param-${name}`" :label="type" variant="in">
                        <InputText
                            :id="`param-${name}`"
                            v-model:model-value="jobMetaData.parameters[name][1]"
                            class="w-full"
                            aria-describedby="jobName"
                        />
                        <label :for="`param-${name}`">{{type}}</label>
                    </FloatLabel>
                </div>
            </div>

            <div class="input-box">
                <Button
                    label="Save"
                    security="success"
                    @click="() => {
                        const normalizedJobData = { ...jobMetaData, parameters: {} };
                        normalizedJobData.parameters = Object.entries(jobMetaData.parameters)
                            .reduce((acc: Record<string, any>, [key, [_, value]]) => {
                                acc[key] = value;
                                return acc;
                            }, {});
                        updateOrCreateJob(normalizedJobData)
                            .then(() => {
                                useStatusMessage().newStatusMessage('Job saved.', 'success');
                                router.push('/jobs');
                            })
                            .catch((error) => {
                                useStatusMessage().newStatusMessage('Job could not be saved.', 'danger');
                            });
                    }"
                />
            </div>
        </div>
    </main>
</template>