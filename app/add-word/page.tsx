"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// ============================
// UTILITY FUNCTIONS
// ============================
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ============================
// TYPES
// ============================
interface FormData {
  word: string;
  meaning: string;
  example: string;
  category: string;
  partOfSpeech: string;
  pronunciation: string;
  synonyms: string;
  antonyms: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

// ============================
// MAIN COMPONENT
// ============================
export default function AddWordPage() {
  const router = useRouter();
  const wordInputRef = useRef<HTMLInputElement>(null);

  // ── State ──
  const [formData, setFormData] = useState<FormData>({
    word: "",
    meaning: "",
    example: "",
    category: "",
    partOfSpeech: "",
    pronunciation: "",
    synonyms: "",
    antonyms: "",
    difficulty: "Easy",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ── Auto-focus on mount ──
  useEffect(() => {
    wordInputRef.current?.focus();
  }, []);

  // ── Auto-clear success message ──
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ── Auto-clear error message ──
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ── Handle Input Change ──
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    // Clear errors on change
    if (error) setError("");
  };

  // ── Handle Blur (for validation) ──
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // ── Validation ──
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.word.trim()) {
      errors.push("Word is required");
    } else if (formData.word.length > 50) {
      errors.push("Word must be less than 50 characters");
    }

    if (!formData.meaning.trim()) {
      errors.push("Meaning is required");
    } else if (formData.meaning.length > 500) {
      errors.push("Meaning must be less than 500 characters");
    }

    if (formData.example.length > 500) {
      errors.push("Example must be less than 500 characters");
    }

    if (formData.category.length > 50) {
      errors.push("Category must be less than 50 characters");
    }

    if (formData.partOfSpeech.length > 30) {
      errors.push("Part of Speech must be less than 30 characters");
    }

    if (formData.pronunciation.length > 50) {
      errors.push("Pronunciation must be less than 50 characters");
    }

    // Check for duplicate words (basic check)
    if (formData.word.trim().toLowerCase() === formData.word.trim()) {
      // Allow mixed case but store as is
    }

    if (errors.length > 0) {
      setError(errors[0]);
      return false;
    }

    return true;
  };

  // ── Save Word ──
  const saveWord = async () => {
    // Reset messages
    setError("");
    setSuccess("");

    // Validate
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare synonyms & antonyms arrays
      const synonymsArray = formData.synonyms
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const antonymsArray = formData.antonyms
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Save to Firestore
      await addDoc(collection(db, "words"), {
        word: formData.word.trim(),
        slug: createSlug(formData.word),
        meaning: formData.meaning.trim(),
        example: formData.example.trim(),
        category: formData.category.trim(),
        partOfSpeech: formData.partOfSpeech.trim(),
        pronunciation: formData.pronunciation.trim(),
        synonyms: synonymsArray,
        antonyms: antonymsArray,
        difficulty: formData.difficulty,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Success
      setSuccess("✅ Word saved successfully!");

      // Reset form
      setFormData({
        word: "",
        meaning: "",
        example: "",
        category: "",
        partOfSpeech: "",
        pronunciation: "",
        synonyms: "",
        antonyms: "",
        difficulty: "Easy",
      });
      setTouched({});

      // Refocus on word input
      wordInputRef.current?.focus();

    } catch (err: any) {
      console.error("Firestore Error:", err);
      setError(
        err.code === "permission-denied"
          ? "You don't have permission to add words. Please login."
          : err.code === "unavailable"
          ? "Network error. Please check your connection."
          : "Failed to save word. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Enter Key ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveWord();
    }
  };

  // ============================
  // RENDER
  // ============================
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700 p-6 md:p-8">
        
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-yellow-400">
              Add New Word
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Contribute to the WordHub dictionary
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-slate-400 hover:text-white transition text-sm"
          >
            ← Back
          </button>
        </div>

        {/* ── Success Message ── */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm animate-fade-in">
            {success}
          </div>
        )}

        {/* ── Error Message ── */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        {/* ── Form ── */}
        <div className="space-y-4" onKeyDown={handleKeyDown}>
          
          {/* Word (Required) */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Word <span className="text-red-400">*</span>
            </label>
            <input
              ref={wordInputRef}
              name="word"
              value={formData.word}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter the word (e.g., Serendipity)"
              className={`w-full p-3 rounded-lg bg-slate-700/70 text-white placeholder:text-slate-400 border ${
                touched.word && !formData.word.trim()
                  ? "border-red-500"
                  : "border-slate-600"
              } focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all`}
              disabled={loading}
              maxLength={50}
            />
            <p className="text-slate-500 text-xs mt-1">
              {formData.word.length}/50 characters
            </p>
          </div>

          {/* Meaning (Required) */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Meaning <span className="text-red-400">*</span>
            </label>
            <input
              name="meaning"
              value={formData.meaning}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Define the word (e.g., The occurrence of happy accidents)"
              className={`w-full p-3 rounded-lg bg-slate-700/70 text-white placeholder:text-slate-400 border ${
                touched.meaning && !formData.meaning.trim()
                  ? "border-red-500"
                  : "border-slate-600"
              } focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all`}
              disabled={loading}
              maxLength={500}
            />
          </div>

          {/* Example Sentence */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Example Sentence
            </label>
            <input
              name="example"
              value={formData.example}
              onChange={handleChange}
              placeholder="Show how it's used (e.g., Finding that job was pure serendipity)"
              className="w-full p-3 rounded-lg bg-slate-700/70 text-white placeholder:text-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
              disabled={loading}
              maxLength={500}
            />
          </div>

          {/* Two-column layout for smaller fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Category
              </label>
              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Science, Love, Business"
                className="w-full p-3 rounded-lg bg-slate-700/70 text-white placeholder:text-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                disabled={loading}
                maxLength={50}
              />
            </div>

            {/* Part of Speech */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Part of Speech
              </label>
              <input
                name="partOfSpeech"
                value={formData.partOfSpeech}
                onChange={handleChange}
                placeholder="e.g., Noun, Verb, Adjective"
                className="w-full p-3 rounded-lg bg-slate-700/70 text-white placeholder:text-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                disabled={loading}
                maxLength={30}
              />
            </div>
          </div>

          {/* Pronunciation */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Pronunciation
            </label>
            <input
              name="pronunciation"
              value={formData.pronunciation}
              onChange={handleChange}
              placeholder="e.g., /ˈsɛrənˈdɪpɪti/"
              className="w-full p-3 rounded-lg bg-slate-700/70 text-white placeholder:text-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
              disabled={loading}
              maxLength={50}
            />
          </div>

          {/* Two-column for Synonyms & Antonyms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Synonyms
              </label>
              <input
                name="synonyms"
                value={formData.synonyms}
                onChange={handleChange}
                placeholder="Happy, Lucky, Fortunate"
                className="w-full p-3 rounded-lg bg-slate-700/70 text-white placeholder:text-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                Antonyms
              </label>
              <input
                name="antonyms"
                value={formData.antonyms}
                onChange={handleChange}
                placeholder="Unlucky, Misfortune"
                className="w-full p-3 rounded-lg bg-slate-700/70 text-white placeholder:text-slate-400 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              Difficulty Level
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-slate-700/70 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
              disabled={loading}
            >
              <option value="Easy">🟢 Easy</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Hard">🔴 Hard</option>
            </select>
          </div>

          {/* ── Submit Button ── */}
          <button
            onClick={saveWord}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-yellow-400 text-slate-900 py-3 rounded-lg font-bold hover:from-yellow-400 hover:to-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              "📚 Save Word"
            )}
          </button>

          {/* ── Form Footer ── */}
          <p className="text-center text-slate-500 text-xs mt-4">
            Fields marked with <span className="text-red-400">*</span> are required
          </p>
        </div>
      </div>

      {/* ── Tailwind Animation ── */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </main>
  );
}