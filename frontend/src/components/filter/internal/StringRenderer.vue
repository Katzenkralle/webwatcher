<script setup lang="tsx">
import type { StringCondition } from "@/composable/scripts/FilterGroups";

const props = defineProps<{
    cond: StringCondition;
}>();

</script>


<template>
    <div>
        <h4>String</h4>
        <p>
            Test for: <span class="text-warn">{{props.cond.col}}</span>
            <span class="text-warn">{{props.cond.mode}}</span>
            <span class="text-warn">{{props.cond.testFor}}</span>
        </p>
    </div>
</template>