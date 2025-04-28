<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FloatLabel, InputGroup, InputText, Button, MultiSelect, Popover, Checkbox } from 'primevue'
import SmallSeperator from '../reusables/SmallSeperator.vue'

import { type TableLayout } from '@/composable/jobs/JobMetaAPI'
import {} from 'vue'

const emit = defineEmits(['update:key', 'update:ignoreColumns', 'update:caseInsensitive'])
const props = defineProps<{
  mutSortByString: {
    key: string
    ignoreColumns: string[]
    caseInsensitive: boolean
  }
  allColumns: TableLayout[]
}>()

const sortByStringColumnSelectPopover = ref() // type Popover

const allColumnsOptions = computed(() =>
  props.allColumns.map((col: TableLayout) => {
    return { label: col.key }
  }),
)

const localKey = ref('')
const localPopupState = {
  caseInsensitive: props.mutSortByString.caseInsensitive,
  ignoreColumns: props.mutSortByString.ignoreColumns,
}  

watch(
  () => props.mutSortByString.key,
  (newVal) => {
    localKey.value = newVal
  },
  { immediate: true },
)

</script>

<template>
  <InputGroup class="max-w-80">
    <InputText
      v-model="localKey"
      placeholder="Search..."
      size="small"
      class="h-14"
      @change="() => emit('update:key', localKey)"
    />
    <Button icon="pi pi-sliders-v" @click="(e) => sortByStringColumnSelectPopover?.toggle(e)" />
    <Popover ref="sortByStringColumnSelectPopover"
    @hide="() => {
        emit('update:ignoreColumns', localPopupState.ignoreColumns)
        emit('update:caseInsensitive', localPopupState.caseInsensitive)
      }">
      <div class="flex flex-col">
        <p class="mb-2">Collumns not to search:</p>
        <FloatLabel variant="in">
          <MultiSelect
            v-model="localPopupState.ignoreColumns"
            :options="allColumnsOptions"
            option-label="label"
            option-value="label"
            filter
            filter-placeholder="Search Columns..."
            size="small"
            input-id="sortByStringIgnoreColumns"
            class="w-64 h-14"
          />
          <label for="sortByStringIgnoreColumns">Excluded</label>
        </FloatLabel>

        <SmallSeperator class="my-2 mx-auto" />
        <div class="flex flex-row justify-between w-3/4">
          <Checkbox
            v-model="localPopupState.caseInsensitive"
            input-id="sortByStringCaseInsensitive"
            binary
          />
          <label for="sortByStringCaseInsensitive">Case-Insensitive</label>
        </div>
      </div>
    </Popover>
  </InputGroup>
</template>
