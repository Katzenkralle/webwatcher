<script setup lang="ts">
import { globalTableMetaData, getAllJobMetaData, deleteJob, type TableMetaData } from "@/composable/api/JobAPI";
import Card from 'primevue/card';
import Button from "primevue/button";
import AutoComplete from 'primevue/autocomplete';
import InputSwitch from "primevue/inputswitch"
import router from "@/router";
import ConfirmableButton from "@/components/reusables/ConfirmableButton.vue";

import SmallSeperator from "@/components/reusables/SmallSeperator.vue";

import { onMounted, ref, computed } from "vue";
import { useStatusMessage } from "@/composable/core/AppState";

const suggestedItems = ref<TableMetaData[]>([]);

onMounted(async () => {
  suggestedItems.value = await getAllJobMetaData();
});

const recomputeSugestions = (search: string) => {
  if (search === ""){
    return suggestedItems.value = globalTableMetaData.value;
  }
  else {
    suggestedItems.value =
      Object.values(globalTableMetaData.value).filter(
        (entry) => entry.name.includes(search)
      );
    }
};

const colorVariants = [
  "--color-primary",
  "--color-success",
  "--color-info",
  "--color-warning",
  "--color-error",
];
const elementColor = computed((): string[] => {
  return suggestedItems.value.map((entry) => {
    return colorVariants[entry.id % colorVariants.length];
  });
});

</script>

<template>
  <main>
    <div>
      <h1>Job Overview</h1>
      <p class="subsection">
        Here, you can see all the jobs that have been created. And create new once! 
        <br>
        Inspect the jobs the jobs to get a detailed overview over all data the Script has fetched.
        Click on edit to change the configuration of the job.
      </p>
      <SmallSeperator :is-dashed="true" class="mb-10"/>
      <div class="w-full flex flex-wrap justify-between items-end">
        <h3 class="self-end">Added Jobs:</h3>
        <Button
          label="Create Job"
          icon="pi pi-plus"
          @click="() => router.push('/jobs/create/')"
          />
      </div>
      <AutoComplete
          :suggestions="Object.values(suggestedItems).map((entry) => entry.name)"
          placeholder="Search for a table"
          @update:model-value ="(e) => recomputeSugestions(e)"
            class="w-full"
            inputClass="w-full"
        />

      <div class="flex flex-wrap justify-center">
        <template v-for="element, index in suggestedItems" :key="element.id">
          <Card class="w-83 min-h-95 m-4 border-2 border-info 
            hover:border-app color-change-trans">
            <template #title class="text-center">
              <h3 class="underline ">{{ element.name }}</h3>
            </template>
            <template #header>
              <div class="h-30 content flex flex-col items-center">
                <h2 :style="{ '-webkit-text-stroke': `2px var(${elementColor[index]})` }">
                  /{{ element.id }}
                </h2>
                <h2 :style="{'color': `var(${elementColor[index]})`}">/{{ element.id }}</h2>
              </div>
            </template>

            <template #content>
            <div class="flex flex-col w-full">
                <div class="w-full flex flex-wrap justify-between items-end">
                  <div class="flex flex-row items-center space-x-2">
                    <InputSwitch 
                      :default-value="element.enabled" 
                      @change="useStatusMessage().newStatusMessage('Implement Me', 'warn')"
                    />
                    <label v-if="element.enabled" class="text-success rounded-lg">Enabeld</label>
                    <label v-else  class="text-error rounded-lg">Disabled</label>
                  </div>
                  <a class="text-info">Last Run: {{ element.executedLast }}</a>
                </div>
                <p class="h-40 truncate bg-panel p-2 rounded-lg mt-3 whitespace-normal">{{ element.description }}</p>
                <SmallSeperator
                  class="card-seperator"/>
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
                  @confirm="() => deleteJob(element.id).then(async() => {
                    suggestedItems = suggestedItems.filter((entry) => entry.id !== element.id);
                  })"

                />
                <router-link :to="`/jobs/create/${element.id}`">
                  <Button
                  icon="pi pi-pencil"
                  severity="warn"
                  />
                </router-link>
                <router-link :to="`/jobs/table/${element.id}`">
                  <Button
                    icon="pi pi-search"
                    severity="success"
                  />
                </router-link>
              </div>
          </template>
          </Card>
        </template>
      </div>

      <div class="w-full">
        <a v-if="suggestedItems.length !== globalTableMetaData.length"
          class="text-warning">
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