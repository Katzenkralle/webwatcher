<script setup lang="ts">
import { DataTable, Column, Button } from 'primevue'
import { getAllScripts, globalScriptData, deleteScript } from '@/composable/scripts/ScriptAPI'

import { ref, computed, onMounted } from 'vue'

import InputText from 'primevue/inputtext'
import ScriptInterfaceDocs from '@/components/scripts/ScriptInterfaceDocs.vue'

import SmallSeperator from '@/components/reusables/SmallSeperator.vue'
import { globalTableMetaData } from '@/composable/jobs/JobMetaAPI'
import ConfirmableButton from '@/components/reusables/ConfirmableButton.vue'
import { FilterMatchMode } from '@primevue/core/api'
import { getUser } from '@/composable/core/User'

const scriptFilter = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
const isFiltered = ref(false)

const user = ref()

onMounted(() => {
  getAllScripts()
  getUser().then((data) => {
    user.value = data
  })
})
// Convert object to an array with script names included
const formattedGlobalScriptData = computed(() =>
  Object.entries(globalScriptData.value).map(([name, meta]) => ({
    name,
    ...meta,
  })),
)
</script>

<template>
  <main>
    <div>
      <h1>Script Overview</h1>
      <div class="subsection flex flex-col">
        <p>
          Here, you can create new Watcher by uploading a valid script. additionally, you can edit or delete existing once.
          <br />
          <a class="font-bold">Note:</a> The parameters a script recives when running them as a job
          may be altered by replacing the script but once existing parameters must never be removed. 
        </p>
        <ScriptInterfaceDocs class="mx-auto mt-4" />
      </div>
      <SmallSeperator :is-dashed="true" class="mb-10" />

      <div class="w-full flex flex-wrap justify-between items-end">
        <h3 class="self-end">Added Scripts:</h3>
        <router-link to="/script/upload/">
          <Button label="Add Script" icon="pi pi-plus" :disabled="!user || !user.isAdmin" />
        </router-link>
      </div>

      <InputText
        v-model="scriptFilter.global.value"
        class="w-full mt-4"
        placeholder="Search for a script"
      />

      <DataTable
        class="w-full"
        :value="formattedGlobalScriptData"
        :global-filter-fields="['fsPath', 'name', 'lastModified']"
        :filters="scriptFilter"
        paginator
        size="small"
        :rows="5"
        :rows-per-page-options="[5, 10, 20, 50]"
        table-style="min-width: 50rem"
        paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        current-page-report-template="({first} - {last}) / {totalRecords}"
        sortable
        @filter="
          (e) => {
            isFiltered = e.filteredValue.length < formattedGlobalScriptData.length
          }
        "
      >
        <Column field="fsPath" header="File Path"></Column>
        <Column field="name" header="Name"></Column>
        <Column field="lastModified" header="Last Modyfied"></Column>
        <Column header="Edit/Delete">
          <template #body="slotProps">
            <div class="flex flex-wrap lg:w-max gap-2">
              <router-link :to="`/script/upload/${encodeURIComponent(slotProps.data.name)}`">
                <Button icon="pi pi-pencil" />
              </router-link>
              <ConfirmableButton
                confirm-message="Are you sure you want to delete this script?
                                            All related jobs and data will be deleted as well."
                confirm-icon="pi pi-exclamation-triangle"
                button-icon="pi pi-trash"
                button-class="p-button-danger"
                button-label=""
                @confirm="() => deleteScript(slotProps.data.name).then(() => {
                  globalTableMetaData = globalTableMetaData.filter(
                    (entry) => entry.script !== slotProps.data.name,
                  )
                })"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <div class="w-full">
        <a v-if="isFiltered" class="text-warning"> Some scripts where filtered out... </a>
      </div>
    </div>
  </main>
</template>
