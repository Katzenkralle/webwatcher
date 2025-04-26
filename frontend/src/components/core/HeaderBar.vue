<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  h,
  type PropType,
  type VNode,
  defineComponent,
  Transition,
  onUnmounted,
} from 'vue'
import { useLoadingAnimation } from '@/composable/core/AppState'
import { getAllJobMetaData, globalTableMetaData, type JobMeta } from '@/composable/jobs/JobMetaAPI'
import router from '@/router'
import NotificationCenter from './NotificationCenter.vue'

import LoadingBar from '@/components/reusables/LoadingBar.vue'
import Badge from 'primevue/badge'
import SmallSeperator from '../reusables/SmallSeperator.vue'
import { RouterLink } from 'vue-router'

interface BarItem {
  label?: string
  icon?: string
  route?: string
  items?: BarItem[]
  placeItems?: 'below' | 'side'
  badge?: number
  image?: string
  style?: 'highlighted'
  fixed?: 'start' | 'end' | ''
  passThroughClass?: string
  comand?: () => void
  // vue dose not like to dirtectly pass vnodes around,
  // we neet to get the node when we need it
  passThroughComponent?: () => VNode
}

// Check if screen width is smaller than --breakpoint-sm
const isMobile = ref(false)
const breakpointSm = parseInt(
  getComputedStyle(document.documentElement).getPropertyValue('--breakpoint-sm').replace('px', ''),
)

const updateMobileState = () => {
  isMobile.value = window.innerWidth < breakpointSm
}

onMounted(() => {
  updateMobileState()

  window.addEventListener('resize', updateMobileState)
})

onUnmounted(() => {
  // Clean up resize listener
  window.removeEventListener('resize', updateMobileState)
})

const tableMetaData = ref<JobMeta[]>([])

const extendedOptions = computed((): BarItem[] => {
  const isSlimMode = router.currentRoute.value.path === '/login'

  return isSlimMode
    ? []
    : [
        {
          label: 'Jobs',
          icon: '',
          route: '/jobs',
          badge: tableMetaData.value.length,
          placeItems: 'below',
          items: [
            { label: 'Overview', route: '/jobs', style: 'highlighted' as const }, // wtf is this syntax?
            ...tableMetaData.value.map((element) => {
              return {
                label: element.name,
                route: '/jobs/table/' + element.id,
              }
            }),
          ],
        },
        {
          label: 'Scripts',
          route: '/scripts',
        },
        {
          label: 'Settings',
          route: '/settings',
        },
      ]
})

const computeOptions = computed((): BarItem[] => {
  return [
    {
      image: new URL('@/assets/img/placeholder.png', import.meta.url).href,
      route: '/',
      fixed: 'start',
    },
    ...extendedOptions.value,
    {
      fixed: 'end',
      passThroughComponent: () =>
        h(NotificationCenter, {
          class: 'mr-2 h-full aspect-square',
          yExpand: 'bottom',
          xExpand: 'left',
        }),
    },
  ]
})

watch(globalTableMetaData, () => {
  // this aproach is needed, for async cannot be directly comuputed
  getAllJobMetaData().then((metadata) => {
    tableMetaData.value = metadata
  })
})

onMounted(() => {
  getAllJobMetaData().then((metadata) => {
    tableMetaData.value = metadata
  })
})

// Shared itemRenderer component
const ItemRenderer = defineComponent({
  name: 'ItemRenderer',
  props: {
    item: {
      type: Object as PropType<BarItem>,
      required: true,
    },
    slave: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const itemsHover = ref(false)
    const hasItems = computed(() => props.item.items && props.item.items.length > 0)

    const isCurrentRoute = computed(() => {
      if (!props.item.route) return false
      if (props.item.route === '/')
        return (
          router.currentRoute.value.path === props.item.route ||
          router.currentRoute.value.path === '/login'
        )

      return props.slave
        ? router.currentRoute.value.path == props.item.route
        : router.currentRoute.value.path.startsWith(props.item.route)
    })

    const getPopulation = () => {
      return [
        props.item.image && h('img', { src: props.item.image, class: 'h-11 min-w-max p-1' }),
        props.item.icon && h('span', { class: props.item.icon }),
        props.item.label && h('span', {}, props.item.label),
        props.item.badge && h(Badge, { size: 'small', value: props.item.badge, class: 'ml-2' }),
        hasItems.value && h('span', { class: 'pi pi-fw pi-angle-down !hidden sm:!inline' }),
      ]
    }
    const populationContainerClass = 'h-full flex flex-row items-center justify-center space-x-1'
    return (): any =>
      h(
        'div',
        {
          class: 'h-full relative',
          onMouseenter: () => {
            itemsHover.value = true
          },
          onMouseleave: () => {
            itemsHover.value = false
          },
        },
        [
          h(
            'div',
            {
              class: `${hasItems.value ? 'min-w-25' : ''} min-h-10 h-full py-1 px-2 rounded-lg gap-2 text-lg \
                ${isCurrentRoute.value ? 'bg-info/20' : ''} hover:bg-panel-h \
                ${props.item.style === 'highlighted' ? 'font-bold' : ''}`,
            },
            [
              props.item.route
                ? h(
                    RouterLink,
                    {
                      to: props.item.route || '#',
                      class: populationContainerClass + ` ${props.item.passThroughClass || ''}`,
                    },
                    {
                      default: () => getPopulation(),
                    },
                  )
                : h(
                    'span',
                    {
                      class: populationContainerClass + ` ${props.item.passThroughClass || ''}`,
                      onClick: () => props.item.comand?.(),
                    },
                    {
                      default: () => getPopulation(),
                    },
                  ),
            ],
          ),
          hasItems.value &&
            h(
              Transition,
              {
                name: 'dropdown',
                enterActiveClass: 'transition ease-out duration-200',
                enterFromClass: 'transform opacity-0 scale-y-0 origin-top',
                enterToClass: 'transform opacity-100 scale-y-100 origin-top',
                leaveActiveClass: 'transition ease-in duration-150',
                leaveFromClass: 'transform opacity-100 scale-y-100 origin-top',
                leaveToClass: 'transform opacity-0 scale-y-0 origin-top',
              },
              {
                default: () =>
                  itemsHover.value
                    ? h(ItemContainerVertical, {
                        items: props.item.items as BarItem[],
                        slave: !props.slave,
                        place: props.item.placeItems,
                        class:
                          props.item.placeItems === 'side' ? 'top-0 right-0 translate-x-full' : '',
                      })
                    : null,
              },
            ),
        ],
      )
  },
})
// Horizontal container
const ItemContainerHorizontal = defineComponent({
  name: 'ItemContainerHorizontal',
  props: {
    items: {
      type: Array as PropType<BarItem[]>,
      required: true,
    },
    slave: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const getItemLayout = (item: BarItem) => {
      if (item.passThroughComponent) {
        return item.passThroughComponent()
      }
      return h(ItemRenderer, { item, slave: props.slave })
    }

    return () =>
      h('div', { class: 'flex flex-row h-13 p-1 gap-2' }, [
        props.items.filter((item) => item.fixed === 'start').map((item) => getItemLayout(item)),
        h(
          'div',
          {
            class:
              'flex flex-row overflow-x-auto overflow-y-hidden sm:overflow-y-visible sm:overflow-x-visible gap-2',
          },
          [props.items.filter((item) => !item.fixed).map((item) => getItemLayout(item))],
        ),
        h('span', { class: 'flex-grow' }),
        props.items.filter((item) => item.fixed === 'end').map((item) => getItemLayout(item)),
      ])
  },
})

// Vertical container (header bar)
const ItemContainerVertical = defineComponent({
  name: 'ItemContainerVertical',
  props: {
    items: {
      type: Array as PropType<BarItem[]>,
      required: true,
    },
    slave: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const getItemLayout = (item: BarItem) => {
      return item.style === 'highlighted'
        ? h('div', { class: 'flex flex-col items-center' }, [
            h(ItemRenderer, { item, slave: props.slave }),
            h(SmallSeperator, { class: 'mx-auto  mt-1' }),
          ])
        : h(ItemRenderer, { item, slave: props.slave })
    }
    return () =>
      h(
        'div',
        {
          class:
            'flex flex-col absolute bg-panel p-0 w-max max-w-60 rounded-lg \
            border-2 border-info space-y-1 z-10',
        },
        [
          props.items.filter((item) => item.fixed != 'end').map((item) => getItemLayout(item)),
          h('span', { class: 'flex-grow' }),
          props.items.filter((item) => item.fixed == 'end').map((item) => getItemLayout(item)),
        ],
      )
  },
})
</script>

<template>
  <header class="w-full flex flex-col z-10 sticky" :style="{ top: `calc(var(--spacing) * -13)` }">
    <ItemContainerHorizontal class="bg-panel w-full" :items="computeOptions" />
    <LoadingBar :is-loading="useLoadingAnimation().isLoading" />
  </header>
</template>
