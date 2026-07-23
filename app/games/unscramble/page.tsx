"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/firebase";
import {
  collection,
  getDocs,
  query,
  limit,
} from "firebase/firestore";

export default function UnscramblePage() {
  const [word, setWord] = useState("");
  const [scrambledWord, setScrambledWord] = useState("");
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [dailyMode, setDailyMode] = useState(false);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);

  // ✅ Shuffle word function
  function shuffleWord(text: string) {
    let shuffled = text;
    while (shuffled === text) {
      shuffled = text
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
    }
    return shuffled;
  }

  // ✅ Get Daily Index
  function getDailyIndex(total: number) {
    const today = new Date().toISOString().split("T")[0];
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash += today.charCodeAt(i);
    }
    return hash % total;
  }

  // ✅ Save Progress
  function saveProgress() {
    localStorage.setItem(
      "wordhubProgress",
      JSON.stringify({
        gamesPlayed,
        correctAnswers,
        bestScore,
      })
    );
  }

  // ✅ Load Words
  async function loadWord(isDaily = false) {
    try {
      setLoading(true);

      let words = allWords;

      if (words.length === 0) {
        const q = query(collection(db, "words"), limit(100));
        const snapshot = await getDocs(q);
        words = snapshot.docs.map((doc) => doc.data().word).filter(Boolean);
        setAllWords(words);
      }

      if (words.length === 0) {
        setMessage("❌ No words found in database!");
        setLoading(false);
        return;
      }

      let selectedWord;

      if (isDaily) {
        const index = getDailyIndex(words.length);
        selectedWord = words[index];
        setDailyMode(true);
      } else {
        selectedWord = words[Math.floor(Math.random() * words.length)];
        setDailyMode(false);
      }

      setWord(selectedWord.toLowerCase());
      setScrambledWord(shuffleWord(selectedWord.toUpperCase()));
      setAnswer("");
      setMessage("");
      setGameOver(false);
      setTimeLeft(30);

    } catch (err) {
      console.log("Loading failed", err);
      setMessage("❌ Failed to load words. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Check Answer
  function checkAnswer() {
    if (gameOver) {
      setMessage("⏰ Game Over! Click 'Next Word' to play again.");
      return;
    }

    if (!answer.trim()) {
      setMessage("📝 Please type your answer!");
      return;
    }

    if (answer.toLowerCase().trim() === word) {
      setMessage("🎉 Correct Answer! +10");
      setScore((prev) => prev + 10);
      setGamesPlayed((prev) => prev + 1);
      setCorrectAnswers((prev) => prev + 1);
      setStreak((prev) => prev + 1);

      if (score + 10 > bestScore) {
        setBestScore(score + 10);
      }

      saveProgress();

      setTimeout(() => {
        loadWord(dailyMode);
      }, 1500);
    } else {
      setMessage("❌ Try Again!");
      setStreak(0);
    }
  }

  // ✅ Handle Enter key
  function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      checkAnswer();
    }
  }

  // ✅ Share Result
  function shareResult() {
    const text = `🔥 I scored ${score} points in WordHub Unscramble! Can you beat me?\n\n🎮 Play now: wordhub.com/games/unscramble`;
    
    // ✅ Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      setMessage("📋 Result copied to clipboard!");
      setTimeout(() => setMessage(""), 3000);
    }).catch(() => {
      // ✅ Fallback - show text in a prompt
      prompt("Copy this text:", text);
    });
  }

  // ✅ Share on Social Media
  function shareOnSocial(platform: string) {
    const url = "https://wordhub.com/games/unscramble";
    const text = `🔥 I scored ${score} points in WordHub Unscramble! Can you beat me?`;
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offscreen/?url=${encodeURIComponent(url)}`,
    };

    if (platform === "copy") {
      shareResult();
      return;
    }

    const shareUrl = shareUrls[platform];
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  }

  // ✅ Load words on mount
  useEffect(() => {
    loadWord(false);
  }, []);

  // ✅ Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem("wordhubProgress");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setGamesPlayed(data.gamesPlayed || 0);
        setCorrectAnswers(data.correctAnswers || 0);
        setBestScore(data.bestScore || 0);
      } catch (e) {
        console.log("Error loading progress:", e);
      }
    }
  }, []);

  // ✅ Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setGameOver(true);
      setMessage("⏰ Time Over!");
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-5">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center border border-slate-700 relative">
        
        {/* ── Header ── */}
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">🔤 Word Scramble</h1>
        <p className="text-gray-400 text-sm mb-6">
          {dailyMode ? "🔥 Daily Challenge" : "Unscramble the letters"}
        </p>

        {/* ── Scrambled Word ── */}
        <div className="text-4xl md:text-5xl font-bold tracking-widest text-white bg-slate-700/50 p-4 rounded-xl mb-6 min-h-[80px] flex items-center justify-center">
          {loading ? (
            <span className="text-gray-400 text-2xl">⏳ Loading...</span>
          ) : (
            scrambledWord
          )}
        </div>

        {/* ── Input ── */}
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your answer..."
          disabled={gameOver || loading}
          className="border-2 border-slate-600 bg-slate-700 text-white rounded-lg p-3 w-full mb-4 text-center placeholder:text-gray-400 focus:outline-none focus:border-yellow-400 transition disabled:opacity-50"
        />

        {/* ── Buttons ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={checkAnswer}
            disabled={gameOver || loading}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Check
          </button>

          <button
            onClick={() => loadWord(false)}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
          >
            ➡️ Next
          </button>
        </div>

        <button
          onClick={() => loadWord(true)}
          disabled={loading}
          className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg w-full mt-3 font-bold transition disabled:opacity-50"
        >
          🔥 Daily Challenge
        </button>

        {/* ── Share Result Button ── */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => shareOnSocial("copy")}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-bold transition"
          >
            📋 Copy Result
          </button>
          
          <button
            onClick={() => setShowShareModal(!showShareModal)}
            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-3 rounded-lg font-bold transition"
          >
            📤 Share
          </button>
        </div>

        {/* ── Share Modal ── */}
        {showShareModal && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 rounded-2xl p-6 border border-slate-600 shadow-2xl w-[90%] max-w-sm z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">📤 Share Score</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => shareOnSocial("twitter")}
                className="bg-[#1DA1F2] text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition"
              >
                🐦 Twitter
              </button>
              <button
                onClick={() => shareOnSocial("whatsapp")}
                className="bg-[#25D366] text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition"
              >
                📱 WhatsApp
              </button>
              <button
                onClick={() => shareOnSocial("facebook")}
                className="bg-[#4267B2] text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition"
              >
                📘 Facebook
              </button>
              <button
                onClick={() => shareOnSocial("linkedin")}
                className="bg-[#0A66C2] text-white px-4 py-3 rounded-lg font-bold hover:opacity-90 transition"
              >
                💼 LinkedIn
              </button>
            </div>

            <button
              onClick={() => shareOnSocial("copy")}
              className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-bold transition"
            >
              📋 Copy to Clipboard
            </button>
          </div>
        )}

        {/* ── Message ── */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg font-semibold transition ${
              message.includes("Correct") || message.includes("🎉")
                ? "bg-green-500/20 border border-green-500 text-green-400"
                : message.includes("Time") || message.includes("Game Over")
                ? "bg-red-500/20 border border-red-500 text-red-400"
                : message.includes("copied")
                ? "bg-blue-500/20 border border-blue-500 text-blue-400"
                : "bg-yellow-500/20 border border-yellow-500 text-yellow-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-slate-700/50 p-2 rounded-lg">
            <p className="text-gray-400 text-[10px]">Score</p>
            <p className="text-yellow-400 text-lg font-bold">{score}</p>
          </div>
          <div className="bg-slate-700/50 p-2 rounded-lg">
            <p className="text-gray-400 text-[10px]">Time</p>
            <p className={`text-lg font-bold ${timeLeft <= 5 ? "text-red-500" : "text-green-400"}`}>
              {timeLeft}s
            </p>
          </div>
          <div className="bg-slate-700/50 p-2 rounded-lg">
            <p className="text-gray-400 text-[10px]">Streak</p>
            <p className="text-purple-400 text-lg font-bold">🔥 {streak}</p>
          </div>
          <div className="bg-slate-700/50 p-2 rounded-lg">
            <p className="text-gray-400 text-[10px]">Best</p>
            <p className="text-blue-400 text-lg font-bold">🏆 {bestScore}</p>
          </div>
        </div>

        {/* ── Extra Stats ── */}
        <div className="flex justify-between text-gray-400 text-xs mt-3 border-t border-slate-700 pt-3">
          <span>🎯 Correct: {correctAnswers}</span>
          <span>📊 Games: {gamesPlayed}</span>
          <span>{dailyMode ? "🔥 Daily" : "🔄 Normal"}</span>
        </div>

        {/* ── Back Link ── */}
        <div className="mt-4">
          <a
            href="/games"
            className="text-gray-500 hover:text-gray-300 text-sm transition"
          >
            ← Back to Games
          </a>
        </div>
      </div>
    </main>
  );
}