<script setup lang="tsx">
import { type StringCondition } from '@/composable/jobs/FilterGroups'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import { watchEffect } from 'vue'

const emit = defineEmits(['isInvalide'])
const props = defineProps<{
  cond: StringCondition
  availableColumns: string[]
}>()

const modeAlias = {
  includes: 'Includes',
  exact_match: 'Exact Match',
  regex: 'RegEx',
}

watchEffect(() => {
  emit('isInvalide', !props.availableColumns.includes(props.cond.col))
})
</script>

<template>
  <div class="inner-condition-container">
    <div class="header-condition-container">
      <h4>String</h4>
      <slot name="header"></slot>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <Select
        v-model="props.cond.col"
        size="small"
        :options="props.availableColumns"
        :invalid="!props.availableColumns.includes(props.cond.col)"
        placeholder="Select Column"
      />
      <InputText v-model="props.cond.testFor" size="small" placeholder="Test for..." />
    </div>
    <div>
      <Select
        v-model="props.cond.mode"
        size="small"
        :option-label="(val: keyof typeof modeAlias) => modeAlias[val]"
        :options="['includes', 'exact_match', 'regex']"
      />
    </div>
  </div>
</template>
