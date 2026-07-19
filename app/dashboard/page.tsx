"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  getCountFromServer,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";

// ============================
// TYPES
// ============================
interface Word {
  id: string;
  word: string;
  meaning: string;
  category: string;
  example?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  partOfSpeech?: string;
  pronunciation?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface DashboardStats {
  totalWords: number;
  totalCategories: number;
  recentWords: Word[];
  wordsByCategory: Record<string, number>;
  wordsByDifficulty: Record<string, number>;
  recentActivity: { date: Date; count: number }[];
  growthRate: number;
}

interface Toast {
  type: "success" | "error" | "info" | "warning";
  message: string;
  id: number;
}

// ============================
// HELPER FUNCTIONS
// ============================
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Science: "from-cyan-400 to-cyan-600",
    Technology: "from-blue-400 to-blue-600",
    Business: "from-emerald-400 to-emerald-600",
    Literature: "from-purple-400 to-purple-600",
    Love: "from-pink-400 to-pink-600",
    Life: "from-rose-400 to-rose-600",
    Nature: "from-green-400 to-green-600",
    Art: "from-orange-400 to-orange-600",
    Music: "from-indigo-400 to-indigo-600",
    Food: "from-amber-400 to-amber-600",
    Travel: "from-teal-400 to-teal-600",
    Health: "from-red-400 to-red-600",
    Education: "from-yellow-400 to-yellow-600",
    History: "from-stone-400 to-stone-600",
    Philosophy: "from-fuchsia-400 to-fuchsia-600",
    Religion: "from-violet-400 to-violet-600",
    Sports: "from-lime-400 to-lime-600",
    Politics: "from-gray-400 to-gray-600",
  };
  
  // Find matching category or return default
  for (const [key, value] of Object.entries(colors)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  return "from-slate-400 to-slate-600";
};

const getDifficultyEmoji = (difficulty?: string): string => {
  const map: Record<string, string> = {
    Easy: "🟢",
    Medium: "🟡",
    Hard: "🔴",
  };
  return map[difficulty || ""] || "⚪";
};

// ============================
// MAIN COMPONENT
// ============================
export default function Dashboard() {
  const router = useRouter();
  
  // ── State ──
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalWords: 0,
    totalCategories: 0,
    recentWords: [],
    wordsByCategory: {},
    wordsByDifficulty: {},
    recentActivity: [],
    growthRate: 0,
  });
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  
  const toastIdCounter = useRef(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ── Toast System ──
  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = toastIdCounter.current++;
    setToasts((prev) => [...prev, { type, message, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // ── Auth Listener ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/about");
        showToast("info", "Please login to access dashboard");
      } else {
        setUser(currentUser);
        loadStats();
        setupRealtimeListener();
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [router]);

  // ── Real-time Firestore Listener ──
  const setupRealtimeListener = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const q = query(collection(db, "words"), orderBy("createdAt", "desc"));
    
    unsubscribeRef.current = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        // Update stats in real-time
        const words = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Word, "id">),
        }));
        
        updateStats(words);
        showToast("info", "Data updated in real-time 📡");
      },
      (error) => {
        console.error("Realtime listener error:", error);
        showToast("error", "Realtime updates disconnected");
      }
    );
  }, []);

  // ── Update Stats ──
  const updateStats = useCallback((words: Word[]) => {
    const categories = new Set<string>();
    const categoryCount: Record<string, number> = {};
    const difficultyCount: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
    
    words.forEach((word) => {
      if (word.category) {
        categories.add(word.category);
        categoryCount[word.category] = (categoryCount[word.category] || 0) + 1;
      }
      if (word.difficulty) {
        difficultyCount[word.difficulty] = (difficultyCount[word.difficulty] || 0) + 1;
      }
    });

    // Recent activity (last 30 days grouped by day)
    const now = new Date();
    const activityMap: Record<string, number> = {};
    
    words.forEach((word) => {
      if (word.createdAt?.toDate) {
        const date = word.createdAt.toDate();
        const dateKey = date.toISOString().split("T")[0];
        activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
      }
    });

    const recentActivity = Object.entries(activityMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, count]) => ({
        date: new Date(date),
        count,
      }));

    // Calculate growth rate (comparing last 7 days to previous 7 days)
    const totalLastWeek = recentActivity.slice(-7).reduce((sum, d) => sum + d.count, 0);
    const totalPrevWeek = recentActivity.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
    const growthRate = totalPrevWeek > 0 
      ? ((totalLastWeek - totalPrevWeek) / totalPrevWeek) * 100 
      : totalLastWeek > 0 ? 100 : 0;

    setStats({
      totalWords: words.length,
      totalCategories: categories.size,
      recentWords: words.slice(0, 10),
      wordsByCategory: categoryCount,
      wordsByDifficulty: difficultyCount,
      recentActivity,
      growthRate: Math.round(growthRate * 10) / 10,
    });
  }, []);

  // ── Load Stats ──
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      
      const wordsCollection = collection(db, "words");
      const snapshot = await getDocs(wordsCollection);
      const words = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));
      
      updateStats(words);
      
    } catch (error) {
      console.error("Error loading stats:", error);
      showToast("error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [updateStats, showToast]);

  // ── Refresh Data ──
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
    showToast("success", "Dashboard refreshed ✅");
  };

  // ── Handle Logout ──
  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await signOut(auth);
      router.push("/about");
      showToast("info", "Logged out successfully 👋");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("error", "Failed to logout. Please try again.");
      setLogoutLoading(false);
    }
  };

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "r") {
        e.preventDefault();
        handleRefresh();
      }
      if (e.key === "Escape") {
        setShowHelp(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        router.push("/add-word");
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── Memoized Values ──
  const categoryEntries = useMemo(() => {
    return Object.entries(stats.wordsByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [stats.wordsByCategory]);

  const topCategories = useMemo(() => {
    return categoryEntries.slice(0, 5);
  }, [categoryEntries]);

  const activityData = useMemo(() => {
    const data = stats.recentActivity;
    if (timeRange === "7d") return data.slice(-7);
    if (timeRange === "30d") return data.slice(-30);
    return data.slice(-90);
  }, [stats.recentActivity, timeRange]);

  // ── Loading Skeleton ──
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-12 bg-slate-700/50 rounded-lg w-64 mb-8"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-700/30 rounded-xl p-6 h-32"></div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="bg-slate-700/30 rounded-xl p-6 h-96"></div>
            <div className="bg-slate-700/30 rounded-xl p-6 h-96"></div>
          </div>
        </div>
      </main>
    );
  }

  // ============================
  // RENDER
  // ============================
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ── Toast Container ── */}
        <div className="fixed top-4 right-4 z-50 space-y-2 w-80 md:w-96">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`p-4 rounded-xl shadow-2xl border backdrop-blur-sm animate-slide-in ${
                toast.type === "success"
                  ? "bg-green-600/90 border-green-400/30"
                  : toast.type === "error"
                  ? "bg-red-600/90 border-red-400/30"
                  : toast.type === "warning"
                  ? "bg-yellow-600/90 border-yellow-400/30"
                  : "bg-blue-600/90 border-blue-400/30"
              }`}
            >
              <p className="text-white font-medium">{toast.message}</p>
            </div>
          ))}
        </div>

        {/* ── Help Modal ── */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowHelp(false)}>
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">⌨️ Keyboard Shortcuts</h2>
              <div className="space-y-3 text-slate-300">
                <div className="flex justify-between"><span>Refresh Dashboard</span><kbd className="bg-slate-700 px-3 py-1 rounded">Ctrl + R</kbd></div>
                <div className="flex justify-between"><span>Add New Word</span><kbd className="bg-slate-700 px-3 py-1 rounded">Ctrl + A</kbd></div>
                <div className="flex justify-between"><span>Close Help</span><kbd className="bg-slate-700 px-3 py-1 rounded">Esc</kbd></div>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-full mt-6 bg-yellow-500 text-slate-900 py-3 rounded-xl font-bold hover:bg-yellow-400 transition">
                Got it!
              </button>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-5xl font-extrabold">
                <span className="text-yellow-400">⚡</span>
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs border border-green-500/30 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Live
              </span>
            </div>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              Welcome back,{" "}
              <span className="text-white font-semibold">
                {user?.displayName || user?.email?.split("@")[0] || "Admin"}
              </span>
              👋
            </p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowHelp(true)}
              className="bg-slate-700/50 hover:bg-slate-600/50 px-3 py-2 rounded-lg text-sm transition text-slate-300 border border-slate-600/50"
              title="Keyboard shortcuts"
            >
              ⌨️
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`bg-slate-700/50 hover:bg-slate-600/50 px-4 py-2 rounded-lg text-sm transition text-slate-300 border border-slate-600/50 ${
                refreshing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {refreshing ? "⟳" : "🔄"} Refresh
            </button>
            <button
              onClick={() => router.push("/")}
              className="bg-slate-700/50 hover:bg-slate-600/50 px-4 py-2 rounded-lg text-sm transition text-slate-300 border border-slate-600/50"
            >
              🏠 View Site
            </button>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className={`bg-red-500/20 hover:bg-red-500/30 px-6 py-2 rounded-lg font-bold transition text-red-400 border border-red-500/30 flex items-center gap-2 ${
                logoutLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {logoutLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Logging out...
                </>
              ) : (
                "🚪 Logout"
              )}
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="group bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-yellow-400/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-400/5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm text-slate-400 font-medium">Total Words</h3>
                <p className="text-3xl md:text-4xl font-bold text-emerald-400 mt-2">
                  {stats.totalWords.toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">📚</div>
            </div>
            {stats.growthRate !== 0 && (
              <div className={`mt-2 text-xs ${stats.growthRate > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {stats.growthRate > 0 ? "↑" : "↓"} {Math.abs(stats.growthRate)}% from last week
              </div>
            )}
          </div>
          
          <div className="group bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-yellow-400/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-400/5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm text-slate-400 font-medium">Categories</h3>
                <p className="text-3xl md:text-4xl font-bold text-blue-400 mt-2">
                  {stats.totalCategories}
                </p>
              </div>
              <div className="text-3xl">📂</div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {topCategories.length > 0 ? `Top: ${topCategories[0][0]}` : "No categories"}
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-yellow-400/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-400/5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm text-slate-400 font-medium">Recent Updates</h3>
                <p className="text-3xl md:text-4xl font-bold text-yellow-400 mt-2">
                  {stats.recentWords.length}
                </p>
              </div>
              <div className="text-3xl">🔄</div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Last {stats.recentWords.length} words added
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-slate-800/50 to-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-yellow-400/30 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-400/5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm text-slate-400 font-medium">Admin</h3>
                <p className="text-xl font-bold text-purple-400 mt-2 truncate max-w-[150px]">
                  {user?.displayName || user?.email?.split("@")[0] || "User"}
                </p>
              </div>
              <div className="text-3xl">👤</div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {user?.email || "No email"}
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Link
            href="/add-word"
            className="group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 py-3 md:py-4 rounded-xl font-bold text-center transition hover:scale-[1.02] shadow-lg shadow-emerald-500/20 text-white flex items-center justify-center gap-2"
          >
            ➕ Add Word
            <span className="text-xs opacity-50 hidden md:inline">(⌘A)</span>
          </Link>
          <Link
            href="/admin/dashboard"
            className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 py-3 md:py-4 rounded-xl font-bold text-center transition hover:scale-[1.02] shadow-lg shadow-blue-500/20 text-white flex items-center justify-center gap-2"
          >
            📚 Admin Panel
          </Link>
          <Link
            href="/bulk-import"
            className="group bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 py-3 md:py-4 rounded-xl font-bold text-center transition hover:scale-[1.02] shadow-lg shadow-purple-500/20 text-white flex items-center justify-center gap-2"
          >
            📥 Bulk Import
          </Link>
          <Link
            href="/dictionary"
            className="group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 py-3 md:py-4 rounded-xl font-bold text-center transition hover:scale-[1.02] shadow-lg shadow-orange-500/20 text-white flex items-center justify-center gap-2"
          >
            🎯 Dictionary
          </Link>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* ── Recent Words ── */}
          <div className="lg:col-span-2 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <span>📋</span> Recent Words
              </h2>
              <div className="flex gap-3">
                <Link
                  href="/admin/dashboard"
                  className="text-sm text-slate-400 hover:text-white transition"
                >
                  View all →
                </Link>
              </div>
            </div>

            {stats.recentWords.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-slate-400">No words available yet</p>
                <Link
                  href="/add-word"
                  className="inline-block mt-3 text-yellow-400 hover:underline"
                >
                  Add your first word →
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.recentWords.map((item, index) => (
                  <div
                    key={item.id}
                    className={`group flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-xl transition-all hover:bg-slate-700/50 hover:border-slate-600 border border-transparent ${
                      index !== stats.recentWords.length - 1
                        ? "border-b border-slate-700/50 pb-3"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-emerald-400 truncate">
                          {item.word}
                        </h3>
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                          {item.category || "Uncategorized"}
                        </span>
                        {item.difficulty && (
                          <span className="text-xs">
                            {getDifficultyEmoji(item.difficulty)}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-sm truncate">
                        {item.meaning}
                      </p>
                      {item.example && (
                        <p className="text-slate-500 text-xs truncate italic">
                          "{item.example}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/edit-word/${item.id}`}
                        className="text-yellow-400 hover:text-yellow-300 text-sm transition px-3 py-1 rounded-lg bg-yellow-400/10 hover:bg-yellow-400/20"
                      >
                        ✏️ Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-6">
            
            {/* ── Category Distribution ── */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2 mb-5">
                <span>📊</span> Categories
              </h2>
              
              {Object.keys(stats.wordsByCategory).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No categories yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {categoryEntries.map(([category, count]) => {
                    const percentage = stats.totalWords > 0 
                      ? Math.round((count / stats.totalWords) * 100) 
                      : 0;
                    const colorClass = getCategoryColor(category);
                    
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300 truncate">{category}</span>
                          <span className="text-slate-400 text-xs">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full bg-gradient-to-r ${colorClass} transition-all duration-700`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Difficulty Distribution ── */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2 mb-5">
                <span>🎯</span> Difficulty
              </h2>
              
              {stats.totalWords === 0 ? (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm">No data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.wordsByDifficulty).map(([level, count]) => {
                    const percentage = stats.totalWords > 0 
                      ? Math.round((count / stats.totalWords) * 100) 
                      : 0;
                    const colors: Record<string, string> = {
                      Easy: "from-emerald-400 to-emerald-500",
                      Medium: "from-yellow-400 to-yellow-500",
                      Hard: "from-red-400 to-red-500",
                    };
                    
                    return (
                      <div key={level}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-300">
                            {getDifficultyEmoji(level)} {level}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full bg-gradient-to-r ${colors[level] || "from-slate-400 to-slate-500"} transition-all duration-700`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Activity Timeline ── */}
        {stats.recentActivity.length > 0 && (
          <div className="mt-8 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <span>📈</span> Activity Timeline
              </h2>
              <div className="flex gap-2">
                {(["7d", "30d", "90d"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      timeRange === range
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-slate-700/30 text-slate-400 hover:text-white"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-end gap-1 h-32">
              {activityData.map((day, index) => {
                const maxCount = Math.max(...activityData.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                const isToday = index === activityData.length - 1;
                
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    <div
                      className={`w-full rounded-t transition-all duration-500 ${
                        isToday
                          ? "bg-gradient-to-t from-yellow-400 to-yellow-500"
                          : "bg-gradient-to-t from-blue-500 to-blue-400"
                      }`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <div className="text-[8px] text-slate-500 opacity-0 group-hover:opacity-100 transition">
                      {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 mt-2">
              <span>{activityData[0]?.date.toLocaleDateString() || ""}</span>
              <span>Today</span>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-12 pt-6 border-t border-slate-700/50 text-center">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} WordHub • Built with ❤️
          </p>
          <p className="text-slate-600 text-xs mt-1 flex items-center justify-center gap-4">
            <span>📚 {stats.totalWords} words</span>
            <span>📂 {stats.totalCategories} categories</span>
            <span>🔄 Real-time updates</span>
          </p>
        </footer>
      </div>

      {/* ── Global Styles ── */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.5);
        }
      `}</style>
    </main>
  );
}