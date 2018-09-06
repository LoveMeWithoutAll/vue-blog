import firebase from 'firebase'

export default {
  logout () {
    firebase
      .auth()
      .signOut()
      .then()
      .catch((error) => console.error(`SingOut Error: ${error}`))
  }
}
