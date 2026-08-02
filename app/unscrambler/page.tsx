"use client";

import { useEffect, useState, useMemo, useCallback, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

// ============================
// TYPES
// ============================
interface WordData {
  word: string;
  meaning?: string;
  category?: string;
}

type SortOption = "alphabetical" | "length" | "length-desc";
type FilterOption = "exact" | "contains" | "starts-with" | "ends-with";

// ============================
// MAIN COMPONENT
// ============================
export default function UnscramblerPage() {
  const router = useRouter();
  
  // ── State ──
  const [letters, setLetters] = useState("");
  const [allWords, setAllWords] = useState<string[]>([]);
  const [wordDataMap, setWordDataMap] = useState<Map<string, WordData>>(new Map());
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWords, setLoadingWords] = useState(false);
  const [minLength, setMinLength] = useState(3);
  const [maxLength, setMaxLength] = useState(15);
  const [sortBy, setSortBy] = useState<SortOption>("length");
  const [filterBy, setFilterBy] = useState<FilterOption>("exact");
  const [filterValue, setFilterValue] = useState("");
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [copied, setCopied] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const deferredLetters = useDeferredValue(letters);

  // ── Load Words ──
  useEffect(() => {
    loadWords();
    
    // Load search history
    const history = localStorage.getItem("unscrambler-history");
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const loadWords = async () => {
    setLoading(true);
    setLoadingWords(true);

    try {
      const snapshot = await getDocs(collection(db, "words"));
      
      const words: string[] = [];
      const dataMap = new Map<string, WordData>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const word = data.word;
        
        if (typeof word === "string" && word.trim()) {
          const normalized = word.toLowerCase().trim();
          words.push(normalized);
          
          dataMap.set(normalized, {
            word: normalized,
            meaning: data.meaning || "",
            category: data.category || "",
          });
        }
      });

      // Remove duplicates and sort
      const uniqueWords = [...new Set(words)].sort();
      setAllWords(uniqueWords);
      setWordDataMap(dataMap);
      
    } catch (error) {
      console.error("Error loading words:", error);
    } finally {
      setLoading(false);
      setLoadingWords(false);
    }
  };

  // ── Build Trie for fast searching ──
  const buildTrie = useCallback((words: string[]) => {
    const trie: any = {};
    
    for (const word of words) {
      let node = trie;
      for (const char of word) {
        if (!node[char]) node[char] = {};
        node = node[char];
      }
      node.isWord = true;
    }
    
    return trie;
  }, []);

  const trie = useMemo(() => {
    if (allWords.length === 0) return null;
    return buildTrie(allWords);
  }, [allWords, buildTrie]);

  // ── Get Word Suggestions (for partial matches) ──
  const getSuggestions = useCallback((prefix: string): string[] => {
    if (!trie || !prefix) return [];
    
    const results: string[] = [];
    let node = trie;
    
    for (const char of prefix.toLowerCase()) {
      if (!node[char]) return [];
      node = node[char];
    }
    
    const traverse = (n: any, current: string) => {
      if (n.isWord) results.push(current);
      for (const key of Object.keys(n)) {
        if (key !== "isWord") {
          traverse(n[key], current + key);
        }
      }
    };
    
    traverse(node, prefix);
    return results;
  }, [trie]);

  // ── Unscramble Words ──
  const unscrambleWords = useCallback(() => {
    if (!letters.trim()) {
      setResults([]);
      setTotalMatches(0);
      return;
    }

    setLoadingWords(true);

    const input = letters.toLowerCase().trim();
    const sortedInput = input.split("").sort().join("");

    // Save to history
    const history = [input, ...searchHistory.filter(h => h !== input)].slice(0, 10);
    setSearchHistory(history);
    localStorage.setItem("unscrambler-history", JSON.stringify(history));

    // Use a timeout to let UI update
    setTimeout(() => {
      let matched: string[] = [];

      // For short inputs, use exact matching
      if (input.length <= 10) {
        matched = allWords.filter((word) => {
          if (word.length < minLength || word.length > maxLength) return false;
          
          const sortedWord = word.split("").sort().join("");
          return sortedWord === sortedInput;
        });
      } else {
        // For longer inputs, check if word can be formed from letters
        const inputCharCount = new Map<string, number>();
        for (const char of input) {
          inputCharCount.set(char, (inputCharCount.get(char) || 0) + 1);
        }
        
        matched = allWords.filter((word) => {
          if (word.length < minLength || word.length > maxLength) return false;
          
          const wordCharCount = new Map<string, number>();
          for (const char of word) {
            wordCharCount.set(char, (wordCharCount.get(char) || 0) + 1);
          }
          
          for (const [char, count] of wordCharCount) {
            if ((inputCharCount.get(char) || 0) < count) return false;
          }
          
          return true;
        });
      }

      // Apply additional filters
      if (filterBy !== "exact" && filterValue) {
        const val = filterValue.toLowerCase();
        matched = matched.filter((word) => {
          if (filterBy === "contains") return word.includes(val);
          if (filterBy === "starts-with") return word.startsWith(val);
          if (filterBy === "ends-with") return word.endsWith(val);
          return true;
        });
      }

      // Sort
      matched = [...matched].sort((a, b) => {
        if (sortBy === "alphabetical") {
          return a.localeCompare(b);
        }
        if (sortBy === "length") {
          return a.length - b.length || a.localeCompare(b);
        }
        if (sortBy === "length-desc") {
          return b.length - a.length || a.localeCompare(b);
        }
        return 0;
      });

      setResults(matched);
      setTotalMatches(matched.length);
      setLoadingWords(false);
    }, 100);
  }, [letters, allWords, minLength, maxLength, sortBy, filterBy, filterValue, searchHistory]);

  // ── Auto-search on input change ──
  useEffect(() => {
    if (letters.trim().length >= 2) {
      unscrambleWords();
    } else {
      setResults([]);
      setTotalMatches(0);
    }
  }, [deferredLetters, minLength, maxLength, sortBy, filterBy, filterValue, unscrambleWords]);

  // ── Clear Search ──
  const clearSearch = () => {
    setLetters("");
    setResults([]);
    setTotalMatches(0);
    setFilterValue("");
  };

  // ── Handle Word Click (Show Definition) ──
  const handleWordClick = (word: string) => {
    const data = wordDataMap.get(word);
    if (data) {
      setSelectedWord(data);
    } else {
      // Try to find partial match
      router.push(`/dictionary/${encodeURIComponent(word)}`);
    }
  };

  // ── Copy Results ──
  const copyResults = () => {
    if (results.length === 0) return;
    
    const text = `🔤 Word Unscrambler Results (${results.length} words):\n\n${results.join(", ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Get Word Stats ──
  const stats = useMemo(() => {
    if (results.length === 0) return null;
    
    const shortest = results.reduce((a, b) => a.length <= b.length ? a : b);
    const longest = results.reduce((a, b) => a.length >= b.length ? a : b);
    const avgLength = Math.round(results.reduce((sum, w) => sum + w.length, 0) / results.length * 10) / 10;
    
    return { shortest, longest, avgLength };
  }, [results]);

  // ── Loading State ──
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent"></div>
          <p className="mt-6 text-xl text-slate-300 animate-pulse">Loading Dictionary...</p>
          <p className="text-sm text-slate-500 mt-2">Preparing {allWords.length} words</p>
        </div>
      </main>
    );
  }

  // ============================
  // RENDER
  // ============================
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-5xl font-extrabold">
                <span className="text-yellow-400">🔤</span>
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Word Unscrambler
                </span>
              </h1>
            </div>
            <p className="text-slate-400 mt-1">
              Enter scrambled letters and find all possible words
            </p>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/dictionary"
              className="bg-slate-700/50 hover:bg-slate-600/50 px-4 py-2 rounded-lg text-sm transition text-slate-300 border border-slate-600/50"
            >
              📖 Dictionary
            </Link>
            <Link
              href="/dashboard"
              className="bg-slate-700/50 hover:bg-slate-600/50 px-4 py-2 rounded-lg text-sm transition text-slate-300 border border-slate-600/50"
            >
              📊 Dashboard
            </Link>
          </div>
        </div>

        {/* ── Search Input ── */}
        <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 md:p-8">
          <div className="relative">
            <input
              type="text"
              value={letters}
              onChange={(e) => setLetters(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
              placeholder="Enter scrambled letters (e.g., aetlp)"
              className="w-full p-5 pr-24 rounded-xl bg-slate-900/60 border border-slate-700 text-xl md:text-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all uppercase tracking-wider"
              autoFocus
              maxLength={20}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
              {letters && (
                <button
                  onClick={clearSearch}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition"
                >
                  ✕
                </button>
              )}
              <span className="px-3 py-2 bg-slate-700/50 rounded-lg text-sm text-slate-400">
                {letters.length}/20
              </span>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="flex flex-wrap gap-2 mt-4">
            {["cat", "dog", "apple", "hello", "world", "python"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setLetters(suggestion)}
                className="px-3 py-1.5 bg-slate-700/30 hover:bg-slate-600/50 rounded-lg text-xs text-slate-400 hover:text-white transition border border-slate-700/30"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Min Length</label>
            <select
              value={minLength}
              onChange={(e) => setMinLength(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            >
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-xs text-slate-400 block mb-1">Max Length</label>
            <select
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            >
              {[5, 6, 7, 8, 9, 10, 12, 15, 20].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-xs text-slate-400 block mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            >
              <option value="length">Length (Shortest)</option>
              <option value="length-desc">Length (Longest)</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
          
          <div>
            <label className="text-xs text-slate-400 block mb-1">Filter By</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="w-full p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            >
              <option value="exact">Exact Match</option>
              <option value="contains">Contains</option>
              <option value="starts-with">Starts With</option>
              <option value="ends-with">Ends With</option>
            </select>
          </div>
        </div>

        {/* ── Filter Input ── */}
        {filterBy !== "exact" && (
          <div className="mt-4">
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder={`Enter text to filter by ${filterBy.replace("-", " ")}`}
              className="w-full p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            />
          </div>
        )}

        {/* ── Stats Bar ── */}
        {results.length > 0 && stats && (
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700/30">
              <p className="text-2xl font-bold text-yellow-400">{results.length}</p>
              <p className="text-xs text-slate-400">Found Words</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700/30">
              <p className="text-2xl font-bold text-emerald-400">{stats.shortest}</p>
              <p className="text-xs text-slate-400">Shortest</p>
            </div>
            <div className="bg-slate-800/30 rounded-xl p-4 text-center border border-slate-700/30">
              <p className="text-2xl font-bold text-blue-400">{stats.longest}</p>
              <p className="text-xs text-slate-400">Longest</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        <div className="mt-8 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
              <span>📋</span> Results
              {results.length > 0 && (
                <span className="text-sm text-slate-400 font-normal">
                  ({results.length} words)
                </span>
              )}
            </h2>
            
            <div className="flex gap-2">
              {results.length > 0 && (
                <button
                  onClick={copyResults}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition flex items-center gap-1"
                >
                  {copied ? "✅" : "📋"} {copied ? "Copied!" : "Copy All"}
                </button>
              )}
              {letters && (
                <button
                  onClick={clearSearch}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition text-red-400"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loadingWords ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-yellow-400 border-t-transparent"></div>
              <p className="ml-3 text-slate-400">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              {letters.trim() ? (
                <>
                  <p className="text-slate-400 text-lg">No words found with these letters</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Try adjusting the length filters or using different letters
                  </p>
                </>
              ) : (
                <>
                  <p className="text-slate-400 text-lg">Enter letters to start unscrambling</p>
                  <p className="text-slate-500 text-sm mt-2">
                    Type at least 2 letters above
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {results.map((word, index) => (
                <button
                  key={index}
                  onClick={() => handleWordClick(word)}
                  className="group bg-slate-800/60 hover:bg-slate-700/80 px-4 py-3 rounded-xl text-center transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-yellow-400/5 border border-slate-700/30 hover:border-yellow-400/30"
                >
                  <span className="text-lg font-medium text-emerald-400 group-hover:text-yellow-400 transition">
                    {word}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {word.length} letters
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Search History ── */}
        {searchHistory.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-slate-500 mb-2">Recent Searches:</p>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => setLetters(term)}
                  className="px-3 py-1.5 bg-slate-800/30 hover:bg-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-white transition border border-slate-700/30"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Word Detail Modal ── */}
        {selectedWord && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelectedWord(null)}
          >
            <div
              className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-bold text-yellow-400">
                  {selectedWord.word}
                </h2>
                <button
                  onClick={() => setSelectedWord(null)}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              
              {selectedWord.meaning && (
                <p className="text-slate-300 leading-relaxed">
                  {selectedWord.meaning}
                </p>
              )}
              
              {selectedWord.category && (
                <div className="mt-4">
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs">
                    {selectedWord.category}
                  </span>
                </div>
              )}
              
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    router.push(`/dictionary/${encodeURIComponent(selectedWord.word)}`);
                    setSelectedWord(null);
                  }}
                  className="flex-1 bg-yellow-500 text-slate-900 py-2 rounded-lg font-bold hover:bg-yellow-400 transition"
                >
                  📖 View Full
                </button>
                <button
                  onClick={() => setSelectedWord(null)}
                  className="flex-1 bg-slate-700 text-white py-2 rounded-lg hover:bg-slate-600 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-12 pt-6 border-t border-slate-700/50 text-center">
          <p className="text-slate-500 text-sm">
            🧩 Unscramble • Learn • Play
          </p>
          <p className="text-slate-600 text-xs mt-1">
            {allWords.length} words in dictionary • Find hidden words!
          </p>
        </footer>
      </div>
    </main>
  );
}