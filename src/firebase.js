import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  projectId: 'kanrihack',
  appId: '1:258512296179:web:2d72b6cc11943527a5ff86',
  storageBucket: 'kanrihack.firebasestorage.app',
  apiKey: 'AIzaSyCeeRnVV6d3o_6fTj0OJpuxe4-6ORToj_A',
  authDomain: 'kanrihack.firebaseapp.com',
  messagingSenderId: '258512296179',
  projectNumber: '258512296179',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
