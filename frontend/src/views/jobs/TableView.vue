<script setup lang="ts">
import { useTableMetaData, type TableLayout, DUMMY_JOB_ENTRY } from "@/composable/api/JobAPI";
import { useJobDataHandler } from "@/composable/scripts/JobDataHandler";
import { useFilterIterationContext, type AbstractCondition, type Group, type IterationContext} from "@/composable/scripts/FilterGroups";
import router from "@/router";

import { useStatusMessage } from "@/composable/core/AppState";

import FilterGroupRenderer from "@/components/filter/FilterGroupRenderer.vue";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import {MultiSelect, SplitButton, FloatLabel} from "primevue";
import ToggleSwitch from 'primevue/toggleswitch';
import ColumnGroup from 'primevue/columngroup';   // optional
import Row from 'primevue/row';                   // optional

import { ref, watch, onMounted, computed, type Ref } from "vue";
import type { MenuItem } from "primevue/menuitem";

const currentJobId = ref(Number(router.currentRoute.value.params.id));

const intenalColums = [...Object.keys(DUMMY_JOB_ENTRY).filter((col) => col != 'context'), 'id'];

const hiddenColumns = ref<string[]>([]);
const fetchAmount = ref(10);

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
  return useJobDataHandler(currentJobId.value, hiddenColumns, computed(() => fetchAmount.value+1), useFilterIterationContext());
});

const entryEditMenu = (forId: number | [number, number]): MenuItem[] => {
  return [
    {
      label: 'Edit',
      command: () => {
        useStatusMessage().newStatusMessage(`Edit: ${forId}`, "info")
      }
    },
    {
      label: 'Delete',
      command: () => {
        useStatusMessage().newStatusMessage(`Delete: ${forId}`, "info")
      }
    },
    {
      label: 'Clone',
      command: () => {
        useStatusMessage().newStatusMessage(`Clone: ${forId}`, "info")
      }
    }
  ]
}

const computehiddenColumnsOptions = computed(() => {
  return jobHandler.value.computeLayoutUnfiltered.value.map((col: TableLayout) => {
    return { label: col.key }
  });
});
const allInternalColumsHidden = computed(() => {
  if (hiddenColumns.value.length !== intenalColums.length) return false;
    return JSON.stringify(intenalColums.sort()) === JSON.stringify(hiddenColumns.value.sort());
});
</script>

<template>
  <main>
    <dev class="flex flex-col w-full h-full items-center" :key="currentJobId">
      <h1 class="mb-2 mt-5">{{ tableMetadata?.name }}</h1>
      <p class="bg-panel w-fit border-2 border-info rounded-lg p-2">{{ tableMetadata?.description }} - {{ tableMetadata?.executedLast }}</p>
      
      <div class="bg-panel m-4 border-2 border-primary rounded-lg p-2">
        <FilterGroupRenderer :jobHandler="jobHandler"/>
      </div>
      <FloatLabel class="w-full md:w-80" variant="in">
        <MultiSelect 
          v-model="hiddenColumns"
          @update:model-value="(e) => hiddenColumns = e" 
          :options="computehiddenColumnsOptions" 
          optionLabel="label"
          size="small"
          option-value="label" 
          overlayClass="hiddenColumnsMultiselect"
          class="min-w-64 max-h-14"
          >
          <template #header>
            <div class="flex flex-col items-center">
              <div class="flex flex-row justify-around my-2 w-full">
                <label for="toggleAllInternalColumnsHidden" class="font-bold">Hide Internal</label>
                <ToggleSwitch
                  input-id="toggleAllInternalColumnsHidden"
                  :model-value="allInternalColumsHidden"
                  @update:model-value="(e) => {
                    hiddenColumns = hiddenColumns.filter((col) => !intenalColums.includes(col));
                    if (e){
                      hiddenColumns = [...hiddenColumns, ...intenalColums];
                    }
                  }"
                />
              </div>
              <span class="w-3/4 h-1 bg-crust-d"></span>
            </div>
          </template>
        </MultiSelect>
        <label for="in_label">Hide Columns</label>
      </FloatLabel>
      <div class="w-full h-full">

      <!-- Attempting to use lazy loading from the primevue datatable resulted in unpredictable behavior,
       using custom implementation instead -->
      <DataTable 
        :value="jobHandler?.computeDisplayedData.value"  
        tableStyle="min-width: 50rem"
        sortMode="multiple"
        reorderableColumns
        
        paginator
        :rows="fetchAmount" 
        :rowsPerPageOptions="[2, 10, 30, 50, 100, 500]"
        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        :currentPageReportTemplate="`({first} - {last}) / ${
          jobHandler?.computedAllFetched.value 
            ? jobHandler?.computeDisplayedData.value.length 
            : '?'
          }`"
        @page="(e) => jobHandler?.lazyFetch(e.page*e.rows)"
        >
          <template v-for="col in jobHandler?.computeLayout.value">
              <Column sortable :field="col.key" :header="`${col.key} (${col.type})`"></Column>
          </template>  
          <Column field="vue_edit" header="Edit" :reorderableColumn="false" :sortable="false">
            <template #body="slotProps">
              <SplitButton
                  icon="pi pi-eye"
                  size="small"
                  :model="entryEditMenu(slotProps.data.id)"
                />
            </template>
          </Column>
      </DataTable>
    </div>
    </dev>
  </main>
</template>

<style>
.hiddenColumnsMultiselect .p-multiselect-header {
  /* Hide Header with select all box from multiselect element */
  display: none !important;
}
</style>