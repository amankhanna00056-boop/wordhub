"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditWordPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [example, setExample] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWord();
  }, []);

  const fetchWord = async () => {
    try {
      const docRef = doc(db, "words", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        setWord(data.word || "");
        setMeaning(data.meaning || "");
        setExample(data.example || "");
        setCategory(data.category || "");
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("Failed to load word");
    }
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "words", id), {
        word,
        meaning,
        example,
        category,
      });

      alert("Word Updated Successfully!");

      router.push("/words");
    } catch (error) {
      console.error(error);
      alert("Update Failed");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl w-[450px]">

        <h1 className="text-3xl font-bold text-yellow-400 text-center mb-8">
          ✏️ Edit Word
        </h1>

        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Word"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white"
        />

        <input
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="Meaning"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white"
        />

        <input
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="Example"
          className="w-full p-3 mb-4 rounded bg-slate-700 text-white"
        />

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="w-full p-3 mb-6 rounded bg-slate-700 text-white"
        />

        <button
          onClick={handleUpdate}
          className="w-full bg-green-500 hover:bg-green-600 py-3 rounded-lg font-bold"
        >
          💾 Save Changes
        </button>

      </div>
    </main>
  );
}