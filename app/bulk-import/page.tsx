"use client";

import { useState } from "react";
import Papa from "papaparse";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
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
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [failed, setFailed] = useState(0);
const [dragActive, setDragActive] = useState(false);
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
    setProgress(0);
    setImported(0);
    setSkipped(0);
    setFailed(0);

    try {
      const snapshot = await getDocs(collection(db, "words"));
      const existingWords = new Set(
        snapshot.docs.map((doc) =>
          String(doc.data().word).toLowerCase().trim()
        )
      );

      let importedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < csvData.length; i++) {
        const item = csvData[i];
        const word = item.word.toLowerCase().trim();

        try {
          if (existingWords.has(word)) {
            skippedCount++;
            continue;
          }

          await addDoc(collection(db, "words"), {
            
            word: item.word,
            meaning: item.meaning,
            example: item.example,
            category: item.category,
            createdAt: serverTimestamp(),
          });
setImported((prev) => {
  const newCount = prev + 1;

  setProgress(
    Math.round((newCount / csvData.length) * 100)
  );

  return newCount;
});
          existingWords.add(word);
          importedCount++;
        } catch (err) {
          failedCount++;
          console.error("Failed to import word:", item.word, err);
        }

        // Update progress
        const percent = Math.round(((i + 1) / csvData.length) * 100);
        setProgress(percent);
        setImported(importedCount);
        setSkipped(skippedCount);
        setFailed(failedCount);
      }

      alert(
        `✅ Import Complete!\n\n` +
        `📥 Imported: ${importedCount}\n` +
        `⏭️ Skipped: ${skippedCount}\n` +
        `❌ Failed: ${failedCount}`
      );

      setCsvData([]);
      setProgress(100);

alert(`${csvData.length} words imported successfully!`);

    } catch (error) {
      console.error(error);
      alert("❌ Import Failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex justify-center items-center p-4">

      <div className="bg-slate-800 w-full max-w-[700px] rounded-xl p-8 shadow-xl">

        <h1 className="text-4xl font-bold text-center text-yellow-400">
          📥 Bulk Import Words
        </h1>

        <p className="text-center text-gray-400 mt-2">
          Upload CSV file and import all words instantly.
        </p>

        <div
  onDragOver={(e) => {
    e.preventDefault();
    setDragActive(true);
  }}
  onDragLeave={() => setDragActive(false)}
  onDrop={(e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];

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
  }}
  className={`mt-8 border-2 border-dashed rounded-xl p-10 text-center transition ${
    dragActive
      ? "border-green-400 bg-slate-700"
      : "border-slate-500 bg-slate-800"
  }`}
>

  <p className="text-xl font-semibold">
    📂 Drag & Drop CSV File Here
  </p>

  <p className="text-gray-400 mt-2">
    or
  </p>

  <input
    type="file"
    accept=".csv"
    onChange={handleFile}
    className="mt-4"
  />

</div>

        <p className="mt-5">
          Selected Words:
          <span className="font-bold text-green-400 ml-2">
            {csvData.length}
          </span>
        </p>

        {loading && (
          <div className="mt-6 bg-slate-700 rounded-xl p-4">

            <div className="flex justify-between mb-2">
              <span>Import Progress</span>
              <span>{progress}%</span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-3 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 text-center">

              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-green-400 font-bold text-xl">
                  {imported}
                </p>
                <p className="text-sm text-gray-400">Imported</p>
              </div>

              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-yellow-400 font-bold text-xl">
                  {skipped}
                </p>
                <p className="text-sm text-gray-400">Skipped</p>
              </div>

              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-red-400 font-bold text-xl">
                  {failed}
                </p>
                <p className="text-sm text-gray-400">Failed</p>
              </div>

            </div>

          </div>
        )}

        {csvData.length > 0 && (
          <div className="mt-8">

            <h2 className="text-2xl font-bold mb-4 text-yellow-400">
              CSV Preview
            </h2>
<p className="text-sm text-gray-400 mb-3">
  Showing first <b>10</b> rows of <b>{csvData.length}</b> total rows.
</p>
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

               {csvData.slice(0, 10).map((item, index) => (

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
              className="mt-8 w-full bg-green-500 hover:bg-green-600 py-3 rounded-lg font-bold disabled:bg-gray-500 disabled:cursor-not-allowed transition"
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