<script setup lang="ts">
import { useTableMetaData } from "@/composable/api/JobAPI";
import { useJobUiCreator } from "@/composable/jobs/JobDataHandler";

import router from "@/router";

import FilterGroupRenderer from "@/components/filter/FilterGroupRenderer.vue";              

import ConfirmableButton from "@/components/reusables/ConfirmableButton.vue";
import ColumnSelection from "@/components/jobs/ColumnSelection.vue";
import StringSearch from "@/components/jobs/StringSearch.vue";
import JobDataTable from "@/components/jobs/Table.vue";

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
      <h1 class="mb-2 mt-5">{{ tableMetadata?.name }}</h1>
      <p class="bg-panel w-fit border-2 border-info rounded-lg p-2">{{ tableMetadata?.description }} - {{ tableMetadata?.executedLast }}</p>
      
    
      <ConfirmableButton
        button-label="Fetch all Data"
        button-icon="pi pi-refresh"
        confirm-message="Are you sure you want to fetch all data? This may take a while."
        confirm-icon="pi pi-exclamation-triangle text-warning"
        @confirm="() => jobHandler?.jobDataHandler.lazyFetch(0, true)"

        />
      
      <div class="bg-panel m-4 border-2 border-primary rounded-lg p-2">
        <FilterGroupRenderer :jobHandler="jobHandler.jobDataHandler"/>
      </div>
    
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
        />
      
      <div class="w-full h-full">
        <JobDataTable
          :jobHandler="jobHandler"
          />
      </div>
    </dev>
  </main>
</template>
