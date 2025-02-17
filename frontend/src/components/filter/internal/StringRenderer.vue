<script setup lang="tsx">
import { availableColumns, type StringCondition } from "@/composable/scripts/FilterGroups";
import type { TableLayout } from "@/composable/api/JobAPI";
import Select  from "primevue/select";
import InputText from 'primevue/inputtext';

const props = defineProps<{
    cond: StringCondition;
    tableLayout?: TableLayout[]
}>();

const modeAlias = {
    'includes': "Includes",
    'exact_match': "Exact Match",
    'regex': "RegEx"
}
</script>


<template>
    <div class="inner-condition-container">
        <h4>String</h4>
        <div class="grid grid-cols-2 gap-4">
            <Select
            size="small"
            v-model="props.cond.col"
            :options="availableColumns(props.tableLayout,'string')"
            />
            <InputText
            size="small"
            v-model="props.cond.testFor"
            />
        </div>
        <div>
            <Select
            size="small"
            v-model="props.cond.mode"
            :option-label="(val: keyof typeof modeAlias) => modeAlias[val]"
            :options="['includes', 'exact_match', 'regex']"
            />
        </div>
       
    </div>
</template>