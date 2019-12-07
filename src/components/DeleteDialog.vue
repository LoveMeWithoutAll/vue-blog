<template>
  <v-dialog
    v-model="openDelDialog"
    max-width="290"
  >
    <v-card>
      <v-card-title class="headline">Really?</v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="red darken-1"
          text
          @click="makeHidden()"
        >
          Delete!
        </v-btn>
        <v-btn
          color="green darken-1"
          text
          @click="hideDeleteDialog"
        >
          NO. WAIT
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { firestore } from '@/firebase/firestore'
import { mapGetters } from 'vuex'

export default {
  props: ['openDelDialog'],
  computed: {
    ...mapGetters([
      'getKey'
    ])
  },
  methods: {
    makeHidden () {
      firestore
        .collection('Post')
        .doc(this.getKey)
        .update({
          show: false
        })
        .then(() => {
          this.$router.push('/')
        })
        .catch((error) => {
          console.error('Error on remove: ', error)
        })
    },
    hideDeleteDialog () {
      this.$emit('showDelDialog', false)
    }
  }
}
</script>
