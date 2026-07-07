import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyAt1CUSMK62QX1Zw_H4K8GNTlRUZnQ7JFc",
  authDomain: "wordhub-cc399.firebaseapp.com",
  projectId: "wordhub-cc399",
  storageBucket: "wordhub-cc399.firebasestorage.app",
  messagingSenderId: "983446214378",
  appId: "1:983446214378:web:43406b6db4788040e92993",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;