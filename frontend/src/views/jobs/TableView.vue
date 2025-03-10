<script setup lang="ts">
import { useTableMetaData } from "@/composable/api/JobAPI";
import { useJobUiCreator } from "@/composable/jobs/JobDataHandler";

import router from "@/router";

import FilterGroupRenderer from "@/components/filter/FilterGroupRenderer.vue";              

import ConfirmableButton from "@/components/reusables/ConfirmableButton.vue";
import ColumnSelection from "@/components/jobs/ColumnSelection.vue";
import StringSearch from "@/components/jobs/StringSearch.vue";
import JobDataTable from "@/components/jobs/Table.vue";
import JobMetaDisplay from "@/components/jobs/MetaData.vue";
import SmallSeperator from "@/components/reusables/SmallSeperator.vue";

import Button  from "primevue/button";
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

import { ref, watch, computed } from "vue";

const currentJobId = ref(Number(router.currentRoute.value.params.id));

watch(
  () => router.currentRoute.value.params.id,
  (newVal) => {
    if (!newVal) return;
    try {
      currentJobId.value = Number(newVal);
    } catch (e) {
      console.error(e);
    }
  }
);

const tableMetadata = computed(() => {
  return useTableMetaData().getTaleMetaData(currentJobId.value);
});

const jobHandler = computed(() => {
  return useJobUiCreator(currentJobId.value);
});

</script>

<template>
  <main>
    <dev class="flex flex-col w-full h-full items-center" :key="currentJobId">
      <h1 class="mb-2 mt-5">Job Data & Managment</h1>

      
      <Accordion 
        class="w-full max-w-256 mb-2"
        :value="['0']" 
        multiple
        unstyled>

        <AccordionPanel value="0">
            <AccordionHeader>Overview</AccordionHeader>
              <AccordionContent>
                <JobMetaDisplay 
                  v-if="tableMetadata"
                  :metaData="tableMetadata"
                  class="max-w-256" />
              </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="1">
            <AccordionHeader>Logical Filters</AccordionHeader>
              <AccordionContent>
                <div class="content-box">
                  <FilterGroupRenderer :jobHandler="jobHandler.jobDataHandler"/>
                </div>
              </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="2">
            <AccordionHeader>View Options</AccordionHeader>
              <AccordionContent>
                <div class="content-box">
                  <ColumnSelection
                    :hiddenColumns="jobHandler?.hiddenColumns.value"
                    :allColumns="jobHandler.jobDataHandler.computeLayoutUnfiltered.value"
                    :visableColumns="jobHandler.jobDataHandler.computeLayout.value"
                    :internalColumns="jobHandler.intenalColums"
                    @update:hiddenColumns="(e) => { if (jobHandler) 
                        jobHandler.hiddenColumns.value = e }"
                    />

                  <StringSearch
                    :mutSortByString="jobHandler?.sortByString.value"
                    :allColumns="jobHandler.jobDataHandler.computeLayoutUnfiltered.value"
                    @update:key="() => jobHandler.unsetPrimevueSort() "
                    class="shrink-0"
                    />
                </div>
              </AccordionContent>
        </AccordionPanel>
      </Accordion>

        
      <div class="flex flex-col w-full h-full items-center">
        <SmallSeperator class="my-4" :is-dashed="true"/>
        <JobDataTable
          :jobHandler="jobHandler"
          />
      </div>

      <div class="flex flex-row space-x-2 ml-auto mr-4 my-2">
        <ConfirmableButton
            button-label="Fetch all Data"
            button-icon="pi pi-refresh"
            confirm-message="Are you sure you want to fetch all data? This may take a while."
            confirm-icon="pi pi-exclamation-triangle text-warning"
            @confirm="() => jobHandler?.jobDataHandler.lazyFetch(0, true)"
            class="shrink-0"
            />
        
          <Button
            label="Save data to file"
            icon="pi pi-download"
            @click="(e) => {console.error('Not implemented yet')}"
            />
      </div>

    </dev>
  </main>
</template>

<style lang="css">
@reference "@/assets/global.css";


.p-accordioncontent-content {
  @apply flex justify-center;
}

.p-accordionheader{
  @apply text-xl font-semibold underline underline-offset-3 mb-1 cursor-pointer;
}

.p-accordionpanel:not(:last-child) {
  @apply border-b-2 border-h-panel pb-2;
}
.p-accordionpanel:not(:first-child) {
  @apply pt-1;
}

.content-box {
  @apply 
    bg-panel 
    border-2 
    border-primary 
    rounded-lg 
    p-2 
    w-full 
    max-w-256 
    flex 
    flex-col 
    md:flex-row 
    justify-between 
    space-y-2 
    md:space-y-0 
    overflow-x-scroll 
    overflow-y-hidden;
}
</style>