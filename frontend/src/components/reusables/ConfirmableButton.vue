<script setup lang="ts">
import Popover from 'primevue/popover'
import Button from 'primevue/button'
import { ref } from 'vue'

const emit = defineEmits(['confirm', 'cancel'])

const props = defineProps<{
  confirmMessage: string
  confirmIcon: string
  confirmClass?: string
  buttonClass?: string
  disabled?: boolean
  buttonIcon: string
  buttonLabel: string
}>()

const confirmDialog = ref() // Ref for the popover
</script>

<template>
  <Popover ref="confirmDialog" :show-close-icon="false">
    <div :class="`flex flex-col space-y-2 max-w-64 ${props.confirmClass}`">
      <span>
        <i v-if="props.confirmIcon" :class="`${props.confirmIcon} mr-1`" />
        {{ props.confirmMessage }}
      </span>
      <div class="w-full flex flex-row justify-end space-x-2">
        <Button
          severity="danger"
          label="Cancel"
          icon="pi pi-times"
          size="small"
          @click="
            () => {
              confirmDialog?.toggle(false)
              emit('cancel')
            }
          "
        />
        <Button
          severity="succsess"
          label="Proceed"
          icon="pi pi-check"
          size="small"
          @click="
            () => {
              confirmDialog?.toggle(false)
              emit('confirm')
            }
          "
        />
      </div>
    </div>
  </Popover>
  <Button
    :icon="props.buttonIcon"
    :class="props.buttonClass"
    :label="props.buttonLabel"
    :disabled="props.disabled !== undefined ? props.disabled : false"
    @click="(e) => confirmDialog?.toggle(e)"
  />
</template>
