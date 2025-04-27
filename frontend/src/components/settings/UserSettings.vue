<script setup lang="ts">
import Password from 'primevue/password'
import { ref, onMounted, computed } from 'vue'

import QRCodeVue3 from 'qrcode-vue3'

import FloatLabel from 'primevue/floatlabel'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

import { getCssColors } from '@/composable/core/helpers'
import { useStatusMessage } from '@/composable/core/AppState'
import {
  getAllSessions,
  changePassword,
  logout,
  type SessionData,
  getSessionFromJWT,
  requestToken,
} from '@/composable/api/Auth'

import ConfirmableButton from '@/components/reusables/ConfirmableButton.vue'
import PupupDialog from '@/components/reusables/PopupDialog.vue'
import SmallSeperator from '@/components/reusables/SmallSeperator.vue'

const passwdChange = ref({
  old_passwd: '',
  new_passwd: '',
  new_passwd_confirm: '',
})

const sessions = ref<SessionData[]>([])
const fetchSessions = () => {
  getAllSessions()
    .then((response: SessionData[]) => {
      sessions.value = response
    })
    .catch((error: Error) => {
      console.error(error)
    })
}
onMounted(() => {
  fetchSessions()
})

const thisToken = computed(() => {
  return getSessionFromJWT()
})

const createNewTokenDialog = ref()
const infoDialog = ref()
const infoDilogData = ref({
  title: '',
  mesage_prelude: '',
  mesage: '',
  copyClicked: false,
  link: '',
})

const resetInfoDialog = () => {
  infoDilogData.value.title = ''
  infoDilogData.value.mesage_prelude = ''
  infoDilogData.value.mesage = ''
  infoDilogData.value.copyClicked = false
  infoDilogData.value.link = ''
}

const putInClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
  infoDilogData.value.copyClicked = true
  setTimeout(() => (infoDilogData.value.copyClicked = false), 1500)
}

const newTokenPasswd = {
  name: '',
  password: '',
}

const getLoginUrl = (token: string, type: string) => {
  return `${window.location.origin}/login?token=${token}&type=${type}`
}
</script>

<template>
  <div>
    <PupupDialog
      ref="infoDialog"
      passthrou-classes="max-w-300!"
      :title="infoDilogData.title"
      @cancel="
        () => {
          infoDialog?.closeDialog()
          resetInfoDialog()
        }
      "
    >
      <template #default>
        <div class="flex flex-col lg:grid lg:grid-cols-4 lg:gap-4">
          <div class="flex flex-col lg:col-span-3">
            <div class="flex flex-row justify-between items-center mb-2 h-11">
              <p class="font-bold text-info">{{ infoDilogData.mesage_prelude }}</p>
              <Button
                :icon="infoDilogData.copyClicked ? 'pi pi-check' : 'pi pi-clipboard'"
                :class="{ 'p-button-success': infoDilogData.copyClicked }"
                @click="
                  () => {
                    putInClipboard(infoDilogData.mesage)
                  }
                "
              />
            </div>
            <p class="[word-wrap:anywhere;] subsection my-auto">{{ infoDilogData.mesage }}</p>
          </div>
          <div class="flex flex-col">
            <div class="flex flex-row items-center h-11">
              <p class="font-bold text-info w-full lg:justify-self-center my-auto">
                Scan to login:
              </p>
            </div>
            <QRCodeVue3
              v-if="infoDilogData.link !== ''"
              imgclass="mx-auto"
              myclass=""
              :value="infoDilogData.link"
              :qr-options="{
                errorCorrectionLevel: 'L',
                mode: 'Byte',
                typeNumber: 0,
              }"
              :background-options="{
                color: '#00000000',
              }"
              :image-options="{
                margin: 0,
              }"
              :dots-options="{
                color: getCssColors().text,
              }"
              :corners-square-options="{
                color: getCssColors().info,
              }"
              :corners-dot-options="{
                color: getCssColors().app,
              }"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <Button
          label="Close"
          @click="
            () => {
              infoDialog?.closeDialog()
              resetInfoDialog()
            }
          "
        />
      </template>
    </PupupDialog>

    <PupupDialog
      ref="createNewTokenDialog"
      title="New Token:"
      @submit="
        (confirmed) => {
          if (confirmed) {
            requestToken(thisToken.user, newTokenPasswd.password, newTokenPasswd.name)
              .then((data) => {
                useStatusMessage().newStatusMessage('Successfully created new Token', 'success')
                infoDilogData.title = 'New Token: Success'
                infoDilogData.mesage_prelude = 'Your new token is:'
                infoDilogData.mesage = JSON.stringify({
                  Authorization: `${data.token_type} ${data.access_token}`,
                })
                infoDilogData.link = getLoginUrl(data.access_token, data.token_type)
                infoDialog?.openDialog()
                fetchSessions()
              })
              .catch((e) => {
                useStatusMessage().newStatusMessage(e.message, 'danger')
              })
          }
          newTokenPasswd.name = ''
          newTokenPasswd.password = ''
        }
      "
    >
      <template #default>
        <div class="flex flex-row justify-center space-x-4">
          <FloatLabel variant="in">
            <InputText v-model:model-value="newTokenPasswd.name" />
            <label>Session Name</label>
          </FloatLabel>
          <FloatLabel variant="in">
            <Password v-model:model-value="newTokenPasswd.password" :feedback="false" />
            <label>Re-enter Password</label>
          </FloatLabel>
        </div>
      </template>
    </PupupDialog>

    <div class="flex flex-col items-center mx-auto">
      <div class="input-box passwd_change">
        <label for="passwd_change">Change password:</label>
        <FloatLabel label="Old Password" variant="in">
          <Password
            v-model:model-value="passwdChange.old_passwd"
            size="small"
            :feedback="false"
            required
          />
          <label for="old_passwd">Old Password</label>
        </FloatLabel>
        <FloatLabel label="New Password" variant="in">
          <Password v-model:model-value="passwdChange.new_passwd" size="small" required />
          <label for="new_passwd">New Password</label>
        </FloatLabel>
        <FloatLabel label="Confirm New Password" variant="in">
          <Password
            v-model:model-value="passwdChange.new_passwd_confirm"
            size="small"
            :feedback="false"
            required
          />
          <label for="new_passwd_confirm">Confirm New Password</label>
        </FloatLabel>
        <Button
          label="Submit"
          type="submit"
          @click="
            () => {
              if (passwdChange.new_passwd !== passwdChange.new_passwd_confirm) {
                useStatusMessage().newStatusMessage('Passwords do not match.', 'danger')
                return
              }
              changePassword(passwdChange.old_passwd, passwdChange.new_passwd).then(() => {
                passwdChange.old_passwd = ''
                passwdChange.new_passwd = ''
                passwdChange.new_passwd_confirm = ''
              })
            }
          "
        />
      </div>

      <div class="input-box w-full">
        <label>Session Manager:</label>
        <div v-for="session in sessions" :key="session.name" :class="`row-based-table`">
          <div>
            <span v-if="thisToken.name == session.name" class="text-sm text-warning"
              >This Session</span
            >
            <span class="font-bold text-info">Name: </span>
            <span class="text-sm text-info">Created at:</span>
          </div>

          <div>
            <span v-if="thisToken.name == session.name" class="opacity-0 text-sm"> .</span>
            <span class="text-text-d max-w-48 truncate"> {{ session.name }}</span>
            <span class="text-sm text-text-d"> {{ session.created }}</span>
          </div>

          <ConfirmableButton
            confirm-message="Are you sure you want to terminate this session?"
            confirm-icon="pi pi-exclamation-triangle"
            button-icon="pi pi-times"
            button-class="p-button-danger flex-wrap"
            button-label="Terminate"
            @confirm="
              () =>
                logout(session.name).then(() => {
                  sessions = sessions.filter((s) => s.name !== session.name)
                })
            "
          />
        </div>
        <SmallSeperator class="my-2 mx-auto" />
        <Button label="New Session" @click="() => createNewTokenDialog?.openDialog()" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/global.css";
</style>
