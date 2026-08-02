// ============================================
// WordHub Dictionary Enrichment Engine v4
// PART 1 - Setup & Configuration
// ============================================

const { initializeApp } = require("firebase/app");

const {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  writeBatch,
} = require("firebase/firestore");

const fs = require("fs");
const path = require("path");


// ============================================
// FIREBASE CONFIG
// ============================================

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


// ============================================
// CONFIGURATION
// ============================================

const BATCH_SIZE = 100;

const API_DELAY = 350;

const MAX_RETRY = 3;


// ============================================
// FILES
// ============================================

const PROGRESS_FILE = path.join(
  __dirname,
  "progress.json"
);


const FAILED_FILE = path.join(
  __dirname,
  "failedWords.json"
);


// ============================================
// DELAY
// ============================================

function sleep(ms) {

  return new Promise(
    resolve => setTimeout(resolve, ms)
  );

}


// ============================================
// RETRY SYSTEM
// ============================================

async function retry(
  fn,
  retries = MAX_RETRY
) {

  let lastError;


  for (
    let i = 0;
    i < retries;
    i++
  ) {

    try {

      return await fn();

    } catch(err) {

      lastError = err;

      console.log(
        `Retry ${i + 1}/${retries}`
      );


      await sleep(1000);

    }

  }


  throw lastError;

}


console.log("");

console.log(
"======================================"
);

console.log(
" WordHub Enrichment Engine V4"
);

console.log(
"======================================"
);

console.log("");
// ============================================
// PART 2
// FIRESTORE BATCH LOADER
// ============================================


async function loadWordsBatch(lastDoc = null) {

  let q;


  if (lastDoc) {

    q = query(
      collection(db, "words"),
      orderBy("word"),
      startAfter(lastDoc),
      limit(BATCH_SIZE)
    );

  } else {

    q = query(
      collection(db, "words"),
      orderBy("word"),
      limit(BATCH_SIZE)
    );

  }


  const snapshot = await getDocs(q);


  return snapshot;

}



// ============================================
// PROGRESS SAVE
// ============================================


function saveProgress(data) {


  fs.writeFileSync(

    PROGRESS_FILE,

    JSON.stringify(
      data,
      null,
      2
    )

  );


}



function loadProgress() {


  if (
    !fs.existsSync(PROGRESS_FILE)
  ) {

    return null;

  }


  try {


    return JSON.parse(

      fs.readFileSync(
        PROGRESS_FILE,
        "utf8"
      )

    );


  } catch {


    return null;


  }


}



// ============================================
// FAILED WORDS LOGGER
// ============================================


function saveFailedWord(word) {


  let failed = [];


  if (
    fs.existsSync(FAILED_FILE)
  ) {

    failed = JSON.parse(

      fs.readFileSync(
        FAILED_FILE,
        "utf8"
      )

    );

  }


  failed.push(word);


  fs.writeFileSync(

    FAILED_FILE,

    JSON.stringify(
      failed,
      null,
      2
    )

  );


}
// ============================================
// PART 3
// DICTIONARY API + DATAMUSE
// ============================================


// ============================================
// SAFE ARRAY
// ============================================

function uniqueArray(arr) {

  if (!Array.isArray(arr))
    return [];


  return [
    ...new Set(
      arr
        .map(x => String(x).trim())
        .filter(Boolean)
    )
  ];

}



// ============================================
// DICTIONARY API
// ============================================


async function fetchDictionary(word) {


  return retry(async () => {


    const res = await fetch(

      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`

    );


    if (!res.ok)
      return null;


    const json = await res.json();


    if (!Array.isArray(json))
      return null;


    return json[0];


  });


}



// ============================================
// DATAMUSE SYNONYMS
// ============================================


async function fetchSynonyms(word) {


  try {


    const res = await fetch(

      `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}`

    );


    if (!res.ok)
      return [];


    const json = await res.json();


    return uniqueArray(

      json.map(
        item => item.word
      )

    );


  } catch {


    return [];

  }


}



// ============================================
// DATAMUSE ANTONYMS
// ============================================


async function fetchAntonyms(word) {


  try {


    const res = await fetch(

      `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}`

    );


    if (!res.ok)
      return [];


    const json = await res.json();


    return uniqueArray(

      json.map(
        item => item.word
      )

    );


  } catch {


    return [];

  }


}



// ============================================
// EXTRACT MEANING
// ============================================


function extractMeaning(api) {


  if (
    !api?.meanings?.length
  )
    return null;



  let bestMeaning =
    api.meanings[0];



  for (
    const meaning of api.meanings
  ) {


    if (

      meaning.definitions &&

      meaning.definitions.length >

      bestMeaning.definitions.length

    ) {


      bestMeaning = meaning;


    }


  }



  const definition =

    bestMeaning.definitions?.[0]?.definition || "";



  const example =

    bestMeaning.definitions?.[0]?.example || "";



  const pronunciation =

    api.phonetic ||

    api.phonetics?.find(
      p => p.text
    )?.text ||

    "";



  let synonyms = [];


  let antonyms = [];



  if (
    bestMeaning.synonyms
  )
    synonyms.push(
      ...bestMeaning.synonyms
    );



  if (
    bestMeaning.antonyms
  )
    antonyms.push(
      ...bestMeaning.antonyms
    );



  return {


    meaning: definition,


    example,


    pronunciation,


    partOfSpeech:

      bestMeaning.partOfSpeech || "",


    synonyms: uniqueArray(
      synonyms
    ),


    antonyms: uniqueArray(
      antonyms
    )


  };


}
// ============================================
// PART 4
// MAIN PROCESSING ENGINE
// ============================================


function detectCategory(pos) {

  if (!pos)
    return "General";


  switch(pos.toLowerCase()) {

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



// ============================================
// PROCESS SINGLE WORD
// ============================================


async function processWord(item) {


  const data = item.data();


  if (

    data.meaning &&

    data.meaning.trim() !== ""

  ) {


    console.log(
      `⏭ Skip ${data.word}`
    );


    return null;


  }



  console.log(
    `🔎 Processing: ${data.word}`
  );



  const api = await fetchDictionary(
    data.word
  );



  if (!api) {


    console.log(
      `❌ API Failed: ${data.word}`
    );


    saveFailedWord(
      data.word
    );


    return null;


  }



  const result =
    extractMeaning(api);



  if (!result) {


    console.log(
      `❌ No meaning: ${data.word}`
    );


    saveFailedWord(
      data.word
    );


    return null;


  }



  const synonyms =
    await fetchSynonyms(
      data.word
    );



  const antonyms =
    await fetchAntonyms(
      data.word
    );



  result.synonyms =
    uniqueArray([

      ...result.synonyms,

      ...synonyms

    ]);



  result.antonyms =
    uniqueArray([

      ...result.antonyms,

      ...antonyms

    ]);



  return {


    id: item.id,


    data: {


      meaning:
        result.meaning,


      example:
        result.example,


      pronunciation:
        result.pronunciation,


      partOfSpeech:
        result.partOfSpeech,


      synonyms:
        result.synonyms,


      antonyms:
        result.antonyms,


      category:
        detectCategory(
          result.partOfSpeech
        )


    }


  };


}



// ============================================
// BATCH UPDATE FIRESTORE
// ============================================


async function saveBatchUpdates(updates) {


  if (
    updates.length === 0
  )
    return;



  const batch =
    writeBatch(db);



  for (
    const update of updates
  ) {


    batch.update(

      doc(
        db,
        "words",
        update.id
      ),

      update.data

    );


  }



  await batch.commit();


  console.log(
    `💾 Saved ${updates.length} words`
  );


}
// ============================================
// PART 5
// MAIN ENRICHMENT LOOP
// ============================================


async function enrichDictionary() {


  console.log(
    "🚀 Starting WordHub Enrichment V4"
  );


  let lastDoc = null;


  let totalUpdated = 0;


  let batchNumber = 1;



  while (true) {


    console.log("");

    console.log(
      `📦 Loading Batch ${batchNumber}`
    );



    const snapshot =
      await loadWordsBatch(
        lastDoc
      );



    if (
      snapshot.empty
    ) {


      console.log(
        "🎉 No more words found"
      );


      break;


    }



    console.log(
      `📚 Words in batch: ${snapshot.size}`
    );



    const updates = [];



    for (
      const item of snapshot.docs
    ) {


      try {


        const result =
          await processWord(item);



        if (result) {


          updates.push(
            result
          );


        }



        await sleep(
          API_DELAY
        );



      } catch(err) {


        console.log(
          "❌ Error:",
          item.data().word
        );


        console.log(err);


        saveFailedWord(
          item.data().word
        );


      }


    }



    await saveBatchUpdates(
      updates
    );



    totalUpdated +=
      updates.length;



    lastDoc =
      snapshot.docs[
        snapshot.docs.length - 1
      ];



    saveProgress({

      batch:
        batchNumber,


      updated:
        totalUpdated,


      lastWord:

        lastDoc.data().word,


      time:

        new Date().toISOString()


    });



    console.log(
      `✅ Total Updated: ${totalUpdated}`
    );



    batchNumber++;



  }



  console.log("");

  console.log(
    "================================"
  );

  console.log(
    "🎉 ENRICHMENT COMPLETED"
  );

  console.log(
    `✅ Updated: ${totalUpdated}`
  );

  console.log(
    "================================"
  );


}
// ============================================
// PART 6
// RUN ENGINE
// ============================================


enrichDictionary()

.then(() => {


  console.log("");

  console.log(
    "🚀 WordHub Dictionary Enrichment Finished Successfully!"
  );


  process.exit(0);


})


.catch((err) => {


  console.log("");

  console.error(
    "❌ Enrichment Failed"
  );


  console.error(err);


  process.exit(1);


});