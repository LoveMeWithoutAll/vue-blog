import { firebaseApp } from './firebase'
import 'firebase/firestore'

export const firestore = firebaseApp.firestore()
