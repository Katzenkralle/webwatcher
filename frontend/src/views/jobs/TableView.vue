<script setup lang="ts">
import { useTableMetaData, type TableMetaData } from "@/composable/api/JobAPI";
import { useJobDataHandler } from "@/composable/scripts/JobDataHandler";
import { useFilterIterationContext, type AbstractCondition, type Group, type IterationContext} from "@/composable/scripts/FilterGroups";
import router from "@/router";

import FilterGroupRenderer from "@/components/filter/FilterGroupRenderer.vue";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';   // optional
import Row from 'primevue/row';                   // optional

import { ref, watch, onMounted, computed, type Ref } from "vue";

const currentJobId = ref(Number(router.currentRoute.value.params.id));

let filter = useFilterIterationContext();

watch(
  () => router.currentRoute.value.params.id,
  (newVal) => {
    if (!newVal) return;
    try {
      currentJobId.value = Number(newVal);
    } catch (e) {
      console.error(e);
    }
    filter = useFilterIterationContext(); // Reset the filter
  }
);

const tableMetadata = computed(() => {
  return useTableMetaData().getTaleMetaData(currentJobId.value);
});

const jobHandler = computed(() => {
  return useJobDataHandler(currentJobId.value, filter);
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
      
      <DataTable :value="jobHandler?.computeDisplayedData.value"  tableStyle="min-width: 50rem">
          <template v-for="col in jobHandler?.computeLayout.value">
              <Column :field="col.key" :header="`${col.key} (${col.type})`"></Column>
          </template>  
      </DataTable>
    </dev>
  </main>
</template>
