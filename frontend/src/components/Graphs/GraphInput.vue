<script setup lang="ts">
import Button from 'primevue/button'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputGroup from 'primevue/inputgroup'
import GraphRenderer from './GraphRenderer.vue'
import AnimatedArrow from '@/components/reusables/AnimatedArrow.vue'
import Checkbox from 'primevue/checkbox'

import SmallSeperator from '../reusables/SmallSeperator.vue'
import PopupImageSlideshow from '../reusables/PopupImageSlideshow.vue'
import { computed, ref, type Reactive } from 'vue'

import { useGraphConstructor, type GraphInput } from '@/composable/graphs/GraphDataHandler'
import { useJobDataHandler } from '@/composable/jobs/JobDataHandler'
import { jobUserDisplayConfig } from '@/composable/jobs/UserConfig'
import { scrollToElement } from '@/composable/core/helpers'

const props = defineProps<{
  jobData: ReturnType<typeof useJobDataHandler>
  userConfig?: ReturnType<typeof jobUserDisplayConfig>
}>()

const graphConstructor = computed(() => {
  return useGraphConstructor(props.jobData)
})

const resetInput = () => {
  graphConstructor.value.reset()
}

defineExpose<{ tableInputForGraph: Reactive<GraphInput>; resetInput: () => void }>({
  tableInputForGraph: graphConstructor.value.graphInput,
  resetInput,
})

const helpImages = [new URL('@/assets/img/help_slides/graph_help.webp', import.meta.url).href]

const title = ref('')
const lastSavedTitle = ref<string | undefined>(undefined)
</script>

<template>
  <div class="flex flex-col">
    <div class="options-grid">
      <div class="flex flex-row items-center">
        <ToggleSwitch id="multiRowViewGraphCreator" v-model="graphConstructor.rowBasedView.value" />
        <label for="multiRowViewGraphCreator" class="ml-2">
          {{ graphConstructor.rowBasedView.value ? 'Multi Row Graph' : 'Single Row Graph' }}
        </label>
      </div>
      <FloatLabel variant="in">
        <Select
          v-model="graphConstructor.selectedGraphType.value"
          size="small"
          class="w-60"
          :options="graphConstructor.availableGraphTypes.value"
        />
        <label>Select Graph Type</label>
      </FloatLabel>
      <FloatLabel variant="in">
        <Select
        class="w-60"
        :options="jobData.computeLayoutUnfiltered.value"
        :option-label="'key'"
        :option-value="'key'"
        v-model="graphConstructor.colUsedAsLabel.value"/>
        <label>Column used as Label</label>
      </FloatLabel>
    </div>
    <div class="options-grid mt-4">
      <div class="flex flex-row items-center min-h-16">
        <ToggleSwitch
          id="multiRowViewGraphCreator"
          v-model="graphConstructor.pullFutureRows.value"
        />
        <label for="multiRowViewGraphCreator" class="ml-2"> Dynamic Row Selection </label>
      </div>

      <template v-if="graphConstructor.pullFutureRows.value">
        <FloatLabel variant="in">
          <InputNumber
            size="small"
            class="w-60"
            :model-value="
              computed(() =>
                graphConstructor.pullXNewRows.value === 0
                  ? null
                  : graphConstructor.pullXNewRows.value,
              ).value
            "
            @update:model-value="
              (val) => {
                if (val === null) {
                  return
                }
                graphConstructor.pullXNewRows.value = val
              }
            "
          />
          <label>Amount of newest rows</label>
        </FloatLabel>
        <div>
          <Checkbox
            :binary="true"
            :readonly="true"
            :model-value="computed(() => graphConstructor.pullXNewRows.value === 0)"
            @click="
              () => {
                graphConstructor.pullXNewRows.value =
                  graphConstructor.pullXNewRows.value === 0 ? 10 : 0
              }
            "
          />
          <label class="ml-2">Use all Rows</label>
        </div>
      </template>
    </div>
    <SmallSeperator class="mx-auto mt-4 mb-2" :is-dashed="true" />
    <div class="min-h-128 flex flex-col items-center justify-center">
      <template v-if="!graphConstructor.curentGraph.value">
        <div v-if="graphConstructor.selectedGraphType.value" class="flex flex-col items-center">
          <span>
            Select
            <a class="text-info"
              >{{
                graphConstructor.graphInput.cols.maxSelection !== 0
                  ? graphConstructor.graphInput.cols.maxSelection
                  : 'up to all'
              }}
              column(s)</a
            >
            <template v-if="!graphConstructor.pullFutureRows.value">
              and
              <a class="text-info"
                >{{
                  graphConstructor.graphInput.rows.maxSelection !== 0
                    ? graphConstructor.graphInput.rows.maxSelection
                    : 'up to all'
                }}
                row(s)</a
              >
            </template>
          </span>
          <h3 class="text-warning">Use Checkboxes in the Table</h3>
          <AnimatedArrow
            v-if="
              graphConstructor.graphInput.cols.invalid || graphConstructor.graphInput.rows.invalid
            "
            @click="scrollToElement(`table${graphConstructor.jobId}`)"
          />
        </div>
        <span v-else class="flex flex-col items-center">
          <PopupImageSlideshow :images="helpImages" class="mb-1" title="Graph Type: Help" />
          <p>Select a <a class="text-info">graph type</a> first</p>
        </span>
      </template>
      <template v-else>
        <div class="flex flex-wrap w-full justify-between items-center [&>*]:mt-2">
          <InputGroup v-if="props.userConfig" class="max-w-80">
            <InputText
              v-model="title"
              placeholder="Save as..."
              size="small"
              @change="
                () => {
                  lastSavedTitle = undefined
                }
              "
            />
            <Button
              icon="pi pi-save"
              @click="
                async () => {
                  if (!props.userConfig || !graphConstructor.curentGraph.value) return
                  lastSavedTitle = title
                  props.userConfig.graph.value = {
                    add: [{ name: title, data: graphConstructor.curentGraph.value }],
                  }
                }
              "
            />
          </InputGroup>
          <Button
            v-if="lastSavedTitle === title"
            label="Go to saved graph"
            icon="pi pi-arrow-down"
            @click="
              () => {
                if (!lastSavedTitle) return
                graphConstructor.reset()
                scrollToElement('graph-' + lastSavedTitle)
              }
            "
          />
        </div>
        <GraphRenderer
          class="w-full h-full"
          :graph-data="graphConstructor.curentGraph.value"
          :computed-display-data="props.jobData.computeDisplayedData"
          :fetch-specific-data="props.jobData.retriveRowsById"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/global.css";

.options-grid {
  @apply flex flex-wrap justify-between space-y-2 md:grid md:grid-cols-3 md:gap-2;
}

.options-grid > * {
  @apply self-center; /* Center all items vertically */
}

.options-grid > *:nth-child(3n + 1) {
  @apply justify-self-start; /* First column items align left */
}

.options-grid > *:nth-child(3n + 2) {
  @apply justify-self-center; /* Second column items align center */
}

.options-grid > *:nth-child(3n) {
  @apply justify-self-end; /* Third column items align right */
}
</style>
