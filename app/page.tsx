import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-yellow-400">
          WordHub
        </h1>

        <p className="mt-4 text-xl text-gray-300">
          Welcome to the world's best word puzzle website.
        </p>

        <button className="mt-8 px-8 py-4 bg-yellow-500 text-black rounded-xl text-xl font-bold hover:bg-yellow-400">
          Play Daily Puzzle
        </button>
      </main>
    </>
  );
}