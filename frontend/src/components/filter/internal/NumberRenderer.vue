<script setup lang="tsx">
import { defineComponent, ref, computed, defineProps, h, type Ref } from "vue";
import Select from "primevue/select";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";

import type { NumberCondition } from "@/composable/scripts/FilterGroups";
import type { TableLayout } from "@/composable/api/JobAPI";
import type { RefSymbol } from "@vue/reactivity";

const props = defineProps<{ cond: NumberCondition; tableLayout?: TableLayout[] }>();


const operation = ref(props.cond.opperation);


const availableColumns = computed(() => {
  return props.tableLayout ? props.tableLayout.filter(col => col.type === "number").map(col => col.key) : [];
});
const TestSelectionVnode = defineComponent({
    props: {
        defaultValue: {
            type: [String, Number],
            required: true
        },
        defaultSelectedMode: {
            type: String,
            required: true
        }
    },
    emits: ['update:modelValue'], // Declare emitted event

    setup(props, { emit }) { // Accept the emit function
        const selectedTestMode = ref(props.defaultSelectedMode);
        const allowedModes = ['col', 'const'];

        const valueTestX = {
            col: typeof props.defaultValue === 'string' ? props.defaultValue : null,
            const: typeof props.defaultValue === 'number' ? props.defaultValue : null
        };

        const emitValue = () => {
            const emittedValue = selectedTestMode.value === 'col' ? valueTestX.col : valueTestX.const;
            emit('update:modelValue', emittedValue); // Emit value to the parent
        };

        return () =>
            h('div', { class: 'flex space-x-2' }, [
                h(Select, {
                    modelValue: selectedTestMode.value,
                    'onUpdate:modelValue': (value: string) => {
                        if (allowedModes.includes(value)) {
                            selectedTestMode.value = value as 'col' | 'const';
                            emitValue(); // Emit whenever the mode changes
                        }
                    },
                    options: allowedModes,
                    placeholder: 'Select Mode',
                }),
                h('div', {}, [
                    selectedTestMode.value === 'col'
                        ? h(Select, {
                              modelValue: valueTestX.col,
                              'onUpdate:modelValue': (value: any) => {
                                  valueTestX.col = value;
                                  emitValue(); // Emit when col value changes
                              },
                              options: availableColumns.value,
                              placeholder: 'Select Column',
                          })
                        : h(InputNumber, {
                              modelValue: valueTestX.const,
                              'onUpdate:modelValue': (value: number | null) => {
                                  valueTestX.const = value;
                                  emitValue(); // Emit when const value changes
                              },
                          })
                ])
            ]);
    }
});


</script>

<template>
    <div class="p-2 flex flex-col items-center space-y-2">
        <h4>Number Condition</h4>
        
        <TestSelectionVnode :defaultValue="props.cond.testFor1.value" :defaultSelectedMode="props.cond.testFor1.mode" />
        <Dropdown v-model="operation" :options="['==', '!=', '>', '<', '>=', '<=']" placeholder="Select Operation" />
        <TestSelectionVnode :defaultValue="props.cond.testFor2.value" :defaultSelectedMode="props.cond.testFor2.mode" @update:model-value="(e) => console.log(e)"/>

        
    </div>
</template>
