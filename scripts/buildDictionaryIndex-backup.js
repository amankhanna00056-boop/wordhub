const fs = require("fs");
const path = require("path");
const readline = require("readline");

const inputFile = path.join(
  __dirname,
  "../data/raw/kaikki-en.jsonl"
);

const outputFile = path.join(
  __dirname,
  "../data/processed/dictionary-index.json"
);


// Create output folder if not exists
const outputDir = path.dirname(outputFile);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}


function createSlug(word) {
  return word
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}


function getDifficulty(word) {
  if (word.length <= 4) return "Easy";
  if (word.length <= 7) return "Medium";
  return "Hard";
}


async function buildIndex() {

  console.log("🚀 WordHub Dictionary Index Builder Started");
  console.log("📚 Reading Kaikki Dataset...");


  const fileStream = fs.createReadStream(inputFile, {
    encoding: "utf8"
  });


  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });


  const dictionary = [];
  const seenWords = new Set();

  let count = 0;
  let skipped = 0;


  for await (const line of rl) {

    if (!line.trim()) continue;


    try {

      const item = JSON.parse(line);


      const word = item.word?.trim();


      if (!word) {
        skipped++;
        continue;
      }


      const cleanWord = word.toLowerCase();


      // Remove duplicates
      if (seenWords.has(cleanWord)) {
        skipped++;
        continue;
      }


      seenWords.add(cleanWord);



      let meaning = "";

      let example = "";

      let synonyms = [];

      let antonyms = [];



      if (Array.isArray(item.senses)) {

        for (const sense of item.senses) {


          if (!meaning && sense.glosses) {

            meaning = sense.glosses[0];

          }


          if (sense.examples) {

            example =
              sense.examples[0]?.text || "";

          }


          if (sense.synonyms) {

            synonyms =
              sense.synonyms
                .map(s => s.word)
                .filter(Boolean);

          }


          if (sense.antonyms) {

            antonyms =
              sense.antonyms
                .map(a => a.word)
                .filter(Boolean);

          }


          if (meaning) break;

        }

      }



      let pronunciation = "";

      if (item.sounds?.length) {

        pronunciation =
          item.sounds[0]?.ipa || "";

      }



      const entry = {

        word: word,

        slug: createSlug(word),

        meaning,

        example,

        category: "General",

        partOfSpeech: item.pos || "",

        pronunciation,

        synonyms,

        antonyms,

        difficulty: getDifficulty(word)

      };


      dictionary.push(entry);

      count++;


      if (count % 10000 === 0) {

        console.log(
          `✅ Processed ${count} words`
        );

      }


    } catch(error) {

      skipped++;

    }

  }



  console.log("");
  console.log("💾 Saving Index...");


  fs.writeFileSync(
    outputFile,
    JSON.stringify(dictionary),
    "utf8"
  );


  console.log("");
  console.log("🎉 Completed!");
  console.log(`📚 Total Words: ${count}`);
  console.log(`⚠️ Skipped: ${skipped}`);
  console.log(
    `📁 Output: ${outputFile}`
  );

}



buildIndex();