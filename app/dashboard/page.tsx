"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "firebase/firestore";

interface Word {
  id: string;
  word: string;
  meaning: string;
  category: string;
  example?: string;
  createdAt?: any;
}

interface DashboardStats {
  totalWords: number;
  totalCategories: number;
  recentWords: Word[];
  wordsByCategory: { [key: string]: number };
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalWords: 0,
    totalCategories: 0,
    recentWords: [],
    wordsByCategory: {},
  });
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        loadStats();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const wordsCollection = collection(db, "words");
      const countSnapshot = await getCountFromServer(wordsCollection);
      const totalWords = countSnapshot.data().count;

      const snapshot = await getDocs(wordsCollection);
      
      const categories = new Set<string>();
      const categoryCount: { [key: string]: number } = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
          categoryCount[data.category] = (categoryCount[data.category] || 0) + 1;
        }
      });

      let recentWords: Word[] = [];
      try {
        const recentQuery = query(
          collection(db, "words"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const recentSnapshot = await getDocs(recentQuery);
        recentWords = recentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Word, "id">),
        }));
      } catch (err) {
        console.warn("No createdAt field, fetching recent without order");
        const fallbackSnapshot = await getDocs(
          query(collection(db, "words"), limit(5))
        );
        recentWords = fallbackSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Word, "id">),
        }));
      }

      setStats({
        totalWords,
        totalCategories: categories.size,
        recentWords,
        wordsByCategory: categoryCount,
      });

    } catch (error) {
      console.error("Error loading stats:", error);
      setError("Failed to load dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to logout. Please try again.");
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#FCD34D] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
        </div>
        <h2 className="text-2xl font-semibold mt-6 text-[#93C5FD] animate-pulse">Loading Dashboard...</h2>
        <p className="text-[#9CA3AF] text-sm mt-2">Fetching your data</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#F87171] mb-2">Something Went Wrong</h2>
          <p className="text-[#9CA3AF] mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#3B82F6] hover:bg-[#2563EB] px-6 py-3 rounded-lg font-bold transition text-white"
          >
            🔄 Refresh Page
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#FCD34D] to-[#FB923C] bg-clip-text text-transparent">
                📊 Dashboard
              </h1>
              <span className="bg-[#34D399]/20 text-[#34D399] px-3 py-1 rounded-full text-xs border border-[#34D399]/30">
                Admin
              </span>
            </div>
            <p className="text-[#9CA3AF] mt-1">
              Welcome back, <span className="text-[#E2E8F0] font-semibold">
                {user?.email || "Admin"} 👋
              </span>
            </p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => router.push("/")}
              className="bg-[#334155] hover:bg-[#475569] px-4 py-2 rounded-lg text-sm transition text-[#E2E8F0]"
            >
              🏠 View Site
            </button>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className={`bg-[#EF4444] hover:bg-[#DC2626] px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 text-white ${
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-[#334155]/50 rounded-xl p-6 text-center hover:border-[#FCD34D]/30 transition-all hover:scale-105">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="text-sm text-[#94A3B8] font-medium">Total Words</h3>
            <p className="text-3xl md:text-4xl font-bold text-[#34D399] mt-2">
              {stats.totalWords}
            </p>
          </div>
          
          <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-[#334155]/50 rounded-xl p-6 text-center hover:border-[#FCD34D]/30 transition-all hover:scale-105">
            <div className="text-3xl mb-2">📂</div>
            <h3 className="text-sm text-[#94A3B8] font-medium">Categories</h3>
            <p className="text-3xl md:text-4xl font-bold text-[#60A5FA] mt-2">
              {stats.totalCategories}
            </p>
          </div>
          
          <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-[#334155]/50 rounded-xl p-6 text-center hover:border-[#FCD34D]/30 transition-all hover:scale-105">
            <div className="text-3xl mb-2">🔄</div>
            <h3 className="text-sm text-[#94A3B8] font-medium">Recent Updates</h3>
            <p className="text-3xl md:text-4xl font-bold text-[#FBBF24] mt-2">
              {stats.recentWords.length}
            </p>
          </div>
          
          <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-[#334155]/50 rounded-xl p-6 text-center hover:border-[#FCD34D]/30 transition-all hover:scale-105">
            <div className="text-3xl mb-2">👤</div>
            <h3 className="text-sm text-[#94A3B8] font-medium">Admin</h3>
            <p className="text-xl font-bold text-[#A78BFA] mt-2 truncate">
              {user?.email?.split("@")[0] || "User"}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Link
            href="/add-word"
            className="bg-[#22C55E] hover:bg-[#16A34A] py-3 md:py-4 rounded-xl font-bold text-center transition hover:scale-105 shadow-lg shadow-[#22C55E]/20 text-white"
          >
            ➕ Add Word
          </Link>
          <Link
            href="/words"
            className="bg-[#3B82F6] hover:bg-[#2563EB] py-3 md:py-4 rounded-xl font-bold text-center transition hover:scale-105 shadow-lg shadow-[#3B82F6]/20 text-white"
          >
            📚 View Words
          </Link>
          <Link
            href="/bulk-import"
            className="bg-[#8B5CF6] hover:bg-[#7C3AED] py-3 md:py-4 rounded-xl font-bold text-center transition hover:scale-105 shadow-lg shadow-[#8B5CF6]/20 text-white"
          >
            📥 Bulk Import
          </Link>
          <Link
            href="/daily"
            className="bg-[#F97316] hover:bg-[#EA580C] py-3 md:py-4 rounded-xl font-bold text-center transition hover:scale-105 shadow-lg shadow-[#F97316]/20 text-white"
          >
            🎯 Daily Word
          </Link>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Recent Words */}
          <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-[#334155]/50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-[#FBBF24] flex items-center gap-2">
                <span>📋</span> Recent Words
              </h2>
              <Link
                href="/words"
                className="text-sm text-[#94A3B8] hover:text-[#E2E8F0] transition"
              >
                View all →
              </Link>
            </div>

            {stats.recentWords.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#94A3B8]">No words available</p>
                <Link
                  href="/add-word"
                  className="inline-block mt-3 text-[#FBBF24] hover:underline"
                >
                  Add your first word →
                </Link>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {stats.recentWords.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-4 rounded-lg transition hover:bg-[#334155]/50 ${
                      index !== stats.recentWords.length - 1
                        ? "border-b border-[#334155]/50"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-[#4ADE80] truncate">
                          {item.word}
                        </h3>
                        <span className="bg-[#3B82F6]/20 text-[#60A5FA] px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[#CBD5E1] text-sm truncate">
                        {item.meaning}
                      </p>
                      {item.example && (
                        <p className="text-[#64748B] text-xs truncate italic">
                          "{item.example}"
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/edit-word/${item.id}`}
                      className="text-[#FBBF24] hover:text-[#F59E0B] text-sm whitespace-nowrap"
                    >
                      ✏️ Edit
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Distribution */}
          <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-[#334155]/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#FBBF24] flex items-center gap-2 mb-5">
              <span>📊</span> Category Distribution
            </h2>
            
            {Object.keys(stats.wordsByCategory).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#94A3B8]">No categories yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {Object.entries(stats.wordsByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const percentage = stats.totalWords > 0 
                      ? Math.round((count / stats.totalWords) * 100) 
                      : 0;
                    
                    const colors = [
                      "from-[#3B82F6] to-[#2563EB]",
                      "from-[#22C55E] to-[#16A34A]",
                      "from-[#8B5CF6] to-[#7C3AED]",
                      "from-[#EC4899] to-[#DB2777]",
                      "from-[#6366F1] to-[#4F46E5]",
                      "from-[#EF4444] to-[#DC2626]",
                      "from-[#F59E0B] to-[#D97706]",
                      "from-[#14B8A6] to-[#0D9488]",
                    ];
                    
                    const colorIndex = Math.floor(
                      Math.random() * colors.length
                    );
                    
                    return (
                      <div key={category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#CBD5E1]">{category}</span>
                          <span className="text-[#94A3B8]">
                            {count} words ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#334155]/50 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${colors[colorIndex % colors.length]} transition-all duration-500`}
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

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-[#334155]/50 text-center">
          <p className="text-[#64748B] text-sm">
            © {new Date().getFullYear()} WordHub Admin Dashboard
          </p>
          <p className="text-[#475569] text-xs mt-1">
            Total words: {stats.totalWords} • Total categories: {stats.totalCategories}
          </p>
        </div>
      </div>

      <style jsx>{`
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