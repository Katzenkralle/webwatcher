<script setup lang="tsx">
import { onMounted, ref } from 'vue';

import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
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
            <Button @click="() => logout()" 
                label="Logout" 
                icon="pi pi-sign-out" 
                severity="danger"
                class="w-min"/>
        </div>
    </div>
</template>