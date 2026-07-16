"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function UnscramblerPage() {
  const [letters, setLetters] = useState("");
  const [allWords, setAllWords] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setLoading(true);

    try {
      const snapshot = await getDocs(collection(db, "words"));

      const data = snapshot.docs.map((doc) => {
        const word = doc.data().word;
        return typeof word === "string" ? word.toLowerCase() : "";
      });

      setAllWords(data.filter(Boolean));
    } catch (error) {
      console.error("Error loading words:", error);
    } finally {
      setLoading(false);
    }
  };

  const unscrambleWords = () => {
    if (!letters.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const sortedLetters = letters
      .toLowerCase()
      .split("")
      .sort()
      .join("");

    const matched = allWords.filter((word) => {
      const sortedWord = word
        .toLowerCase()
        .split("")
        .sort()
        .join("");

      return sortedWord === sortedLetters;
    });

    setResults(matched);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-yellow-400 text-center">
          🔤 Word Unscrambler
        </h1>

        <p className="text-center text-gray-400 mt-4 text-lg">
          Enter scrambled letters and find all possible words.
        </p>

        <div className="mt-10">
          <input
            type="text"
            value={letters}
            onChange={(e) => setLetters(e.target.value)}
            placeholder="Example: aetlp"
            className="w-full p-5 rounded-xl bg-slate-800 border border-slate-700 text-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <button
            onClick={unscrambleWords}
            disabled={loading || !letters.trim()}
            className="w-full mt-6 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-xl transition"
          >
            {loading ? "⏳ Finding..." : "🔍 Find Words"}
          </button>
        </div>

        <div className="mt-10 bg-slate-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-yellow-400">
            Results {results.length > 0 && `(${results.length})`}
          </h2>

          {loading ? (
            <p className="text-gray-400 mt-4">Searching words...</p>
          ) : results.length === 0 ? (
            <p className="text-gray-400 mt-4">
              {letters.trim()
                ? "No words found with these letters."
                : "No results yet."}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {results.map((word, index) => (
                <div
                  key={index}
                  className="bg-slate-700 px-4 py-3 rounded-lg text-center hover:bg-slate-600 transition"
                >
                  <span className="text-lg font-medium text-green-400">
                    {word}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}