"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
} from "firebase/firestore";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
}

export default function WordPage() {
  const params = useParams();

  const slug = String(params.slug).toLowerCase();

  const [word, setWord] = useState<Word | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWord();
  }, []);

  const loadWord = async () => {
    try {
      const snapshot = await getDocs(collection(db, "words"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      const found = data.find(
        (item) => item.word.toLowerCase() === slug
      );

      if (found) {
        setWord(found);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">
        <h2 className="text-3xl font-bold">
          Loading...
        </h2>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center">

        <h2 className="text-4xl font-bold text-red-500">
          Word Not Found
        </h2>

        <Link
          href="/"
          className="inline-block mt-8 bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold"
        >
          Back Home
        </Link>

      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
             <Link
  href="/"
  className="inline-flex items-center mb-8 bg-yellow-400 text-black hover:bg-yellow-300 px-6 py-3 rounded-xl font-bold shadow-lg transition-all duration-300"
>
  ← Back to Dictionary
</Link>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl">

        <h1 className="text-5xl font-extrabold text-green-400">
          {word.word}
        </h1>

        <div className="mt-8 space-y-6">

          <div>
            <h2 className="text-xl font-bold text-yellow-400">
              📖 Meaning
            </h2>

            <p className="mt-2 text-lg text-gray-300">
              {word.meaning}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-blue-400">
              💬 Example
            </h2>

            <p className="mt-2 text-lg text-gray-300">
              {word.example}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-pink-400">
              📂 Category
            </h2>

            <span className="inline-block mt-3 bg-indigo-600 px-4 py-2 rounded-full">
              {word.category}
            </span>
          </div>

        </div>

      </div>

      <div className="mt-10 text-center">

        <Link
          href="/"
          className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-3 rounded-xl font-bold transition"
        >
          🔍 Search More Words
        </Link>

      </div>

    </div>
  );
}