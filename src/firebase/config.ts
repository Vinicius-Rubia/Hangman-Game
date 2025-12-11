// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCfABlrAZZedOZc-w-mI-eptMaR7Sc4ZeM",
  authDomain: "hangangame.firebaseapp.com",
  projectId: "hangangame",
  storageBucket: "hangangame.firebasestorage.app",
  messagingSenderId: "54631338158",
  appId: "1:54631338158:web:bda68af9913cd0f6a69d3f",
  measurementId: "G-8PYEG0VQL7",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
