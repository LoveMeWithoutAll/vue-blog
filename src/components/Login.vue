<template>
  <v-col cols="12" md="7" offset-md="1">
    <div class="login">
      <h3>LOG IN</h3>
      <v-form>
        <v-text-field type="text" v-model="email" placeholder="Email"></v-text-field>
        <v-text-field type="password" v-model="password" placeholder="Password"></v-text-field>
      </v-form>
      <v-btn v-on:click="signIn">Connection</v-btn>
    </div>
  </v-col>
</template>

<script>
import { firebaseAuth } from '@/firebase/firebaseAuth'
import { mapGetters } from 'vuex'

export default {
  name: 'login',
  data: function () {
    return {
      email: '',
      password: ''
    }
  },
  computed: {
    ...mapGetters({ user: 'getUser' })
  },
  methods: {
    signIn () {
      firebaseAuth
        .signInWithEmailAndPassword(this.email, this.password)
        .then(
          (user) => {},
          (err) => {
            alert('Oops. ' + err.message)
          }
        )
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
