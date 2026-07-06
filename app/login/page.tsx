export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl w-96">
        <h1 className="text-3xl font-bold text-yellow-400 text-center">
          Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mt-6 p-3 rounded-lg bg-slate-700 text-white"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mt-4 p-3 rounded-lg bg-slate-700 text-white"
        />

        <button className="w-full mt-6 bg-yellow-500 text-black py-3 rounded-lg font-bold hover:bg-yellow-400">
          Login
        </button>
      </div>
    </main>
  );
}