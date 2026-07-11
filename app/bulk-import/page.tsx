"use client";

import { useState } from "react";
import Papa from "papaparse";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

interface WordRow {
  word: string;
  meaning: string;
  example: string;
  category: string;
}

export default function BulkImportPage() {
  const [csvData, setCsvData] = useState<WordRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    Papa.parse<WordRow>(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        setCsvData(results.data);
      },

      error: () => {
        alert("CSV Read Failed");
      },
    });
  };

  const importWords = async () => {
    if (csvData.length === 0) {
      alert("Please select CSV file.");
      return;
    }

    setLoading(true);

    try {
      for (const item of csvData) {
        await addDoc(collection(db, "words"), {
          word: item.word,
          meaning: item.meaning,
          example: item.example,
          category: item.category,
          createdAt: serverTimestamp(),
        });
      }

      alert(`${csvData.length} words imported successfully!`);

      setCsvData([]);

    } catch (error) {
      console.error(error);
      alert("Import Failed");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex justify-center items-center">

      <div className="bg-slate-800 w-[700px] rounded-xl p-8 shadow-xl">

        <h1 className="text-4xl font-bold text-center text-yellow-400">
          📥 Bulk Import Words
        </h1>

        <p className="text-center text-gray-400 mt-2">
          Upload CSV file and import all words instantly.
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          className="mt-8 w-full bg-slate-700 p-3 rounded-lg"
        />

        <p className="mt-5">
          Selected Words:
          <span className="font-bold text-green-400 ml-2">
            {csvData.length}
          </span>
        </p>
                {csvData.length > 0 && (
          <div className="mt-8">

            <h2 className="text-2xl font-bold mb-4 text-yellow-400">
              CSV Preview
            </h2>

            <div className="overflow-y-auto max-h-80 border border-slate-700 rounded-lg">

              <table className="w-full">

                <thead className="bg-slate-700 sticky top-0">

                  <tr>
                    <th className="p-3 text-left">Word</th>
                    <th className="p-3 text-left">Meaning</th>
                    <th className="p-3 text-left">Category</th>
                  </tr>

                </thead>

                <tbody>

                  {csvData.map((item, index) => (

                    <tr
                      key={index}
                      className="border-b border-slate-700 hover:bg-slate-700"
                    >

                      <td className="p-3">
                        {item.word}
                      </td>

                      <td className="p-3">
                        {item.meaning}
                      </td>

                      <td className="p-3">
                        {item.category}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <button
              onClick={importWords}
              disabled={loading}
              className="mt-8 w-full bg-green-500 hover:bg-green-600 py-3 rounded-lg font-bold disabled:bg-gray-500"
            >
              {loading
                ? "⏳ Importing..."
                : `🚀 Import ${csvData.length} Words`}
            </button>

          </div>
        )}

      </div>

    </main>
  );
}