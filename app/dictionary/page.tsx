"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { StarIcon as SolidStar } from "@heroicons/react/24/solid";
import { StarIcon as OutlineStar } from "@heroicons/react/24/outline";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
}

export default function DictionaryPage() {
  const router = useRouter();

  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [startsWith, setStartsWith] = useState("");
  const [endsWith, setEndsWith] = useState("");
  const [contains, setContains] = useState("");
  const [lengthFilter, setLengthFilter] = useState("");
  
  // Pagination
  const PAGE_SIZE = 50;
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  // Load words on mount
  useEffect(() => {
    loadWords();
  }, []);

  // Filter words when search, favorites filter changes
  useEffect(() => {
    let filtered = words.filter((item) => {
      return (
        item.word.toLowerCase().includes(search.toLowerCase()) ||
        item.meaning.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
      );
    });

    // Apply favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((item) => favorites.includes(item.word));
    }

    // Starts With Filter
    if (startsWith.trim()) {
      filtered = filtered.filter((item) =>
        item.word.toLowerCase().startsWith(startsWith.toLowerCase())
      );
    }

    // Ends With Filter
    if (endsWith.trim()) {
      filtered = filtered.filter((item) =>
        item.word.toLowerCase().endsWith(endsWith.toLowerCase())
      );
    }

    // Contains Filter
    if (contains.trim()) {
      filtered = filtered.filter((item) =>
        item.word.toLowerCase().includes(contains.toLowerCase())
      );
    }

    // Exact Length Filter
    if (lengthFilter) {
      filtered = filtered.filter(
        (item) => item.word.length === Number(lengthFilter)
      );
    }

    setFilteredWords(filtered);
  }, [
    search,
    words,
    favorites,
    showFavoritesOnly,
    startsWith,
    endsWith,
    contains,
    lengthFilter,
  ]);

  // ✅ FIX 1: loadWords function - duplicate code removed
  const loadWords = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "words"),
        orderBy("word"),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      setWords(data);
      setFilteredWords(data);

      if (snapshot.docs.length > 0) {
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // ✅ FIX 2: nextPage function - missing closing brace fixed
  const nextPage = async () => {
    if (!lastDoc) return;

    setLoadingMore(true);

    try {
      const q = query(
        collection(db, "words"),
        orderBy("word"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      setWords(data);
      setFilteredWords(data);

      if (snapshot.docs.length > 0) {
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setPage((p) => p + 1);
      }
    } catch (err) {
      console.error("Error loading next page:", err);
    }

    setLoadingMore(false);
  };

  const toggleFavorite = (word: string) => {
    console.log("Clicked:", word);

    let updated: string[];

    if (favorites.includes(word)) {
      updated = favorites.filter((w) => w !== word);
    } else {
      updated = [...favorites, word];
    }

    console.log(updated);

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white py-10 px-5">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h1 className="text-6xl font-extrabold text-center text-yellow-400 tracking-wide">
          📚 WordHub Dictionary
        </h1>

        {/* Subtitle */}
        <p className="text-center text-gray-400 mt-3 text-lg font-medium">
          Search thousands of English words instantly.
        </p>

        {/* Search Input */}
        <input
          type="text"
          placeholder="🔍 Search word..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          className="w-full mt-8 p-5 rounded-lg bg-slate-800 border border-slate-700 text-lg font-medium placeholder:text-gray-500 focus:text-white"
        />

        {/* Advanced Filters */}
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <input
            placeholder="Starts With"
            value={startsWith}
            onChange={(e) => setStartsWith(e.target.value)}
            className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-gray-500"
          />

          <input
            placeholder="Ends With"
            value={endsWith}
            onChange={(e) => setEndsWith(e.target.value)}
            className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-gray-500"
          />

          <input
            placeholder="Contains"
            value={contains}
            onChange={(e) => setContains(e.target.value)}
            className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-gray-500"
          />

          <input
            type="number"
            placeholder="Length"
            value={lengthFilter}
            onChange={(e) => setLengthFilter(e.target.value)}
            className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Stats & Filters */}
        <div className="mt-6 flex flex-wrap justify-between items-center gap-4">
          <div className="text-gray-400 text-base font-medium">
            Showing <b className="text-yellow-400 text-lg">{filteredWords.length}</b> of{" "}
            <b className="text-yellow-400 text-lg">{words.length}</b> words
          </div>

          <div className="flex items-center gap-4">
            {/* Favorites Count */}
            <span className="text-yellow-400 text-sm font-medium">
              ⭐ {favorites.length} favorites
            </span>

            {/* Favorites Filter Button */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                showFavoritesOnly
                  ? "bg-yellow-400 text-slate-900"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              {showFavoritesOnly ? "⭐ All Words" : "☆ Favorites Only"}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center mt-10 text-2xl font-semibold text-gray-300">
            Loading words...
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center mt-10 text-gray-400 text-xl font-medium">
            {showFavoritesOnly ? "No favorites added yet. ⭐" : "No words found."}
          </div>
        ) : (
          // Words Grid
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {filteredWords.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 rounded-xl p-6 shadow-lg hover:bg-slate-700 transition duration-300"
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
                <div className="mt-6 flex items-center justify-between">
                  {/* Favorite Button */}
                  <button
                    onClick={() => toggleFavorite(item.word)}
                    className="p-2 rounded-full hover:bg-slate-700 transition"
                  >
                    {favorites.includes(item.word) ? (
                      <SolidStar className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <OutlineStar className="w-6 h-6 text-gray-400 hover:text-yellow-400" />
                    )}
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
        
        {/* Next Page Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={nextPage}
            disabled={loadingMore}
            className="bg-green-500 hover:bg-green-600 px-8 py-3 rounded-lg font-bold disabled:bg-gray-500 disabled:cursor-not-allowed transition"
          >
            {loadingMore ? "Loading..." : "Next Page →"}
          </button>
        </div>
      </div>
    </main>
  );
}