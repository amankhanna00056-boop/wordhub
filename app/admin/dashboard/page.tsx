"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../../firebase";

// ============================
// TYPES
// ============================
interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
  partOfSpeech?: string;
  difficulty?: string;
  createdAt?: any;
}

interface Stats {
  total: number;
  categories: number;
  byDifficulty: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
}

type SortField = "word" | "meaning" | "category";
type SortOrder = "asc" | "desc";

// ============================
// MAIN COMPONENT
// ============================
export default function AdminDashboard() {
  const router = useRouter();
  
  // ── State ──
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("word");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  
  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);
  const [totalWords, setTotalWords] = useState(0);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const ITEMS_PER_PAGE = 15;

  // ── Load Words ──
  const loadWords = useCallback(async (direction: "next" | "prev" | "first" = "first") => {
    setLoading(true);
    
    try {
      let q;
      
      if (direction === "first" || !lastDoc) {
        q = query(
          collection(db, "words"),
          orderBy("word"),
          limit(ITEMS_PER_PAGE)
        );
      } else if (direction === "next" && lastDoc) {
        q = query(
          collection(db, "words"),
          orderBy("word"),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        q = query(
          collection(db, "words"),
          orderBy("word"),
          limit(ITEMS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        if (direction === "next") {
          setToast({ type: "info", message: "No more words to load" });
        }
        setLoading(false);
        return;
      }

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      setWords(data);
      
      // Store last/first doc for pagination
      if (data.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setFirstDoc(snapshot.docs[0]);
      }

      // Get total count
      const totalSnapshot = await getDocs(collection(db, "words"));
      setTotalWords(totalSnapshot.size);

    } catch (error) {
      console.error("Error loading words:", error);
      setToast({ 
        type: "error", 
        message: "Failed to load words. Please refresh." 
      });
    } finally {
      setLoading(false);
    }
  }, [lastDoc]);

  // ── Initial Load ──
  useEffect(() => {
    loadWords("first");
  }, [loadWords]);

  // ── Auto-clear toast ──
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── Stats ──
  const stats = useMemo<Stats>(() => {
    const categories = new Set(words.map((w) => w.category || "Uncategorized"));
    const byDifficulty = { Easy: 0, Medium: 0, Hard: 0 };
    
    words.forEach((w) => {
      const diff = w.difficulty as keyof typeof byDifficulty;
      if (diff && byDifficulty[diff] !== undefined) {
        byDifficulty[diff]++;
      }
    });

    return {
      total: totalWords || words.length,
      categories: categories.size,
      byDifficulty,
    };
  }, [words, totalWords]);

  // ── Filter & Sort ──
  const filteredWords = useMemo(() => {
    const key = search.toLowerCase().trim();
    let result = words;

    // Search
    if (key) {
      result = result.filter(
        (item) =>
          item.word.toLowerCase().includes(key) ||
          item.meaning.toLowerCase().includes(key) ||
          (item.category || "").toLowerCase().includes(key) ||
          (item.partOfSpeech || "").toLowerCase().includes(key)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const aVal = (a[sortField] || "").toLowerCase();
      const bVal = (b[sortField] || "").toLowerCase();
      
      if (sortOrder === "asc") {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });

    return result;
  }, [words, search, sortField, sortOrder]);

  // ── Toggle Select All ──
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredWords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWords.map((w) => w.id)));
    }
  };

  // ── Toggle Select One ──
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // ── Delete Single ──
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this word? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "words", id));
      setWords((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      setToast({ type: "success", message: "Word deleted successfully!" });
    } catch (error) {
      console.error("Delete error:", error);
      setToast({ type: "error", message: "Failed to delete word." });
    }
  };

  // ── Bulk Delete ──
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      setToast({ type: "info", message: "No words selected." });
      return;
    }

    if (!confirm(`Delete ${selectedIds.size} word(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "words", id));
      }
      
      setWords((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      setToast({ type: "success", message: `${selectedIds.size} word(s) deleted successfully!` });
    } catch (error) {
      console.error("Bulk delete error:", error);
      setToast({ type: "error", message: "Failed to delete selected words." });
    }
  };

  // ── Export CSV ──
  const exportCSV = () => {
    if (filteredWords.length === 0) {
      setToast({ type: "info", message: "No words to export." });
      return;
    }

    const headers = ["Word", "Meaning", "Example", "Category", "Part of Speech", "Difficulty"];
    const rows = filteredWords.map((w) => [
      w.word,
      w.meaning,
      w.example || "",
      w.category || "",
      w.partOfSpeech || "",
      w.difficulty || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wordhub-words-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setToast({ type: "success", message: "CSV exported successfully!" });
  };

  // ── Sort Handler ──
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // ── Get Difficulty Badge ──
  const getDifficultyBadge = (difficulty?: string) => {
    const colors = {
      Easy: "bg-green-600",
      Medium: "bg-yellow-600",
      Hard: "bg-red-600",
    };
    return colors[difficulty as keyof typeof colors] || "bg-gray-600";
  };

  // ============================
  // RENDER
  // ============================
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ── Toast Notification ── */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl max-w-md animate-slide-in ${
              toast.type === "success"
                ? "bg-green-600"
                : toast.type === "error"
                ? "bg-red-600"
                : "bg-blue-600"
            }`}
          >
            <p className="text-white font-medium">{toast.message}</p>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold">
              <span className="text-yellow-400">⚡ Admin</span>
              <span className="text-white"> Dashboard</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Manage your WordHub dictionary efficiently
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/add-word"
              className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-green-600/20"
            >
              ➕ Add Word
            </Link>
            <Link
              href="/bulk-import"
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-600/20"
            >
              📥 Bulk Import
            </Link>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-gray-400 text-sm">📚 Total Words</h3>
            <p className="text-3xl font-bold text-green-400 mt-2">{stats.total}</p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-gray-400 text-sm">📂 Categories</h3>
            <p className="text-3xl font-bold text-blue-400 mt-2">{stats.categories}</p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-gray-400 text-sm">🟢 Easy</h3>
            <p className="text-3xl font-bold text-green-400 mt-2">{stats.byDifficulty.Easy}</p>
          </div>
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-gray-400 text-sm">🔴 Hard</h3>
            <p className="text-3xl font-bold text-red-400 mt-2">{stats.byDifficulty.Hard}</p>
          </div>
        </div>

        {/* ── Search & Actions ── */}
        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Search words by name, meaning, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 px-5 py-4 rounded-xl font-bold transition"
              >
                🗑 Delete Selected ({selectedIds.size})
              </button>
            )}
            <button
              onClick={exportCSV}
              className="bg-purple-600 hover:bg-purple-700 px-5 py-4 rounded-xl font-bold transition"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* ── Words Table ── */}
        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
              <p className="text-gray-400 mt-4">Loading words...</p>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-xl">📭 No words found</p>
              <p className="text-gray-500 mt-2">Try adjusting your search or add a new word</p>
            </div>
          ) : (
            <>
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-800/90">
                  <tr>
                    <th className="p-4 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredWords.length && filteredWords.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-yellow-400"
                        aria-label="Select all words"
                      />
                    </th>
                    <th
                      className="p-4 text-left cursor-pointer hover:text-yellow-400 transition group"
                      onClick={() => handleSort("word")}
                    >
                      <span className="flex items-center gap-2">
                        Word
                        {sortField === "word" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </span>
                    </th>
                    <th
                      className="p-4 text-left cursor-pointer hover:text-yellow-400 transition group"
                      onClick={() => handleSort("meaning")}
                    >
                      <span className="flex items-center gap-2">
                        Meaning
                        {sortField === "meaning" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </span>
                    </th>
                    <th
                      className="p-4 text-left cursor-pointer hover:text-yellow-400 transition group"
                      onClick={() => handleSort("category")}
                    >
                      <span className="flex items-center gap-2">
                        Category
                        {sortField === "category" && (
                          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </span>
                    </th>
                    <th className="p-4 text-left">Difficulty</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWords.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-700 hover:bg-slate-800/70 transition group"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 accent-yellow-400"
                          aria-label={`Select ${item.word}`}
                        />
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/words/${item.id}`}
                          className="font-bold text-yellow-400 hover:underline"
                        >
                          {item.word}
                        </Link>
                      </td>
                      <td className="p-4 max-w-xs truncate text-gray-300">
                        {item.meaning}
                      </td>
                      <td className="p-4">
                        <span className="bg-blue-600/80 px-3 py-1 rounded-full text-xs font-medium">
                          {item.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`${getDifficultyBadge(item.difficulty)} px-3 py-1 rounded-full text-xs font-medium text-white`}>
                          {item.difficulty || "N/A"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/edit-word/${item.id}`}
                            className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1.5 rounded-lg text-sm font-bold transition text-black"
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-sm font-bold transition"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ── Pagination ── */}
              <div className="flex justify-between items-center p-4 border-t border-slate-700">
                <span className="text-gray-400 text-sm">
                  Showing {filteredWords.length} of {totalWords} words
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadWords("first")}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition disabled:opacity-50"
                    disabled={loading || words.length === 0}
                  >
                    ◀◀
                  </button>
                  <button
                    onClick={() => loadWords("prev")}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition disabled:opacity-50"
                    disabled={loading || words.length === 0}
                  >
                    ◀
                  </button>
                  <span className="px-4 py-2 bg-slate-800 rounded-lg">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => loadWords("next")}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition disabled:opacity-50"
                    disabled={loading || words.length < ITEMS_PER_PAGE}
                  >
                    ▶
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Bottom Navigation ── */}
        <div className="flex flex-wrap gap-4 justify-between items-center mt-8">
          <div className="text-gray-400 text-sm">
            Total Results:{" "}
            <span className="font-bold text-yellow-400">{filteredWords.length}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dictionary"
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-bold transition"
            >
              📚 Dictionary
            </Link>
            <Link
              href="/"
              className="bg-slate-700 hover:bg-slate-600 px-5 py-3 rounded-xl font-bold transition"
            >
              🏠 Home
            </Link>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-16 border-t border-slate-700 pt-8 text-center">
          <h3 className="text-2xl font-bold text-yellow-400">WordHub Admin</h3>
          <p className="text-gray-400 mt-2 text-sm">
            Manage your dictionary quickly and efficiently.
          </p>
          <p className="text-gray-500 text-xs mt-4">
            © {new Date().getFullYear()} WordHub Admin Panel • All rights reserved
          </p>
        </footer>
      </div>

      {/* ── Tailwind Animations ── */}
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
      `}</style>
    </main>
  );
}