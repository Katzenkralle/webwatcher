<script setup lang="ts">
import PopupDialog from '../reusables/PopupDialog.vue'
import Button from 'primevue/button'

import { ref } from 'vue'

import markdownit from 'markdown-it'
//register all langs: import hljs from 'highlight.js';
import hljs from 'highlight.js/lib/core' // for syntax highliting
import python from 'highlight.js/lib/languages/python'
import '@catppuccin/highlightjs/css/catppuccin-frappe.css' // for syntax highliting
import WatcherInterfacePy from '@/assets/static/watcher_interface.py?raw'
import HttpReturnPy from '@/assets/static/http_return_example.py?raw'

const props = defineProps<{
  class: string
}>()

const dialog = ref()

// Actual default values
hljs.registerLanguage('python', python)
const md = markdownit({
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch {
        // do nothing
      }
    }
    return ''
  },
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
})

const RENDERD_DOC = `\n
### Interface
Your script must implement the following interface to be used as a Watcher.
\`\`\`py
${WatcherInterfacePy}
\`\`\`
> The base Interface must be imported by your script with:
> \`\`\`py
> from webw_serv import Watcher
> \`\`\`

### Return of run()
When called your Script must return a dictionary of the following format:
\`\`\`py
return {
    "<key>": <value>,  # where value is of type str, int, float, or bool
    ...
  }
\`\`\`
> **Note:** The dictionary **must never** include the keys \`call_id\`, \`id\`, \`timestamp\`, \`runtime\`, \`result\`, or \`script_failure\`.

### Dependencies
To install additional dependencies for your scripts, bind a \`.sh\` file on the host to \`/pre_start.sh\` inside the container and place the appropriate installation commands in it.  
This script runs every time the server starts, ensuring your dependencies remain intact after updates.
> Reference: [Docker Documentation](https://docs.docker.com/engine/storage/bind-mounts/) to learn more about bind mounts.


### Example
The following script fetches the HTTP-Status of a given URL.
\`\`\`py
${HttpReturnPy}
\`\`\`
`
</script>
<template>
  <PopupDialog
    ref="dialog"
    :hide-seperator="true"
    :close-only="true"
    :passthrou-classes="'w-full'"
    title="Watcher Interface"
  >
    <template #default>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="prose prose-lg dark:prose-invert w-fit" v-html="md.render(RENDERD_DOC)" />
    </template>
  </PopupDialog>
  <Button
    label="Create your own Script"
    icon="pi pi-book"
    :class="props.class"
    @click="() => (dialog ? dialog.openDialog() : null)"
  />
</template>
