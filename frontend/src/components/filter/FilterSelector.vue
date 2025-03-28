<script setup lang="ts">
import InputGroup from 'primevue/inputgroup';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';

import { jobUserDisplayConfig } from '@/composable/jobs/UserConfig';
import { type Group, type IterationContext } from '@/composable/jobs/FilterGroups';
import { ref, watch, computed } from "vue";
import { useStatusMessage } from "@/composable/core/AppState";

const activeFilterConfig = ref<string>("")
const newFilterConfigName = ref<string>("")

const getCopyJsonSaveConfig = () => {
  return JSON.parse(props.filterContext.safeJsonStringify());
}

const props = defineProps<{
  filterContext: IterationContext;
  filterConfig: ReturnType<typeof jobUserDisplayConfig>
}>();
</script>

<template>
    <div class="flex flex-wrap items-center  justify-between w-full space-y-1">
    <Button
        label="Reset"
        icon="pi pi-refresh"
        size="small"
        @click="() => 
            {props.filterContext.replaceRoot(
                props.filterContext.getStandartEvaluable('Group') as Group
            );
            activeFilterConfig = '';
            newFilterConfigName = '';
            }"
        />
    <InputGroup class="max-w-80">
        <InputText
        placeholder="Save as..."
        v-model="newFilterConfigName"
        @update:model-value="(e: string|undefined) => newFilterConfigName = e ?? ''"
        size="small"
        />
        <Button
        v-model="newFilterConfigName"
        icon="pi pi-save"
        @click="() => {
            if (newFilterConfigName){
                activeFilterConfig = newFilterConfigName
                props.filterConfig.filter.value[newFilterConfigName] = getCopyJsonSaveConfig()
            } else {
                useStatusMessage().newStatusMessage('Invalide name for Filter', 'danger');
            }
        }"/>
    </InputGroup>

    <InputGroup class="w-min">
        <Select
            v-model="activeFilterConfig"
            :options="Object.keys(props.filterConfig.filter.value)"
            @update:model-value="(e: string) => {
                activeFilterConfig = e;
                newFilterConfigName = e;
                props.filterContext.replaceRoot(props.filterConfig.filter.value[e])
            }"
            placeholder="Select Filter"
            size="small"        
            />
        <Button
            icon="pi pi-trash"
            @click="() => {
                if (activeFilterConfig){
                delete props.filterConfig.filter.value[activeFilterConfig]
                activeFilterConfig = '';
                newFilterConfigName = '';
                props.filterContext.replaceRoot(
                    props.filterContext.getStandartEvaluable('Group') as Group
                );
                } else {
                useStatusMessage().newStatusMessage('No Filter selected', 'danger');
                }
            }"
            />
    </InputGroup>
</div>
</template>

