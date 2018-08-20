import firebase from 'firebase'
import { SET_USER } from './mutation_types'

const setUser = ({commit}, user) => {
  commit(SET_USER, user.user)
}

const signIn = (store, {email, password}) => {
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(
      (user) => {
        setUser(store, user)
      },
      (err) => {
        alert('Oops. ' + err.message)
      }
    )
}

const signOut = (store) => {
  firebase
    .auth()
    .signOut()
    .then(() => {
      setUser(store, null)
    })
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
