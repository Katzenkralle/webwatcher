<script setup lang="ts">
import { useRegressionHandler } from '@/composable/jobs/Regression'
import { useJobDataHandler } from '@/composable/jobs/JobDataHandler'

import Select from 'primevue/select'
import FloatLabel from 'primevue/floatlabel'
import katex from 'katex'

import { ref, watch } from 'vue'

const props = defineProps<{
  dataHandler: ReturnType<typeof useJobDataHandler>
}>()

const regression = useRegressionHandler(props.dataHandler)
const katexElement = ref<HTMLElement | null>(null)

watch(
  () => regression.computedRegressionResults.value,
  (newVal) => {
    katex.render(newVal, katexElement.value as HTMLElement, {
      throwOnError: false,
      displayMode: true,
      output: 'mathml',
      strict: false,
    })
  },
)
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap gap-2 justify-between items-center">
      <FloatLabel variant="in">
        <Select
          id="regression-type"
          v-model="regression.selectedRegression"
          :options="regression.regressionTypes"
        />
        <label for="regression-type">Select a regression type</label>
      </FloatLabel>
      <FloatLabel variant="in">
        <Select
          id="xColumn"
          v-model:model-value="regression.xColumn"
          :options="
            dataHandler.computeLayoutUnfiltered.value
              .filter((col) => col.type === 'number')
              .map((col) => col.key)
          "
        />
        <label for="xColumn">Select Column for X</label>
      </FloatLabel>
      <FloatLabel variant="in">
        <Select
          id="yColumn"
          v-model:model-value="regression.yColumn"
          :options="
            dataHandler.computeLayoutUnfiltered.value
              .filter((col) => col.type === 'number')
              .map((col) => col.key)
          "
        />
        <label for="yColumn">Select Column for Y</label>
      </FloatLabel>
    </div>
    <div ref="katexElement" class="mt-2 text-xl min-h-12 content-center" />
    <p class="text-text/50">
      The regression is conducted on all rows present in the table. Thus, filter rules will be
      applied.
    </p>
  </div>
</template>

<style scoped>
@reference "@/assets/global.css";

.p-floatlabel .p-select {
  @apply w-64;
}

.katex-html {
  @apply hidden;
}
</style>
