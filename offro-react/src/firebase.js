// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXQhuBfWpsB2aCnTtujqFY4ZBXx8EM0vw",
  authDomain: "offro-auth.firebaseapp.com",
  projectId: "offro-auth",
  storageBucket: "offro-auth.firebasestorage.app",
  messagingSenderId: "365027312932",
  appId: "1:365027312932:web:6dc9c5406fd77b6fe89fb1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);