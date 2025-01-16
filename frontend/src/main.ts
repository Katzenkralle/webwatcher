import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// primevue and icons
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';

const GQL_ENDPOINT = 'http://localhost:7001/graphql/'

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
