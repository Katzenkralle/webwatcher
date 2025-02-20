<script setup lang="tsx">
import { type BooleanCondition } from "@/composable/scripts/FilterGroups";
import Select  from "primevue/select";

const props = defineProps<{
    cond: BooleanCondition;
    availableColumns: string[];
}>();

</script>


<template>
    <div class="inner-condition-container">
        <h4>Boolean</h4>
        <div class="grid grid-cols-3 justify-items-center">
            <Select
            @value-change="(e) => props.cond.col = e"
            :invalid="!availableColumns.includes(props.cond.col)"
            :default-value="props.cond.col"
            :options="availableColumns"
            size="small"
            placeholder="Select Column"
            />
            <p class="my-auto">
                ==
            </p>
            <Select
            @value-change="(e) => props.cond.testFor = e"
            :default-value="props.cond.testFor"
            size="small"
            :options="[true, false]"
            />
        </div>
    </div>
</template>