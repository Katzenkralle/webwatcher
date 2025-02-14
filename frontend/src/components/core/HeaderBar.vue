<script setup lang="ts">
import { ref, computed } from "vue";
import { useLoadingAnimation, useStatusMessage } from "@/composable/core/AppState";
import DropDownSelector from "@/components/reusables/DropDownSelection.vue";
import { useTableMetaData } from "@/composable/api/JobAPI";
import router from "@/router";
import Button from 'primevue/button';
import NotificationCenter from "./NotificationCenter.vue";

import LoadingBar from "@/components/reusables/LoadingBar.vue";

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
        return [element.name, changeUrl, element.id]
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
            <NotificationCenter class="ml-auto mr-4" y-expand="bottom" x-expand="left" ></NotificationCenter>

        </div>

        <LoadingBar :isLoading="useLoadingAnimation().isLoading" />
    </header>
</template>
