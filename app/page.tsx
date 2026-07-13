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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, []);

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
    const key = search.toLowerCase().trim();

    if (!key) return words;

    return words.filter(
      (item) =>
        item.word.toLowerCase().includes(key) ||
        item.meaning.toLowerCase().includes(key) ||
        item.category.toLowerCase().includes(key)
    );
  }, [words, search]);

  const categories = [...new Set(words.map((w) => w.category))];

  const latestWords = [...words].slice(-6).reverse();
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
    <main className="max-w-7xl mx-auto px-6 py-10">

      {/* HERO */}

      <section className="text-center">


        <h1 className="text-6xl font-extrabold text-yellow-400 tracking-wide">
          📚 WordHub
        </h1>

        <p className="text-gray-300 mt-4 text-xl font-medium tracking-wide">
          Learn English Words Everyday
        </p>

        <div className="flex justify-center gap-4 mt-8 flex-wrap">

          <Link
            href="/daily"
            className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-xl font-semibold transition"
          >
            📅 Daily Word
          </Link>

          <Link
            href="/login"
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-semibold transition"
          >
            🔐 Admin Login
          </Link>

        </div>

      </section>
{/* WORD OF THE DAY */}

{dailyWord && (

  <section className="mt-14">

    <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-3xl p-[2px]">

      <div className="bg-slate-900 rounded-3xl p-8">

        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">

          <div>

            <p className="text-yellow-400 font-bold uppercase tracking-widest">
              📅 Word of the Day
            </p>

            <h2 className="text-5xl font-extrabold text-white mt-4">
              {dailyWord.word}
            </h2>

            <p className="text-gray-300 text-lg mt-5 max-w-2xl">
              {dailyWord.meaning}
            </p>

            <div className="mt-6">

              <span className="bg-blue-600 px-4 py-2 rounded-full">
                {dailyWord.category}
              </span>

            </div>

          </div>

          <div>

            <Link
              href={`/dictionary/${encodeURIComponent(dailyWord.word)}`}
              className="bg-white text-black hover:bg-yellow-300 px-8 py-4 rounded-xl font-bold transition"
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

      </section>

      {/* STATS */}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10">

        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <h3 className="text-gray-400 font-medium">📚 Total Words</h3>

          <p className="text-3xl font-extrabold text-green-400 mt-2">
            {words.length}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <h3 className="text-gray-400 font-medium">📂 Categories</h3>

          <p className="text-3xl font-extrabold text-blue-400 mt-2">
            {categories.length}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <h3 className="text-gray-400 font-medium">🔥 Showing</h3>

          <p className="text-3xl font-extrabold text-yellow-400 mt-2">
            {filteredWords.length}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <h3 className="text-gray-400 font-medium">⭐ Latest</h3>

          <p className="text-3xl font-extrabold text-pink-400 mt-2">
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

          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/category/${encodeURIComponent(cat)}`}
              className="px-5 py-2 rounded-full bg-slate-800 border border-yellow-400 hover:bg-yellow-400 hover:text-black transition font-semibold text-white"
            >
              {cat}
            </Link>
          ))}

        </div>

      </section>

      {/* WORDS */}

      <section className="mt-14">

        <h2 className="text-3xl font-bold text-green-400 mb-8">
          📚 Dictionary Words
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {loading ? (
            <div className="col-span-full text-center py-20">
              <h2 className="text-3xl font-bold text-gray-400">
                Loading words...
              </h2>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <h2 className="text-3xl font-bold text-gray-400">
                No Words Found
              </h2>

              <p className="text-gray-500 mt-3 font-medium">
                Try another search keyword.
              </p>
            </div>
          ) : (
            filteredWords.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-yellow-400 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                {/* 🎨 FIXED: Word Title - Bright Green (Visible) */}
                <h3 className="text-3xl font-extrabold text-green-400 hover:text-green-300 transition">
                  {item.word}
                </h3>

                {/* 🎨 FIXED: Meaning - Yellow Label, White Text */}
                <p className="mt-4 text-gray-200 leading-7">
                  <span className="font-semibold text-yellow-400">
                    Meaning:
                  </span>{" "}
                  <span className="font-medium text-white">{item.meaning}</span>
                </p>

                {/* 🎨 FIXED: Example - Blue Label, Light Text */}
                <p className="mt-4 text-gray-300">
                  <span className="font-semibold text-blue-400">
                    Example:
                  </span>{" "}
                  <span className="font-medium italic text-gray-200">{item.example}</span>
                </p>

                <div className="mt-6 flex justify-between items-center">

                  {/* 🎨 FIXED: Category Tag - Bright Blue (Visible) */}
                  <span className="bg-blue-600 px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg shadow-blue-600/20">
                    {item.category}
                  </span>

                  {/* 🎨 FIXED: Read More - Bright Yellow (Visible) */}
                  <Link
                    href={`/word/${item.word.toLowerCase()}`}
                    className="bg-yellow-400 text-black px-5 py-2.5 rounded-lg font-semibold hover:bg-yellow-300 transition shadow-lg hover:shadow-yellow-400/30"
                  >
                    Read More →
                  </Link>

                </div>
              </div>
            ))
          )}

        </div>

      </section>

      {/* LATEST WORDS */}

      <section className="mt-16">

        <h2 className="text-3xl font-bold text-orange-400 mb-6">
          🔥 Latest Words
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

          {latestWords.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-orange-400/50 transition"
            >
              {/* 🎨 FIXED: Latest Word - Bright Green */}
              <h3 className="text-2xl font-extrabold text-green-400 hover:text-green-300 transition">
                {item.word}
              </h3>

              {/* 🎨 FIXED: Latest Meaning - White Text */}
              <p className="mt-2 text-gray-200 line-clamp-2 font-medium">
                {item.meaning}
              </p>

              {/* 🎨 FIXED: Latest Category - Bright Purple */}
              <span className="inline-block mt-4 bg-indigo-600 px-3 py-1 rounded-full text-sm font-medium text-white shadow-lg shadow-indigo-600/20">
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

          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
            <button
              key={letter}
              className="w-12 h-12 rounded-full bg-slate-800 text-white border border-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300 font-bold cursor-pointer"
            >
              {letter}
            </button>
          ))}

        </div>

      </section>

      {/* FOOTER */}

      <footer className="mt-20 border-t border-slate-700 pt-8 text-center">

        <h3 className="text-2xl font-bold text-yellow-400">
          📚 WordHub
        </h3>

        <p className="text-gray-400 mt-3 font-medium">
          Learn English Words Everyday with WordHub.
        </p>

        <p className="text-gray-500 mt-6 text-sm font-medium">
          © {new Date().getFullYear()} WordHub. All Rights Reserved.
        </p>

      </footer>

    </main>
  );
}