const fs = require("fs");
const path = require("path");

const inputFile = path.join(__dirname, "../words_alpha.txt");
const outputFile = path.join(__dirname, "../public/dictionary.json");

const words = fs
  .readFileSync(inputFile, "utf8")
  .split("\n")
  .map((w) => w.trim())
  .filter(Boolean)
  .slice(0, 10000);

function createSlug(word) {
  return word
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

const dictionary = words.map((word) => ({
  word,
  slug: createSlug(word),
  meaning: "",
  example: "",
  category: "General",
  partOfSpeech: "",
  pronunciation: "",
  synonyms: [],
  antonyms: [],
  difficulty:
    word.length <= 4
      ? "Easy"
      : word.length <= 7
      ? "Medium"
      : "Hard",
}));

fs.writeFileSync(
  outputFile,
  JSON.stringify(dictionary, null, 2),
  "utf8"
);

console.log(`✅ Generated ${dictionary.length} words.`);