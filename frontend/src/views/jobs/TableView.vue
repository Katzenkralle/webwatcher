<script setup lang="ts">
import { useJobUiCreator } from "@/composable/jobs/JobDataHandler";
import { jobUserDisplayConfig } from "@/composable/jobs/UserConfig";

import router from "@/router";

import FilterGroupRenderer from "@/components/filter/FilterGroupRenderer.vue";              
import NavButtons from "@/components/reusables/NavButtons.vue";

import ConfirmableButton from "@/components/reusables/ConfirmableButton.vue";
import ColumnSelection from "@/components/jobs/ColumnSelection.vue";
import StringSearch from "@/components/jobs/StringSearch.vue";
import JobDataTable from "@/components/jobs/Table.vue";
import JobMetaDisplay from "@/components/jobs/MetaData.vue";
import SmallSeperator from "@/components/reusables/SmallSeperator.vue";
import PopupDialog from "@/components/reusables/PopupDialog.vue";
import FilterSelector from "@/components/filter/FilterSelector.vue";
import GraphInput from "@/components/Graphs/GraphInput.vue";
import GraphLoader from "@/components/Graphs/GraphLoader.vue";
import Regression from "@/components/jobs/Regression.vue";

import Button  from "primevue/button";
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

import SplitButton from "primevue/splitbutton";

import { ref, watch, computed } from "vue";

const currentJobId = ref(Number(router.currentRoute.value.params.id));
const downloadSuccessPopup = ref();

const changeJob = (newVal: any) => {
  if (!newVal) return;
    try {
      let newId = Number(newVal);
      if (!currentJobId.value || (currentJobId.value && currentJobId.value !== newId)) {
        currentJobId.value = newId;
        jobHandler = useJobUiCreator(newId);
      }
    } catch (e) {
      console.error(e);
    }
  };

watch(
  () => router.currentRoute.value.params.id,
  (newVal) => {
    changeJob(newVal);
  });

// This cannot be compute, if it would be, random recomputations would happen
// when pressing some buttons - houres wasted: 2
let jobHandler = useJobUiCreator(currentJobId.value);

const userConfig = computed(() => {
  return jobUserDisplayConfig(currentJobId.value);
});

const graphCoardinator = ref();

</script>

<template>
  <main>
    <div :key="currentJobId">
      <div class="flex flex-wrap justify-between mb-2 mt-5">
        <NavButtons />
        <h1 class="self-center">Job Data & Managment</h1>
        <p></p>
      </div>
      <Accordion 
        class="w-full max-w-256 mb-2"
        :value="['0']" 
        multiple
        unstyled>

        <AccordionPanel value="0">
            <AccordionHeader>Overview</AccordionHeader>
              <AccordionContent>
                <JobMetaDisplay 
                  v-if="jobHandler?.metaData.value"
                  :metaData="jobHandler.metaData.value"
                  />
              </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="1">
            <AccordionHeader>Graph Creator</AccordionHeader>
              <AccordionContent>
                <div class="content-box flex flex-col">
                    <GraphInput
                      ref="graphCoardinator"
                      :jobData="jobHandler.jobDataHandler"
                      :user-config="userConfig"
                    />
              </div>
              </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="2">
            <AccordionHeader>Regression</AccordionHeader>
              <AccordionContent>
                <div class="content-box flex flex-col">
                  <Regression
                    :data-handler="jobHandler.jobDataHandler"
                    />
              </div>
              </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="3">
            <AccordionHeader>Logical Filters</AccordionHeader>
              <AccordionContent>
                <div class="content-box flex flex-col">
                    <FilterSelector
                      :filterContext="jobHandler.filterContext"
                      :userConfig="userConfig"
                      />
                    <SmallSeperator 
                      class="my-2 mx-auto" 
                      :is-dashed="true"/>
                    <FilterGroupRenderer 
                      :jobHandler="jobHandler.jobDataHandler"/>
              </div>
              </AccordionContent>
        </AccordionPanel>

        <AccordionPanel value="4">
            <AccordionHeader>View Options</AccordionHeader>
              <AccordionContent>
                <div class="content-box shrinkable">
                  <ColumnSelection
                    :hiddenColumns="jobHandler?.hiddenColumns.value"
                    :allColumns="jobHandler.jobDataHandler.computeLayoutUnfiltered.value"
                    :visableColumns="jobHandler.jobDataHandler.computeLayout.value"
                    :internalColumns="jobHandler.intenalColums"
                    @update:hiddenColumns="(e) => { if (jobHandler) 
                        jobHandler.hiddenColumns.value = e }"
                    />

                  <StringSearch
                    v-if="jobHandler.sortByString.value"
                    :mutSortByString="jobHandler?.sortByString.value"
                    :allColumns="jobHandler.jobDataHandler.computeLayoutUnfiltered.value"
                    @update:key="() => jobHandler?.unsetPrimevueSort() "
                    class="shrink-0"
                    />
                </div>
              </AccordionContent>
        </AccordionPanel>
      </Accordion>

        
      <div class="flex flex-col w-full h-full items-center">
        <SmallSeperator class="my-4" :is-dashed="true"/>
        <h2 class="mb-2">Tabular</h2>
        <JobDataTable
          :jobHandler="jobHandler"
          :graph-input-handler="graphCoardinator?.tableInputForGraph"
          />
        <GraphLoader
        class="mt-5"
        :job-id="currentJobId"
        :user-config="userConfig"
        :data-handler="jobHandler.jobDataHandler"
        />
      </div>

      <PopupDialog ref="downloadSuccessPopup"
        title="Success"
        message="Data was saved to file."
        >
        <template #footer>
          <Button
            label="Close"
            size="small"
            @click="() => downloadSuccessPopup?.closeDialog()"
            />
        </template>
      </PopupDialog>
      <div class="flex flex-row space-x-2 ml-auto mr-4 my-2">
        <ConfirmableButton
            button-label="Fetch all Data"
            button-icon="pi pi-refresh"
            confirm-message="Are you sure you want to fetch all data? This may take a while."
            confirm-icon="pi pi-exclamation-triangle text-warning"
            @confirm="() => jobHandler?.jobDataHandler.lazyFetch(0, true)"
            />
        
            <SplitButton
            label="Export visible"
            icon="pi pi-download"
            @click="() => { jobHandler?.jobDataHandler.saveToFile('visable', jobHandler?.hiddenColumns.value)
                  .then(() => downloadSuccessPopup?.openDialog()) }"
            :model="[
              {
                label: 'Export fetched',
                icon: 'pi pi-download',
                command: () => { jobHandler?.jobDataHandler.saveToFile('all')
                  .then(() => downloadSuccessPopup?.openDialog()) }
              }
            ]"
            />

      </div>

    </div>
  </main>
</template>

<style lang="css">
@reference "@/assets/global.css";


.shrinkable {
  @apply flex 
    flex-col 
    md:flex-row
    space-y-2 
    md:space-y-0      
}

</style>