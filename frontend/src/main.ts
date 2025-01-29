import './assets/global.css'

import Lara from "@primevue/themes/lara";

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// primevue and icons
import PrimeVue from 'primevue/config';
import 'primeicons/primeicons.css';

export const GQL_ENDPOINT = '/gql'
export const AUTH_ENDPOINT = '/auth'
const app = createApp(App)

app.use(router)
// to be replaced with the following: app.use(PrimeVue, { unstyled: true });
app.use(PrimeVue, {
    theme: {
        preset: Lara,
        options: {
            darkModeSelector: 'system',
            cssLayer: {
                name: 'primevue',
                order: 'base, primevue, theme, components, utilities'
            }
        }
    }
 });
app.mount('#app')
