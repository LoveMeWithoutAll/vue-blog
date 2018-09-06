import { firebaseApp } from './firebase'
import 'firebase/auth'

export const firebaseAuth = firebaseApp.auth()
