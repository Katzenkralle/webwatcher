<script setup lang="tsx">
import { type StringCondition } from "@/composable/scripts/FilterGroups";
import type { TableLayout } from "@/composable/api/JobAPI";
import Select  from "primevue/select";
import InputText from 'primevue/inputtext';

const props = defineProps<{
    cond: StringCondition;
    availableColumns: string[];
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
            :options="props.availableColumns"
            :invalid="!props.availableColumns.includes(props.cond.col)"
            placeholder="Select Column"
            />
            <InputText
            size="small"
            placeholder="Test for..."
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