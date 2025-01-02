<script setup lang="ts">
import "@/assets/slight_l_r.css";
import { ref, onMounted, watch } from "vue";
import { useLoadingAnimation, useStatusMessage } from "@/composable/AppState";
import DropDownSelector from "@/components/DropDownSelection.vue";


const activeDropDown = ref(-1);
// Test Options for DropDownSelector
const options = [
  ['The', (n, a) => { console.log(n, a); }],
  ['First', (n, a) => { console.log(n, a); }],
  ['Test', (n, a) => { console.log(n, a); }]
];

</script>

<template>
    <header class="w-full sticky top-0  flex flex-col">
        <div class="flex flex-row items-center bg-panel">
            <nav class="flex flex-row h-12 ">
                <router-link to="/" class="flex">
                    <img class="p-1" src="@/assets/img/placeholder.png" alt="HOME"/>
                </router-link>
                <div class="relative flex flex-col min-w-32"
                    @mouseleave="activeDropDown = -1">
                    <button 
                        class="text-2xl h-full shrink-0 px-2 border-x-2 border-text-sub" 
                        :class="{ 'text-success border-success': activeDropDown === 0 }" 
                        @mouseover="activeDropDown = 0" 
                        @click="() => { 
                            if (activeDropDown === 0) { 
                                $router.push('/tables'); 
                            } 
                            activeDropDown = activeDropDown === 0 ? null : 0;
                        }">
                        Tables
                    </button>                    
                    <DropDownSelector 
                    :multiSelect="false"
                    :isActive="activeDropDown == 0 ? true : false"
                    :options="options"
                    @close="activeDropDown = -1"
                    />
                </div>

            </nav>
            <div class="flex flex-row ml-auto mr-1">
                <p class="text-info italic"> {{ useStatusMessage().statusMsg }}</p>
            </div>
        </div>

        <div id="appStatusBar" class="w-full h-1 bg-panel-deep">
            <div v-if="useLoadingAnimation().isLoading.value" class="relative w-screen h-1 overflow-hidden">
                <div class="w-[100px] h-1 bg-info left-to-right"></div>
                <div class="w-[100px] h-1 bg-info left-to-right" :style="{ animationDelay: '0.25s' }"></div>
                <div class="w-[100px] h-1 bg-info left-to-right" :style="{ animationDelay: '0.5s' }"></div>
            </div>
        </div>
    </header>
</template>
