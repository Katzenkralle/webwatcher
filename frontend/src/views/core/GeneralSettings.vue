<script setup lang="ts">
import UserSettings from '@/components/settings/UserSettings.vue'
import AccountInformations from '@/components/settings/AccountInformations.vue'
import AdminUserManagment from '@/components/settings/AdminUserManagment.vue'

import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'

import SmallSeperator from '@/components/reusables/SmallSeperator.vue'

import { onMounted, ref, markRaw } from 'vue'
import { getUser } from '@/composable/core/User'

interface SettingComponent {
  name: string
  value: string
  component: any
}

const SettingComponents = ref<SettingComponent[]>([
  {
    name: 'Account Information',
    value: '0',
    component: markRaw(AccountInformations),
  },
  {
    name: 'Authentication',
    value: '1',
    component: markRaw(UserSettings),
  },
])

// Fetch user data and update SettingComponents when available
onMounted(() => {
  getUser().then((data) => {
    if (data.isAdmin) {
      SettingComponents.value.push({
        name: 'User Managment',
        value: String(SettingComponents.value.length),
        component: markRaw(AdminUserManagment),
      })
    }
  })
})

const curentAccordion = ref<string[]>(['0'])
</script>

<template>
  <main>
    <div>
      <h1>General Settings</h1>

      <SmallSeperator :is-dashed="true" class="my-4" />
      <Accordion
        class="mb-2"
        :value="curentAccordion"
        multiple
        unstyled
        @update:value="
          (value) => {
            curentAccordion = typeof value === 'string' ? [value] : (curentAccordion = value ?? [])
          }
        "
      >
        <AccordionPanel
          v-for="component in SettingComponents"
          :key="component.value"
          :value="component.value"
        >
          <AccordionHeader>{{ component.name }}</AccordionHeader>
          <AccordionContent>
            <!-- Using th v-if the component is only loaded when opening, 
                    potentialy saving API requests; transition needet to allow animation to finish  -->
            <Transition name="fade" :duration="1000">
              <component
                :is="component.component"
                v-if="curentAccordion.includes(component.value)"
                class="content-box"
              />
            </Transition>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </div>
  </main>
</template>
