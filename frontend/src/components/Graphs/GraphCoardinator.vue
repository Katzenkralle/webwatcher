<script setup lang="tsx">
import { computed, type Reactive } from 'vue';
import { useGraphConstructor, type GraphInput } from '@/composable/jobs/GraphDataHandler';
import { useJobDataHandler } from '@/composable/jobs/JobDataHandler';

import GraphInputVue from '@/components/Graphs/GraphInput.vue';


const props = defineProps<{
    jobData: ReturnType<typeof useJobDataHandler>;
}>();

const graphInput = computed(() => {
    return useGraphConstructor(props.jobData);
});

defineExpose<{tableInputForGraph: Reactive<GraphInput>}>({
    tableInputForGraph  :graphInput.value.graphInput
});
</script>

<template>
    <GraphInputVue
        :graphConstructor="graphInput"
        :computedDisplayData="props.jobData.computeDisplayedData"
    />

</template>