import Link from "next/link";
export default function Navbar() {
  return (
    <nav className="w-full bg-slate-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-yellow-400">
        WordHub
      </h1>

      <div className="space-x-6">
        <Link href="/" className="hover:text-yellow-400">
          Home
        </Link>

        <Link href="/daily" className="hover:text-yellow-400">
          Daily Puzzle
        </Link>

        <Link href="/about" className="hover:text-yellow-400">
          About
        </Link>

        <Link
          href="/login"
          className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400"
        >
          Login
        </Link>
      </div>
    </nav>
  );
}