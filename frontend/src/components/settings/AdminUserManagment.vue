<script setup lang="tsx">
import { allUsers, deleteUser, getUser, createUser, type User } from '@/composable/core/User'
import { onMounted, ref } from 'vue'

import Button from 'primevue/button'
import ConfirmableButton from '../reusables/ConfirmableButton.vue'
import InputText from 'primevue/inputtext'
import Passowrd from 'primevue/password'
import Checkbox from 'primevue/checkbox'
import FloatLabel from 'primevue/floatlabel'

const userList = ref<User[]>([])
const thisUser = ref<User>()

const newUser = ref<User & { password: string; currentPassword: string }>({
  username: '',
  password: '',
  currentPassword: '',
  isAdmin: false,
})

onMounted(async () => {
  userList.value = await allUsers()
  thisUser.value = await getUser()
})
</script>

<template>
  <div class="flex flex-col">
    <div class="input-box">
      <label>Create User</label>
      <FloatLabel variant="in">
        <Passowrd id="username" v-model="newUser.currentPassword" :feedback="false" />
        <label for="username">Your Password</label>
      </FloatLabel>
      <FloatLabel variant="in">
        <InputText id="username" v-model="newUser.username" />
        <label for="username">Username</label>
      </FloatLabel>
      <FloatLabel variant="in">
        <Passowrd id="password" v-model="newUser.password" />
        <label for="password">Password</label>
      </FloatLabel>
      <div class="flex flex-row text-info hover:text-app">
        <Checkbox id="isAdmin" v-model="newUser.isAdmin" :binary="true" />
        <label for="isAdmin" class="ml-2">Admin</label>
      </div>
      <Button
        label="Create"
        icon="pi pi-user-plus"
        class="mt-2"
        :disabled="newUser.username === '' || newUser.password === ''"
        @click="
          createUser(newUser).then((createdUser) => {
            userList.push(createdUser)
            newUser.username = ''
            newUser.password = ''
            newUser.isAdmin = false
          })
        "
      />
    </div>

    <div class="input-box">
      <label>All Users</label>
      <div v-for="user in userList" :key="user.username" class="row-based-table">
        <div class="text-info w-1/3">
          <p v-if="thisUser && user.username === thisUser.username" class="text-warning text-sm">
            This Account
          </p>
          <p class="font-bold">Username:</p>
          <p class="font-sm">Premission:</p>
        </div>
        <div class="w-1/2">
          <p v-if="thisUser && user.username === thisUser.username" class="opacity-0 text-sm">.</p>
          <p>{{ user.username }}</p>
          <p class="font-sm">{{ user.isAdmin ? 'Admin' : 'User' }}</p>
        </div>

        <ConfirmableButton
          button-icon="pi pi-user-minus"
          button-label="Delete"
          confirm-icon="pi pi-user-minus"
          :disabled="thisUser && user.username === thisUser.username"
          button-class="p-button-danger"
          :confirm-message="'Are you sure you want to delete ' + user.username + '?'"
          @confirm="
            () => {
              deleteUser(user.username).then(() => {
                userList = userList.filter((u) => u.username !== user.username)
              })
            }
          "
        />
      </div>
    </div>
  </div>
</template>
