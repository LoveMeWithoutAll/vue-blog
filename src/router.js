import Vue from 'vue'
import Router from 'vue-router'
import List from '@/views/List.vue'
import PostView from '@/components/PostViewer'
import Writer from '@/components/Writer'
import Login from '@/components/Login'
import store from '@/vuex/store'

Vue.use(Router)

const requireAuth = () => (from, to, next) => {
  if (store.getters.getUser) return next() // isAuth === true면 페이지 이동
  next('/') // isAuth === false면 다시 로그인 화면으로 이동
}

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'list',
      component: List
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
    },
    {
      path: '/post',
      name: 'post',
      component: PostView
    },
    {
      path: '/writer',
      name: 'writer',
      component: Writer,
      beforeEnter: requireAuth()
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/updater',
      name: 'updater',
      component: Writer,
      beforeEnter: requireAuth()
    }
  ]
})
