"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "../../firebase";

interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string;
  category: string;
}

export default function AdminDashboard() {

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {

      const snapshot = await getDocs(
        collection(db, "words")
      );

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Word, "id">),
      }));

      data.sort((a, b) =>
        a.word.localeCompare(b.word)
      );

      setWords(data);

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);

    }
  };

  const filteredWords = useMemo(() => {

    const key = search.toLowerCase();

    if (!key) return words;

    return words.filter((item) =>

      item.word.toLowerCase().includes(key) ||

      item.meaning.toLowerCase().includes(key) ||

      item.category.toLowerCase().includes(key)

    );

  }, [words, search]);
    const totalCategories = new Set(
    words.map((w) => w.category)
  ).size;

  const handleDelete = async (id: string) => {

    const ok = confirm(
      "Are you sure you want to delete this word?"
    );

    if (!ok) return;

    try {

      await deleteDoc(doc(db, "words", id));

      setWords((prev) =>
        prev.filter((item) => item.id !== id)
      );

      alert("Word deleted successfully.");

    } catch (error) {

      console.error(error);

      alert("Delete failed.");

    }

  };

  return (

    <main className="min-h-screen bg-slate-950 text-white p-8">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-10">

          <div>

            <h1 className="text-5xl font-bold text-yellow-400">
              👨‍💻 Admin Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Manage your WordHub Dictionary
            </p>

          </div>

          <Link
            href="/bulk-import"
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-bold"
          >
            📥 Bulk Import
          </Link>

        </div>

        {/* Stats */}

        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-slate-800 rounded-xl p-6">

            <h3 className="text-gray-400">
              📚 Total Words
            </h3>

            <p className="text-4xl font-bold text-green-400 mt-3">
              {words.length}
            </p>

          </div>

          <div className="bg-slate-800 rounded-xl p-6">

            <h3 className="text-gray-400">
              📂 Categories
            </h3>

            <p className="text-4xl font-bold text-blue-400 mt-3">
              {totalCategories}
            </p>

          </div>

          <div className="bg-slate-800 rounded-xl p-6">

            <h3 className="text-gray-400">
              🔎 Showing
            </h3>

            <p className="text-4xl font-bold text-yellow-400 mt-3">
              {filteredWords.length}
            </p>

          </div>

        </div>

        {/* Search */}

        <div className="mt-10">

          <input
            type="text"
            placeholder="🔍 Search words..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full p-4 rounded-xl bg-slate-800 border border-slate-700"
          />

        </div>
                {/* Words Table */}

        <div className="mt-10 overflow-x-auto rounded-xl border border-slate-700">

          {loading ? (

            <div className="text-center py-16 text-2xl">
              Loading words...
            </div>

          ) : filteredWords.length === 0 ? (

            <div className="text-center py-16 text-gray-400 text-xl">
              No words found.
            </div>

          ) : (

            <table className="w-full">

              <thead className="bg-slate-800">

                <tr>

                  <th className="text-left p-4">Word</th>

                  <th className="text-left p-4">Meaning</th>

                  <th className="text-left p-4">Category</th>

                  <th className="text-center p-4">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredWords.map((item) => (

                  <tr
                    key={item.id}
                    className="border-t border-slate-700 hover:bg-slate-900 transition"
                  >

                    <td className="p-4 font-bold text-green-400">
                      {item.word}
                    </td>

                    <td className="p-4 max-w-md truncate">
                      {item.meaning}
                    </td>

                    <td className="p-4">

                      <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                        {item.category}
                      </span>

                    </td>

                    <td className="p-4">

                      <div className="flex justify-center gap-3">

                        <Link
                          href={`/edit-word/${item.id}`}
                          className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg font-bold"
                        >
                          ✏ Edit
                        </Link>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold"
                        >
                          🗑 Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          )}

        </div>
                {/* Bottom Buttons */}

        <div className="flex flex-wrap gap-4 justify-between items-center mt-10">

          <div className="text-gray-400">
            Total Results:
            <span className="ml-2 font-bold text-yellow-400">
              {filteredWords.length}
            </span>
          </div>

          <div className="flex gap-3">

            <Link
              href="/dictionary"
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-lg font-bold transition"
            >
              📚 Dictionary
            </Link>

            <Link
              href="/add-word"
              className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-lg font-bold transition"
            >
              ➕ Add Word
            </Link>

            <Link
              href="/"
              className="bg-slate-700 hover:bg-slate-600 px-5 py-3 rounded-lg font-bold transition"
            >
              🏠 Home
            </Link>

          </div>

        </div>

        {/* Footer */}

        <footer className="mt-16 border-t border-slate-700 pt-8 text-center">

          <h3 className="text-2xl font-bold text-yellow-400">
            WordHub Admin
          </h3>

          <p className="text-gray-400 mt-3">
            Manage your dictionary quickly and efficiently.
          </p>

          <p className="text-gray-500 text-sm mt-5">
            © {new Date().getFullYear()} WordHub Admin Panel
          </p>

        </footer>

      </div>

    </main>

  );
}