<script setup lang="tsx">
import PopupDialog from '../reusables/PopupDialog.vue';
import { onMounted, ref, defineComponent, h, computed, type Ref, watchEffect, watch } from 'vue';
import SmallSeperator from '../reusables/SmallSeperator.vue';

import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Select from 'primevue/select';
import FloatLabel from 'primevue/floatlabel';

const props = defineProps<{
    layout: Record<string, string>,
    entryValues: Record<string, any>,
    internalColumns: string[],
    canModifySchema: boolean,
    readonly: boolean
}>();
const emits = defineEmits(['update', 'close']);

const popup = ref();
const writableEntryValues = ref(props.entryValues);
const externalColumns = ref(
    Object.keys(props.layout).filter((key) => !props.internalColumns.includes(key))
);

onMounted(() => {
    popup.value.openDialog();
})




const getElementForColumn = defineComponent({
    props: {
        column: {
            type: String,
            required: true
        },
        moduleValue: {
            type: [String, Boolean, Number],
            required: true
        }
    },
    emits: ['onUpdate:modelValue'],
    setup(subprops: any, { emit, slots }: any) {
        const availableTypes = props.canModifySchema ? "string|number|boolean" : props.layout[subprops.column];
        const selectedType = ref<string>(props.layout[subprops.column].split("|")[0]);
        const moduleValue = ref(subprops.moduleValue);

        watchEffect(() => {
            emit('onUpdate:modelValue', moduleValue.value)
        })

        const computeInputElement = computed(() => {
            switch (selectedType.value) {
                case 'string':
                    return h(FloatLabel, { variant: "in", class: 'w-full'  }, {
                        default: () => [
                            h('label', { for: `${subprops.column}-string` }, "String"),
                            h(Textarea, {
                                class: "w-full",
                                inputId: `${subprops.column}-string`,
                                readonly: props.readonly,
                                modelValue: moduleValue.value as string,
                                "onUpdate:modelValue": (e: string) => moduleValue.value = e
                            })
                        ]
                    });

                case 'number':
                    return h(FloatLabel, { variant: "in", class: 'w-full' }, {
                        default: () => [
                            h('label', { for: `${subprops.column}-number`, class: 'z-10' }, "Number"),
                            h(InputNumber, {
                                class: "w-full",
                                inputId: `${subprops.column}-number`,
                                readonly: props.readonly,
                                modelValue: moduleValue.value as number,
                                "onUpdate:modelValue": (e: number) => moduleValue.value = e
                            })
                        ]
                    });

                case 'boolean':
                    return h("div", {class: 'w-full flex flex-col bg-crust p-2 rounded-lg border-info border-1 hover:border-app'}, [
                        h('label', { for: `${subprops.column}-boolean`, class: 'text-info mb-3' }, "Boolean"),
                        h('div', {class: 'flex flex-row items-center'}, [
                            h(Checkbox, {
                                class: 'mr-2',
                                id: `${subprops.column}-boolean`,
                                readonly: props.readonly,
                                modelValue: moduleValue.value as boolean,
                                binary: true,
                                "onUpdate:modelValue": (e: boolean) => moduleValue.value = e
                            }),
                            h("p", {}, moduleValue.value ? 'True' : 'False')
                        ])
                        
                    ]);

                default:
                    return h('div', {}, `Unknown type: ${availableTypes} for ${subprops.column}`);

            }
        })
    
        if (availableTypes) {
            return () => h('div', {class: 'space-y-2 flex flex-col items-center w-[95%] md:w-[80%]'}, [
                h('div',  {class: 'flex flex-row justify-between items-center w-full'},[
                slots.default ? slots.default() : h("a"),
                h('h4', subprops.column),
                    h(Select, { 
                        options: availableTypes.split('|').map((elem) => {return {label: elem}}),
                        optionLabel: "label",
                        optionValue: "label",
                        modelValue: selectedType.value,
                        'onUpdate:modelValue': (val: string) => selectedType.value = val 
                    }),
                ]),
                computeInputElement.value
            ]);
        }
        
        return () => h('div', 'No type defined');
    }
});


const submitChanges = () => {
    // reconstruct context/internal seperation
    let reconstruction: Record<string, any> = {}
    Object.keys(writableEntryValues.value).forEach((key) => {
        if  (props.internalColumns.includes(key)){
            reconstruction[key] = writableEntryValues.value[key]
        } else if (externalColumns.value.includes(key)) {
            if (!reconstruction["context"]) reconstruction["context"] = {}
            reconstruction["context"][key] = writableEntryValues.value[key]
        }
    })
    emits('update', reconstruction)
}

const waitEmitClose = () => {
    popup.value.closeDialog();
    setTimeout(() => {
        emits('close')
    }, 500)
}
</script>

<template>
    <PopupDialog
        ref="popup"    
        :title="props.readonly ?  'Entry Details' : 'Edit Details'"
        passthrou-classes="w-full h-full md:w-3/4 md:max-h-[95%] overflow-scroll"
        :hide-seperator="true"
        @cancel="waitEmitClose"
        @submit="(submited) => {submited ? submitChanges() : ''; waitEmitClose()}"
    >
        <template #default>
            <div class="w-full mt-4">
                <div class="section-container bg-panel-h rounded-2xl pt-2 pb-1">
                    <div class="rotation-box">
                        <h5>Meta Data</h5>
                    </div>
                    <div class="editor-box">
                        <template v-for="key in Object.keys(layout).filter(key => internalColumns.includes(key))"> 
                            <getElementForColumn 
                                :column="key" 
                                :moduleValue="writableEntryValues[key]"
                                @on-update:model-value="(e) => writableEntryValues[key] = e" />
                            <SmallSeperator class="mb-3"/>
                        </template>
                    </div>
                </div>

                <div class="section-container bg-panel-h/70 rounded-2xl pt-1 pb-2 mt-2">
                    <div class="rotation-box">
                        <h5>Script Data</h5>
                    </div>
                    <div class="editor-box">
                        <template v-for="key in externalColumns">
                            <getElementForColumn 
                                :column="key" 
                                class="mx-auto"
                                :moduleValue="writableEntryValues[key]"
                                @on-update:model-value="(e) => writableEntryValues[key] = e">
                                <template v-if="props.canModifySchema && !props.readonly" #default>
                                    <Button
                                    icon="pi pi-times"
                                    severity="danger"
                                    size="small"
                                    variant="text"
                                    @click="() => externalColumns = externalColumns.filter(elem => elem !== key) "
                                    />
                            </template>
                            </getElementForColumn>
                            <SmallSeperator class="mb-3"/>
                        </template>
                    </div>
                </div>
            </div>
        </template>

        <template v-if="props.readonly" #footer>
            <dev class="h-full w-full justify-end flex flex-row">
                <Button label="Cancel" @click="waitEmitClose" icon="pi pi-times" size="small" class="mr-2" />
            </dev>
        </template>
    </PopupDialog>
</template>

<style scoped>
@reference "@/assets/global.css";

.section-container {
    @apply flex flex-row overflow-x-scroll
}
.rotation-box {
    @apply [writing-mode:vertical-lr] flex justify-center self-center text-center ml-2
}
.rotation-box > * {
    @apply justify-center self-center
}
.editor-box  {
    @apply flex flex-col space-y-2 w-full justify-center
}

.editor-box > * {
    @apply mx-auto
}


</style>