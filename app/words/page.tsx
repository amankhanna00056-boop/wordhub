"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // ✅ Link import kitta
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
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("A-Z");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "words"));
      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...(document.data() as Omit<Word, "id">),
      }));
      setWords(data);
    } catch (error) {
      console.error("Error loading words:", error);
      alert("Failed to load words. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = confirm("Are you sure you want to delete this word?");
    if (!ok) return;

    try {
      setDeletingId(id);
      await deleteDoc(doc(db, "words", id));
      alert("✅ Word Deleted Successfully!");
      await loadWords();
    } catch (error) {
      console.error("Delete error:", error);
      alert("❌ Delete Failed. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const categories = [
    "All",
    ...Array.from(new Set(words.map((item) => item.category).filter(Boolean))),
  ];

  const filteredWords = words
    .filter((item) => {
      const key = search.toLowerCase();
      const matchesSearch =
        item.word.toLowerCase().includes(key) ||
        item.meaning.toLowerCase().includes(key) ||
        item.category.toLowerCase().includes(key);

      const matchesCategory =
        category === "All" || item.category === category;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "A-Z") {
        return a.word.localeCompare(b.word);
      }
      if (sortBy === "Z-A") {
        return b.word.localeCompare(a.word);
      }
      return 0;
    });

  return (
    <main className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation Links */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-yellow-400">
              📚 All Words
            </h1>
            
            {/* ✅ Navigation Links using Link */}
            <nav className="flex gap-2">
              <Link
                href="/"
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm transition duration-200"
              >
                🏠 Home
              </Link>
              <Link
                href="/daily"
                className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm transition duration-200"
              >
                📅 Daily
              </Link>
            </nav>
          </div>

          <div className="flex gap-3">
            {/* ✅ Add Word Link */}
            <Link
              href="/add-word"
              className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-bold transition duration-200"
            >
              ➕ Add New Word
            </Link>
            
            {/* ✅ Admin Login Link */}
            <Link
              href="/login"
              className="bg-purple-500 hover:bg-purple-600 px-6 py-3 rounded-lg font-bold transition duration-200"
            >
              🔐 Admin
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <input
            type="text"
            placeholder="🔍 Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-4 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-4 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-4 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          >
            <option value="A-Z">A-Z</option>
            <option value="Z-A">Z-A</option>
          </select>
        </div>

        {/* Words List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
            <p className="text-gray-400 mt-4 text-lg">Loading words...</p>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl">
              {search || category !== "All"
                ? "🔍 No matching words found"
                : "📖 No words available. Add your first word!"}
            </p>
            {search || category !== "All" ? (
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="mt-4 text-yellow-400 hover:underline"
              >
                Clear filters
              </button>
            ) : (
              <Link
                href="/add-word"
                className="inline-block mt-4 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-bold transition"
              >
                ➕ Add First Word
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Showing {filteredWords.length} word{filteredWords.length > 1 ? "s" : ""}
            </p>

            {filteredWords.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-2xl hover:bg-slate-700/50 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-green-400">
                      {item.word}
                    </h2>

                    <p className="mt-2 text-gray-300">
                      <span className="font-bold text-yellow-400">Meaning:</span>{" "}
                      {item.meaning}
                    </p>

                    <p className="mt-2 text-gray-300">
                      <span className="font-bold text-blue-400">Example:</span>{" "}
                      {item.example}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-bold text-gray-400">Category:</span>
                      <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4 md:mt-0 md:ml-4">
                    {/* ✅ Edit button using Link */}
                    <Link
                      href={`/edit-word/${item.id}`}
                      className="bg-yellow-500 hover:bg-yellow-600 px-5 py-2 rounded-lg font-bold transition duration-200 inline-flex items-center"
                    >
                      ✏️ Edit
                    </Link>

                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className={`bg-red-500 hover:bg-red-600 px-5 py-2 rounded-lg font-bold transition duration-200 ${
                        deletingId === item.id ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {deletingId === item.id ? "⏳ Deleting..." : "🗑 Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}