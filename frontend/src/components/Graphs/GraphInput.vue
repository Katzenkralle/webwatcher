<script setup lang="ts">
import Button from 'primevue/button';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';
import FloatLabel from 'primevue/floatlabel';


import { useGraphConstructor } from '@/composable/jobs/GraphDataHandler';
import router from '@/router';


const props = defineProps<{
    graphConstructor: ReturnType<typeof useGraphConstructor>;
}>();
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
        <Button
            v-else
            label="Generate Graph"
            class="w-full"
            @click="console.log(graphConstructor.getGraph())"
        />
    </div>
</template>