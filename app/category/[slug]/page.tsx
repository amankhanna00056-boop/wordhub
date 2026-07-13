"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = String(params.slug).toLowerCase();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      const snapshot = await getDocs(collection(db, "words"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      const filtered = data.filter(
        (item) => item.category.toLowerCase() === slug
      );

      setWords(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 bg-slate-900 min-h-screen">

      {/* 🔤 Back Button - Professional Blue */}
      <Link
        href="/"
        className="inline-block mb-8 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-blue-600/30"
      >
        ← Back to Dictionary
      </Link>

      {/* 🔤 Category Heading - Professional Gradient */}
      <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        📂 {slug.charAt(0).toUpperCase() + slug.slice(1)}
      </h1>

      {/* 🔤 Total Words - Professional Gray */}
      <p className="text-slate-400 mb-10 text-lg font-medium">
        Total Words: <span className="text-cyan-400 font-bold">{words.length}</span>
      </p>

      {loading ? (
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-slate-300">Loading...</h2>
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold text-rose-400">
            No Words Found
          </h2>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {words.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-cyan-400 transition-all hover:scale-[1.02] shadow-lg hover:shadow-cyan-400/10"
            >
              {/* 🔤 Word Title - Professional Cyan/Teal */}
              <h2 className="text-3xl font-bold text-cyan-400 hover:text-cyan-300 transition">
                {item.word}
              </h2>

              {/* 🔤 Meaning - Professional Color Scheme */}
              <p className="mt-4 text-slate-300 text-base leading-relaxed">
                <span className="font-semibold text-amber-400">
                  Meaning:
                </span>{" "}
                <span className="text-slate-200">{item.meaning}</span>
              </p>

              {/* 🔤 Example - Professional Color Scheme */}
              <p className="mt-4 text-slate-400 text-base leading-relaxed">
                <span className="font-semibold text-sky-400">
                  Example:
                </span>{" "}
                <span className="text-slate-300 italic">{item.example}</span>
              </p>

              {/* 🔤 Read More Button - Professional Gradient */}
              <div className="mt-6">
                <Link
                  href={`/word/${item.word.toLowerCase()}`}
                  className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600 transition shadow-lg hover:shadow-cyan-500/30"
                >
                  Read More →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}