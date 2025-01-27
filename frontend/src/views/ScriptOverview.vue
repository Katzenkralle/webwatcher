<script setup lang="ts">
import router from '@/router';
import { DataTable, Column, Button } from 'primevue';
const scripts = [
    { name: 'Script1', path: '/path/to/script1', description: 'Description of Script1' },
    { name: 'Script2', path: '/path/to/script2', description: 'Description of Script2' },
    { name: 'Script3', path: '/path/to/script3', description: 'Description of Script3' }
];
</script>

<template>
    <main>
        <h1>Script Overview</h1>
        <router-link to="/script/upload">
            <Button label="Add Script" icon="pi pi-plus" />
        </router-link>
        <DataTable :value="scripts" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 50rem"
        paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        currentPageReportTemplate="({first} - {last}) / {totalRecords}">
                <Column field="name" header="Script Name"></Column>
                <Column field="path" header="Fs-Path"></Column>
                <Column field="description" header="Description"></Column>
                <Column header="edit" class="italic">
                    <template #body="slotProps">
                        <Button icon="pi-pencil"></Button>
                    </template>
                </Column>
        </DataTable>
    </main>
</template>