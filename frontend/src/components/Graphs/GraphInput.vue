<script setup lang="ts">
import Button from 'primevue/button';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';
import FloatLabel from 'primevue/floatlabel';
import { InputText } from 'primevue';
import GraphRenderer from './GraphRenderer.vue';

import { useGraphConstructor } from '@/composable/jobs/GraphDataHandler';
import router from '@/router';

import SmallSeperator from '../reusables/SmallSeperator.vue'; 
import { type flattendJobEnty } from '@/composable/jobs/JobDataHandler'
import { ref, type ComputedRef } from 'vue';

const props = defineProps<{
    graphConstructor: ReturnType<typeof useGraphConstructor>;
    computedDisplayData: ComputedRef<flattendJobEnty[]>

}>();

const title = ref('');
</script>

<template>
    <div class=" full flex flex-col">
        <div class="flex flex-row w-full">
            <div  class="flex flex-row">
                <ToggleSwitch
                    v-model="graphConstructor.multiRowView.value"
                    />
                <label>{{ graphConstructor.multiRowView.value ? 'Multi Row Graph' :  'Single Row Graph' }}</label>
            </div>
            <FloatLabel variant="in" >
                <Select
                    class="w-40"
                    :options="graphConstructor.availableGraphTypes.value"
                    v-model="graphConstructor.selectedGraphType.value"
                />
                <label>Select Graphs</label>
            </FloatLabel>
            <Button
                icon="pi pi-refresh"
                @click="graphConstructor.reset()"
                severity="danger"
                />
        </div>
        <span  v-if="graphConstructor.selectedGraphType.value">
            Select <a class="text-info">{{ graphConstructor.graphInput.value.cols.maxSelection !== 0 
            ? graphConstructor.graphInput.value.cols.maxSelection
            : 'up to all'}} column(s)</a> and <a  class="text-info">{{ graphConstructor.graphInput.value.rows.maxSelection !== 0 
            ? graphConstructor.graphInput.value.rows.maxSelection
            : 'up to all'}} row(s)</a>   
        </span>
        <span v-else>
            Select a graph type first
        </span>
        <Button
            v-if="graphConstructor.graphInput.value.cols.invalid || graphConstructor.graphInput.value.rows.invalid"
            :disabled="!graphConstructor.selectedGraphType.value"
            label="Select Columns and Rows"
            @click="router.push({ hash: `#table${graphConstructor.jobId}` })"
        />

        <template  v-if="graphConstructor.curentGraph.value">
            <SmallSeperator />

            <div  class="flex flex-row">
                <FloatLabel>
                    <InputText
                        v-model="title"
                    />
                        <label>Graph Title</label>
                </FloatLabel>

                <Button
                    label="Save"/>
        </div>
            <GraphRenderer
                :graphData="graphConstructor.curentGraph.value"
                :computedDisplayData="props.computedDisplayData"
            />
        </template>
    </div>
    


</template>