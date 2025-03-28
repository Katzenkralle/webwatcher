<script setup lang="ts">
import Password from 'primevue/password';
import { ref, onMounted, computed } from 'vue';

import FloatLabel from 'primevue/floatlabel';
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

import { useStatusMessage } from '@/composable/core/AppState';
import { getAllSessions, changePassword, logout,
    SessionData, getSessionFromJWT, requestToken } from '@/composable/api/Auth';

import ConfirmableButton from '@/components/reusables/ConfirmableButton.vue';
import PupupDialog from '@/components/reusables/PopupDialog.vue';

const passwdChange = ref({
    old_passwd: '',
    new_passwd: '',
    new_passwd_confirm: ''
});

const sessions = ref<SessionData[]>([])
const fetchSessions = () => {
    getAllSessions()
        .then((response: SessionData[]) => {
            sessions.value = response.sessions;
        })
        .catch((error: Error) => {
            console.debug(error);
        });
}
onMounted(() => {
    fetchSessions()
});

const thisToken = computed(() => {
    return getSessionFromJWT()
});

const createNewTokenDialog = ref()

let newTokenPasswd = ""

</script>

<template>
    <main class="flex w-full justify-center">
        <PupupDialog ref="createNewTokenDialog"
            title="New Token: Confirmation"
            @submit="(confirmed) => {
                if (confirmed){
                    requestToken(thisToken.user, newTokenPasswd).then(() => {
                        useStatusMessage().newStatusMessage('Successfully created new Token', 'success')
                        fetchSessions()
                    }).catch((e) => {
                        useStatusMessage().newStatusMessage(e.message, 'danger')
                    })
                }
                newTokenPasswd = ''
            }"
            >
            <template #default>
                <div class="flex flex-col">
                    <FloatLabel variant="in">
                        <Password
                            v-model:model-value="newTokenPasswd"
                        />
                        <label>Re-enter Password</label>
                    </FloatLabel>
                </div>
            </template>
        </PupupDialog>

        <div class="flex flex-col w-256 items-center mx-auto mt-8">
            <h1 class="text-2xl font-bold mb-4">General Settings</h1>
            
            <form class="input-box space-y-4 w-full"
                @submit.prevent="submit">
                <label for="passwd_change">Change password:</label>

                <FloatLabel id="passwd_change" label="Old Password" variant="in" class="w-full">
                    <Password class="w-full"  v-model:model-value="passwdChange.old_passwd" required />
                    <label for="old_passwd">Old Password</label>
                </FloatLabel>
                <FloatLabel id="passwd_change" label="New Password" variant="in" class="w-full">
                    <Password class="w-full" v-model:model-value="passwdChange.new_passwd" required />
                    <label for="new_passwd">New Password</label>    
                </FloatLabel>
                <FloatLabel id="passwd_change" label="Confirm New Password" variant="in" class="w-full">
                    <Password class="w-full" v-model:model-value="passwdChange.new_passwd_confirm" required />
                    <label for="new_passwd_confirm">Confirm New Password</label>
                </FloatLabel>
                <Button 
                    label="Submit" 
                    type="submit"
                    @click="() => {
                        if (passwdChange.new_passwd !== passwdChange.new_passwd_confirm) {
                            useStatusMessage().newStatusMessage('Passwords do not match.', 'danger');
                            return;
                        }
                        changePassword(passwdChange.old_passwd, passwdChange.new_passwd)
                    }" />
            </form>

            <div class="input-box">
                <label>Manager Sessions:</label>
                <ul class="list-disc">
                    <div v-for="session in sessions" :key="session.id" 
                        class="flex flex-row overflow-hidden justify-between items-center mb-3">
                        <div class="flex flex-col mr-2">
                            <span class="font-bold text-info">Session ID: </span>
                            <span v-if="thisToken.session == session.sessionId" class="text-sm text-warning">This Session</span>
                            <span v-if="session.expiration" class="text-sm  text-info">Expiration:</span>
                        </div>

                        <div class="flex flex-col mr-2">
                            <span class="text-text-d max-w-48 truncate"> {{ session.sessionId }}</span>
                            <span v-if="session.expiration" class="text-sm text-text-d"> {{ session.expiration }}</span>
                        </div>

                        <ConfirmableButton
                            confirmMessage="Are you sure you want to terminate this session?"
                            confirmIcon="pi pi-exclamation-triangle"
                            buttonIcon="pi pi-times"
                            buttonLabel="Terminate"
                            @confirm="() => logout(session.sessionId).then(() => {
                                sessions = sessions.filter(s => s.sessionId !== session.sessionId);
                            })"
                         />

                        
                    </div>
                </ul>
                <Button
                    label="New Session"
                    @click="() => createNewTokenDialog?.openDialog()"
                />
            </div>

            
        </div>
    </main>

</template>

