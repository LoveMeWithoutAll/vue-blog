import * as types from './mutation_types'

export default {
  [types.SET_KEY] (state, key) {
    state.key = key
  },
  [types.SET_TITLE] (state, title) {
    state.title = title
  },
  [types.SET_CONTENT] (state, content) {
    state.content = content
  },
  [types.SET_DATE] (state, date) {
    state.date = date
  },
  [types.SET_WRITER] (state, writer) {
    state.writer = writer
  },
  [types.SET_IMG_URL] (state, imgUrl) {
    state.imgUrl = imgUrl
  },
  [types.SET_USER] (state, user) {
    state.user = user
  }
}
