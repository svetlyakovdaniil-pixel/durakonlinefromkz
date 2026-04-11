import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAYJAAIUyqxdF_jERYOTCFbVKpv6uzJPb8",
  authDomain: "durak-online-kz.firebaseapp.com",
  projectId: "durak-online-kz",
  storageBucket: "durak-online-kz.firebasestorage.app",
  messagingSenderId: "825855589810",
  appId: "1:825855589810:web:2fb22aff27ea310abcf8ab",
  measurementId: "G-ZNFVMEZY6V",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
