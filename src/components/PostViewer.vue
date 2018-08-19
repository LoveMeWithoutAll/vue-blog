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
        <span>{{ getContent }}</span>
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
    </v-card>
  </v-flex>

</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters([
      'getTitle',
      'getContent',
      'getDate',
      'getWriter',
      'getImgUrl'
    ])
  }
}
</script>

<style scoped>

</style>
