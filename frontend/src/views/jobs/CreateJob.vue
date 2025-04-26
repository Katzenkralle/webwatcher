<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import router from '@/router'

import { CronPrime } from '@vue-js-cron/prime'

import { getJobMetaData, updateOrCreateJob, type TableMetaData } from '@/composable/api/JobAPI'
import { useStatusMessage } from '@/composable/core/AppState'
import { getAllScripts, globalScriptData,type ScriptMeta } from '@/composable/api/ScriptAPI'

import InlineMessage from 'primevue/inlinemessage'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import FloatLabel from 'primevue/floatlabel'

import NavButtons from '@/components/reusables/NavButtons.vue'

const isEdit = ref<boolean>(false)
const jobMetaData = ref<
  Omit<TableMetaData, 'parameters'> & { parameters: Record<string, [string, any]> }
>({
  id: -1,
  name: '',
  script: '',
  description: '',
  enabled: true,
  executeTimer: '0 0 * * *',
  executedLast: 0,
  forbidDynamicSchema: false,
  expectedReturnSchema: {},
  parameters: {},
})

const serverJobState = ref<TableMetaData|undefined>()


const nameStatus = computed((): { severity: string; summary: string } => {
  if (jobMetaData.value.name === '') {
    return { severity: 'warn', summary: 'Should be provided.' }
  }
  return { severity: 'success', summary: '' }
})

const allScripts = ref<Record<string, ScriptMeta>>()

const newParameterKvLayout = (scriptName: string, jobParams: Record<string, any>|undefined = undefined): Record<string, [string, any]> => {
  if (!allScripts.value) {
    return {}
  }
  const script = allScripts.value[scriptName]
  const scriptParam = script
    ? Object.keys(script.inputSchema).reduce(
        (acc, key) => {
          acc[key] = [script.inputSchema[key], null]
          return acc
        },
        {} as Record<string, [string, any]>,
      )
    : {}
  if (jobParams) {
    Object.entries(jobParams).forEach(([key, value]) => {
        if (scriptParam[key]) {
          scriptParam[key][1] = value
        } else {
          scriptParam[key] = ['string', value]
        }
      })
  }
  return scriptParam
}


const getAvailableScripts = computed(() => {
  if (!allScripts.value) {
    return []
  }
  jobMetaData.value.parameters = newParameterKvLayout(jobMetaData.value.script, serverJobState.value?.parameters)
  return Object.keys(allScripts.value)
    .filter((entry)  => !isEdit.value  
      || !serverJobState.value?.forbidDynamicSchema 
      || allScripts.value![entry].supportsStaticSchema)
    .map((entry) => {
    return { name: entry, description: allScripts.value![entry].description }
  })
})

const refreshJobMetaData = (id: string | string[] | undefined) => {
  if (!id) {
    isEdit.value = false
    return
  }
  getJobMetaData(Number(id))
    .then(async (data: TableMetaData) => {
      serverJobState.value = JSON.parse(JSON.stringify(data))

       jobMetaData.value = { 
        ...data,
        parameters: await newParameterKvLayout(data.script, serverJobState.value),
      }
      isEdit.value = true
    })
    .catch(() => {
      useStatusMessage().newStatusMessage('Job not found.', 'danger')
      router.push('/jobs')
    })
}

onMounted(async() => {
  allScripts.value = await getAllScripts()
  refreshJobMetaData(router.currentRoute.value.params.id)
})

watch(ref(router.currentRoute.value.params.id), (newJobId) => {
  refreshJobMetaData(newJobId)
})
</script>

<template>
  <main>
    <div>
      <div class="flex flex-wrap items-center justify-between pt-3">
        <NavButtons />
        <h1 class="m-0!">{{ !isEdit ? 'Create Job' : 'Edit Job' }}</h1>
        <div class="input-box !flex-row !w-min items-center">
          <label for="enableToggle" class="!mb-0 mr-2 ml-auto">Enabled</label>
          <InputSwitch id="enableToggle" v-model="jobMetaData.enabled" />
        </div>
      </div>
      <div class="input-box">
        <label for="jobName">Name</label>
        <InputText
          id="jobName"
          v-model:model-value="jobMetaData.name"
          placeholder="Who am I?"
          class="w-full"
          aria-describedby="jobName"
        />
        <small id="jobName">Choose a name for the script</small>
        <InlineMessage target="jobName" :severity="nameStatus.severity">{{
          nameStatus.summary
        }}</InlineMessage>
      </div>

      <div class="input-box">
        <label for="jobDiscription">Add a discription</label>
        <Textarea
          id="jobDiscription"
          v-model="jobMetaData.description"
          placeholder="What do I do?"
          auto-resize
          rows="5"
          cols="30"
        />
      </div>

      <div class="input-box">
        <label for="scriptSelector">Script</label>
        <Select
          id="scriptSelector"
          v-model:model-value="jobMetaData.script"
          :options="getAvailableScripts"
          placeholder="Where do I run?"
          option-label="name"
          option-value="name"
          @change="
            async (newVal) => {
              jobMetaData.forbidDynamicSchema = serverJobState?.forbidDynamicSchema || false
              const knownParams = serverJobState?.script === newVal.value
                ? serverJobState?.parameters
                : {}
              jobMetaData.parameters = await newParameterKvLayout(newVal.value, knownParams)
            }
          "
        />
        <div v-if="globalScriptData[jobMetaData.script]?.description">
          <a class="text-lg">Discription:</a>
          <p class="bg-crust-d rounded-lg p-3 whitespace-pre">
            {{ globalScriptData[jobMetaData.script].description }}
          </p>
        </div>
        <a v-if="serverJobState?.forbidDynamicSchema" class="text-warning">
          Warning: This job is using a static schema. Script selection will be limeted to scripts
          supporting static schemas.
          A Error will be thrown if the selected script does not match the static schema.
        </a>
      </div>

      <div v-if="globalScriptData[jobMetaData.script]?.supportsStaticSchema" class="input-box">
        <label for="forbidDynamicSchema">Forbid Dynamic Schema</label>
        <div class="flex flex-row items-center">
          <InputSwitch 
          id="forbidDynamicSchema" 
          v-model="jobMetaData.forbidDynamicSchema"
          :disabled="serverJobState?.forbidDynamicSchema" />
          <a class="text-md text-info ml-2">Will I be restricted?</a>
        </div>
        <a v-if="jobMetaData.forbidDynamicSchema && !serverJobState?.forbidDynamicSchema " class="text-warning">
          Warning: Enableing this option will restrict all futher entries to the layout of the new script.
        </a>
        <a v-if="jobMetaData.forbidDynamicSchema && !serverJobState?.forbidDynamicSchema" class="text-warning">
          Warning: Static schemas cannot be disabled once set!
        </a>
      </div>

      <div class="input-box">
        <label for="cronSetting">Cron</label>
        <CronPrime
          id="cronSetting"
          v-model:model-value="jobMetaData.executeTimer"
          class="flex flex-wrap items-baseline bg-crust p-1 rounded-md [&>*]:m-1 border border-info hover:border-app transition-colors duration-300 ease-in-out"
        />
        <!-- This is a hidden input to prevent the outer
                 container from shrinking when the value of ther real input changes -->
        <CronPrime :model-value="'* * * * *'" class="h-0 opacity-0" />
      </div>

      <div
        v-if="jobMetaData.parameters && Object.keys(jobMetaData.parameters).length > 0"
        class="input-box"
      >
        <label for="">Parameters for the Script</label>

        <div
          v-for="[name, [type]] in Object.entries(jobMetaData.parameters)"
          :key="name"
          class="mb-2 flex flex-col space-y-1"
        >
          <a :for="name" class="font-bold">{{ name }}</a>
          <FloatLabel :for="`param-${name}`" :label="type" variant="in">
            <InputText
              :id="`param-${name}`"
              v-model:model-value="jobMetaData.parameters[name][1]"
              class="w-full"
              aria-describedby="jobName"
            />
            <label :for="`param-${name}`">{{ type }}</label>
          </FloatLabel>
        </div>
      </div>

      <div class="input-box">
        <Button
          label="Save"
          security="success"
          :disabled="jobMetaData.name === '' || jobMetaData.script === ''"
          @click="
            () => {
              const normalizedJobData = { ...jobMetaData, parameters: {} }
              normalizedJobData.parameters = Object.entries(jobMetaData.parameters).reduce(
                (acc: Record<string, any>, [key, [_, value]]) => {
                  acc[key] = value
                  return acc
                },
                {},
              )
              updateOrCreateJob(normalizedJobData)
                .then(() => {
                  useStatusMessage().newStatusMessage('Job saved.', 'success')
                  router.push('/jobs')
                })
                .catch((error) => {
                  useStatusMessage().newStatusMessage('Job could not be saved.', 'danger')
                })
            }
          "
        />
      </div>
    </div>
  </main>
</template>
