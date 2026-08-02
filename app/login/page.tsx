"use client";

import { auth, db } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        createdAt: new Date(),
      });

      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error(error);
      alert(error.code + "\n" + error.message);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-3xl font-bold text-center text-yellow-400">
          WordHub Login
        </h1>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-8 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600"
        >
          Sign in with Google
        </button>
      </div>
    </main>
  );
}