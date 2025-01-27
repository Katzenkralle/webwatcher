import './assets/global.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// primevue and icons
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';

export const GQL_ENDPOINT = '/gql'
export const AUTH_ENDPOINT = '/auth'
import { MainTheme } from './primevue_theme';
const app = createApp(App)

app.use(router)
// to be replaced with the following: app.use(PrimeVue, { unstyled: true });
app.use(PrimeVue, {
    theme: {
        preset: MainTheme,
        options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false
        }
    }
 });
app.mount('#app')
