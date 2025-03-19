<script setup lang="ts">
import { useTableMetaData, type TableMetaData } from "@/composable/api/JobAPI";
import Card from 'primevue/card';
import Button from "primevue/button";
import AutoComplete from 'primevue/autocomplete';
import router from "@/router";
import ConfirmableButton from "@/components/reusables/ConfirmableButton.vue";

import SmallSeperator from "@/components/reusables/SmallSeperator.vue";

import { onMounted, ref } from "vue";

const suggestedItems = ref<TableMetaData[]>([]);

onMounted(async () => {
  let a = await useTableMetaData().fetchTableMetaData();
  console.log(a);
  suggestedItems.value = a
});

const recomputeSugestions = (search: string) => {
  if (search === ""){
    return suggestedItems.value = useTableMetaData().localTableMetaData.value;
  }
  else {
    suggestedItems.value =
      Object.values(useTableMetaData().localTableMetaData.value).filter(
        (entry) => entry.name.includes(search)
      );
    }
};
</script>

<template>
  <main class="w-full h-full flex justify-center">
    <div class="main_content">
      <h1>Job Overview</h1>
      <p class="subsection">
        Here, you can see all the jobs that have been created. And create new once! 
        <br>
        Inspect the jobs the jobs to get a detailed overview over all data the Script has fetched.
        Click on edit to change the configuration of the job.
      </p>
      <SmallSeperator :is-dashed="true" class="mb-10"/>
      <div class="w-full flex flex-wrap justify-between items-end">
        <AutoComplete
          :suggestions="Object.values(suggestedItems).map((entry) => entry.name)"
          placeholder="Search for a table"
          @update:model-value ="(e) => recomputeSugestions(e)"
          />
        <Button
          label="Create Job"
          icon="pi pi-plus"
          @click="() => router.push('/job/create/')"
          />
      </div>

      <div class="flex flex-wrap justify-center">
        <template v-for="element in suggestedItems" :key="element.id">
          <Card class="w-80 min-h-95 m-4">
            <template #title class="text-center">{{ element.name }}</template>
            <template #subtitle>{{ element.description }}</template>
            <template #header>
              <!--<div ref="element.id" class="relative w-full h-20 bg-crust transition-all overflow-hidden duration-300">
                <div class="absolute bg-error w-2 h-2 rounded-full ">
                </div>
              </div>-->
            </template>
            <template #content>
            <div class="flex flex-col w-full">
                <div class="w-full flex flex-wrap justify-between items-end">
                  <a v-if="element.enabled" class="text-success rounded-lg">Enabeld</a>
                  <a v-else  class="text-error rounded-lg">Disabled</a>
                  <a class="text-info">Last Run: {{ element.executedLast }}</a>
                </div>
                <SmallSeperator 
                class="mx-auto"  
                  :is-dashed="true" 
                  passthrough-class="bg-panel-h"/>
                <p class="h-40 truncate">{{ element.description }}</p>
                <SmallSeperator
                  class="mx-auto"/>
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
                  @confirm="() => useTableMetaData().deleteTableMetaData(element.id)"

                />
                <router-link :to="`/job/create/${element.id}`">
                  <Button
                  icon="pi pi-pencil"
                  severity="warn"
                  />
                </router-link>
                <router-link :to="`/table/${element.id}`">
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

      <div>
        <a v-if="suggestedItems !== useTableMetaData().localTableMetaData.value"
          class="text-info">
          Some tables wher filtered out...
        </a>
      </div>
    </div>
  </main>
</template>
