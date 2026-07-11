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

interface Word {
  id: string;
  word: string;
  meaning: string;
  category: string;
}

export default function Dashboard() {
  const [totalWords, setTotalWords] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [recentWords, setRecentWords] = useState<Word[]>([]);

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

      const q = query(
        collection(db, "words"),
        orderBy("createdAt", "desc"),
        limit(5)
      );

      const recentSnapshot = await getDocs(q);

      const latest = recentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      setRecentWords(latest);

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

      <div className="grid grid-cols-2 gap-4 mt-10 w-[500px]">

        <button
          onClick={() => (window.location.href = "/add-word")}
          className="bg-green-500 hover:bg-green-600 py-3 rounded-lg font-bold"
        >
          ➕ Add Word
        </button>

        <button
          onClick={() => (window.location.href = "/words")}
          className="bg-blue-500 hover:bg-blue-600 py-3 rounded-lg font-bold"
        >
          📚 View Words
        </button>

        <button
          onClick={() => (window.location.href = "/bulk-import")}
          className="bg-purple-500 hover:bg-purple-600 py-3 rounded-lg font-bold"
        >
          📥 Bulk Import
        </button>
                <button
          onClick={() => (window.location.href = "/daily")}
          className="bg-orange-500 hover:bg-orange-600 py-3 rounded-lg font-bold"
        >
          🎯 Daily Word
        </button>

      </div>

      <div className="mt-10 w-[700px] bg-slate-800 rounded-xl p-6">

        <h2 className="text-2xl font-bold text-yellow-400 mb-5">
          📋 Latest 5 Words
        </h2>

        {recentWords.length === 0 ? (

          <p className="text-gray-400">
            No words available.
          </p>

        ) : (

          <div className="space-y-4">

            {recentWords.map((item) => (

              <div
                key={item.id}
                className="flex justify-between items-center border-b border-slate-700 pb-3"
              >

                <div>

                  <h3 className="text-xl font-bold text-green-400">
                    {item.word}
                  </h3>

                  <p className="text-gray-300">
                    {item.meaning}
                  </p>

                </div>

                <span className="bg-blue-500 px-3 py-1 rounded-full text-sm">
                  {item.category}
                </span>

              </div>

            ))}

          </div>

        )}

      </div>

      <button
        onClick={handleLogout}
        className="mt-10 bg-red-500 hover:bg-red-600 px-8 py-3 rounded-lg font-bold"
      >
        🚪 Logout
      </button>

    </main>
  );
}