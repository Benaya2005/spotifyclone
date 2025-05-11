import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useAuthStore } from './stores/auth'
const app = createApp(App)

app.use(createPinia())

const authStore = useAuthStore();
authStore.initialize();


app.use(router)

app.mount('#app')

