<template>
  <v-flex xs12 md5 offset-md2>
    <div v-for="(Post, idx) in Posts" :key="idx">
      <v-card class="my-3" hover>
        <v-img
          class="white--text"
          height="170px"
          :src="Post.imgUrl"
        >
          <v-container fill-height fluid>
            <v-layout>
              <v-flex xs12 align-end d-flex>
                <span class="headline">{{ Post.title }}</span>
              </v-flex>
            </v-layout>
          </v-container>
        </v-img>
        <v-card-text>
          <span v-html="truncateString(Post.content)"></span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="viewPost(Post)" flat class="blue--text">Read More</v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </v-flex>
</template>

<script>
import { firestore } from '@/firebase/firestore'
import { mapMutations } from 'vuex'
import * as types from '@/vuex/mutation_types'
import _ from 'lodash'

export default {
  firestore () {
    return {
      Posts: firestore
        .collection('Post')
        .where('show', '==', true)
        .orderBy('date', 'desc')
    }
  },
  methods: {
    ...mapMutations({ setKey: types.SET_KEY,
      setTitle: types.SET_TITLE,
      setContent: types.SET_CONTENT,
      setDate: types.SET_DATE,
      setWriter: types.SET_WRITER,
      setImgUrl: types.SET_IMG_URL }),
    viewPost (v) {
      this.setKey(v['.key'])
      this.setTitle(v.title)
      this.setContent(v.content)
      this.setDate(v.date.seconds)
      this.setWriter(v.writer)
      this.setImgUrl(v.imgUrl)
      this.$router.push({ name: 'post', params: { key: v['.key'] } })
    },
    truncateString (v) {
      return _.truncate(v, {
        'length': 80
      })
    }
  }
}
</script>

<style scoped>

</style>
