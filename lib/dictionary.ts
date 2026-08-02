import Database from "better-sqlite3";
import path from "path";


let db: Database.Database | null = null;


function getDatabase() {

  if (db) {
    return db;
  }


  const dbPath = path.join(
    process.cwd(),
    "data",
    "processed",
    "dictionary.db"
  );


  db = new Database(dbPath, {
    readonly: true,
  });


  console.log("✅ SQLite Dictionary Connected");


  return db;
}



export function findWord(word: string) {

  const database = getDatabase();


  const query = database.prepare(`
    SELECT *
    FROM words
    WHERE word = ?
       OR slug = ?
    LIMIT 1
  `);


  const result = query.get(
    word.toLowerCase(),
    word.toLowerCase()
  );


  if (!result) {
    return null;
  }


  return {
    ...result,
    meaning: JSON.parse(result.meaning),
    examples: JSON.parse(result.examples),
    synonyms: JSON.parse(result.synonyms),
    antonyms: JSON.parse(result.antonyms),
    partOfSpeech: JSON.parse(result.partOfSpeech),
  };

}