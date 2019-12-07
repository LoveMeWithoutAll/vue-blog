<template>
  <v-col cols="12" md="4">
    <div class="text-center">
      <v-avatar size="125px">
        <img
          class="img-circle elevation-7 mb-1"
          src="/img/profile-lying-cat.jpg"
        >
      </v-avatar>
      <div class="headline">Book, Cook & <span style="font-weight:bold">Spook</span></div>
      <div class="subheading text-center grey--text pt-1 pb-3">All we read and cooked</div>
      <v-row justify="space-between" class="pa-5">
        <router-link to="/" class="body-2 font-weight-bold">Home</router-link>
        <router-link to="/about" class="body-2 font-weight-bold">About</router-link>
        <router-link v-if="getUser" to="/writer" class="body-2 font-weight-bold">Write</router-link>
        <router-link v-if="!getUser" to="/login" class="body-2 font-weight-bold">Login</router-link>
        <a v-if="getUser" @click="signOut" class="body-2 font-weight-bold">Logout</a>
      </v-row>
    </div>
  </v-col>
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
      if (this.$route.path !== '/') this.$router.replace('/')
    }
  }
}
</script>

<style scoped>
a {
  text-decoration: none;
}
</style>
