import Firebase from 'firebase'
import credentials from './credentials'

export const firebaseApp = Firebase.initializeApp(credentials.firebase)
export const firestore = firebaseApp.firestore()
firestore.settings({timestampsInSnapshots: true})
