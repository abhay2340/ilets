

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-KJtSB6asIVMNgsiU3RBbw7cDTCY9Sco",
  authDomain: "ielts-exam-75652.firebaseapp.com",
  projectId: "ielts-exam-75652",
  storageBucket: "ielts-exam-75652.firebasestorage.app",
  messagingSenderId: "546993933352",
  appId: "1:546993933352:web:8194f0eff7e905b12db91d"
};
const app = initializeApp(firebaseConfig);

// Initialize Firebase
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ Export these
export { db, auth };
