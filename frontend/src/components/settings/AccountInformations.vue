<script setup lang="tsx">
import { onMounted, ref } from 'vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ConfirmableButton from '../reusables/ConfirmableButton.vue'
import { getUser } from '@/composable/core/User'
import { logout } from '@/composable/api/Auth'
import { removeTemporaryScripts } from '@/composable/scripts/ScriptAPI'

const user = ref()

onMounted(() => {
  getUser().then((data) => {
    user.value = data
  })
})
</script>

<template>
  <div v-if="user" class="flex flex-col">
    <div class="input-box">
      <label for="username">Username</label>
      <InputText id="username" v-model="user.username" :disabled="true" />
    </div>
    <div class="input-box">
      <label for="premission">Premission Level</label>
      <p v-if="user.isAdmin" class="text-warning"><span class="pi pi-user" /> Admin</p>
      <p v-else class="text-app"><span class="pi pi-user" />User</p>
    </div>
    <div class="input-box">
      <label>Actions</label>
      <div class="flex flex-wrap space-x-2 [&>*]:mb-2">
        <Button
          label="Logout"
          icon="pi pi-sign-out"
          severity="danger"
          class="w-min"
          @click="() => logout()"
        />
        <ConfirmableButton
          v-if="user.isAdmin"
          button-label="Remove Temporary Files"
          button-icon="pi pi-trash"
          button-class="p-button-warn"
          confirm-message="This will clean up unused temporary files and clean the db registries of any zombie data.
                            E.g. scripts that where uploaded but never implemented as watchers."
          confirm-icon="pi pi-exclamation-triangle"
          @confirm="() => removeTemporaryScripts()"
        />
      </div>
    </div>
  </div>
</template>
