"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAt,
  endAt,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
} from "firebase/firestore";
import { StarIcon as SolidStar } from "@heroicons/react/24/solid";
import { StarIcon as OutlineStar } from "@heroicons/react/24/outline";

// ============================
// WORD CACHE (Memory)
// ============================
class WordCache {
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static TIMEOUT = 10 * 60 * 1000; // 10 minutes

  static get(key: string) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.TIMEOUT) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  static set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static clear() {
    this.cache.clear();
  }
}

// ============================
// TYPES
// ============================
interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
  difficulty?: string;
}

// ============================
// SKELETON LOADING
// ============================
const WordSkeleton = () => (
  <div className="bg-slate-800 rounded-xl p-6 animate-pulse">
    <div className="h-8 bg-slate-700 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
    <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
    <div className="flex justify-between items-center">
      <div className="h-6 w-6 bg-slate-700 rounded-full"></div>
      <div className="h-6 w-20 bg-slate-700 rounded-full"></div>
      <div className="h-10 w-20 bg-slate-700 rounded-lg"></div>
    </div>
  </div>
);

// ============================
// WORD CARD - Memoized
// ============================
const WordCard = React.memo(({ 
  item, 
  isFavorite, 
  onToggleFavorite, 
  onView 
}: { 
  item: Word; 
  isFavorite: boolean; 
  onToggleFavorite: (word: string) => void; 
  onView: (word: string) => void;
}) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg hover:bg-slate-700 transition duration-300">
      <h2
        onClick={() => onView(item.word)}
        className="text-3xl font-extrabold text-green-400 cursor-pointer hover:text-yellow-400 transition"
      >
        {item.word}
      </h2>
      <p className="mt-4 text-base">
        <span className="font-bold text-yellow-300 text-lg">Meaning:</span>
        <br />
        <span className="text-gray-200 font-medium">{item.meaning}</span>
      </p>
      <p className="mt-4 text-base">
        <span className="font-bold text-yellow-300 text-lg">Example:</span>
        <br />
        <span className="text-gray-300 font-medium">
          {item.example || "No example available"}
        </span>
      </p>
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => onToggleFavorite(item.word)}
          className="p-2 rounded-full hover:bg-slate-700 transition cursor-pointer"
        >
          {isFavorite ? (
            <SolidStar className="w-6 h-6 text-yellow-400" />
          ) : (
            <OutlineStar className="w-6 h-6 text-gray-400 hover:text-yellow-400" />
          )}
        </button>
        <span className="bg-blue-600 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
          {item.category}
        </span>
        <button
          onClick={() => onView(item.word)}
          className="bg-green-500 hover:bg-green-600 px-5 py-2.5 rounded-lg font-bold text-base transition cursor-pointer"
        >
          View →
        </button>
      </div>
    </div>
  );
});

WordCard.displayName = 'WordCard';

// ============================
// MAIN COMPONENT
// ============================
export default function DictionaryPage() {
  const router = useRouter();

  // ── State ──
  const [words, setWords] = useState<Word[]>([]);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [displayWords, setDisplayWords] = useState<Word[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalWords, setTotalWords] = useState(0);
  const [isCacheUsed, setIsCacheUsed] = useState(false);
  
  // ── Refs ──
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const PAGE_SIZE = 15;
  const ITEMS_PER_LOAD = 10;

  // ── Load favorites ──
  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // ── Load total count only once ──
  useEffect(() => {
    const savedCount = localStorage.getItem('wordCount');
    if (savedCount) {
      setTotalWords(parseInt(savedCount));
    } else {
      getCountFromServer(collection(db, "words"))
        .then(snapshot => {
          const count = snapshot.data().count;
          setTotalWords(count);
          localStorage.setItem('wordCount', String(count));
        })
        .catch(() => {
          setTotalWords(0);
        });
    }
  }, []);

  // ── Load Words with Cache ──
  const loadWords = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedLetter("");
      lastDocRef.current = null;

      const cacheKey = 'words_first_page';
      const cachedData = WordCache.get(cacheKey);
      
      if (cachedData) {
        setWords(cachedData);
        setFilteredWords(cachedData);
        setDisplayWords(cachedData.slice(0, ITEMS_PER_LOAD));
        setIsCacheUsed(true);
        setHasMore(cachedData.length === PAGE_SIZE);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "words"),
        orderBy("word"),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      WordCache.set(cacheKey, data);

      setWords(data);
      setFilteredWords(data);
      setDisplayWords(data.slice(0, ITEMS_PER_LOAD));
      setIsCacheUsed(false);

      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }

    } catch (err) {
      console.error("Error loading words:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Search Words ──
  const searchWords = useCallback(async (text: string) => {
    if (!text.trim()) {
      loadWords();
      return;
    }

    setLoading(true);

    try {
      const q = query(
        collection(db, "words"),
        orderBy("word"),
        startAt(text.toLowerCase()),
        endAt(text.toLowerCase() + "\uf8ff"),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      setWords(data);
      setFilteredWords(data);
      setDisplayWords(data.slice(0, ITEMS_PER_LOAD));
      setHasMore(false);
      setIsCacheUsed(false);

    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [loadWords]);

  // ── Filter by Letter ──
  const filterByLetter = useCallback(async (letter: string) => {
    setSelectedLetter(letter);
    setSearch("");
    setLoading(true);
    lastDocRef.current = null;

    try {
      const cacheKey = `letter_${letter}`;
      const cachedData = WordCache.get(cacheKey);
      
      if (cachedData) {
        setWords(cachedData);
        setFilteredWords(cachedData);
        setDisplayWords(cachedData.slice(0, ITEMS_PER_LOAD));
        setIsCacheUsed(true);
        setHasMore(cachedData.length === PAGE_SIZE);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "words"),
        orderBy("word"),
        startAt(letter.toLowerCase()),
        endAt(letter.toLowerCase() + "\uf8ff"),
        limit(PAGE_SIZE)
      );

      let snapshot = await getDocs(q);
      let data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      if (data.length === 0) {
        const qUpper = query(
          collection(db, "words"),
          orderBy("word"),
          startAt(letter.toUpperCase()),
          endAt(letter.toUpperCase() + "\uf8ff"),
          limit(PAGE_SIZE)
        );
        snapshot = await getDocs(qUpper);
        data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Word, "id">),
        }));
      }

      WordCache.set(cacheKey, data);

      setWords(data);
      setFilteredWords(data);
      setDisplayWords(data.slice(0, ITEMS_PER_LOAD));
      setIsCacheUsed(false);

      if (data.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(data.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }

    } catch (err) {
      console.error("Letter filter error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load More ──
  const loadMore = useCallback(async () => {
    if (!lastDocRef.current || loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      let q;
      
      if (selectedLetter) {
        q = query(
          collection(db, "words"),
          orderBy("word"),
          startAfter(lastDocRef.current),
          startAt(selectedLetter.toLowerCase()),
          endAt(selectedLetter.toLowerCase() + "\uf8ff"),
          limit(PAGE_SIZE)
        );
      } else {
        q = query(
          collection(db, "words"),
          orderBy("word"),
          startAfter(lastDocRef.current),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      if (data.length > 0) {
        setWords(prev => [...prev, ...data]);
        setFilteredWords(prev => [...prev, ...data]);
        setDisplayWords(prev => [...prev, ...data.slice(0, ITEMS_PER_LOAD)]);
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(data.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }

    } catch (err) {
      console.error("Load more error:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, selectedLetter]);

  // ── Intersection Observer ──
  useEffect(() => {
    if (loading) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore, loadMore]);

  // ── Toggle Favorite ──
  const toggleFavorite = useCallback((word: string) => {
    setFavorites(prev => {
      const updated = prev.includes(word) 
        ? prev.filter(w => w !== word)
        : [...prev, word];
      localStorage.setItem("favorites", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Navigate ──
  const navigateToWord = useCallback((word: string) => {
    router.push(`/dictionary/${encodeURIComponent(word)}`);
  }, [router]);

  // ── Handle Search with Debounce ──
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSelectedLetter("");
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        searchWords(value);
      } else {
        loadWords();
      }
    }, 400);
  };

  // ── Handle Letter Click ──
  const handleLetterClick = (letter: string) => {
    if (selectedLetter === letter.toLowerCase()) {
      setSelectedLetter("");
      loadWords();
    } else {
      filterByLetter(letter);
    }
  };

  // ── Memoized Filtered Words ──
  const filteredAndSearchedWords = useMemo(() => {
    if (showFavoritesOnly) {
      return words.filter(item => favorites.includes(item.word));
    }
    return words;
  }, [words, showFavoritesOnly, favorites]);

  // ── Alphabet ──
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-6 px-4 md:py-10 md:px-5">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-yellow-400 tracking-wide">
            📚 WordHub
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">
            {totalWords.toLocaleString()} words • Fast • Free
            {isCacheUsed && (
              <span className="ml-2 text-green-400 text-xs bg-green-500/20 px-2 py-0.5 rounded-full">
                ⚡ Cached
              </span>
            )}
          </p>
        </div>

        {/* ── Search Bar ── */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search any word..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-800/80 backdrop-blur-sm border-2 border-slate-700 text-base md:text-lg font-medium placeholder:text-gray-500 text-white focus:outline-none focus:border-yellow-400 transition-all shadow-xl"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                loadWords();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition text-xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Alphabet Filter ── */}
        <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className={`w-8 h-8 md:w-9 md:h-9 rounded-lg font-bold transition-all duration-200 cursor-pointer text-xs md:text-sm ${
                selectedLetter === letter.toLowerCase()
                  ? "bg-green-500 text-white scale-110 shadow-lg shadow-green-500/30"
                  : "bg-slate-700 hover:bg-slate-600 hover:scale-105 text-gray-200"
              }`}
            >
              {letter}
            </button>
          ))}
          <button
            onClick={() => {
              setSelectedLetter("");
              setSearch("");
              loadWords();
            }}
            className="px-3 md:px-4 h-8 md:h-9 rounded-lg bg-red-500 hover:bg-red-600 transition cursor-pointer font-bold text-xs md:text-sm"
          >
            All
          </button>
        </div>

        {/* ── Stats Bar ── */}
        <div className="mt-4 flex flex-wrap justify-between items-center gap-3 bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl border border-slate-700">
          <div className="text-gray-400 text-xs md:text-sm">
            <span className="text-yellow-400 font-bold">{filteredAndSearchedWords.length}</span> words
            {selectedLetter && (
              <span className="ml-2 text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full text-xs">
                📖 {selectedLetter.toUpperCase()}
              </span>
            )}
            {showFavoritesOnly && (
              <span className="ml-2 text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded-full text-xs">
                ⭐ Favorites
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-yellow-400 text-xs md:text-sm font-medium">
              ⭐ {favorites.length}
            </span>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-3 py-1.5 rounded-lg font-medium transition text-xs md:text-sm cursor-pointer ${
                showFavoritesOnly
                  ? "bg-yellow-400 text-slate-900"
                  : "bg-slate-700 text-white hover:bg-slate-600"
              }`}
            >
              {showFavoritesOnly ? "⭐ All" : "☆ Fav"}
            </button>
          </div>
        </div>

        {/* ── Word Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <WordSkeleton key={i} />
            ))
          ) : filteredAndSearchedWords.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-400 text-lg font-medium">
                {selectedLetter ? (
                  <>
                    No words starting with <span className="text-yellow-400 font-bold">"{selectedLetter.toUpperCase()}"</span>
                  </>
                ) : showFavoritesOnly ? (
                  "No favorites yet"
                ) : (
                  "No words found"
                )}
              </p>
              {selectedLetter && (
                <button
                  onClick={() => {
                    setSelectedLetter("");
                    loadWords();
                  }}
                  className="mt-4 bg-yellow-400 text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-yellow-300 transition text-sm"
                >
                  Show All
                </button>
              )}
            </div>
          ) : (
            displayWords.map((item) => (
              <WordCard
                key={item.id}
                item={item}
                isFavorite={favorites.includes(item.word)}
                onToggleFavorite={toggleFavorite}
                onView={navigateToWord}
              />
            ))
          )}
        </div>

        {/* ── Load More ── */}
        {!loading && hasMore && filteredAndSearchedWords.length > 0 && (
          <div ref={loadMoreRef} className="mt-6 text-center py-3">
            {loadingMore ? (
              <div className="flex justify-center items-center gap-3 text-gray-400 text-sm">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-yellow-400 border-t-transparent"></div>
                Loading...
              </div>
            ) : (
              <div className="text-gray-500 text-xs">Scroll for more ⬇️</div>
            )}
          </div>
        )}

        {/* ── End Message ── */}
        {!hasMore && !loading && filteredAndSearchedWords.length > 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">
              🎯 You've seen all {filteredAndSearchedWords.length} words
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-12 border-t border-slate-700/50 pt-6 text-center">
          <p className="text-gray-500 text-xs">
            WordHub Dictionary • {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </main>
  );
}