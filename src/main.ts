import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Mount once the first route has resolved. Mounted earlier, the Analytics component
// sees the router's starting `/` and records a view of it before the real page.
router.isReady().then(() => app.mount('#app'))
