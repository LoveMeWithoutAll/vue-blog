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
        <span v-html="getContent"></span>
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
  </v-flex>

</template>

<script>
import { mapGetters } from 'vuex'
import { firestore } from '@/firebase/firestore'

export default {
  computed: {
    ...mapGetters([
      'getKey',
      'getTitle',
      'getContent',
      'getDate',
      'getWriter',
      'getImgUrl',
      'getUser'
    ])
  },
  methods: {
    update () {
      this.$router.push('updater')
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
    }
  }
}
</script>

<style scoped>

</style>
