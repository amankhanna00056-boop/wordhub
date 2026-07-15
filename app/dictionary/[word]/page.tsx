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
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const loadWord = useCallback(async () => {
    // Check if params.word exists
    if (!params?.word) {
      setError("No word specified");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRelatedWords([]);

      const currentWord = decodeURIComponent(params.word as string);

      // 🔥 CHANGE: Fetch ALL words and find manually
      const snapshot = await getDocs(collection(db, "words"));

      const found = snapshot.docs.find((doc) => {
        const data = doc.data() as Omit<Word, "id">;
        return (
          data.word.trim().toLowerCase() ===
          currentWord.trim().toLowerCase()
        );
      });

      if (!found) {
        setError(`Word "${currentWord}" not found in dictionary.`);
        setLoading(false);
        return;
      }

      const selectedWord: Word = {
        id: found.id,
        ...(found.data() as Omit<Word, "id">),
      };

      setWordData(selectedWord);

      // Load related words from same category
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
          .slice(0, 5); // Show max 5 related words

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
    // Only load if params.word exists
    if (params?.word) {
      loadWord();
    }
  }, [params?.word, loadWord]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakWord = useCallback(() => {
    if (!wordData) return;

    // Cancel any ongoing speech
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
      await navigator.clipboard.writeText(wordData.word);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy word. Please try again.");
    }
  }, [wordData]);

  const shareWord = useCallback(async () => {
    if (!wordData) return;

    try {
      if (navigator.share && window.innerWidth < 768) {
        await navigator.share({
          title: `Word: ${wordData.word}`,
          text: `${wordData.word}: ${wordData.meaning}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          `${wordData.word}: ${wordData.meaning}\n\nLearn more at: ${window.location.href}`
        );
        alert("✅ Word details copied to clipboard!");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Share failed:", err);
        alert("Failed to share. Please try again.");
      }
    }
  }, [wordData]);

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
                <p className="text-xl text-white">
                  {wordData.pronunciation || "Not Available"}
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
                {wordData.example ? (
                  <p className="text-lg leading-8 text-gray-200 italic border-l-4 border-blue-500/50 pl-4">
                    &quot;{wordData.example}&quot;
                  </p>
                ) : (
                  <p className="text-gray-500 italic">No example available.</p>
                )}
              </div>
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