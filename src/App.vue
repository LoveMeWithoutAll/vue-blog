<template>
  <v-app light>
    <v-content>
      <v-container>
        <v-layout row wrap align-center>
          <Nav></Nav>
          <router-view/>
        </v-layout>
      </v-container>
    </v-content>
    <v-footer>
      <span>&copy; 2018</span>
    </v-footer>
  </v-app>
</template>

<script>
import Nav from '@/components/Nav'

export default {
  components: {
    Nav
  }
}
</script>
