import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TableOverview from '../views/TableOverview.vue'
import TableView from '@/views/TableView.vue'
import NotFound from '@/views/NotFound.vue'
import ScriptUpload from '@/views/UploadScript.vue'
import Login from '@/views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      path: '/tables',
      name: 'tables',
      component: TableOverview,
      meta: {
        requiresAuth: true,
      }
    },
    {
      path: '/table/:id(\\d+)',
      name: 'table',
      component: TableView,
      meta: {
        requiresAuth: true,
      }
    },
    {
      path: '/scriptUpload',
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
