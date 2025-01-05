import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TableOverview from '../views/TableOverview.vue'
import TableView from '@/views/TableView.vue'
import NotFound from '@/views/NotFound.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/tables',
      name: 'tables',
      component: TableOverview,
    },
    {
      path: '/table/:id(\\d+)',
      name: 'table',
      component: TableView,
    },    
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
    }
  ],
})

export default router
