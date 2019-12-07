<template>
  <v-app light>
    <v-content>
      <v-container>
        <v-row align="center">
          <Nav></Nav>
          <transition name="fade">
            <router-view/>
          </transition>
        </v-row>
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

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition-property: opacity;
  transition-duration: .25s;
}

.fade-enter-active {
  transition-delay: .25s;
}

.fade-enter, .fade-leave-active {
  opacity: 0
}
</style>
