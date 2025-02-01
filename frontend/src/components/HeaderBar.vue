<script setup lang="ts">
import "@/assets/slight_l_r.css";
import { ref, computed } from "vue";
import { useLoadingAnimation, useStatusMessage } from "@/composable/AppState";
import DropDownSelector from "@/components/DropDownSelection.vue";
import { useTableMetaData } from "@/composable/TableAPI";
import router from "@/router";
import Button from 'primevue/button';
import NotificationCenter from "./NotificationCenter.vue";

const activeDropDown = ref(-1);
/*
-1: none
0: table
*/

const isSlimMode = computed(() => {
    switch (router.currentRoute.value.path) {
        case '/login':
            return true;
        default:
            return false;
    }
}) 

const changeUrl = (_: number, a: number) => {
    router.push('/table/' + a)
}

const computeTableOptions = computed(() => {
    return useTableMetaData().localTableMetaData.value.map((element) => {
        return [element.label, changeUrl, element.id]
    })
})

</script>

<template>
    <!-- -12 > size nav -->
    <header class="w-full flex flex-col z-10 sticky" :style="{ top: `calc(var(--spacing) * -12)` }">
        <div class="flex flex-row items-center bg-panel">
            <nav class="flex flex-row h-12">
                <router-link to="/" class="flex">
                    <img class="selectable-menu-entry" src="@/assets/img/placeholder.png" alt="HOME"/>
                </router-link>
                <template v-if="!isSlimMode">
                    
                    <div class="relative flex flex-col min-w-32"
                        @mouseleave="activeDropDown = -1">
                        <button 
                            class="selectable-menu-entry" 
                            @mouseover="activeDropDown = 0" 
                            @click="() => { 
                                if (activeDropDown === 0) { 
                                    $router.push('/tables'); 
                                } 
                            }">
                            Tables
                        </button>                    
                        <DropDownSelector 
                        :multiSelect="false"
                        :isActive="activeDropDown == 0 ? true : false"
                        :options="computeTableOptions"
                        @close="activeDropDown = -1"
                        />
                    </div>
                    <router-link to="/scripts" class="selectable-menu-entry">
                        <a>Scripts</a>
                    </router-link>

                </template>

            </nav>
            <div class="flex flex-row mr-1">
                <p class="text-info italic"> {{ useStatusMessage().getRecentStatusMessage.value?.msg }}</p>
            </div>
            <NotificationCenter class="ml-auto mr-4" y-expand="bottom" x-expand="left" ></NotificationCenter>

        </div>

        <div id="appStatusBar" class="w-full h-1 bg-panel-d">
            <div v-if="useLoadingAnimation().isLoading.value" class="relative w-screen h-1 overflow-hidden">
                <div class="w-[100px] h-1 bg-info left-to-right"></div>
                <div class="w-[100px] h-1 bg-info left-to-right" :style="{ animationDelay: '0.25s' }"></div>
                <div class="w-[100px] h-1 bg-info left-to-right" :style="{ animationDelay: '0.5s' }"></div>
            </div>
        </div>
    </header>
</template>
