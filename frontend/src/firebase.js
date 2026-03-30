// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0lzNusHGHN3q5FBqM6M2PFcDdHJjmJt4",
  authDomain: "ai-factory-tarot.firebaseapp.com",
  projectId: "ai-factory-tarot",
  storageBucket: "ai-factory-tarot.firebasestorage.app",
  messagingSenderId: "869997180055",
  appId: "1:869997180055:web:59fadbd578b7efe60725d2",
  measurementId: "G-QLSV5KZB06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;
