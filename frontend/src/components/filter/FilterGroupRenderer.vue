<script setup lang="tsx">
import type { IterationContext, AbstractCondition, Group } from "@/composable/scripts/FilterGroups";
import BooleanRenderer from "./internal/BooleanRenderer.vue";
import NumberRenderer from "./internal/NumberRenderer.vue";
import StringRenderer from "./internal/StringRenderer.vue";
import type { useJobDataHandler } from "@/composable/scripts/JobDataHandler";

import { ref, defineProps, type Ref, watchEffect, watch } from "vue";

const props = defineProps<{
  groupIterator: IterationContext<Group>;
  jobHandler: ReturnType<typeof useJobDataHandler>;
  dragInfo?: Ref<Group | AbstractCondition | null>;
}>();

/*
 Job handler, if fully initialized will also hold a reference to groupIterator
 but this way we can be independent of the jobHandler. 
 E.g. Potentialy creating a copy that can then be exchanged with the original. 
*/

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

const getVueConditionComponent = (type: string) => {
  switch (type) {
    case "string":
      return StringRenderer;
    case "number":
      return NumberRenderer;
    case "boolean":
      return BooleanRenderer;
    default:
      return BooleanRenderer;
  }
};

const handelDragEnd = (destination: AbstractCondition | Group) => {
  const source = getDraggingInfo().value;
  if (source === null) {
    getDraggingInfo().value = null; 
    return;
  }
  if (source.type == destination.type) {
    props.groupIterator.exchangePosition(source, destination);
  } else if (source.type === 'condition' && destination.type === 'group') {
    props.groupIterator.changeParent(destination, source);
  } 
  getDraggingInfo().value = null;
};

const handleDragStart = (origin: AbstractCondition | Group) => {
  getDraggingInfo().value = origin;
};


</script>

<template>
  <div 
    class="border-l-4 flex"
    :style="{ borderLeftColor: `var(${getColorForConnnectionType(props.groupIterator.thisElement.value.connector)})` }">
    <div class="flex flex-row bg-panel-h"
      draggable="true"
      @dragstart="handleDragStart(props.groupIterator.thisElement.value)"
      @dragover="(e) => e.preventDefault()"
      @drop="handelDragEnd(props.groupIterator.thisElement.value)">
      <div :class="{'flex items-center dragging-placeholder': true,
                    'transform scale-80 !border-info ': getDraggingInfo().value}">
        <p class="px-1 h-fit">{{ props.groupIterator.thisElement.value.connector }}</p>
      </div>
    </div>
    <div>
      <template v-for="evaluatable, index in props.groupIterator.iter()" :key="`${props.groupIterator.path}/${index}`">
        <div v-if="index > 0" class="w-full h-2"/>
        
        <div v-if="evaluatable.thisElement.value.type === 'group'">
          <FilterGroupRenderer :jobHandler="props.jobHandler" :groupIterator="evaluatable as IterationContext<Group>" :dragInfo="getDraggingInfo()" />
        </div>
        <div v-else-if="evaluatable.thisElement.value.type === 'condition'" 
          class="outer-condition-container" 
          draggable="true" 
          @dragstart="handleDragStart(evaluatable.thisElement.value)" 
          @dragover="(e) => e.preventDefault()"
          @drop="handelDragEnd(evaluatable.thisElement.value)">
          <div :class="`condition-marker ${evaluatable.thisElement.value.negated ? 'bg-error' : 'bg-success'}`">
            <button
              class="self-start cursor-pointer"
              @click="evaluatable.thisElement.value.negated = !evaluatable.thisElement.value.negated ">
              <i class="pi pi-sort-alt-slash"></i>
            </button>            
            <div class="rotate-270 self-center">
              <p class="text-xs whitespace-nowrap">IF{{ evaluatable.thisElement.value.negated ? ' NOT' : "" }}</p>
            </div>
            <div class="self-end">
              <button
                class="cursor-pointer"
                @click="props.groupIterator.thisElement.value.evaluatable.splice(index, 1)">
                <i class="pi pi-arrows-v"></i>
              </button>
            </div>
          </div>
          <div :class="{'dragging-placeholder': true,
           'transform scale-80 !border-info ': getDraggingInfo().value?.type === 'condition'}">
            <component
              :is="getVueConditionComponent(evaluatable.thisElement.value.condition.type)"
              :cond="evaluatable.thisElement.value.condition as any" 
              :available-columns="props.jobHandler.getColumnsByType(evaluatable.thisElement.value.condition.type)" />
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