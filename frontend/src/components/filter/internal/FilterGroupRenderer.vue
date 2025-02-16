<script setup lang="tsx">
import type { Group } from "@/composable/scripts/FilterGroups";
import BooleanRenderer from "./BooleanRenderer.vue";
import NumberRenderer from "./NumberRenderer.vue";
import StringRenderer from "./StringRenderer.vue";
import type { TableLayout } from "@/composable/api/JobAPI";

const props = defineProps<{
  filterGroup: Group;
  tableLayout?: TableLayout[];
}>();


const getColorForConnnectionType = (type: string) => {
 switch (type) {
   case "AND":
     return "--color-success";
   case "OR":
     return "--color-warning";
   case "NOR":
     return "--color-error";
   case "XOR":
     return "--color-info";
   default:
     return "--color-crust";
 }
};

</script>

<template>
  <div 
    class="border-l-4 flex "
    :style="{ borderLeftColor: `var(${getColorForConnnectionType(props.filterGroup.connector)})` }">
    <div class="flex flex-row items-center bg-panel-h">
      <p class="px-1 h-fit">{{ props.filterGroup.connector }}</p>
    </div>
    <div>
      <div v-for="evaluatable in props.filterGroup.evaluatable" :key="props.filterGroup.evaluatable.indexOf(evaluatable)">
        <div v-if="evaluatable.type === 'group'">
          <FilterGroupRenderer :tableLayout="props.tableLayout" :filterGroup="evaluatable" />
        </div>
        <div v-else-if="evaluatable.type === 'condition'" class="flex flex-row">
            <div  v-if="evaluatable.negated" class="bg-error flex items-center">
              <p class="text-xs text-h-text rotate-270">NOT</p>
            </div>
          <BooleanRenderer v-if="evaluatable.condition.type === 'boolean'" :cond="evaluatable.condition" :tableLayout="props.tableLayout" />
          <NumberRenderer v-if="evaluatable.condition.type === 'number'" :cond="evaluatable.condition" :tableLayout="props.tableLayout"/>
          <StringRenderer v-if="evaluatable.condition.type === 'string'" :cond="evaluatable.condition" :tableLayout="props.tableLayout"/>
        </div>
      </div>
    </div>
  </div>
</template>
