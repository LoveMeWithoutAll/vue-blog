import { firebaseApp } from './firebase'
import 'firebase/firestore'

export const firestore = firebaseApp.firestore()
firestore.settings({ timestampsInSnapshots: true })
