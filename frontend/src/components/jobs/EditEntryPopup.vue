<script setup lang="tsx">
import PopupDialog from '../reusables/PopupDialog.vue';
import { onMounted, ref, defineComponent, h, computed, watchEffect} from 'vue';
import type { jobEntryInput } from '@/composable/api/JobAPI';
import SmallSeperator from '../reusables/SmallSeperator.vue';

import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Select from 'primevue/select';
import FloatLabel from 'primevue/floatlabel';

const props = defineProps<{
    layout: Record<string, string>,
    entryValues: Record<string, any>,
    internalColumns: string[],
    canModifySchema: boolean,
    readonly: boolean,
    newEntry?: boolean
}>();
const emits = defineEmits<{
    update: [payload: jobEntryInput];
    close: [];
}>();

const getDefaultForType = (type: any) => {
        if (type.includes('|')) {
            type = type.split('|')[0];
        }
        switch (type) {
            case 'string':
                return '';
            case 'number':
                return 0;
            default:
                return false;
        }
    };

const typeChange = (value: any, type: string) => {
    try  {
        switch (type) {
            case 'string':
                return String(value);
            case 'number':
                const asNum = Number(value);
                if (isNaN(asNum)) {
                    throw new Error('Invalid number');
                }
                return asNum;
            case 'boolean':
                return Boolean(value);
            default:
                return value;
        }
    } catch (e) {
        return getDefaultForType(type);
    }
}

const popup = ref();
const layout = ref(!props.newEntry ? props.layout : (() => {
    const new_layout = props.layout
    delete new_layout['id']
    return new_layout
    })());  
const writableEntryValues = ref(Object.keys(layout.value).reduce((acc, key: string) => {
    acc[key] = props.entryValues[key] || !props.newEntry  ? props.entryValues[key] : getDefaultForType(layout.value[key]);
    return acc;
}, {} as Record<string, any>));
const externalColumns = ref(
    Object.keys(layout.value).filter((key) => !props.internalColumns.includes(key))
);


onMounted(() => {
    popup.value.openDialog();
})

const newColumnName = ref<string>('');


const getElementForColumn = defineComponent({
    props: {
        column: {
            type: String,
            required: true
        },
        moduleValue: {
            type: [String, Boolean, Number],
            required: false,
        }
    },
    emits: ['onUpdate:modelValue'],
    setup(subprops: any, { emit, slots }: any) {
        let availableTypes = props.canModifySchema ? "string|number|boolean" : layout.value[subprops.column];
        const moduleValue = ref(subprops.moduleValue);
        const selectedType = ref<string>(typeof subprops.moduleValue || layout.value[subprops.column].split("|")[0]);

        watchEffect(() => {
            emit('onUpdate:modelValue', moduleValue.value)
        })

        const computeInputElement = computed(() => {
            switch (selectedType.value) {
                case 'string':
                    return h(FloatLabel, { variant: "in", class: 'w-full'  }, {
                        default: () => [
                            h('label', { for: `${subprops.column}-string`, class: 'z-10' }, [
                                props.readonly ? h('span', {class: 'text-warning mr-2 '}, 'Readonly') : '', 
                                "String"
                            ]),
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
                            h('label', { for: `${subprops.column}-number`, class: "z-10" }, [
                                props.readonly || subprops.column === 'id' ? h('span', {class: 'text-warning mr-2'}, 'Readonly') : '', 
                                "Number"
                            ]),
                            h(InputNumber, {
                                class: "w-full",
                                inputId: `${subprops.column}-number`,
                                readonly: props.readonly || subprops.column === 'id', 
                                modelValue: moduleValue.value as number,
                                "onUpdate:modelValue": (e: number) => moduleValue.value = e
                            })
                        ]
                    });

                case 'boolean':
                    return h("div", {class: 'w-full flex flex-col bg-crust p-2 rounded-lg border-info border-1 hover:border-app color-change-trans \
                        text-(--p-floatlabel-active-color) hover:text-(--p-floatlabel-focus-color)'}, [
                        h('label', { for: `${subprops.column}-boolean`, class: 'text-sm mb-3' }, [
                                props.readonly ? h('span', {class: 'text-warning mr-2'}, 'Readonly') : '', 
                                "Boolean"
                            ]),    
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
                case 'undefined':
                    return h('div', { class: 'text-warning mr-auto' }, `Column has no value or type for this entry`);
                default:
                    return h('div', { class: 'text-warning' }, `Unknown type: ${availableTypes} for ${subprops.column}`);

            }
        })
    
        if (availableTypes) {
            return () => h('div', {class: 'space-y-2 flex flex-col items-center w-[95%] md:w-[80%]'}, [
                h('div',  {class: 'flex flex-row justify-between items-center w-full'},[
                slots.default ? slots.default() : h("a"),
                h('h4', subprops.column),
                    h(Select, { 
                        options: [...availableTypes.split('|').map((elem) => {return {label: elem}}), 
                                    ...(selectedType.value === 'undefined' ? [{label: 'undefined'}] : [])],
                        optionLabel: "label",
                        optionValue: "label",
                        disabled: props.readonly,
                        modelValue: selectedType.value,
                        'onUpdate:modelValue': (val: string) => {
                            selectedType.value = val
                            moduleValue.value = typeChange(moduleValue.value, val)}
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
    emits('update', reconstruction as jobEntryInput)
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
        :close-only="props.readonly"
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
                            <template v-if="writableEntryValues[key] !== undefined || !props.readonly">
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
                                        @click="() => {
                                            externalColumns = externalColumns.filter(elem => elem !== key)
                                            delete writableEntryValues[key]
                                        }"
                                        />
                                </template>
                                </getElementForColumn>
                                <SmallSeperator class="mb-3"/>
                            </template>
                        </template>
                    </div>
                </div>


                <div v-if="props.canModifySchema && !props.readonly" 
                    class="flex flex-col items-center w-full mt-6">
                    <InputGroup class="mt-2 max-w-128">
                        <FloatLabel variant="in">
                            <InputText
                                v-model="newColumnName"
                                :disabled="props.readonly"/>
                            <label for="newColumnName">Add new Column: Name</label>
                        </FloatLabel>
                        <Button
                            :disabled="props.readonly"
                            icon="pi pi-plus"
                            @click="() => {
                                if (newColumnName !== '') {
                                    externalColumns.push(newColumnName);
                                    writableEntryValues[newColumnName] = '';
                                    layout[newColumnName] = 'string';
                                    newColumnName = '';
                                }
                            }"/>
                    </InputGroup>
                    </div>
            </div>
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