import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// primevue and icons
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';

export const GQL_ENDPOINT = '/gql'
export const AUTH_ENDPOINT = '/auth'

const app = createApp(App)

app.use(router)
// to be replaced with the following: app.use(PrimeVue, { unstyled: true });
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false
        }
    }
 });
app.mount('#app')
