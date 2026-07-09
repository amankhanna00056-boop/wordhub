"use client";

import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AddWordPage() {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [category, setCategory] = useState("");

  const saveWord = async () => {
    if (!word || !meaning) {
      alert("Please fill required fields");
      return;
    }

    try {
      await addDoc(collection(db, "words"), {
        word,
        meaning,
        example,
        category,
        createdAt: serverTimestamp(),
      });

      alert("Word Saved Successfully!");

      setWord("");
      setMeaning("");
      setExample("");
      setCategory("");

    } catch (error) {
      console.error(error);
      alert("Error saving word");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-xl w-[450px]">
        <h1 className="text-4xl font-bold text-yellow-400 text-center mb-8">
          Add New Word
        </h1>

        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="English Word"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white"
        />

        <input
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="Meaning"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white"
        />

        <input
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="Example Sentence"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white"
        />

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="w-full p-3 mb-6 rounded bg-slate-700 text-white"
        />

        <button
          onClick={saveWord}
          className="w-full bg-green-500 hover:bg-green-600 py-3 rounded font-bold"
        >
          Save Word
        </button>
      </div>
    </main>
  );
}