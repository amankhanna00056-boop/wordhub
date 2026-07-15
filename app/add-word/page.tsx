"use client";

import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function createSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export default function AddWordPage() {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [category, setCategory] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [synonyms, setSynonyms] = useState("");
  const [antonyms, setAntonyms] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [loading, setLoading] = useState(false);

  const saveWord = async () => {
    if (!word.trim() || !meaning.trim()) {
      alert("Please fill required fields");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "words"), {
        word: word.trim(),
        slug: createSlug(word),
        meaning: meaning.trim(),
        example: example.trim(),
        category: category.trim(),
        partOfSpeech: partOfSpeech.trim(),
        pronunciation: pronunciation.trim(),
        synonyms: synonyms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        antonyms: antonyms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        difficulty,
        createdAt: serverTimestamp(),
      });

      alert("✅ Word Saved Successfully!");

      setWord("");
      setMeaning("");
      setExample("");
      setCategory("");
      setPartOfSpeech("");
      setPronunciation("");
      setSynonyms("");
      setAntonyms("");
      setDifficulty("Easy");
    } catch (error) {
      console.error(error);
      alert("Error saving word");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 rounded-xl shadow-xl p-8 w-full max-w-xl">

        <h1 className="text-3xl font-bold text-yellow-400 mb-8">
          Add New Word
        </h1>

        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="English Word"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white outline-none"
        />

        <input
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="Meaning"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white outline-none"
        />

        <input
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="Example Sentence"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white outline-none"
        />

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white outline-none"
        />

        <input
          value={partOfSpeech}
          onChange={(e) => setPartOfSpeech(e.target.value)}
          placeholder="Part of Speech (Noun, Verb, Adjective...)"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white outline-none"
        />

        <input
          value={pronunciation}
          onChange={(e) => setPronunciation(e.target.value)}
          placeholder="Pronunciation (Example: /ˈæpəl/)"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white outline-none"
        />

        <input
          value={synonyms}
          onChange={(e) => setSynonyms(e.target.value)}
          placeholder="Synonyms (comma separated)"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white outline-none"
        />

        <input
          value={antonyms}
          onChange={(e) => setAntonyms(e.target.value)}
          placeholder="Antonyms (comma separated)"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white outline-none"
        />

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full p-3 mb-6 rounded bg-slate-700 text-white outline-none"
        >
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>

        <button
          disabled={loading}
          onClick={saveWord}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 py-3 rounded-lg font-bold transition"
        >
          {loading ? "Saving..." : "Save Word"}
        </button>
      </div>
    </main>
  );
}