<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import { firestore } from '@/firebase/firestore'

export default {
  name: 'home',
  components: {
    HelloWorld
  },
  created () {
    this.firestoreTest()
  },
  methods: {
    firestoreTest () {
      console.log(firestore.collection('artlcles'))
    }
  }
}
</script>
