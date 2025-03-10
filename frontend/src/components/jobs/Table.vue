<script setup lang="ts">
import { useJobUiCreator, type HighlightSubstring } from "@/composable/jobs/JobDataHandler";
import { useStatusMessage } from "@/composable/core/AppState";

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import SplitButton from "primevue/splitbutton";
import ColumnGroup from 'primevue/columngroup';  

import Row from 'primevue/row';             
import { ref, onMounted, onUnmounted, computed } from "vue";
import type { MenuItem } from "primevue/menuitem";



const props = defineProps<{
  jobHandler: ReturnType<typeof useJobUiCreator>
}>();

const computedTableSize = ref<string>("85vh");



let resizeObserver: MutationObserver | undefined = undefined

const initTableSizeObserver = () => {
  /* Observes the size of the table and adjusts the height of the outer element to fit the content 
  this is a workaround for the primevue datatable not supporting lazy loading with a fixed height table
  ToDo: Check if this can be done better and if this is not to expensive
  */
  let watchElement  = document.querySelector('.watched-table');
  let header = document.querySelector('.p-datatable-thead');
  if (watchElement){
    resizeObserver = new MutationObserver(() => {
      const headerSize = header ? header.clientHeight : 0;
      const totalPages = Math.floor(props.jobHandler.jobDataHandler.computeDisplayedData.value.length / props.jobHandler.fetchAmount.value)
      const elementsOnPage = props.jobHandler.page.value === totalPages 
        ? props.jobHandler.jobDataHandler.computeDisplayedData.value.length % props.jobHandler.fetchAmount.value 
        : props.jobHandler.fetchAmount.value;
      const sizeOfOne = (watchElement.clientHeight - headerSize)/elementsOnPage;
      const tableSize = (sizeOfOne *  props.jobHandler.fetchAmount.value)  + headerSize;
      computedTableSize.value = tableSize > document.body.clientHeight * 0.85 ? "85vh" : `${tableSize}px`;
    });
    resizeObserver.observe(watchElement, { attributes: true, childList: true, subtree: true });
  }
}

onMounted(() => {
  initTableSizeObserver();
})

onUnmounted(() => {
  if (resizeObserver){
    resizeObserver.disconnect();
  }
})



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


const amountVisableInternalColumns = computed(() => 
  props.jobHandler.jobDataHandler.computeLayout.value
    .map((col)  => props.jobHandler.intenalColums.includes(col.key) ? 1 : 0)
    .reduce((partialSum: number, a: number) => partialSum + a, 0)
);

const getHighlightedSegments = (text: string, highlighted: HighlightSubstring[]): {text: string, highlight: boolean}[] => {
  highlighted = highlighted.sort((a, b) => a.end - b.end);
  let i = 0;
  let segments = []
  highlighted.forEach((highlight) => {
    if (highlight.start > i){
      segments.push({text: text.slice(i, highlight.start), highlight: false});
    }
    segments.push({text: text.slice(highlight.start, highlight.end), highlight: true});
    i = highlight.end;
  });
  if (i < text.length){
    segments.push({text: text.slice(i), highlight: false});
  }
  return segments;
}
</script>

<template>
    <!-- Attempting to use lazy loading from the primevue datatable resulted in unpredictable behavior,
       using custom implementation instead -->
       <DataTable 
        :ref="props.jobHandler.mainDataTable"
        :value="props.jobHandler.jobDataHandler.computeDisplayedData.value"  
        class="bg-panel-h main-table"
        removableSort
        sortMode="multiple"
        @sort="() => {props.jobHandler.unsetSortByString()}"
        :scrollable="true"
        size="small"
        table-class="watched-table"
        paginator

        :rows="props.jobHandler.fetchAmount.value" 
        @update:rows="(e: number) => jobHandler.fetchAmount.value = e"
        :rowsPerPageOptions="[2, 10, 30, 50, 100, 500]"
        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        :currentPageReportTemplate="`({first} - {last}) / ${
          props.jobHandler.jobDataHandler.computedAllFetched.value 
            ? props.jobHandler.jobDataHandler.computeDisplayedData.value.length 
            : '?'
          }`"
        @page="(e: any) => {
          props.jobHandler.page.value = e.page;
          props.jobHandler.jobDataHandler.lazyFetch(e.page*e.rows)
        }"
        >
          <ColumnGroup 
          type="header">
            <Row>
              <Column v-if="amountVisableInternalColumns" 
                header="Meta Data" 
                :colspan="amountVisableInternalColumns"
                class="top-header border-r-2 h-min"
              />
              <Column v-if="props.jobHandler.jobDataHandler.computeLayout.value.length 
                - amountVisableInternalColumns" 
                header="Script Data" 
                :colspan="props.jobHandler.jobDataHandler.computeLayout.value.length 
                - amountVisableInternalColumns"
                class="top-header border-r-2 h-min"
              />
              <Column  
                :colspan="1"
                class="top-header h-min"
               />
            </Row>

            <Row>
              <template v-for="col in props.jobHandler.jobDataHandler.computeLayout.value">
                  <Column 
                    :field="col.key" 
                    :header="`${col.key} (${col.type})`" 
                    sortable 
                    class="border-r-2 border-b-0  border-crust border-dashed"
                    />
              </template>
              <Column 
                field="vue_edit" 
                header="Edit" 
                :reorderableColumn="false" 
                :sortable="false" 
              :pt="{
                'columnTitle': 'mx-auto'
              }"
              />
            </Row>
          </ColumnGroup>

          <template v-for="col in props.jobHandler.jobDataHandler.computeLayout.value">
              <Column :field="col.key">
                <template #body="slotProps">
                    <template v-if="props.jobHandler.jobDataHandler.highlightSubstring.value[slotProps.index] 
                      && props.jobHandler.jobDataHandler.highlightSubstring.value[slotProps.index][col.key]">
                      <p>
                        <template v-for="segment in getHighlightedSegments(String(slotProps.data[col.key]),
                          props.jobHandler.jobDataHandler.highlightSubstring.value[slotProps.index][col.key])">
                          <span v-if="segment.highlight" class="text-error">{{ segment.text }}</span>
                          <span v-else>{{ segment.text }}</span>
                        </template>
                      </p>
                    </template>
                    <template v-else>
                      <p>{{ slotProps.data[col.key] }}</p>
                    </template>
                  </template>
              </Column>
          </template>
          <Column field="vue_edit">
            <template #body="slotProps">
              <div class="w-full h-full flex justify-center">
                <SplitButton
                  icon="pi pi-eye"
                  size="small"
                  :model="entryEditMenu(slotProps.data.id)"
                />
              </div>
            </template>
          </Column>
      </DataTable>
</template>

<style>
@reference "@/assets/global.css";
.hiddenColumnsMultiselect .p-multiselect-header {
  /* Hide Header with select all box from multiselect element */
  display: none !important;
}

.top-header {
  @apply border-b-1 border-app bg-panel;
}

.main-table {
  @apply w-full;
}
.main-table .p-datatable-table-container{
  /* hacky workaround to avoide losing my fucking mind */
  height: v-bind(computedTableSize);
}
</style>