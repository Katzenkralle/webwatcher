<script setup lang="ts">
import InputGroup from 'primevue/inputgroup';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Galleria from 'primevue/galleria';   

import { jobUserDisplayConfig } from '@/composable/jobs/UserConfig';
import { type Group, type IterationContext } from '@/composable/jobs/FilterGroups';
import { ref } from "vue";
import { useStatusMessage } from "@/composable/core/AppState";

import PopupDialog from '@/components/reusables/PopupDialog.vue';

const activeFilterConfig = ref<string>("")
const newFilterConfigName = ref<string>("")

const getCopyJsonSaveConfig = () => {
  return JSON.parse(props.filterContext.safeJsonStringify());
}

const props = defineProps<{
  filterContext: IterationContext;
  filterConfig: ReturnType<typeof jobUserDisplayConfig>
}>();

const helpPopup = ref();

const helpImages = [
    new URL('@/assets/img/filters/help_filters1.webp', import.meta.url).href,
    new URL('@/assets/img/filters/help_filters2.webp', import.meta.url).href,
    new URL('@/assets/img/filters/help_filters3.webp', import.meta.url).href,
    new URL('@/assets/img/filters/help_filters4.webp', import.meta.url).href
]

</script>

<template>
<PopupDialog
    ref="helpPopup"
    title="Help: Logical Filters"
    :hide-seperator="true">
    <template #default>
        <Galleria 
        containerStyle="background-color: var(--color-base);"
        :value="helpImages" 
        :numVisible="5" 
        :showItemNavigators="true"
        :showThumbnails="false" 
        :showIndicators="true" 
        :changeItemOnIndicatorHover="true">
            <template #item="slotProps">
                <img :src="slotProps.item" style="width: 100%; display: block" />
            </template>
        </Galleria>
    </template>
    <template #footer>
        <div></div>
    </template>
</PopupDialog>


    <div class="flex flex-wrap items-center justify-between w-full space-y-1">
    <div>
        <Button
        icon="pi pi-question"
        severity="info"
        size="small"
        class="mr-2"
        variant="outlined"
        @click="() => {
            helpPopup?.openDialog();
        }"
        />
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
    </div>
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

