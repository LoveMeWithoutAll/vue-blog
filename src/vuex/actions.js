import firebase from 'firebase'

const signIn = (store, {email, password}) => {
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(
      (user) => {},
      (err) => {
        alert('Oops. ' + err.message)
      }
    )
}

const signOut = (store) => {
  firebase
    .auth()
    .signOut()
    .then()
    .catch((error) => console.error(`SingOut Error: ${error}`))
}

export default {
  login (store, {email, password}) {
    signIn(store, {email, password})
  },
  logout (store) {
    signOut(store)
  }
}
