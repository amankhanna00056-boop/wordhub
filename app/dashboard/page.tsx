"use client";

import { auth } from "../firebase";
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-yellow-400">
        WordHub Dashboard
      </h1>

      <p className="mt-4 text-gray-300">
        Welcome to your WordHub Admin Panel
      </p>

      <button
        onClick={() => (window.location.href = "/add-word")}
        className="mt-8 bg-green-500 px-6 py-3 rounded-lg font-bold hover:bg-green-600"
      >
        ➕ Add New Word
      </button>

      <button
        onClick={() => (window.location.href = "/words")}
        className="mt-4 bg-blue-500 px-6 py-3 rounded-lg font-bold hover:bg-blue-600"
      >
        📚 View All Words
      </button>

      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 px-6 py-3 rounded-lg font-bold hover:bg-red-600"
      >
        Logout
      </button>
    </main>
  );
}