<template>
  <v-container>
    <v-layout row wrap align-center>
      <v-flex xs12 md4>
        <div class="text-xs-center">
          <v-avatar size="125px">
            <img
              class="img-circle elevation-7 mb-1"
              src="https://raw.githubusercontent.com/vuetifyjs/docs/dev/static/doc-images/lists/1.jpg"
            >
          </v-avatar>
          <div class="headline">John <span style="font-weight:bold">Carter</span></div>
          <div class="subheading text-xs-center grey--text pt-1 pb-3">Lorem ipsum dolor sit amet</div>
          <v-layout justify-space-between>
            <a href="javascript:;" class="body-2">Home</a>
            <a href="javascript:;" class="body-2">About</a>
            <a href="javascript:;" class="body-2">Github</a>
            <a href="javascript:;" class="body-2">Other</a>
          </v-layout>
        </div>
      </v-flex>
      <v-flex xs12 md5 offset-md2>
        <div v-for="post in posts" :key="post.title">
          <v-card class="my-3" hover>
            <v-card-media
              class="white--text"
              height="170px"
              :src="post.imgUrl"
            >
              <v-container fill-height fluid>
                <v-layout>
                  <v-flex xs12 align-end d-flex>
                    <span class="headline">{{ post.title }}</span>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-card-media>
            <v-card-text>
              {{ post.content }}
            </v-card-text>
            <v-card-actions>
              <v-btn icon class="red--text">
                <v-icon medium>fa-reddit</v-icon>
              </v-btn>
              <v-btn icon class="light-blue--text">
                <v-icon medium>fa-twitter</v-icon>
              </v-btn>
              <v-btn icon class="blue--text text--darken-4">
                <v-icon medium>fa-facebook</v-icon>
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn flat class="blue--text">Read More</v-btn>
            </v-card-actions>
          </v-card>
        </div>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
export default {
  data () {
    return {
      title: 'Your Logo',
        posts: [
          {
            title: 'Fusce ullamcorper tellus',
            content: 'Fusce ullamcorper tellus sed maximus rutrum. Donec imperdiet ultrices maximus. Donec non tellus non neque pellentesque fermentum. Aenean in pellentesque urna.',
            imgUrl: 'https://raw.githubusercontent.com/vuetifyjs/docs/dev/static/doc-images/cards/drop.jpg'
          },
          {
            title: 'Donec vitae suscipit lectus, a luctus diam.',
            content: 'Donec vitae suscipit lectus, a luctus diam. Proin vitae felis gravida, lobortis massa sit amet, efficitur erat. Morbi vel ultrices nisi.',
            imgUrl: 'https://raw.githubusercontent.com/vuetifyjs/docs/dev/static/doc-images/cards/docks.jpg'
          },
          {
            title: 'Vestibulum condimentum quam',
            content: 'At sagittis sapien vulputate. Vivamus laoreet lacus id magna rutrum dapibus. Donec vel pellentesque arcu. Maecenas mollis odio tempus felis elementum commodo.',
            imgUrl: 'https://raw.githubusercontent.com/vuetifyjs/docs/dev/static/doc-images/cards/plane.jpg'
          }
        ]
    }
  }
}
</script>

<style scoped>

</style>
