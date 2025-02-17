<script setup lang="tsx">
import { availableColumns, type BooleanCondition } from "@/composable/scripts/FilterGroups";
import type { TableLayout } from "@/composable/api/JobAPI";
import Select  from "primevue/select";

const props = defineProps<{
    cond: BooleanCondition;
    tableLayout?: TableLayout[]

}>();

</script>


<template>
    <div class="inner-condition-container">
        <h4>Boolean</h4>
        <div class="grid grid-cols-3 justify-items-center">
            <Select
            @value-change="(e) => props.cond.col = e"
            :default-value="props.cond.col"
            size="small"
            :options="availableColumns(props.tableLayout,'boolean')"
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