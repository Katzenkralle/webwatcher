import { createRouter, createWebHistory } from 'vue-router'
import { loadingBarIsLoading } from '@/composable/core/AppState'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/core/HomeView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/jobs',
      name: 'tables',
      component: () => import('../views/jobs/JobOverview.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/jobs/table/:id(\\d+)',
      name: 'table',
      component: () => import('@/views/jobs/JobView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/jobs/create/:id(\\w+)?',
      name: 'createJob',
      component: () => import('@/views/jobs/CreateJob.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/core/GeneralSettings.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/scripts',
      name: 'scripts',
      component: () => import('@/views/scripts/ScriptOverview.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/script/upload/:name([^/]+)?',
      name: 'scriptUpload',
      component: () => import('@/views/scripts/CreateScript.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/core/LoginView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/core/NotFound.vue'),
    },
  ],

  scrollBehavior(to, from, savedPosition) {
    // always scroll to top
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ left: 0, top: 0, behavior: 'smooth' })
      }, 100)
    })
  },

})

const visitedRoutes = new Set()

router.beforeEach(async (to) => {
  if (!visitedRoutes.has(to.name)) {
    // Show loading bar if route is not in cache
    loadingBarIsLoading.value.onetime.loading = true
    visitedRoutes.add(to.name)
  }
  // Redirect to login if route requires auth and user is not logged i
  if ((to.meta.requiresAuth || false) && !document.cookie.includes('oauth2=')) {
    return { name: 'login', query: { redirect: to.fullPath } }
  } else if (to.name === 'login' && document.cookie.includes('oauth2=')) {
    // Redirect to home if user is logged in and tries to access login page
    return { name: 'home' }
  }
  return true
})

router.afterEach(async () => {
  loadingBarIsLoading.value.onetime.loading = false
})

export default router
