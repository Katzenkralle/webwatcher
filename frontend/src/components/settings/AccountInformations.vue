<script setup lang="tsx">
import { onMounted, ref } from 'vue';

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ConfirmableButton from '../reusables/ConfirmableButton.vue';
import { getUser } from '@/composable/api/User';
import { logout } from '@/composable/api/Auth';

const user =  ref();

onMounted(() => {
    getUser().then((data) => {
        user.value = data;
    });
});

</script>


<template>
    <div v-if="user" class="flex flex-col">
        <div class="input-box">
            <label for="username">Username</label>
            <InputText id="username" v-model="user.username" :disabled="true" />
        </div>
        <div  class="input-box">
            <label for="premission">Premission Level</label>
            <p v-if="user.isAdmin" class="text-warning"><span class="pi pi-user"/> Admin</p>
            <p v-else class="text-app"><span class="pi pi-user"/>User</p>
        </div>
        <div class="input-box">
            <label>Actions</label>
            <div class="flex flex-wrap space-x-2">
                <Button 
                    @click="() => logout()" 
                    label="Logout" 
                    icon="pi pi-sign-out" 
                    severity="danger"
                    class="w-min"/>
                <ConfirmableButton
                    v-if="user.isAdmin"
                    @confirm=""
                    buttonLabel="Remove Temporary Files"
                    buttonIcon="pi pi-trash"
                    buttonClass="p-button-warn"
                    confirmMessage="This will clean up unused temporary files
                    E.g. scripts that where uploaded but never implemented as watchers."
                    confirmIcon="pi pi-exclamation-triangle"/>
            </div>
        </div>
    </div>
</template>