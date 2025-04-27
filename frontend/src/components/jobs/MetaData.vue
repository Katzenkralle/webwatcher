<script setup lang="tsx">
import { type JobMeta } from '@/composable/jobs/JobMetaAPI'
import SmallSeperator from '../reusables/SmallSeperator.vue'
import { defineProps, defineComponent, h } from 'vue'

const props = defineProps<{
  metaData: JobMeta
}>()

const aData = defineComponent({
  setup(props, { slots }) {
    return () =>
      h(
        'a',
        {
          class: 'text-info',
        },
        slots.default ? slots.default() : '',
      )
  },
})
</script>

<template>
  <div class="subsection">
    <div class="flex flex-col justify-center">
      <span class="flex flex-wrap justify-between">
        <h5 class="italic text-info mt-auto">Id: {{ props.metaData.id }}</h5>
        <h2>{{ props.metaData.name }}</h2>
        <template v-if="props.metaData.enabled">
          <span class="text-success mt-auto">Enabled</span>
        </template>
        <template v-else>
          <span class="text-error mt-auto">Disabled</span>
        </template>
      </span>
      <SmallSeperator class="mx-auto" />
      <div class="info-columnn-container">
        <div class="flex flex-col">
          <aData class="text-lg">Discription</aData>
          <p class="[word-wrap:break-word]">{{ props.metaData.description }}</p>
          <p class="mt-auto">
            Using: <aData>{{ props.metaData.script }}</aData>
          </p>
        </div>
        <div>
          <ul class="list-disc list-inside">
            <li>
              Last Executed at: <aData>{{ props.metaData.executedLast ?? 'never' }}</aData>
            </li>
            <li>
              Corn: <aData>{{ props.metaData.executeTimer }}</aData>
            </li>
            <template v-if="props.metaData.forbidDynamicSchema">
              <li>
                Static Schema:
                <a class="text-error">Enabled</a>
              </li>
            </template>
            <template v-else>
              <li>
                Static Schema:
                <a class="text-success">Disabled</a>
              </li>
            </template>
            <li>
              Expected Script Data:
              <aData>{{ metaData.expectedReturnSchema }}</aData>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/global.css";

.info-columnn-container {
  @apply flex flex-wrap justify-between w-full py-2;
}
.info-columnn-container > * {
  @apply md:w-1/2 min-w-80 p-2 w-full;
}
.info-columnn-container > *:not(:last-child) {
  @apply border-b-2 md:border-r-2 md:border-b-0 border-h-panel-d;
}
</style>
