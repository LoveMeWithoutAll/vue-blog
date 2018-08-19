<template>
  <v-flex xs12 md4>
    <div class="text-xs-center">
      <v-avatar size="125px">
        <img
          class="img-circle elevation-7 mb-1"
          src="https://lovemewithoutall.github.io/assets/images/binary.jpg"
        >
      </v-avatar>
      <div class="headline">what <span style="font-weight:bold">Books</span></div>
      <div class="subheading text-xs-center grey--text pt-1 pb-3">All we read</div>
      <v-layout justify-space-between>
        <router-link to="/" class="body-2">Home</router-link>
        <router-link to="/about" class="body-2">About</router-link>
        <a href="javascript:;" class="body-2">Write</a>
        <a href="javascript:;" class="body-2">Login</a>
        <a href="javascript:;" class="body-2">Logout</a>
      </v-layout>
    </div>
  </v-flex>
</template>

<script>
export default {
  methods: {

  }
}
</script>

<style scoped>

</style>
