<template>
  <v-flex xs12 md4>
    <div class="text-xs-center">
      <v-avatar size="125px">
        <img
          class="img-circle elevation-7 mb-1"
          src="/img/profile-lying-cat.jpg"
        >
      </v-avatar>
      <div class="headline">Book, Cook & <span style="font-weight:bold">Spook</span></div>
      <div class="subheading text-xs-center grey--text pt-1 pb-3">All we read and cooked</div>
      <v-layout justify-space-between class="mb-5">
        <router-link to="/" class="body-2">Home</router-link>
        <router-link to="/about" class="body-2">About</router-link>
        <router-link v-if="getUser" to="/writer" class="body-2">Write</router-link>
        <router-link v-if="!getUser" to="/login" class="body-2">Login</router-link>
        <a v-if="getUser" @click="signOut" class="body-2">Logout</a>
      </v-layout>
    </div>
  </v-flex>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['getUser'])
  },
  methods: {
    ...mapActions(['logout']),
    signOut () {
      this.logout()
      this.$router.replace('/')
    }
  }
}
</script>

<style scoped>

</style>
