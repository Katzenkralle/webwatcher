<script setup lang="ts">
import { useTableMetaData, type TableMetaData } from "@/composable/TableAPI";
import router from "@/router";


import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';   // optional
import Row from 'primevue/row';                   // optional

import { ref, watch, onMounted, computed } from "vue";
import { useTableData } from "@/composable/TableAPI";


const DEFAULT_VISIBLE_DATA_RANGE = 2;

const tableMetadata = ref<TableMetaData | undefined>(undefined);
const tableData = ref<ReturnType<typeof useTableData> | undefined>(undefined);
const visibleDatarange = ref<[number, number]>([0, DEFAULT_VISIBLE_DATA_RANGE-1]);
const rangeOfVisibleData = computed(() => {
    return visibleDatarange.value[1]+1 - visibleDatarange.value[0];
})
const init = () => {
    console.info("Executing init");
    tableMetadata.value = useTableMetaData()
        .localTableMetaData
        .value
        .find((element) => 
            element.id === Number(router.currentRoute.value.params.id)
        );
    if (tableMetadata.value){
        tableData.value = useTableData(tableMetadata.value.id);
        tableData.value?.fetchNextEntrys(rangeOfVisibleData.value);
    }
}

onMounted(() => {
    init();
})

watch(() => router.currentRoute.value.params.id, () => {
    // reload if path changes
    init();
})

watch(() => useTableMetaData().localTableMetaData.value, () => {
    // reload if table data changes
    init();
  })

const showMore = () => {

    let len = tableData.value?.getLocalData().length || 0;
    new Promise<void>(async (resolve, reject) => {
      if (len-1 <= visibleDatarange.value[1]){
        let result = await tableData.value?.fetchNextEntrys(DEFAULT_VISIBLE_DATA_RANGE);
        console.info("Result: ", result);
        if (result === undefined || result.length === 0){
          reject();
        } 
      }
      resolve();
    }).then(() => {
      visibleDatarange.value = [visibleDatarange.value[0], visibleDatarange.value[1] + DEFAULT_VISIBLE_DATA_RANGE];
    }).catch(() => {
      console.info("No more data to fetch");
    });
   
  }

const showLess = () => {
    if (visibleDatarange.value[1] <= DEFAULT_VISIBLE_DATA_RANGE){
        console.info("No more data to hide");
        return;
    }
    visibleDatarange.value = [visibleDatarange.value[0], visibleDatarange.value[1] - DEFAULT_VISIBLE_DATA_RANGE];
    console.info("Show less: ", visibleDatarange.value);
  }

</script>

<template>
  <main>
    <dev class="flex flex-col w-full h-full items-center">
      <h1 class="mb-2 mt-5">{{ tableMetadata?.label }}</h1>
      <p class="bg-panel w-fit border-2 border-info rounded-lg p-2">{{ tableMetadata?.description }} - {{ tableMetadata?.created_at }}</p>
      <DataTable :value="tableData?.getLocalData(visibleDatarange) || []"  tableStyle="min-width: 50rem">
          <template v-for="col in tableData?.getTableLayout() || ['n','a']">
              <Column :field="col[0]" :header="col[0]+ '(' + col[1] + ')'"></Column>
          </template>  
      </DataTable>
      <button @click="showMore()">Show more</button>
      <button @click="showLess()">Show less</button>
    </dev>
  </main>
</template>
