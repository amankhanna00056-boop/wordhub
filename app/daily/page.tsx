"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
}

export default function DailyWordPage() {
  const [dailyWord, setDailyWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyWord();
  }, []);

  const loadDailyWord = async () => {
    try {
      const snapshot = await getDocs(collection(db, "words"));

      const words = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      if (words.length === 0) {
        setLoading(false);
        return;
      }

      // Same word for the whole day
      const today = new Date();
      const dayNumber =
        today.getFullYear() * 1000 +
        today.getMonth() * 100 +
        today.getDate();

      const index = dayNumber % words.length;

      setDailyWord(words[index]);

    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex justify-center items-center">
        <h1 className="text-3xl font-bold">
          Loading Daily Word...
        </h1>
      </main>
    );
  }
    if (!dailyWord) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex justify-center items-center">
        <div className="text-center">

          <h1 className="text-4xl font-bold text-red-500">
            No Words Found
          </h1>

          <Link
            href="/"
            className="inline-block mt-8 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold"
          >
            ← Back Home
          </Link>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white py-12 px-5">

      <div className="max-w-4xl mx-auto">

        <div className="text-center">

          <h1 className="text-5xl font-extrabold text-yellow-400">
            📅 Word of the Day
          </h1>

          <p className="text-gray-400 mt-4 text-lg">
            Learn one new English word every day.
          </p>

        </div>

        <div className="bg-slate-800 rounded-3xl shadow-xl p-10 mt-10 border border-slate-700">

          <h2 className="text-5xl font-bold text-green-400">
            {dailyWord.word}
          </h2>

          <div className="mt-8">

            <h3 className="text-xl font-bold text-yellow-400">
              📖 Meaning
            </h3>

            <p className="mt-3 text-lg leading-8">
              {dailyWord.meaning}
            </p>

          </div>

          <div className="mt-8">

            <h3 className="text-xl font-bold text-yellow-400">
              📝 Example
            </h3>

            <p className="mt-3 text-lg italic">
              {dailyWord.example || "No example available."}
            </p>

          </div>

          <div className="mt-8">

            <span className="bg-blue-600 px-5 py-2 rounded-full">
              {dailyWord.category}
            </span>

          </div>

          <div className="flex flex-wrap gap-4 mt-10">

            <Link
              href={`/dictionary/${encodeURIComponent(dailyWord.word)}`}
              className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-bold transition"
            >
              📖 View Full Details
            </Link>

            <Link
              href="/dictionary"
              className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-bold transition"
            >
              📚 Browse Dictionary
            </Link>

            <Link
              href="/"
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-xl font-bold transition"
            >
              🏠 Home
            </Link>

          </div>

        </div>

        <div className="mt-16 text-center border-t border-slate-700 pt-8">

          <p className="text-gray-400">
            Come back tomorrow for a new Word of the Day!
          </p>

        </div>

      </div>

    </main>
  );
}