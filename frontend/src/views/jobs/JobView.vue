<script setup lang="ts">
import { useJobUiCreator } from '@/composable/jobs/JobDataHandler'
import { jobUserDisplayConfig } from '@/composable/jobs/UserConfig'

import router from '@/router'

import FilterGroupRenderer from '@/components/filter/FilterGroupRenderer.vue'
import NavButtons from '@/components/reusables/NavButtons.vue'

import ConfirmableButton from '@/components/reusables/ConfirmableButton.vue'
import ColumnSelection from '@/components/jobs/ColumnSelection.vue'
import StringSearch from '@/components/jobs/StringSearch.vue'
import JobDataTable from '@/components/jobs/DataTable.vue'
import JobMetaDisplay from '@/components/jobs/MetaData.vue'
import SmallSeperator from '@/components/reusables/SmallSeperator.vue'
import PopupDialog from '@/components/reusables/PopupDialog.vue'
import FilterSelector from '@/components/filter/FilterSelector.vue'
import GraphInput from '@/components/Graphs/GraphInput.vue'
import GraphLoader from '@/components/Graphs/GraphLoader.vue'
import Regression from '@/components/jobs/RegressionInput.vue'

import Button from 'primevue/button'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

import SplitButton from 'primevue/splitbutton'

import { ref, watch, computed } from 'vue'

const currentJobId = ref(Number(router.currentRoute.value.params.id))
const downloadSuccessPopup = ref()

const changeJob = (newVal: any) => {
  if (!newVal) return
  try {
    const newId = Number(newVal)
    if (!currentJobId.value || (currentJobId.value && currentJobId.value !== newId)) {
      currentJobId.value = newId
      jobHandler = useJobUiCreator(newId)
    }
  } catch (e) {
    console.error(e)
  }
}

watch(
  () => router.currentRoute.value.params.id,
  (newVal) => {
    changeJob(newVal)
  },
)

// This cannot be compute, if it would be, random recomputations would happen
// when pressing some buttons - houres wasted: 2
let jobHandler = useJobUiCreator(currentJobId.value)

const userConfig = computed(() => {
  return jobUserDisplayConfig(currentJobId.value)
})

let hiddenColsRemoteState = false
watch(
  userConfig,
  (newHandler) => {
    newHandler
      .getRemoteStateHiddenCols()
      .then((res) => {
        if (res) {
          jobHandler.jobDataHandler.hiddenColumns.value = res
        }
      })
      .finally(() => {
        hiddenColsRemoteState = true
      })
  },
  { immediate: true },
)
watch(
  () => jobHandler.jobDataHandler.hiddenColumns.value,
  (newVal) => {
    if (!hiddenColsRemoteState) return
    userConfig.value.comitConfig({
      hiddenCols: JSON.stringify(newVal),
    })
  },
)

const graphCoardinator = ref()
</script>

<template>
  <main>
    <div :key="currentJobId" class="!max-w-full flex flex-col justift-center items-center">
      <div class="small-box">
        <div class="flex flex-wrap justify-between mb-2 mt-5">
          <NavButtons />
          <h1 class="self-center m-0! w-min sm:w-auto">Job Data & Managment</h1>
          <p></p>
        </div>
        <Accordion
          class="w-full mb-2"
          :value="['0']"
          multiple
          unstyled
          @tab-close="
            (e) => {
              if (e.index === 1) {
                graphCoardinator?.resetInput()
              }
            }
          "
        >
          <AccordionPanel value="0">
            <AccordionHeader>Overview</AccordionHeader>
            <AccordionContent>
              <JobMetaDisplay
                v-if="jobHandler?.metaData.value"
                :meta-data="jobHandler.metaData.value"
              />
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel value="1">
            <AccordionHeader>Graph Creator</AccordionHeader>
            <AccordionContent>
              <div class="content-box flex flex-col">
                <GraphInput
                  ref="graphCoardinator"
                  :job-data="jobHandler.jobDataHandler"
                  :user-config="userConfig"
                />
              </div>
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel value="2">
            <AccordionHeader>Regression</AccordionHeader>
            <AccordionContent>
              <div class="content-box flex flex-col">
                <Regression :data-handler="jobHandler.jobDataHandler" />
              </div>
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel value="3">
            <AccordionHeader>Logical Filters</AccordionHeader>
            <AccordionContent>
              <div class="content-box flex flex-col">
                <FilterSelector
                  :filter-context="jobHandler.filterContext"
                  :user-config="userConfig"
                />
                <SmallSeperator class="my-2 mx-auto" :is-dashed="true" />
                <FilterGroupRenderer :job-handler="jobHandler.jobDataHandler" />
              </div>
            </AccordionContent>
          </AccordionPanel>

          <AccordionPanel value="4">
            <AccordionHeader>View Options</AccordionHeader>
            <AccordionContent>
              <div class="content-box shrinkable">
                <ColumnSelection
                  :hidden-columns="jobHandler?.jobDataHandler.hiddenColumns.value"
                  :all-columns="jobHandler.jobDataHandler.computeLayoutUnfiltered.value"
                  :visable-columns="jobHandler.jobDataHandler.computeLayout.value"
                  :internal-columns="jobHandler.intenalColums"
                  @update:hidden-columns="
                    (e) => {
                      if (jobHandler) jobHandler.jobDataHandler.hiddenColumns.value = e
                    }
                  "
                />

                <StringSearch
                  v-if="jobHandler.sortByString.value"
                  :mut-sort-by-string="jobHandler?.sortByString.value"
                  :all-columns="jobHandler.jobDataHandler.computeLayoutUnfiltered.value"
                  class="shrink-0"
                  @update:key="() => jobHandler?.unsetPrimevueSort()"
                />
              </div>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>

      <div class="flex flex-col w-full h-full items-center">
        <SmallSeperator class="my-4" :is-dashed="true" />
        <h2 class="mb-2">Tabular</h2>
        <JobDataTable
          :job-handler="jobHandler"
          :graph-input-handler="graphCoardinator?.tableInputForGraph"
        />
        <GraphLoader
          class="mt-5"
          :job-id="currentJobId"
          :user-config="userConfig"
          :data-handler="jobHandler.jobDataHandler"
        />
      </div>

      <div class="small-box">
        <PopupDialog ref="downloadSuccessPopup" title="Success" message="Data was saved to file.">
          <template #footer>
            <Button label="Close" size="small" @click="() => downloadSuccessPopup?.closeDialog()" />
          </template>
        </PopupDialog>
        <div class="flex flex-row justify-center space-x-2 ml-auto mr-4 my-2">
          <ConfirmableButton
            button-label="Fetch all Data"
            button-icon="pi pi-refresh"
            confirm-message="Are you sure you want to fetch all data? This may take a while."
            confirm-icon="pi pi-exclamation-triangle text-warning"
            @confirm="() => jobHandler?.jobDataHandler.lazyFetch(0, true, true)"
          />

          <SplitButton
            label="Export visible"
            icon="pi pi-download"
            :model="[
              {
                label: 'Export fetched',
                icon: 'pi pi-download',
                command: () => {
                  jobHandler?.jobDataHandler
                    .saveToFile('all')
                    .then(() => downloadSuccessPopup?.openDialog())
                },
              },
            ]"
            @click="
              () => {
                jobHandler?.jobDataHandler
                  .saveToFile('visable', jobHandler?.jobDataHandler.hiddenColumns.value)
                  .then(() => downloadSuccessPopup?.openDialog())
              }
            "
          />
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
@reference "@/assets/global.css";

.small-box {
  @apply max-w-256 w-full;
}

.shrinkable {
  @apply flex 
    flex-col 
    md:flex-row
    space-y-2 
    md:space-y-0;
}
</style>
