import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/core/HomeView.vue'
import TableOverview from '../views/jobs/TableOverview.vue'
import TableView from '@/views/jobs/TableView.vue'
import NotFound from '@/views/core/NotFound.vue'
import ScriptUpload from '@/views/scripts/UploadScript.vue'
import Login from '@/views/core/Login.vue'
import ScriptOverview from '@/views/scripts/ScriptOverview.vue'
import CreateJob from '@/views/jobs/CreateJob.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true,
      }
    },
    {
      path: '/jobs',
      name: 'tables',
      component: TableOverview,
      meta: {
        requiresAuth: true,
      }
    },
    {
      path: '/jobs/table/:id(\\d+)',
      name: 'table',
      component: TableView,
      meta: {
        requiresAuth: true,
      }
    },
    {
      path: '/jobs/create/:id(\\w+)?',
      name: 'createJob',
      component: CreateJob,
      meta: {
        requiresAuth: true,
      }
    },
    {
      path: '/scripts',
      name: 'scripts',
      component: ScriptOverview,
      meta: {
        requiresAuth: true,
      }
    },
    {
      path: '/script/upload/:name(\\w+)?',
      name: 'scriptUpload',
      component: ScriptUpload,
      meta: {
        requiresAuth: true,
      }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
    }
  ],
})
router.beforeEach(async(to, from) => {
  // Redirect to login if route requires auth and user is not logged in
  if ((to.meta.requiresAuth || false) && !(document.cookie.includes('oauth2='))){
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  else if (to.name === 'login' && document.cookie.includes('oauth2=')) {
    // Redirect to home if user is logged in and tries to access login page
    return { name: 'home' }
  }
  return true
})
export default router
