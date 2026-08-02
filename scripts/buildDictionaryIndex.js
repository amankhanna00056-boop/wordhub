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


const outputDir = path.dirname(outputFile);


if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, {
    recursive: true
  });
}


function createSlug(word) {

  return word
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

}


function getDifficulty(word){

  const length = word.length;

  if(length <= 4)
    return "Easy";

  if(length <= 7)
    return "Medium";

  return "Hard";

}



async function buildIndex(){


console.log("🚀 WordHub Kaikki Index Builder");
console.log("📚 Loading dataset...");


const stream = fs.createReadStream(
  inputFile,
  {
    encoding:"utf8"
  }
);


const rl = readline.createInterface({
  input:stream,
  crlfDelay:Infinity
});



const dictionary = {};

let processed = 0;
let skipped = 0;



for await (const line of rl){


if(!line.trim())
continue;



try{


const item = JSON.parse(line);


const word =
item.word?.trim();



if(!word){

 skipped++;
 continue;

}



const key =
word.toLowerCase();



if(!dictionary[key]){


dictionary[key]={

word,

slug:createSlug(word),

meaning:[],

examples:[],

pronunciation:"",

synonyms:[],

antonyms:[],

partOfSpeech:[],

category:"General",

difficulty:getDifficulty(word)

};


}



const entry =
dictionary[key];



// Part of speech

if(item.pos){

if(!entry.partOfSpeech.includes(item.pos))
entry.partOfSpeech.push(item.pos);

}



// Pronunciation

if(
!entry.pronunciation &&
item.sounds?.length
){

entry.pronunciation =
item.sounds[0]?.ipa || "";

}



// Senses

if(Array.isArray(item.senses)){


for(const sense of item.senses){



if(sense.glosses){

sense.glosses.forEach(g=>{

if(!entry.meaning.includes(g))
entry.meaning.push(g);

});

}



if(sense.examples){


sense.examples.forEach(ex=>{

if(ex.text &&
!entry.examples.includes(ex.text))
entry.examples.push(ex.text);

});


}



if(sense.synonyms){


sense.synonyms.forEach(s=>{


if(
s.word &&
!entry.synonyms.includes(s.word)
){

entry.synonyms.push(s.word);

}


});


}



if(sense.antonyms){


sense.antonyms.forEach(a=>{


if(
a.word &&
!entry.antonyms.includes(a.word)
){

entry.antonyms.push(a.word);

}


});


}



}



}



processed++;



if(processed % 10000 === 0){

console.log(
`✅ Processed ${processed} entries`
);

}



}
catch(error){

skipped++;

}



}



console.log("💾 Saving dictionary index...");



fs.writeFileSync(

outputFile,

JSON.stringify(
Object.values(dictionary)
),

"utf8"

);



console.log("");
console.log("🎉 Completed!");
console.log(
"📚 Total Words:",
Object.keys(dictionary).length
);

console.log(
"⚠️ Skipped:",
skipped
);

console.log(
"📁 Saved:",
outputFile
);


}



buildIndex();