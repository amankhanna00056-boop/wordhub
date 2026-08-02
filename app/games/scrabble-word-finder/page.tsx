"use client";

import { useState } from "react";

const letterValues: Record<string, number> = {
  a: 1,
  b: 3,
  c: 3,
  d: 2,
  e: 1,
  f: 4,
  g: 2,
  h: 4,
  i: 1,
  j: 8,
  k: 5,
  l: 1,
  m: 3,
  n: 1,
  o: 1,
  p: 3,
  q: 10,
  r: 1,
  s: 1,
  t: 1,
  u: 1,
  v: 4,
  w: 4,
  x: 8,
  y: 4,
  z: 10,
};


function calculateScore(word: string) {
  return word
    .toLowerCase()
    .split("")
    .reduce(
      (score, letter) =>
        score + (letterValues[letter] || 0),
      0
    );
}


function canBuildWord(
  word: string,
  letters: string
) {

  const availableLetters =
    letters.toLowerCase().split("");

  for (const letter of word) {

    const index =
      availableLetters.indexOf(letter);

    if (index === -1) {
      return false;
    }

    availableLetters.splice(index, 1);
  }

  return true;
}



export default function ScrabbleWordFinder() {

  const [letters, setLetters] =
    useState("");

  const [words, setWords] =
    useState<string[]>([]);


  // Temporary dictionary
  // Next step: connect WordHub dictionary-index.json
  const dictionary = [
    "apple",
    "apply",
    "ape",
    "peal",
    "plea",
    "leap",
    "pal",
    "sale",
    "seal",
    "laser",
    "learn",
    "near",
    "earn",
    "heart",
    "earth",
    "rate",
    "tear",
    "team",
    "meat",
  ];



  function searchWords() {

    if (!letters.trim()) {
      setWords([]);
      return;
    }


    const result =
      dictionary
        .filter(word =>
          canBuildWord(word, letters)
        )
        .sort(
          (a,b)=>
            calculateScore(b)
            -
            calculateScore(a)
        );


    setWords(result);

  }



  return (

    <main className="
    min-h-screen
    bg-gray-100
    p-5
    ">


      <div className="
      max-w-4xl
      mx-auto
      bg-white
      rounded-xl
      shadow-lg
      p-6
      ">


        <h1 className="
        text-3xl
        font-bold
        mb-3
        ">
          🧩 Scrabble Word Finder
        </h1>


        <p className="
        text-gray-600
        mb-6
        ">
          Enter your Scrabble letters and find possible words.
        </p>



        <input

          value={letters}

          onChange={(e)=>
            setLetters(e.target.value)
          }

          placeholder="Example: AEPLP"

          className="
          w-full
          border
          rounded-lg
          p-3
          mb-4
          uppercase
          "

        />



        <button

          onClick={searchWords}

          className="
          bg-blue-600
          text-white
          px-6
          py-3
          rounded-lg
          hover:bg-blue-700
          "

        >
          Find Words
        </button>



        <div className="
        mt-8
        ">


          <h2 className="
          text-xl
          font-bold
          mb-4
          ">
            Found Words: {words.length}
          </h2>



          <div className="
          grid
          grid-cols-2
          md:grid-cols-4
          gap-3
          ">


          {
            words.map(word => (

              <div
              key={word}
              className="
              border
              rounded-lg
              p-3
              flex
              justify-between
              "
              >

                <span className="font-bold">
                  {word.toUpperCase()}
                </span>


                <span className="
                text-green-600
                font-bold
                ">
                  {calculateScore(word)}
                </span>


              </div>

            ))
          }


          </div>


        </div>


      </div>


    </main>

  );

}