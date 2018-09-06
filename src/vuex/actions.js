import { firebaseAuth } from '@/firebase/firebaseAuth'

export default {
  logout () {
    firebaseAuth
      .signOut()
      .then()
      .catch((error) => console.error(`SingOut Error: ${error}`))
  }
}
