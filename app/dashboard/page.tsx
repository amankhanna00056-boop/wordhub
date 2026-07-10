"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

export default function Dashboard() {
  const [totalWords, setTotalWords] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [recentWords, setRecentWords] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const snapshot = await getDocs(collection(db, "words"));

      setTotalWords(snapshot.size);

      const categories = new Set<string>();

      snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.category) {
          categories.add(data.category);
        }
      });

      setTotalCategories(categories.size);

      const recentQuery = query(
        collection(db, "words"),
        orderBy("createdAt", "desc"),
        limit(5)
      );

      const recentSnapshot = await getDocs(recentQuery);

      const recent = recentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecentWords(recent);

    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center py-12">

      <h1 className="text-5xl font-bold text-yellow-400">
        WordHub Dashboard
      </h1>

      <p className="mt-4 text-gray-300">
        Welcome to your WordHub Admin Panel
      </p>

      <div className="grid grid-cols-2 gap-6 mt-10">

        <div className="bg-slate-800 p-8 rounded-xl text-center w-56">
          <h2 className="text-lg text-gray-300">
            📚 Total Words
          </h2>

          <p className="text-4xl font-bold text-green-400 mt-3">
            {totalWords}
          </p>
        </div>

        <div className="bg-slate-800 p-8 rounded-xl text-center w-56">
          <h2 className="text-lg text-gray-300">
            📂 Categories
          </h2>

          <p className="text-4xl font-bold text-blue-400 mt-3">
            {totalCategories}
          </p>
        </div>

      </div>

      <button
        onClick={() => (window.location.href = "/add-word")}
        className="mt-10 bg-green-500 px-6 py-3 rounded-lg font-bold hover:bg-green-600"
      >
        ➕ Add New Word
      </button>

      <button
        onClick={() => (window.location.href = "/words")}
        className="mt-4 bg-blue-500 px-6 py-3 rounded-lg font-bold hover:bg-blue-600"
      >
        📚 View All Words
      </button>

      <div className="mt-10 w-full max-w-xl bg-slate-800 rounded-xl p-6">

        <h2 className="text-2xl font-bold text-yellow-400 mb-4">
          📋 Recent Words
        </h2>
                {recentWords.length === 0 ? (
          <p className="text-gray-400">
            No words found.
          </p>
        ) : (
          recentWords.map((word: any) => (
            <div
              key={word.id}
              className="flex justify-between items-center border-b border-slate-700 py-3"
            >
              <div>
                <h3 className="font-bold text-lg text-white">
                  {word.word}
                </h3>

                <p className="text-sm text-gray-400">
                  {word.meaning}
                </p>
              </div>

              <span className="bg-blue-500 px-3 py-1 rounded-lg text-sm">
                {word.category}
              </span>
            </div>
          ))
        )}

      </div>

      <button
        onClick={handleLogout}
        className="mt-8 bg-red-500 px-6 py-3 rounded-lg font-bold hover:bg-red-600"
      >
        Logout
      </button>

    </main>
  );
}