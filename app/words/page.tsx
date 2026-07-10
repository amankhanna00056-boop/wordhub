"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
}

export default function WordsPage() {
  const router = useRouter();

  const [words, setWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    const snapshot = await getDocs(collection(db, "words"));

    const data = snapshot.docs.map((document) => ({
      id: document.id,
      ...(document.data() as Omit<Word, "id">),
    }));

    setWords(data);
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("Are you sure you want to delete this word?");

    if (!ok) return;

    try {
      await deleteDoc(doc(db, "words", id));

      alert("Word Deleted Successfully!");

      loadWords();
    } catch (error) {
      console.error(error);
      alert("Delete Failed");
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
    <main className="min-h-screen bg-slate-900 text-white p-8">

      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
        📚 All Words
      </h1>

      <input
        type="text"
        placeholder="🔍 Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-8 p-4 rounded-lg bg-slate-800 border border-slate-700"
      />

      {filteredWords.length === 0 ? (
        <p className="text-gray-400">No words found.</p>
      ) : (
        <div className="space-y-5">

          {filteredWords.map((item) => (

            <div
              key={item.id}
              className="bg-slate-800 rounded-xl p-6 shadow-lg"
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

              <div className="flex gap-3 mt-5">

                <button
                  onClick={() => router.push(`/edit-word/${item.id}`)}
                  className="bg-yellow-500 hover:bg-yellow-600 px-5 py-2 rounded-lg font-bold"
                >
                  ✏️ Edit
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg font-bold"
                >
                  🗑 Delete
                </button>

              </div>

            </div>

          ))}

        </div>
      )}

    </main>
  );
}