"use client";

import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      alert(`Welcome ${result.user.displayName}`);
    } catch (error) {
      console.error(error);
      alert("Google Login Failed");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-96 bg-slate-800 p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-yellow-400">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mt-6 p-3 rounded-lg bg-slate-700 text-white outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mt-4 p-3 rounded-lg bg-slate-700 text-white outline-none"
        />

        <button
          className="w-full mt-6 bg-yellow-500 text-black py-3 rounded-lg font-bold hover:bg-yellow-400"
        >
          Login
        </button>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-red-500 text-white py-3 rounded-lg font-bold hover:bg-red-600"
        >
          Sign in with Google
        </button>
      </div>
    </main>
  );
}