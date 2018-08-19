<template>
  <v-flex xs12 md5 offset-md2>
    <div v-for="(Post, idx) in Posts" :key="idx">
      <v-card class="my-3" hover>
        <v-card-media
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
        </v-card-media>
        <v-card-text>
          {{ Post.content }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat class="blue--text">Read More</v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </v-flex>
</template>

<script>
import { firestore } from '@/firebase/firestore'

export default {
  data () {
    return {
      Posts: [],
      headers: [
        {text: 'Ranking', value: 'rank', sortable: false},
        {text: 'Time left', value: 'timeLeft', sortable: false},
        {text: 'Name', value: 'name', sortable: false},
        {text: 'Date', value: 'date', sortable: false}
      ]
    }
  },
  firestore () {
    return {
      Posts: firestore.collection('Post').orderBy('date', 'desc')
    }
  }
}
</script>

<style scoped>

</style>
