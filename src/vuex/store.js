import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'
import mutations from './mutations'

Vue.use(Vuex)

const state = {
  key: '',
  title: '',
  content: '',
  date: '',
  writer: '',
  imgUrl: ''
}

export default new Vuex.Store({
  state,
  getters,
  mutations
})
