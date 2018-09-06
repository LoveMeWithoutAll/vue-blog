import Firebase from 'firebase/app'
import credentials from './credentials'

export const firebaseApp = Firebase.initializeApp(credentials.firebase)
