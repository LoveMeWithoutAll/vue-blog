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

export default {
  components: {
    VueEditor,
    FileUploader
  },
  data () {
    return {
      title: '',
      content: '',
      writer: 'tester',
      imgUrl: ''
    }
  },
  methods: {
    savePost () {
      firestore
        .collection('Post')
        .doc(new Date().getTime().toString())
        .set({
          title: this.title,
          content: this.content,
          date: {
            seconds: new Date().getTime(),
            nanoseconds: 0
          },
          writer: this.writer,
          imgUrl: this.imgUrl
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
