<script setup lang="ts">
import { useTableMetaData, type TableLayout, DUMMY_JOB_ENTRY } from "@/composable/api/JobAPI";
import { useJobDataHandler, type HighlightSubstring } from "@/composable/scripts/JobDataHandler";
import { useFilterIterationContext} from "@/composable/scripts/FilterGroups";
import Seperator from "@/components/reusables/SmallSeperator.vue";

import router from "@/router";

import { useStatusMessage } from "@/composable/core/AppState";

import FilterGroupRenderer from "@/components/filter/FilterGroupRenderer.vue";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import {MultiSelect, SplitButton, FloatLabel, InputText} from "primevue";
import Popover from 'primevue/popover';
import ToggleSwitch from 'primevue/toggleswitch';
import Button from "primevue/button"
import InputGroup from 'primevue/inputgroup';
import Checkbox from 'primevue/checkbox';

import ColumnGroup from 'primevue/columngroup';   // optional
import Row from 'primevue/row';                   // optional

import { ref, watch, onMounted, onUnmounted, computed, type Ref } from "vue";
import type { MenuItem } from "primevue/menuitem";

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
      const totalPages = Math.floor(jobHandler.value?.computeDisplayedData.value.length / fetchAmount.value)
      const elementsOnPage = page.value === totalPages ? jobHandler.value?.computeDisplayedData.value.length % fetchAmount.value : fetchAmount.value;
      const sizeOfOne = (watchElement.clientHeight - headerSize)/elementsOnPage;
      const tableSize = (sizeOfOne *  fetchAmount.value)  + headerSize;
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


const computedTableSize = ref<string>("85vh");

const currentJobId = ref(Number(router.currentRoute.value.params.id));

const intenalColums = [...Object.keys(DUMMY_JOB_ENTRY).filter((col) => col != 'context'), 'id'];

const hiddenColumns = ref<string[]>([]);
const fetchAmount = ref(10);
const page = ref(0);

const sortByString = ref({
  key: "",
  ignoreColumns: [],
  caseInsensitive: true
})

const sortByStringColumnSelectPopover = ref(); // type Popover
const mainDataTable = ref(); // primevue datatable

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
  return useJobDataHandler(
  currentJobId.value, 
  hiddenColumns,
  computed(() => fetchAmount.value+1),
  computed(() => sortByString.value),
  useFilterIterationContext());
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
const amountVisableInternalColumns = computed(() => 
  jobHandler.value.computeLayout.value
    .map((col)  => intenalColums.includes(col.key) ? 1 : 0)
    .reduce((partialSum: number, a: number) => partialSum + a, 0)
);

const unsetSortByString = () => {
  sortByString.value.key = "";
}

const unsetPrimevueSort = () => {
  mainDataTable.value.$data.d_multiSortMeta = []
}

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
          option-value="label" 
          size="small"
          overlayClass="hiddenColumnsMultiselect"
          inputId="hiddenColumnsMultiselect"
          class="min-w-64 max-h-14"
          >
          <template #header>
            <div class="flex flex-col items-center">
              <div class="flex flex-row justify-around my-2 w-full">
                <label for="toggleAllInternalColumnsHidden" class="font-bold">Hide Internal</label>
                <ToggleSwitch
                  input-id="toggleAllInternalColumnsHidden"
                  :model-value="amountVisableInternalColumns < 1"
                  @update:model-value="(e) => {
                    hiddenColumns = hiddenColumns.filter((col) => !intenalColums.includes(col));
                    if (e){
                      hiddenColumns = [...hiddenColumns, ...intenalColums];
                    }
                  }"
                />
              </div>
              <Seperator/>
            </div>
          </template>
        </MultiSelect>
        <label for="hiddenColumnsMultiselect">Hide Columns</label>
      </FloatLabel>


      <InputGroup class="max-w-80">
        <InputText 
          v-model="sortByString.key" 
          placeholder="Search..."
          @value-change="() => unsetPrimevueSort()"
          size="small"
          />
        <Button
          icon="pi pi-sliders-v"
          @click="(e) => sortByStringColumnSelectPopover?.toggle(e)"
          />
        <Popover ref="sortByStringColumnSelectPopover">
          <div class="flex flex-col">
            <p class="mb-2">Collumns not to search:</p>
            <FloatLabel variant="in">
              <MultiSelect
                v-model="sortByString.ignoreColumns"
                @update:model-value="(e) => sortByString.ignoreColumns = e" 
                :options="computehiddenColumnsOptions" 
                optionLabel="label"
                option-value="label"
                filter 
                size="small"
                inputId="sortByStringIgnoreColumns"
                class="w-64 max-h-14"
                />
                <label for="sortByStringIgnoreColumns">Excluded</label>
            </FloatLabel>

            <Seperator class="my-2 mx-auto"/>
            <div class="flex flex-row justify-between w-3/4">
              <Checkbox 
                v-model="sortByString.caseInsensitive"
                inputId="sortByStringCaseInsensitive"
                binary
                />
                <label for="sortByStringCaseInsensitive">Case-Insensitive</label>
            </div>
          </div>
        </Popover>
      </InputGroup>
      <div class="w-full h-full">

      <!-- Attempting to use lazy loading from the primevue datatable resulted in unpredictable behavior,
       using custom implementation instead -->
      <DataTable 
        ref="mainDataTable"
        :value="jobHandler?.computeDisplayedData.value"  
        class="bg-panel-h main-table"
        removableSort
        sortMode="multiple"
        @sort="() => {unsetSortByString()}"
        :scrollable="true"
        size="small"
        table-class="watched-table"
        paginator

        :rows="fetchAmount" 
        @update:rows="(e) => fetchAmount = e"
        :rowsPerPageOptions="[2, 10, 30, 50, 100, 500]"
        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        :currentPageReportTemplate="`({first} - {last}) / ${
          jobHandler?.computedAllFetched.value 
            ? jobHandler?.computeDisplayedData.value.length 
            : '?'
          }`"
        @page="(e) => {
          page = e.page;
          jobHandler?.lazyFetch(e.page*e.rows)
        }"
        >
          <ColumnGroup 
          type="header">
            <Row>
              <Column v-if="amountVisableInternalColumns" 
                header="Internal Data" 
                :colspan="amountVisableInternalColumns"
                class="top-header border-r-2 h-min"
              />
              <Column v-if="jobHandler.computeLayout.value.length - amountVisableInternalColumns" 
                header="External Data" 
                :colspan="jobHandler.computeLayout.value.length - amountVisableInternalColumns"
                class="top-header border-r-2 h-min"
              />
              <Column  
                :colspan="1"
                class="top-header h-min"
               />
            </Row>

            <Row>
              <template v-for="col in jobHandler?.computeLayout.value">
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

          <template v-for="col in jobHandler?.computeLayout.value">
              <Column :field="col.key">
                <template #body="slotProps">
                    <template v-if="jobHandler?.highlightSubstring.value[slotProps.index] 
                      && jobHandler?.highlightSubstring.value[slotProps.index][col.key]">
                      <p>
                        <template v-for="segment in getHighlightedSegments(String(slotProps.data[col.key]),
                          jobHandler?.highlightSubstring.value[slotProps.index][col.key])">
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
    </div>
    </dev>
  </main>
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