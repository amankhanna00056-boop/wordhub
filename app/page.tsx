"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
}

export default function Home() {
  const [words, setWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLetter, setSelectedLetter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const wordsPerPage = 20;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedLetter]);

  const loadWords = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "words"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      data.sort((a, b) => a.word.localeCompare(b.word));

      setWords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWords = useMemo(() => {
    let filtered = [...words];

    // Search Filter
    if (search.trim()) {
      const key = search.toLowerCase();

      filtered = filtered.filter(
        (item) =>
          item.word.toLowerCase().includes(key) ||
          item.meaning.toLowerCase().includes(key) ||
          item.category.toLowerCase().includes(key)
      );
    }

    // Category Filter
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (item) =>
          item.category.trim().toLowerCase() ===
          selectedCategory.trim().toLowerCase()
      );
    }

    // Alphabet Filter
    if (selectedLetter !== "All") {
      filtered = filtered.filter((item) =>
        item.word
          .toLowerCase()
          .startsWith(selectedLetter.toLowerCase())
      );
    }

    return filtered;
  }, [words, search, selectedCategory, selectedLetter]);

  const categories = useMemo(() => {
    return [...new Set(
      words
        .map((w) => w.category.trim())
        .filter(Boolean)
        .map(
          (cat) =>
            cat.charAt(0).toUpperCase() +
            cat.slice(1).toLowerCase()
        )
    )].sort();
  }, [words]);

  const latestWords = [...words].slice(-6).reverse();
  const totalPages = Math.ceil(filteredWords.length / wordsPerPage);

  const currentWords = filteredWords.slice(
    (currentPage - 1) * wordsPerPage,
    currentPage * wordsPerPage
  );
  
  // Daily Word (same word for the whole day)
  const dailyWord = useMemo(() => {
    if (words.length === 0) return null;
    const today = new Date();
    const dayNumber =
      today.getFullYear() * 1000 +
      today.getMonth() * 100 +
      today.getDate();
    return words[dayNumber % words.length];
  }, [words]);

  return (
    // 🎨 BACKGROUND: Pehla warga (Slate-900)
    <main className="max-w-7xl mx-auto px-6 py-10 bg-slate-900 min-h-screen">

      {/* HERO */}

      <section className="text-center">

        <h1 className="text-6xl font-extrabold text-yellow-400 tracking-wide">
          📚 WordHub
        </h1>

        <p className="text-blue-300 mt-4 text-xl font-medium tracking-wide">
          Learn English Words Everyday
        </p>

        <div className="flex justify-center gap-4 mt-8 flex-wrap">

          <Link
            href="/daily"
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-semibold text-white transition shadow-lg"
          >
            📅 Daily Word
          </Link>

          <Link
            href="/login"
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-semibold text-white transition shadow-lg"
          >
            🔐 Admin Login
          </Link>

        </div>

      </section>

      {/* WORD OF THE DAY */}

      {dailyWord && (
        <section className="mt-14">
          <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-3xl p-[2px] shadow-xl">
            {/* 🎨 CARD: Slate-900 */}
            <div className="bg-slate-900 rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                <div>
                  <p className="text-yellow-400 font-bold uppercase tracking-widest">
                    📅 Word of the Day
                  </p>
                  <h2 className="text-5xl font-extrabold text-white mt-4">
                    {dailyWord.word}
                  </h2>
                  <p className="text-cyan-100 text-lg mt-5 max-w-2xl">
                    {dailyWord.meaning}
                  </p>
                  <div className="mt-6">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full text-white font-medium shadow-md">
                      {dailyWord.category}
                    </span>
                  </div>
                </div>
                <div>
                  <Link
                    href={`/dictionary/${encodeURIComponent(dailyWord.word)}`}
                    className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 hover:from-amber-500 hover:to-yellow-500 px-8 py-4 rounded-xl font-bold transition shadow-lg"
                  >
                    📖 View Details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SEARCH */}

      <section className="mt-12">

        <input
          type="text"
          placeholder="🔍 Search words..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-slate-800 border border-yellow-400 p-5 text-lg text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
        />

        <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
          <span>
            Showing <b>{filteredWords.length}</b> words
          </span>

          {selectedCategory !== "All" && (
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-yellow-400 hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>

      </section>

      {/* STATS */}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10">

        {/* 🎨 STAT CARDS: Slate-800 */}
        <div className="bg-slate-800 rounded-xl p-6 text-center shadow-md border border-cyan-500/30 hover:border-cyan-400 transition">
          <h3 className="text-cyan-400 font-medium">📚 Total Words</h3>
          <p className="text-3xl font-extrabold text-cyan-300 mt-2">
            {words.length}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 text-center shadow-md border border-blue-500/30 hover:border-blue-400 transition">
          <h3 className="text-blue-400 font-medium">📂 Categories</h3>
          <p className="text-3xl font-extrabold text-blue-300 mt-2">
            {categories.length}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 text-center shadow-md border border-amber-500/30 hover:border-amber-400 transition">
          <h3 className="text-amber-400 font-medium">🔥 Showing</h3>
          <p className="text-3xl font-extrabold text-amber-300 mt-2">
            {filteredWords.length}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 text-center shadow-md border border-rose-500/30 hover:border-rose-400 transition">
          <h3 className="text-rose-400 font-medium">⭐ Latest</h3>
          <p className="text-3xl font-extrabold text-rose-300 mt-2">
            {latestWords.length}
          </p>
        </div>

      </section>

      {/* POPULAR CATEGORIES */}

      <section className="mt-14">

        <h2 className="text-3xl font-bold text-yellow-400 mb-6">
          📂 Categories
        </h2>

        <div className="flex flex-wrap gap-3">

          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-300 border
                ${
                  selectedCategory === cat
                    ? "bg-yellow-400 text-black border-yellow-400"
                    : "bg-slate-800 text-white border-slate-700 hover:bg-slate-700"
                }`}
            >
              {cat}
            </button>
          ))}

        </div>

      </section>

      {/* WORDS */}

      <section className="mt-14">

        <h2 className="text-3xl font-bold text-emerald-400 mb-8">
          📚 Dictionary Words
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {loading ? (
            <div className="col-span-full text-center py-20">
              <h2 className="text-3xl font-bold text-cyan-400">
                Loading words...
              </h2>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <h2 className="text-3xl font-bold text-rose-400">
                No Words Found
              </h2>
              <p className="text-amber-400 mt-3 font-medium">
                Try another search keyword.
              </p>
            </div>
          ) : (
            currentWords.map((item) => (
              // 🎨 WORD CARDS: Slate-800
              <div
                key={item.id}
                className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-yellow-400 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 shadow-md"
              >
                <h3 className="text-3xl font-extrabold text-emerald-400 hover:text-emerald-300 transition">
                  {item.word}
                </h3>

                <p className="mt-4 text-white leading-7">
                  <span className="font-semibold text-amber-400">
                    Meaning:
                  </span>{" "}
                  <span className="font-medium text-white">{item.meaning}</span>
                </p>

                <p className="mt-4 text-cyan-100">
                  <span className="font-semibold text-sky-400">
                    Example:
                  </span>{" "}
                  <span className="font-medium italic text-cyan-100">{item.example}</span>
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full text-sm font-medium text-white shadow-md">
                      {item.category}
                    </span>

                    <Link
                      href={`/dictionary/${item.word.toLowerCase()}`}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-semibold transition shadow-md"
                    >
                      Read More →
                    </Link>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${item.word}\n\n${item.meaning}`
                        )
                      }
                      className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm text-white transition"
                    >
                      📋 Copy
                    </button>

                    <button
                      onClick={() => {
                        const speech = new SpeechSynthesisUtterance(item.word);
                        speech.lang = "en-US";
                        window.speechSynthesis.speak(speech);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm text-white transition"
                    >
                      🔊 Speak
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

        </div>

        {/* Pagination */}
        {!loading && filteredWords.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8 flex-wrap">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 1
                  ? "bg-slate-700 text-gray-500 cursor-not-allowed"
                  : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-600"
              }`}
            >
              ← Previous
            </button>

            <span className="text-white font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === totalPages
                  ? "bg-slate-700 text-gray-500 cursor-not-allowed"
                  : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-600"
              }`}
            >
              Next →
            </button>
          </div>
        )}

      </section>

      {/* LATEST WORDS */}

      <section className="mt-16">

        <h2 className="text-3xl font-bold text-orange-400 mb-6">
          🔥 Latest Words
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

          {latestWords.map((item) => (
            // 🎨 LATEST CARDS: Slate-800
            <div
              key={item.id}
              className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-orange-400 transition shadow-md"
            >
              <h3 className="text-2xl font-extrabold text-emerald-400 hover:text-emerald-300 transition">
                {item.word}
              </h3>

              <p className="mt-2 text-white line-clamp-2 font-medium">
                {item.meaning}
              </p>

              <span className="inline-block mt-4 bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 rounded-full text-sm font-medium text-white shadow-md">
                {item.category}
              </span>
            </div>
          ))}

        </div>

      </section>

      {/* ALPHABET */}

      <section className="mt-16">

        <h2 className="text-3xl font-bold text-cyan-400 mb-6">
          🔤 Browse Alphabet
        </h2>

        <div className="flex flex-wrap gap-3">

          <button
            onClick={() => setSelectedLetter("All")}
            className={`w-12 h-12 rounded-full font-bold transition-all duration-300 ${
              selectedLetter === "All"
                ? "bg-yellow-400 text-black"
                : "bg-slate-800 text-white border border-yellow-400 hover:bg-yellow-400 hover:text-black"
            }`}
          >
            All
          </button>

          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`w-12 h-12 rounded-full font-bold transition-all duration-300 ${
                selectedLetter === letter
                  ? "bg-yellow-400 text-black"
                  : "bg-slate-800 text-white border border-yellow-400 hover:bg-yellow-400 hover:text-black"
              }`}
            >
              {letter}
            </button>
          ))}

        </div>

        {selectedLetter !== "All" && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setSelectedLetter("All")}
              className="text-cyan-400 hover:underline text-sm"
            >
              Clear Alphabet Filter
            </button>
          </div>
        )}

      </section>
{/* PAGINATION */}

{totalPages > 1 && (

  <section className="mt-14 flex justify-center items-center gap-3 flex-wrap">

    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((prev) => prev - 1)}
      className={`px-4 py-2 rounded-lg font-semibold transition ${
        currentPage === 1
          ? "bg-slate-700 text-gray-500 cursor-not-allowed"
          : "bg-slate-800 hover:bg-yellow-400 hover:text-black"
      }`}
    >
      ← Previous
    </button>

    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (

      <button
        key={page}
        onClick={() => setCurrentPage(page)}
        className={`w-10 h-10 rounded-full font-bold transition ${
          currentPage === page
            ? "bg-yellow-400 text-black"
            : "bg-slate-800 hover:bg-slate-700"
        }`}
      >
        {page}
      </button>

    ))}

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((prev) => prev + 1)}
      className={`px-4 py-2 rounded-lg font-semibold transition ${
        currentPage === totalPages
          ? "bg-slate-700 text-gray-500 cursor-not-allowed"
          : "bg-slate-800 hover:bg-yellow-400 hover:text-black"
      }`}
    >
      Next →
    </button>

  </section>

)}
      {/* FOOTER */}

      <footer className="mt-20 border-t border-slate-700 pt-8 text-center">

        <h3 className="text-2xl font-bold text-yellow-400">
          📚 WordHub
        </h3>

        <p className="text-blue-300 mt-3 font-medium">
          Learn English Words Everyday with WordHub.
        </p>

        <p className="text-amber-400/70 mt-6 text-sm font-medium">
          © {new Date().getFullYear()} WordHub. All Rights Reserved.
        </p>

      </footer>

    </main>
  );
}