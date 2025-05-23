import { ref, computed, type Ref } from 'vue'
import router from '@/router'

export interface StatusMessage {
  msg: string
  severity: 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast'
  time: string
  icon: string
}

export interface Loading {
  continuous: {
    loading: boolean
    duration?: number
  }
  onetime: {
    loading: boolean
    duration?: number
  }
}

export const loadingBarIsLoading: Ref<Loading> = ref(
  {
    continuous: { loading: false },
    onetime: { loading: false },
  } as Loading,
)


const statusMsg: Ref<Record<number, StatusMessage>> = ref({})
const msgCounter: Ref<number> = ref(-1)

export const useStatusMessage = (batchFire = false) => {
  let previousStatusMessage: { index: number; msg: StatusMessage } | null = null
  const onHold: StatusMessage[] = []

  const newStatusMessage = (
    msg: string,
    severity:
      | 'secondary'
      | 'success'
      | 'info'
      | 'warn'
      | 'help'
      | 'danger'
      | 'contrast'
      | 'SECONDARY'
      | 'SUCCESS'
      | 'INFO'
      | 'WARN'
      | 'HELP'
      | 'DANGER'
      | 'CONTRAST',
  ) => {
    severity = severity.toLowerCase() as
      | 'secondary'
      | 'success'
      | 'info'
      | 'warn'
      | 'help'
      | 'danger'
      | 'contrast'
    let icon = ''
    switch (severity.toLowerCase()) {
      case 'secondary':
        icon = 'pi-equals'
        break
      case 'success':
        icon = 'pi-check'
        break
      case 'info':
        icon = 'pi-info'
        break
      case 'warn':
        icon = 'pi-exclamation-triangle'
        break
      case 'help':
        icon = 'pi-question'
        break
      case 'danger':
        icon = 'pi-exclamation-triangle'
        break
      case 'contrast':
        icon = 'pi-expand'
        break
    }
    if (batchFire) {
      onHold.push({
        msg: msg,
        severity: severity,
        time: new Date().toLocaleTimeString(),
        icon: icon,
      })
      return
    }
    msgCounter.value += 1
    statusMsg.value[msgCounter.value] = {
      msg: msg,
      severity: severity,
      time: new Date().toLocaleTimeString(),
      icon: icon,
    }
  }

  const fireBatch = () => {
    setInterval(() => {
      if (onHold.length === 0) {
        return
      }
      msgCounter.value += 1
      statusMsg.value[msgCounter.value] = onHold[0]
      onHold.shift()
    }, 100)
  }

  const removeStatusMessage = (index: number[], all: boolean = false) => {
    if (all) {
      statusMsg.value = []
      return
    }
    index.forEach((i) => {
      // For some reason, the index is a string, so we need to convert it to an integer
      // this happens at some point but I have absolutely no idea where...
      i = typeof i === 'string' ? parseInt(i) : i
      statusMsg.value = Object.fromEntries(
        Object.entries(statusMsg.value).filter(([k]) => parseInt(k) !== i),
      )
    })
    return
  }

  const getRecentStatusMessage = computed(() => {
    const keys = Object.keys(statusMsg.value).map((k) => k)
    if (keys.length === 0) {
      return null
    }
    const last = parseInt(keys[keys.length - 1])
    if (previousStatusMessage && previousStatusMessage.index >= last) {
      return previousStatusMessage
    }
    previousStatusMessage = { index: last, msg: statusMsg.value[last] }
    return { index: last, msg: statusMsg.value[last] }
  })

  const statusMsgList = computed(() => {
    return statusMsg.value
  })

  return {
    newStatusMessage,
    removeStatusMessage,
    fireBatch,
    getRecentStatusMessage,
    statusMsgList,
  }
}

export const useQueryRouting = () => {
  const routeToQuery = (fallback = '/') => {
    const search = new URLSearchParams(window.location.search)
    const query = (search.has('redirect') ? search.get('redirect') : fallback) as string
    router.push(query)
  }
  return {
    routeToQuery,
  }
}
