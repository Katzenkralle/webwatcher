<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {requestToken, writeAuthCookie, type AuthResponse} from "@/composable/api/Auth";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import InlineMessage from 'primevue/inlinemessage';

import { useLoadingAnimation, useQueryRouting } from '@/composable/core/AppState';
import { useRoute } from 'vue-router';

const route = useRoute();

const username = ref('');
const password = ref('');
const auth_error = ref('');


const submit = () => {
    useLoadingAnimation().setState(true);
    requestToken(username.value, password.value)
        .then((response: AuthResponse) => {
            writeAuthCookie(response.token_type, response.access_token);
            useQueryRouting().routeToQuery();
        })
        .catch((error: Error) => {
            auth_error.value = error.message;
        })
        .finally(() => {
            useLoadingAnimation().setState(false);
        });
}

onMounted(() => {
    if (route.query.token !== undefined && route.query.type !== undefined){
        writeAuthCookie(route.query.type as string, route.query.token as string);
        useQueryRouting().routeToQuery();
    } else {
        route.query.token = "";
        route.query.type = "";
    }
});

</script>
<template>
    <main class="flex flex-col items-center justify-center h-full">
            <h1>Login</h1>
            <form @submit.prevent="submit" class="flex flex-col w-1/4 mt-8">
                <div class="input-box">
                    <label for="username">Username</label>
                    <InputText 
                        id="username" 
                        v-model="username" 
                    required />
                    <label for="password">Password</label>
                    <Password 
                        id="password" 
                        :feedback="false" 
                        v-model="password" 
                        required />
                </div>
                <div class="input-box">
                    <Button 
                        label="Login" 
                        type="submit" 
                        :disabled="!username || !password"/>
                    <div :class="{ 'hidden': auth_error === '',
                                    'mt-4': true }">  
                        <InlineMessage 
                            class="w-full" 
                            severity="error"
                        >{{ auth_error }}</InlineMessage>
                    </div>
                </div>
            </form>
    </main>
</template>