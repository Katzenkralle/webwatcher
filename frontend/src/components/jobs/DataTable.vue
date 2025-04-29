<script setup lang="ts">
import {
  useJobUiCreator,
  type flattendJobEnty,
} from '@/composable/jobs/JobDataHandler'
import type { HighlightSubstring } from '@/composable/jobs/SortByString'
import { useStatusMessage } from '@/composable/core/AppState'

import PrimeDataTable from 'primevue/datatable'
import Button from 'primevue/button'
import Column from 'primevue/column'
import SplitButton from 'primevue/splitbutton'
import ColumnGroup from 'primevue/columngroup'
import Checkbox from 'primevue/checkbox'

import Row from 'primevue/row'
import { ref, onMounted, onUnmounted, computed, type Reactive, watch } from 'vue'
import type { MenuItem } from 'primevue/menuitem'

import EditEntryPopup from './EditEntryPopup.vue'
import { type GraphInput } from '@/composable/graphs/GraphDataHandler'
import type { jobEntryInput } from '@/composable/jobs/JobAPI'

const props = defineProps<{
  jobHandler: ReturnType<typeof useJobUiCreator>
  graphInputHandler?: Reactive<GraphInput>
}>()

const computedTableSize = ref<string>('85vh')

const openEditor = ref<{ id: number | undefined; readonly: boolean }>({
  id: undefined,
  readonly: true,
})

let resizeObserver: MutationObserver | undefined = undefined

const initTableSizeObserver = () => {
  /* Observes the size of the table and adjusts the height of the outer element to fit the content
  this is a workaround for the primevue datatable not supporting lazy loading with a fixed height table
  ToDo: Check if this can be done better and if this is not to expensive
  */
  const watchElement = document.querySelector('.watched-table')
  const header = document.querySelector('.p-datatable-thead')
  if (watchElement) {
    resizeObserver = new MutationObserver(() => {
      const headerSize = header ? header.clientHeight : 0
      const totalPages = Math.floor(
        props.jobHandler.jobDataHandler.computeDisplayedData.value.length /
          props.jobHandler.fetchAmount.value,
      )
      const elementsOnPage =
        props.jobHandler.page.value === totalPages
          ? props.jobHandler.jobDataHandler.computeDisplayedData.value.length %
            props.jobHandler.fetchAmount.value
          : props.jobHandler.fetchAmount.value
      const sizeOfOne = (watchElement.clientHeight - headerSize) / elementsOnPage
      const tableSize = sizeOfOne * props.jobHandler.fetchAmount.value + headerSize
      computedTableSize.value = tableSize > window.innerHeight * 0.85 ? '85vh' : `${tableSize}px`
    })
    resizeObserver.observe(watchElement, { attributes: true, childList: true, subtree: true })
  }
}

onMounted(() => {
  initTableSizeObserver()
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

const entryEditMenu = (forId: number | number[]): MenuItem[] => {
  return [
    {
      label: 'Edit',
      command: () => {
        if (typeof forId === 'number') {
          openEditor.value = { id: forId, readonly: false }
        } else {
          useStatusMessage().newStatusMessage(`Cannot bluk edit entries `, 'warn')
        }
      },
    },
    {
      label: 'Delete',
      command: () => {
        if (typeof forId === 'number') {
          forId = [forId]
        }
        props.jobHandler.jobDataHandler.deleteEntry(forId as number[])
      },
    },
    {
      label: 'Clone',
      command: () => {
        if (typeof forId === 'number') {
          forId = [forId]
        }
        forId.forEach((id: number) => {
          const entry = props.jobHandler.jobDataHandler.localJobData.value[id]
          if (entry) {
            props.jobHandler.jobDataHandler.addOrEditEntry(entry)
          }
        })
      },
    },
  ]
}

const amountVisableInternalColumns = computed(() =>
  props.jobHandler.jobDataHandler.computeLayout.value
    .map((col) => (props.jobHandler.intenalColums.includes(col.key) ? 1 : 0))
    .reduce((partialSum: number, a: number) => partialSum + a, 0),
)

const getHighlightedSegments = (
  text: string,
  highlighted: HighlightSubstring[],
): { text: string; highlight: boolean }[] => {
  highlighted = highlighted.sort((a, b) => a.end - b.end)
  let i = 0
  const segments = []
  highlighted.forEach((highlight) => {
    if (highlight.start > i) {
      segments.push({ text: text.slice(i, highlight.start), highlight: false })
    }
    segments.push({ text: text.slice(highlight.start, highlight.end), highlight: true })
    i = highlight.end
  })
  if (i < text.length) {
    segments.push({ text: text.slice(i), highlight: false })
  }
  return segments
}

const computedVisibleData = computed((): flattendJobEnty => {
  if (!props.graphInputHandler?.rows.enabled || !props.jobHandler.mainDataTable.value) {
    return []
  }
  return props.jobHandler.mainDataTable.value.processedData.slice(
    props.jobHandler.page.value * props.jobHandler.fetchAmount.value,
    (props.jobHandler.page.value + 1) * props.jobHandler.fetchAmount.value,
  )
})

const checkAllVisibleRows = () => {
  if (!props.graphInputHandler?.rows.enabled) {
    return
  }

  const { rows } = props.graphInputHandler
  const maxSelection = rows.maxSelection || Infinity
  const visibleEntries = computedVisibleData.value
  const selectedVisibleIds = visibleEntries
    .filter((entry: flattendJobEnty) => rows.selected.includes(entry.id))
    .map((entry: flattendJobEnty) => entry.id)

  // If all visible rows are already selected, deselect them
  if (selectedVisibleIds.length === Math.min(maxSelection, visibleEntries.length)) {
    // Remove all visible IDs from selection
    rows.selected = rows.selected.filter(
      (id) => !visibleEntries.some((entry: flattendJobEnty) => entry.id === id),
    )
  } else {
    // Add visible rows up to maxSelection limit
    visibleEntries.forEach((entry: flattendJobEnty) => {
      if (rows.selected.length < maxSelection && !rows.selected.includes(entry.id)) {
        rows.selected = [...rows.selected, entry.id] // using .push() would not trigger reactivity
      }
    })
  }
}

watch(
  () => computedVisibleData.value,
  (newVisibleData) => {
    if (!props.graphInputHandler?.rows.enabled) {
      return
    }
    // We ree-seelect selected entys to follow possible reordering
    const oldSelectedRows = props.graphInputHandler.rows.selected
    props.graphInputHandler.rows.selected = newVisibleData
      .map((entry: flattendJobEnty) => {
        if (oldSelectedRows.includes(entry.id)) {
          return entry.id
        }
      })
      .filter((entry: number | undefined) => entry !== undefined)
  },
  { immediate: true },
)
</script>

<template>
  <!-- Attempting to use lazy loading from the primevue datatable resulted in unpredictable behavior,
       using custom implementation instead -->
  <PrimeDataTable
    :id="`table${props.jobHandler.jobDataHandler.jobId}`"
    :ref="props.jobHandler.mainDataTable"
    :value="props.jobHandler.jobDataHandler.computeDisplayedData.value"
    data-key="id"
    class="bg-panel-h main-table"
    removable-sort
    sort-mode="multiple"
    :scrollable="true"
    size="small"
    table-class="watched-table"
    paginator
    :rows="props.jobHandler.fetchAmount.value"
    :rows-per-page-options="[2, 10, 30, 50, 100, 500]"
    paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
    :current-page-report-template="`({first} - {last}) / ${
      props.jobHandler.jobDataHandler.computedAllFetched.value
        ? props.jobHandler.jobDataHandler.computeDisplayedData.value.length
        : '?'
    }`"
    @sort="
      () => {
        props.jobHandler.unsetSortByString()
      }
    "
    @update:rows="(e: number) => (props.jobHandler.fetchAmount.value = e)"
    @page="
      (e: any) => {
        props.jobHandler.page.value = e.page
        props.jobHandler.jobDataHandler.lazyFetch(e.page * e.rows)
      }
    "
  >
    <ColumnGroup type="header">
      <Row>
        <Column
          v-if="amountVisableInternalColumns"
          header="Meta Data"
          :colspan="amountVisableInternalColumns"
          class="top-header border-r-2 h-min"
        />
        <Column
          v-if="
            props.jobHandler.jobDataHandler.computeLayout.value.length -
            amountVisableInternalColumns
          "
          header="Script Data"
          :colspan="
            props.jobHandler.jobDataHandler.computeLayout.value.length -
            amountVisableInternalColumns
          "
          class="top-header border-r-2 h-min"
        />
        <Column :colspan="2" class="top-header h-min" />
      </Row>

      <Row>
        <template
          v-for="col in props.jobHandler.jobDataHandler.computeLayout.value"
          :key="`col_${col.key}`"
        >
          <Column
            :field="col.key"
            :header="`${col.key} (${col.type})`"
            sortable
            class="border-r-2 border-b-0 border-crust border-dashed"
          >
            <template #header>
              <Checkbox
                v-if="props.graphInputHandler?.cols.enabled"
                v-model:model-value="props.graphInputHandler.cols.selected"
                :invalid="props.graphInputHandler.cols.invalid"
                :disabled="
                  (!props.graphInputHandler.cols.allowedTypes.includes(col.type) &&
                    props.graphInputHandler.cols.allowedTypes.length !== 0) ||
                  (props.graphInputHandler.cols.selected.length >=
                    props.graphInputHandler.cols.maxSelection &&
                    props.graphInputHandler.cols.maxSelection !== 0 &&
                    !props.graphInputHandler.cols.selected.includes(col.key))
                "
                :input-id="`cb_${col.key}`"
                name="cb_col"
                :value="col.key"
              />
            </template>
          </Column>
        </template>
        <Column
          field="vue_edit"
          header="Edit"
          :reorderable-column="false"
          :sortable="false"
          :pt="{
            columnTitle: 'mx-auto',
          }"
        />
        <Column>
          <template #header>
            <Checkbox
              v-if="props.graphInputHandler?.rows.enabled"
              :invalid="props.graphInputHandler?.rows.invalid"
              name="cb_row_all"
              :binary="true"
              :default-value="
                computed(
                  () =>
                    computedVisibleData.filter((entry: flattendJobEnty) =>
                      props.graphInputHandler?.rows.selected.includes(entry.id),
                    ).length ==
                    Math.min(
                      (props.graphInputHandler?.rows.maxSelection || 0) === 0
                        ? Infinity
                        : (props.graphInputHandler?.rows.maxSelection as number),
                      computedVisibleData.length,
                    ),
                )
              "
              readonly
              @click="() => checkAllVisibleRows()"
            />
          </template>
        </Column>
      </Row>
    </ColumnGroup>

    <template
      v-for="col in props.jobHandler.jobDataHandler.computeLayout.value"
      :key="`col_${col.key}`"
    >
      <Column :field="col.key">
        <template #body="slotProps">
          <template
            v-if="
              props.jobHandler.jobDataHandler.highlightSubstring.value[slotProps.index] &&
              props.jobHandler.jobDataHandler.highlightSubstring.value[slotProps.index][col.key]
            "
          >
            <p>
              <template
                v-for="segment in getHighlightedSegments(
                  String(slotProps.data[col.key]),
                  props.jobHandler.jobDataHandler.highlightSubstring.value[slotProps.index][
                    col.key
                  ],
                )"
                :key="`segment_${segment.text}`"
              >
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
        <EditEntryPopup
          v-if="openEditor.id === slotProps.data.id"
          :can-modify-schema="!props.jobHandler.jobDataHandler.hasStaticContext.value"
          :internal-columns="props.jobHandler.intenalColums"
          :layout="
            Object.assign(
              {},
              ...props.jobHandler.jobDataHandler.computeLayoutUnfiltered.value.map((col) => ({
                [col.key]: col.type,
              })),
            )
          "
          :readonly="openEditor.readonly"
          :entry-values="slotProps.data"
          @update="
            (obj: jobEntryInput) => {
              props.jobHandler.jobDataHandler.addOrEditEntry(obj)
              openEditor.id = undefined
            }
          "
          @close="() => (openEditor.id = undefined)"
        />

        <div class="w-full h-full flex justify-center">
          <SplitButton
            icon="pi pi-eye"
            size="small"
            :model="entryEditMenu(slotProps.data.id)"
            @click="() => (openEditor = { id: slotProps.data.id, readonly: true })"
          />
        </div>
      </template>
    </Column>
    <Column>
      <template #body="slotProps">
        <Checkbox
          v-if="props.graphInputHandler?.rows.enabled"
          :id="`cb_${slotProps.data.id}`"
          v-model:model-value="props.graphInputHandler.rows.selected"
          :invalid="props.graphInputHandler.rows.invalid"
          :disabled="
            props.graphInputHandler.rows.selected.length >=
              props.graphInputHandler.rows.maxSelection &&
            props.graphInputHandler.rows.maxSelection !== 0 &&
            !props.graphInputHandler.rows.selected.includes(slotProps.data.id)
          "
          :value="slotProps.data.id"
        />
      </template>
    </Column>

    <template #paginatorstart>
      <p></p>
    </template>

    <template #paginatorend>
      <EditEntryPopup
        v-if="openEditor.id === -1"
        :can-modify-schema="!props.jobHandler.jobDataHandler.hasStaticContext.value"
        :internal-columns="props.jobHandler.intenalColums"
        :layout="
          Object.assign(
            {},
            ...props.jobHandler.jobDataHandler.computeLayoutUnfiltered.value.map((col) => ({
              [col.key]: col.type,
            })),
          )
        "
        :readonly="openEditor.readonly"
        :entry-values="{}"
        :new-entry="true"
        @update="
          (obj: jobEntryInput) => {
            props.jobHandler.jobDataHandler.addOrEditEntry(obj)
            openEditor.id = undefined
          }
        "
        @close="() => (openEditor.id = undefined)"
      />
      <Button
        icon="pi pi-pen-to-square"
        label="Add entry"
        @click="() => (openEditor = { id: -1, readonly: false })"
      />
    </template>
  </PrimeDataTable>
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
.main-table .p-datatable-table-container {
  /* hacky workaround to avoide losing my fucking mind */
  height: v-bind(computedTableSize);
}
</style>
