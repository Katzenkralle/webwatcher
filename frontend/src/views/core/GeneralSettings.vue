<script setup lang="ts">
import UserSettings from "@/components/core/UserSettings.vue";

import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

import SmallSeperator from "@/components/reusables/SmallSeperator.vue";
</script>

<template>
    <main class="w-full h-full flex flex-col items-center">
        <h1 class="mt-5 mb-2">General Settings</h1>

        <SmallSeperator :is-dashed="true" class="my-4"/>
        <Accordion 
            class="w-full max-w-256 mb-2"
            :value="['0']" 
            multiple
            unstyled>

            <AccordionPanel value="0">
                <AccordionHeader>Overview</AccordionHeader>
                <AccordionContent>
                    <UserSettings class="content-box"/>
                </AccordionContent>
            </AccordionPanel>

        </Accordion>
        </main>
</template>