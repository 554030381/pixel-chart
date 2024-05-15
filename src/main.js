import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import * as echarts from 'echarts'

const app = createApp(App)


app.provide('$echarts', echarts);
app.use(router)
app.use(ElementPlus)
app.mount('#app')
