import '@babel/polyfill'
import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from '@/vuex/store'
import VueFirestore from 'vue-firestore'
import VueDisqus from 'vue-disqus'

Vue.use(VueFirestore)
Vue.use(VueDisqus)

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
