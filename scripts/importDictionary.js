const fs = require("fs");
const path = require("path");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  doc,
  writeBatch,
  getDocs,
  serverTimestamp,
} = require("firebase/firestore");

// 🔴 APNI firebase.ts wali config ithon paste karni hai
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

const filePath = path.join(__dirname, "../public/dictionary.json");
const words = JSON.parse(fs.readFileSync(filePath, "utf8"));

async function importWords() {
  console.log(`📚 Total words in file: ${words.length}`);

  const snapshot = await getDocs(collection(db, "words"));
  const existing = new Set(
    snapshot.docs.map((d) => d.data().slug || d.data().word)
  );

  let imported = 0;
  let skipped = 0;

  let batch = writeBatch(db);
  let batchCount = 0;

  for (let i = 0; i < words.length; i++) {
    const item = words[i];

    if (existing.has(item.slug)) {
      skipped++;
      continue;
    }

    const ref = doc(collection(db, "words"));

    batch.set(ref, {
      ...item,
      startsWith: item.word.charAt(0).toLowerCase(),
      endsWith: item.word.slice(-1).toLowerCase(),
      length: item.word.length,
      createdAt: serverTimestamp(),
    });

    batchCount++;
    imported++;

    if (batchCount === 500) {
      await batch.commit();
      batch = writeBatch(db);
      batchCount = 0;
      console.log(`🚀 Imported: ${imported}`);
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log("=========================");
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log("🎉 Dictionary import complete!");
}

importWords().catch(console.error);
