<script setup lang="tsx">
import { jobUserDisplayConfig } from '@/composable/jobs/UserConfig';
import { type GraphConfig } from '@/composable/jobs/UserConfig';
import { useJobDataHandler } from '@/composable/jobs/JobDataHandler';
import { ref, watch } from 'vue';

import GraphRenderer from './GraphRenderer.vue';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import Button from 'primevue/button';
import ConfirmableButton from '../reusables/ConfirmableButton.vue';
import FloatLabel from 'primevue/floatlabel';
const props = defineProps<{
    dataHandler: ReturnType<typeof useJobDataHandler>;
    userConfig: ReturnType<typeof jobUserDisplayConfig>;
}>();

const graphs = ref<GraphConfig[]>();
const changedGraphNames = ref<Record<number, string>>({});

watch(()  => props.userConfig.graph.value, async(newVal) => {
    console.log("localConfigChange:", await newVal);
    if (newVal) {
        graphs.value = await newVal;
    }
}, { immediate: true });

</script>

<template>
    <div v-if="graphs && graphs?.length > 0" class="flex flex-col w-full items-center">
        <h2 class="text-center mb-2">Graphinised</h2>
        <div class="flex flex-wrap w-[98%] gap-2 justify-center">
            <div v-for="graph, index in graphs" :key="graph.name" 
                class="flex flex-col gap-2 w-full max-w-200 p-2 bg-crust
                border-2 rounded-lg border-solid border-h-text-h">
                <InputGroup>
                    <FloatLabel variant="in">
                        <InputText
                            size="small"
                            :model-value="changedGraphNames[index] ?? graph.name"
                            @update:model-value="(e) => changedGraphNames[index] = e  ?? ''"
                            placeholder="Graph Title"
                        />
                        <label>Graph Name</label>
                    </FloatLabel>
                    <template v-if="changedGraphNames[index] && changedGraphNames[index] !== graph.name">
                        <Button
                            icon="pi pi-times"
                            severity="danger"
                            @click="() => {
                                changedGraphNames[index] = graph.name
                            }"/>
                        <Button
                            icon="pi pi-check"
                            @click="() => {
                                if (!graphs) return
                                props.userConfig.graph.value = {change: {index: index, value: {name: changedGraphNames[index], data: graph.data}}};
                            }"/>
                    </template>
                    <template v-else>
                        <ConfirmableButton
                        confirmMessage="Are you sure you want to delete this graph?"
                        button-class="p-button-danger"
                        confirmIcon="pi pi-trash"
                        button-icon="pi pi-trash"
                        buttonLabel=""
                        @confirm="() => {
                            if (!graphs) return
                            props.userConfig.graph.value = {delete: [index]};
                        }"/>
                    </template>
                </InputGroup>
                <GraphRenderer
                    :id="`graph-${changedGraphNames[index] ?? graph.name}`"
                    class="my-auto"
                    :graph-data="graph.data"
                    :computed-display-data="dataHandler.computeDisplayedData"
                    :fetch-specific-data="dataHandler.retriveRowsById"
                    >
                </GraphRenderer>
            </div>
        </div> 
    </div>
</template>