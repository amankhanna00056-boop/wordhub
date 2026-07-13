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

export default function DictionaryPage() {
  const router = useRouter();

  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, []);

  useEffect(() => {
    const keyword = search.toLowerCase();

    const filtered = words.filter((item) => {
      return (
        item.word.toLowerCase().includes(keyword) ||
        item.meaning.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword)
      );
    });

    setFilteredWords(filtered);
  }, [search, words]);

  const loadWords = async () => {
    try {
      const snapshot = await getDocs(collection(db, "words"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      setWords(data);
      setFilteredWords(data);
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white py-10 px-5">
      <div className="max-w-6xl mx-auto">
        {/* 🔤 FONT CHANGE: Heading font size thoda wada */}
        <h1 className="text-6xl font-extrabold text-center text-yellow-400 tracking-wide">
          📚 WordHub Dictionary
        </h1>

        {/* 🔤 FONT CHANGE: Subtitle font size wada, weight medium */}
        <p className="text-center text-gray-400 mt-3 text-lg font-medium">
          Search thousands of English words instantly.
        </p>

        {/* 🔤 FONT CHANGE: Search input font wada */}
        <input
          type="text"
          placeholder="🔍 Search word..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-8 p-5 rounded-lg bg-slate-800 border border-slate-700 text-lg font-medium placeholder:text-gray-500 focus:text-white"
        />

        {/* 🔤 FONT CHANGE: Counter text font size */}
        <div className="mt-6 text-gray-400 text-base font-medium">
          Showing <b className="text-yellow-400 text-lg">{filteredWords.length}</b> of{" "}
          <b className="text-yellow-400 text-lg">{words.length}</b> words
        </div>

        {loading ? (
          <div className="text-center mt-10 text-2xl font-semibold text-gray-300">
            Loading words...
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center mt-10 text-gray-400 text-xl font-medium">
            No words found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {filteredWords.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800 rounded-xl p-6 shadow-lg hover:bg-slate-700 transition duration-300"
              >
                {/* 🔤 FONT CHANGE: Word title - wada font, bold */}
                <h2
                  onClick={() =>
                    router.push(`/dictionary/${encodeURIComponent(item.word)}`)
                  }
                  className="text-3xl font-extrabold text-green-400 cursor-pointer hover:text-yellow-400 transition"
                >
                  {item.word}
                </h2>

                {/* 🔤 FONT CHANGE: Meaning label - wada font */}
                <p className="mt-4 text-base">
                  <span className="font-bold text-yellow-300 text-lg">
                    Meaning:
                  </span>
                  <br />
                  <span className="text-gray-200 font-medium">
                    {item.meaning}
                  </span>
                </p>

                {/* 🔤 FONT CHANGE: Example label - wada font */}
                <p className="mt-4 text-base">
                  <span className="font-bold text-yellow-300 text-lg">
                    Example:
                  </span>
                  <br />
                  <span className="text-gray-300 font-medium">
                    {item.example || "No example available"}
                  </span>
                </p>

                <div className="flex justify-between items-center mt-6">
                  {/* 🔤 FONT CHANGE: Category font size */}
                  <span className="bg-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
                    {item.category}
                  </span>

                  {/* 🔤 FONT CHANGE: Button font weight */}
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