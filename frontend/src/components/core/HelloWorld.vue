<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type Ref } from "vue";
import Button from "primevue/button"
import {useAuth, requireLogin} from "@/composable/api/Auth";
import {useStatusMessage, useLoadingAnimation} from "@/composable/core/AppState";
import { useFilterIterationContext, type IterationContext } from "@/composable/jobs/FilterGroups";

import FilterGroupRenderer from "../filter/FilterGroupRenderer.vue";
import { useJobUiCreator } from "@/composable/jobs/JobDataHandler";

import PopupDialog from "../reusables/PopupDialog.vue";

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

let masterFilterGroup = ref({
    type: 'group',
    connector: "AND",
    evaluatable: []
}as Group);

let filterGroupHandler: IterationContext =  useFilterIterationContext(masterFilterGroup)

filterGroupHandler.addToFilterGroup(
                {
                type: 'condition',
                negated: false,
                condition: {
                    type: "string",
                    col: "name",
                    testFor: "HelloWorld",
                    mode: "includes"
                }
            });
filterGroupHandler.addToFilterGroup({
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
        });

const jobHandlerDemo = useJobUiCreator(0);
const popupRef = ref();

const testString = `{
    "type": "group",
    "connector": "AND",
    "evaluatable": [
        {
            "type": "group",
            "connector": "OR",
            "evaluatable": [
                {
                    "type": "condition",
                    "negated": true,
                    "condition": {
                        "type": "number",
                        "testFor1": {
                            "value": 1,
                            "mode": "const"
                        },
                        "testFor2": {
                            "value": "col_name",
                            "mode": "col"
                        },
                        "opperation": ">"
                    },
                    "parent": null
                }
            ],
            "parent": null
        },
        {
            "connector": "XOR",
            "evaluatable": [
                {
                    "condition": {
                        "type": "number",
                        "testFor1": {
                            "mode": "col",
                            "value": ""
                        },
                        "testFor2": {
                            "mode": "const",
                            "value": ""
                        },
                        "opperation": "=="
                    },
                    "negated": false,
                    "type": "condition",
                    "parent": null
                }
            ],
            "type": "group",
            "parent": null
        }
    ]
}`;
</script>

<template>

    <PopupDialog ref="popupRef" />

    <h1>Hello World</h1>
    <p>{{ user }}</p>
    <h3>Vue Test:</h3>
    <p>{{ date }}</p>
    <div class="bg-panel m-4 border-2 border-primary rounded-lg p-2">
        <FilterGroupRenderer :jobHandler="jobHandlerDemo.jobDataHandler" :groupIterator="filterGroupHandler as IterationContext<Group>" />
    </div>

    <Button 
        label="Clear"
        @click="() => {
            filterGroupHandler = useFilterIterationContext();
            //filterGroupHandler.root.value = dat;
        }"
    >   
    </Button>
    <div>
    <Button label="Toggle loading"
        @click="useLoadingAnimation().isLoading.value = !useLoadingAnimation().isLoading.value"/>
    <Button label="Trigger MSG"
            @click="() => {
                useStatusMessage().newStatusMessage(`Hello World ${counter}`, 'info');
                counter++;
            }"
    />
    <Button label="Trigger Error"
            @click="() => {
                useStatusMessage().newStatusMessage(`Hello World ${counter}`, 'danger');
                counter++;
            }"
    />
    <Button label="Logout"
            @click="() => {
                requireLogin();
            }"
    />
    <Button label="Open Dialog"
            @click="() => {
                console.log(popupRef);
                popupRef.openDialog();
            }"
    />
    <Button label="Test Load Stringifyed Groups"
            @click="() => {
                filterGroupHandler.replaceRoot(
                    JSON.parse(testString) as Group
                )
            }"
    />
    </div>
    <textarea class="w-full h-[1000px] bg-crust" readonly>
        {{filterGroupHandler.safeJsonStringify()}}
    </textarea>
</template>