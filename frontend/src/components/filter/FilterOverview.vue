<script setup lang="tsx">
import type { Group, 
  AbstractCondition, 
  StringCondition,
  NumberCondition,
  BooleanCondition } from "@/composable/scripts/FilterGroups";
import { iterationWrapper, useFilterGroups, type IterationWrapperReturnType } from "@/composable/scripts/FilterGroups";
import { type TableLayout } from "@/composable/api/JobAPI";
import { ref, defineProps, type Ref } from "vue";

import FilterGroupRenderer from "./internal/FilterGroupRenderer.vue";

// Define Props
const props = defineProps<{
    filterGroupHandler: ReturnType<typeof useFilterGroups>;
    
}>();

const tableLayout: TableLayout[]  = [{
  key: "is_active",
  type: "boolean",
},
{
  key: "col_name",
  type: "number",
},
{
  key: "name",
  type: "string",
}];

</script>

<template>
  <div class="bg-panel m-4 border-2 border-primary rounded-lg p-2">
    <FilterGroupRenderer :groupIterator="iterationWrapper(props.filterGroupHandler).getRoot()"  :tableLayout="tableLayout" />
  </div>
</template>
