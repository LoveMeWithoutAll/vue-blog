import Vue from 'vue'
import Router from 'vue-router'
import List from '@/views/List.vue'
import PostView from '@/components/PostViewer'
import Writer from '@/components/Writer'
import Login from '@/components/Login'

Vue.use(Router)

export default new Router({
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
      name: 'Writer',
      component: Writer
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    }
  ]
})
