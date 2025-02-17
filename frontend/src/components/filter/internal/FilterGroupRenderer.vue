<script setup lang="tsx">
import type { Group, AbstractCondition } from "@/composable/scripts/FilterGroups";
import BooleanRenderer from "./BooleanRenderer.vue";
import NumberRenderer from "./NumberRenderer.vue";
import StringRenderer from "./StringRenderer.vue";
import type { TableLayout } from "@/composable/api/JobAPI";

import { ref, defineProps, toRef, computed, type Ref } from "vue";

const props = defineProps<{
  filterGroup: Group;
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


const removeFromFilterGroup = (evaluatable: Group|AbstractCondition) => {
        const parent = evaluatable.parent || null;
        if (parent) {
            parent.evaluatable = parent.evaluatable.filter((item) => item !== evaluatable);
        } else if (evaluatable.type === 'group') {
            evaluatable.evaluatable.forEach((item) => {
                item.parent = null;
            });
        } else {
          console.log('Error: No parent found');
        }
    }

const changeParent = (evaluatable: Group|AbstractCondition, newParent: Group) => {
        // This function also works if the evaluatable is not present in the tree
        // can be use to add, without reevaluating the parent
        if (evaluatable.parent) {
            removeFromFilterGroup(evaluatable);
        }
        evaluatable.parent = newParent;
        newParent.evaluatable.push(evaluatable);
    }

const handelDragEnd = (destination: AbstractCondition | Group) => {
  const source = getDraggingInfo().value;

  if (source === null) {
    getDraggingInfo().value = null;
    return;
  }
  const destParent = destination.type == "group" ? destination : destination.parent;
  const sourceParent = source.type == "group" ? source : source.parent;
  if (!destParent || !sourceParent) {
    console.log('Error: No parent of source/dest found');
    getDraggingInfo().value = null;
    return;
  }
  
  changeParent(destination, sourceParent)
  changeParent(source, destParent);
  getDraggingInfo().value = null;
};

const handleDragStart = (origin: AbstractCondition) => {
  getDraggingInfo().value = origin;
};


</script>

<template>
  <div 
    class="border-l-4 flex "
    :style="{ borderLeftColor: `var(${getColorForConnnectionType(props.filterGroup.connector)})` }">
    <div class="flex flex-row bg-panel-h">
      <div :class="{'flex items-center dragging-placeholder': true,
                    'transform scale-80 !border-info ': getDraggingInfo().value}">
        <p class="px-1 h-fit">{{ props.filterGroup.connector }}</p>
      </div>
    </div>
    <div>
      <template v-for="evaluatable, index in props.filterGroup.evaluatable" :key="props.filterGroup.evaluatable.indexOf(evaluatable)">
        <div v-if="index > 0" class="w-full h-2"/>
        
        <div v-if="evaluatable.type === 'group'">
          <FilterGroupRenderer :tableLayout="props.tableLayout" :filterGroup="evaluatable" :dragInfo="getDraggingInfo()" />
        </div>
        <div v-else-if="evaluatable.type === 'condition'" 
          class="outer-condition-container" 
          draggable="true" 
          @dragstart="handleDragStart(evaluatable)" 
          @dragover="(e) => e.preventDefault()"
          @drop="handelDragEnd(evaluatable)">
          <div :class="`condition-marker ${evaluatable.negated ? 'bg-error' : 'bg-success'}`">
            <button
              class="self-start cursor-pointer"
              @click="evaluatable.negated = !evaluatable.negated ">
              <i class="pi pi-sort-alt-slash"></i>
            </button>            
            <div class="rotate-270 self-center">
              <p class="text-xs whitespace-nowrap">IF{{ evaluatable.negated ? ' NOT' : "" }}</p>
            </div>
            <div class="self-end">
              <button
                class="cursor-pointer"
                @click="props.filterGroup.evaluatable.splice(index, 1)">
                <i class="pi pi-arrows-v"></i>
              </button>
            </div>
          </div>
          <div :class="{'dragging-placeholder': true,
           'transform scale-80 !border-info ': getDraggingInfo().value}">
            <BooleanRenderer v-if="evaluatable.condition.type === 'boolean'" :cond="evaluatable.condition" :tableLayout="props.tableLayout" />
            <NumberRenderer v-if="evaluatable.condition.type === 'number'" :cond="evaluatable.condition" :tableLayout="props.tableLayout"/>
            <StringRenderer v-if="evaluatable.condition.type === 'string'" :cond="evaluatable.condition" :tableLayout="props.tableLayout"/>
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