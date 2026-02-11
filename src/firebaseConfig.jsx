

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCEbJIGgj2820WJD_N7CTZVs7avYIMq0DA",
  authDomain: "real-ielts-248af.firebaseapp.com",
  projectId: "real-ielts-248af",
  storageBucket: "real-ielts-248af.firebasestorage.app",
  messagingSenderId: "1039608226269",
  appId: "1:1039608226269:web:98ae2dd5bc1f0f0a959634",
  measurementId: "G-D901HQ44C6"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// ✅ Export these
export { db, auth, storage };
