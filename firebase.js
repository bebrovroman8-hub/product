// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// 🔹 Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD-zSBkUG48U3Li89f_FFrJJXKJ1_fn1Ko",
  authDomain: "tracker-896a6.firebaseapp.com",
  projectId: "tracker-896a6",
  storageBucket: "tracker-896a6.appspot.com",
  messagingSenderId: "704588125176",
  appId: "1:704588125176:web:4d4c02b5af9b6f745cbc0d"
};

// 🔹 Инициализация Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Экспорт Auth и Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("🔥 Firebase инициализирован (Auth + Firestore)");