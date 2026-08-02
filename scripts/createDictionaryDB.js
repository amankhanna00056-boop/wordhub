const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");


const inputFile = path.join(
  process.cwd(),
  "data",
  "processed",
  "dictionary-index.json"
);


const outputFile = path.join(
  process.cwd(),
  "data",
  "processed",
  "dictionary.db"
);


console.log("📚 Loading dictionary file...");


const data = JSON.parse(
  fs.readFileSync(inputFile, "utf8")
);


console.log(
  `Total words found: ${data.length}`
);


const db = new Database(outputFile);


db.exec(`
CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT UNIQUE,
    slug TEXT,
    meaning TEXT,
    examples TEXT,
    pronunciation TEXT,
    synonyms TEXT,
    antonyms TEXT,
    partOfSpeech TEXT,
    category TEXT,
    difficulty TEXT
);

CREATE INDEX IF NOT EXISTS idx_word 
ON words(word);

CREATE INDEX IF NOT EXISTS idx_slug 
ON words(slug);
`);


const insert = db.prepare(`
INSERT OR REPLACE INTO words
(
word,
slug,
meaning,
examples,
pronunciation,
synonyms,
antonyms,
partOfSpeech,
category,
difficulty
)
VALUES
(
?,
?,
?,
?,
?,
?,
?,
?,
?,
?
)
`);


const insertMany = db.transaction((words)=>{

    for(const item of words){

        insert.run(
            item.word,
            item.slug,
            JSON.stringify(item.meaning || []),
            JSON.stringify(item.examples || []),
            item.pronunciation || "",
            JSON.stringify(item.synonyms || []),
            JSON.stringify(item.antonyms || []),
            JSON.stringify(item.partOfSpeech || []),
            item.category || "",
            item.difficulty || ""
        );

    }

});


console.log("⏳ Importing words...");


insertMany(data);


console.log("✅ Dictionary database created!");

db.close();