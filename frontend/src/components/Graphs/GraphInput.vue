<script setup lang="ts">
import Button from 'primevue/button';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import InputGroup from 'primevue/inputgroup';
import GraphRenderer from './GraphRenderer.vue';
import AnimatedArrow from '@/components/reusables/AnimatedArrow.vue';
import Checkbox from 'primevue/checkbox';

import SmallSeperator from '../reusables/SmallSeperator.vue'; 
import { computed, ref, type ComputedRef,  type Reactive } from 'vue';

import { useGraphConstructor, type GraphInput } from '@/composable/jobs/GraphDataHandler';
import { useJobDataHandler } from '@/composable/jobs/JobDataHandler';
import { jobUserDisplayConfig } from '@/composable/jobs/UserConfig';

const props = defineProps<{
    jobData: ReturnType<typeof useJobDataHandler>;
    userConfig?: ReturnType<typeof jobUserDisplayConfig>; 
}>();

const graphConstructor = computed(() => {
    return useGraphConstructor(props.jobData);
});

defineExpose<{tableInputForGraph: Reactive<GraphInput>}>({
    tableInputForGraph  :graphConstructor.value.graphInput
});


const scrollToTable = (id: number) => {
    const element = document.getElementById(`table${id}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};

const title = ref('');
</script>

<template>
    <div class="flex flex-col">
        <div class="options-grid">
            <div  class="flex flex-row items-center">
                <ToggleSwitch
                    id="multiRowViewGraphCreator"
                    v-model="graphConstructor.rowBasedView.value"
                    />
                <label 
                    for="multiRowViewGraphCreator"
                    class="ml-2">
                    {{ graphConstructor.rowBasedView.value ? 'Multi Row Graph' :  'Single Row Graph' }}
                </label>
            </div>
            <FloatLabel variant="in" >
                <Select
                    size="small"
                    class="w-60"
                    :options="graphConstructor.availableGraphTypes.value"
                    v-model="graphConstructor.selectedGraphType.value"
                />
                <label>Select Graph Type</label>
            </FloatLabel>
            <Button
                icon="pi pi-refresh"
                size="small"
                class="aspect-square"
                @click="graphConstructor.reset()"
                severity="danger"
                />
        
            <InputGroup  class="flex flex-row items-center mt-4">
                <ToggleSwitch
                    id="multiRowViewGraphCreator"
                    v-model="graphConstructor.pullFutureRows.value"
                    />
                <label 
                    for="multiRowViewGraphCreator"
                    class="ml-2">
                    Dynamic Row Selection
                </label>
            </InputGroup>

            <template v-if="graphConstructor.pullFutureRows.value">
                <FloatLabel variant="in" >
                    <InputNumber
                        size="small"
                        class="w-60"
                        :model-value="computed(() => graphConstructor.pullXNewRows.value ===  0 ? null :  graphConstructor.pullXNewRows.value).value"
                        @update:model-value="(val) => {
                            if (val === null){
                                return
                            }
                            graphConstructor.pullXNewRows.value = val;
                        }"
                        />
                    <label>Amount of Rows</label>
                </FloatLabel>
                <div>
                    <Checkbox
                        :binary="true"    
                        :readonly="true"
                        :model-value="computed(() => graphConstructor.pullXNewRows.value ===  0)"
                        @click="() => {
                            graphConstructor.pullXNewRows.value = graphConstructor.pullXNewRows.value === 0 ? 10 : 0;
                        }"
                        />
                    <label class="ml-2">Use all Rows</label>
                </div>
            </template>
        </div>
        <SmallSeperator class="mx-auto my-4" :isDashed="true" />
        <div class="min-h-128 flex flex-col items-center justify-center">
            <template v-if="!graphConstructor.curentGraph.value">
                <div v-if="graphConstructor.selectedGraphType.value"
                    class="flex flex-col items-center">
                    <span>
                    Select <a class="text-info">{{ graphConstructor.graphInput.cols.maxSelection !== 0 
                    ? graphConstructor.graphInput.cols.maxSelection
                    : 'up to all'}} column(s)</a> 
                    <template v-if="!graphConstructor.pullFutureRows.value"> 
                        and  <a class="text-info">{{ graphConstructor.graphInput.rows.maxSelection !== 0 
                        ? graphConstructor.graphInput.rows.maxSelection
                        : 'up to all'}} row(s)</a>  
                    </template>
                    </span> 
                    <h3  class="text-warning">Use Checkboxes in the Table</h3>
                    <AnimatedArrow
                        v-if="graphConstructor.graphInput.cols.invalid || graphConstructor.graphInput.rows.invalid"
                        @click="scrollToTable(graphConstructor.jobId)"
                    />
                </div>
                <span v-else>
                        Select a <a class="text-info">graph type</a> first
                </span>
            </template>
            <template v-else>
                <div class="flex flex-row w-full">
                    <InputGroup  v-if="props.userConfig" class="max-w-80">
                        <InputText
                        placeholder="Save as..."
                        v-model="title"
                        size="small"
                        />
                        <Button
                        icon="pi pi-save"
                        @click="async() => {
                            if(!props.userConfig || !graphConstructor.curentGraph.value) return
                            props.userConfig.graph.value = {add: [{name: title, data: graphConstructor.curentGraph.value}]};
                        }"/>
                    </InputGroup>
                </div>
                <GraphRenderer
                    class="w-full h-full"
                    :graphData="graphConstructor.curentGraph.value"
                    :computedDisplayData="props.jobData.computeDisplayedData"
                    :fetch-specific-data="props.jobData.retriveRowsById"
                />
            </template>
        </div>
    </div>
</template>

<style scoped>
@reference "@/assets/global.css";

.options-grid {
    @apply grid grid-cols-3 gap-2;
}

.options-grid > * {
    @apply self-center; /* Center all items vertically */
}

.options-grid > *:nth-child(3n+1) {
    @apply justify-self-start; /* First column items align left */
}

.options-grid > *:nth-child(3n+2) {
    @apply justify-self-center; /* Second column items align center */
}

.options-grid > *:nth-child(3n) {
    @apply justify-self-end; /* Third column items align right */
}
</style>