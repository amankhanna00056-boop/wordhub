"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
}

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "words"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      setWords(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWords = words.filter((item) => {
    const key = search.toLowerCase();

    return (
      item.word.toLowerCase().includes(key) ||
      item.meaning.toLowerCase().includes(key) ||
      item.category.toLowerCase().includes(key)
    );
  });

  return (
    <main className="min-h-screen bg-slate-900 text-white">

      <div className="max-w-7xl mx-auto px-8 py-10">

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">

          <div>

            <h1 className="text-5xl font-bold text-yellow-400">
              📚 WordHub
            </h1>

            <p className="text-gray-300 mt-3 text-lg">
              Learn English Words Everyday
            </p>

          </div>

          <div className="flex gap-4">

            <Link
              href="/daily"
              className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-bold"
            >
              Daily Word
            </Link>

            <Link
              href="/login"
              className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-bold"
            >
              Admin Login
            </Link>

          </div>

        </div>

        <div className="mt-10">

          <input
            type="text"
            placeholder="🔍 Search Word..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700 outline-none"
          />

        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                  <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-bold transition duration-200"
          >
            Admin Login
          </Link>

          <Link
            href="/daily"
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-bold transition duration-200"
          >
            Daily Word
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mt-10">
        <input
          type="text"
          placeholder="🔍 Search Word..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-5 rounded-xl bg-slate-800 border border-slate-700 text-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      {/* Words */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">

        {loading ? (

          <div className="col-span-full text-center py-20">
            <h2 className="text-3xl font-bold text-gray-400">
              Loading Words...
            </h2>
          </div>

        ) : filteredWords.length === 0 ? (

          <div className="col-span-full text-center py-20">
            <h2 className="text-3xl font-bold text-gray-400">
              No Words Found
            </h2>

            <p className="text-gray-500 mt-3">
              Try another search keyword.
            </p>
          </div>

        ) : (

          filteredWords.map((item) => (

            <div
              key={item.id}
              className="bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >

              <h2 className="text-3xl font-bold text-green-400">
                {item.word}
              </h2>

              <p className="mt-4 text-lg">
                <span className="font-bold text-yellow-400">
                  Meaning:
                </span>{" "}
                {item.meaning}
              </p>

              <p className="mt-4 text-gray-300">
                <span className="font-bold text-blue-400">
                  Example:
                </span>{" "}
                {item.example}
              </p>

              <div className="mt-5">
                <span className="bg-blue-600 px-4 py-2 rounded-full text-sm">
                  {item.category}
                </span>
              </div>

            </div>

          ))

        )}

      </div>

    </div>

  </main>
);
}