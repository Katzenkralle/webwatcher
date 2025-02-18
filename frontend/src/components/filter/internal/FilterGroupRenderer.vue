<script setup lang="tsx">
import type { IterationWrapperReturnType, AbstractCondition, Group } from "@/composable/scripts/FilterGroups";
import BooleanRenderer from "./BooleanRenderer.vue";
import NumberRenderer from "./NumberRenderer.vue";
import StringRenderer from "./StringRenderer.vue";
import type { TableLayout } from "@/composable/api/JobAPI";

import { ref, defineProps, toRef, computed, type Ref } from "vue";

type IterationWrapperConstraint = Extract<IterationWrapperReturnType, {thisElement: Group}>;
const props = defineProps<{
  groupIterator: IterationWrapperConstraint;
  tableLayout?: TableLayout[];
  dragInfo?: Ref<Group | AbstractCondition | null>;
}>();


const rootDragRef: Ref<Group | AbstractCondition | null> = ref(null);

const getDraggingInfo = () => {
  return props.dragInfo === undefined ? rootDragRef : props.dragInfo;
};

const getColorForConnnectionType = (type: string) => {
 switch (type) {
   case "AND":
     return "--color-special";
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



const handelDragEnd = (destination: AbstractCondition | Group) => {
  const source = getDraggingInfo().value;
  if (source === null) {
    getDraggingInfo().value = null; 
    return;
  }
  if (source.type == destination.type) {
    props.groupIterator.root.exchangePosition(source, destination);
  } else if (source.type === 'condition' && destination.type === 'group') {
    props.groupIterator.root.changeParent(source, destination);
  } 
  getDraggingInfo().value = null;
};

const handleDragStart = (origin: AbstractCondition | Group) => {
  getDraggingInfo().value = origin;
};


</script>

<template>
  <div 
    class="border-l-4 flex "
    :style="{ borderLeftColor: `var(${getColorForConnnectionType(props.groupIterator.thisElement.connector)})` }">
    <div class="flex flex-row bg-panel-h"
      draggable="true"
      @dragstart="handleDragStart(props.groupIterator.thisElement)"
      @dragover="(e) => e.preventDefault()"
      @drop="handelDragEnd(props.groupIterator.thisElement)">
      <div :class="{'flex items-center dragging-placeholder': true,
                    'transform scale-80 !border-info ': getDraggingInfo().value}">
        <p class="px-1 h-fit">{{ props.groupIterator.thisElement.connector }}</p>
      </div>
    </div>
    <div>
      <template v-for="evaluatable, index in props.groupIterator.iter()" :key="`${props.groupIterator.position}/${index}`">
        <div v-if="index > 0" class="w-full h-2"/>
        
        <div v-if="evaluatable.thisElement.type === 'group'">
          <FilterGroupRenderer :tableLayout="props.tableLayout" :groupIterator="evaluatable as IterationWrapperConstraint" :dragInfo="getDraggingInfo()" />
        </div>
        <div v-else-if="evaluatable.thisElement.type === 'condition'" 
          class="outer-condition-container" 
          draggable="true" 
          @dragstart="handleDragStart(evaluatable.thisElement)" 
          @dragover="(e) => e.preventDefault()"
          @drop="handelDragEnd(evaluatable.thisElement)">
          <div :class="`condition-marker ${evaluatable.thisElement.negated ? 'bg-error' : 'bg-success'}`">
            <button
              class="self-start cursor-pointer"
              @click="evaluatable.thisElement.negated = !evaluatable.thisElement.negated ">
              <i class="pi pi-sort-alt-slash"></i>
            </button>            
            <div class="rotate-270 self-center">
              <p class="text-xs whitespace-nowrap">IF{{ evaluatable.thisElement.negated ? ' NOT' : "" }}</p>
            </div>
            <div class="self-end">
              <button
                class="cursor-pointer"
                @click="props.groupIterator.thisElement.evaluatable.splice(index, 1)">
                <i class="pi pi-arrows-v"></i>
              </button>
            </div>
          </div>
          <div :class="{'dragging-placeholder': true,
           'transform scale-80 !border-info ': getDraggingInfo().value?.type === 'condition'}">
            <BooleanRenderer v-if="evaluatable.thisElement.condition.type === 'boolean'" :cond="evaluatable.thisElement.condition" :tableLayout="props.tableLayout" />
            <NumberRenderer v-if="evaluatable.thisElement.condition.type === 'number'" :cond="evaluatable.thisElement.condition" :tableLayout="props.tableLayout"/>
            <StringRenderer v-if="evaluatable.thisElement.condition.type === 'string'" :cond="evaluatable.thisElement.condition" :tableLayout="props.tableLayout"/>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<style lang="css" scoped>
@reference "@/assets/global.css";

.condition-marker{
  @apply grid grid-rows-3 grid-cols-1 justify-items-center text-h-text h-auto w-5
}


.dragging-placeholder {
  @apply border-4 border border-dashed rounded-full border-transparent
}

.outer-condition-container {
  @apply flex flex-row min-w-128 bg-panel-h min-h-24
}

.inner-condition-container {
  @apply p-1 flex flex-col items-center space-y-2 w-full
}

</style>