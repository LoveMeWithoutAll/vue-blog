<template>
  <div>
    <v-btn
      @click.native="selectFile"
      v-if="!uploadEnd && !uploading">
        Upload a cover image
        <v-icon
        right
        aria-hidden="true">
          add_a_photo
        </v-icon>
    </v-btn>
    <input
      id="files"
      type="file"
      name="file"
      ref="uploadInput"
      accept="image/*"
      :multiple="false"
      @change="detectFiles($event)" />
      <v-progress-circular
        v-if="uploading && !uploadEnd"
        :size="100"
        :width="15"
        :rotate="360"
        :value="progressUpload"
        color="primary">
        {{ progressUpload }}%
      </v-progress-circular>
      <img
        v-if="uploadEnd"
        :src="downloadURL"
        width="100%" />
      <div v-if="uploadEnd">
        <v-btn
          class="ma-0"
          dark
          small
          color="error"
          @click="deleteImage()"
          >
          Delete
        </v-btn>
      </div>
  </div>
</template>

<script>
// Thanks Marcelo Forclaz(https://github.com/CristalT) https://gist.github.com/CristalT/2651023cfa2f36cddd119fd979581893
// Thanks Matteo Leoni(https://github.com/signalkuppe) https://github.com/signalkuppe/vuetify-cloudinary-upload/blob/master/src/components/v-cloudinary-upload.vue
import { firestorage } from '@/firebase/firestorage'

export default {
  props: ['oldImgUrl'],
  data () {
    return {
      progressUpload: 0,
      fileName: '',
      uploadTask: '',
      uploading: false,
      uploadEnd: false,
      downloadURL: ''
    }
  },
  created () {
    if (this.oldImgUrl) this.setCoverImgOnUpdate()
  },
  methods: {
    selectFile () {
      this.$refs.uploadInput.click()
    },
    detectFiles (e) {
      let fileList = e.target.files || e.dataTransfer.files
      Array.from(Array(fileList.length).keys()).map(x => {
        this.upload(fileList[x])
      })
    },
    upload (file) {
      this.fileName = file.name
      this.uploading = true
      this.uploadTask = firestorage.ref('images/' + file.name).put(file)
    },
    deleteImage () {
      if (this.oldImgUrl === '') {
        this.deleteImgOnFirebase()
      } else {
        this.deleteImgOnUpdate()
      }
    },
    setCoverImgOnUpdate () {
      this.uploadEnd = true
      this.downloadURL = this.oldImgUrl
    },
    deleteImgOnFirebase () {
      firestorage
        .ref('images/' + this.fileName)
        .delete()
        .then(() => {
          this.uploading = false
          this.uploadEnd = false
          this.downloadURL = ''
        })
        .catch((error) => {
          console.error(`file delete error occured: ${error}`)
        })
    },
    deleteImgOnUpdate () {
      this.uploading = false
      this.uploadEnd = false
      this.downloadURL = ''
    }
  },
  watch: {
    uploadTask: function () {
      this.uploadTask.on('state_changed', sp => {
        this.progressUpload = Math.floor(sp.bytesTransferred / sp.totalBytes * 100)
      },
      null,
      () => {
        this.uploadTask.snapshot.ref.getDownloadURL().then(downloadURL => {
          this.uploadEnd = true
          this.downloadURL = downloadURL
          this.$emit('downloadURL', downloadURL)
        })
      })
    }
  }
}
</script>

<style>
.progress-bar {
  margin: 10px 0;
}
input[type="file"] {
  position: absolute;
  clip: rect(0,0,0,0);
}
</style>
