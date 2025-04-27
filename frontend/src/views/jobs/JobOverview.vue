<script setup lang="ts">
import {
  globalTableMetaData,
  getAllJobMetaData,
  deleteJob,
  updateOrCreateJob,
  type JobMeta,
} from '@/composable/jobs/JobMetaAPI'
import { refreshMeta } from '@/composable/core/helpers'
import Card from 'primevue/card'
import Button from 'primevue/button'
import AutoComplete from 'primevue/autocomplete'
import InputSwitch from 'primevue/toggleswitch'
import InputGroup from 'primevue/inputgroup'
import FloatLabel from 'primevue/floatlabel'
import router from '@/router'
import ConfirmableButton from '@/components/reusables/ConfirmableButton.vue'

import SmallSeperator from '@/components/reusables/SmallSeperator.vue'

import { ref, computed, watch } from 'vue'
import { useStatusMessage } from '@/composable/core/AppState'

const suggestedItems = ref<JobMeta[]>([])

watch(() => globalTableMetaData.value, async () => {
  suggestedItems.value = await getAllJobMetaData()
}, { immediate: true })


const recomputeSugestions = (search: string) => {
  if (search === '') {
    return (suggestedItems.value = globalTableMetaData.value)
  } else {
    suggestedItems.value = Object.values(globalTableMetaData.value).filter((entry) =>
      entry.name.includes(search),
    )
  }
}

const colorVariants = [
  '--color-primary',
  '--color-success',
  '--color-info',
  '--color-warning',
  '--color-error',
]
const elementColor = computed((): string[] => {
  return suggestedItems.value.map((entry) => {
    return colorVariants[entry.id % colorVariants.length]
  })
})
</script>

<template>
  <main>
    <div class="w-full flex flex-col items-center max-w-full!"> 
      <div class="main-content-box">
        <h1>Job Overview</h1>
        <p class="subsection">
          Here, you can see all the jobs that have been created. And create new once!
          <br />
          Inspect the jobs the jobs to get a detailed overview over all data the Script has fetched.
          Click on edit to change the configuration of the job.
        </p>
        <SmallSeperator :is-dashed="true" class="mb-10" />
        <div class="w-full flex flex-wrap justify-between items-end">
          <h3 class="self-end">Added Jobs:</h3>
          <div>
          <InputGroup>
            <Button label="Create Job" icon="pi pi-plus" @click="() => router.push('/jobs/create/')" />
            <Button
              icon="pi pi-refresh"
              @click=" () => refreshMeta()"/>
          </InputGroup>
          </div>
        </div>
        <FloatLabel variant="in">
          <AutoComplete
            :suggestions="Object.values(suggestedItems).map((entry) => entry.name)"
            class="w-full"
            size="small"
            input-class="w-full"
            @update:model-value="(e) => recomputeSugestions(e)"
          />
          <label>Search for a table</label>
        </FloatLabel>
      </div>

      <div class="flex flex-wrap justify-center max-w-300">
        <template
          v-for="(element, index) in suggestedItems.sort((a, b) => a.id - b.id)"
          :key="element.id"
        >
          <Card class="w-83 min-h-120 m-4 border-2 border-info hover:border-app color-change-trans">
            <h3 class="underline">{{ element.name }}</h3>
            <template #header>
              <div class="h-30 content flex flex-col items-center">
                <h2 :style="{ '-webkit-text-stroke': `2px var(${elementColor[index]})` }">
                  /{{ element.id }}
                </h2>
                <h2 :style="{ color: `var(${elementColor[index]})` }">/{{ element.id }}</h2>
              </div>
            </template>

            <template #title>
              <div class="flex flex-row items-center justify-center">
                <h3 class="text-2xl">{{ element.name }}</h3>
              </div>
            </template>

            <template #content>
              <div class="flex flex-col w-full h-full">
                <div class="w-full flex flex-wrap justify-between items-end space-y-2">
                  <div class="flex flex-row items-center space-x-2 h-8 m-0">
                    <InputSwitch
                      :default-value="element.enabled"
                      @change="
                        () => {
                          element.enabled = !element.enabled
                          updateOrCreateJob(element)
                            .then(() => {
                              useStatusMessage().newStatusMessage(
                                `Job ${element.name} was ${
                                  element.enabled ? 'enabled' : 'disabled'
                                } successfully!`,
                                'success',
                              )
                            })
                            .catch(() => {
                              useStatusMessage().newStatusMessage(
                                `Job ${element.name} could not be ${
                                  element.enabled ? 'enabled' : 'disabled'
                                }!`,
                                'danger',
                              )
                              element.enabled = !element.enabled
                            })
                        }
                      "
                    />
                    <label v-if="element.enabled" class="text-success rounded-lg">Enabeld</label>
                    <label v-else class="text-error rounded-lg">Disabled</label>
                  </div>
                  <div class="flex h-8">
                    <a class="text-info my-auto">Last Run: {{ element.executedLast ?? 'never' }}</a>
                  </div>
                </div>
                <p class="h-40 flex-grow truncate bg-panel p-2 rounded-lg my-2 whitespace-pre-wrap">
                  {{ element.description }}
                </p>
                <SmallSeperator style="margin-top: auto" class="card-seperator" />
              </div>
            </template>
            <template #footer>
              <div class="flex flex-row justify-between">
                <ConfirmableButton
                  button-label=""
                  button-icon="pi pi-trash"
                  button-class="p-button-danger"
                  confirm-message="Are you sure you want to delete this job?"
                  confirm-icon="pi pi-exclamation-triangle"
                  @confirm="
                    () =>
                      deleteJob(element.id).then(async () => {
                        suggestedItems = suggestedItems.filter((entry) => entry.id !== element.id)
                      })
                  "
                />
                <router-link :to="`/jobs/create/${element.id}`">
                  <Button icon="pi pi-pencil" severity="warn" />
                </router-link>
                <router-link :to="`/jobs/table/${element.id}`">
                  <Button icon="pi pi-search" severity="success" />
                </router-link>
              </div>
            </template>
          </Card>
        </template>
      </div>

      <div class="w-full">
        <a v-if="suggestedItems.length !== globalTableMetaData.length" class="text-warning">
          Some tables where filtered out...
        </a>
      </div>
    </div>
  </main>
</template>

<style scoped>
@reference "@/assets/global.css";

.card-seperator {
  @apply mx-auto mt-3;
}

:deep(.p-card-body),
:deep(.p-card-content) {
  @apply flex-grow!;
}

.content {
  position: relative;
}

.content h2 {
  color: #fff;
  font-size: 8em;
  position: absolute;
}

.content h2:nth-child(1) {
  color: transparent;
}

.content h2:nth-child(2) {
  animation: animate 4s ease-in-out infinite;
}

@keyframes animate {
  0%,
  100% {
    clip-path: polygon(
      0% 45%,
      16% 44%,
      33% 50%,
      54% 60%,
      70% 61%,
      84% 59%,
      100% 52%,
      100% 100%,
      0% 100%
    );
  }

  50% {
    clip-path: polygon(
      0% 60%,
      15% 65%,
      34% 66%,
      51% 62%,
      67% 50%,
      84% 45%,
      100% 46%,
      100% 100%,
      0% 100%
    );
  }
}
</style>
