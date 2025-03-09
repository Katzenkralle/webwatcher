<script setup lang="ts">

import { computed, ref, type Ref } from 'vue';
import { FloatLabel, InputGroup, InputText, Button, MultiSelect, Popover, Checkbox } from 'primevue';
import SmallSeperator from '../reusables/SmallSeperator.vue';

import { type TableLayout } from '@/composable/api/JobAPI';
import {  } from 'vue';

const emit = defineEmits(['update:key', 
    'update:ignoreColumns',
    'update:caseInsensitive']);
const props = defineProps<{
  mutSortByString: {
    key: string;
    ignoreColumns: string[];
    caseInsensitive: boolean;
  };
  allColumns: TableLayout[];
}>();

const sortByStringColumnSelectPopover = ref(); // type Popover

const allColumnsOptions =  computed(() =>
        props.allColumns.map((col: TableLayout) => {
            return { label: col.key }
        }));

</script>


<template>
    <InputGroup class="max-w-80">
        <InputText 
          v-model="props.mutSortByString.key" 
          placeholder="Search..."
          @value-change="(e) => emit('update:key', e)"
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
                v-model="props.mutSortByString.ignoreColumns"
                @update:model-value="(e) => emit('update:ignoreColumns', e)" 
                :options="allColumnsOptions" 
                optionLabel="label"
                option-value="label"
                filter 
                size="small"
                inputId="sortByStringIgnoreColumns"
                class="w-64 max-h-14"
                />
                <label for="sortByStringIgnoreColumns">Excluded</label>
            </FloatLabel>

            <SmallSeperator class="my-2 mx-auto"/>
            <div class="flex flex-row justify-between w-3/4">
              <Checkbox 
                v-model="props.mutSortByString.caseInsensitive"
                @update:model-value="() => emit('update:caseInsensitive')"
                inputId="sortByStringCaseInsensitive"
                binary
                />
                <label for="sortByStringCaseInsensitive">Case-Insensitive</label>
            </div>
          </div>
        </Popover>
      </InputGroup>
</template>