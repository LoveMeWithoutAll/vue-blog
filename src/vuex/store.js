import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import mutations from './mutations'
import actions from './actions'
import { firebaseAuth } from '@/firebase/firebaseAuth'

Vue.use(Vuex)

firebaseAuth.onAuthStateChanged((user) => {
  if (user) {
    state.user = user
  } else {
    state.user = null
  }
})

const state = {
  key: '',
  title: '',
  content: '',
  date: null,
  writer: '',
  imgUrl: '',
  user: null
}

export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions
})
