<template>
  <v-flex xs12 md7 offset-md1>
    <v-card>
      <v-card-media
        class="white--text"
        height="300px"
        :src="getImgUrl"
      />
      <v-card-title>
        <span class="headline">{{ getTitle }}</span>
      </v-card-title>
      <v-card-text>
        <span v-html="imgResizedContent"></span>
      </v-card-text>
      <v-card-text>
        <span>
          <b>Date: </b>
          <span>{{ new Date(getDate) }}</span>
        </span>
      </v-card-text>
      <v-card-text>
        <b>Writer: </b>
        <span>{{ getWriter }}</span>
      </v-card-text>
      <div v-if="getUser">
        <v-layout align-center justify-end row fill-height>
          <v-btn @click="update">edit</v-btn>
          <v-btn @click="makeHidden">delete</v-btn>
        </v-layout>
      </div>
    </v-card>
    <disqus></disqus>
  </v-flex>

</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import * as types from '@/vuex/mutation_types'
import { firestore } from '@/firebase/firestore'
import _ from 'lodash'
import Disqus from './Disqus'

export default {
  components: {
    Disqus
  },
  computed: {
    ...mapGetters([
      'getKey',
      'getTitle',
      'getContent',
      'getDate',
      'getWriter',
      'getImgUrl',
      'getUser'
    ]),
    imgResizedContent () {
      return _.replace(this.getContent, new RegExp('img src', 'g'), 'img width="100%" src')
    }
  },
  created () {
    if (this.getKey === '') this.getPost()
  },
  methods: {
    ...mapMutations({setKey: types.SET_KEY,
      setTitle: types.SET_TITLE,
      setContent: types.SET_CONTENT,
      setDate: types.SET_DATE,
      setWriter: types.SET_WRITER,
      setImgUrl: types.SET_IMG_URL}),
    update () {
      this.$router.push('/updater')
    },
    makeHidden () {
      firestore
        .collection('Post')
        .doc(this.getKey)
        .update({
          show: false
        })
        .then(() => {
          this.$router.push('/')
        })
        .catch((error) => {
          console.error('Error on remove: ', error)
        })
    },
    getPost () {
      firestore
        .collection('Post')
        .doc(this.$route.params.key)
        .get()
        .then(doc => {
          let post = doc.data()
          this.setKey(this.$route.params.key)
          this.setTitle(post.title)
          this.setContent(post.content)
          this.setDate(post.date.seconds)
          this.setWriter(post.writer)
          this.setImgUrl(post.imgUrl)
        })
        .catch(error => {
          console.error(`getPost error: ${error}`)
        })
    }
  }
}
</script>

<style scoped>

</style>
