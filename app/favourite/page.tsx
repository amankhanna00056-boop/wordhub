"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../firebase";
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

export default function FavoritesPage() {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteWords, setFavoriteWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  // Load all words
  useEffect(() => {
    loadWords();
  }, []);

  // Filter favorite words when words or favorites change
  useEffect(() => {
    const favWords = words.filter((word) => favorites.includes(word.word));
    setFavoriteWords(favWords);
  }, [words, favorites]);

  const loadWords = async () => {
    try {
      const snapshot = await getDocs(collection(db, "words"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));
      setWords(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const toggleFavorite = (word: string) => {
    let updated: string[];
    if (favorites.includes(word)) {
      updated = favorites.filter((w) => w !== word);
    } else {
      updated = [...favorites, word];
    }
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white py-10 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h1 className="text-6xl font-extrabold text-center text-yellow-400 tracking-wide">
          ⭐ My Favorite Words
        </h1>

        {/* Subtitle */}
        <p className="text-center text-gray-400 mt-3 text-lg font-medium">
          All your saved favorite words in one place.
        </p>

        {/* Stats */}
        <div className="mt-6 text-gray-400 text-base font-medium">
          Total Favorites: <b className="text-yellow-400 text-lg">{favoriteWords.length}</b>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center mt-10 text-2xl font-semibold text-gray-300">
            Loading favorites...
          </div>
        ) : favoriteWords.length === 0 ? (
          <div className="text-center mt-20">
            <h2 className="text-4xl font-bold text-gray-400">⭐ No Favorites Yet</h2>
            <p className="text-gray-500 mt-4 text-lg">
              Start adding words to your favorites from the{" "}
              <button
                onClick={() => router.push("/dictionary")}
                className="text-yellow-400 hover:underline"
              >
                Dictionary
              </button>
            </p>
          </div>
        ) : (
          // Words Grid
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {favoriteWords.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 rounded-xl p-6 shadow-lg hover:bg-slate-700 transition duration-300 border border-yellow-400/30"
              >
                {/* Word Title */}
                <h2
                  onClick={() =>
                    router.push(`/dictionary/${encodeURIComponent(item.word)}`)
                  }
                  className="text-3xl font-extrabold text-green-400 cursor-pointer hover:text-yellow-400 transition"
                >
                  {item.word}
                </h2>

                {/* Meaning */}
                <p className="mt-4 text-base">
                  <span className="font-bold text-yellow-300 text-lg">
                    Meaning:
                  </span>
                  <br />
                  <span className="text-gray-200 font-medium">
                    {item.meaning}
                  </span>
                </p>

                {/* Example */}
                <p className="mt-4 text-base">
                  <span className="font-bold text-yellow-300 text-lg">
                    Example:
                  </span>
                  <br />
                  <span className="text-gray-300 font-medium">
                    {item.example || "No example available"}
                  </span>
                </p>

                {/* Bottom Section */}
                <div className="flex justify-between items-center mt-6">
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(item.word)}
                    className="text-2xl hover:scale-110 transition"
                  >
                    {favorites.includes(item.word) ? "⭐" : "☆"}
                  </button>

                  {/* Category */}
                  <span className="bg-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
                    {item.category}
                  </span>

                  {/* View Button */}
                  <button
                    onClick={() =>
                      router.push(`/dictionary/${encodeURIComponent(item.word)}`)
                    }
                    className="bg-green-500 hover:bg-green-600 px-5 py-2.5 rounded-lg font-bold text-base transition"
                  >
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}