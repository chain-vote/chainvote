import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// These must be replaced with the actual Firebase Project Configuration by the user
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBfwFO1i-513yLhyo-csHb0OsZnBG89dxw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "campus-os-nspt.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "campus-os-nspt",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "campus-os-nspt.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "466392451321",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:466392451321:web:821c898da76e4c7532ba28"
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
