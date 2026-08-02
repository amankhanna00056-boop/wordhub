"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
      <div>
        <h1 className="text-5xl font-extrabold text-yellow-400">
          📚 WordHub
        </h1>

        <p className="text-gray-400 mt-2 text-lg">
          Learn English Words Every Day
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/daily"
          className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-lg font-semibold transition"
        >
          📅 Daily Word
        </Link>

        <Link
          href="/favorites"
          className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-5 py-3 rounded-lg font-semibold transition"
        >
          ⭐ Favorites
        </Link>

        <Link
          href="/login"
          className="bg-green-500 hover:bg-green-600 px-5 py-3 rounded-lg font-semibold transition"
        >
          🔐 Admin Login
        </Link>
      </div>
    </header>
  );
}