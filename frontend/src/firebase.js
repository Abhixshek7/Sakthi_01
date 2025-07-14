import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDytTRV3bRDU4awwaoDpv_pyquhPWnunmg",
  authDomain: "mlinventorymanagment.firebaseapp.com",
  databaseURL: "https://mlinventorymanagment-default-rtdb.firebaseio.com",
  projectId: "mlinventorymanagment",
  storageBucket: "mlinventorymanagment.firebasestorage.app",
  messagingSenderId: "381671602563",
  appId: "1:381671602563:web:5e4b673a1be289e9ca9eb6",
  measurementId: "G-24BFFJ8XEH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Set up authentication
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const rtdb = getDatabase(app);

export { auth, provider, db, rtdb };