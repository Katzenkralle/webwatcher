<script setup lang="tsx">
import { jobUserDisplayConfig } from '@/composable/jobs/UserConfig';
import { type GraphDataSeries } from '@/composable/jobs/GraphDataHandler';
import { useJobDataHandler } from '@/composable/jobs/JobDataHandler';
import { ref, watch } from 'vue';

import GraphRenderer from './GraphRenderer.vue';

const props = defineProps<{
    dataHandler: ReturnType<typeof useJobDataHandler>;
    userConfig: ReturnType<typeof jobUserDisplayConfig>;
}>();

const graphs = ref<Record<string, GraphDataSeries>>();

watch(()  => props.userConfig.graph.value, async(newVal) => {
    console.log("localConfigChange:", await newVal);
    if (newVal) {
        graphs.value = await newVal;
    }
}, { immediate: true });

</script>

<template>
    <div v-if="graphs" class="flex flex-col gap-2"  >
        <div v-for="(data, name) in graphs" :key="name" class="flex flex-col gap-2">
            <h5>{{ name }}</h5>
            <GraphRenderer
                :graph-data="data"
                :computed-display-data="dataHandler.computeDisplayedData">
            </GraphRenderer>
        </div>
    </div>  
</template>