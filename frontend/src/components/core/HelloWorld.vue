<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type Ref } from "vue";
import Button from "primevue/button"
import {useAuth} from "@/composable/api/Auth";
import {useStatusMessage, useLoadingAnimation} from "@/composable/core/AppState";
import { useFilterGroups, test, type Group } from "@/composable/scripts/FilterGroups";

import FilterRenderer from "../filter/FilterOverview.vue";

const date = ref(new Date().toLocaleString());
const user = ref<any>(null);

useAuth().getUser().then((data) => {
    user.value = data;
});

let intervalId: number;

onMounted(() => {
    intervalId = setInterval(() => {
        date.value = new Date().toLocaleString();
    }, 1000);
});

onUnmounted(() => {
    clearInterval(intervalId);
});
const counter = ref(0);

const exampleFilterGroupLayout: Ref<Group> = ref({
    type: 'group',
    connector: "AND",
    evaluatable: [
        {
            type: 'condition',
            negated: false,
            condition: {
                type: "string",
                col: "name",
                testFor: "HelloWorld",
                mode: "includes"
            }
        },
        {
            type: 'group',
            connector: "OR",
            evaluatable: [
                {
                    type: 'condition',
                    negated: false,
                    condition: {
                        type: "boolean",
                        col: "is_active",
                        testFor: true
                    }
                },

                {
                    type: 'condition',
                    negated: true,
                    condition: {
                        type: "number",
                        testFor1: {
                            value: 1,
                            mode: "const"
                        }
                        ,
                        testFor2: {
                            value: "col_name",
                            mode: "col"
                        },
                        opperation: ">"
                    }
                }
            ]
        }        
    ]

} as Group)
const filterGroupHandler = useFilterGroups(ref(exampleFilterGroupLayout));
</script>

<template>
    <h1>Hello World</h1>
    <p>{{ user }}</p>
    <h3>Vue Test:</h3>
    <p>{{ date }}</p>
    <h3>PrimeVue Test:</h3>

    <FilterRenderer :filterGroupHandler="filterGroupHandler" />

    <div>
    <Button label="Toggle loading"
        @click="useLoadingAnimation().isLoading.value = !useLoadingAnimation().isLoading.value"/>
    <Button label="Trigger MSG"
            @click="() => {
                useStatusMessage().newStatusMessage(`Hello World ${counter}`, 'info');
                counter++;
            }"
    />
    <Button label="Test Filter groups"
            @click="() => {
                test();
            }"
    />
    </div>
    <textarea class="w-full h-[1000px] bg-crust" readonly>
        {{ useFilterGroups().safeJsonStringify() }}
    </textarea>
</template>