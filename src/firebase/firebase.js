import Firebase from 'firebase'
import credentials from './credentials'

export const firebaseApp = Firebase.initializeApp(credentials.firebase)
