<script setup lang="tsx">
import { type TypeCondition } from '@/composable/jobs/FilterGroups'
import Select from 'primevue/select'
import { watchEffect } from 'vue'

const emit = defineEmits(['isInvalide'])
const props = defineProps<{
  cond: TypeCondition
  availableColumns: string[]
}>()

watchEffect(() => {
  emit('isInvalide', !props.availableColumns.includes(props.cond.col))
})
</script>

<template>
  <div class="inner-condition-container">
    <div class="header-condition-container">
      <h4>Type</h4>
      <slot name="header"></slot>
    </div>
    <div class="grid grid-cols-3 justify-items-center">
      <Select
        :invalid="!availableColumns.includes(props.cond.col)"
        :default-value="props.cond.col"
        :options="availableColumns"
        size="small"
        placeholder="Select Column"
        @value-change="(e) => (props.cond.col = e)"
      />
      <p class="my-auto">of type</p>
      <Select
        :default-value="props.cond.testFor"
        size="small"
        :options="['string', 'number', 'boolean', 'any', 'empty']"
        @value-change="(e) => (props.cond.testFor = e)"
      />
    </div>
  </div>
</template>
