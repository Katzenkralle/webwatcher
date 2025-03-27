<script setup lang="ts">
import {defineProps, ref, computed} from "vue"

import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import SmallSeperator from "@/components/reusables/SmallSeperator.vue";


import GraphSelector from "./GraphSelector.vue";
import DisplayChart from "./DisplayChart.vue";

const props = defineProps<{
    jobId: number
    }>()

</script>

<template>
    <Accordion 
        class="w-full max-w-256 mb-2"
        :value="['0']" 
        multiple
        unstyled>
   
        <AccordionPanel value="0">
                <AccordionHeader>Graph</AccordionHeader>
                <AccordionContent>
                    <div class="content-box flex flex-col">
                        <GraphSelector :jobId="props.jobId"/>
                        <SmallSeperator 
                        class="my-2 mx-auto" 
                        :is-dashed="true"/>
                        <DisplayChart :jobId="props.jobId"/>
                    </div>
                </AccordionContent> 
            </AccordionPanel>
    </Accordion>
    
</template>

<style scoped>

</style>