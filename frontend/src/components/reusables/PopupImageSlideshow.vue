<script setup lang="ts">
import PopupDialog from '@/components/reusables/PopupDialog.vue'
import Galleria from 'primevue/galleria'
import Button from 'primevue/button'
import { ref } from 'vue'

const props = defineProps<{
  images: string[]
  title: string
  class?: string
}>()
const helpPopup = ref()
</script>

<template>
  <PopupDialog ref="helpPopup" :title="props.title" :hide-seperator="true">
    <template #default>
      <Galleria
        container-style="background-color: var(--color-base);"
        :value="props.images"
        :num-visible="5"
        :show-item-navigators="true"
        :show-thumbnails="false"
        :show-indicators="true"
        :change-item-on-indicator-hover="true"
      >
        <template #item="slotProps">
          <img :src="slotProps.item" style="width: 100%; display: block" />
        </template>
      </Galleria>
    </template>
    <template #footer>
      <div></div>
    </template>
  </PopupDialog>
  <Button
    icon="pi pi-question"
    severity="info"
    size="small"
    variant="outlined"
    :class="props.class ?? ''"
    @click="
      () => {
        helpPopup?.openDialog()
      }
    "
  />
</template>
