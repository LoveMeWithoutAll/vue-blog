import { firebaseApp } from './firebase'

export const firestore = firebaseApp.firestore()
firestore.settings({timestampsInSnapshots: true})
