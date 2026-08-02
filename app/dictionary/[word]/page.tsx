"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
  partOfSpeech?: string;
  pronunciation?: string;
  synonyms?: string[];
  antonyms?: string[];
  difficulty?: string;
  origin?: string;
  phonetic?: string;
}

export default function WordDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [wordData, setWordData] = useState<Word | null>(null);
  const [relatedWords, setRelatedWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [apiData, setApiData] = useState<any>(null);
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const loadWord = useCallback(async () => {
    if (!params?.word) {
      setError("No word specified");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRelatedWords([]);

      const currentWord =
  decodeURIComponent(params.word as string)
    .trim()
    .toLowerCase();

      // Create slug from current word
      // Search manually (case-insensitive)
const snapshot = await getDocs(collection(db, "words"));
console.log("Total docs:", snapshot.size);

snapshot.docs.forEach((doc) => {
  console.log(doc.data());
});

const found = snapshot.docs.find((doc) => {
  const data = doc.data();

  return (
    String(data.word).trim().toLowerCase() ===
    currentWord.trim().toLowerCase()
  );
});

if (!found) {
  setError(`Word "${currentWord}" not found.`);
  setLoading(false);
  return;
}
      const selectedWord: Word = {
        id: found.id,
        ...(found.data() as Omit<Word, "id">),
      };

      setWordData(selectedWord);

      // Fetch from Dictionary API
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${selectedWord.word}`
        );

        if (response.ok) {
          const api = await response.json();
          setApiData(api[0]);
        } else {
          setApiData(null);
        }
      } catch (err) {
        console.error("Dictionary API Error:", err);
        setApiData(null);
      }

      if (selectedWord.category) {
        const relatedQuery = query(
          collection(db, "words"),
          where("category", "==", selectedWord.category),
          limit(10)
        );

        const relatedSnapshot = await getDocs(relatedQuery);

        const related = relatedSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Word, "id">),
          }))
          .filter((item) => item.id !== selectedWord.id)
          .slice(0, 5);

        setRelatedWords(related);
      }
    } catch (err) {
      console.error("Error loading word:", err);
      setError("Failed to load word details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [params?.word]);

  useEffect(() => {
    if (params?.word) {
      loadWord();
    }
  }, [params?.word, loadWord]);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakWord = useCallback(() => {
    if (!wordData) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);

    const speech = new SpeechSynthesisUtterance(wordData.word);
    speech.lang = "en-US";
    speech.rate = 0.9;
    speech.pitch = 1;
    speech.volume = 1;

    speech.onend = () => {
      setIsSpeaking(false);
    };

    speech.onerror = () => {
      setIsSpeaking(false);
      console.error("Speech synthesis error");
    };

    speechRef.current = speech;
    window.speechSynthesis.speak(speech);
  }, [wordData]);

  const copyWord = useCallback(async () => {
    if (!wordData) return;

    try {
      const text = `Word: ${wordData.word}

Meaning:
${apiData?.meanings?.[0]?.definitions?.[0]?.definition || wordData.meaning}

Example:
${wordData.example || "No example"}

Category:
${wordData.category}`;

      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy word. Please try again.");
    }
  }, [wordData, apiData]);

  const shareWord = useCallback(async () => {
    if (!wordData) return;

    try {
      const shareText = `Word: ${wordData.word}

Meaning:
${wordData.meaning}

Example:
${wordData.example || "No example"}

Category:
${wordData.category}`;

      if (navigator.share && window.innerWidth < 768) {
        await navigator.share({
          title: wordData.word,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert("✅ Word copied! Share API is not supported on this browser.");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Share failed:", err);
        alert("Failed to share. Please try again.");
      }
    }
  }, [wordData]);

  const toggleFavorite = useCallback(() => {
    if (!wordData) return;

    const word = wordData.word;
    let updated: string[];

    if (favorites.includes(word)) {
      updated = favorites.filter((w) => w !== word);
    } else {
      updated = [...favorites, word];
    }

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  }, [favorites, wordData]);

  // Loading State
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex justify-center items-center p-4">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-yellow-400 border-t-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <p className="mt-6 text-xl font-semibold text-gray-300 animate-pulse">
            Loading Word...
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please wait while we fetch the details
          </p>
        </div>
      </main>
    );
  }

  // Error State
  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 flex justify-center items-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-red-400 mb-2">Word Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-bold transition"
            >
              ← Go Back
            </button>
            <Link
              href="/dictionary"
              className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold transition inline-block"
            >
              📖 Browse Dictionary
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!wordData) {
    return (
      <main className="min-h-screen bg-slate-900 flex justify-center items-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📭</div>
          <h1 className="text-3xl font-bold text-gray-400">No Data Available</h1>
          <Link
            href="/dictionary"
            className="inline-block mt-6 bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold transition"
          >
            ← Back to Dictionary
          </Link>
        </div>
      </main>
    );
  }

  // Main Render
  return (
    <main className="min-h-screen bg-slate-900 py-8 px-4 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6 flex items-center gap-2 flex-wrap bg-slate-800/30 backdrop-blur-sm rounded-lg px-4 py-3 border border-slate-700/30">
          <Link href="/" className="hover:text-yellow-400 transition">
            🏠 Home
          </Link>
          <span className="text-gray-600">/</span>
          <Link href="/dictionary" className="hover:text-yellow-400 transition">
            📖 Dictionary
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-yellow-400 font-medium truncate">
            {wordData.word}
          </span>
        </nav>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 md:p-10 shadow-2xl shadow-black/20">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 pb-6 border-b border-slate-700/50">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                  {wordData.word}
                </h1>
                <span className="bg-slate-700/50 px-3 py-1 rounded-full text-xs text-gray-300 border border-slate-600/50">
                  #{wordData.category}
                </span>
              </div>
              <p className="text-gray-400 mt-2 text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
                English Vocabulary • Word #{wordData.id.slice(0, 6)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Favorite Button */}
              <button
                onClick={toggleFavorite}
                className={`px-5 py-3 rounded-lg font-bold transition hover:scale-105 ${
                  favorites.includes(wordData.word)
                    ? "bg-yellow-400 text-slate-900"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                {favorites.includes(wordData.word) ? "⭐" : "☆"} Favorite
              </button>

              <button
                onClick={speakWord}
                disabled={isSpeaking}
                className={`px-5 py-3 rounded-lg font-bold transition duration-200 flex items-center gap-2 ${
                  isSpeaking
                    ? "bg-yellow-500/50 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 hover:scale-105"
                }`}
              >
                {isSpeaking ? (
                  <>
                    <span className="animate-pulse">🔊</span>
                    Speaking...
                  </>
                ) : (
                  "🔊 Speak"
                )}
              </button>

              <button
                onClick={copyWord}
                className="bg-green-500 hover:bg-green-600 px-5 py-3 rounded-lg font-bold transition hover:scale-105"
              >
                {copied ? "✅ Copied!" : "📋 Copy"}
              </button>

              <button
                onClick={shareWord}
                className="bg-purple-500 hover:bg-purple-600 px-5 py-3 rounded-lg font-bold transition hover:scale-105"
              >
                🔗 Share
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pronunciation & Part of Speech */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">
                  🔊 Pronunciation
                </h2>
                <p className="text-lg text-gray-300">
                  {apiData?.phonetic || wordData.pronunciation || "No pronunciation available"}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="bg-green-600 px-4 py-2 rounded-full text-white">
                    📝 {wordData.partOfSpeech || "Unknown"}
                  </span>
                  <span className="bg-orange-600 px-4 py-2 rounded-full text-white">
                    🎯 {wordData.difficulty || "Easy"}
                  </span>
                </div>
              </div>

              {/* Synonyms & Antonyms */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                <h2 className="text-2xl font-bold text-pink-400 mb-4">
                  ❤️ Synonyms
                </h2>
                <div className="flex flex-wrap gap-2">
                  {wordData.synonyms && wordData.synonyms.length > 0 ? (
                    wordData.synonyms.map((item, index) => (
                      <span
                        key={index}
                        className="bg-pink-600 text-white px-3 py-2 rounded-full text-sm font-medium"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400">No synonyms available.</p>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-red-400 mt-8 mb-4">
                  ↔️ Antonyms
                </h2>
                <div className="flex flex-wrap gap-2">
                  {wordData.antonyms && wordData.antonyms.length > 0 ? (
                    wordData.antonyms.map((item, index) => (
                      <span
                        key={index}
                        className="bg-red-600 text-white px-3 py-2 rounded-full text-sm font-medium"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400">No antonyms available.</p>
                  )}
                </div>
              </div>

              {/* Example Sentence */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30 hover:border-blue-400/30 transition-colors">
                <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                  <span>💡</span> Example Sentence
                </h2>
                <p className="text-lg leading-8 text-gray-200 italic border-l-4 border-blue-500/50 pl-4">
                  {apiData?.meanings?.[0]?.definitions?.[0]?.example || wordData.example || "No example available."}
                </p>
              </div>

              {/* API Synonyms & Antonyms - Added below Meaning section */}
              {apiData?.meanings?.[0]?.synonyms?.length > 0 && (
                <div className="mt-6 bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                  <h3 className="text-xl font-bold text-green-400 mb-3">
                    🔗 Synonyms (API)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {apiData.meanings[0].synonyms.slice(0, 10).map(
                      (item: string) => (
                        <span
                          key={item}
                          className="px-3 py-2 rounded-lg bg-green-700 hover:bg-green-600 transition"
                        >
                          {item}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {apiData?.meanings?.[0]?.antonyms?.length > 0 && (
                <div className="mt-6 bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                  <h3 className="text-xl font-bold text-red-400 mb-3">
                    🚫 Antonyms (API)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {apiData.meanings[0].antonyms.slice(0, 10).map(
                      (item: string) => (
                        <span
                          key={item}
                          className="px-3 py-2 rounded-lg bg-red-700 hover:bg-red-600 transition"
                        >
                          {item}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Category */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                  <span>🏷️</span> Category
                </h2>
                <div className="mt-4">
                  <span className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 rounded-full font-semibold shadow-lg shadow-indigo-600/20">
                    {wordData.category}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <p>
                    <span className="font-semibold">Category:</span>
                    {wordData.category}
                  </p>
                  {apiData?.meanings?.[0]?.partOfSpeech && (
                    <p>
                      <span className="font-semibold text-yellow-400">
                        Part of Speech:
                      </span>{" "}
                      {apiData.meanings[0].partOfSpeech}
                    </p>
                  )}
                </div>
              </div>

              {/* Related Words */}
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/30">
                <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                  <span>🔗</span> Related Words
                </h2>
                {relatedWords.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No related words found in this category.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {relatedWords.map((item) => (
                      <Link
                        key={item.id}
                        href={`/dictionary/${encodeURIComponent(item.word)}`}
                        className="block bg-slate-800 hover:bg-slate-700 rounded-lg p-4 transition-all duration-200 hover:scale-[1.02] border border-slate-700/30 hover:border-yellow-400/30"
                      >
                        <h3 className="font-bold text-green-400">
                          {item.word}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                          {item.meaning}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mt-10 pt-6 border-t border-slate-700/50">
            <Link
              href="/dictionary"
              className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-bold transition hover:scale-105"
            >
              📚 Back to Dictionary
            </Link>
            <Link
              href="/"
              className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-bold transition hover:scale-105"
            >
              🏠 Home
            </Link>
            <Link
              href={`/edit-word/${wordData.id}`}
              className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-lg font-bold transition hover:scale-105"
            >
              ✏️ Edit Word
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-700/50 text-center">
            <h3 className="text-xl font-bold text-yellow-400">
              📚 WordHub Dictionary
            </h3>
            <p className="text-gray-400 mt-2 text-sm">
              Learn English vocabulary faster with WordHub
            </p>
            <p className="text-gray-600 text-xs mt-4">
              © {new Date().getFullYear()} WordHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}