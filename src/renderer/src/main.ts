import { createApp } from 'vue'

import App from './app.vue'
import { pinia } from './utils/config/pinia'
import { router } from './utils/config/router'

import 'virtual:uno.css'
import '@styles/main.scss'

createApp(App).use(pinia).use(router).mount('#app')
