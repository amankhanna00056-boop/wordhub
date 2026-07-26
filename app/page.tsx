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

  // Emoji list for categories
  const categoryEmojis = ["📚", "🧠", "🌎", "💼", "🎓", "🚀", "❤️", "🏠", "⚡", "🎯", "📖", "🔥"];

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 bg-slate-900 min-h-screen">

      {/* ============================================================
          🧭 HERO V2
          ============================================================ */}
      <section className="text-center pt-10">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-wide">
          <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            📚 WordHub
          </span>
        </h1>

        <p className="text-2xl md:text-3xl font-bold text-white mt-6">
          Master English Vocabulary
        </p>

        <p className="text-gray-300 mt-4 text-lg max-w-2xl mx-auto">
          Discover meanings, improve spelling,
          and grow your vocabulary with WordHub.
        </p>

        <div className="flex justify-center gap-4 mt-8 flex-wrap">
          <Link
            href="/daily"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105 transition px-8 py-3 rounded-xl font-bold text-white shadow-lg cursor-pointer"
          >
            🔥 Daily Word
          </Link>

          <Link
            href="/login"
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:scale-105 transition px-8 py-3 rounded-xl font-bold text-white shadow-lg cursor-pointer"
          >
            🚀 Start Learning
          </Link>
        </div>
      </section>

      {/* ============================================================
          🔍 SEARCH SECTION
          ============================================================ */}
      <section className="mt-12">
        <h2 className="text-3xl font-bold text-yellow-400 mb-5 text-center">
          🔍 Search Dictionary
        </h2>

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
              className="text-yellow-400 hover:underline cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </section>

      {/* ============================================================
          📊 STATS V2
          ============================================================ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-12">
        <div className="bg-slate-800 rounded-2xl p-6 text-center border border-yellow-400/30">
          <h3 className="text-yellow-400 font-bold">📚 Words</h3>
          <p className="text-3xl font-extrabold text-white mt-2">
            {words.length.toLocaleString()}+
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 text-center border border-green-400/30">
          <h3 className="text-green-400 font-bold">🎮 Games</h3>
          <p className="text-3xl font-extrabold text-white mt-2">3+</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 text-center border border-orange-400/30">
          <h3 className="text-orange-400 font-bold">🔥 Daily Word</h3>
          <p className="text-3xl font-extrabold text-white mt-2">365</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 text-center border border-purple-400/30">
          <h3 className="text-purple-400 font-bold">⭐ Free</h3>
          <p className="text-3xl font-extrabold text-white mt-2">Forever</p>
        </div>
      </section>

      {/* ============================================================
          📅 WORD OF THE DAY
          ============================================================ */}
      {dailyWord && (
        <section className="mt-14">
          <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-3xl p-[2px] shadow-xl">
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
                    className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 hover:from-amber-500 hover:to-yellow-500 px-8 py-4 rounded-xl font-bold transition shadow-lg cursor-pointer"
                  >
                    📖 View Details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          🎮 FEATURED GAMES
          ============================================================ */}
      <section className="mt-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-400 mb-3">
          🎮 Featured Games
        </h2>

        <p className="text-gray-300 mb-8">
          Improve your vocabulary with fun and interactive games.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Unscramble */}
          <div className="bg-slate-800 rounded-3xl p-7 border border-green-400/30 hover:-translate-y-2 transition shadow-xl cursor-pointer">
            <h3 className="text-2xl font-bold text-green-400">
              🟢 Word Scramble
            </h3>
            <p className="text-gray-300 mt-4">
              Unscramble letters and discover the hidden word.
            </p>
            <Link
              href="/games/scramble"
              className="inline-block mt-6 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-bold text-white transition cursor-pointer"
            >
              Play Now →
            </Link>
          </div>

          {/* Daily Challenge */}
          <div className="bg-slate-800 rounded-3xl p-7 border border-purple-400/30 hover:-translate-y-2 transition shadow-xl cursor-pointer">
            <h3 className="text-2xl font-bold text-purple-400">
              🟣 Daily Challenge
            </h3>
            <p className="text-gray-300 mt-4">
              Complete a new vocabulary challenge every day.
            </p>
            <Link
              href="/daily"
              className="inline-block mt-6 bg-purple-500 hover:bg-purple-600 px-6 py-3 rounded-xl font-bold text-white transition cursor-pointer"
            >
              Start Challenge →
            </Link>
          </div>

          {/* Practice Mode */}
          <div className="bg-slate-800 rounded-3xl p-7 border border-blue-400/30 hover:-translate-y-2 transition shadow-xl cursor-pointer">
            <h3 className="text-2xl font-bold text-blue-400">
              🔵 Practice Mode
            </h3>
            <p className="text-gray-300 mt-4">
              Practice unlimited words and improve your skills.
            </p>
            <Link
              href="/practice"
              className="inline-block mt-6 bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-xl font-bold text-white transition cursor-pointer"
            >
              Practice Now →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          📂 CATEGORIES V2
          ============================================================ */}
      <section className="mt-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-400 mb-3">
          📂 Browse Categories
        </h2>

        <p className="text-gray-300 mb-8">
          Explore words by different topics and categories.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {["All", ...categories].slice(0, 12).map((cat, index) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`p-6 rounded-2xl text-center transition-all duration-300 border cursor-pointer
                ${
                  selectedCategory === cat
                    ? "bg-yellow-400 text-black border-yellow-400 scale-105"
                    : "bg-slate-800 text-white border-slate-700 hover:-translate-y-1 hover:border-yellow-400"
                }
              `}
            >
              <div className="text-3xl mb-3">
                {categoryEmojis[index % categoryEmojis.length]}
              </div>
              <h3 className="font-bold">{cat}</h3>
            </button>
          ))}
        </div>
      </section>

      {/* ============================================================
          📚 EXPLORE DICTIONARY
          ============================================================ */}
      <section className="mt-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-400 mb-3">
          📚 Explore Dictionary
        </h2>

        <p className="text-gray-300 mb-8">
          Discover meanings, examples and pronunciation of English words.
        </p>

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
              <div
                key={item.id}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-slate-700 hover:border-yellow-400 hover:-translate-y-2 transition-all duration-300 shadow-xl cursor-pointer"
              >
                <Link href={`/dictionary/${item.word.toLowerCase()}`}>
                  <h3 className="text-3xl font-extrabold text-emerald-400 hover:text-emerald-300 transition">
                    {item.word}
                  </h3>
                </Link>

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
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-semibold transition shadow-md cursor-pointer"
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
                      className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg text-sm text-white transition cursor-pointer"
                    >
                      📋 Copy
                    </button>

                    <button
                      onClick={() => {
                        const speech = new SpeechSynthesisUtterance(item.word);
                        speech.lang = "en-US";
                        window.speechSynthesis.speak(speech);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm text-white transition cursor-pointer"
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
              className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
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
              className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer ${
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

      {/* ============================================================
          🔥 LATEST WORDS V2 - UPDATED
          ============================================================ */}
      <section className="mt-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-orange-400 mb-3">
          🔥 Latest Words
        </h2>

        <p className="text-gray-300 mb-8">
          Recently added vocabulary words from WordHub dictionary.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {latestWords.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800 rounded-3xl p-6 border border-slate-700 hover:border-orange-400 hover:-translate-y-2 transition-all duration-300 shadow-xl cursor-pointer"
            >
              <Link href={`/dictionary/${item.word.toLowerCase()}`}>
                <h3 className="text-3xl font-extrabold text-emerald-400 hover:text-emerald-300 transition">
                  {item.word}
                </h3>
              </Link>

              <p className="text-gray-300 mt-4 line-clamp-3">
                {item.meaning}
              </p>

              <div className="mt-5 flex justify-between items-center">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-full text-sm text-white font-bold">
                  {item.category}
                </span>

                <Link
                  href={`/dictionary/${item.word.toLowerCase()}`}
                  className="text-yellow-400 font-bold hover:underline cursor-pointer"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          ⭐ WHY CHOOSE WORDHUB - NEW
          ============================================================ */}
      <section className="mt-20">
        <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-400 text-center mb-10">
          ⭐ Why Choose WordHub?
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-slate-800 p-6 rounded-3xl text-center hover:-translate-y-2 transition cursor-pointer">
            <h3 className="text-3xl">📚</h3>
            <p className="text-white font-bold mt-3">Huge Dictionary</p>
            <p className="text-gray-400 mt-2">Thousands of useful English words.</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-3xl text-center hover:-translate-y-2 transition cursor-pointer">
            <h3 className="text-3xl">🎮</h3>
            <p className="text-white font-bold mt-3">Fun Learning</p>
            <p className="text-gray-400 mt-2">Learn through vocabulary games.</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-3xl text-center hover:-translate-y-2 transition cursor-pointer">
            <h3 className="text-3xl">🔥</h3>
            <p className="text-white font-bold mt-3">Daily Practice</p>
            <p className="text-gray-400 mt-2">New words every day.</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-3xl text-center hover:-translate-y-2 transition cursor-pointer">
            <h3 className="text-3xl">⭐</h3>
            <p className="text-white font-bold mt-3">Free Forever</p>
            <p className="text-gray-400 mt-2">Learning without limits.</p>
          </div>
        </div>
      </section>

      {/* ============================================================
          🔤 ALPHABET
          ============================================================ */}
      <section className="mt-16">
        <h2 className="text-3xl font-bold text-cyan-400 mb-6">
          🔤 Browse Alphabet
        </h2>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedLetter("All")}
            className={`w-12 h-12 rounded-full font-bold transition-all duration-300 cursor-pointer ${
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
              className={`w-12 h-12 rounded-full font-bold transition-all duration-300 cursor-pointer ${
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
              className="text-cyan-400 hover:underline text-sm cursor-pointer"
            >
              Clear Alphabet Filter
            </button>
          </div>
        )}
      </section>

      {/* ============================================================
          📌 FOOTER - UPDATED
          ============================================================ */}
      <footer className="mt-20 border-t border-slate-700 pt-10 pb-5 text-center">
        <h3 className="text-3xl font-extrabold text-yellow-400">
          📚 WordHub
        </h3>

        <p className="text-gray-300 mt-3">
          Master English vocabulary with dictionary and games.
        </p>

        <div className="flex justify-center gap-6 mt-6 text-gray-400">
          <Link href="/" className="hover:text-yellow-400 transition cursor-pointer">
            Home
          </Link>

          <Link href="/daily" className="hover:text-yellow-400 transition cursor-pointer">
            Daily Word
          </Link>

          <Link href="/login" className="hover:text-yellow-400 transition cursor-pointer">
            Admin
          </Link>
        </div>

        <p className="text-gray-500 mt-8 text-sm">
          © {new Date().getFullYear()} WordHub. All Rights Reserved.
        </p>
      </footer>

    </main>
  );
}