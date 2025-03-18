<script setup lang="ts">
import { DataTable, Column, Button } from 'primevue';
import { fetchScripts, globalScriptData, deleteScript } from '@/composable/api/ScriptAPI';

import { ref, computed, onMounted } from 'vue';

import SmallSeperator from '@/components/reusables/SmallSeperator.vue';
import ConfirmableButton from '@/components/reusables/ConfirmableButton.vue';

onMounted(() => {
    fetchScripts();
});
// Convert object to an array with script names included
const formattedGlobalScriptData = computed(() =>
    Object.entries(globalScriptData.value).map(([name, meta]) => ({
        name,
        ...meta,
    }))
);
</script>

<template>
    <main class="flex justify-center">
        <div class="flex flex-col items-center max-w-256 space-y-4">
            <h1>Script Overview</h1>
            <p class="subsection"> Here, you can upload new Watcher-Scripts, which can then be converted into Jobs.
                Additionally, the description and script of already uploaded ones may be edited.
                <br>
                <a class="font-bold">Note:</a> The available parameters that the script receives, as well as its name, must not be changed!
            </p>
            <SmallSeperator :isDashed="true" class="mb-10"/>
            
            <div class="w-full flex flex-wrap justify-between items-end">
                <h3>Added Scripts:</h3>
                <router-link to="/script/upload/">
                    <Button label="Add Script" icon="pi pi-plus" />
                </router-link>
            </div>

            <DataTable 
                class="w-full"
                :value="formattedGlobalScriptData" 
                paginator 
                :rows="5" 
                :rowsPerPageOptions="[5, 10, 20, 50]" 
                tableStyle="min-width: 50rem"
                paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                currentPageReportTemplate="({first} - {last}) / {totalRecords}"
                sortable>
                    <Column field="fsPath" header="File Path"></Column>
                    <Column field="name" header="Name"></Column>
                    <Column field="dynamicSchema" header="Supports static schema">
                        <template #body="slotProps">
                            <span v-if="Object.keys(slotProps.data.staticSchema).length">Yes</span>
                            <span v-else>No</span>
                        </template>
                    </Column>
                    <Column header="Edit/Delete">
                        <template #body="slotProps">
                            <div class="space-x-2">
                            <router-link :to="`/script/upload/${slotProps.data.name}`">
                                <Button 
                                icon="pi pi-pencil"
                                />
                            </router-link>
                            <ConfirmableButton 
                                confirmMessage="Are you sure you want to delete this script?
                                                All related jobs and data will be deleted as well.";
                                confirmIcon="pi pi-exclamation-triangle"
                                buttonIcon="pi pi-trash"
                                buttonClass="p-button-danger"
                                buttonLabel=""
                                @confirm="() => deleteScript(slotProps.data.name)"
                                />
                            </div>
                        </template>
                    </Column>
            </DataTable>
        </div>
    </main>
</template>