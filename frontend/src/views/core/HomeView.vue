<script setup lang="ts">
import { computed, onMounted, ref, h  } from 'vue';
import { getAllJobMetaData } from '@/composable/api/JobAPI';
import { getAllScripts } from '@/composable/api/ScriptAPI';
import Card from 'primevue/card';

import SmallSeperator from '@/components/reusables/SmallSeperator.vue';

import ScriptIcon from '@/assets/img/script.svg';
import DatabaseTableIcon from '@/assets/img/database-table.svg';
import SettingsIcon from '@/assets/img/settings.svg';
import CodeBranchIcon from '@/assets/img/code-branch.svg';

const stateInfo = ref({
  amountJobs: 0,
  amountScripts: 0,
})

onMounted(async () => {
  stateInfo.value.amountJobs = (await getAllJobMetaData()).length;
  stateInfo.value.amountScripts = Object.keys(await getAllScripts()).length;
});

interface InfoCard {
  title: string;
  linkTo: string;
  acentColor: string;
  suddleAcentColor: string;
  description?: string;
  backgroundIcon?: string
  comand?: () => void;
}


const computedInfoCards = computed((): InfoCard[] => {
  return [
    {
      title: "Jobs",
      description: `You have ${stateInfo.value.amountJobs} jobs registered`,
      backgroundIcon: DatabaseTableIcon,
      linkTo: "/jobs",
      acentColor: "--color-app",
      suddleAcentColor: "--color-app-d",
    },
    {
      title: "Scripts",
      description: `You have ${stateInfo.value.amountScripts} scripts available`,
      backgroundIcon: ScriptIcon,
      linkTo: "/scripts",
      acentColor: "--color-special",
      suddleAcentColor: "--color-special-d",  
    },
    {
      title: "Settings",
      description: "Manage your settings here",
      backgroundIcon: SettingsIcon,
      linkTo: "/settings",
      acentColor: "--color-warning",
      suddleAcentColor: "--color-warning-d",  
    },
    {
      title: "GitHub",
      description: "View the source code on GitHub",
      backgroundIcon: CodeBranchIcon,
      linkTo: "",
      acentColor: "--color-success",
      suddleAcentColor: "--color-success-d",
      comand: () => {window.location.href = __APP_REPOSETORY__}
    }
  ];
});

</script>

<template>
  <main class="flex flex-col items-center">
    <div class="main_content">
    <h1>Home</h1>
    <SmallSeperator :is-dashed="true" class="my-4"/>
    <h3 class="mr-auto">Interesting Places:</h3>
   
    <div class="flex flex-wrap justify-center items-center">
      <router-link
        v-for="(card, index) in computedInfoCards"
        :key="index"
        :to="card.linkTo"
        @click="() => card.comand ? card.comand() : null">
        <Card class="relative w-75 min-h-40 overflow-hidden m-4 border-2 transition-colors duration-300"
          :style="`border-color:var(${card.suddleAcentColor}); 
            --hover-border-color:var(${card.acentColor});`"
          :class="'hover:!border-[var(--hover-border-color)]'">
          <template #title>
            <h3 class="mb-4 underline" :style="`color:var(${card.acentColor});`">
          {{ card.title }}
            </h3>
          </template>

          <template #content>
            <p>{{ card.description }}</p>
          
            <!-- Background SVG Icon -->
            <component
              :is="card.backgroundIcon"
              class="w-full h-full absolute top-0 left-0 opacity-20 z-0" 
              :style="`stroke:var(${card.acentColor});color:var(${card.acentColor});`"
                />
          </template>
        </Card>
      </router-link>
    </div>
    </div>
  </main>
</template>

<style scoped>
@reference "@/assets/global.css";

.p-card *:not(div):not(svg) {
  @apply relative z-10;
}

</style>