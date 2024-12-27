import './assets/main.css'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css'
import VCalendar from 'v-calendar';
import 'v-calendar/style.css';

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)
// Use plugin with optional defaults
app.use(VCalendar, {})
app.use(createPinia())
app.use(router)

app.mount('#app')
