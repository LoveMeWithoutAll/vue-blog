<template>
  <v-col cols="12" md="7" offset-md="1">
    <v-card>
      <v-img
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
      <div v-if="getUser" class="pa-3">
        <v-row class="fill-height" align="center" justify="end"  >
          <v-btn @click="update" class="ma-2">edit</v-btn>
          <v-btn @click="showDelDialog(true)" class="ma-2">delete</v-btn>
        </v-row>
      </div>
    </v-card>
    <delete-dialog
      :openDelDialog="openDelDialog"
      v-on:showDelDialog="showDelDialog"
    >
    </delete-dialog>
    <disqus class="ma-3"/>
  </v-col>

</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import * as types from '@/vuex/mutation_types'
import { firestore } from '@/firebase/firestore'
import _ from 'lodash'
import Disqus from './Disqus'
import deleteDialog from './DeleteDialog'

export default {
  components: {
    Disqus,
    deleteDialog
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
  data () {
    return {
      openDelDialog: false
    }
  },
  created () {
    if (this.getKey === '') this.getPost()
  },
  methods: {
    ...mapMutations({ setKey: types.SET_KEY,
      setTitle: types.SET_TITLE,
      setContent: types.SET_CONTENT,
      setDate: types.SET_DATE,
      setWriter: types.SET_WRITER,
      setImgUrl: types.SET_IMG_URL }),
    update () {
      this.$router.push('/updater')
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
    },
    showDelDialog (v) {
      this.openDelDialog = v
    }
  }
}
</script>

<style scoped>

</style>
