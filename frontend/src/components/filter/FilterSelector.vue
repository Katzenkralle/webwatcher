<script setup lang="ts">
import InputGroup from 'primevue/inputgroup'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'

import { jobUserDisplayConfig } from '@/composable/jobs/UserConfig'
import { type Group, type IterationContext } from '@/composable/filter/FilterGroups'
import { ref, watch } from 'vue'
import { useStatusMessage } from '@/composable/core/AppState'

import PopupImageSlideshow from '@/components/reusables/PopupImageSlideshow.vue'

const activeFilterConfig = ref<string>('')
const newFilterConfigName = ref<string>('')

const getCopyJsonSaveConfig = () => {
  return JSON.parse(props.filterContext.safeJsonStringify())
}

const props = defineProps<{
  filterContext: IterationContext
  userConfig: ReturnType<typeof jobUserDisplayConfig>
}>()

const filterOptions = ref<string[]>([])
watch(
  () => props.userConfig.filter.value,
  async (newVal) => {
    filterOptions.value = Object.keys(await newVal)
  },
  { immediate: true },
)

const helpImages = [
  new URL('@/assets/img/help_slides/filters/help_filters1.webp', import.meta.url).href,
  new URL('@/assets/img/help_slides/filters/help_filters2.webp', import.meta.url).href,
  new URL('@/assets/img/help_slides/filters/help_filters3.webp', import.meta.url).href,
  new URL('@/assets/img/help_slides/filters/help_filters4.webp', import.meta.url).href,
]
</script>

<template>
  <div class="flex flex-wrap items-center justify-between w-full space-y-1">
    <div>
      <PopupImageSlideshow :images="helpImages" title="Logical Filter: Help" class="mr-2" />
      <Button
        label="Reset"
        icon="pi pi-refresh"
        size="small"
        @click="
          () => {
            props.filterContext.replaceRoot(
              props.filterContext.getStandartEvaluable('Group') as Group,
            )
            activeFilterConfig = ''
            newFilterConfigName = ''
          }
        "
      />
    </div>
    <InputGroup class="max-w-80">
      <InputText
        v-model="newFilterConfigName"
        placeholder="Save as..."
        size="small"
        @update:model-value="(e: string | undefined) => (newFilterConfigName = e ?? '')"
      />
      <Button
        v-model="newFilterConfigName"
        icon="pi pi-save"
        @click="
          () => {
            if (newFilterConfigName) {
              activeFilterConfig = newFilterConfigName
              props.userConfig.filter.value = {
                add: { [newFilterConfigName]: getCopyJsonSaveConfig() },
              }
            } else {
              useStatusMessage().newStatusMessage('Invalide name for Filter', 'danger')
            }
          }
        "
      />
    </InputGroup>

    <InputGroup class="w-min">
      <Select
        v-model="activeFilterConfig"
        :options="filterOptions"
        placeholder="Select Filter"
        size="small"
        @update:model-value="
          async (e: string) => {
            activeFilterConfig = e
            newFilterConfigName = e
            const savedConfig = (await props.userConfig.filter.value)[e]
            const group = props.filterContext.getStandartEvaluable('Group') as Group
            Object.assign(group, savedConfig)
            props.filterContext.replaceRoot(group)
          }
        "
      />
      <Button
        icon="pi pi-trash"
        @click="
          () => {
            if (activeFilterConfig) {
              props.userConfig.filter.value = { delete: [activeFilterConfig] }
              activeFilterConfig = ''
              newFilterConfigName = ''
              props.filterContext.replaceRoot(
                props.filterContext.getStandartEvaluable('Group') as Group,
              )
            } else {
              useStatusMessage().newStatusMessage('No Filter selected', 'danger')
            }
          }
        "
      />
    </InputGroup>
  </div>
</template>
