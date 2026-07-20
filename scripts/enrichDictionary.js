const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  limit,
  query,
} = require("firebase/firestore");

// ===========================
// Firebase Config
// ===========================

const firebaseConfig = {
  apiKey: "AIzaSyAt1CUSMK62QX1Zw_H4K8GNTlRUZnQ7JFc",
  authDomain: "wordhub-cc399.firebaseapp.com",
  projectId: "wordhub-cc399",
  storageBucket: "wordhub-cc399.firebasestorage.app",
  messagingSenderId: "983446214378",
  appId: "1:983446214378:web:43406b6db4788040e92993",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===========================
// Delay
// ===========================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===========================
// Fetch Dictionary API
// ===========================

async function fetchWord(word) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        word
      )}`
    );

    if (!res.ok) return null;

    const data = await res.json();

    if (!Array.isArray(data)) return null;

    return data[0];
  } catch (err) {
    console.log("API Error:", word);
    return null;
  }
}
// ===========================
// Main Function
// ===========================

async function enrichDictionary() {
  console.log("📚 Loading words from Firestore...\n");

  const snapshot = await getDocs(
    query(
      collection(db, "words"),
      limit(100)
    )
  );

  console.log(`✅ Total words found: ${snapshot.size}\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of snapshot.docs) {
    const data = item.data();

    // Skip already enriched words
    if (data.meaning && data.meaning !== "") {
      skipped++;
      continue;
    }

    console.log(`🔎 Fetching: ${data.word}`);

    const api = await fetchWord(data.word);

    if (!api) {
      failed++;
      continue;
    }

    try {
      const firstMeaning = api.meanings?.[0];

      const definition =
        firstMeaning?.definitions?.[0]?.definition || "";

      const example =
        firstMeaning?.definitions?.[0]?.example || "";

      const partOfSpeech =
        firstMeaning?.partOfSpeech || "";

      const pronunciation =
        api.phonetic ||
        api.phonetics?.find((p) => p.text)?.text ||
        "";

      const synonyms =
        firstMeaning?.synonyms || [];

      const antonyms =
        firstMeaning?.antonyms || [];

      await updateDoc(
  doc(db, "words", item.id),
  {
    meaning: definition,
    example: example,
    pronunciation: pronunciation,
    partOfSpeech: partOfSpeech,
    synonyms: Array.isArray(synonyms) ? synonyms : [],
    antonyms: Array.isArray(antonyms) ? antonyms : [],
    category: detectCategory(partOfSpeech),
  }
);


      updated++;

      console.log(`✅ Updated: ${data.word}`);

    } catch (err) {
      failed++;

      console.log(`❌ Failed: ${data.word}`);
    }

    // Prevent API rate limiting
    await sleep(300);
  }

  console.log("\n==============================");
  console.log(`✅ Updated : ${updated}`);
  console.log(`⏭️ Skipped : ${skipped}`);
  console.log(`❌ Failed : ${failed}`);
}
// ===========================
// Auto Category
// ===========================

function detectCategory(partOfSpeech) {
  if (!partOfSpeech) return "General";

  switch (partOfSpeech.toLowerCase()) {
    case "noun":
      return "Nouns";

    case "verb":
      return "Verbs";

    case "adjective":
      return "Adjectives";

    case "adverb":
      return "Adverbs";

    case "pronoun":
      return "Pronouns";

    case "preposition":
      return "Prepositions";

    case "conjunction":
      return "Conjunctions";

    case "interjection":
      return "Interjections";

    default:
      return "General";
  }
}
// ===========================
// Run Script
// ===========================

enrichDictionary()
  .then(() => {
    console.log("\n🎉 Dictionary enrichment completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });