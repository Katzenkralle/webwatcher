<script setup lang="tsx">
import { defineComponent, ref, watchEffect, defineProps, h } from 'vue'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'

import { type NumberCondition, type NumberConditionTest } from '@/composable/jobs/FilterGroups'

const emit = defineEmits(['isInvalide'])
const props = defineProps<{
  cond: NumberCondition
  availableColumns: string[]
}>()

const TestSelectionVnode = defineComponent({
  props: {
    data: {
      type: Object as () => NumberConditionTest,
      required: true,
    },
    hotUpdate: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['update:modelValue', 'update:modeState'], // Declare emitted event

  setup(subProps, { emit }) {
    // Accept the emit function
    const selectedTestMode = ref(subProps.data.mode)
    const allowedModes: Record<string, string> = {
      col: 'Column',
      const: 'Constant',
    }

    const valueTestX = {
      col: ref(
        props.availableColumns.includes(String(subProps.data.value)) ? subProps.data.value : null,
      ),
      const: ref(typeof subProps.data.value === 'number' ? subProps.data.value : null),
    }

    const emitValue = () => {
      const emittedValue = {
        mode: selectedTestMode.value,
        value: selectedTestMode.value === 'col' ? valueTestX.col.value : valueTestX.const.value,
      }
      if (subProps.hotUpdate) {
        subProps.data.mode = emittedValue.mode
        subProps.data.value =
          typeof emittedValue.value === 'number' || emittedValue.value ? emittedValue.value : ''
      }
      emit('update:modelValue', emittedValue) // Emit value to the parent
    }
    const emitInvalide = (invalide: boolean) => {
      emit('update:modeState', invalide)
    }

    watchEffect(() => {
      emitInvalide(
        (valueTestX.col.value === null && selectedTestMode.value === 'col') ||
          (valueTestX.const.value === null && selectedTestMode.value === 'const'),
      )
    })

    return () =>
      h('div', { class: 'grid grid grid-cols-2 gap-4 w-full' }, [
        h(Select, {
          class: 'number-condition',
          modelValue: selectedTestMode.value,
          optionLabel: (option: string) => {
            return allowedModes[option] ? allowedModes[option] : option
          },
          size: 'small',
          'onUpdate:modelValue': (value: string) => {
            if (Object.keys(allowedModes).includes(value)) {
              selectedTestMode.value = value as 'col' | 'const'
              emitValue() // Emit whenever the mode changes
            }
          },
          options: Object.keys(allowedModes),
          placeholder: 'Select Mode',
        }),
        selectedTestMode.value === 'col'
          ? h(Select, {
              class: 'number-condition',
              modelValue: valueTestX.col.value,
              size: 'small',
              'onUpdate:modelValue': (value: any) => {
                valueTestX.col.value = value
                emitValue() // Emit when col value changes
              },
              options: props.availableColumns,
              invalid: valueTestX.col.value === null,
              placeholder: 'Select Column',
            })
          : h(InputNumber, {
              class: 'number-condition',
              modelValue: valueTestX.const.value,
              size: 'small',
              invalid: valueTestX.const.value === null,
              'onUpdate:modelValue': (value: number | null) => {
                valueTestX.const.value = value
                emitValue() // Emit when const value changes
              },
            }),
      ])
  },
})

const isInvalide = ref([false, false])
watchEffect(() => {
  emit(
    'isInvalide',
    isInvalide.value.some((e) => e),
  )
})
</script>

<template>
  <div class="inner-condition-container">
    <div class="header-condition-container">
      <h4>Number</h4>
      <slot name="header"></slot>
    </div>
    <TestSelectionVnode
      :data="props.cond.testFor1"
      :hot-update="true"
      @update:mode-state="(e) => (isInvalide[0] = e)"
    />
    <div class="grid justify-items-center grid-cols-5 w-full px-3">
      <div class="seperator" />
      <Select
        v-model="props.cond.opperation"
        class="mx-auto"
        :options="['==', '!=', '>', '<', '>=', '<=']"
        size="small"
        placeholder="Select Operation"
      />
      <div class="seperator" />
    </div>
    <TestSelectionVnode
      :data="props.cond.testFor2"
      :hot-update="true"
      @update:mode-state="(e) => (isInvalide[1] = e)"
    />
  </div>
</template>

<style lang="css" scoped>
/*Needet due to https://github.com/tailwindlabs/tailwindcss/discussions/16429 */
@reference "@/assets/global.css";

.number-condition {
  @apply w-full;
}

.seperator {
  @apply w-full h-2 bg-panel m-auto col-span-2;
}
</style>
