<script setup lang="ts">
import { computed } from 'vue'

import { FloatLabel, MultiSelect, ToggleSwitch } from 'primevue'
import SmallSeperator from '../reusables/SmallSeperator.vue'
import { type TableLayout } from '@/composable/api/JobAPI'

const emit = defineEmits(['update:hiddenColumns'])
const props = defineProps<{
  hiddenColumns: string[]
  allColumns: TableLayout[]
  visableColumns: TableLayout[]
  internalColumns: string[]
}>()

const amountVisableInternalColumns = computed(() =>
  props.visableColumns
    .map((col) => (props.internalColumns.includes(col.key) ? 1 : 0))
    .reduce((partialSum: number, a: number) => partialSum + a, 0),
)

const allColumnsOptions = computed(() =>
  props.allColumns.map((col: TableLayout) => {
    return { label: col.key }
  }),
)
</script>

<template>
  <FloatLabel class="w-full md:w-80" variant="in">
    <MultiSelect
      :model-value="props.hiddenColumns"
      :options="allColumnsOptions"
      option-label="label"
      option-value="label"
      size="small"
      overlay-class="hiddenColumnsMultiselect"
      input-id="hiddenColumnsMultiselect"
      class="min-w-64 h-14"
      @update:model-value="(e: string[]) => emit('update:hiddenColumns', e)"
    >
      <template #header>
        <div class="flex flex-col items-center">
          <div class="flex flex-row justify-around my-2 w-full">
            <label for="toggleAllInternalColumnsHidden" class="font-bold">Hide Meta Data</label>
            <ToggleSwitch
              input-id="toggleAllInternalColumnsHidden"
              :model-value="amountVisableInternalColumns < 1"
              @update:model-value="
                (e) => {
                  let updatedColumns: string[] = hiddenColumns.filter(
                    (col) => !internalColumns.includes(col),
                  )
                  if (e) updatedColumns = [...updatedColumns, ...props.internalColumns]
                  emit('update:hiddenColumns', updatedColumns)
                }
              "
            />
          </div>
          <SmallSeperator />
        </div>
      </template>
    </MultiSelect>
    <label for="hiddenColumnsMultiselect">Hide Columns</label>
  </FloatLabel>
</template>
