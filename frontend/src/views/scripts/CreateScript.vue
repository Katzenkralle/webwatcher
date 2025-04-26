<script setup lang="ts">
import InputText from 'primevue/inputtext'
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload'
import InlineMessage from 'primevue/inlinemessage'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'

import { ref, watch, reactive, computed, onMounted } from 'vue'
import { getAllScripts } from '@/composable/api/ScriptAPI'
import router from '@/router'

import { useLoadingAnimation, useStatusMessage } from '@/composable/core/AppState'
import {
  validateFile,
  submitScript,
  type ScriptValidationResult,
  type ScriptMeta,
} from '@/composable/api/ScriptAPI'
import NavButtons from '@/components/reusables/NavButtons.vue'

// Input field value
const nameStatus = reactive<{
  field: string
  severity: string
  summary: string
  blacklist: string[]
}>({ field: '', severity: 'warn', summary: '', blacklist: [] })
const discription = ref('')
const fileStatus = ref<ScriptValidationResult & { severity: string; validationMsg: string }>({
  severity: 'warn',
  validationMsg: 'A file must be provided.',
  availableParameters: {},
  valid: false,
  supportsStaticSchema: false,
})

// unknown if creating a new script
const knownScripts = ref<Record<string, ScriptMeta> | undefined>(undefined)

onMounted(() => {
  getAllScripts()
    .then((response) => {
      knownScripts.value = response
      nameStatus.blacklist = Object.keys(response)
    })
    .catch(() => {
      useStatusMessage().newStatusMessage('Could not load scripts.', 'danger')
    })
})

const currentScriptName = ref(String(router.currentRoute.value.params.name) || '')
const computedScript = computed((): undefined | ScriptMeta => {
  if (!knownScripts.value || currentScriptName.value === '') {
    return undefined
  }
  const thisScript = knownScripts.value[currentScriptName.value]
  if (!knownScripts.value || currentScriptName.value === '') {
    return undefined
  }
  if (!thisScript && currentScriptName.value !== '') {
    useStatusMessage().newStatusMessage('Script not found.', 'danger')
    router.push('/scripts')
    return undefined
  }
  fileStatus.value = {
    severity: 'success',
    validationMsg: 'File present on the Server.',
    availableParameters: thisScript.inputSchema,
    valid: false,
    supportsStaticSchema: thisScript.supportsStaticSchema,
  }
  nameStatus.field = currentScriptName.value
  nameStatus.severity = 'success'
  nameStatus.summary = ''
  discription.value = thisScript.description
  return thisScript
})

const onFileSelect = (file_event: FileUploadSelectEvent) => {
  useLoadingAnimation().setState(true)
  fileStatus.value.severity = 'warn'
  fileStatus.value.validationMsg = 'Validating File...'
  fileStatus.value.availableParameters = {}
  validateFile(file_event.files[0], currentScriptName.value).then(
    (response: ScriptValidationResult) => {
      if (response.valid) {
        fileStatus.value = { severity: 'success', ...response }
      } else {
        fileStatus.value = { severity: 'error', ...response }
      }
      useLoadingAnimation().setState(false)
    },
  )
}

const onSubmit = () => {
  submitScript(nameStatus.field, discription.value, fileStatus.value.id)
    .then(() => {
      useStatusMessage().newStatusMessage('Script submitted.', 'success')
      router.push('/scripts')
    })
    .catch(() => {
      useStatusMessage().newStatusMessage('Script could not be submitted.', 'danger')
    })
}

watch(nameStatus, (newVal) => {
  if (nameStatus.blacklist.includes(newVal.field) && currentScriptName.value !== newVal.field) {
    nameStatus.severity = 'error'
    nameStatus.summary = 'Name not allowed or already in use.'
  } else if (newVal.field.length > 0) {
    nameStatus.severity = 'success'
    nameStatus.summary = ''
  } else {
    nameStatus.severity = 'warn'
    nameStatus.summary = 'Must be provided.'
  }
})

const noErrors = computed(() => {
  return (
    (nameStatus.severity === 'success' || nameStatus.severity === 'warn') &&
    fileStatus.value.severity === 'success'
  )
})

const computedScriptParamTable = computed(() => {
  return Object.entries(fileStatus.value.availableParameters).map(([name, type]) => ({
    0: name,
    1: type,
  }))
})
</script>

<template>
  <main>
    <div>
      <div class="flex flex-row items-center justify-between">
        <NavButtons />
        <h1>{{ currentScriptName ? 'Edit Script' : 'Upload Script' }}</h1>
        <a></a>
      </div>

      <div class="input-box">
        <label for="scriptName">Script Name</label>
        <InputText
          id="scriptName"
          v-model="nameStatus.field"
          :disabled="currentScriptName !== ''"
          aria-describedby="scriptNameHelp"
          :default-value="currentScriptName"
        />
        <small id="scriptNameHelp">Choose a name for the script</small>
        <InlineMessage target="scriptName" :severity="nameStatus.severity">{{
          nameStatus.summary
        }}</InlineMessage>
      </div>
      <div class="input-box">
        <label for="scriptDiscription">Add a discription</label>
        <Textarea
          id="scriptDiscription"
          v-model="discription"
          :default-value="computedScript?.description || ''"
          auto-resize
          rows="5"
          cols="30"
        />
      </div>

      <div class="input-box">
        <label for="fileSelect">Select a file to upload</label>
        <div class="bg-panel-h rounded-lg">
          <FileUpload
            id="fileSelect"
            mode="basic"
            class="mr-auto"
            name="demo[]"
            custom-upload
            choose-label="Select File"
            @select="onFileSelect"
          />
        </div>
        <InlineMessage target="fileSelect" class="ml-auto w-fit" :severity="fileStatus.severity">
          {{ fileStatus.validationMsg }}
        </InlineMessage>
        <small>From this file the data is collected.</small>
        <div
          :class="{
            // We cannot use hidden here, for we need to animate the element
            'opacity-0 w-0 h-0': fileStatus.severity !== 'success',
            'visible opacity-100 w-auto h-auto': fileStatus.severity === 'success',
            'transition-all duration-1000 ease-in-out overflow-hidden': true,
          }"
        >
          <DataTable :value="computedScriptParamTable" class="mt-4">
            <template #header>
              <h4>Script Parameters</h4>
            </template>
            <Column field="0" header="Parameter"></Column>
            <Column field="1" header="Type"></Column>
            <template #footer>
              <p class="italic">The available parameters</p>
            </template>
          </DataTable>
          <a v-if="fileStatus.supportsStaticSchema" class="text-success"
            >Can be used with static schema</a
          >
          <a v-else class="text-warning">Cannot be used with static schema</a>
        </div>
      </div>
      <div class="input-box">
        <Button label="Submit" :disabled="!noErrors" @click="() => onSubmit()" />
      </div>
    </div>
  </main>
</template>
