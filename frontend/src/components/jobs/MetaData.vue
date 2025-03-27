<script setup lang="tsx">
import { type TableMetaData } from "@/composable/api/JobAPI";
import SmallSeperator from "../reusables/SmallSeperator.vue";
import { defineProps, defineComponent } from 'vue';

const props = defineProps<{
  metaData: TableMetaData;
}>();

const aData = defineComponent({
    setup(props, { slots }) {
        return () => (
            <a class='text-info'>
                { slots.default ? slots.default() : "" }
            </a>
        );
    }
});
</script>

<template>
    <div class="subsection">
        <div class="flex flex-col justify-center">
            <span class="grid grid-cols-5 items-end">
                <h5 class="italic text-info">Id: {{ metaData.id }}</h5>
                <h2 class="col-start-3 justify-self-center">{{ metaData.name }}</h2>
                <template v-if="metaData.enabled">
                    <span class="col-start-5 justify-self-end text-success">Enabled</span>
                </template>
                <template v-else>
                    <span class="col-start-5 justify-self-end text-error">Disabled</span>
                </template>
            </span>
            <SmallSeperator class="mx-auto" />
            <div class="info-columnn-container">
                <p>{{ metaData.description }}</p>

                <div>
                    <ul class="list-disc list-inside">
                        <li>Last Executed at: <aData>{{ metaData.executedLast }}</aData></li>
                        <li>Execute Every: <aData>{{ metaData.executeTimer}}s</aData></li>
                        <template v-if="metaData.forbidDynamicSchema">
                            <li>Dynamic Data: 
                                <a class="text-error">Forbidden</a>
                            </li>
                        </template>
                        <template v-else>
                            <li>Dynamic Schema: 
                                <a class="text-success">Allowed</a>
                            </li>
                        </template>
                        <li>Expected Script Data: 
                            <aData>{{ metaData.expectedReturnSchema }}</aData>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "@/assets/global.css";

.info-columnn-container {
    @apply flex flex-wrap justify-between w-full py-2
}
.info-columnn-container > * {
    @apply md:w-1/2 min-w-80 p-2 w-full
}
.info-columnn-container > *:not(:last-child) {
    @apply border-b-2 md:border-r-2 md:border-b-0 border-h-panel-d
}
</style>

