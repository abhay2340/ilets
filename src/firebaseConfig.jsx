

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD30kb56JbiE0fH58mCV-V7vMyxiRVf-lc",
  authDomain: "ilets-e09c6.firebaseapp.com",
  projectId: "ilets-e09c6",
  storageBucket: "ilets-e09c6.firebasestorage.app",
  messagingSenderId: "471230915741",
  appId: "1:471230915741:web:70c755dc52a2a3b254a074",
  measurementId: "G-KRXCH67YNP"
};
const app = initializeApp(firebaseConfig);

// Initialize Firebase
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Export these
export { db, auth };
