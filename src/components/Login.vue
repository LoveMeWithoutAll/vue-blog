<template>
  <v-flex xs12 md7 offset-md1>
    <div class="login">
      <h3>LOG IN</h3>
      <v-form>
        <v-text-field type="text" v-model="email" placeholder="Email"></v-text-field>
        <v-text-field type="password" v-model="password" placeholder="Password"></v-text-field>
      </v-form>
      <v-btn v-on:click="signIn">Connection</v-btn>
      <!-- <p>You don't have an account ? You can <router-link to="/sign-up">create one</router-link></p> -->
    </div>
  </v-flex>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'login',
  data: function () {
    return {
      email: '',
      password: ''
    }
  },
  computed: {
    ...mapGetters({user: 'getUser'})
  },
  methods: {
    ...mapActions(['login']),
    signIn () {
      this.login({email: this.email, password: this.password})
    }
  },
  watch: {
    user (user) {
      if (user) this.$router.replace('/')
    }
  }
}
</script>

<style scoped>  /* "scoped" attribute limit the CSS to this component only */
  .login {
    margin-top: 40px;
  }
  input {
    margin: 10px 0;
    width: 20%;
    padding: 15px;
  }
  button {
    margin-top: 20px;
    width: 10%;
    cursor: pointer;
  }
  p {
    margin-top: 40px;
    font-size: 13px;
  }
  p a {
    text-decoration: underline;
    cursor: pointer;
  }
</style>
