<script setup lang="tsx">
import type { BooleanCondition } from "@/composable/scripts/FilterGroups";

const props = defineProps<{
    cond: BooleanCondition;
}>();

</script>


<template>
    <div>
        <h4>Boolean</h4>
        <p>
            Test for: <span class="text-warn">{{props.cond.col}}</span> is 
            <span class="text-warn">{{String(props.cond.testFor)}}</span>
        </p>
    </div>
</template>