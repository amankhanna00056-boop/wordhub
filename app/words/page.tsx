"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
}

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    const snapshot = await getDocs(collection(db, "words"));

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Word, "id">),
    }));

    setWords(data);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
        📚 All Words
      </h1>

      {words.length === 0 ? (
        <p className="text-gray-400">No words found.</p>
      ) : (
        <div className="space-y-4">
          {words.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800 p-5 rounded-xl shadow"
            >
              <h2 className="text-2xl font-bold text-green-400">
                {item.word}
              </h2>

              <p className="mt-2">
                <b>Meaning:</b> {item.meaning}
              </p>

              <p className="mt-2">
                <b>Example:</b> {item.example}
              </p>

              <p className="mt-2">
                <b>Category:</b> {item.category}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}