<template>
  <v-flex xs12 md7 offset-md1>
    <v-form>
      <v-text-field
        v-model="title"
        label="Title"
        required>
      </v-text-field>
      <file-uploader v-on:downloadURL="getDownloadUrl" class="mb-4"></file-uploader>
    </v-form>
    <vue-editor id="writer" v-model="content"></vue-editor>
    <v-layout align-center justify-end row fill-height>
      <v-btn @click="savePost">save</v-btn>
    </v-layout>
  </v-flex>
</template>

<script>
import { VueEditor } from 'vue2-editor'
import { firestore } from '@/firebase/firestore'
import FileUploader from '@/components/FileUploader'
import { mapGetters, mapMutations } from 'vuex'
import * as types from '@/vuex/mutation_types'

export default {
  components: {
    VueEditor,
    FileUploader
  },
  created () {
    if (this.$route.name === 'writer') this.initArticleData()
  },
  computed: {
    ...mapGetters(['getKey', 'getTitle', 'getContent', 'getImgUrl', 'getWriter', 'getUser']),
    title: {
      get () {
        return this.getTitle
      },
      set (value) {
        this.updateTitle(value)
      }
    },
    content: {
      get () {
        return this.getContent
      },
      set (value) {
        this.updateContent(value)
      }
    }
  },
  methods: {
    ...mapMutations({
      updateTitle: types.SET_TITLE,
      updateContent: types.SET_CONTENT,
      initArticleData: types.INIT_ARTICLE_DATA
    }),
    savePost () {
      firestore
        .collection('Post')
        .doc(this.getKey || new Date().getTime().toString())
        .set({
          title: this.title,
          content: this.content,
          date: {
            seconds: new Date().getTime(),
            nanoseconds: 0
          },
          writer: this.getUser.displayName || this.writer,
          imgUrl: this.imgUrl || this.getImgUrl,
          show: true
        })
        .then(() => this.$router.push('/'))
        .catch((error) => {
          console.error(`Error adding document: ${error}`)
        })
    },
    getDownloadUrl (v) {
      this.imgUrl = v
    }
  }
}
</script>

<style>
#writer .ql-editor {
  min-height: 500px;
}
</style>
