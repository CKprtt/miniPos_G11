import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAZvaa6AlpRLcfvFbq1iT7gjYPw20aFwOM",
  authDomain: "minipos2026.firebaseapp.com",
  projectId: "minipos2026",
  storageBucket: "minipos2026.firebasestorage.app",
  messagingSenderId: "467347591070",
  appId: "1:467347591070:web:58c137f4c6c0346fb5d08f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;