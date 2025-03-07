<script setup lang="tsx">
import type { IterationContext, AbstractCondition, Group } from "@/composable/scripts/FilterGroups";
import BooleanRenderer from "./internal/BooleanRenderer.vue";
import NumberRenderer from "./internal/NumberRenderer.vue";
import StringRenderer from "./internal/StringRenderer.vue";
import TypeRenderer from "./internal/TypeRenderer.vue";
import type { useJobDataHandler } from "@/composable/scripts/JobDataHandler";

import { ref, defineProps, type Ref, computed, type ComputedRef } from "vue";
import { Select, Button } from "primevue";

const props = defineProps<{
  jobHandler: ReturnType<typeof useJobDataHandler>;
  groupIterator?: IterationContext<Group>;
  dragInfo?: Ref<Group | AbstractCondition | null>;
}>();

/*
 Job handler, if fully initialized will also hold a reference to groupIterator
 but this way we can be independent of the jobHandler. 
 E.g. Potentialy creating a copy that can then be exchanged with the original. 
*/

const groupIterator: ComputedRef<IterationContext<Group>>  = computed(() => {
  if (props.groupIterator) {
    return props.groupIterator as IterationContext<Group>;
  }
  if (props.jobHandler.filters) {
    return props.jobHandler.filters as IterationContext<Group>;
  }
  throw new Error("No Group Iterator provided");
});

const rootDragRef: Ref<Group | AbstractCondition | null> = ref(null);

const hoverAdditionArea = ref(false);

const isInvalide = ref<Record<number, boolean>>({});

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
    case "type":
      return TypeRenderer;
    default:
      return BooleanRenderer;
  }
};

const handelDragEnd = (destination: AbstractCondition | Group, exchangePossitionsIfPossible: Boolean = true) => {
  const source = getDraggingInfo().value;
  if (source === null || source === destination) {
    getDraggingInfo().value = null; 
    return;
  }
  if (source.type == destination.type) {
    if (exchangePossitionsIfPossible) {
      groupIterator.value.exchangePosition(source, destination);
    } else if (source.type === 'group' && destination.type === 'group') {
      groupIterator.value.changeParent(destination, source);
    }
  } else if (source.type === 'condition' && destination.type === 'group') {
    groupIterator.value.changeParent(destination, source);
  } 
  getDraggingInfo().value = null;
};

const handleDragStart = (origin: AbstractCondition | Group) => {
  getDraggingInfo().value = origin;
};


</script>

<template>
  <div 
    class="border-l-4 flex transition-all duration-300 h-min-24 h-max-content"
    :style="{ borderLeftColor: `var(${getColorForConnnectionType(groupIterator.thisElement.value.connector)})` }">
    <div class="flex flex-col bg-panel-h relative">
      <div class="flex h-full flex-row min-h-24"
        draggable="true"
        @dragstart="handleDragStart(groupIterator.thisElement.value)"
        @dragover="(e) => e.preventDefault()"
        @dragend="getDraggingInfo().value = null"
        @drop="handelDragEnd(groupIterator.thisElement.value, false)">
        <div :class="{'flex items-center dragging-placeholder relative': true,
                      'transform scale-80 !border-info ': getDraggingInfo().value}">
          <Button
            v-if="groupIterator.path !== '.0'"
            icon="pi pi-times"
            @click="groupIterator.removeFromFilterGroup()"
            severity="danger"
            size="small"
            class="absolute top-0 right-0 p-0 m-0 w-6 h-6"
            />
          <Select
            v-model="groupIterator.thisElement.value.connector"
            :options="['AND', 'OR', 'NOR', 'XOR']"
            placeholder="Connector"          
            size="small"/>
        </div>
      </div>
      <div :class="{'bottom-0': true,
                    'transform scale-80 !border-info': getDraggingInfo().value?.type === 'group',
                    'collapse': getDraggingInfo().value?.type !== 'group'}">
        <div class="w-full h-2 bg-panel"/>
          <p :class="{'text-center w-min': true, 'dragging-placeholder !border-info p-1 mt-1': getDraggingInfo().value}"
          @dragover="(e) => e.preventDefault()"
          @drop="handelDragEnd(groupIterator.thisElement.value)">
            Switch Possitions
          </p>
      </div>
    </div>

    <div class="flex flex-col w-full min-w-128 max-w-full">
      <template v-for="evaluatable, index in groupIterator.iter()" :key="`${groupIterator.path}/${index}`">
        <div v-if="index > 0" class="w-full h-2"/>
        
        <div class="flex flex-col w-[inherit] ">
          <div v-if="evaluatable.thisElement.value.type === 'group'">
            <FilterGroupRenderer :jobHandler="props.jobHandler" 
              :groupIterator="evaluatable as IterationContext<Group>" 
              :dragInfo="getDraggingInfo()" />
          </div>
          <div v-else-if="evaluatable.thisElement.value.type === 'condition'" 
            class="outer-condition-container" 
            draggable="true" 
            @dragstart="handleDragStart(evaluatable.thisElement.value)" 
            @dragover="(e) => e.preventDefault()"
            @dragend="getDraggingInfo().value = null"
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
                  @click="groupIterator.thisElement.value.evaluatable.splice(index, 1)">
                  <i class="pi pi-arrows-v"></i>
                </button>
              </div>
            </div>
            <div :class="{'dragging-placeholder w-full relative': true,
            'transform scale-80 !border-info ': getDraggingInfo().value?.type === 'condition'}">
          
              <component
                :is="getVueConditionComponent(evaluatable.thisElement.value.condition.type)"
                :cond="evaluatable.thisElement.value.condition as any" 
                :available-columns="props.jobHandler.getColumnsByType(
                    evaluatable.thisElement.value.condition.type
                  )" 
                @isInvalide="(e: boolean) => isInvalide[index] = e"
              >
              <template #header>
                <div class="flex flex-row-reverse items-center">
                  <Button
                  icon="pi pi-times"
                  @click="groupIterator.removeFromFilterGroup(evaluatable.thisElement.value)"
                  severity="danger"
                  size="small"
                  class="p-1"
                  />
                  <span
                    class="flex flex-row text-warning items-center mx-2"
                    v-if="isInvalide[index]">
                    <i class="pi pi-exclamation-triangle mr-1"/>
                    <p>Invalide Config: Ignoring</p>
                  </span>
                </div>
              </template>  
            </component>
            </div>
          </div>
        </div>
      </template>

      <div class="relative w-[inherit] flex mt-auto h-8 w-full transition-all duration-300 overflow-x-hidden"
           @mouseover="hoverAdditionArea = true"
           @mouseleave="hoverAdditionArea = false">
          
          <Transition name="addition-area">
            <div class="flex flex-row max-w-128 w-fit justify-around items-center"
              v-if="hoverAdditionArea">
              <template
              v-for="element in groupIterator.evaluatables">
                <Button
                  icon="pi pi-plus"
                  @click="groupIterator.addToFilterGroup(groupIterator.getStandartEvaluable(element as any))"
                  :label="element"
                  class="h-full"
                  size="small"
                  />
              </template>
                <!-- Serves as Placeholder -->
              <i class="pi pi-plus p-1 invisible"/>
            </div>
          </Transition>
          <i :class="{'absolute pi pi-plus p-1 bg-success text-h-text rounded-full cursor-pointer': true,
          ' transition-all ease-in-out duration-900 transform top-[50%] -translate-y-1/2': true,
          'right-[50%] translate-x-1/2': !hoverAdditionArea,
          'right-[0]': hoverAdditionArea }" 
          @click="hoverAdditionArea = !hoverAdditionArea"/>
        </div>
    </div>
  </div>
</template>
<style lang="css">
@reference "@/assets/global.css";

.condition-marker{
  @apply grid grid-rows-3 grid-cols-1 justify-items-center text-h-text h-auto w-5
}


.dragging-placeholder {
  @apply border-4 border border-dashed rounded-xl border-transparent
}

.outer-condition-container {
  @apply flex flex-row min-w-128 bg-panel-h min-h-24
}

.inner-condition-container {
  @apply p-1 flex flex-col items-center space-y-2 w-full
}

.header-condition-container {
  @apply flex flex-wrap w-full justify-between;
}


.addition-area-enter-active {
  transition: all 0.9s ease-in-out;
}
.addition-area-leave-active {
  transition: all 0.9s ease-in-out;
}

.addition-area-enter-from,
.addition-area-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

</style>