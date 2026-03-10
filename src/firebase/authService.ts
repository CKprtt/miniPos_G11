import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

type RegisterData = {
  shopName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
};

export async function registerUser(data: RegisterData) {
  const { shopName, email, password, phone, address } = data;

  // 1. สร้างบัญชีผู้ใช้ใน Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const uid = userCredential.user.uid;

  // 2. บันทึกข้อมูลร้านค้าลงใน Firestore
  await setDoc(doc(db, "users", uid), {
    shopName,
    email,
    phone,
    address,
    createdAt: serverTimestamp(),
  });

  await signOut(auth);

  return userCredential.user;
}

export async function loginUser(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}